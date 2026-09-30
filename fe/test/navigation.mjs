import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { cookie } from "./fixtures.mjs";

const origin = process.env.DOMHEAP_ORIGIN || "http://localhost:8080";
const browser = await chromium.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox"],
});
const context = await browser.newContext();
await context.addCookies(
  (await cookie(process.env.DOMHEAP_OWNER_COOKIES)).split("; ").map((s) => {
    const i = s.indexOf("=");
    return { name: s.slice(0, i), value: s.slice(i + 1), url: origin };
  }),
);
let streams = 0;
context.on("request", (request) => {
  if (request.method() === "GET" && request.url().includes("/~/channel/"))
    streams++;
});
const nav = (page, label) =>
  page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: label, exact: true });
try {
  const pages = [];
  for (let i = 0; i < 8; i++) {
    const page = await context.newPage();
    await page.goto(`${origin}/apps/domheap/`);
    await page
      .getByRole("heading", { name: "Reading room", exact: true })
      .waitFor();
    pages.push(page);
  }
  const page = pages[1];
  for (const [label, heading] of [
    ["Publication", "Latest writing"],
    ["About", "About this publication"],
    ["Settings", "Your publication"],
    ["Reading room", "Reading room"],
  ]) {
    await nav(page, label).click();
    await page
      .getByRole("heading", { name: heading, exact: true })
      .waitFor({ timeout: 5000 });
  }
  assert.equal(streams, 1, "Tabs open separate live-update streams");
  assert.doesNotMatch(
    await page.locator("body").innerText(),
    /A place of your own|Make room for good writing/,
  );

  const successor = context.waitForEvent("request", {
    predicate: (r) => r.method() === "GET" && r.url().includes("/~/channel/"),
    timeout: 5000,
  });
  await pages[0].close();
  await successor;
  assert.equal(streams, 2, "Another tab does not take over the stream");
  await nav(page, "About").click();
  await page.getByRole("heading", { name: "About this publication" }).waitFor();
  await page.goBack();
  await page
    .getByRole("heading", { name: "Reading room", exact: true })
    .waitFor();

  await page.clock.install();
  let release;
  const pending = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/api/session", async (route) => {
    await pending;
    await route.continue().catch(() => {});
  });
  await nav(page, "About").click();
  await page.getByRole("status").filter({ hasText: "Loading…" }).waitFor();
  // A background event cannot supersede foreground navigation.
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
  await page.clock.fastForward(15001);
  await page
    .getByRole("alert")
    .filter({ hasText: "The ship did not respond" })
    .waitFor();
  release();
  await page.unrouteAll({ behavior: "wait" });
  await page.getByRole("button", { name: "Try again" }).click();
  await page.getByRole("heading", { name: "About this publication" }).waitFor();
  console.log(
    "Eight-tab navigation, one shared stream, stream handoff, back navigation, loading, timeout, and retry pass.",
  );
} finally {
  await browser.close();
}
