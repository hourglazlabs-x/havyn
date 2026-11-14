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
