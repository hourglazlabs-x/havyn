# HAVYN: mission state

**Current milestone:** M2, HAVYN FIELD v1.1. Built and tested. Live deployment waits on one GitHub setting (Settings → Pages → Source: GitHub Actions).
**Build:** 1.1.0+98bdbf5a5c · 2026-11-14 · `app/index.html` 202 KB + PDF.js (1.8 MB, cached for offline)

## v1.1 "done when": evidence

| Criterion | Status | Evidence |
| --- | --- | --- |
| Mission map inside the app, ticks persist and sync | PASS | e2e: tick on Status survives reload; custom mission lands in its phase; upkeep "Mark done" shows OK; ticks are in the Memory Card round trip. |
| Buy list matches the Sheet and sizes itself | PASS | unit: 4 assumed people give $1,844 / $1,469 / $1,550 / $2,030 = $6,893, floor $564. e2e: 5 people + a dog give 3 drums. |
| A bought item moves into Supplies in one tap | PASS | e2e: drum marked Have, form prefilled (55-gal drum ×3, 55 gal each), saved and linked. |
| Plan and Comms readable offline | PASS | e2e: live floor and tier figures; one-tap OK text `sms:<contact>&body=…`; call and text 911. |
| PDFs import and read offline inside the app | PASS (Chrome) | e2e: import, render, contents, find, go to page, resume at last page, and render with the network off (PDF.js from the offline copy). |
| CSP still blocks all network access | PASS | `connect-src 'none'` unchanged; zero CSP violations in normal use, PDF.js included. |
| v1.0 checks still pass | PASS | All 36 v1.0 checks, plus a regression check for delete (the v1.0 delete button threw before navigating; fixed). |

Test totals: engine 20/20 and end-to-end 57/57. First screen: 144 ms normal, 379 ms throttled.

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
2. **Medical review gate.** A trained EMT or nurse must review and sign each file in `content/cards/`. Until then the app shows "Awaiting EMT or nurse review" on every card.
3. **On-device checks that headless Chrome can't do:** the PDF reader on an iPhone (memory on long books, iOS Files import); the metronome with the ring/silent switch on; screen wake lock; AirDrop of a Memory Card; Dynamic Type at the largest size; first-screen time on the oldest family iPhone.
4. **Codex audit** against these tables, then **founder acceptance**.

## Next

- **v1.2:** printing the binder from the app; the three remaining playbooks (monsoon and dust storm, wildfire smoke or evacuation, boil-water notice), written from sources; offline maps.
- **v1.3:** the Kiwix encyclopedia inside HAVYN.
- **CORE hub, VAULT:** a Pi 5 or laptop serving Kiwix and this app over its own Wi-Fi; two drives, a sync script, SHA-256 checks.
