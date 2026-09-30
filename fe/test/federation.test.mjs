import test from "node:test";
import assert from "node:assert/strict";
import { cookie } from "./fixtures.mjs";
const pub = process.env.DOMHEAP_PUBLISHER_ORIGIN,
  reader = process.env.DOMHEAP_READER_ORIGIN;
test(
  "Ames reading applies publisher grants and revocation",
  { skip: !(pub && reader), timeout: 120000 },
  async () => {
    const author = await cookie(process.env.DOMHEAP_PUBLISHER_COOKIES),
      subscriber = await cookie(process.env.DOMHEAP_READER_COOKIES),
      id = process.env.DOMHEAP_TEST_POST,
      secret = process.env.DOMHEAP_TEST_SECRET;
    async function request(origin, auth, path, data) {
      const r = await fetch(`${origin}/apps/domheap/api/${path}`, {
        method: data ? "POST" : "GET",
        headers: {
          cookie: auth,
          "x-domheap": "1",
          "content-type": "application/json",
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: AbortSignal.timeout(35000),
      });
      const body = await r.json();
      assert.equal(r.status, 200, JSON.stringify(body));
      return body;
    }
    const host = (await request(pub, author, "session")).host,
      who = (await request(reader, subscriber, "session")).host;
    await request(reader, subscriber, "action", { op: "follow", ship: host });
    try {
      let p = await request(reader, subscriber, `remote/${host}/posts/${id}`);
      assert.equal(p.locked, true);
      assert.ok(!p.body.includes(secret));
      await request(pub, author, "action", { op: "grant", ship: who, days: 0 });
      p = await request(reader, subscriber, `remote/${host}/posts/${id}`);
      assert.equal(p.locked, false);
      assert.ok(p.body.includes(secret));
      await request(pub, author, "action", { op: "revoke", ship: who });
      p = await request(reader, subscriber, `remote/${host}/posts/${id}`);
      assert.equal(p.locked, true);
      assert.ok(!p.body.includes(secret));
    } finally {
      await request(pub, author, "action", { op: "revoke", ship: who });
      await request(reader, subscriber, "action", {
        op: "unfollow",
        ship: host,
      });
    }
  },
);
