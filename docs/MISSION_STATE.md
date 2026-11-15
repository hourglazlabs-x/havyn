# HAVYN: mission state

**Current milestone:** M5, HAVYN FIELD v1.5: everything on the phone with one tap (Download everything: 50 phone-set manuals and 7 core encyclopedias, resumable, checked), "How do I…" (a field index that opens the exact page in the manuals), and four new emergency cards. Live deployment still waits on one GitHub setting (Settings → Pages → Source: GitHub Actions).
**Build:** 1.5.0 · 2026-11-15 · `app/index.html` 442 KB + `zimkit.js` 54 KB + PDF.js and pdf-lib (cached for offline) · shelf release `shelf` (rebuilding with the wider phone set after the v1.5 push)

## v1.5 "done when": evidence

| Criterion | Status | Evidence |
| --- | --- | --- |
| One tap puts the manuals and the core encyclopedias on the phone | PASS (Chrome) | e2e_v15: Status shows "n% ready" and one Download everything button; shelf documents arrive first, then archives from a fake cross-origin Kiwix mirror with CORS like the real one; progress and Stop; the core set completes. |
| Downloads survive real networks and closing the app | PASS (Chrome) | e2e_v15: a connection cut half way carries on from the last byte saved (`Range: bytes=22138-`); the app closed mid-download carries on by itself after reopening (`Range: bytes=8192-`); archives are stored in parts (no second copy) that delete cleanly. |
| Every archive is checked before it's added | PASS | Kiwix's SHA-256 (read from download.kiwix.org, which the probe workflow showed serves `.sha256` with CORS; the mirror host doesn't) or, without it, the MD5 inside the ZIM; a corrupted transfer is refused and deleted, and Get again succeeds. Engine tests: incremental SHA-256 and MD5 match Node across random chunks and save/restore, and a real ZIM's built-in MD5. |
| The real Kiwix servers allow it | PASS (GitHub runners) | Deploy log 2026-11-15: all 9 phone archives resolved with exact sizes and `Access-Control-Allow-Origin: *` from mirror.download.kiwix.org (core set 2.80 GB); probe: `.sha256` on download.kiwix.org → lb.download.kiwix.org, ACAO `*`. Not yet run on an iPhone. |
| Answers point at the right page | PASS | 64 field answers, 108 page links in 25 phone-set documents, each checked against the text of the shipped file (pdftotext) on 2026-11-15; engine test: every link names a hosted phone-set document and a page inside it. e2e_v15: a link opens the reader at that page and Back returns; cards and playbooks show their pages; Search finds the answers. |
| New cards are sourced | PASS (review pending) | Heart attack (AHA warning signs; 2024 AHA/Red Cross first aid guideline: aspirin 162–325 mg for alert adults, wait if unsure), Won't wake up (NHS, Resuscitation Council UK), Broken bone (Mayo Clinic), Poisoning (HRSA Poison Help, Arizona poison center, MedlinePlus). Same EMT/nurse review gate as the others. |
| v1.0–v1.4 checks still pass | PASS | e2e 91/91, 76/76, 31/31; archive reader 208/208; shelf fetcher 26/26. |

Test totals: engine 27/27, archive reader 208/208, end-to-end 91/91 + 76/76 + 31/31 + 36/36, shelf fetcher 26/26.

Open: on-device test on an iPhone (multi-GB downloads in a Home Screen app; storage quota prompt behavior); GitHub Pages switch; two phone-set documents (ATP 3-34.45 Electric Power, DOT ERG 2024) wait on the daily shelf retry; EMT or nurse review of all twenty cards.

## v1.4 "done when": evidence

| Criterion | Status | Evidence |
| --- | --- | --- |
| The shelf holds the publishers' own documents, checked | PASS (63 of 66) | `shelf` workflow on GitHub's servers: each file a complete, readable PDF; size, SHA-256, page count and first words recorded in `shelf-index.json` (63 documents, 26,633 pages). Identity patterns, with the edition where it matters, matched on every document fetched from an archive or search. Not fetched yet: ATP 3-34.45 (FAS blocks cloud servers; the Wayback Machine rate-limited the runners), the 2024 Emergency Response Guidebook (PHMSA blocks cloud servers; same), MSF Clinical Guidelines (MSF's PDF export returns an error page today; publisher's terms, never mirrored anyway). A daily run retries them; the app shows the publisher's link meanwhile. |
| Wrong, outdated or restricted copies kept out | PASS | Review of every first page caught: Basic Machines was a Dover reprint (replaced with the Navy's NAVEDTRA 14037, 1994); the concrete manual carried a re-host's cover page (removed automatically); an archive search returned a 19th-century "family and ship medicine chest companion" and 1946/1960 scans for three manuals (search results must now carry text matching the title and edition; all three replaced with the right editions, wrong files deleted from the release). Map Reading uses the 2001 edition: the 2005 edition was never approved for public release. NAVEDTRA "A" editions (DoD-restricted wording) avoided. |
| Licensing | PASS | Mirrored only public domain and Creative Commons (57 files, 2.45 GB). Publisher's-terms documents (Hesperian ×3, MSF, University of Arizona ×2, NCTSN) are checked, linked and never re-hosted. The license line is read from every Creative Commons PDF: OpenStax's current PDFs state CC BY-NC-SA 4.0, so the catalog says so. |
| One tap puts a document on the phone, checked | PASS (Chrome) | e2e_v14 31/31: one-tap and phone-set downloads from HAVYN's own address with progress, SHA-256 refusal of a bad file, CSP still blocks other hosts, Search finds words inside a fetched document, Hesperian chapters joined into one book in order, duplicate refused, the offline and no-shelf messages, the zip and publisher fallbacks. Phone set: 19 of 20 shareable phone documents, 156 MB. |
| The vault drive copies the shelf | PASS (bash) | Local test: release SHA match, bad release file deleted, changed publisher file kept with a note, Hesperian chapter folders, idempotent re-run, `--list --full`. PowerShell version reviewed, not run. |
| The fetcher survives the real web | PASS | `tests/shelf_fetch_test.py` 26 checks against a fake web: Wayback capture index (newest PDF capture first), paced requests and a breaker when it refuses, retries for dropped TLS handshakes and cut-short downloads, wrong-document and scan-without-text refusals, Internet Archive items and searches, DSpace (WHO IRIS), cover-page stripping, page minimum, last build's copy kept when a publisher fails, revisions that drop a wrong copy, targeted publish, daily retry, upload only what changed. |
| Dictionaries and translation offline | PASS | Get more › Apps › "Dictionary and translation, offline (built in)": the iPhone's own dictionaries and Translate languages, with the steps to download them and test in Airplane Mode; and the Wiktionary archive on the vault drive. |
| v1.0–v1.3 checks still pass | PASS | e2e 83/83, 76/76; archive reader 208/208; engine 23/23. |

Test totals: engine 23/23, archive reader 208/208, end-to-end 83/83 + 76/76 + 31/31, shelf fetcher 26/26.

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

1. **Turn on GitHub Pages** (one setting), then install on every phone and tap Get more › Shelf › Get the phone set.
2. **Three shelf documents still to fetch** (ATP 3-34.45, ERG 2024, MSF Clinical Guidelines): the daily `shelf` run retries them; check the release's `shelf-index.json`.
3. **Medical review gate (16 cards).** A trained EMT or nurse must review and sign each file in `content/cards/`; until then every card shows "Awaiting EMT or nurse review".
4. **On-device checks that headless Chrome can't do:**
   - v1.3: import a 1–2 GB archive on an iPhone (Safari's IndexedDB with a multi-GB file); archive video inside the reader on iOS (service-worker byte ranges in WebKit); the reader frame's link handling and dark pages in WebKit; how much HAVYN may store (`navigator.storage.estimate()` on the family phones).
   - Earlier: the binder share sheet; the PDF reader on long books; the metronome with the silent switch on; wake lock; AirDrop of a Memory Card; Dynamic Type at the largest size; first-screen time on the oldest iPhone.
5. **Windows vault script:** run once on a Windows PC (only the bash version ran here).
6. **Codex audit** against these tables, then **founder acceptance**.

## Next

- **Home library (CORE):** set up Kiwix Hotspot on a laptop or iPad on the home Wi-Fi; save its address in HAVYN (Get more › Home).
- **VAULT:** buy the drives (Black Friday), run the vault script, keep a second drive in sync.
- **Later:** full-text search inside archives on the phone (needs a Xapian reader); Zimit archives inside HAVYN (needs a sandboxed replay engine); maps inside HAVYN (Apple Maps offline covers it for now).
