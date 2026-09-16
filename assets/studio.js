const SERVICES = [
  {
    icon: "favorite",
    title: "Wedding Photography",
    desc: "Cinematic storytelling of your union — from intimate moments to grand celebrations — captured with artistry and soul.",
  },
  {
    icon: "celebration",
    title: "Puberty Ceremonies",
    desc: "Beautifully documented milestone celebrations with full-day coverage, drone shots, and traditional elegance.",
  },
  {
    icon: "person",
    title: "Portrait & Model Shoots",
    desc: "Editorial-quality portraits for models, professionals, and anyone who wants to look and feel extraordinary.",
  },
  {
    icon: "cake",
    title: "Birthday & Events",
    desc: "Every laugh, every hug, every moment — preserved with cinematic clarity and warm storytelling.",
  },
  {
    icon: "video_camera_front",
    title: "Videography",
    desc: "Cinematic wedding films and event highlight reels that play like movies you will watch forever.",
  },
  {
    icon: "photo_frame",
    title: "Framing & Albums",
    desc: "Premium glass frames and Duro frames in all sizes, plus handcrafted photo albums that last a lifetime.",
  },
];

const PACKAGE_CATEGORIES = [
  { id: "wedding", name: "Wedding Packages", slug: "wedding" },
  { id: "puberty", name: "Puberty Ceremony", slug: "puberty" },
  { id: "glass", name: "Glass Frame Prices", slug: "glass" },
  { id: "duro", name: "Duro Frame Prices", slug: "duro" },
];

const PACKAGES = {
  wedding: {
    items: [
      {
        id: "w1",
        title: "Package 01",
        badge: "Silver",
        priceLKR: "150,000",
        featured: false,
        features: [
          "35-sheet album",
          "1 USB",
          "2 photographers",
          "2 videographers",
          "1 frame",
          "One-day function coverage",
        ],
      },
      {
        id: "w2",
        title: "Package 02",
        badge: "Gold",
        priceLKR: "190,000",
        featured: false,
        features: [
          "45-sheet album",
          "2 photographers",
          "2 videographers",
          "1 USB",
          "1 frame",
          "Registration coverage – 2 hours",
        ],
      },
      {
        id: "w3",
        title: "Package 03",
        badge: "Platinum",
        priceLKR: "250,000",
        featured: true,
        features: [
          "55-sheet album",
          "2 photographers",
          "2 videographers",
          "1 USB",
          "1 frame",
          "Registration coverage – 2 hours",
          "Reception coverage",
          "Outdoor shoot – 1 day",
          "Meganthi / Mehendi coverage",
          "Drone coverage",
        ],
      },
      {
        id: "w4",
        title: "Package 04",
        badge: "Platinum Plus",
        priceLKR: "300,000",
        featured: false,
        features: [
          "60-sheet album",
          "2 photographers",
          "3 videographers",
          "2 USBs",
          "1 frame",
          "Registration coverage – 2 hours",
          "Reception coverage",
          "Outdoor shoot – 1 day",
          "Meganthi / Mehendi coverage",
          "Drone coverage",
          "Bride-to-be session",
        ],
      },
      {
        id: "w5",
        title: "Package 05",
        badge: "VIP",
        priceLKR: "400,000",
        featured: false,
        features: [
          "75-sheet album",
          "2 photographers",
          "3 videographers",
          "2 USBs",
          "1 frame",
          "Registration coverage – 2 hours",
          "Reception coverage",
          "Outdoor shoot – 1 day",
          "Meganthi / Mehendi coverage",
          "Drone coverage",
          "Bride-to-be session",
          "Mini album",
        ],
      },
    ],
    notes:
      "<strong>Save the Date:</strong> Free &nbsp;|&nbsp; <strong>Extra sheet charge:</strong> LKR 2,400 per sheet",
  },
  puberty: {
    items: [
      {
        id: "p1",
        title: "Package 01",
        badge: null,
        priceLKR: "180,000",
        featured: false,
        features: [
          "40-sheet album",
          "1 signature frame",
          "1 USB",
          "Photo and video coverage",
          "One-day function coverage",
        ],
      },
      {
        id: "p2",
        title: "Package 02",
        badge: "Popular",
        priceLKR: "280,000",
        featured: true,
        features: [
          "Photo and video coverage",
          "55-sheet album",
          "Meganthi coverage",
          "Cake-cutting coverage",
          "Outdoor shoot – 1 day",
          "USB",
          "Signature frame",
        ],
      },
      {
        id: "p3",
        title: "Package 03",
        badge: "Complete",
        priceLKR: "300,000",
        featured: false,
        features: [
          "70-sheet album",
          "Signature frame",
          "USB",
          "Photo and video coverage",
          "Meganthi coverage",
          "Cake-cutting coverage",
          "Outdoor shoot – 2 days",
        ],
      },
    ],
    notes:
      "<strong>Drone DJI:</strong> Free &nbsp;|&nbsp; <strong>Save the Date:</strong> Free",
  },
  glass: {
    rows: [
      ["6×4", "LKR 800"],
      ["5×7", "LKR 1,000"],
      ["6×8", "LKR 1,100"],
      ["10×8", "LKR 1,500"],
      ["12×8", "LKR 2,100"],
      ["10×12", "LKR 2,500"],
      ["10×15", "LKR 3,400"],
      ["12×15", "LKR 3,500"],
      ["12×18", "LKR 4,500"],
      ["12×24", "LKR 5,500"],
      ["12×36", "LKR 6,000"],
      ["16×24", "LKR 8,000"],
      ["18×24", "LKR 10,000"],
      ["20×24", "LKR 14,500"],
      ["24×30", "LKR 15,000"],
      ["20×30", "LKR 14,000"],
      ["24×36", "LKR 16,000"],
    ],
    note: "Prices are for standard glass frames. Custom sizes available on request.",
  },
  duro: {
    rows: [
      ["6×4", "LKR 600"],
      ["5×7", "LKR 900"],
      ["6×8", "LKR 1,300"],
      ["10×8", "LKR 1,400"],
      ["12×8", "LKR 1,700"],
      ["10×12", "LKR 2,400"],
      ["10×15", "LKR 2,700"],
      ["12×15", "LKR 2,800"],
      ["12×18", "LKR 3,000"],
      ["12×24", "LKR 3,300"],
      ["12×36", "LKR 5,000"],
      ["16×24", "LKR 6,500"],
      ["18×24", "LKR 7,000"],
      ["20×24", "LKR 7,500"],
      ["24×30", "LKR 9,000"],
      ["20×30", "LKR 8,500"],
      ["24×36", "LKR 10,000"],
    ],
    note: "Duro frames are lightweight and durable. All sizes available in stock.",
  },
};

