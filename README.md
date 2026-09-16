# SR Creation Studio

An editorial photography and film website for SR Creation Studio, Jaffna, Sri Lanka. The public site runs on GitHub Pages with plain HTML, CSS and JavaScript; there is no production build step.

## Design and features

- Responsive red, black, and white branding with the supplied studio logo and existing photography.
- Light and dark themes, a header toggle, saved visitor preference, and automatic system-theme detection.
- A 3.5-second CSS 3D camera intro: shutter press, aperture closure, and one brief flash. Skip or press Escape to enter immediately; reduced-motion visitors bypass it.
- Layered CSS 3D photo frames, gentle floating motion, pointer perspective and gallery depth.
- A motion pause button, reduced-motion support and animation suspension outside the hero.
- Album category filters, keyboard-accessible galleries and native modal dialogs with focus restoration.
- Existing wedding, ceremony and framing prices, with WhatsApp and email inquiries.
- An automated assistant that reads current package overrides.
- Read-only Firebase content sync with a local cache and bundled portfolio fallback.
- Contact details, social links, metadata and an SVG favicon.

## Run locally

With Node.js installed:

```sh
npm run dev
```

Open http://127.0.0.1:8000. Use `PORT` to change the port. The preview server binds only to the local machine.

## Test

```sh
npm ci
npx playwright install chromium
npm test
```

The tests use installed Chrome or Edge automatically on Windows. Elsewhere they use Playwright Chromium. Set `CHROME_PATH` to select another Chrome executable.

Browser tests cover five viewport widths, photo loading, filters, keyboard galleries, nested modal behavior and focus, pricing tabs, inquiry links, the assistant, storage failures, data rendering, mobile navigation, 3D motion controls, reduced motion, no-JavaScript fallback and automated WCAG A/AA accessibility checks. Firebase requests are blocked during regression tests so production content is never modified. Set `SCREENSHOT_DIR` to save review screenshots.

## Files

- `index.html`: public page structure, metadata and dialogs.
- `assets/studio.css`: visual design, responsive layouts and CSS 3D motion.
- `assets/brand.css`: logo palette, light/dark theme tokens and camera intro styling.
- `assets/appearance.js`: early theme initialization, preference storage and timed intro.
- `assets/studio-logo.jpg`: supplied studio logo, used as the default header mark and intro branding.
- `assets/studio.js`: services, default pricing, interaction and read-only Firebase integration.
- `assets/portfolio.js`: fallback albums extracted from the repository’s existing studio backup.
- `assets/photos/`: existing studio photographs stored as local WebP assets.
- `assets/favicon.svg`: studio monogram.
- `admin.html`: existing administration interface.
- `scripts/serve.cjs`: local preview server.
- `tests/smoke.cjs`: browser regression checks.
- `tests/appearance.cjs`: intro timing, skip controls, theme persistence, reduced motion, storage fallback, responsive layouts and contrast in both themes.

## Content updates

Use `admin.html` to manage albums, logo and package overrides. The public site reads the existing Firebase path `srStudioSiteData` and these keys:

`sr_albums`, `sr_logo`, `sr_packages`, `sr_pkg_categories`, `sr_album_categories`.

An admin album collection replaces the bundled fallback; an explicitly empty collection stays empty. If no saved collection exists, the bundled real studio albums appear. Remote content still renders when browser storage is unavailable or full.

The hero photographs are curated independently in `index.html`. Edit those image paths to change the homepage composition. Change default services and prices in `assets/studio.js`; contact links also appear in `index.html`.

The public page never writes to Firebase. This redesign does not change the existing admin authentication model: the admin’s local credential check is client-side. Firebase rules and authenticated write access must be managed separately in the Firebase project.

## Deployment

Push the site files to the repository’s GitHub Pages publishing branch. Asset paths are relative, so they work at:

https://kowshi1119.github.io/sr-creation-studio-website/

The website needs no Node.js service in production. NPM dependencies support local testing and the existing project setup; production Firebase SDKs load after the local page has rendered.

## Photography

The bundled wedding and graduation photographs come from `sr-studio-backup-2026-03-25.json`, already present in this repository. The redesign uses these existing assets rather than the original sample gallery entries. Original image watermarks remain intact.

## Intro and theme settings

The intro plays on each full page load and ends after 3.5 seconds, independently of Firebase or image downloads. Its duration is set in `assets/appearance.js` and matching animation timings in `assets/brand.css`. It is not a loading-percentage indicator. No audio autoplays.

The visitor’s theme choice is stored under `sr_theme`; without a saved choice the site follows the operating-system color scheme. Theme initialization runs before stylesheet rendering to avoid displaying the wrong theme first. If JavaScript is disabled, the intro stays closed and the core page remains accessible.
