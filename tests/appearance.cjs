const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { default: AxeBuilder } = require("@axe-core/playwright");
const { createServer } = require("../scripts/serve.cjs");
(async () => {
  const server = createServer();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const executablePath =
    process.env.CHROME_PATH ||
    [
      "C:/Program Files/Google/Chrome/Application/chrome.exe",
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    ].find(fs.existsSync);
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      ...(executablePath ? { executablePath } : {}),
    });
    const context = await browser.newContext({
      viewport: { width: 1200, height: 900 },
      colorScheme: "light",
    });
    const page = await context.newPage(),
      errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("https://www.gstatic.com/firebasejs/**", (route) =>
      route.abort(),
    );
    const url = "http://127.0.0.1:" + server.address().port;
    const out = process.env.SCREENSHOT_DIR;
    if (out) fs.mkdirSync(out, { recursive: true });
    await page.goto(url, { waitUntil: "domcontentloaded" });
    assert.equal(
      await page.locator("#intro-screen").evaluate((e) => e.open),
      true,
    );
    assert.equal(
      await page
        .locator("#intro-skip")
        .evaluate((e) => e === document.activeElement),
      true,
    );
    if (out)
      await page.screenshot({
        path: path.join(out, "camera-intro.jpg"),
        quality: 60,
      });
    await page.waitForFunction(
      () => document.documentElement.dataset.intro === "complete",
    );
    const elapsed = await page.evaluate(
      () =>
        performance.now() -
        performance.getEntriesByType("navigation")[0].domContentLoadedEventEnd,
    );
    assert.ok(elapsed >= 3300 && elapsed < 5000, "Intro duration: " + elapsed);
    assert.equal(await page.evaluate(() => document.body.style.overflow), "");
    assert.equal(
      await page.locator("html").getAttribute("data-theme"),
      "light",
    );
    assert.equal(
      await page.locator("#brand-mark img").evaluate((e) => e.naturalWidth > 0),
      true,
    );

    for (const theme of ["light", "dark"]) {
      if ((await page.locator("html").getAttribute("data-theme")) !== theme)
        await page.locator("#theme-toggle").click();
      assert.equal(
        await page.locator("html").getAttribute("data-theme"),
        theme,
      );
      assert.equal(
        await page.evaluate(() => localStorage.getItem("sr_theme")),
        theme === "light" ? null : "dark",
      );
      await page.emulateMedia({ reducedMotion: "reduce" });
      for (const width of [320, 390, 768, 1024, 1200, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
          theme + " overflow at " + width,
        );
      }
      await page.setViewportSize({ width: 1200, height: 900 });
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      assert.deepEqual(
        result.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            reason: n.failureSummary,
          })),
        })),
        [],
        theme + " accessibility",
      );
      if (out) {
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({
          path: path.join(out, theme + "-mode.jpg"),
          quality: 55,
        });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({
          path: path.join(out, theme + "-mobile.jpg"),
          quality: 55,
        });
      }
    }

    // Saved choice wins over the operating-system preference on reload.
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    assert.equal(
      await page.locator("#intro-screen").evaluate((e) => e.open),
      false,
      "Reduced motion bypasses intro",
    );
    await page.getByRole("button", { name: "Switch to light mode" }).click();
    assert.equal(
      await page.evaluate(() => localStorage.getItem("sr_theme")),
      "light",
    );
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(
      await page.locator("html").getAttribute("data-theme"),
      "light",
    );

    // A regular visitor can skip by button or keyboard without waiting or flashing.
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Skip intro" }).click();
    assert.equal(
      await page.locator("#intro-screen").evaluate((e) => e.open),
      false,
    );
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.keyboard.press("Escape");
    assert.equal(
      await page.locator("#intro-screen").evaluate((e) => e.open),
      false,
    );
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(
      await page.locator("#intro-screen").evaluate((e) => e.open),
      false,
    );

    const other = await browser.newContext({
      colorScheme: "dark",
      reducedMotion: "reduce",
    });
    const system = await other.newPage();
    await system.route("https://www.gstatic.com/firebasejs/**", (r) =>
      r.abort(),
    );
    await system.addInitScript(() => {
      Storage.prototype.getItem = () => {
        throw new Error("unavailable");
      };
      Storage.prototype.setItem = () => {
        throw new Error("unavailable");
      };
    });
    await system.goto(url, { waitUntil: "networkidle" });
    assert.equal(
      await system.locator("html").getAttribute("data-theme"),
      "dark",
    );
    await system.locator("#theme-toggle").click();
    assert.equal(
      await system.locator("html").getAttribute("data-theme"),
      "light",
    );
    await other.close();
    assert.deepEqual(errors, []);
    console.log(
      "PASS: 3.5-second camera intro, logo, skip/Escape, reduced motion, both themes, persistence, system preference, storage failure, 6 widths per theme, WCAG contrast scan.",
    );
  } finally {
    if (browser) await browser.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
