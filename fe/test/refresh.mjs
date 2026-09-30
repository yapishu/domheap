import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1600 },
  });
  await page.goto("http://localhost:8080/apps/domheap/about");
  await page.getByRole("heading", { name: "About this publication" }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    window.domheapFrame = document.querySelector(".app-frame");
  });
  const response = page.waitForResponse((r) =>
    r.url().endsWith("/api/publication"),
  );
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
  await response;
  await page.waitForTimeout(300);
  assert.equal(
    await page.evaluate(
      () => window.domheapFrame === document.querySelector(".app-frame"),
    ),
    true,
    "An unchanged background check replaces the page",
  );
  await page.getByLabel("Color theme").selectOption("dark");
  const colors = await page.evaluate(() => ({
    html: getComputedStyle(document.documentElement).backgroundColor,
    body: getComputedStyle(document.body).backgroundColor,
    height: document.body.getBoundingClientRect().height,
    viewport: innerHeight,
  }));
  assert.equal(colors.html, colors.body);
  assert.ok(colors.height >= colors.viewport);
  assert.equal(colors.body, "rgb(29, 30, 32)");
  console.log(
    "Unchanged refresh preserves DOM; full viewport uses charcoal background.",
  );
} finally {
  await browser.close();
}
