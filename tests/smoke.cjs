const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { default: AxeBuilder } = require("@axe-core/playwright");
const { createServer } = require("../scripts/serve.cjs");

(async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = "http://127.0.0.1:" + server.address().port;
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
      viewport: { width: 1440, height: 1000 },
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    // Test the bundled fallback independently of production Firebase availability.
    await page.route("https://www.gstatic.com/firebasejs/**", (route) =>
      route.abort(),
    );
    await page.goto(url, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    assert.match(await page.locator("h1").innerText(), /Some moments/);
    assert.equal(await page.locator(".album-card").count(), 2);
    assert.equal(
      await page.locator(".pkg-panel:not([hidden]) .pkg-card").count(),
      5,
    );

    await page.getByRole("button", { name: "Portraits", exact: true }).click();
    assert.equal(await page.locator(".album-card").count(), 1);
    await page
      .getByRole("button", { name: "All stories", exact: true })
      .click();
    await page.locator(".album-card").first().focus();
    await page.keyboard.press("Enter");
    assert.equal(
      await page.locator("#album-modal").evaluate((el) => el.open),
      true,
    );
    assert.equal(await page.locator(".album-photo").count(), 3);
    await page.locator(".album-photo").first().click();
    assert.equal(await page.locator("#lb-caption").innerText(), "1 / 3");
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.locator("#lb-caption").innerText(), "2 / 3");
    await page.keyboard.press("Escape");
    assert.equal(
      await page.locator("#lightbox").evaluate((el) => el.open),
      false,
    );
    assert.equal(
      await page.locator("#album-modal").evaluate((el) => el.open),
      true,
    );
    assert.equal(
      await page.evaluate(() => document.body.style.overflow),
      "hidden",
    );
    await page.keyboard.press("Escape");
    assert.equal(
      await page.locator("#album-modal").evaluate((el) => el.open),
      false,
    );
    assert.equal(
      await page.evaluate(() =>
        document.activeElement.classList.contains("album-card"),
      ),
      true,
    );

    await page.getByRole("tab", { name: "Glass Frame Prices" }).click();
    assert.equal(
      await page.locator(".pkg-panel:not([hidden]) tbody tr").count(),
      17,
    );
    await page.keyboard.press("ArrowRight");
    assert.equal(
      await page
        .getByRole("tab", { name: "Duro Frame Prices" })
        .getAttribute("aria-selected"),
      "true",
    );
    await page.getByRole("tab", { name: "Wedding Packages" }).click();
    await page
      .locator(".pkg-panel:not([hidden]) .pkg-card .button")
      .first()
      .click();
    assert.match(await page.locator("#modal-title").innerText(), /Silver/);
    assert.match(
      await page.locator("#modal-wa").getAttribute("href"),
      /^https:\/\/wa.me\/94761194985\?text=/,
    );
    assert.match(
      await page.locator("#modal-email").getAttribute("href"),
      /^mailto:srcreationstudiojaffna@gmail.com\?/,
    );
    await page.keyboard.press("Escape");

    await page.locator("#chat-toggle").click();
    await page
      .getByRole("button", { name: "Wedding packages", exact: true })
      .click();
    assert.match(await page.locator("#chat-messages").innerText(), /150,000/);
    await page.locator("#chat-close").click();

    // Admin-managed names must remain text, including apostrophes and markup.
    await page.evaluate(() =>
      applyRemoteData({
        sr_albums: [
          {
            id: "custom",
            title: "A <script> & B's story",
            category: "WEDDING",
            coverImage: "assets/photos/wedding-2.webp",
            photos: [],
          },
        ],
        sr_packages: {
          wedding: {
            items: [
              {
                title: "Custom",
                priceLKR: "123,456",
                features: ["<b>Coverage</b>"],
              },
            ],
          },
        },
      }),
    );
    assert.equal(
      await page.locator(".album-card h3").innerText(),
      "A <script> & B's story",
    );
    assert.equal(await page.locator(".album-card script").count(), 0);
    assert.match(
      await page.locator(".pkg-panel:not([hidden])").innerText(),
      /123,456/,
    );
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "networkidle" });
    await page.evaluate(async () => {
      await Promise.all(
        [...document.images]
          .filter((img) => img.getAttribute("src"))
          .map((img) => {
            img.loading = "eager";
            return img.decode().catch(() => {});
          }),
      );
    });
    assert.deepEqual(
      await page.evaluate(() =>
        [...document.images]
          .filter((img) => img.getAttribute("src") && !img.naturalWidth)
          .map((img) => img.src),
      ),
      [],
    );

    const art = page.locator("#hero-art");
    await art.scrollIntoViewIfNeeded();
    const box = await art.boundingBox();
    await page.mouse.move(box.x + 20, box.y + 30);
    assert.notEqual(
      await page
        .locator("#photo-stage")
        .evaluate((el) => el.style.getPropertyValue("--tilt-y")),
      "",
    );
    await page.getByRole("button", { name: "Pause 3D photo motion" }).click();
    assert.equal(
      await page.locator("#motion-toggle").getAttribute("aria-pressed"),
      "true",
    );
    assert.equal(
      await page
        .locator(".frame-main")
        .evaluate((el) => getComputedStyle(el).animationPlayState),
      "paused",
    );

    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        "Horizontal overflow at " + width,
      );
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => scrollTo(0, 0));
    await page.getByRole("button", { name: "Open navigation" }).click();
    assert.equal(
      await page.locator("#menu-toggle").getAttribute("aria-expanded"),
      "true",
    );
    await page.locator('#mobile-menu a[href="#packages"]').click();
    assert.equal(await page.locator("#mobile-menu").isHidden(), true);
    assert.equal(await page.evaluate(() => document.body.style.overflow), "");

    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(
      await page
        .locator("#photo-stage")
        .evaluate((el) => getComputedStyle(el).transform),
      "none",
    );
    const a11y = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(
      a11y.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => n.target),
      })),
      [],
      "Accessibility violations",
    );

    const out = process.env.SCREENSHOT_DIR;
    if (out) {
      fs.mkdirSync(out, { recursive: true });
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: path.join(out, "mobile.png") });
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.screenshot({ path: path.join(out, "desktop.png") });
      await page.setViewportSize({ width: 1200, height: 900 });
      await page.locator("#portfolio").scrollIntoViewIfNeeded();
      await page.screenshot({
        path: path.join(out, "portfolio-review.jpg"),
        quality: 45,
      });
      await page.locator("#services").scrollIntoViewIfNeeded();
      await page.screenshot({
        path: path.join(out, "services-review.jpg"),
        quality: 45,
      });
      await page.locator("#packages").scrollIntoViewIfNeeded();
      await page.screenshot({
        path: path.join(out, "packages-review.jpg"),
        quality: 45,
      });
    }

    await page.evaluate(() => {
      Storage.prototype.setItem = function () {
        throw new Error("Storage quota exceeded");
      };
      applyRemoteData({ sr_albums: [] });
    });
    assert.equal(await page.locator(".album-card").count(), 0);
    assert.match(await page.locator(".album-empty").innerText(), /New stories/);
    const noJS = await browser.newPage({
      javaScriptEnabled: false,
      viewport: { width: 390, height: 844 },
    });
    await noJS.goto(url);
    assert.equal(await noJS.locator("h1").isVisible(), true);
    assert.equal(await noJS.locator("noscript").isVisible(), true);
    await noJS.close();
    assert.deepEqual(errors, []);
    console.log(
      "PASS: responsive layouts at 5 widths; images; album filters; keyboard galleries and nested dialogs; focus restoration; package tabs and prices; booking links; assistant; admin data rendering; storage failure; mobile navigation; 3D pause; reduced motion; no-JS fallback; WCAG A/AA scan; no page errors.",
    );
  } finally {
    if (browser) await browser.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
