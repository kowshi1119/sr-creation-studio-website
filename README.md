# SR Creation Studio

An editorial photography and film website for SR Creation Studio, Jaffna, Sri Lanka. The public site runs on GitHub Pages with plain HTML, CSS and JavaScript; there is no production build step.

## Design and features

- Responsive red, black, and white branding with the supplied studio logo and existing photography.
- Light and dark themes, a header toggle, saved visitor preference, and automatic system-theme detection.
- A 3.5-second CSS 3D camera intro, played once per browser session: shutter press, aperture closure, one brief flash and an iris onto the page. Skip or press Escape to enter immediately; reduced-motion visitors bypass it.
- An editorial hero that names the studio, the work and the place, beside a borderless spread of real photographs on independent 3D depth planes that follow the pointer.
- Selected Stories: each album is a numbered spread with its title and only the real details it has (category, location, month and year, photograph count). Empty fields are left out.
- A full-screen story reader that sequences each album by photograph shape (landscapes run wide, portraits pair up), opens the existing lightbox, moves to the previous or next story, and ends with an enquiry.
- A studio index of services as numbered rows; on a mouse or trackpad, rows preview a real album cover from the matching category. Descriptions never depend on hover.
- An editorial studio spread, a process that holds its heading still on wide screens, and packages set as a comparable ledger on wide screens and cards on smaller ones.
- A structured enquiry form that composes a WhatsApp message or email from only the fields a visitor fills in. Nothing is sent or stored by the site.
- Restrained motion: headline and photo entrance, scroll hand-off, one curtain reveal for photographs, filter pill, tab rule, dialog entrances, header and progress line, film grain, a "View story" label over covers and a circular theme change. Motion pause, reduced-motion support and suspension outside the hero.
- Album category filters, keyboard-accessible galleries and native modal dialogs with focus restoration.
- A single type scale (size tokens in `assets/studio.css`): Cormorant Garamond for headings, prices and section labels, DM Sans for reading text, a 12px minimum for visible text, aligned figures for prices, and arrows only on buttons and links that leave the site.
- Existing wedding, ceremony and framing prices, with WhatsApp and email inquiries.
- An automated assistant that reads current package overrides.
- Read-only Firestore content sync with a local cache and bundled portfolio fallback; story photographs load when a story opens.
- Contact details, social links, metadata, structured data built only from verified studio details, and an SVG favicon.

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

Browser tests cover up to eleven viewport widths, the stories and story reader, the studio index, the enquiry message format, structured data, image loading priorities, layout stability, photo loading, filters, keyboard galleries, nested modal behavior and focus, pricing tabs, inquiry links, the assistant, storage failures, admin publishing to Firestore (one document per photo, edits that write only what changed, sign-in, import and deletion), data rendering, mobile navigation, 3D motion controls, reduced motion, no-JavaScript fallback and automated WCAG A/AA accessibility checks. Firebase requests are blocked or replaced by an in-memory stand-in during regression tests, so production content is never modified. Set `SCREENSHOT_DIR` to save review screenshots.

## Files

- `index.html`: public page structure, metadata and dialogs.
- `assets/studio.css`: visual design, responsive layouts and CSS 3D motion.
- `assets/brand.css`: logo palette, light/dark theme tokens and camera intro styling.
- `assets/appearance.js`: early theme initialization, preference storage, theme transition and timed intro.
- `assets/motion.css`: the motion and depth layer, loaded after `brand.css`; hidden “before” states apply only when motion is allowed.
- `assets/motion.js`: hero pointer depth, header and progress line, reveals, filter pill and the "View story" label; a progressive enhancement the page does not depend on.
- `assets/studio-logo.jpg`: supplied studio logo, used as the default header mark and intro branding.
- `assets/studio.js`: services, default pricing, interaction and read-only Firestore integration.
- `assets/portfolio.js`: fallback albums extracted from the repository’s existing studio backup, with each photograph's real width and height.
- `assets/photos/`: existing studio photographs stored as local WebP assets.
- `assets/favicon.svg`: studio monogram.
- `admin.html`: existing administration interface.
- `scripts/serve.cjs`: local preview server.
- `tests/smoke.cjs`: browser regression checks.
- `tests/appearance.cjs`: intro timing, skip controls, theme persistence, reduced motion, storage fallback, responsive layouts and contrast in both themes.
- `tests/typography.cjs`: minimum text sizes at five widths and in every overlay, reading sizes, proportional heading tracking, serif headings and prices, aligned figures, label style and key copy.
- `tests/experience.cjs`: hero hierarchy and image priority, data-driven stories, story sequencing and navigation, studio index previews, enquiry messages, structured data, layout stability, reduced motion and eleven widths in both themes.

