import test from "node:test";
import assert from "node:assert/strict";
import { cookie } from "./fixtures.mjs";
const origin = process.env.DOMHEAP_ORIGIN || "http://localhost:8080";
const ownerJar = process.env.DOMHEAP_OWNER_COOKIES;
const guestJar = process.env.DOMHEAP_GUEST_COOKIES;
const postId = process.env.DOMHEAP_TEST_POST;
const sentinel = process.env.DOMHEAP_TEST_SECRET;
test(
  "live HTTP paywall, grants, revocation and author boundary",
  { skip: !(ownerJar && guestJar && postId && sentinel) },
  async () => {
    const owner = await cookie(ownerJar),
      guest = await cookie(guestJar);
    async function req(path, auth, data) {
      const r = await fetch(`${origin}/apps/domheap/api/${path}`, {
        method: data ? "POST" : "GET",
        headers: {
          cookie: auth,
          "content-type": "application/json",
          "x-domheap": "1",
        },
        body: data ? JSON.stringify(data) : undefined,
      });
      return { r, data: await r.json() };
    }
    const { data: viewer } = await req("session", guest);
    assert.equal(viewer.owner, false);
    let response = await req(`posts/${postId}`, guest);
    assert.equal(response.r.status, 200);
    assert.equal(response.r.headers.get("cache-control"), "no-store");
    assert.equal(response.data.locked, true);
    assert.ok(!JSON.stringify(response.data).includes(sentinel));
    assert.ok(
      !JSON.stringify((await req("posts", owner)).data).includes(sentinel),
    );
    assert.ok(
      JSON.stringify((await req(`posts/${postId}`, owner)).data).includes(
        sentinel,
      ),
    );
    assert.equal((await req("author", guest)).r.status, 403);
    assert.equal(
      (
        await req("action", guest, {
          op: "grant",
          ship: viewer.viewer,
          days: 0,
        })
      ).r.status,
      403,
    );
    const body = { op: "grant", ship: viewer.viewer, days: 0 };
    assert.equal((await req("action", owner, body)).r.status, 200);
    try {
      response = await req(`posts/${postId}`, guest);
      assert.equal(response.data.locked, false);
      assert.ok(response.data.body.includes(sentinel));
    } finally {
      assert.equal(
        (await req("action", owner, { op: "revoke", ship: viewer.viewer })).r
          .status,
        200,
      );
    }
    response = await req(`posts/${postId}`, guest);
    assert.equal(response.data.locked, true);
    assert.ok(!response.data.body.includes(sentinel));
    const csrf = await fetch(`${origin}/apps/domheap/api/action`, {
      method: "POST",
      headers: { cookie: owner, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    assert.equal(csrf.status, 403);
  },
);
