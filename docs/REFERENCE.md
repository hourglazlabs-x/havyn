# HAVYN: architecture and reference

## Four layers

| Layer | Device | Holds | Works when |
| --- | --- | --- | --- |
| PAPER | Binder and go-bag cards | Plan, contacts, meds, Tier 0 cards, maps | Always |
| FIELD | Every family iPhone | This app, plus Kiwix, WikiMed and offline maps | While charged |
| CORE | Raspberry Pi 5 or laptop (M3) | The full library and the app over its own Wi-Fi | Within its Wi-Fi range |
| VAULT | Two USB drives, exFAT (M4) | Everything, installers and Memory Cards | On any laptop or iPhone |

## FIELD app

**Files**

| File | Role |
| --- | --- |
| `app/index.html` | The whole app, about 120 KB. |
| `app/sw.js` | Service worker: caches the app at install, then serves it with no network. |
| `app/manifest.webmanifest` | Name, icons and standalone display. |
| `app/*.png` | Icons. |

**Storage.** IndexedDB, database `havyn-field`, store `kv`. The keys are:
- `state`: household data, merged across phones.
- `prefs`: settings for this phone only (theme, sound, phone name, last backup).
- `photo:<id>`: JPEG data URLs.

**Network.** The CSP sets `connect-src 'none'`. Images may come only from `'self'`, `data:` and `blob:`. The one inline script is pinned by its SHA-256 hash.

### State shape

```
settings { season: auto|normal|heat, targetDays, loadWhNormal, loadWhHeat, solarW, sunHours, checkins[], updated }
plan     { contactName, contactPhone, rally1..3, leaveTo, leaveNotes, gas, water, power, <k>Photo, updated }
outage   { active, startedAt, endedAt, updated }
checks   { <playbookId>: { "<phase>.<item>": timestamp }, updated }
people[] { id, name, ageBand: infant|child|teen|adult|senior, kcal?, conditions, meds, allergies, blood, doctor, device, notes, updated }
pets[]   { id, name, species, weightLb, notes, updated }
items[]  { id, category: water|food|meds|power|gear, name, qty, per_unit {gal|kcal|doses|wh}, per_day?, critical?, owner?, location, expires, min_qty, notes, updated }
log[]    { id, t, itemId, delta, res, amount, updated }
```

A deleted record becomes a tombstone, `{ id, deleted: true, updated }`, so deletions carry over when phones merge.

### Memory Card file

```
{ "format": "havyn.memorycard", "version": 1, "app": "HAVYN FIELD <version>", "exported": ISO-8601,
  "device": "<phone name>", "checksum": sha256(JSON.stringify(data)), "data": { ...state }, "photos": { id: dataURL } }
```

**Merge.** For each record, the newest `updated` wins. Records with no conflict are added. Log entries are combined.

**Replace.** Loading with Replace overwrites everything on this phone with the card's contents.

### Autonomy engine (`src/engine.js`)

- Days for a resource: `D = S / N`, where S is stock and N is daily need.
- Family number: `min(D_water, D_food, D_critical_meds)`.
- Daily water need: `m·P + Σ dog_weight_lb / 128`, where P is people, m = 1 gallon per person in normal mode and 2 in heat mode. Auto mode uses heat from May to September.
- Daily food need: the sum of each person's kcal. Planning estimates by age band are infant 0 (track formula separately), child 1,400, teen 2,200, adult 2,000 and 65+ 1,800. Each person can override theirs.
- Gap to target T: `max(0, T·N − S)`.
- Power days: `B·0.85 / (L − PV)`, with `PV = panel W × sun hours × 0.7`. If PV covers the load, power shows as unlimited.
- Consumption mode: once an outage has run 12 hours, logged use per day replaces the planning need for that resource.
- Status colors: green at 14 days or more, amber at 3 to 13, red under 3.

### Install facts (iOS)

