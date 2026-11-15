# HAVYN: mission state

**Current milestone:** M3, HAVYN FIELD v1.3: the offline library ("our own Google offline"): archive reader, one Add files button, PDF text search, video and audio, Search everything, the Get more catalog, the vault drive kit and the home library. Live deployment still waits on one GitHub setting (Settings → Pages → Source: GitHub Actions).
**Build:** 1.3.0 · 2026-11-14 · `app/index.html` 322 KB + `zimkit.js` 54 KB + PDF.js and pdf-lib (2.3 MB, cached for offline)

## v1.3 "done when": evidence

| Criterion | Status | Evidence |
| --- | --- | --- |
| HAVYN reads Kiwix ZIM archives offline, without Kiwix code | PASS | Clean-room reader (`src/zimkit.js`) from the openZIM format: header, MIME list, directory, title listings v0/v1, redirects, uncompressed/Zstandard/XZ clusters, extended clusters, split archives. 208/208 checks on openzim's own test suite: every entry of all three layouts readable, XZ and Zstandard copies byte-identical, 40+ damaged archives rejected without crashing or hanging. |
| XZ decoder is exact | PASS | Byte-for-byte against Python `lzma` and the `xz` tool: presets 0/6/9e, all check types, multi-block, uncompressed chunks, odd lc/lp/pb, tiny dictionaries; trailing bytes ignored; truncated input throws. |
| Archive pages work like the web, offline | PASS (Chrome) | e2e: title search, articles, images, CSS `url()`, links, `../` paths, redirects, in-page anchors, Back through the whole trail, Random, Main page, text size, dark pages, video with byte-range seeking, PDFs inside archives opened in the PDF reader; a real Wikipedia archive's main page renders 10+ WebP images; all with the network off. |
| Archive content can't run code or reach the network | PASS | Service worker serves archive pages with `script-src 'none'`, `connect-src 'none'`; reader frame sandboxed without scripts. Fixture archive's inline `<script>` and `onerror` handler never run (e2e, both modes). Zimit website copies are flagged "needs Kiwix". |
| Works without the service worker (preview, first launch) | PASS (Chrome) | All 28 reader checks pass with service workers blocked: pages rebuilt with blob: resources, scripts and handlers stripped. |
| One Add files button for every kind of file | PASS | e2e: archives (incl. `.zimaa/.zimab/.zimac`), PDF, MP4, M4A in one pick; type from file contents; duplicate archive refused. |
| Video and audio play offline and resume | PASS (Chrome) | e2e: MP4 and M4A play from the library; position saved. |
| Search everything | PASS | e2e: one query returns cards and playbooks, words inside PDFs (text indexed in the background) and archive titles; updates as you type; works offline. |
| Get more catalog is sourced and consistent | PASS | Unit test: unique ids, every item sourced, one fetch method each, undated stems, https links, phone archives open in HAVYN, phone core set 2.5–3.1 GB. Sizes from Kiwix mirror listings 2026-11-14 (~ marks estimates). |
| Vault drive kit | PASS (bash) | Against a local fake Kiwix server: picks newest version, resumes a half-finished download to an identical file, verifies SHA-256, deletes a corrupt file and says so, removes the superseded copy, re-run does nothing, missing drive explained. PowerShell version reviewed, not run (no Windows here). |
| v1.0–v1.2 checks still pass | PASS | e2e 83/83 (mission count now read from content). |

Test totals: engine 22/22, archive reader 208/208, end-to-end 83/83 + 76/76.

## v1.1 "done when": evidence

