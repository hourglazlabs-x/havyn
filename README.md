# HAVYN FIELD v1.4

HAVYN FIELD is an offline emergency command app for every family iPhone, with its own offline library: a **reference shelf** of real manuals and guides filed by the system they help you run or rebuild, encyclopedias (Kiwix ZIM archives such as Wikipedia and WikiMed), PDFs, video and audio, all searchable from one box with no internet. It is one HTML file plus a service worker, a manifest, icons, HAVYN's archive reader (`zimkit.js`) and vendored copies of PDF.js (the PDF reader), pdf-lib (the binder PDF and joining chapter PDFs) and fzstd (Zstandard decompression). There is no framework and no build step at runtime. The app never sends anything anywhere; the only requests it makes go to its own address, to install, update and download shelf documents.

## What it does

| Screen | What it holds |
| --- | --- |
| **Status** | Days of water, food, critical meds and power, drawn as glass towers. One family autonomy number and the resource that limits it. An outage clock, the next radio check-in, the next three missions, and alerts for expiring items, items stored somewhere hot, shortfalls, upkeep that is due, Black Friday, and an overdue backup. |
| **Missions** | The mission map as a checklist: Today, This week, Black Friday, December, January–February, Before May, each with its "done when" gate. Add your own missions. Upkeep (monthly, quarterly, spring, yearly) comes due again on its own. |
| **Emergency** | Sixteen cards: adult CPR with a 110-per-minute metronome, child and baby CPR, choking, bleeding, anaphylaxis, stroke, heat stroke, CO alarm, burns, seizure, and the Phoenix set: drowning, opioid overdose (naloxone), asthma attack, low blood sugar, scorpion sting, rattlesnake bite. Any card is two taps from launch. Every card shows its source and the date it was checked. White on black, large type, no animation, and the screen stays awake. |
| **Guides** | Playbooks (Blackout, Extreme heat, Monsoon and dust storm, Wildfire smoke or evacuation, Boil-water notice, each with a hard rule), **The plan** (phases, power layers, Phoenix heat rules, upkeep), **Comms** (one-tap "OK" text to the out-of-area contact, call or text 911, seven checked Phoenix numbers for power, gas, water and police, check-ins, rally points that open in Apple Maps, radio channels, the four-rung ladder), the **Library**, **Search everything** and **Get more**. |
| **Binder** | A paper copy made on the phone: family plan, phone numbers, people and their medicines, playbooks, heat rules and all sixteen cards. Saved to the Library and sent to the share sheet to print, save to Files or AirDrop. |
| **Library** | One **Add files** button for ZIM archives (including split `.zimaa/.zimab` sets), PDFs, video and audio; the type comes from the file's contents. **Archives:** title search as you type, main page, random article, continue reading, text size and dark pages; pages, images, styles, video (with byte-range seeking) and PDFs inside archives all work offline. **PDFs:** contents, find, go to page, zoom; their text is indexed in the background for Search. **Video and audio:** play offline and resume where you left off. |
| **Search everything** | One box (the magnifier on every main screen): emergency cards, playbooks, plan, phone numbers, missions, buy list, your family and supplies, words inside your PDFs, and the titles in every archive on the phone. Life-safety content ranks first. |
| **Reference shelf** | Get more › Shelf: 62 real documents from the agencies and publishers who wrote them (US Army, Navy, FEMA, CDC, EPA, USDA, CISA, DOT, DOE, WHO, OpenStax, Hesperian, MSF and others), filed in 12 systems: medicine and first aid, water, sanitation, food, shelter and building, power and electricity, communications, tools and trades, emergency response and survival, family and mind, science and math, maps and reference. **One tap** puts a document on the phone from HAVYN's own address, checked against its SHA-256; **Get the phone set** fetches about 25 of them at once. Public-domain and Creative Commons documents are mirrored by the `shelf` workflow; documents under their publisher's terms (Hesperian, MSF, University of Arizona, NCTSN) link to the publisher and are never re-hosted. Hesperian's chapter PDFs, added together, are joined into one book. A comparison with other offline libraries (N.O.M.A.D., Internet-in-a-Box, RACHEL, PrepperDisk, Kiwix, Survivor Library, Manual for Civilization) explains what HAVYN took from each. |
| **Get more** | The archive catalog, checked 2026-11-14. **Phone:** the core set every phone should carry (WikiMed, post-disaster, water, food, medical, knots, kids' encyclopedia, about 2.8 GB), with what's already on this phone ticked automatically. **Apps:** Kiwix, Organic Maps, Meshtastic, VLC, PocketPal AI, and the iPhone's own offline dictionaries and Translate languages. **Drive:** everything for the vault drive (core set about 163 GB, everything about 424 GB) and the one-line command that fills it. **Home:** how one laptop, iPad or Raspberry Pi shares the whole drive over home Wi-Fi, and where to save its address. |
| **Family** | People, pets, the out-of-area contact, three meeting places, where to go if heat forces you out, check-in times, radio channels, and utility shutoffs with photos. |
| **Supplies** | Inventory feeding the autonomy engine, plus the **Buy list**: 43 items in four tiers with quantities sized to your household, the $564 safety floor, To buy / Ordered / Have, deal rules, and one tap to move a bought item into the inventory. |
| **System** | Memory Card save, load and merge between phones by AirDrop or Files, using a SHA-256 checksum and newest-edit-wins merging (missions and buy-list status travel too). Also holds household settings and this phone's status. |

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
- The content security policy blocks every network request from the page except to HAVYN's own address (`connect-src 'self'`, used only to download shelf documents you ask for), and images are limited to the app's own files. Nothing is ever sent: requests carry no family data. The only automatic network traffic is iOS checking your own host for a newer version of the app while online.
- Library files (archives, PDFs, video, audio) stay on the phone that imported them and are not included in Memory Cards. A Home Screen web app on iOS 17 or later may store up to about 60% of the phone's disk (WebKit storage policy), and HAVYN asks iOS to keep its storage persistent.
- **Archives can't run code.** ZIM pages are served by the service worker with `script-src 'none'` and shown in a frame sandboxed without scripts; when the service worker isn't running, pages are rebuilt with scripts, inline handlers and forms removed. Archive pages can't reach your family data or the network. Archives that need their own scripts (Zimit website copies) are flagged to open in Kiwix instead.
- Family data never goes into this repo.

## Build and test

```
python3 tools/build.py              # writes app/ (deploy), preview/ (no service worker) and vault/ (drive kit)
node --test tests/engine.test.js    # 22 engine, content and catalog tests
node tests/zimkit.test.js           # 208 archive-reader checks (openzim test suite + XZ reference vectors)
python3 tests/e2e.py                # 83 end-to-end checks in headless Chrome at iPhone size
python3 tests/e2e_v13.py            # 76 library, reader, search and Get more checks (with and without the service worker)
python3 tests/e2e_v14.py            # reference shelf: one-tap downloads with checksums, chapter joining, search, offline and no-shelf fallbacks
```

`tests/zimkit.test.js` needs the openzim test archives (`git clone https://github.com/openzim/zim-testing-suite`) and XZ vectors made by `python3 tests/xzvec.py` (see `tests/README-zim.md`). `tests/mkzim.py` writes the hostile fixture archive used by the end-to-end tests.

Edit `src/`, never `app/`. The build inlines the CSS and JS into one `index.html`, pins the script in the CSP by its SHA-256 hash, stamps a version into the service worker so phones update, and regenerates `content/cards/*.md` from `src/content.js`.

## The reference shelf pipeline

`src/content.js` (`shelf`) is the catalog. The build writes `shelf/catalog.json`; `.github/workflows/shelf.yml` (on change, monthly, or by hand) runs `tools/shelf_fetch.py` on GitHub's servers: it downloads every document from its publisher (several mirrors per document, Internet Archive and OpenStax lookups, Hesperian chapter discovery, multi-part books joined), checks each is a real PDF, records its size, SHA-256, page count and first words, and attaches the public-domain and Creative Commons files, `shelf-index.json`, `shelf-files.tsv`, `SHA256SUMS.txt` and `HAVYN-shelf-phone.zip` to the repository's `shelf` release. It then redeploys Pages, where `tools/shelf_pages.py` copies the phone set into `app/shelf/` so phones download from HAVYN's own address. Documents under their publisher's terms are downloaded only to check the link and are never uploaded.

## The vault drive

`vault/` holds the drive kit, generated from the same catalog the app shows: `get-vault.sh` (Mac and Linux), `get-vault.ps1` (Windows) and `START-HERE.html`. One command fills a 1–2 TB exFAT drive with the newest copy of every item, resumes after interruptions, checks each Kiwix archive against Kiwix's published SHA-256 and removes superseded copies. It also copies the whole reference shelf into `10-shelf/<system>/`, using the checked list from the `shelf` release (mirror links and SHA-256s; publisher links for the rest, with Hesperian books in chapter folders), or the publishers' links if GitHub can't be reached. See `vault/README.md`.

## Layout

```
havyn/
  docs/DIRECTIVE.md        operating directive for HAVYN
  docs/REFERENCE.md        architecture, data formats, sources
  docs/MISSION_STATE.md    current milestone, acceptance evidence, open items
  src/                     content.js (cards, playbooks, missions, buy list, plan, comms, archive catalog, reference shelf) · engine.js · app.js · styles.css · index.html · sw.js · zimkit.js (ZIM reader + XZ decoder)
  vendor/pdfjs/            PDF.js legacy build (Apache-2.0), copied into app/pdfjs/ by the build
  vendor/pdflib/           pdf-lib 1.17.1 (MIT), copied into app/pdflib/ by the build
  vendor/fzstd/            fzstd 0.1.1 (MIT), bundled into app/zimkit.js by the build
  vault/                   drive kit: get-vault.sh · get-vault.ps1 · START-HERE.html (generated)
  app/                     built app: deploy this folder
  content/cards/*.md       each protocol card with sources and a reviewer sign-off line
  shelf/catalog.json       the shelf catalog for the fetch workflow (generated)
  tools/build.py · tools/icons.py · tools/vault.py · tools/shelf.py · tools/shelf_fetch.py · tools/shelf_pages.py
  tests/engine.test.js · tests/zimkit.test.js · tests/e2e.py · tests/e2e_v13.py · tests/e2e_v14.py · tests/mkzim.py · tests/xzvec.py · tests/fixtures/
```

## Status

The emergency cards were written from the cited sources and checked against them on 2026-11-14. They still need review by a trained person, an EMT or nurse, before the family relies on them. Each file in `content/cards/` ends with a sign-off line. Training beats any app: take a CPR and Stop the Bleed class.
