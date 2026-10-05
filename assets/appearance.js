/* Apply the chosen palette before CSS paints, then initialize the intro independently. */
(() => {
  const root = document.documentElement;
  // Reveal states in motion.css only apply once this script is running.
  root.classList.add("js-motion");
  const systemTheme = matchMedia("(prefers-color-scheme: dark)");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let preference = null;
  try {
    const saved = localStorage.getItem("sr_theme");
    if (saved === "light" || saved === "dark") preference = saved;
  } catch {
    /* Theme controls also work without browser storage. */
  }
  function applyTheme(theme) {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#111113" : "#ffffff");
    const button = document.getElementById("theme-toggle");
    if (button) {
      const label =
        "Switch to " + (theme === "dark" ? "light" : "dark") + " mode";
      button.setAttribute("aria-label", label);
      button.title = label;
    }
  }
  applyTheme(preference || (systemTheme.matches ? "dark" : "light"));
  systemTheme.addEventListener("change", () => {
    if (!preference) applyTheme(systemTheme.matches ? "dark" : "light");
  });
  addEventListener("storage", (event) => {
    if (event.key !== "sr_theme") return;
    preference = ["dark", "light"].includes(event.newValue)
      ? event.newValue
      : null;
    applyTheme(preference || (systemTheme.matches ? "dark" : "light"));
  });
  document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("theme-toggle");
    toggle.hidden = false;
    applyTheme(root.dataset.theme);
    toggle.addEventListener("click", () => {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      preference = next;
      try {
        localStorage.setItem("sr_theme", next);
      } catch {}
      if (!document.startViewTransition || reducedMotion.matches) {
        applyTheme(next);
        return;
      }
      // The new palette expands as a circle from the toggle itself.
      const rect = toggle.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      root.style.setProperty("--vt-x", x + "px");
      root.style.setProperty("--vt-y", y + "px");
      root.style.setProperty(
        "--vt-r",
        Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) +
          "px",
      );
      document.startViewTransition(() => applyTheme(next));
    });

    const intro = document.getElementById("intro-screen");
    const status = document.getElementById("intro-status");
    const timers = [];
    let finished = false;
    const oldOverflow = document.body.style.overflow;
    function finishIntro() {
      if (finished) return;
      finished = true;
      timers.forEach(clearTimeout);
      intro.classList.remove("intro-running");
      if (intro.open) intro.close();
      document.body.style.overflow = oldOverflow;
      root.dataset.intro = "complete";
      reducedMotion.removeEventListener("change", handleMotionChange);
    }
    function handleMotionChange(event) {
      if (event.matches) finishIntro();
    }
    document
      .getElementById("intro-skip")
      .addEventListener("click", finishIntro);
    intro.addEventListener("cancel", (event) => {
      event.preventDefault();
      finishIntro();
    });
    intro.addEventListener("close", finishIntro);
    // Visitors requesting less motion get the website immediately, without a flash.
    if (reducedMotion.matches || typeof intro.showModal !== "function") {
      finishIntro();
      return;
    }
    reducedMotion.addEventListener("change", handleMotionChange);
    intro.showModal();
    document.body.style.overflow = "hidden";
    root.dataset.intro = "running";
    intro.classList.add("intro-running");
    timers.push(
      setTimeout(() => {
        status.textContent = "Hold that feeling…";
      }, 1500),
    );
    timers.push(
      setTimeout(() => {
        status.textContent = "Captured. Kept forever.";
      }, 2850),
    );
    // The iris opens onto the page while the hero headline rises into place.
    timers.push(
      setTimeout(() => {
        root.dataset.intro = "exiting";
      }, 3100),
    );
    // This is a timed studio introduction, not a simulated download percentage.
    timers.push(setTimeout(finishIntro, 3500));
    addEventListener("pageshow", (event) => {
      if (event.persisted) finishIntro();
    });
  });
})();