| Criterion | Status | Evidence |
| --- | --- | --- |
| Mission map inside the app, ticks persist and sync | PASS | e2e: tick on Status survives reload; custom mission lands in its phase; upkeep "Mark done" shows OK; ticks are in the Memory Card round trip. |
| Buy list matches the Sheet and sizes itself | PASS | unit: 4 assumed people give $1,844 / $1,469 / $1,550 / $2,030 = $6,893, floor $564. e2e: 5 people + a dog give 3 drums. |
| A bought item moves into Supplies in one tap | PASS | e2e: drum marked Have, form prefilled (55-gal drum ×3, 55 gal each), saved and linked. |
| Plan and Comms readable offline | PASS | e2e: live floor and tier figures; one-tap OK text `sms:<contact>&body=…`; call and text 911. |
| PDFs import and read offline inside the app | PASS (Chrome) | e2e: import, render, contents, find, go to page, resume at last page, and render with the network off (PDF.js from the offline copy). |
| CSP still blocks all network access | PASS | `connect-src 'none'` unchanged; zero CSP violations in normal use, PDF.js included. |
| Binder PDF made on the phone, online and offline | PASS (Chrome) | e2e: 14 pages with people, numbers and all cards; saved to the Library; searchable in the reader; made again with the network off. |
| Phoenix numbers and map links | PASS | Seven numbers checked on each provider's own page 2026-11-14 (City of Phoenix, SRP, Southwest Gas); unit test requires a source for each. Rally points open Apple Maps. |
| Three new playbooks, independently fact-checked | PASS | Monsoon and dust storm (ADOT, NWS, Ready.gov, SRP, TEP), wildfire smoke or evacuation (EPA, CDC, Maricopa County, AZEIN), boil-water notice (CDC). A separate reviewer checked every line against the sources; all corrections applied (bleach strength and drops, stored-water age, N95 limits, box-fan fire risk, car in floodwater, power line on a car, notice types). e2e: each playbook renders all its steps. |
| Six Phoenix cards, independently fact-checked | PASS | Drowning (AHA 2024/2025, Red Cross, AAP), opioid overdose (AHA/Red Cross 2024, CDC), asthma (ALA), low blood sugar (ADA), scorpion (Banner, AZPDIC), rattlesnake (Banner, AZPDIC, Poison Control). Reviewer corrections applied (911 before naloxone; no fixed naloxone duration; low-sugar order; any-age scorpion 911 signs; limb position). e2e: every card two taps from launch. |
| v1.0 checks still pass | PASS | All 36 v1.0 checks, plus a regression check for delete (the v1.0 delete button threw before navigating; fixed). |

Test totals: engine 21/21 and end-to-end 83/83. First screen: 144 ms normal, 379 ms throttled.

## Content check, 2026-11-14

An independent pass compared every card step with its sources (AHA 2025 adult and pediatric BLS, the 2024 AHA and Red Cross first aid guidelines, Stop the Bleed, Red Cross, FARE, ASA, CDC, CPSC and FEMA). These corrections were applied:

- **Bleeding:** for an arm or leg, the tourniquet now comes before packing. Packing is for the neck, armpit or groin, or when there is no tourniquet.
- **New card, CPR child:** depth for children and babies, hand position, 30:2 breaths, and the 2-minutes-first rule when alone.
- **Choking:**
  - Chest-thrust hand position added.
  - No blind finger sweeps.
  - The infant position is spelled out.
  - A link to child CPR is added.
- **Allergy:**
  - Second dose after about 5 minutes (FARE).
  - Nasal epinephrine added.
  - CPR is now triggered only when the person is unresponsive and not breathing normally.
- **Heat stroke:**
  - Immersion now has an endpoint: 15 minutes, or until the person is no longer confused.
  - Confusion alone is enough to act when no thermometer is available.
- **CO:** Poison Control 1-800-222-1222 added, plus a CPR step. Basements and open doors added to the generator rule.
- **Burns:** an expanded list of when to call 911, chemical and eye irrigation, and a warning that power can return during an outage.
- **Heat playbook:** CDC now says that above 90°F indoors a fan can raise body temperature, and the playbook text now says so.
- **Blackout playbook:**
  - Water line now reads "drink what you need".
  - Refrigerated life-sustaining medicine: keep using it until there is a new supply (CDC).
- **Sources:** one dead link and one mislabeled source replaced.

## Open items

1. **Turn on GitHub Pages** (one setting), then install on every phone.
2. **Medical review gate (16 cards).** A trained EMT or nurse must review and sign each file in `content/cards/`; until then every card shows "Awaiting EMT or nurse review".
3. **On-device checks that headless Chrome can't do:**
   - v1.3: import a 1–2 GB archive on an iPhone (Safari's IndexedDB with a multi-GB file); archive video inside the reader on iOS (service-worker byte ranges in WebKit); the reader frame's link handling and dark pages in WebKit; how much HAVYN may store (`navigator.storage.estimate()` on the family phones).
   - Earlier: the binder share sheet; the PDF reader on long books; the metronome with the silent switch on; wake lock; AirDrop of a Memory Card; Dynamic Type at the largest size; first-screen time on the oldest iPhone.
4. **Windows vault script:** run once on a Windows PC (only the bash version ran here).
5. **Codex audit** against these tables, then **founder acceptance**.

## Next

- **Home library (CORE):** set up Kiwix Hotspot on a laptop or iPad on the home Wi-Fi; save its address in HAVYN (Get more › Home).
- **VAULT:** buy the drives (Black Friday), run the vault script, keep a second drive in sync.
- **Later:** full-text search inside archives on the phone (needs a Xapian reader); Zimit archives inside HAVYN (needs a sandboxed replay engine); maps inside HAVYN (Apple Maps offline covers it for now).
