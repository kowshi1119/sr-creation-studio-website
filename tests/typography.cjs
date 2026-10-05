const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require("playwright");
const { createServer } = require("../scripts/serve.cjs");

// Text people read stays legible; decorative text hidden from assistive technology may be smaller.
const MIN_TEXT = 12;
const MIN_DECORATIVE = 9;
const MIN_PARAGRAPH = 15;
const PARAGRAPHS = [
  ".hero-description",
  ".section-heading > p",
  ".service-card p",
  ".about-copy > p:not(.eyebrow)",
  ".process-grid p",
  ".contact-intro-bottom p",
  ".contact-details p",
  ".pkg-features li",
];
const SERIF = /^"?Cormorant Garamond/;

function smallText([rootSelector, limits]) {
  const found = [];
  for (const el of document.querySelector(rootSelector).querySelectorAll("*")) {
    if (!el.getClientRects().length) continue;
    const text = [...el.childNodes]
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent.trim())
      .join(" ")
      .trim();
    if (!text) continue;
    const style = getComputedStyle(el);
    if (style.visibility === "hidden") continue;
    const decorative = Boolean(el.closest('[aria-hidden="true"]'));
    const size = parseFloat(style.fontSize);
    if (size < (decorative ? limits.decorative : limits.text))
      found.push(size + "px " + text.slice(0, 40));
  }
  return found;
}

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
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("https://www.gstatic.com/firebasejs/**", (route) =>
      route.abort(),
    );
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForFunction(
      () => document.documentElement.dataset.intro === "complete",
    );
    // Measure every package panel, not only the selected one.
    await page.evaluate(() =>
      document
        .querySelectorAll(".pkg-panel")
        .forEach((p) => (p.hidden = false)),
    );
    const limits = { text: MIN_TEXT, decorative: MIN_DECORATIVE };

    const tracking = {};
    for (const width of [320, 390, 768, 1101, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.deepEqual(
        await page.evaluate(smallText, ["body", limits]),
        [],
        "Text below the minimum size at " + width,
      );
      for (const selector of PARAGRAPHS)
        assert.deepEqual(
          await page.$$eval(
            selector,
            (nodes, min) =>
              nodes
                .filter((n) => parseFloat(getComputedStyle(n).fontSize) < min)
                .map((n) => getComputedStyle(n).fontSize + " " + n.className),
            MIN_PARAGRAPH,
          ),
          [],
          selector + " reads below " + MIN_PARAGRAPH + "px at " + width,
        );
      // The featured badge never sits on top of the card's category label.
      assert.deepEqual(
        await page.$$eval(
          ".pkg-card.featured",
          (cards) =>
            cards.filter((card) => {
              const tier = card.querySelector(".pkg-tier");
              if (getComputedStyle(tier).visibility === "hidden") return false;
              const range = document.createRange();
              range.selectNodeContents(tier);
              const a = range.getBoundingClientRect();
              const b = card
                .querySelector(".pkg-badge")
                .getBoundingClientRect();
              return (
                a.left < b.right &&
                b.left < a.right &&
                a.top < b.bottom &&
                b.top < a.bottom
              );
            }).length,
        ),
        0,
        "Featured badge overlaps the category label at " + width,
      );
      tracking[width] = await page.$$eval("h1, main h2", (nodes) =>
        nodes.map((n) => {
          const style = getComputedStyle(n);
          const spacing = parseFloat(style.letterSpacing) || 0;
          return spacing / parseFloat(style.fontSize);
        }),
      );
    }
    // Heading tracking is proportional to size, so it holds at every width.
    tracking[390].forEach((ratio, index) =>
      assert.ok(
        Math.abs(ratio - tracking[1440][index]) <= 0.001,
        "Heading " + index + " tracking changes with size",
      ),
    );

    assert.deepEqual(
      await page.$$eval(
        "h1, h2, h3",
        (nodes, serif) =>
          nodes
            .filter(
              (n) => !new RegExp(serif).test(getComputedStyle(n).fontFamily),
            )
            .map((n) => n.id || n.className || n.textContent.slice(0, 20)),
        SERIF.source,
      ),
      [],
      "Headings use the display serif",
    );
    const labels = await page.$$eval(".section-heading .eyebrow", (nodes) =>
      nodes.map((n) => {
        const style = getComputedStyle(n);
        return style.textTransform + " " + style.fontStyle;
      }),
    );
    assert.ok(labels.length > 0);
    labels.forEach((label) => assert.equal(label, "none italic"));

    const prices = await page.$$eval(".pkg-price", (nodes) =>
      nodes.map((n) => {
        const style = getComputedStyle(n);
        return [style.fontFamily, style.fontVariantNumeric];
      }),
    );
    assert.ok(prices.length > 0);
    for (const [family, numeric] of prices) {
      assert.match(family, SERIF, "Prices use the display serif");
      assert.match(numeric, /lining-nums/);
      assert.match(numeric, /tabular-nums/);
    }
    assert.match(
      await page
        .locator(".frame-table td")
        .first()
        .evaluate((n) => getComputedStyle(n).fontVariantNumeric),
      /tabular-nums/,
    );
    assert.deepEqual(
      await page.$$eval(".pkg-features li", (nodes) => [
        ...new Set(nodes.map((n) => getComputedStyle(n, "::before").content)),
      ]),
      ['""'],
      "Feature lists use a rule, not an arrow",
    );

    // Copy: plain, specific calls to action and named packages.
    const texts = (selector) =>
      page.$$eval(selector, (nodes) => nodes.map((n) => n.textContent.trim()));
    assert.deepEqual(
      [...new Set(await texts(".service-link, .pkg-card .button"))],
      ["Check availability"],
    );
    assert.deepEqual(await texts(".pkg-badge"), [
      "Studio’s pick",
      "Studio’s pick",
    ]);
    assert.deepEqual(await texts("#package-panel-1 .pkg-card h3"), [
      "Essential",
      "Signature",
      "Complete",
    ]);
    assert.equal(
      await page.locator("#portfolio-count").innerText(),
      "2 stories",
    );

    // Overlays and dialogs follow the same minimums.
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.locator("#chat-toggle").click();
      assert.deepEqual(
        await page.evaluate(smallText, ["#chatbot", limits]),
        [],
        "Assistant text at " + width,
      );
      await page.locator("#chat-close").click();
      await page.locator(".service-card").first().click();
      assert.deepEqual(
        await page.evaluate(smallText, ["#service-modal", limits]),
        [],
        "Inquiry text at " + width,
      );
      await page.keyboard.press("Escape");
      await page.locator(".album-card").first().click();
      assert.deepEqual(
        await page.evaluate(smallText, ["#album-modal", limits]),
        [],
        "Album text at " + width,
      );
      await page.locator(".album-photo").first().click();
      assert.deepEqual(
        await page.evaluate(smallText, ["#lightbox", limits]),
        [],
        "Lightbox text at " + width,
      );
      await page.keyboard.press("Escape");
      await page.keyboard.press("Escape");
      await page.evaluate(() => document.getElementById("intro-screen").show());
      assert.deepEqual(
        await page.evaluate(smallText, ["#intro-screen", limits]),
        [],
        "Intro text at " + width,
      );
      await page.evaluate(() =>
        document.getElementById("intro-screen").close(),
      );
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS: text minimums at 5 widths, featured badge clear of labels, paragraph sizes, proportional heading tracking, serif headings and prices, aligned figures, label style, feature rules, calls to action, package names, overlays.",
    );
  } finally {
    if (browser) await browser.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