window.SR_FIREBASE_CONFIG = window.SR_FIREBASE_CONFIG || {
  apiKey: "AIzaSyAgs7fetaSjy5bhtaClcvroQvTBBe5iyMM",
  authDomain: "sr-creation-studio-web.firebaseapp.com",
  databaseURL: "https://sr-creation-studio-web-default-rtdb.firebaseio.com",
  projectId: "sr-creation-studio-web",
  storageBucket: "sr-creation-studio-web.firebasestorage.app",
  messagingSenderId: "1056115151978",
  appId: "1:1056115151978:web:5845f9a56a4e37b3bf6613",
  measurementId: "G-95G85K4RR3",
};

/* Public site: read-only Firebase sync; the admin data keys remain unchanged. */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const categoryLabel = (category) =>
  ({
    ALL: "All stories",
    WEDDING: "Weddings",
    MODEL: "Portraits",
    CEREMONY: "Ceremonies",
    BIRTHDAY: "Birthdays",
  })[category] || String(category || "Stories").replaceAll("_", " ");
const remoteCache = new Map();
function safeGet(key, fallback = null) {
  if (remoteCache.has(key)) return remoteCache.get(key);
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}
function imageURL(value) {
  if (typeof value !== "string") return "";
  if (/^data:image\/(jpeg|jpg|png|webp|gif);base64,/i.test(value)) return value;
  try {
    const url = new URL(value, location.href);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}
function photo(src, alt, lazy = true) {
  const img = element("img");
  img.src = imageURL(src) || "assets/photos/wedding-2.webp";
  img.alt = alt;
  if (lazy) img.loading = "lazy";
  img.decoding = "async";
  img.addEventListener(
    "error",
    () => {
      // Keep a useful image and label when an external admin photo disappears.
      img.src = "assets/photos/wedding-2.webp";
      img.alt = alt + " — studio preview";
    },
    { once: true },
  );
  return img;
}
let currentFilter = "ALL";
let lightboxPhotos = [];
let lightboxIndex = 0;
let lightboxTitle = "";
function getAlbums() {
  const custom = safeGet("sr_albums");
  // An explicitly empty admin collection stays empty; fallback only if absent.
  const source = Array.isArray(custom) ? custom : window.SR_PORTFOLIO || [];
  return source.filter(
    (a) =>
      a &&
      typeof a === "object" &&
      a.isPublished !== false &&
      a.published !== false,
  );
}
function albumPhotos(album) {
  const list = Array.isArray(album.photos) ? album.photos : [];
  const photos = list
    .map((p) => (typeof p === "string" ? { imageUrl: p, caption: "" } : p))
    .filter((p) => p && imageURL(p.imageUrl));
  return photos.length
    ? photos
    : imageURL(album.coverImage)
      ? [{ imageUrl: album.coverImage, caption: album.title }]
      : [];
}
function buildPortfolio() {
  const albums = getAlbums();
  const cats = ["ALL", ...new Set(albums.map((a) => a.category || "STORIES"))];
  if (!cats.includes(currentFilter)) currentFilter = "ALL";
  const filters = $("#portfolio-filters");
  filters.replaceChildren();
  cats.forEach((cat) => {
    const button = element(
      "button",
      "filter-btn" + (cat === currentFilter ? " active" : ""),
      categoryLabel(cat),
    );
    button.type = "button";
    button.setAttribute("aria-pressed", String(cat === currentFilter));
    button.addEventListener("click", () => {
      currentFilter = cat;
      buildPortfolio();
      const index = cats.indexOf(cat);
      $("#portfolio-filters").children[index]?.focus({ preventScroll: true });
    });
    filters.append(button);
  });
  const filtered = albums.filter(
    (a) =>
      currentFilter === "ALL" || (a.category || "STORIES") === currentFilter,
  );
  $("#portfolio-count").textContent =
    String(filtered.length).padStart(2, "0") + " STORIES";
  const grid = $("#albums-grid");
  grid.replaceChildren();
  if (!filtered.length)
    grid.append(
      element(
        "p",
        "album-empty",
        "New stories are on their way. Contact us to explore more of our work.",
      ),
    );
  filtered.forEach((album) => {
    const button = element("button", "album-card");
    button.type = "button";
    button.setAttribute("aria-label", "Open album: " + album.title);
    const thumb = element("div", "album-thumb");
    thumb.append(
      photo(
        album.coverImage || albumPhotos(album)[0]?.imageUrl,
        album.title + " — " + categoryLabel(album.category),
      ),
      element("span", "album-open", "↗"),
    );
    thumb.lastChild.setAttribute("aria-hidden", "true");
    const info = element("div", "album-info"),
      text = element("div");
    text.append(
      element(
        "span",
        "album-category",
        categoryLabel(album.category).toUpperCase() +
          " / " +
          (album.location || "JAFFNA"),
      ),
      element("h3", "", album.title),
    );
    const count = albumPhotos(album).length;
    info.append(
      text,
      element("span", "", count + " photograph" + (count === 1 ? "" : "s")),
    );
    button.append(thumb, info);
    button.addEventListener("click", () => openAlbum(album));
    grid.append(button);
  });
}
function openDialog(dialog) {
  if (!dialog.open) {
    dialog.showModal();
    document.body.style.overflow = "hidden";
  }
}
function closeDialog(dialog) {
  dialog.close();
}
$$("dialog").forEach((dialog) => {
  $("[data-close]", dialog)?.addEventListener("click", () =>
    closeDialog(dialog),
  );
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      closeDialog(dialog);
  });
  dialog.addEventListener("close", () => {
    if (!document.querySelector("dialog[open]") && $("#mobile-menu").hidden)
      document.body.style.overflow = "";
  });
});
function openAlbum(album) {
  $("#album-modal-title").textContent = album.title;
  $("#album-modal-meta").textContent = [
    categoryLabel(album.category),
    album.location,
  ]
    .filter(Boolean)
    .join(" / ");
  $("#album-modal-desc").textContent = album.shortDescription || "";
  const photos = albumPhotos(album);
  const grid = $("#album-modal-grid");
  grid.replaceChildren();
  if (!photos.length)
    grid.append(
      element(
        "p",
        "",
        "Photographs will be added soon. Contact the studio for more details.",
      ),
    );
  photos.forEach((p, index) => {
    const button = element("button", "album-photo");
    button.type = "button";
    button.setAttribute(
      "aria-label",
      "View photograph " + (index + 1) + " of " + photos.length,
    );
    button.append(
      photo(
        p.imageUrl,
        p.caption || album.title + " — photograph " + (index + 1),
      ),
    );
    button.addEventListener("click", () => {
      lightboxPhotos = photos;
      lightboxIndex = index;
      lightboxTitle = album.title;
      updateLightbox();
      openDialog($("#lightbox"));
    });
    grid.append(button);
  });
  openDialog($("#album-modal"));
}
function updateLightbox() {
  if (!lightboxPhotos.length) return;
  const p = lightboxPhotos[lightboxIndex];
  $("#lightbox-img").src = imageURL(p.imageUrl);
  $("#lightbox-img").alt =
    p.caption || lightboxTitle + " — photograph " + (lightboxIndex + 1);
  $("#lb-caption").textContent =
    lightboxIndex +
    1 +
    " / " +
    lightboxPhotos.length +
    (p.caption ? " · " + p.caption : "");
  $("#lb-prev").disabled = $("#lb-next").disabled = lightboxPhotos.length < 2;
}
function navigatePhoto(direction) {
  if (lightboxPhotos.length) {
    lightboxIndex =
      (lightboxIndex + direction + lightboxPhotos.length) %
      lightboxPhotos.length;
    updateLightbox();
  }
}
$("#lb-prev").addEventListener("click", () => navigatePhoto(-1));
$("#lb-next").addEventListener("click", () => navigatePhoto(1));
$("#lightbox").addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") {
    event.preventDefault();
    navigatePhoto(1);
  }
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    navigatePhoto(-1);
  }
});
function openInquiry(
  title,
  description = "Tell us about your plans. We’ll help you choose the right coverage and make the day your own.",
) {
  $("#modal-title").textContent = title;
  $("#modal-desc").textContent = description;
  $("#modal-wa").href =
    "https://wa.me/94761194985?text=" +
    encodeURIComponent(
      "Hi SR Creation Studio, I'm interested in: " +
        title +
        ". Please share availability and details.",
    );
  $("#modal-email").href =
    "mailto:srcreationstudiojaffna@gmail.com?subject=" +
    encodeURIComponent(title + " — Inquiry") +
    "&body=" +
    encodeURIComponent(
      "Hi SR Creation Studio,\n\nI would like to inquire about " +
        title +
        ".\nPreferred date:\nLocation:\n\nThank you!",
    );
  openDialog($("#service-modal"));
}
$$("[data-inquiry]").forEach((button) =>
  button.addEventListener("click", () => openInquiry(button.dataset.inquiry)),
);
function buildServices() {
  $("#services-grid").replaceChildren(
    ...SERVICES.map((service, index) => {
      const button = element("button", "service-card");
      button.type = "button";
      button.append(
        element("span", "service-number", String(index + 1).padStart(2, "0")),
        element("span", "service-arrow", "↗"),
        element("h3", "", service.title),
        element("p", "", service.desc),
        element("span", "service-link", "LET’S TALK ABOUT IT  ↗"),
      );
      button.addEventListener("click", () =>
        openInquiry(service.title, service.desc),
      );
      return button;
    }),
  );
}
let selectedPackage = "wedding";
function packageData(id) {
  const custom = safeGet("sr_packages", {});
  return (custom && typeof custom === "object" && custom[id]) || PACKAGES[id];
}
function packageCategories() {
  const custom = safeGet("sr_pkg_categories", []);
  return [
    ...new Map(
      [...PACKAGE_CATEGORIES, ...(Array.isArray(custom) ? custom : [])]
        .filter((c) => c && typeof c.id === "string" && c.name)
        .map((c) => [c.id, c]),
    ).values(),
  ];
}
function plainNote(html) {
  // Package notes historically contain formatting. Extract only text.
  const doc = new DOMParser().parseFromString(String(html), "text/html");
  return doc.body.textContent || "";
}
function buildPackages() {
  const categories = packageCategories();
  if (!categories.some((c) => c.id === selectedPackage))
    selectedPackage = categories[0]?.id;
  const tabs = $("#pkg-tabs"),
    panels = $("#pkg-panels");
  tabs.replaceChildren();
  panels.replaceChildren();
  categories.forEach((category, index) => {
    const active = category.id === selectedPackage,
      tab = element(
        "button",
        "pkg-tab" + (active ? " active" : ""),
        category.name,
      );
    tab.type = "button";
    tab.id = "package-tab-" + index;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-selected", String(active));
    tab.setAttribute("aria-controls", "package-panel-" + index);
    tab.tabIndex = active ? 0 : -1;
    tab.addEventListener("click", () => selectPackage(category.id));
    tab.addEventListener("keydown", (event) => {
      const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? categories.length - 1
            : (index +
                (event.key === "ArrowRight" ? 1 : -1) +
                categories.length) %
              categories.length;
      selectPackage(categories[next].id);
      $("#pkg-tabs").children[next].focus();
    });
    const panel = element("div", "pkg-panel");
    panel.id = "package-panel-" + index;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tab.id);
    panel.tabIndex = 0;
    panel.hidden = !active;
    renderPackagePanel(panel, category);
    tabs.append(tab);
    panels.append(panel);
  });
}
function selectPackage(id) {
  selectedPackage = id;
  const categories = packageCategories();
  $$(".pkg-tab").forEach((tab, index) => {
    const active = categories[index].id === id;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  $$(".pkg-panel").forEach(
    (panel, index) => (panel.hidden = categories[index].id !== id),
  );
}
function renderPackagePanel(panel, category) {
  const data = packageData(category.id);
  if (!data) {
    panel.append(element("p", "", "Contact the studio for a tailored quote."));
    return;
  }
  if (Array.isArray(data.items)) {
    const cards = element("div", "pkg-cards");
    data.items
      .filter((p) => p && typeof p === "object")
      .forEach((pkg) => {
        const card = element(
          "article",
          "pkg-card" + (pkg.featured ? " featured" : ""),
        );
        card.append(element("p", "pkg-tier", category.name));
        if (pkg.featured)
          card.append(element("span", "pkg-badge", "STUDIO SELECTION"));
        const title =
          category.id === "wedding" && pkg.badge ? pkg.badge : pkg.title;
        card.append(element("h3", "", title));
        const price = element("p", "pkg-price");
        price.append(
          element("span", "", "LKR"),
          document.createTextNode(String(pkg.priceLKR || "On request")),
        );
        card.append(price);
        const features = element("ul", "pkg-features");
        (Array.isArray(pkg.features) ? pkg.features : []).forEach((f) =>
          features.append(element("li", "", f)),
        );
        card.append(features);
        const button = element(
          "button",
          "button button-dark",
          "Inquire about this package ↗",
        );
        button.type = "button";
        button.addEventListener("click", () =>
          openInquiry(
            title + " — " + category.name,
            "Starting at LKR " +
              pkg.priceLKR +
              ". Contact us to confirm availability and tailor this package to your day.",
          ),
        );
        card.append(button);
        cards.append(card);
      });
    panel.append(cards);
  } else if (Array.isArray(data.rows)) {
    const table = element("table", "frame-table"),
      thead = element("thead"),
      row = element("tr");
    ["Size (inches)", "Price (LKR)"].forEach((text) => {
      const th = element("th", "", text);
      th.scope = "col";
      row.append(th);
    });
    thead.append(row);
    table.append(thead);
    const tbody = element("tbody");
    data.rows.filter(Array.isArray).forEach((values) => {
      const tr = element("tr");
      values
        .slice(0, 2)
        .forEach((value) => tr.append(element("td", "", value)));
      tbody.append(tr);
    });
    table.append(tbody);
    panel.append(table);
  }
  if (data.notes || data.note)
    panel.append(element("p", "pkg-note", plainNote(data.notes || data.note)));
}
function loadLogo() {
  const value = imageURL(safeGet("sr_logo")) || "assets/studio-logo.jpg";
  const img = element("img");
  img.src = value;
  img.alt = "";
  img.width = 59;
  img.height = 59;
  img.addEventListener(
    "error",
    () => {
      img.src = "assets/studio-logo.jpg";
    },
    { once: true },
  );
  $("#brand-mark").replaceChildren(img);
}
function refreshPublicDataViews() {
  loadLogo();
  buildPortfolio();
  buildPackages();
}
function applyRemoteData(payload) {
  if (!payload || typeof payload !== "object") return;
  CLOUD_DATA_KEYS.forEach((key) => {
    const value = Object.prototype.hasOwnProperty.call(payload, key)
      ? payload[key]
      : null;
    remoteCache.set(key, value);
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* Render remote content even when local storage is full or unavailable. */
    }
  });
  refreshPublicDataViews();
}
const CLOUD_DATA_KEYS = [
  "sr_albums",
  "sr_logo",
  "sr_packages",
  "sr_pkg_categories",
  "sr_album_categories",
];
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });
}
async function startCloudSync() {
  try {
    await loadScript(
      "https://www.gstatic.com/firebasejs/10.12.4/firebase-app-compat.js",
    );
    await loadScript(
      "https://www.gstatic.com/firebasejs/10.12.4/firebase-database-compat.js",
    );
    if (!firebase.apps.length)
      firebase.initializeApp(window.SR_FIREBASE_CONFIG);
    firebase
      .database()
      .ref("srStudioSiteData")
      .on(
        "value",
        (snapshot) => {
          const payload = snapshot.val();
          if (payload) applyRemoteData(payload);
        },
        () =>
          console.info(
            "[SR Studio] Cloud unavailable; showing saved portfolio.",
          ),
      );
  } catch {
    console.info("[SR Studio] Offline portfolio ready.");
  }
}
// Mobile navigation: accessible state, keyboard exit, scroll lock.
function setMenu(open) {
  $("#mobile-menu").hidden = !open;
  $("#menu-toggle").setAttribute("aria-expanded", String(open));
  $("#menu-toggle").setAttribute(
    "aria-label",
    open ? "Close navigation" : "Open navigation",
  );
  document.body.style.overflow =
    open || document.querySelector("dialog[open]") ? "hidden" : "";
  $("#main").inert = open;
  $(".site-footer").inert = open;
  $("#chat-toggle").inert = open;
  if (open && !$("#chatbot").hidden) setChat(false);
  if (open) $("#mobile-menu a").focus();
}
$("#menu-toggle").addEventListener("click", () =>
  setMenu($("#mobile-menu").hidden),
);
$$("#mobile-menu a").forEach((link) =>
  link.addEventListener("click", () => setMenu(false)),
);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !$("#mobile-menu").hidden) {
    setMenu(false);
    $("#menu-toggle").focus();
  }
});
matchMedia("(min-width: 851px)").addEventListener("change", (event) => {
  if (event.matches) setMenu(false);
});
// Lightweight 3D perspective; no WebGL dependency or continuous render loop.
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
let motionPaused = false;
const stage = $("#photo-stage"),
  art = $("#hero-art"),
  motionButton = $("#motion-toggle");
