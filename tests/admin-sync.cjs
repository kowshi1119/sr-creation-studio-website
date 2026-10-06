const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { createServer } = require("../scripts/serve.cjs");

// A stand-in for the Firebase compat SDK (Auth + Firestore): one in-memory
// cloud shared by every page, so photos published by the admin can be read by
// a separate visitor. Writes need the signed-in admin account, like firestore.rules.
const FAKE_FIREBASE = `(() => {
  const SESSION = "__fakeFirebaseUser";
  let user = JSON.parse(sessionStorage.getItem(SESSION) || "null");
  const observers = [];
  const authError = (code) => Object.assign(new Error(code), { code });
  const account = (u) => u && {
    ...u,
    reauthenticateWithCredential: (c) =>
      window.__fbSignIn(c.email, c.password).then((r) => { if (r.code) throw authError(r.code); }),
    updatePassword: (password) => window.__fbSetPassword(password),
  };
  const auth = {
    get currentUser() { return account(user); },
    signInWithEmailAndPassword: (email, password) =>
      window.__fbSignIn(email, password).then((r) => {
        if (r.code) throw authError(r.code);
        user = { uid: r.uid, email };
        sessionStorage.setItem(SESSION, JSON.stringify(user));
        observers.forEach((cb) => cb(account(user)));
        return { user: account(user) };
      }),
    signOut() {
      user = null;
      sessionStorage.removeItem(SESSION);
      observers.forEach((cb) => cb(null));
      return Promise.resolve();
    },
    onAuthStateChanged(cb) {
      observers.push(cb);
      setTimeout(() => cb(account(user)), 0);
    },
  };
  const authFactory = () => auth;
  authFactory.EmailAuthProvider = { credential: (email, password) => ({ email, password }) };

  let docs = null;
  let loading = null;
  const listeners = [];
  const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
  const parentOf = (path) => path.split("/").slice(0, -1).join("/");
  const load = () => loading || (loading = window.__fsGet().then((state) => { if (!docs) docs = state; }));
  const docSnap = (path) => ({
    id: path.split("/").pop(),
    exists: docs[path] !== undefined,
    data: () => clone(docs[path]),
  });
  const querySnap = (path) => {
    const list = Object.keys(docs).filter((p) => parentOf(p) === path).sort().map(docSnap);
    return { docs: list, size: list.length, empty: !list.length, forEach: (cb) => list.forEach(cb) };
  };
  const view = (l) => (l.kind === "doc" ? docSnap(l.path) : querySnap(l.path));
  const signature = (l) => {
    const v = view(l);
    return JSON.stringify(l.kind === "doc" ? [v.exists, v.data()] : v.docs.map((d) => [d.id, d.data()]));
  };
  window.__fsEmit = (state) => {
    docs = state;
    listeners.slice().forEach((l) => {
      const now = signature(l);
      if (now !== l.last) { l.last = now; l.next(view(l)); }
    });
  };
  const listen = (kind, path, next) => {
    const l = { kind, path, next, last: null, active: true };
    load().then(() => {
      if (!l.active) return;
      listeners.push(l);
      l.last = signature(l);
      next(view(l));
    });
    return () => {
      l.active = false;
      const i = listeners.indexOf(l);
      if (i >= 0) listeners.splice(i, 1);
    };
  };
  const commit = (ops) =>
    window.__fsCommit(JSON.stringify(ops), user && user.uid).then((error) => {
      if (error) throw Object.assign(new Error(error), { code: "permission-denied" });
    });
  const docRef = (path) => ({
    id: path.split("/").pop(),
    path,
    collection: (name) => colRef(path + "/" + name),
    set: (data, options) => commit([{ op: "set", path, data, merge: Boolean(options && options.merge) }]),
    delete: () => commit([{ op: "delete", path }]),
    get: () => load().then(() => docSnap(path)),
    onSnapshot: (next, error) => listen("doc", path, next, error),
  });
  const colRef = (path) => ({
    path,
    doc: (id) => docRef(path + "/" + id),
    get: () => load().then(() => querySnap(path)),
    onSnapshot: (next, error) => listen("col", path, next, error),
  });
  const db = {
    settings() {},
    collection: (name) => colRef(name),
    batch() {
      const ops = [];
      return {
        set(ref, data, options) { ops.push({ op: "set", path: ref.path, data, merge: Boolean(options && options.merge) }); },
        delete(ref) { ops.push({ op: "delete", path: ref.path }); },
        commit: () => commit(ops),
      };
    },
  };
  const firestoreFactory = () => db;
  firestoreFactory.FieldValue = { delete: () => ({ __fieldDelete: true }) };
  window.firebase = {
    apps: [],
    initializeApp() { this.apps.push({}); },
    auth: authFactory,
    firestore: firestoreFactory,
  };
})();`;

