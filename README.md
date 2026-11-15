# HAVYN FIELD v1.7

HAVYN FIELD is an offline emergency command app for every family iPhone, with its own offline library: a **reference shelf** of real manuals and guides filed by the system they help you run or rebuild, encyclopedias (Kiwix ZIM archives such as Wikipedia and WikiMed), PDFs, video and audio, all searchable from one box with no internet. It is one HTML file plus a service worker, a manifest, icons, HAVYN's archive reader (`zimkit.js`) and vendored copies of PDF.js (the PDF reader), pdf-lib (the binder PDF and joining chapter PDFs) and fzstd (Zstandard decompression). There is no framework and no build step at runtime. The app never sends anything anywhere; the only requests it makes go to its own address (to install, update and download shelf documents) and, when you tap Download, to Kiwix's download servers for the encyclopedias.

## What it does

| Screen | What it holds |
| --- | --- |
| **Welcome** | The first time HAVYN opens: touch to begin, then the LABS ANALYTIX open (a chime made on the phone, the HAVYN mark over the PS2 void, and HAVYN's own voice, an elegant British woman, saying "Welcome to Haven": every line is pre-recorded with Kokoro-82M (Apache-2.0, the Emma voice) and ships with the app, so it sounds the same on every phone, offline, whatever voices the phone has), then a spoken tour with a spotlight on the real screen: your level, What's happening?, the red button, Guides, Family, Supplies, Search. Opened from the Home Screen, the last step starts Download everything by itself, so a new phone needs no setup beyond adding the icon. Emergency now (always on screen) skips straight to the cards; Skip closes it; Guides and System replay it. |
| **Home** | A command deck, video-game style. Across the top, a four-cell status line: works offline, what's stored on the phone, the last Memory Card backup, online or not; the sections below are numbered 01 to 04. **Your level** (Recruit, Scout, Ranger, Guardian, Sentinel, Fortress) rises as quests are done, each worth XP: the downloads (they finish themselves), your household and your supplies (a few taps each: counts with + and −, names later), the family plan and a Memory Card; the next three quests are on Home, every quest on the Quests screen. Below it: the red **Someone's hurt** tile, then **What's happening?**: Power out, Extreme heat, Storm or flood, Smoke or fire, Water unsafe, Earthquake, Leaving home, Sick at home, each opening one screen with the first moves, the step-by-step playbook, the hard rule for leaving, the cards for anyone hurt, the manual pages and the numbers to call. Then How do I…, Library, Plan and Comms. Further down, the family status: a checklist (on the Home Screen, works offline, manuals, encyclopedias, publisher books, family plan, Memory Card) and one **Download everything** button that puts the 50 phone-set manuals and the 7 core encyclopedias (about 3.3 GB) on the phone, carries on where it stopped if the app is closed, and checks every file. Then: days of water, food, critical meds and power, drawn as glass towers. One family autonomy number and the resource that limits it. An outage clock, the next radio check-in, the next three missions, and alerts for expiring items, items stored somewhere hot, shortfalls, upkeep that is due, Black Friday, and an overdue backup. |
| **Missions** | The mission map as a checklist: Today, This week, Black Friday, December, January–February, Before May, each with its "done when" gate. Add your own missions. Upkeep (monthly, quarterly, spring, yearly) comes due again on its own. |
| **Emergency** | Twenty cards: adult CPR with a 110-per-minute metronome, child and baby CPR, choking, bleeding, heart attack, anaphylaxis, stroke, won't wake up (recovery position), heat stroke, CO alarm, burns, broken bone, seizure, and the Phoenix set: drowning, opioid overdose (naloxone), poisoning, asthma attack, low blood sugar, scorpion sting, rattlesnake bite. Any card is two taps from launch. Every card shows its source and the date it was checked, and **Go deeper on this phone** opens the exact pages behind it in the manuals on the phone. White on black, large type, no animation, and the screen stays awake. **Voice guide:** each step is read aloud in HAVYN's recorded voice as it comes up (121 recordings, saved on the phone, no internet needed), with Repeat and an on/off switch. **Times for the paramedics:** one tap stamps what was done and when (CPR started, AED shock, tourniquet on, aspirin, epinephrine, naloxone, glucagon or sugar given, cooling started, a seizure's start and end); a live timer warns, in the card's own words, when the card's wait is up (a seizure over 5 minutes, 5 minutes after epinephrine, 15 after sugar); a call to 911 from a card is logged too. **Log for responders** shows every entry with its time, ready to hand to the paramedics or read to the dispatcher; it stays on this phone, survives closing the app and clears with two taps. |
| **Guides** | **How do I…**: a field index of 64 everyday-emergency answers (injuries, water, toilets, food, fire and storms, power, radio, maps, family), each opening the exact page in the phone-set manuals; filter as you type, and Search finds them too. Playbooks (Blackout, Extreme heat, Monsoon and dust storm, Wildfire smoke or evacuation, Boil-water notice, each with a hard rule and the manual pages that go with it), **The plan** (phases, power layers, Phoenix heat rules, upkeep), **Comms** (one-tap "OK" text to the out-of-area contact, call or text 911, seven checked Phoenix numbers for power, gas, water and police, check-ins, rally points that open in Apple Maps, radio channels, the four-rung ladder), the **Library**, **Search everything** and **Get more**. |
| **Binder** | A paper copy made on the phone: family plan, phone numbers, people and their medicines, playbooks, heat rules and all twenty cards. Saved to the Library and sent to the share sheet to print, save to Files or AirDrop. |
| **Library** | One **Add files** button for ZIM archives (including split `.zimaa/.zimab` sets), PDFs, video and audio; the type comes from the file's contents. **Archives:** title search as you type, main page, random article, continue reading, text size and dark pages; pages, images, styles, video (with byte-range seeking) and PDFs inside archives all work offline. **PDFs:** contents, find, go to page, zoom; their text is indexed in the background for Search. **Video and audio:** play offline and resume where you left off. |
| **Search everything** | One box (the magnifier on every main screen): emergency cards, playbooks, plan, phone numbers, missions, buy list, your family and supplies, words inside your PDFs, and the titles in every archive on the phone. Life-safety content ranks first. |
| **Reference shelf** | Get more › Shelf: 66 real documents from the agencies and publishers who wrote them (US Army, Navy, FEMA, CDC, EPA, USDA, CISA, DOT, DOE, WHO, OpenStax, Hesperian, MSF and others), about 2.6 GB in all, filed in 12 systems: medicine and first aid, water, sanitation, food, shelter and building, power and electricity, communications, tools and trades, emergency response and survival, family and mind, science and math, maps and reference. **One tap** puts a document on the phone from HAVYN's own address, checked against its SHA-256; **Get the phone set** (or Download everything on Status) fetches the 50 shareable phone documents (about 505 MB) at once; the rest (full textbooks, trade courses) go on the vault drive. Public-domain and Creative Commons documents are mirrored by the `shelf` workflow; documents under their publisher's terms (Hesperian, MSF, University of Arizona, NCTSN) link to the publisher and are never re-hosted. Hesperian's chapter PDFs, added together, are joined into one book. A comparison with other offline libraries (N.O.M.A.D., Internet-in-a-Box, RACHEL, PrepperDisk, Kiwix, Survivor Library, Manual for Civilization) explains what HAVYN took from each. |
| **Get more** | The archive catalog, checked 2026-11-14. **Phone:** the core set every phone should carry (WikiMed, post-disaster, water, food, medical, knots, kids' encyclopedia, about 2.8 GB), with what's already on this phone ticked automatically. **Get the core set** downloads them straight into HAVYN from Kiwix's mirror, in 32 MB parts that survive a dropped connection or a closed app, checked against Kiwix's SHA-256 (or, if Kiwix's checksum can't be fetched, the checksum inside the ZIM file) before they're added. **Apps:** Kiwix, Organic Maps, Meshtastic, VLC, PocketPal AI, and the iPhone's own offline dictionaries and Translate languages. **Drive:** everything for the vault drive (core set about 163 GB, everything about 424 GB) and the one-line command that fills it. **Home:** how one laptop, iPad or Raspberry Pi shares the whole drive over home Wi-Fi, and where to save its address. |
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
- The content security policy blocks every network request from the page except to HAVYN's own address (`connect-src 'self'`, for shelf documents) and Kiwix's download servers (`mirror.download.kiwix.org`, `download.kiwix.org`, `lb.download.kiwix.org`, for the encyclopedias), and images are limited to the app's own files. Nothing is ever sent: requests carry no family data, no cookies and no referrer. Downloads start only when you tap Download (or carry on one you started); the only other automatic traffic is iOS checking your own host for a newer version of the app while online.
- Library files (archives, PDFs, video, audio) stay on the phone that imported them and are not included in Memory Cards. A Home Screen web app on iOS 17 or later may store up to about 60% of the phone's disk (WebKit storage policy), and HAVYN asks iOS to keep its storage persistent.
- **Archives can't run code.** ZIM pages are served by the service worker with `script-src 'none'` and shown in a frame sandboxed without scripts; when the service worker isn't running, pages are rebuilt with scripts, inline handlers and forms removed. Archive pages can't reach your family data or the network. Archives that need their own scripts (Zimit website copies) are flagged to open in Kiwix instead.
- Family data never goes into this repo.

## Build and test

```
python3 tools/build.py              # writes app/ (deploy), preview/ (no service worker) and vault/ (drive kit)
node --test tests/engine.test.js    # 28 engine, content, catalog, field-index and checksum tests
node tests/zimkit.test.js           # 208 archive-reader checks (openzim test suite + XZ reference vectors)
python3 tests/e2e.py                # 91 end-to-end checks in headless Chrome at iPhone size
python3 tests/e2e_v13.py            # 76 library, reader, search and Get more checks (with and without the service worker)
python3 tests/e2e_v14.py            # 31 reference shelf checks: one-tap downloads with checksums, chapter joining, search, offline and no-shelf fallbacks
python3 tests/e2e_v15.py            # 72 checks (the welcome and its recorded voice, the Home deck, situations and quick setup included): Download everything against a fake cross-origin Kiwix mirror (parts, drop and resume, reload and resume, back online, corrupt file refused, SHA-256 and ZIM MD5 checks), the field index and its page links
python3 tests/shelf_fetch_test.py   # 27 checks of the shelf fetcher against a fake web (needs reportlab)
```

`tests/zimkit.test.js` needs the openzim test archives (`git clone https://github.com/openzim/zim-testing-suite`) and XZ vectors made by `python3 tests/xzvec.py` (see `tests/README-zim.md`). `tests/mkzim.py` writes the hostile fixture archive used by the end-to-end tests.

Edit `src/`, never `app/`. The build inlines the CSS and JS into one `index.html`, pins the script in the CSP by its SHA-256 hash, stamps a version into the service worker so phones update, and regenerates `content/cards/*.md` from `src/content.js`.

## The reference shelf pipeline

`src/content.js` (`shelf`) is the catalog. The build writes `shelf/catalog.json`; `.github/workflows/shelf.yml` (on change, monthly, or by hand) runs `tools/shelf_fetch.py` on GitHub's servers. For each document it tries, in order: the publisher's links (`src`); Internet Archive items and searches, OpenStax books and DSpace repositories such as WHO IRIS (`ia`, `ias`, `ox`, `dspace`); other copies (`alt`); then, for publishers that block cloud servers (FAS, PHMSA, defense.gov, navy.mil), the Wayback Machine's stored copy of the publisher's own file, chosen from its capture index (only captures that were PDFs) and requested slowly, one at a time, stopping for the build if the Wayback Machine starts refusing; and finally `parts` joined into one PDF. Each file must be a complete, readable PDF; `expect` (a pattern) must appear in its first pages, so a mirror can't hand over the wrong document or edition; `minpages` refuses a single chapter passed off as a book; `strip` takes off a cover page a re-host added. Hesperian books are discovered chapter by chapter. The workflow records size, SHA-256, page count, first words and, for Creative Commons documents, the license line the PDF itself states, then attaches the public-domain and Creative Commons files, `shelf-index.json`, `shelf-files.tsv`, `SHA256SUMS.txt` and `HAVYN-shelf-phone.zip` to the repository's `shelf` release, uploading only files that changed. If a publisher is down on build day, last build's checked copy is kept and the report says so. Run it by hand with `only` (ids) to test a few documents, plus `publish` to publish what they find and keep everything else. It then redeploys Pages, where `tools/shelf_pages.py` copies the phone set into `app/shelf/` so phones download from HAVYN's own address, and writes `app/shelf/archives.json`: for each phone archive in `shelf/kiwix.json`, the newest file in Kiwix's directory, its exact size from the mirror (which must allow downloads from web pages) and Kiwix's SHA-256 (refreshed weekly). `.github/workflows/probe.yml` (`tools/shelf_probe.py`) checks from GitHub's network how a server answers: status, size, CORS and small text bodies such as checksum files. Documents under their publisher's terms are downloaded only to check the link and are never uploaded.

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
  tools/build.py · tools/icons.py · tools/vault.py · tools/shelf.py · tools/shelf_fetch.py · tools/shelf_pages.py · tools/shelf_probe.py
  tests/engine.test.js · tests/zimkit.test.js · tests/e2e.py · tests/e2e_v13.py · tests/e2e_v14.py · tests/e2e_v15.py · tests/shelf_fetch_test.py · tests/mkzim.py · tests/tinypdf.py · tests/xzvec.py · tests/fixtures/
```

## Status

The emergency cards were written from the cited sources and checked against them on 2026-11-14 (heart attack, won't wake up, broken bone and poisoning on 2026-11-15). The field index's 108 page links were checked against the text of the shipped files on 2026-11-15. They still need review by a trained person, an EMT or nurse, before the family relies on them. Each file in `content/cards/` ends with a sign-off line. Training beats any app: take a CPR and Stop the Bleed class.