function resetTilt() {
  stage.style.removeProperty("--tilt-x");
  stage.style.removeProperty("--tilt-y");
}
art.addEventListener("pointermove", (event) => {
  if (reducedMotion.matches || motionPaused || !finePointer.matches) return;
  const r = art.getBoundingClientRect();
  stage.style.setProperty(
    "--tilt-x",
    ((0.5 - (event.clientY - r.top) / r.height) * 9).toFixed(2) + "deg",
  );
  stage.style.setProperty(
    "--tilt-y",
    (((event.clientX - r.left) / r.width - 0.5) * 12).toFixed(2) + "deg",
  );
});
art.addEventListener("pointerleave", resetTilt);
motionButton.addEventListener("click", () => {
  motionPaused = !motionPaused;
  document.body.classList.toggle("motion-paused", motionPaused);
  motionButton.setAttribute("aria-pressed", String(motionPaused));
  motionButton.setAttribute(
    "aria-label",
    motionPaused ? "Enable 3D photo motion" : "Pause 3D photo motion",
  );
  motionButton.textContent = motionPaused
    ? "↻ Enable motion"
    : "Ⅱ Pause motion";
  resetTilt();
});
reducedMotion.addEventListener("change", () => {
  resetTilt();
  document.body.classList.toggle("motion-enabled", !reducedMotion.matches);
});
if ("IntersectionObserver" in window) {
  new IntersectionObserver((entries) =>
    document.body.classList.toggle(
      "hero-out-of-view",
      !entries[0].isIntersecting,
    ),
  ).observe(art);
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove("pending");
          observer.unobserve(entry.target);
        }
      }),
    { threshold: 0.08 },
  );
  $$(".section-heading,.about-copy,.process-grid article").forEach((node) => {
    node.classList.add("reveal", "pending");
    observer.observe(node);
  });
  document.body.classList.toggle("motion-enabled", !reducedMotion.matches);
  const sections = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          $$(".desktop-nav a").forEach((link) => {
            if (link.hash === "#" + entry.target.id)
              link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
          });
        }
      }),
    { rootMargin: "-20% 0px -55% 0px" },
  );
  $$("main section[id]").forEach((section) => sections.observe(section));
}
function setChat(open) {
  $("#chatbot").hidden = !open;
  $("#chat-toggle").setAttribute("aria-expanded", String(open));
  $("#chat-toggle").setAttribute(
    "aria-label",
    open ? "Close studio assistant" : "Open studio assistant",
  );
  if (open) {
    if (!$("#chat-messages").children.length)
      addChatMessage(
        "Hello! I’m the studio’s automated assistant. Ask me about packages, frames, or planning your session.",
        false,
      );
    $("#chat-input").focus();
  } else $("#chat-toggle").focus();
}
$("#chat-toggle").addEventListener("click", () =>
  setChat($("#chatbot").hidden),
);
$("#chat-close").addEventListener("click", () => setChat(false));
$("#chatbot").addEventListener("keydown", (event) => {
  if (event.key === "Escape") setChat(false);
});
function addChatMessage(text, user = false) {
  const message = element("div", "chat-message" + (user ? " user" : ""), text);
  if (!user) {
    const link = element("a", "", "Talk to the studio on WhatsApp ↗");
    link.href = "https://wa.me/94761194985";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    message.append(link);
  }
  const messages = $("#chat-messages");
  messages.append(message);
  messages.scrollTop = messages.scrollHeight;
}
function packageReply(id) {
  const data = packageData(id);
  if (!data) return "Please ask the studio for the latest package details.";
  if (Array.isArray(data.items))
    return (
      data.items
        .map((p) => (p.badge || p.title) + " — LKR " + p.priceLKR)
        .join("\n") +
      "\n\nSee the Packages section for inclusions. The studio will confirm your quote and availability."
    );
  return "See the Packages section for the full price list. Contact us for custom sizes.";
}
function processQuery(query) {
  const q = query.toLowerCase();
  if (/wedding|marriage|bride|groom/.test(q)) return packageReply("wedding");
  if (/puberty|ceremony/.test(q)) return packageReply("puberty");
  if (/frame|glass|duro/.test(q))
    return "Glass and Duro framing options are listed in the Packages section, with sizes and prices. Contact us for a custom frame.";
  if (/price|package|cost/.test(q)) return packageReply("wedding");
  if (/hours|open|time|sunday/.test(q))
    return "Monday to Saturday: 9 am – 7 pm. Sunday: by appointment. Please contact us to arrange your visit.";
  if (/contact|phone|email|where|address|location/.test(q))
    return "Puttur Road, Jaffna, Sri Lanka.\n+94 76 119 4985\nsrcreationstudiojaffna@gmail.com";
  if (/book|date|reserve|available/.test(q))
    return "Tell us your event type, preferred date and location on WhatsApp or email. Our team will confirm availability with you.";
  return "We’d love to help. Ask about wedding packages, ceremonies, frame prices, contact details or opening hours. For a tailored answer, talk directly to the studio.";
}
function sendChat(query) {
  if (!query.trim()) return;
  addChatMessage(query.trim(), true);
  addChatMessage(processQuery(query));
}
$("#chat-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = $("#chat-input");
  sendChat(input.value);
  input.value = "";
});
["Wedding packages", "Ceremonies", "Book a session", "Hours"].forEach(
  (text) => {
    const button = element("button", "", text);
    button.type = "button";
    button.addEventListener("click", () => sendChat(text));
    $("#chat-chips").append(button);
  },
);
$("#year").textContent = new Date().getFullYear();
buildServices();
refreshPublicDataViews();
startCloudSync();
