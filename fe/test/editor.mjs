import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { cookie } from "./fixtures.mjs";
const origin = process.env.DOMHEAP_ORIGIN || "http://localhost:8080";
const auth = await cookie(process.env.DOMHEAP_OWNER_COOKIES);
const browser = await chromium.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox"],
});
const context = await browser.newContext();
await context.addCookies(
  auth.split("; ").map((s) => {
    const i = s.indexOf("=");
    return { name: s.slice(0, i), value: s.slice(i + 1), url: origin };
  }),
);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const title = `Editor verification ${Date.now()}`;
let noteId;
const author = await (
  await fetch(`${origin}/apps/domheap/api/author`, {
    headers: { cookie: auth },
  })
).json();
const nb = author.notebooks.find((n) => n.name === author.notebook);
const notes = `${origin}/notes/~/v1/notebooks/${nb.host}/${nb.name}/notes`;
async function write(path, data, method = "PUT") {
  return (
    await fetch(path, {
      method,
      headers: { cookie: auth, "content-type": "application/json" },
      body: JSON.stringify(data),
    })
  ).json();
}
try {
  await page.goto(`${origin}/apps/domheap/author/write`);
  await page.getByLabel("Title", { exact: true }).fill(title);
  await page
    .getByLabel("Post Markdown")
    .fill("A **public** opening.\n\n<<<paywall>>>\n\nEditor private marker.");
  await page.getByLabel("Editor mode").selectOption("rich");
  await page.locator("[data-paywall]").waitFor();
  await page.getByLabel("Editor mode").selectOption("source");
  assert.ok(
    (await page.getByLabel("Post Markdown").inputValue()).includes(
      "<<<paywall>>>",
    ),
  );
  await page.getByRole("button", { name: "Publish post" }).click();
  await page.getByRole("heading", { name: "Writing", exact: true }).waitFor();
  const index = await (
    await fetch(`${origin}/apps/domheap/api/posts`, {
      headers: { cookie: auth },
    })
  ).json();
  noteId = index.posts.find((p) => p.title === title).id;
  const publicPost = await (
    await fetch(`${origin}/apps/domheap/api/posts/${noteId}`)
  ).json();
  assert.equal(publicPost.locked, true);
  assert.ok(!publicPost.body.includes("Editor private marker"));
  await page.goto(`${origin}/apps/domheap/author/write/${noteId}`);
  await page.getByLabel("Post Markdown").waitFor();
  const original = await (
    await fetch(`${notes}/${noteId}`, { headers: { cookie: auth } })
  ).json();
  await write(`${notes}/${noteId}`, {
    body: "A concurrent Notes edit.",
    expectedRevision: original.revision,
  });
  await page
    .getByLabel("Post Markdown")
    .fill("This stale draft must not overwrite the notebook.");
  await page.getByRole("button", { name: "Publish post" }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "changed in Notes" })
    .waitFor();
  assert.equal(
    (
      await (
        await fetch(`${notes}/${noteId}`, { headers: { cookie: auth } })
      ).json()
    ).bodyMd,
    "A concurrent Notes edit.",
  );
  assert.deepEqual(errors, []);
  console.log(
    "Rich-text paywall roundtrip, publishing, public preview, and edit conflict handling pass.",
  );
} finally {
  if (noteId) await write(`${notes}/${noteId}`, {}, "DELETE");
  await context.close();
  await browser.close();
}