## Content updates

Use `admin.html` to manage albums, photos, logo and package overrides. Content lives in **Cloud Firestore** (project `sr-creation-studio-web`):

- `site/settings`: `logo`, `packages`, `pkgCategories`, `albumCategories`.
- `albums/{albumId}`: title, category, date, location, description, cover image, `photoCount` and `sortOrder`.
- `albums/{albumId}/photos/{photoId}`: `imageUrl`, `caption`, `sortOrder`, `width`, `height`; one photograph per document.

The public site reads the albums without their photographs and loads a story’s photographs when it is opened. While Firestore has no albums, or cannot be reached, the bundled studio albums in `assets/portfolio.js` appear. When the cloud is empty, the admin offers **Import saved albums**, which copies those bundled albums, and any albums saved earlier in that browser, into Firestore once so they can be edited there. Remote content still renders when browser storage is unavailable or full.

Story covers use each album's `coverImage`; choose covers without a text banner at the top for the cleanest crop. Photographs with a recorded `width` and `height` are sequenced immediately in the story reader; others are measured once they load. The studio index previews the cover of the first published album in the matching category, so previews appear as albums are added.

The hero photographs are curated independently in `index.html`. Edit those image paths to change the homepage composition. Change default services and prices in `assets/studio.js`; contact links also appear in `index.html`.

Photos uploaded in the admin are compressed to WebP (re-compressed if needed to stay under Firestore’s 1 MiB document limit) and saved as their own documents, so an upload writes only its new photographs and an edit only what changed. The admin reports “published to the website” only after Firestore confirms the write, and shows the Firestore error when it is refused. Album photographs are not copied into the browser’s local storage, so its size limit no longer matters.

The public page never writes to Firebase. When Firebase is available, `admin.html` signs in with a Firebase email/password account, and only that account may write. Without Firebase, the admin falls back to its local credential check and saves on that device only.

### Firebase setup (once)

1. **Firestore:** create the `(default)` database in Native mode (for example `gcloud firestore databases create --location=asia-south1 --type=firestore-native`).
2. **Authentication → Get started → Sign-in method:** enable **Email/Password**.
3. **Authentication → Users → Add user:** enter the studio’s email and a strong password, then copy the new user’s **User UID**.
4. **Firestore → Rules:** publish `firestore.rules` with `REPLACE_WITH_ADMIN_UID` replaced by that UID (or run `firebase deploy --only firestore:rules` after editing it). Everyone can read the content; only the admin account can write.
5. Open `admin.html`, sign in with that email and password, and choose **Import saved albums** (copies the built-in albums and any saved in that browser) or upload. The admin confirms “published to the website!”, or shows the Firestore error if a write is refused.

The password can be changed under Settings in the admin, or reset from the Firebase console.

## Deployment

Push the site files to the repository’s GitHub Pages publishing branch. Asset paths are relative, so they work at:

https://kowshi1119.github.io/sr-creation-studio-website/

The website needs no Node.js service in production. NPM dependencies support local testing and the existing project setup; production Firebase SDKs load after the local page has rendered.

## Photography

The bundled wedding and graduation photographs come from `sr-studio-backup-2026-03-25.json`, already present in this repository. The redesign uses these existing assets rather than the original sample gallery entries. Original image watermarks remain intact.

## Intro and theme settings

The intro plays once per browser session (stored under `sr_intro_seen` in session storage) and ends after 3.5 seconds, independently of Firebase or image downloads. Its duration is set in `assets/appearance.js` and matching animation timings in `assets/brand.css`. It is not a loading-percentage indicator. No audio autoplays.

The visitor’s theme choice is stored under `sr_theme`; without a saved choice the site follows the operating-system color scheme. Theme initialization runs before stylesheet rendering to avoid displaying the wrong theme first. If JavaScript is disabled, the intro stays closed and the core page remains accessible.

## Motion

Every animation in `assets/motion.css` sits behind `prefers-reduced-motion: no-preference` or the existing `motion-enabled` class, so visitors who ask for less motion get a still, fully visible page. The hero “Pause motion” button also stops the pointer depth and the "View story" label. Pointer effects only run for a mouse or trackpad. Scroll-driven effects use CSS scroll timelines where the browser supports them and are simply skipped elsewhere. Only `transform`, `opacity` and `clip-path` are animated, and no animation library or WebGL is used.