const ADMIN = {
  email: "studio@example.com",
  password: "correct-horse-battery",
  uid: "admin-uid",
};

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
  // Firestore documents by path, e.g. "albums/a1/photos/p1".
  let cloud = {};
  // Every accepted commit, as its list of written paths.
  const commits = [];
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
    await context.exposeFunction("__fsGet", async () => {
      await snapshotGate;
      return cloud;
    });
    await context.exposeFunction("__fbSignIn", (email, password) =>
      email !== ADMIN.email || password !== ADMIN.password
        ? { code: "auth/invalid-credential" }
        : { uid: ADMIN.uid },
    );
    await context.exposeFunction(
      "__fbSetPassword",
      (password) => void (ADMIN.password = password),
    );
    await context.exposeFunction("__fsCommit", async (json, uid) => {
      if (rejectWrites || uid !== ADMIN.uid)
        return "PERMISSION_DENIED: Missing or insufficient permissions.";
      const ops = JSON.parse(json);
      const next = { ...cloud };
      for (const op of ops) {
        if (op.op === "delete") {
          delete next[op.path];
          continue;
        }
        const doc = op.merge ? { ...next[op.path] } : {};
        for (const [field, value] of Object.entries(op.data))
          if (value && value.__fieldDelete) delete doc[field];
          else doc[field] = value;
        // Firestore refuses documents over 1 MiB.
        if (JSON.stringify(doc).length > 1048576)
          return "INVALID_ARGUMENT: document " + op.path + " is too large";
        next[op.path] = doc;
      }
      cloud = next;
      commits.push(ops.map((op) => op.op + " " + op.path));
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
          .evaluate((state) => window.__fsEmit && window.__fsEmit(state), cloud)
          .catch(() => {});
  }
  const albumIds = () =>
    Object.keys(cloud)
      .filter((p) => /^albums\/[^/]+$/.test(p))
      .map((p) => p.split("/")[1]);
  // An album as the website sees it: its document plus its photo documents.
  function cloudAlbum(title) {
    const id = albumIds().find((a) => cloud["albums/" + a].title === title);
    if (!id) return undefined;
    const photos = Object.keys(cloud)
      .filter((p) => p.startsWith("albums/" + id + "/photos/"))
      .map((p) => cloud[p]);
    return { id, ...cloud["albums/" + id], photos };
  }
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
      await page.fill("#login-user", ADMIN.email);
      await page.fill("#login-pass", ADMIN.password);
      await page.getByRole("button", { name: /Sign In/ }).click();
    }
    if (waitForCloud) await page.waitForFunction(() => CLOUD_SYNC.ready);
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
  async function visitorSees(
    title,
    count,
    source = /^data:image\/webp;base64,/,
  ) {
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
      assert.match(src, source);
    await context.close();
  }

  try {
    browser = await chromium.launch({
      headless: true,
      ...(executablePath ? { executablePath } : {}),
    });

    // 0. Only the Firebase admin account can sign in; the old default
    //    username no longer opens the admin when Firebase is available.
    {
      const { context, page } = await device();
      await page.goto(url + "/admin.html");
      assert.equal(
        await page.locator("#login-user-label").textContent(),
        "Email",
      );
      for (const [email, password] of [
        ["admin", "srcstudio2024"],
        [ADMIN.email, "wrong-password"],
      ]) {
        await page.fill("#login-user", email);
        await page.fill("#login-pass", password);
        await page.getByRole("button", { name: /Sign In/ }).click();
        await page.locator("#login-error").waitFor({ state: "visible" });
        assert.equal(
          await page.locator("#login-error").innerText(),
          "Incorrect email or password.",
        );
        assert.equal(await page.locator("#app").isVisible(), false);
      }
      await context.close();
    }

    // 1. A few photos travel from the admin to a visitor on another device.
    {
      const { context, page } = await device();
      await openAdmin(page);
      const id = await createAlbum(page, "Small story");
      await upload(page, id, PHOTOS);
      await waitForToast(page, /3 photo\(s\) published to the website/);
      const small = cloudAlbum("Small story");
      assert.equal(small.photos.length, 3);
      assert.equal(small.photoCount, 3);
      // One photo per document, with its real size and a lighter album cover.
      small.photos.forEach((p) => {
        assert.match(p.imageUrl, /^data:image\/webp;base64,/);
        assert.ok(p.width > 0 && p.height > 0);
        assert.equal(p.thumbnailUrl, undefined);
      });
      assert.match(small.coverImage, /^data:image\/webp;base64,/);
      assert.ok(
        small.coverImage.length <
          Math.max(...small.photos.map((p) => p.imageUrl.length)),
      );
      await visitorSees("Small story", 3);
      await context.close();
    }

    // 2. Photos never depend on this browser's storage: with it nearly full they
    //    still publish, survive an admin reload, and later edits write only what changed.
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
      assert.equal(
        await page.evaluate(() => localStorage.getItem("sr_albums")),
        null,
        "Album photos are not copied into localStorage",
      );
      assert.equal(cloudAlbum("Large story").photos.length, 3);
      await visitorSees("Large story", 3);

      await page.reload();
      await page.waitForFunction(() => CLOUD_SYNC.ready);
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
      // Renaming an album rewrites its details only, never its photographs.
      const before = commits.length;
      await page.evaluate((id) => {
        openAddAlbumModal(id);
        document.getElementById("af-title").value = "Large story, renamed";
        saveAlbum();
      }, id);
      await waitForCloud(
        () => cloudAlbum("Large story, renamed"),
        "Rename publishes",
      );
      assert.deepEqual(commits.slice(before), [["set albums/" + id]]);
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
      assert.equal(cloudAlbum("Rejected story").photoCount, 0);
      rejectWrites = false;
      await context.close();
    }

    // 4. Until the website data has loaded, a save cannot replace it with an
    //    incomplete copy (for example after a reload with a full local store).
    {
      const live = albumIds().length;
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
      assert.equal(albumIds().length, live);
      release();
      snapshotGate = null;
      await page.waitForFunction(() => CLOUD_SYNC.ready);
      await createAlbum(page, "On time");
      await waitForCloud(
        () => cloudAlbum("On time"),
        "Saves publish once the website data has loaded",
      );
      assert.equal(albumIds().length, live + 1);
      await context.close();
    }

    // 5. The admin changes the Firebase password and signs out.
    {
      const { context, page } = await device();
      await openAdmin(page);
      assert.equal(await page.locator("#username-panel").isVisible(), false);
      const change = (old, next) =>
        page.evaluate(
          ([old, next]) => {
            document.getElementById("set-old-pass").value = old;
            document.getElementById("set-new-pass").value = next;
            document.getElementById("set-confirm-pass").value = next;
            changePassword();
          },
          [old, next],
        );
      await change("not-my-password", "a-brand-new-pass");
      await waitForToast(page, /Current password incorrect/);
      await change(ADMIN.password, "a-brand-new-pass");
      await waitForToast(page, /Password updated!/);
      assert.equal(ADMIN.password, "a-brand-new-pass");
      await Promise.all([
        page.waitForNavigation(),
        page.locator("button[title='Sign out']").click(),
      ]);
      await page.locator("#login-user").waitFor({ state: "visible" });
      assert.equal(await page.locator("#app").isVisible(), false);
      await openAdmin(page);
      assert.equal(await page.locator("#app").isVisible(), true);
      await context.close();
    }

    // 6. An empty cloud offers a one-time import of the website's built-in
    //    albums; afterwards every album is managed from the admin.
    {
      cloud = {};
      const { context, page } = await device();
      await openAdmin(page);
      await page.evaluate(() => gotoSection("albums"));
      const importButton = page.locator("#import-site-albums");
      assert.equal(await importButton.isVisible(), true);
      await importButton.click();
      await waitForToast(page, /3 website album\(s\) imported/);
      assert.deepEqual(
        ["Kajendran&Tharsika", "Graduation", "Purple Saree Portraits"].map(
          (title) => cloudAlbum(title)?.photos.length,
        ),
        [3, 8, 5],
      );
      assert.ok(
        cloudAlbum("Graduation").photos.every((p) =>
          p.imageUrl.startsWith("assets/photos/"),
        ),
      );
      assert.equal(await importButton.isVisible(), false);
      await visitorSees(
        "Purple Saree Portraits",
        5,
        /assets\/photos\/portrait-\d\.webp$/,
      );

      // 7. Deleting a photo or an album removes its documents.
      const purple = cloudAlbum("Purple Saree Portraits");
      const photoId = Object.keys(cloud)
        .find((p) => p.startsWith("albums/" + purple.id + "/photos/"))
        .split("/")
        .pop();
      await page.evaluate(
        ([albumId, id]) => deletePhoto(albumId, id),
        [purple.id, photoId],
      );
      await waitForCloud(
        () => cloudAlbum("Purple Saree Portraits").photos.length === 4,
        "A deleted photo leaves the cloud",
      );
      assert.equal(cloudAlbum("Purple Saree Portraits").photoCount, 4);
      await page.evaluate((id) => confirmDeleteAlbum(id), purple.id);
      await page.locator("#confirm-ok-btn").click();
      await waitForCloud(
        () =>
          !Object.keys(cloud).some((p) => p.startsWith("albums/" + purple.id)),
        "A deleted album leaves the cloud with its photos",
      );
      assert.equal(albumIds().length, 2);
      await context.close();
    }

    assert.deepEqual(errors, []);
    console.log(
      "PASS: admin photos publish to Firestore one document per photo and load on the website when a story opens, independent of local storage, edits write only what changed, cloud errors are reported, no save publishes before the website data loads, website albums import once, deletions remove their documents, and only the Firebase admin account can sign in, change its password and sign out.",
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
