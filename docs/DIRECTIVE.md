# HAVYN: operating directive

**Mission.** Keep the family informed, coordinated and alive through a multi-day blackout, using tools that work with no network and no grid power.

## Non-negotiables

1. **Offline first.** After install, nothing the family needs touches the network. The content security policy enforces this.
2. **Family data stays home.** People, medical details and supplies live on the phones and in Memory Cards on the vault drive. They never go into this repo or onto any server.
3. **Emergency content is static, sourced and dated.**
   - No card ships without a source link and a checked date.
   - No card is relied on until a trained person (EMT or nurse) signs it off.
   - Any change to a card needs a new source check and a new sign-off.
4. **AI never doses or diagnoses** (applies from M5). It finds documents and quotes them.
5. **Speed is safety.**
   - Any emergency card is two taps from launch.
   - The first screen appears in under 1 second on the oldest family phone.
   - The app holds no data-loss path: export, import and merge must round-trip exactly.
6. **Paper is the floor.** Everything critical must print.

## Roles

| Role | Who | Responsibility |
| --- | --- | --- |
| Final authority | Founder | Approves milestones, deploys, signs acceptance in MISSION_STATE.md. |
| Lead builder | Claude Code | Builds and keeps tests green. |
| Auditor | Codex, read-only | Audits each milestone against its "done when" lines. |
| Medical reviewer | A trained EMT or nurse | Signs off the files in `content/cards/`. |

## Change rules

- Every source edit goes through `tools/build.py`, then both test suites must pass.
- A milestone closes only when every one of its "done when" lines has evidence in MISSION_STATE.md.
