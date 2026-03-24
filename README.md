# SR Creation Studio Website

A cinematic, single-page portfolio website with a built-in admin portal for managing photos, logo branding, and admin credentials.

## Overview

This project is a static frontend website made of two HTML files:

- Public site: [index.html](index.html)
- Admin portal: [admin.html](admin.html)

The public site includes service highlights, portfolio filtering, a booking modal, a WhatsApp CTA, and a branded visual style. The admin portal lets you upload/manage portfolio photos, update the studio logo, and change the admin password.

## Key Features

### Public Website

- Cinematic loader animation with camera aperture and flash effects
- Responsive navigation and mobile menu
- Service cards with booking modal actions
- Portfolio grid with category filters and lightbox preview
- WhatsApp and email booking links
- Dynamic logo loading from admin-managed data

### Admin Portal

- Login screen with editable credentials
- Dashboard summary by category
- Photo management (view, filter, delete, clear all)
- Photo upload from local files (stored as data URLs)
- Photo add-by-URL flow with preview
- Logo upload/remove for public site branding
- Password change flow

## Project Structure

- [index.html](index.html): Public-facing website UI, animations, portfolio rendering, and logo loading
- [admin.html](admin.html): Admin UI, authentication logic, photo/logo management, and settings

## Tech Stack

- HTML5
- CSS3 (custom styles)
- Tailwind CSS (CDN in [index.html](index.html))
- Vanilla JavaScript (no build step, no framework)
- Browser localStorage for persistence

## Run Locally (Windows)

No installation is required for basic usage.

### Option 1: Open directly in browser

1. Open [index.html](index.html) in your browser.
2. Scroll to footer and click Admin Portal, or open [admin.html](admin.html) directly.

### Option 2: Serve with a local static server (recommended)

From the project folder:

```powershell
python -m http.server 8000
```

Then open:

- Public site: http://localhost:8000/index.html
- Admin portal: http://localhost:8000/admin.html

Alternative using Node (if installed):

```powershell
npx serve .
```

## Admin Access

Default credentials in the current implementation:

- Username: `admin`
- Password: `srcstudio2024`

After login:

1. Open Settings in the sidebar.
2. Use Change Password to set a strong password.

Security note: This is client-side-only auth stored in browser localStorage. It is suitable for local/small controlled use, not for high-security production use.

## Data Persistence Model

All app data is stored in the browser via localStorage.

- `sr_photos`: Uploaded/admin-added portfolio photos
- `sr_logo`: Uploaded logo image (data URL)
- `sr_admin_creds`: Admin username/password object

Behavior summary:

- [admin.html](admin.html) writes and manages these values.
- [index.html](index.html) reads `sr_photos` and `sr_logo` to render dynamic portfolio/logo content.
- Data is browser-specific. Using another browser or cleared storage will show defaults again.

## Content & Branding Customization

### Public Site Changes

Edit [index.html](index.html) to change:

- Services list and descriptions (`SERVICES` array)
- Default portfolio seed (`DEFAULT_PHOTOS` array)
- Contact links and social links
- Hero/footer text and visual sections

### Admin Behavior Changes

Edit [admin.html](admin.html) to change:

- Login and credential rules
- Categories and dashboard stats
- Upload/preview/deletion flows
- Logo handling and settings UI

## Troubleshooting

### Admin login fails

- Confirm credentials were entered correctly.
- If credentials were changed and forgotten, clear localStorage for this site and use defaults again.

### Photos or logo not showing on the public site

- Make sure you are opening the same origin (same file path or same localhost port) used in admin.
- Refresh [index.html](index.html) after admin changes.

### URL image preview fails in admin

- The provided URL may be invalid or blocked.
- Try a direct image URL ending in a valid image resource.

### Need a full reset

In browser DevTools Console on the same origin:

```javascript
localStorage.removeItem('sr_photos');
localStorage.removeItem('sr_logo');
localStorage.removeItem('sr_admin_creds');
```

Then reload [index.html](index.html) and [admin.html](admin.html).

## Limitations

- No backend/database; everything is browser-local
- No multi-user authentication
- Data is not shared across devices/browsers unless exported manually

## Next Improvements (Optional)

- Add backend storage (database/object storage)
- Replace localStorage auth with secure server-side auth
- Add image optimization/compression before save
- Add export/import tools for admin data backup
