import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { cookie } from "./fixtures.mjs";
import assert from "node:assert/strict";
const origin = process.env.DOMHEAP_ORIGIN || "http://localhost:8080";
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox"],
});
const errors = [];
await mkdir("../.impeccable/review", { recursive: true });
async function surface(
  name,
  width,
  height,
  route,
  theme = "light",
  owner = false,
) {
  const context = await browser.newContext({
    viewport: { width, height },
    colorScheme: theme,
  });
  if (owner) {
    const cookies = (await cookie(process.env.DOMHEAP_OWNER_COOKIES))
      .split("; ")
      .map((c) => {
        const at = c.indexOf("=");
        return { name: c.slice(0, at), value: c.slice(at + 1), url: origin };
      });
    await context.addCookies(cookies);
  }
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(`${name}: ${e.message}`));
  page.on("response", (r) => {
    if (r.status() >= 400 && r.url().startsWith(origin + "/apps/domheap"))
      errors.push(`${name}: ${r.status()} ${r.url()}`);
  });
  await page.goto(`${origin}/apps/domheap/${route}`);
  await page.locator("main h1").waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  assert.equal(overflow, false, `${name} overflows`);
  if (route === "post/211") {
    assert.ok(await page.locator('[data-renderer="pretext"]').count());
    assert.ok(
      !(await page.textContent("main")).includes("PRIVATE-CONTENT-SENTINEL"),
    );
    await page
      .getByRole("link", { name: "Subscribe", exact: true })
      .last()
      .click();
    await page
      .getByRole("heading", { name: "Subscribe", exact: true })
      .waitFor();
    await page.goBack();
    await page.locator(".paywall").waitFor();
  }
  await page.screenshot({
    path: `../.impeccable/review/${name}.png`,
    fullPage: true,
  });
  await context.close();
}
try {
  await surface("desktop", 1440, 1000, "");
  await surface("mobile", 390, 844, "");
  await surface("article", 1440, 1100, "post/211");
  await surface("article-mobile-night", 390, 844, "post/211", "dark");
  await surface("author", 1440, 1100, "author/publication", "light", true);
  assert.deepEqual(errors, []);
  console.log(
    "Desktop, mobile, night, Pretext, navigation, and author surfaces pass.",
  );
} finally {
  await browser.close();
}
