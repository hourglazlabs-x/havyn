# HAVYN: mission state

**Current milestone:** M1, HAVYN FIELD v1. It is built and tested, and is waiting on three things: deployment, the medical review, and founder acceptance.
**Build:** 1.0.0+a05d59015a · 2026-11-14 · `app/index.html` 126 KB

## M1 "done when": evidence

| Criterion | Status | Evidence |
| --- | --- | --- |
| Works in airplane mode after the first install | PASS (Chrome) | e2e: network off, then reload. The app and the bleeding card load from the service worker. |
| First screen in under 1 s on the oldest family iPhone | PASS (proxy) | e2e: 195 ms normally and 452 ms with the CPU slowed 6×. Still to confirm on the oldest family iPhone. |
| Every emergency card is two taps or fewer from launch | PASS | e2e: Emergency tab, then the card. All 10 cards checked. |
| Every protocol card shows its source and a reviewed-on date | PASS | e2e: all 10 cards. `content/cards/*.md` |
| Export, import and merge round-trip with zero data loss | PASS | e2e: save, erase, load, then deep-compare. Merge keeps the newest edit. Unit tests cover tombstones, order independence and idempotence. |
| A content security policy blocks all network requests | PASS | e2e: fetch to an outside site and to the app's own files both blocked, outside image blocked, and no outside requests in the whole session. |

Test totals: engine 13/13 (`node --test tests/engine.test.js`) and end-to-end 36/36 (`python3 tests/e2e.py`). Results are in `tests/e2e-results.json`.

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

1. **Medical review gate.** A trained EMT or nurse must review and sign each file in `content/cards/`. Until then the app shows "Awaiting EMT or nurse review" on every card.
2. **Deploy.** Choose a host (GitHub Pages or another static HTTPS host), then install on every phone. See README.
3. **On-device checks that headless Chrome can't do:**
   - The metronome with the ring/silent switch on.
   - Screen wake lock.
   - Sending a Memory Card by AirDrop.
   - Dynamic Type at the largest size.
   - Time to first screen on the oldest family iPhone.
4. **Codex audit.** A read-only audit against this table.
5. **Founder acceptance.**

## Next milestones

- **M2, FIELD v1.1:**
  - Power calculator, comms ladder, library index, event log.
  - Paper mode: printing the binder from the app.
  - Timed drills.
  - The remaining playbooks: monsoon and dust storm, wildfire smoke or evacuation, and boil-water notice.
- **M3, CORE hub:** a Pi 5 or laptop serving Kiwix and this app over its own Wi-Fi.
- **M4, VAULT:** two drives, a sync script, and SHA-256 checks.
