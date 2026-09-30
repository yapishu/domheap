import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { cookie } from "./fixtures.mjs";
const origin = process.env.DOMHEAP_ORIGIN || "http://localhost:8080",
  auth = await cookie(process.env.DOMHEAP_OWNER_COOKIES);
const a = await (
  await fetch(origin + "/apps/domheap/api/author", {
    headers: { cookie: auth },
  })
).json();
const browser = await chromium.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
await context.addCookies(
  auth.split("; ").map((c) => {
    const i = c.indexOf("=");
    return { name: c.slice(0, i), value: c.slice(i + 1), url: origin };
  }),
);
const page = await context.newPage();
try {
  await page.goto(origin + "/apps/domheap/");
  await page
    .getByRole("heading", { name: "Reading room", exact: true })
    .waitFor();
  assert.equal(
    await page.getByRole("link", { name: "Settings", exact: true }).count(),
    1,
  );
  await page.screenshot({
    path: "../.impeccable/review/reading-room.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page.getByRole("link", { name: "Payments", exact: true }).click();
  await page.getByRole("heading", { name: "Paid subscriptions" }).waitFor();
  assert.equal(
    await page.getByLabel("$ / month", { exact: true }).inputValue(),
    "5",
  );
  await page.getByLabel("$ / month", { exact: true }).fill("10");
  assert.equal(
    await page.getByLabel("$ / year", { exact: true }).inputValue(),
    "120",
  );
  assert.equal(
    await page.getByLabel("$ / week", { exact: true }).inputValue(),
    "2.31",
  );
  await page.getByLabel("$ / week", { exact: true }).fill("3");
  await page.getByLabel("$ / month", { exact: true }).fill("20");
  assert.equal(
    await page.getByLabel("$ / week", { exact: true }).inputValue(),
    "3",
  );
  assert.equal(
    await page.getByLabel("$ / year", { exact: true }).inputValue(),
    "240",
  );
  await page.getByLabel("Accept paid subscriptions").uncheck();
  const saved = page.waitForResponse((r) => r.url().endsWith("/api/author"));
  await page
    .getByRole("button", { name: "Save payments", exact: true })
    .click();
  await saved;
  const changed = await (
    await fetch(origin + "/apps/domheap/api/author", {
      headers: { cookie: auth },
    })
  ).json();
  assert.equal(changed.plan.enabled, false);
  assert.equal(changed.plan.prices.month, "20000000");
  assert.equal(changed.plan.prices.week, "3000000");
  console.log(
    "Reading room default, Settings label, prorating, overrides, and disabled-price persistence pass.",
  );
} finally {
  if (a.plan)
    await fetch(origin + "/apps/domheap/api/action", {
      method: "POST",
      headers: {
        cookie: auth,
        "x-domheap": "1",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        op: "payments",
        enabled: a.plan.enabled,
        facilitator: a.facilitator,
        origin: a.origin,
        decimals: a.plan.decimals,
        prices: a.plan.prices,
        requirements: a.plan.requirements,
      }),
    });
  await page.goto(origin + "/apps/domheap/author/payments");
  await page.getByRole("heading", { name: "Paid subscriptions" }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: "../.impeccable/review/payments.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel("Color theme").selectOption("dark");
  await page.screenshot({
    path: "../.impeccable/review/payments-mobile-night.png",
    fullPage: true,
  });
  await browser.close();
}
