const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { createServer } = require("../scripts/serve.cjs");

// A stand-in for the Firebase compat SDK: one in-memory cloud shared by every
// page, so photos published by the admin can be read by a separate visitor.
const FAKE_FIREBASE = `(() => {
  const listeners = [];
  const at = (state, path) =>
    path.split("/").reduce((node, key) => (node == null ? null : node[key] ?? null), state);
  window.__fbEmit = (state) =>
    listeners.forEach(({ path, cb }) => cb({ val: () => at(state, path) }));
  window.firebase = {
    apps: [],
    initializeApp() { this.apps.push({}); },
    database: () => ({
      ref: (path) => ({
        set: (value) =>
          window.__fbSet(path, JSON.stringify(value)).then((error) => {
            if (error) throw new Error(error);
          }),
        remove: () => window.__fbSet(path, "null"),
        on(event, cb) {
          listeners.push({ path, cb });
          window.__fbGet().then((state) => {
            cb({ val: () => at(state, path) });
            window.__fbReady = true;
          });
        },
      }),
    }),
  };
})();`;

const PHOTOS = ["graduation-1", "graduation-2", "wedding-1"].map((name) => ({
  name: name + ".webp",
  mimeType: "image/webp",
  buffer: fs.readFileSync(
    path.join(__dirname, "..", "assets", "photos", name + ".webp"),
  ),
}));

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
  let cloud = {};
  let rejectWrites = false;
  let snapshotGate = null;
  const pages = [];
  const errors = [];
  const contexts = [];

  async function device(options = {}) {
    const context = await browser.newContext(options);
    contexts.push(context);
    await context.route("https://www.gstatic.com/firebasejs/**", (route) =>
      route.fulfill({
        contentType: "text/javascript",
        body: route.request().url().includes("app-compat") ? FAKE_FIREBASE : "",
      }),
    );
    await context.route(/fonts\.(googleapis|gstatic)\.com/, (route) =>
      route.abort(),
    );
    await context.exposeFunction("__fbGet", async () => {
      await snapshotGate;
      return cloud;
    });
    await context.exposeFunction("__fbSet", async (target, json) => {
      if (rejectWrites) {
        // Like the real SDK, a rejected write reverts listeners to the server copy.
        await broadcast();
        return "PERMISSION_DENIED: Permission denied";
      }
      const [root, key] = target.split("/");
      const value = JSON.parse(json);
      cloud[root] = { ...cloud[root] };
      if (value === null) delete cloud[root][key];
      else cloud[root][key] = value;
      await broadcast();
      return null;
    });
    await context.addInitScript(() => {
      window.__toasts = [];
      document.addEventListener("DOMContentLoaded", () => {
        const box = document.getElementById("toast-container");
        if (box)
          new MutationObserver((records) =>
            records.forEach((r) =>
              r.addedNodes.forEach((n) =>
                window.__toasts.push(n.textContent.trim()),
              ),
            ),
          ).observe(box, { childList: true });
      });
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    pages.push(page);
    return { context, page };
  }
  async function broadcast() {
    for (const page of pages)
      if (!page.isClosed())
        await page
          .evaluate((state) => window.__fbEmit && window.__fbEmit(state), cloud)
          .catch(() => {});
  }
  const cloudAlbum = (title) =>
    (cloud.srStudioSiteData?.sr_albums || []).find((a) => a.title === title);
  async function waitForCloud(check, message) {
    for (let i = 0; i < 100 && !check(); i++)
      await new Promise((resolve) => setTimeout(resolve, 50));
    assert.ok(check(), message);
  }
  const toasts = (page) => page.evaluate(() => window.__toasts.slice());
  async function waitForToast(page, pattern) {
    await page.waitForFunction(
      (source) => window.__toasts.some((t) => new RegExp(source).test(t)),
      pattern.source,
    );
  }

  async function openAdmin(page, { waitForCloud = true } = {}) {
    await page.goto(url + "/admin.html");
    if (await page.locator("#login-user").isVisible()) {
      await page.fill("#login-user", "admin");
      await page.fill("#login-pass", "srcstudio2024");
      await page.getByRole("button", { name: /Sign In/ }).click();
    }
    if (waitForCloud)
      await page.waitForFunction(() => window.__fbReady === true);
  }
  async function createAlbum(page, title) {
    await page.evaluate((title) => {
      openAddAlbumModal();
      document.getElementById("af-title").value = title;
      saveAlbum();
    }, title);
    await page.waitForFunction(
      (title) => safeGet("sr_albums", []).some((a) => a.title === title),
      title,
    );
    return page.evaluate(
      (title) => safeGet("sr_albums", []).find((a) => a.title === title).id,
      title,
    );
  }
  async function upload(page, albumId, files) {
    await page.evaluate(() => gotoSection("photos"));
    await page.setInputFiles("#photo-file-input", files);
    await page.selectOption("#upload-album-select", albumId);
    await page.click("#upload-submit-btn");
  }
  async function visitorSees(title, count) {
    const { context, page } = await device({ reducedMotion: "reduce" });
    await page.goto(url + "/index.html");
    const card = page.locator(".album-card", {
      has: page.locator("h3", { hasText: title }),
    });
    await card.waitFor();
    assert.equal(
      await card.locator(".story-count").textContent(),
      count + " photographs",
    );
    await card.click();
    const images = page.locator("#album-modal-grid img");
    await page.waitForFunction(
      (n) =>
        [...document.querySelectorAll("#album-modal-grid img")].filter(
          (img) => img.complete && img.naturalWidth > 0,
        ).length === n,
      count,
    );
    for (const src of await images.evaluateAll((list) =>
      list.map((img) => img.getAttribute("src")),
    ))
      assert.match(src, /^data:image\/webp;base64,/);
    await context.close();
  }

  try {
    browser = await chromium.launch({
      headless: true,
      ...(executablePath ? { executablePath } : {}),
    });

    // 1. A few photos travel from the admin to a visitor on another device.
    {
      const { context, page } = await device();
      await openAdmin(page);
      const id = await createAlbum(page, "Small story");
      await upload(page, id, PHOTOS);
      await waitForToast(page, /3 photo\(s\) published to the website/);
      assert.equal(cloudAlbum("Small story").photos.length, 3);
      await visitorSees("Small story", 3);
      await context.close();
    }

    // 2. Photos beyond this browser's storage quota still reach the website,
    //    survive an admin reload, and later edits still publish.
    {
      cloud = {};
      const { context, page } = await device();
      await page.goto(url + "/admin.html");
      await page.evaluate(() => {
        // Leave only a little room, like an admin who has uploaded many photos.
        const chunk = "x".repeat(100000);
        let n = 0;
        try {
          for (;;) localStorage.setItem("filler" + n++, chunk);
        } catch {}
        localStorage.removeItem("filler" + (n - 2));
        localStorage.removeItem("filler" + (n - 3));
      });
      await openAdmin(page);
      const id = await createAlbum(page, "Large story");
      await upload(page, id, PHOTOS);
      await waitForToast(page, /3 photo\(s\) published to the website/);
      assert.ok(
        (await toasts(page)).some((t) => /offline copy is full/.test(t)),
        "The upload exceeded this browser's storage",
      );
      assert.equal(cloudAlbum("Large story").photos.length, 3);
      await visitorSees("Large story", 3);

      await page.reload();
      await page.waitForFunction(() => window.__fbReady === true);
      await page.evaluate(() => gotoSection("albums"));
      assert.match(
        await page.locator("#admin-album-grid").innerText(),
        /3 photos/,
      );
      await createAlbum(page, "After reload");
      await waitForCloud(
        () => cloudAlbum("After reload"),
        "Edits publish after a reload",
      );
      assert.equal(cloudAlbum("Large story").photos.length, 3);
      await context.close();
    }

    // 3. A rejected cloud write is reported, never announced as published.
    {
      cloud = {};
      const { context, page } = await device();
      await openAdmin(page);
      const id = await createAlbum(page, "Rejected story");
      rejectWrites = true;
      await upload(page, id, PHOTOS.slice(0, 1));
      await waitForToast(
        page,
        /Couldn.t publish to the website: PERMISSION_DENIED/,
      );
      assert.ok(
        !(await toasts(page)).some((t) => /published to the website/.test(t)),
      );
      assert.equal(cloudAlbum("Rejected story").photos.length, 0);
      rejectWrites = false;
      await context.close();
    }

    // 4. Until the website data has loaded, a save cannot replace it with an
    //    incomplete copy (for example after a reload with a full local store).
    {
      const live = cloud.srStudioSiteData.sr_albums.length;
      let release;
      snapshotGate = new Promise((resolve) => (release = resolve));
      const { context, page } = await device();
      await openAdmin(page, { waitForCloud: false });
      await page.evaluate(() => {
        openAddAlbumModal();
        document.getElementById("af-title").value = "Too early";
        saveAlbum();
      });
      await waitForToast(page, /Still loading the website data/);
      assert.equal(cloud.srStudioSiteData.sr_albums.length, live);
      release();
      snapshotGate = null;
      await page.waitForFunction(() => window.__fbReady === true);
      await createAlbum(page, "On time");
      await waitForCloud(
        () => cloudAlbum("On time"),
        "Saves publish once the website data has loaded",
      );
      assert.equal(cloud.srStudioSiteData.sr_albums.length, live + 1);
      await context.close();
    }

    assert.deepEqual(errors, []);
    console.log(
      "PASS: admin photos publish to the website, beyond the local storage quota, after a reload, cloud errors are reported, and no save publishes before the website data loads.",
    );
  } finally {
    for (const context of contexts) await context.close().catch(() => {});
    if (browser) await browser.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
