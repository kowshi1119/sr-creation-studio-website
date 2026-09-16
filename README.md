# SR Creation Studio

An editorial photography and film website for SR Creation Studio, Jaffna, Sri Lanka. The public site runs on GitHub Pages with plain HTML, CSS and JavaScript; there is no production build step.

## Design and features

- Responsive ivory and charcoal layout with the studio’s existing photography.
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
- `assets/studio.js`: services, default pricing, interaction and read-only Firebase integration.
- `assets/portfolio.js`: fallback albums extracted from the repository’s existing studio backup.
- `assets/photos/`: existing studio photographs stored as local WebP assets.
- `assets/favicon.svg`: studio monogram.
- `admin.html`: existing administration interface.
- `scripts/serve.cjs`: local preview server.
- `tests/smoke.cjs`: browser regression checks.

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
