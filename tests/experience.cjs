const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require("playwright");
const { default: AxeBuilder } = require("@axe-core/playwright");
const { createServer } = require("../scripts/serve.cjs");

const WIDTHS = [320, 360, 375, 390, 412, 430, 768, 1024, 1280, 1440, 1536];
const decode = (href) =>
  decodeURIComponent(new URL(href).searchParams.get("text") || "");

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
    await page.addInitScript(() => {
      window.__shifts = 0;
      window.__lcp = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          if (!entry.hadRecentInput) window.__shifts += entry.value;
      }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) window.__lcp = entry.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
    });
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForFunction(
      () => document.documentElement.dataset.intro === "complete",
    );

    // Hero answers who, what and where; the lead photograph loads first.
    const meta = await page.locator(".hero-meta").textContent();
    for (const word of ["SR Creation Studio", "Photography", "Film", "Jaffna"])
      assert.match(meta, new RegExp(word), "Hero meta names " + word);
    const lead = page.locator(".frame-main img");
    assert.equal(await lead.getAttribute("fetchpriority"), "high");
    assert.notEqual(await lead.getAttribute("loading"), "lazy");
    assert.equal(
      await page.locator('.hero-actions a[href="#portfolio"]').count(),
      1,
      "Hero offers a path to the stories",
    );

    // Selected stories come from the album data, numbered, with real metadata only.
    const stories = await page.$$eval(".album-card", (cards) =>
      cards.map((card) => ({
        number: card.querySelector(".story-number")?.textContent.trim(),
        title: card.querySelector("h3")?.textContent.trim(),
        meta: [...card.querySelectorAll(".story-meta > span")].map((s) =>
          s.textContent.trim(),
        ),
        cta: card.querySelector(".story-cta")?.textContent.trim(),
        lazy: card.querySelector("img")?.getAttribute("loading"),
      })),
    );
    assert.deepEqual(
      stories.map((s) => [s.number, s.title, s.meta]),
      [
        ["01", "Kajendran&Tharsika", ["Wedding", "Jaffna", "March 2026"]],
        ["02", "Graduation", ["Portrait", "Jaffna Uni"]],
        ["03", "Purple Saree Portraits", ["Portrait"]],
      ],
    );
    stories.forEach((s) => {
      assert.match(s.cta, /View story/);
      assert.equal(s.lazy, "lazy");
    });

    // Missing fields are omitted, never printed as placeholders.
    await page.evaluate(() =>
      applyRemoteData({
        sr_albums: [
          {
            title: "Birthday at home",
            category: "BIRTHDAY",
            coverImage: "javascript:alert(1)",
            photos: [],
          },
          {
            title: "Untitled category",
            photos: ["assets/photos/wedding-3.webp"],
          },
          {
            category: "WEDDING",
            coverImage: "javascript:alert(1)",
            photos: [
              { imageUrl: "assets/photos/wedding-3.webp", width: 0, height: 0 },
            ],
          },
        ],
      }),
    );
    const sparse = await page.locator("#albums-grid").innerText();
    assert.doesNotMatch(sparse, /undefined|null|NaN|Invalid Date/);
    assert.deepEqual(
      await page.$$eval(".album-card .story-meta", (nodes) =>
        nodes.map((n) => n.textContent.trim()),
      ),
      ["Birthday", "Story", "Wedding"],
    );
    // A missing title or unsafe cover never leaks into labels or crops.
    const untitled = page.locator(".album-card").nth(2);
    assert.equal(
      await untitled.getAttribute("aria-label"),
      "Open story: Wedding story",
    );
    assert.match(
      await untitled.locator("img").getAttribute("src"),
      /wedding-3\.webp$/,
      "An unsafe cover falls back to the album's own first photograph",
    );
    assert.deepEqual(
      await page.$$eval(".album-card", (cards) =>
        cards
          .flatMap((c) => [
            c.getAttribute("aria-label"),
            c.querySelector("img").alt,
          ])
          .filter((text) => /undefined|null/.test(text)),
      ),
      [],
    );
    assert.equal(
      await page
        .locator(".album-card img")
        .first()
        .evaluate((img) => new URL(img.src).protocol),
      "http:",
      "Unsafe cover URLs fall back to a bundled photograph",
    );
    await page.evaluate(() => {
      localStorage.clear();
      applyRemoteData({});
    });
    assert.equal(await page.locator(".album-card").count(), 3);
    // The reader checks below use the two original stories.
    await page.evaluate(() =>
      applyRemoteData({ sr_albums: window.SR_PORTFOLIO.slice(0, 2) }),
    );

    // A story opens as an editorial sequence that follows each image's shape.
    await page.locator(".album-card").nth(1).click();
    assert.equal(
      await page.locator("#album-modal").evaluate((d) => d.open),
      true,
    );
    assert.equal(
      await page.locator("#album-modal-title").innerText(),
      "Graduation",
    );
    assert.deepEqual(
      await page.$$eval("#album-modal-grid > .story-row", (rows) =>
        rows.map((row) => [
          row.className.replace("story-row ", ""),
          row.querySelectorAll(".album-photo").length,
        ]),
      ),
      [
        ["story-row--opening", 1],
        ["story-row--wide", 1],
        ["story-row--wide", 1],
        ["story-row--pair", 2],
        ["story-row--pair", 2],
        ["story-row--single", 1],
      ],
    );
    assert.equal(await page.locator("#album-modal .album-photo").count(), 8);
    // A background sync while the reader is open does not reshuffle it.
    await page.evaluate(() => applyRemoteData({ sr_albums: [] }));
    await page.locator("#story-next").click();
    assert.equal(
      await page.locator("#album-modal-title").innerText(),
      "Kajendran&Tharsika",
    );
    await page.locator("#story-next").click();
    await page.evaluate(() => {
      localStorage.clear();
      applyRemoteData({});
    });
    assert.equal(
      await page.locator("#album-modal-title").innerText(),
      "Graduation",
    );
    assert.doesNotMatch(
      await page.locator("#album-modal").innerText(),
      /undefined|null/,
    );

    // Previous and next stories swap in place and move focus to the new title.
    await page.locator("#story-next").click();
    assert.equal(
      await page.locator("#album-modal-title").innerText(),
      "Kajendran&Tharsika",
    );
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      "album-modal-title",
    );
    assert.equal(await page.locator("#album-modal .album-photo").count(), 3);
    // With two stories only "next" is offered; it wraps back around.
    assert.equal(await page.locator("#story-prev").isHidden(), true);
    await page.locator("#story-next").click();
    assert.equal(
      await page.locator("#album-modal-title").innerText(),
      "Graduation",
    );

    // With three or more stories, "previous" steps back and wraps around.
    await page.keyboard.press("Escape");
    await page.evaluate(() =>
      applyRemoteData({
        sr_albums: [
          ...window.SR_PORTFOLIO,
          {
            title: "Birthday at home",
            category: "BIRTHDAY",
            photos: ["assets/photos/wedding-3.webp"],
          },
        ],
      }),
    );
    await page.locator(".album-card").first().click();
    await page.locator("#story-prev").click();
    assert.equal(
      await page.locator("#album-modal-title").innerText(),
      "Birthday at home",
    );
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      "album-modal-title",
    );
    await page.keyboard.press("Escape");
    await page.evaluate(() => {
      localStorage.clear();
      applyRemoteData({});
    });
    await page.locator(".album-card").nth(1).click();

    // The story ends with a way to enquire about something similar.
    await page.locator("#story-inquire").click();
    assert.equal(
      await page.locator("#service-modal").evaluate((d) => d.open),
      true,
    );
    assert.match(await page.locator("#modal-title").innerText(), /Portrait/);
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    assert.equal(
      await page.locator("#album-modal").evaluate((d) => d.open),
      false,
    );

    // Studio index: every description readable without hover; real previews only.
    const services = await page.$$eval(".service-card", (cards) =>
      cards.map((card) => {
        const p = card.querySelector("p");
        const style = getComputedStyle(p);
        return {
          title: card.querySelector("h3").textContent.trim(),
          visible: style.display !== "none" && style.visibility !== "hidden",
          preview: card
            .querySelector(".service-preview img")
            ?.src.replace(location.origin + "/", ""),
          hidden: card
            .querySelector(".service-preview")
            ?.getAttribute("aria-hidden"),
        };
      }),
    );
    assert.equal(services.length, 6);
    services.forEach((s) => assert.ok(s.visible, s.title + " description"));
    assert.deepEqual(
      services.filter((s) => s.preview).map((s) => [s.title, s.preview]),
      [
        ["Wedding Photography", "assets/photos/wedding-1.webp"],
        ["Portrait & Model Shoots", "assets/photos/graduation-1.webp"],
      ],
    );
    services
      .filter((s) => s.preview)
      .forEach((s) => assert.equal(s.hidden, "true"));
    await page.locator(".service-card").nth(2).focus();
    await page.keyboard.press("Enter");
    assert.match(await page.locator("#modal-title").innerText(), /Portrait/);

    // The inquiry dialog's optional details flow into both message links.
    await page.locator("#inq-dialog-date").fill("2026-12-12");
    await page.locator("#inq-dialog-location").fill("Nallur");
    const dialogText = decode(
      await page.locator("#modal-wa").getAttribute("href"),
    );
    assert.match(dialogText, /Event: Portrait & Model Shoots/);
    assert.match(dialogText, /Date: 12 December 2026/);
    assert.match(dialogText, /Location: Nallur/);
    assert.match(
      decodeURIComponent(
        await page.locator("#modal-email").getAttribute("href"),
      ),
      /Location: Nallur/,
    );
    await page.keyboard.press("Escape");

    // The contact form composes a structured message and leaves out empty fields.
    const form = page.locator("#inquiry-form");
    await form.scrollIntoViewIfNeeded();
    assert.doesNotMatch(
      decode(await page.locator("#inq-whatsapp").getAttribute("href")),
      /Event:/,
      "An unchosen event is left out",
    );
    await page.locator("#inq-event").selectOption("Wedding Photography");
    await page
      .locator("#inq-package")
      .selectOption({ label: "Gold — LKR 190,000" });
    await page.locator("#inq-date").fill("2027-02-20");
    await page.locator("#inq-location").fill("Point Pedro");
    await page
      .locator("#inq-message")
      .fill("Morning ceremony, evening reception.");
    let text = decode(await page.locator("#inq-whatsapp").getAttribute("href"));
    assert.match(
      await page.locator("#inq-whatsapp").getAttribute("href"),
      /^https:\/\/wa\.me\/94761194985\?text=/,
    );
    for (const line of [
      "Hello SR Creation Studio,",
      "Event: Wedding Photography",
      "Date: 20 February 2027",
      "Location: Point Pedro",
      "Package: Gold — LKR 190,000",
      "Message: Morning ceremony, evening reception.",
    ])
      assert.ok(text.includes(line), "WhatsApp message includes " + line);
    assert.doesNotMatch(text, /reserved|confirmed|available/i);
    await page.locator("#inq-location").fill("");
    await page.locator("#inq-package").selectOption({ index: 0 });
    text = decode(await page.locator("#inq-whatsapp").getAttribute("href"));
    assert.doesNotMatch(text, /Location:|Package:/);
    assert.match(
      await page.locator("#inq-email").getAttribute("href"),
      /^mailto:srcreationstudiojaffna@gmail\.com\?subject=/,
    );

    // Structured data describes only verified studio facts.
    const data = JSON.parse(
      await page.locator('script[type="application/ld+json"]').textContent(),
    );
    assert.equal(data.name, "SR Creation Studio");
    assert.equal(data.telephone, "+94761194985");
    assert.equal(data.email, "srcreationstudiojaffna@gmail.com");
    assert.equal(data.address.addressLocality, "Jaffna");
    assert.equal(data.address.addressCountry, "LK");
    for (const invented of [
      "aggregateRating",
      "review",
      "geo",
      "priceRange",
      "foundingDate",
      "award",
    ])
      assert.equal(data[invented], undefined, invented + " is not claimed");

    // Loading behaviour and stability.
    assert.equal(
      await page.locator("#about img").first().getAttribute("loading"),
      "lazy",
    );
    const vitals = await page.evaluate(() => ({
      cls: window.__shifts,
      lcp: window.__lcp,
    }));
    assert.ok(vitals.cls < 0.1, "Cumulative layout shift " + vitals.cls);
    assert.ok(vitals.lcp > 0, "Largest contentful paint observed");

    // Reduced motion: every enhanced element is fully visible.
    assert.deepEqual(
      await page.$$eval("[data-reveal], .hero h1 .line > span", (nodes) =>
        nodes
          .filter((n) => {
            const style = getComputedStyle(n);
            return style.opacity !== "1" || style.translate !== "none";
          })
          .map((n) => n.className),
      ),
      [],
    );

    // Responsive art direction holds at every width in both themes.
    for (const theme of ["light", "dark"]) {
      await page.evaluate(
        (t) => (document.documentElement.dataset.theme = t),
        theme,
      );
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 });
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
          theme + " overflow at " + width,
        );
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator(".album-card").first().click();
    assert.deepEqual(
      await page.$$eval("#album-modal .album-photo img", (imgs) =>
        imgs
          .filter((img) => img.getBoundingClientRect().width > innerWidth + 1)
          .map((img) => img.src),
      ),
      [],
      "Story photographs fit a phone screen",
    );
    const a11y = await new AxeBuilder({ page })
      .include("#album-modal")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(
      a11y.violations.map((v) => v.id),
      [],
      "Story dialog accessibility",
    );
    await page.keyboard.press("Escape");
    assert.deepEqual(errors, []);
    console.log(
      "PASS: hero hierarchy and lead image priority, data-driven stories with omitted empty fields, story sequencing and prev/next with focus, story inquiry, studio index previews, inquiry composition, verified structured data, lazy loading, CLS " +
        vitals.cls.toFixed(3) +
        " and LCP " +
        Math.round(vitals.lcp) +
        "ms (local), reduced-motion visibility, 11 widths in both themes, story dialog WCAG scan.",
    );
  } finally {
    if (browser) await browser.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
