/* Motion layer: pointer depth in the hero, scroll choreography and reveals.
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

  // Reveals; anything the data views add later is picked up too.
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
  function reveal(nodes, type) {
    nodes.forEach((node) => {
      if (node.dataset.reveal) return;
      node.dataset.reveal = type;
      if (revealObserver) revealObserver.observe(node);
      else node.classList.add("is-in");
    });
  }

  // Hero: each photograph sits on its own depth plane.
  const art = $("#hero-art");
  const stage = $("#photo-stage");
  art.addEventListener("pointermove", (event) => {
    if (!interactive()) return;
    const rect = art.getBoundingClientRect();
    stage.style.setProperty(
      "--px",
      (((event.clientX - rect.left) / rect.width - 0.5) * 2).toFixed(3),
    );
    stage.style.setProperty(
      "--py",
      (((event.clientY - rect.top) / rect.height - 0.5) * 2).toFixed(3),
    );
  });
  const resetDepth = () =>
    ["--px", "--py"].forEach((name) => stage.style.removeProperty(name));
  art.addEventListener("pointerleave", resetDepth);
  $("#motion-toggle").addEventListener("click", resetDepth);

  // The two primary calls to action drift slightly toward the pointer.
  $$(".hero-actions .button, .contact-intro-bottom .button").forEach((node) => {
    node.addEventListener("pointermove", (event) => {
      if (!interactive()) return;
      const rect = node.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * 0.18;
      const y = (event.clientY - rect.top - rect.height / 2) * 0.25;
      node.style.translate = x.toFixed(1) + "px " + y.toFixed(1) + "px";
    });
    node.addEventListener("pointerleave", () => (node.style.translate = ""));
  });

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

  // Story covers open like a curtain whenever the stories re-render.
  const enhanceStories = () => reveal($$(".album-card"), "curtain");
  new MutationObserver(enhanceStories).observe($("#albums-grid"), {
    childList: true,
  });
  enhanceStories();
  placePill();
  reveal($$(".about-visual"), "curtain");
  reveal($$(".process-grid"), "line");

  // Lightbox photographs cross-fade instead of snapping.
  const lightboxImage = $("#lightbox-img");
  new MutationObserver(() => {
    if (calm() || !lightboxImage.animate) return;
    lightboxImage.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 420,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    });
  }).observe(lightboxImage, { attributes: true, attributeFilter: ["src"] });

  // Over a story cover, a "View story" label follows the pointer.
  const cursor = $(".cursor");
  let pointerX = 0,
    pointerY = 0,
    cursorX = 0,
    cursorY = 0,
    cursorFrame = 0;
  function followPointer() {
    cursorX += (pointerX - cursorX) * 0.25;
    cursorY += (pointerY - cursorY) * 0.25;
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
      const target = event.target instanceof Element ? event.target : null;
      const over =
        event.pointerType === "mouse" &&
        interactive() &&
        Boolean(target?.closest(".album-thumb"));
      if (over && !cursor.classList.contains("is-view")) {
        cursorX = event.clientX;
        cursorY = event.clientY;
      }
      cursor.classList.toggle("is-view", over);
      if (!over) return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!cursorFrame) cursorFrame = requestAnimationFrame(followPointer);
    },
    { passive: true },
  );
  // Leaving the window or scrolling moves the cover away, so the label goes too.
  const hideLabel = () => cursor.classList.remove("is-view");
  root.addEventListener("pointerleave", hideLabel);
  addEventListener("scroll", hideLabel, { passive: true });
})();
