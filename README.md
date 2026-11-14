# HAVYN FIELD v1.0 (milestone M1)

HAVYN FIELD is an offline emergency command app for every family iPhone. It is one HTML file plus a service worker, a manifest and icons. There is no framework and no build step at runtime, and the app makes no network requests after it is installed.

## What v1 does

| Screen | What it holds |
| --- | --- |
| **Status** | Days of water, food, critical meds and power, drawn as glass towers. One family autonomy number and the resource that limits it. An outage clock, the next radio check-in, and alerts for expiring items, items stored somewhere hot, shortfalls against your target, and an overdue backup. |
| **Emergency** | Ten cards: adult CPR with a 110-per-minute metronome, child and baby CPR, choking, bleeding, anaphylaxis, stroke, heat stroke, CO alarm, burns and seizure. Any card is two taps from launch. Every card shows its source and the date it was checked. White on black, large type, no animation, and the screen stays awake. |
| **Playbooks** | Blackout and Extreme heat. Each step can be ticked off, and each playbook has a hard "leave now" rule. |
| **Family** | People, pets, the out-of-area contact, three meeting places, where to go if heat forces you out, check-in times, and utility shutoffs with photos. |
| **Supplies** | Inventory feeding the autonomy engine: days per resource, the gap to your target, expiry warnings, flags for items stored somewhere hot, and consumption mode during an outage. |
| **System** | Memory Card save, load and merge between phones by AirDrop or Files, using a SHA-256 checksum and newest-edit-wins merging. Also holds household settings and this phone's status. |

Night mode switches the app to red on black. The app follows Reduce Motion and Dynamic Type.

## Install on each iPhone (once per phone)

1. Host the `app/` folder at an HTTPS address (see Deploy below).
2. On the iPhone, open that address in Safari while online.
3. Tap **Share** (on newer iOS, tap the ··· page menu first), then **Add to Home Screen**. Leave **Open as Web App** on and tap **Add**.
4. Open HAVYN from its icon once while still online. Under System, **Offline copy** should read **Saved for offline**.
5. Turn on Airplane Mode and open HAVYN again to confirm it works offline.

Deleting the icon deletes the app's data, so keep Memory Cards on another phone and on the vault drive.

## Deploy

- **Option A: GitHub Pages.** Push this repo, then set Settings → Pages → Source to **GitHub Actions**. The workflow in `.github/workflows/pages.yml` publishes `app/`. A GitHub Pages site is public even when the repo is private, and Pages on a private repo needs GitHub Pro or higher. The app contains no family data, so public code is acceptable.
- **Option B: any static HTTPS host**, such as Cloudflare Pages or Netlify. Upload the `app/` folder.

Hosting is needed only to install and to receive updates. Once installed, phones never need the host.

## Data and privacy

- Family data stays in the phone's app storage (IndexedDB). It leaves the phone only in Memory Card files that you choose to make.
- The content security policy blocks every network request from the page: `connect-src 'none'`, and images are limited to the app's own files. The only automatic network traffic is iOS checking your own host for a newer version of the app while online.
- Family data never goes into this repo.

## Build and test

```
python3 tools/build.py              # writes app/ (deploy) and preview/ (no service worker)
node --test tests/engine.test.js    # 13 engine and content tests
python3 tests/e2e.py                # 36 end-to-end checks in headless Chrome at iPhone size
```

Edit `src/`, never `app/`. The build inlines the CSS and JS into one `index.html`, pins the script in the CSP by its SHA-256 hash, stamps a version into the service worker so phones update, and regenerates `content/cards/*.md` from `src/content.js`.

## Layout

```
havyn/
  docs/DIRECTIVE.md        operating directive for HAVYN
  docs/REFERENCE.md        architecture, data formats, sources
  docs/MISSION_STATE.md    current milestone, acceptance evidence, open items
  src/                     content.js (cards, playbooks) · engine.js · app.js · styles.css · index.html · sw.js
  app/                     built app: deploy this folder
  content/cards/*.md       each protocol card with sources and a reviewer sign-off line
  tools/build.py · tools/icons.py
  tests/engine.test.js · tests/e2e.py
```

## Status

The emergency cards were written from the cited sources and checked against them on 2026-11-14. They still need review by a trained person, an EMT or nurse, before the family relies on them. Each file in `content/cards/` ends with a sign-off line. Training beats any app: take a CPR and Stop the Bleed class.
