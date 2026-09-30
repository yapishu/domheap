import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { cookie } from "./fixtures.mjs";
const ownerJar = process.env.DOMHEAP_OWNER_COOKIES,
  guestJar = process.env.DOMHEAP_GUEST_COOKIES;
const origin = process.env.DOMHEAP_ORIGIN || "http://localhost:8080";
// This facilitator exercises HTTP state transitions, never a chain or real funds.
test(
  "x402 settlement, replay protection, failed verification and reconciliation",
  {
    skip: process.env.DOMHEAP_TEST_PAYMENTS !== "1" || !ownerJar || !guestJar,
    timeout: 120000,
  },
  async () => {
    const owner = await cookie(ownerJar),
      guest = await cookie(guestJar);
    let mode = "success",
      verified = 0,
      settled = 0;
    const address = "0x" + "11".repeat(20),
      payer = "0x" + "22".repeat(20),
      asset = "0x" + "33".repeat(20);
    const txSeed = BigInt(Date.now()) << 32n;
    const tx = (n) =>
      "0x" + (txSeed + BigInt(n)).toString(16).padStart(64, "0");
    const server = createServer(async (req, res) => {
      let text = "";
      for await (const b of req) text += b;
      const body = JSON.parse(text);
      assert.equal(body.x402Version, 2);
      assert.equal(body.paymentRequirements.amount, "1000000");
      res.setHeader("content-type", "application/json");
      if (req.url === "/verify") {
        verified++;
        res.end(
          JSON.stringify({
            isValid: mode !== "reject",
            payer,
            ...(mode === "reject"
              ? { invalidReason: "invalid_exact_evm_payload_signature" }
              : {}),
          }),
        );
      } else if (req.url === "/settle") {
        settled++;
        res.end(
          JSON.stringify({
            success: mode !== "pending",
            transaction: tx(settled),
            network: "eip155:84532",
            payer,
            ...(mode === "pending"
              ? { errorReason: "settlement_pending" }
              : {}),
          }),
        );
      } else {
        res.statusCode = 404;
        res.end("{}");
      }
    });
    await new Promise((resolve) => server.listen(4020, "127.0.0.1", resolve));
    async function call(path, auth, data, headers = {}) {
      const r = await fetch(`${origin}/apps/domheap/api/${path}`, {
        method: data === undefined ? "GET" : "POST",
        headers: {
          cookie: auth,
          "content-type": "application/json",
          "x-domheap": "1",
          ...headers,
        },
        body: data === undefined ? undefined : JSON.stringify(data),
        signal: AbortSignal.timeout(30000),
      });
      return { status: r.status, headers: r.headers, body: await r.json() };
    }
    const original = (await call("author", owner)).body;
    const ship = (await call("session", guest)).body.viewer;
    const requirements = {
      scheme: "exact",
      network: "eip155:84532",
      amount: "1000000",
      asset,
      payTo: address,
      maxTimeoutSeconds: 300,
      extra: { name: "Test Token", version: "1" },
    };
    async function offer() {
      const response = await call("quote", guest, { ship, period: "month" });
      assert.equal(response.status, 201, JSON.stringify(response.body));
      return response.body;
    }
    function signature(q) {
      const required = q.paymentRequired,
        info = required.extensions["domheap-subscription"].info;
      return {
        x402Version: 2,
        resource: required.resource,
        accepted: required.accepts[0],
        extensions: required.extensions,
        payload: {
          signature: "0x" + "44".repeat(65),
          authorization: {
            from: payer,
            to: address,
            value: "1000000",
            validAfter: "0",
            validBefore: info.validBefore,
            nonce: info.nonce,
          },
        },
      };
    }
    const send = (q, payload) =>
      call(
        `subscribe/${q.id}`,
        guest,
        {},
        {
          "payment-signature": Buffer.from(JSON.stringify(payload)).toString(
            "base64",
          ),
        },
      );
    try {
      assert.equal(
        (
          await call("action", owner, {
            op: "payments",
            enabled: true,
            facilitator: "http://127.0.0.1:4020",
            origin,
            decimals: 6,
            prices: {
              day: "33000",
              week: "230000",
              month: "1000000",
              year: "12000000",
            },
            requirements,
          })
        ).status,
        200,
      );
      let q = await offer();
      let r = await call(`subscribe/${q.id}`, guest, {});
      assert.equal(r.status, 402);
      assert.equal(
        JSON.parse(Buffer.from(r.headers.get("payment-required"), "base64"))
          .x402Version,
        2,
      );
      const payload = signature(q);
      r = await send(q, {
        ...payload,
        accepted: { ...payload.accepted, amount: "1" },
      });
      assert.equal(r.status, 400);
      assert.equal(verified, 0);
      r = await send(q, {
        ...payload,
        payload: {
          ...payload.payload,
          authorization: {
            ...payload.payload.authorization,
            nonce: "0x" + "00".repeat(32),
          },
        },
      });
      assert.equal(r.status, 400);
      assert.equal(verified, 0);
      r = await send(q, payload);
      assert.equal(r.status, 200, JSON.stringify(r.body));
      assert.equal(r.body.phase, "paid");
      assert.equal(r.body.subscribed, true);
      assert.equal(settled, 1);
      assert.ok(r.headers.get("payment-response"));
      r = await send(q, payload);
      assert.equal(r.status, 200);
      assert.equal(settled, 1);
      assert.equal(
        (
          await call(
            `subscribe/${q.id}`,
            owner,
            {},
            {
              "payment-signature": Buffer.from(
                JSON.stringify(payload),
              ).toString("base64"),
            },
          )
        ).status,
        403,
      );
      await call("action", owner, { op: "revoke", ship });
      mode = "reject";
      q = await offer();
      r = await send(q, signature(q));
      assert.equal(r.status, 502);
      assert.equal(settled, 1);
      assert.equal((await call(`payment/${q.id}`, guest)).body.phase, "failed");
      assert.equal((await call("session", guest)).body.subscribed, false);
      mode = "pending";
      q = await offer();
      r = await send(q, signature(q));
      assert.equal(r.status, 502);
      assert.equal(
        (await call(`payment/${q.id}`, guest)).body.phase,
        "settling",
      );
      assert.equal(
        (await call("quote", guest, { ship, period: "month" })).status,
        409,
      );
      r = await send(q, signature(q));
      assert.equal(r.status, 202);
      assert.equal(settled, 2);
      r = await call("action", owner, {
        op: "reconcile",
        id: q.id,
        transaction: tx(2),
      });
      assert.equal(r.status, 200, JSON.stringify(r.body));
      assert.equal((await call(`payment/${q.id}`, guest)).body.phase, "paid");
      assert.equal((await call("session", guest)).body.subscribed, true);
      assert.equal(settled, 2);
      // A paid transfer cannot shorten an existing permanent grant.
      await call("action", owner, { op: "grant", ship, days: 0 });
      mode = "success";
      q = await offer();
      r = await send(q, signature(q));
      assert.equal(r.status, 200);
      assert.equal(
        (await call("author", owner)).body.members.find((m) => m.ship === ship)
          .expiresAt,
        null,
      );
    } finally {
      await call("action", owner, { op: "revoke", ship });
      await call(
        "action",
        owner,
        original.plan
          ? {
              op: "payments",
              enabled: original.plan.enabled,
              facilitator: original.facilitator,
              origin: original.origin,
              decimals: original.plan.decimals,
              prices: original.plan.prices,
              requirements: original.plan.requirements,
            }
          : {
              op: "payments",
              enabled: false,
              facilitator: "",
              origin: "",
              decimals: 6,
              prices: {
                day: "160000",
                week: "1150000",
                month: "5000000",
                year: "60000000",
              },
              requirements: {
                ...requirements,
                amount: "5000000",
                asset: "",
                payTo: "",
                network: "",
                extra: { name: "USDC", version: "2" },
              },
            },
      );
      await new Promise((resolve) => server.close(resolve));
    }
  },
);
