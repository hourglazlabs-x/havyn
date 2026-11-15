# HAVYN: mission state

**Current milestone:** M2, HAVYN FIELD v1.2: the "fully loaded" pass (binder, numbers, maps, three playbooks, six Phoenix cards). Live deployment waits on one GitHub setting (Settings → Pages → Source: GitHub Actions).
**Build:** 1.2.0+1b517beb1a · 2026-11-14 · `app/index.html` 239 KB + PDF.js and pdf-lib (2.3 MB, cached for offline)

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
2. **Medical review gate (16 cards).** The six Phoenix cards added in v1.2 were checked by an independent reviewer against AHA, Red Cross, ADA, CDC and Banner Poison Center. A trained EMT or nurse must still review and sign each file in `content/cards/`; until then the app shows "Awaiting EMT or nurse review" on every card.
3. **On-device checks that headless Chrome can't do:** the binder share sheet (Print, Save to Files); the PDF reader on an iPhone (memory on long books, iOS Files import); the metronome with the ring/silent switch on; screen wake lock; AirDrop of a Memory Card; Dynamic Type at the largest size; first-screen time on the oldest family iPhone.
4. **Codex audit** against these tables, then **founder acceptance**.

## Next

- **Next:** the encyclopedia inside HAVYN (Kiwix JS), then the CORE hub and VAULT drives.
- **Maps:** Apple Maps offline download (iOS 17+) instead of maps built into HAVYN; rally points link into it.
- **v1.3:** the Kiwix encyclopedia inside HAVYN.
- **CORE hub, VAULT:** a Pi 5 or laptop serving Kiwix and this app over its own Wi-Fi; two drives, a sync script, SHA-256 checks.
