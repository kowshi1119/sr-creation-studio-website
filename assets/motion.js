/* Motion layer: pointer depth, scroll choreography and reveals.
   Everything here is an enhancement; the page works fully without it. */
(() => {
  const root = document.documentElement;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [
    ...scope.querySelectorAll(selector),
  ];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const calm = () =>
    reduced.matches || document.body.classList.contains("motion-paused");
  const interactive = () => finePointer.matches && !calm();
  root.classList.add("js-motion");

  // Header condenses after the hero and steps aside while reading downward.
  const header = $("#site-header");
  const menu = $("#mobile-menu");
  let lastY = scrollY;
  let scrollQueued = false;
  function updateScroll() {
    scrollQueued = false;
    const y = scrollY;
    const max = root.scrollHeight - innerHeight;
    root.style.setProperty("--progress", max > 0 ? (y / max).toFixed(4) : 0);
    header.classList.toggle("is-scrolled", y > 24);
    const delta = y - lastY;
    if (y < 420 || !menu.hidden || header.contains(document.activeElement))
      header.classList.remove("is-hidden");
    else if (delta > 6) header.classList.add("is-hidden");
    else if (delta < -6) header.classList.remove("is-hidden");
    if (Math.abs(delta) > 6 || y < 420) lastY = y;
  }
  addEventListener(
    "scroll",
    () => {
      if (!scrollQueued) {
        scrollQueued = true;
        requestAnimationFrame(updateScroll);
      }
    },
    { passive: true },
  );
  header.addEventListener("focusin", () =>
    header.classList.remove("is-hidden"),
  );
  updateScroll();

  // Scroll reveals; anything added later by the data views is picked up too.
  const revealObserver =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) =>
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              entry.target.classList.add("is-in");
              revealObserver.unobserve(entry.target);
            }),
          { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
        )
      : null;
  function reveal(nodes, type, stagger = 3) {
    nodes.forEach((node, index) => {
      if (node.dataset.reveal) return;
      node.dataset.reveal = type;
      node.style.setProperty("--i", index % stagger);
      if (revealObserver) revealObserver.observe(node);
      else node.classList.add("is-in");
    });
  }

  // Pointer-tracked depth for cards: tilt plus a moving light glare.
  function tilt(card, strength = 1) {
    if (card.dataset.tilt) return;
    card.dataset.tilt = "on";
    card.addEventListener("pointermove", (event) => {
      if (!interactive()) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      card.style.setProperty(
        "--rx",
        ((0.5 - y) * 7 * strength).toFixed(2) + "deg",
      );
      card.style.setProperty(
        "--ry",
        ((x - 0.5) * 9 * strength).toFixed(2) + "deg",
      );
      card.style.setProperty("--gx", (x * 100).toFixed(1) + "%");
      card.style.setProperty("--gy", (y * 100).toFixed(1) + "%");
    });
    card.addEventListener("pointerleave", () =>
      ["--rx", "--ry", "--gx", "--gy"].forEach((name) =>
        card.style.removeProperty(name),
      ),
    );
  }
  function spotlight(card) {
    if (card.dataset.spotlight) return;
    card.dataset.spotlight = "on";
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", event.clientX - rect.left + "px");
      card.style.setProperty("--my", event.clientY - rect.top + "px");
    });
  }

  // Hero: each photograph sits on its own depth plane and catches the light.
  const art = $("#hero-art");
  const stage = $("#photo-stage");
  art.addEventListener("pointermove", (event) => {
    if (!interactive()) return;
    const rect = art.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    stage.style.setProperty("--px", ((x - 0.5) * 2).toFixed(3));
    stage.style.setProperty("--py", ((y - 0.5) * 2).toFixed(3));
    stage.style.setProperty("--mx", x.toFixed(3));
    stage.style.setProperty("--my", y.toFixed(3));
  });
  const resetDepth = () =>
    ["--px", "--py", "--mx", "--my"].forEach((name) =>
      stage.style.removeProperty(name),
    );
  art.addEventListener("pointerleave", resetDepth);
  $("#motion-toggle").addEventListener("click", resetDepth);

  // Magnetic calls to action drift toward the pointer within their bounds.
  $$(".hero-actions .button, .contact-intro-bottom .button, .nav-book").forEach(
    (node) => {
      node.addEventListener("pointermove", (event) => {
        if (!interactive()) return;
        const rect = node.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.22;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.3;
        node.style.translate = x.toFixed(1) + "px " + y.toFixed(1) + "px";
      });
      node.addEventListener("pointerleave", () => (node.style.translate = ""));
    },
  );

  // Discipline strip becomes a seamless marquee wide enough for any screen.
  const strip = $(".discipline-strip");
  if (strip && !reduced.matches) {
    const group = document.createElement("div");
    group.className = "marquee-group";
    group.append(...strip.childNodes);
    const track = document.createElement("div");
    track.className = "marquee-track";
    track.append(group);
    strip.append(track);
    const original = [...group.children];
    const target = Math.max(innerWidth, screen.width || 0) + 200;
    for (let i = 0; i < 6 && group.scrollWidth < target; i++)
      group.append(...original.map((node) => node.cloneNode(true)));
    track.append(group.cloneNode(true));
  }

  // Album filters: an ink pill glides to the active category.
  const toolbar = $(".portfolio-toolbar");
  const filterBar = $("#portfolio-filters");
  const pill = document.createElement("span");
  pill.className = "filter-pill";
  pill.setAttribute("aria-hidden", "true");
  toolbar.prepend(pill);
  function placePill() {
    const active = $(".filter-btn.active", filterBar);
    if (!active || !active.offsetWidth) {
      pill.style.opacity = "0";
      return;
    }
    const base = toolbar.getBoundingClientRect();
    const rect = active.getBoundingClientRect();
    pill.style.width = rect.width + "px";
    pill.style.height = rect.height + "px";
    pill.style.transform =
      "translate(" +
      (rect.left - base.left) +
      "px, " +
      (rect.top - base.top) +
      "px)";
    pill.style.opacity = "1";
    requestAnimationFrame(() => pill.classList.add("is-ready"));
  }
  new MutationObserver(placePill).observe(filterBar, { childList: true });
  if ("ResizeObserver" in window)
    new ResizeObserver(placePill).observe(toolbar);
  document.fonts?.ready.then(placePill);

  // Re-apply reveals and depth whenever albums or packages re-render.
  function enhanceAlbums() {
    reveal($$(".album-card"), "curtain", 2);
    $$(".album-card").forEach((card) => tilt(card));
  }
  function enhancePackages() {
    reveal($$(".pkg-card, .frame-table, .pkg-note"), "rise");
  }
  new MutationObserver(enhanceAlbums).observe($("#albums-grid"), {
    childList: true,
  });
  new MutationObserver(enhancePackages).observe($("#pkg-panels"), {
    childList: true,
  });
  enhanceAlbums();
  enhancePackages();
  placePill();

  reveal($$(".service-card"), "rise");
  $$(".service-card").forEach(spotlight);
  reveal($$(".about-visual"), "arch");
  reveal($$(".studio-values"), "rise");
  reveal($$(".process-grid"), "line");
  reveal($$(".contact-intro h2, .contact-intro-bottom"), "rise", 2);
  reveal($$(".contact-details > div"), "rise");
  reveal($$(".package-disclaimer, #portfolio .underlined-link"), "rise", 1);

  // Footer wordmark rises letter by letter; the link keeps a readable name.
  const wordmark = $(".footer-wordmark");
  const word = [...wordmark.childNodes].find(
    (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim(),
  );
  if (word) {
    wordmark.setAttribute("aria-label", "SR Creation Studio — back to top");
    const letters = document.createElement("span");
    letters.className = "wm-letters";
    letters.setAttribute("aria-hidden", "true");
    [...word.textContent].forEach((character, index) => {
      const letter = document.createElement("span");
      letter.textContent = character;
      letter.style.setProperty("--i", index);
      letters.append(letter);
    });
    word.replaceWith(letters);
    reveal([wordmark], "letters");
  }

  // Lightbox photographs cross-fade instead of snapping.
  const lightboxImage = $("#lightbox-img");
  new MutationObserver(() => {
    if (calm() || !lightboxImage.animate) return;
    lightboxImage.animate(
      [
        { opacity: 0, transform: "scale(0.985)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: 520, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
    );
  }).observe(lightboxImage, { attributes: true, attributeFilter: ["src"] });

  // A soft cursor ring for mouse users; it invites a closer look at albums.
  const cursor = $(".cursor");
  let pointerX = 0,
    pointerY = 0,
    cursorX = 0,
    cursorY = 0,
    cursorFrame = 0;
  function followPointer() {
    cursorX += (pointerX - cursorX) * 0.22;
    cursorY += (pointerY - cursorY) * 0.22;
    cursor.style.transform =
      "translate3d(" +
      cursorX.toFixed(1) +
      "px," +
      cursorY.toFixed(1) +
      "px,0)";
    cursorFrame =
      Math.abs(pointerX - cursorX) + Math.abs(pointerY - cursorY) > 0.2
        ? requestAnimationFrame(followPointer)
        : 0;
  }
  addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType !== "mouse" || !interactive()) {
        cursor.classList.remove("is-active");
        return;
      }
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!cursor.classList.contains("is-active")) {
        cursorX = pointerX;
        cursorY = pointerY;
        cursor.classList.add("is-active");
      }
      const target = event.target instanceof Element ? event.target : null;
      const view = target?.closest(".album-card");
      cursor.classList.toggle("is-view", Boolean(view));
      cursor.classList.toggle(
        "is-link",
        !view && Boolean(target?.closest("a, button, [role='tab'], input")),
      );
      if (!cursorFrame) cursorFrame = requestAnimationFrame(followPointer);
    },
    { passive: true },
  );
  root.addEventListener("pointerleave", () =>
    cursor.classList.remove("is-active"),
  );
})();