- Free Apple ID builds stop opening after 7 days, and TestFlight builds after 90. A Home Screen web app does not expire. Sources: [Apple TestFlight](https://developer.apple.com/help/app-store-connect/test-a-beta-version/overview-of-testflight/), [Expo](https://expo.dev/blog/apple-developer-program-explained-free-vs-paid).
- From iOS 26, every site added to the Home Screen opens as a web app by default. Source: [MacRumors](https://www.macrumors.com/guide/ios-26-safari-features/).
- Service workers need HTTPS. GitHub Pages sites are public even from a private repo. Source: [GitHub Docs](https://help.github.com/articles/what-is-github-pages).

## Content sources

Each card's sources are listed in `src/content.js` and in `content/cards/*.md`. The main ones:

- **CPR:** [AHA Adult BLS guidelines](https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-basic-life-support) and [AHA Hands-Only CPR](https://www.heart.org/-/media/Files/Nation-of-Lifesavers/How-to-Perform-CPR-Infographic.pdf).
- **CPR, child and baby:** [AHA Pediatric BLS guidelines](https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/pediatric-basic-life-support).
- **Choking:** [AHA 2025 guideline highlights](https://newsroom.heart.org/news/updated-cpr-guidelines-tackle-choking-response-opioid-related-emergencies-and-a-revised-chain-of-survival).
- **Bleeding:** [Stop the Bleed booklet](https://police.ucsd.edu/_files/Stop-the-Bleed.pdf) and [Red Cross: how to apply a tourniquet](https://www.redcross.org/take-a-class/resources/articles/how-to-apply-a-tourniquet).
- **Anaphylaxis:** [FARE emergency care plan, 8/2025](https://www.vdh.virginia.gov/content/uploads/sites/58/ECP-FAAP-FARE-Food-Allergy-and-Anaphylaxis-Emergency-Care-Plan.pdf), [2024 AHA and Red Cross first aid guidelines](https://cpr.heart.org/en/resuscitation-science/2024-first-aid-guidelines) and [Cleveland Clinic](https://health.clevelandclinic.org/how-to-use-an-epipen).
- **Stroke:** [American Stroke Association](https://www.stroke.org/stroke-facts) and [CDC](https://www.cdc.gov/stroke/signs-symptoms/index.html).
- **Heat stroke:** [Red Cross](https://www.redcross.org/take-a-class/resources/learn-first-aid/heat-stroke) and [CDC](https://www.cdc.gov/disasters/extremeheat/pdf/Heat_Related_Illness.pdf).
- **CO:** [CPSC](https://www.cpsc.gov/Safety-Education/Safety-Education-Centers/Carbon-Monoxide-Information-Center/Carbon-Monoxide-Questions-and-Answers).
- **Burns:** [Red Cross burn cooling advisory](https://www.redcross.org/content/dam/redcross/docs/Burn%20Cooling%E2%80%94ADVISORY.pdf).
- **Seizure:** [CDC](https://www.cdc.gov/epilepsy/first-aid-for-seizures/index.html) and [Epilepsy Foundation](https://www.epilepsy.com/recognition/first-aid-resources).
- **Heat and fans:** [CDC: about heat and your health](https://www.cdc.gov/heat-health/about/index.html).
- **Food after an outage:** [CDC](https://www.cdc.gov/food-safety/foods/keep-food-safe-after-emergency.html) and [USDA FSIS](https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/how-temperatures-affect-food).

## v1.1 additions

- **State collections** (merged per record, newest `updated` wins, deletions as tombstones):
  - `tasks`: `{id, done, doneAt}` for a built-in mission (id from `content.js`), `{id, custom: true, t, phase, done}` for your own, `{id, lastDone, prevDone}` for upkeep.
  - `buys`: `{id, status: "buy"|"ordered"|"have", qty?, itemId?}`. `qty` overrides the automatic quantity; `itemId` links a bought item to its Supplies record.
  - Memory Cards from v1.0 load unchanged (both collections default to empty).
- **Buy-list quantities** (`engine.buyQty`): `drum` = ceil(14 × (2 × people + pet gal/day) / 55); `brick` = ceil(3 × people / 3.5); `P`, `P+1`, `P/2` (pairs, rounded up); `AT` = teens, adults and seniors. With no one entered, 4 people are assumed.
- **Upkeep** (`engine.recurring`): due `every` days after it was last done; the spring check is due from March 1 to September 30 unless done since March 1.
- **PDF library**: per phone, never in Memory Cards. IndexedDB keys `lib` (index: id, name, size, pages, lastPage) and `pdf:<id>` (the file as a Blob).
- **PDF.js**: `vendor/pdfjs` (legacy build) → `app/pdfjs/`, precached by the service worker, loaded on demand with `import()`. Options: `useWorkerFetch: false`, `useWasm: false`, so it never fetches; the CSP stays `connect-src 'none'`. JPEG 2000 and JBIG2 images (rare outside scans) are skipped.

## v1.3 additions

- **Library index** (`lib` in IndexedDB) entries now carry `type`: `"pdf"` (default for older entries), `"zim"`, `"video"`, `"audio"`. Files live under `pdf:<id>`, `zim:<id>` and `media:<id>` (Blobs). Extracted PDF text lives under `ptext:<id>` (array of page strings). PDFs saved from inside an archive carry `fromZim: "<archive id>|<entry index>"`. Archive entries keep `uuid`, `zname`, `flavour`, `articles`, `main`, `lastPath`, `lastTitle`, `fav` (data URL), `needsScripts`.
- **Archive reader** (`src/zimkit.js`, built with fzstd into `app/zimkit.js`): `HavynZim.Archive.open(blob)` → `info()`, `search(q, n)` (title prefix, tried in several capitalisations), `byPath(path)`, `resolve(entry)`, `locate(entry)` (`{file:[start,end]}` zero-copy or `{mem}`), `blobOf(entry, type)`, `mainEntry()`, `random()`, `favicon()`. Paths: new-style archives use the C namespace path (`Water_purification`), old ones `A/Water_purification`.
- **Service worker route** `./z/<archive id>/<path>`: reads the archive Blob from IndexedDB, 302 for redirects and the empty path (main page), byte ranges (206/416) for media, `Content-Security-Policy: … script-src 'none'; connect-src 'none' …` on every response. The page tells the worker to forget a deleted archive (`{t: "zim-drop", id}`).
- **Reader frame**: `sandbox="allow-same-origin"` (no scripts). HAVYN intercepts link clicks (own back stack via `location.replace`), opens PDFs in its PDF reader, adds `controls` to media, and injects `#havyn-zr` styles (text size, dark pages). Without a service worker, pages are rebuilt from the archive with `blob:` resources (`ZR.renderDoc`).
- **App CSP** changes: `media-src 'self' blob:` and `frame-src 'self'`. `connect-src 'none'` is unchanged.
- **Plan** gains `hub` (home library address, `http(s)://` only), carried in Memory Cards.
- **Catalog** (`content.archive`): tiers `phone`, `apps`, `drive`, `hub`; items with `size` (bytes), `est`, `opens` (`havyn`/`kiwix`), `dir` (drive folder) and `get` (`{zim, stem}` | `{url, name}` | `{gh, match}` | `{kx, match}`). `tools/vault.py` turns it into the drive scripts.

## v1.4 additions

- **Shelf catalog** (`content.shelf`): `systems` (`id`, `n`, `icon`, `t`, `d`) and `items`: `id`, `sys`, `t`, `d`, `by`, `yr`, `lic` (`pd`, `cc-by`, `cc-by-sa`, `cc-by-nc-sa`, `link`), `ph` (phone set), `core` (vault core set), `u` (publisher page), `file`, `size` (bytes) and `pg` (pages) from the last checked build (`est: true` while estimated). Where to fetch, tried in this order: `src` (publisher links), `ia` (`[{item, match}]`), `ox` (OpenStax slug), `dspace` (`{base, handle, match}`), `alt` (other copies), the Wayback Machine's PDF captures of each `src` link (`wb: [years]` if its index is down; `wb: false` to skip), `ias` (`{q, match}`, an Internet Archive search), `parts` (joined), or `hp` (`{code, years}`, Hesperian chapters). Checks: `expect` (pattern that must appear in the first pages), `minpages`, `strip` (`{marker, pages}`: a re-host's cover page). `tools/shelf.py` writes these fields to `shelf/catalog.json`.
- **Shelf release** (`shelf`, built by `.github/workflows/shelf.yml` → `tools/shelf_fetch.py`): the mirrored PDFs, `shelf-index.json` (`built`, `repo`, `release`, `items[]` with `ok`, `url` used, `via`, `size`, `sha256`, `pages`, `probe` = first words, `license_seen`, `note`, `tried`, `edition` and `parts[]` for Hesperian, `carried` when last build's copy was kept, `error`), `shelf-files.tsv` (vault manifest: id, core|full, folder, file, url, sha256, size, title), `SHA256SUMS.txt`, `HAVYN-shelf-phone.zip` (stored, not compressed).
- **Phone shelf on Pages**: `tools/shelf_pages.py` copies the phone-set PDFs into `app/shelf/` (under 800 MB) and writes `app/shelf/index.json` = `{built, items: [{id, file, size, sha256, pages}]}`. The service worker never caches `shelf/` paths (network only), so the 100+ MB set isn't duplicated in the app cache.
- **App CSP**: `connect-src 'self'` (was `'none'`), used only by `fetch("./shelf/…")` when you tap Get. Downloads stream with progress, then size and SHA-256 (`crypto.subtle`) must match the index before the file is stored.
- **Library entries** for shelf documents carry `shelf: <item id>` and the catalog title as `name`; a second copy of the same document is refused. Hesperian chapter files (`en_<code>_<year>_<part>.pdf`) picked together are joined with pdf-lib in chapter order (front matter, chapters, glossary, index, back matter) into one book.
- **Apps tier** item kind `setup` (`a-dict`): a built-in iPhone feature with steps and a Done tick instead of a download.

## v1.5 additions

- **Archive list** (`shelf/kiwix.json`, written by `tools/shelf.py` from the phone-tier catalog items with `get.zim`): `[{id, dir, stem, core}]`. At deploy (and weekly) `tools/shelf_pages.py` writes `app/shelf/archives.json` = `{built, items: [{id, file, url, size, sha256}]}`: newest `stem_YYYY-MM.zim` in `https://download.kiwix.org/zim/<dir>/`, `url` on `https://mirror.download.kiwix.org/zim/` (size from a `Range: bytes=0-0` Content-Range; the mirror must answer with `Access-Control-Allow-Origin: *`), and Kiwix's SHA-256 from `https://download.kiwix.org/zim/<dir>/<file>.sha256` (301 to `lb.download.kiwix.org`; the mirror host doesn't serve `.sha256`). Optional `mirror` and `list` override the two Kiwix bases (used by the tests; the CSP still limits hosts).
- **Archive downloads** (`Arc` in `app.js`): resume state `zdl:<catalog id>` = `{file, url, size, sha256, algo, uid, parts[], have, h}`; data in IndexedDB parts `zpart:<uid>:<n>` (about 32 MiB each; whatever has arrived is kept when the connection drops, on Stop, or when the app closes); `Range: bytes=<have>-` must answer 206 from exactly `have`, or it starts over. Hash: incremental SHA-256 over the whole file when Kiwix's checksum is known (`algo: "sha256"`), otherwise incremental MD5 over all but the last 16 bytes, compared with those bytes (a ZIM's built-in checksum; `checksumPos` must be `size - 16`). Hash state is saved with every part. A finished archive is stored as `zim:<uid>` = `{parts, size, file, sha256}` and opened as `new Blob(parts)` (no copy); its library entry carries `from: "kiwix"`, `catalog`, `verified`, `check` (`sha256` or `md5`). If the link 404s, the newest file is looked up again in Kiwix's directory.
- **CSP**: `connect-src 'self' https://mirror.download.kiwix.org https://download.kiwix.org https://lb.download.kiwix.org`. Checked 2026-11-15 from GitHub's network with the probe workflow: the mirror serves archive bytes itself (206, `Access-Control-Allow-Origin: *`, preflight allows `Range`); directory listings and `.sha256` files on download.kiwix.org answer 301 to lb.download.kiwix.org, both hops with `Access-Control-Allow-Origin: *`. Archive requests use `credentials: "omit"` and `referrerPolicy: "no-referrer"`.
- **Download everything** (`Everything.run`): the phone-set shelf documents, then the core archives; sets `prefs.autoGet` so the next launch carries on (3.5 s after start, online, not in Emergency mode). The screen stays awake while it runs. **Readiness** (`Ready`): weighted checklist (Home Screen 10, offline 10, shelf 25, archives 25, publisher books 5, family plan 15, Memory Card this month 10); shown at the top of Status until 100%.
- **Field index** (`content.field`): `checked`, `note`, `groups` `[[id, label]]`, `docs` (short names) and `items`: `{id, g, q, k (search words), card?, pb?, r: [[shelf id, page, what's there]]}`. Pages are the PDF's own page numbers in HAVYN's copies of phone-set documents hosted by HAVYN (`ph`, not `lic: "link"`), so every phone has the same pages; checked against the shipped files' text. Links open `#/library/<id>?page=<n>&from=<route>`; the reader's Back returns to `from` (an internal route only). Cards list their pages under "Go deeper on this phone" (only pages on this phone); playbooks under "Read more on this phone". Search weights field answers 7 (cards 8, playbooks 6).
- **Cards** may carry `checked` (their own check date, shown instead of `content.reviewed`).
- **Probe workflow** (`.github/workflows/probe.yml`, manual): `tools/shelf_probe.py` prints each redirect hop's status, type, length, range and CORS headers, the preflight answer, and small text bodies.
