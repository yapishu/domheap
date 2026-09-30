import { cookie } from "./fixtures.mjs";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const publisher = "http://localhost:8082",
  reader = "http://localhost:8081";
const readerAuth = await cookie("/tmp/domheap-nec.cookies");
let browserCookie = "";
function saveCookie(response) {
  const values = response.headers.getSetCookie?.() ?? [];
  for (const value of values) {
    const pair = value.split(";")[0];
    const name = pair.split("=")[0];
    browserCookie = browserCookie
      .split("; ")
      .filter((p) => p && !p.startsWith(name + "="))
      .concat(pair)
      .join("; ");
  }
}
const start = await fetch(publisher + "/~/login", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    name: "~nec",
    eauth: "",
    redirect: "/apps/domheap/subscribe?ship=~nec",
  }),
  redirect: "manual",
  signal: AbortSignal.timeout(55000),
});
assert.equal(start.status, 303);
saveCookie(start);
const authorization = new URL(start.headers.get("location"));
assert.equal(authorization.origin, reader);
const nonce = authorization.searchParams.get("nonce");
const approve = await fetch(reader + "/~/eauth", {
  method: "POST",
  headers: {
    cookie: readerAuth,
    "content-type": "application/x-www-form-urlencoded",
  },
  body: new URLSearchParams({ server: "~bud", nonce, grant: "grant" }),
  redirect: "manual",
  signal: AbortSignal.timeout(55000),
});
assert.equal(approve.status, 303);
const finish = await fetch(approve.headers.get("location"), {
  headers: { cookie: browserCookie },
  redirect: "manual",
  signal: AbortSignal.timeout(55000),
});
saveCookie(finish);
assert.ok([302, 303, 307].includes(finish.status));
const session = await (
  await fetch(publisher + "/apps/domheap/api/session", {
    headers: { cookie: browserCookie },
  })
).json();
assert.equal(session.viewer, "~nec");
assert.equal(session.owner, false);
await writeFile("/tmp/domheap-bud-eauth.cookie", browserCookie, {
  mode: 0o600,
});
console.log(
  "Eyre eauth authenticates the remote ship as ~nec on the publisher.",
);
