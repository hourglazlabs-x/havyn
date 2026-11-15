// node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const E = require("../src/engine.js");
const C = require("../src/content.js");

const JULY = Date.parse("2026-07-15T12:00:00");
const NOV = Date.parse("2026-11-14T12:00:00");

function worked() {
  // The plan's worked example: family of 4, summer, heat mode.
  return {
    settings: { season: "auto", targetDays: 14, loadWhNormal: 300, loadWhHeat: 1080, solarW: 200, sunHours: 6.5, updated: 1 },
    people: [1, 2, 3, 4].map((n) => ({ id: "p" + n, name: "P" + n, ageBand: "adult", updated: 1 })),
    pets: [],
    items: [
      { id: "w1", category: "water", name: "55 gal drum", qty: 2, per_unit: { gal: 55 }, updated: 1 },
      { id: "f1", category: "food", name: "Pantry", qty: 1, per_unit: { kcal: 60000 }, updated: 1 },
      { id: "e1", category: "power", name: "1 kWh station", qty: 1, per_unit: { wh: 1024 }, updated: 1 }
    ],
    log: [], outage: { active: false, updated: 1 }, plan: {}, checks: {}
  };
}

test("worked example matches the plan (water 13.8, food 7.5, power ~5)", () => {
  const a = E.autonomy(worked(), JULY);
  assert.equal(a.season, "heat");
  assert.equal(a.needs.water, 8);
  assert.equal(Math.round(a.water * 10) / 10, 13.8);
  assert.equal(a.food, 7.5);
  assert.equal(Math.round(a.needs.solar), 910);
  assert.ok(a.power > 5 && a.power < 5.3, "power " + a.power);
  assert.equal(a.family, 7.5);
  assert.equal(a.limiting, "food");
});

test("normal season halves water need; auto season follows the month", () => {
  const a = E.autonomy(worked(), NOV);
  assert.equal(a.season, "normal");
  assert.equal(a.needs.water, 4);
  assert.equal(a.water, 27.5);
});

test("pets add 1 oz of water per lb per day", () => {
  const S = worked(); S.pets = [{ id: "d1", name: "Dog", weightLb: 64, updated: 1 }];
  assert.equal(E.needs(S, NOV).water, 4.5);
});

test("critical meds limit the family number", () => {
  const S = worked();
  S.items.push({ id: "m1", category: "meds", name: "Insulin", qty: 2, per_unit: { doses: 30 }, per_day: 10, critical: true, updated: 1 });
  const a = E.autonomy(S, NOV);
  assert.equal(a.meds, 6);
  assert.equal(a.family, 6);
  assert.equal(a.limiting, "meds");
});

test("solar covering the load gives unlimited power days", () => {
  const S = worked(); S.settings.solarW = 400;
  assert.equal(E.autonomy(S, JULY).power, Infinity);
});

test("gaps show what reaches the target", () => {
  const g = E.gaps(worked(), JULY);
  const water = g.list.find((x) => x.res === "water"), food = g.list.find((x) => x.res === "food");
  assert.equal(water.gap, 14 * 8 - 110);
  assert.equal(food.gap, 14 * 8000 - 60000);
});

test("consumption mode uses logged use after 12 hours", () => {
  const S = worked();
  const start = JULY - 2 * 86400000;
  S.outage = { active: true, startedAt: start, updated: 2 };
  S.log = [{ id: "l1", t: start + 3600000, res: "water", amount: 20, itemId: "w1", updated: 2 }];
  const a = E.autonomy(S, JULY);
  assert.equal(a.measured.water, true);
  assert.equal(a.water, 110 / 10); // 20 gal over 2 days = 10/day
});

test("expiring and hot storage", () => {
  const S = worked();
  S.items.push({ id: "x", category: "food", name: "Bars", qty: 1, per_unit: { kcal: 1 }, expires: "2026-12-01", location: "Garage shelf", updated: 1 });
  const ex = E.expiring(S, NOV, 90);
  assert.equal(ex.length, 1); assert.equal(ex[0].expired, false);
  assert.equal(E.hotStorage(S).length, 1);
});

test("next check-in wraps to tomorrow", () => {
  const late = Date.parse("2026-11-14T19:30:00");
  assert.deepEqual(E.nextCheckin(["08:00", "12:00", "18:00"], late), { at: "08:00", inMin: 750 });
  const morning = Date.parse("2026-11-14T11:30:00");
  assert.deepEqual(E.nextCheckin(["08:00", "12:00", "18:00"], morning), { at: "12:00", inMin: 30 });
});

test("merge: newest edit wins, older ignored, tombstones travel", () => {
  const A = worked(), B = JSON.parse(JSON.stringify(worked()));
  B.items[0] = Object.assign({}, B.items[0], { qty: 3, updated: 5 });       // newer on B
  A.items[1] = Object.assign({}, A.items[1], { qty: 9, updated: 7 });       // newer on A
  B.items[1] = Object.assign({}, B.items[1], { qty: 2, updated: 6 });       // older than A's
  B.items[2] = { id: "e1", deleted: true, updated: 8 };                     // deleted on B
  B.people.push({ id: "p5", name: "New", ageBand: "child", updated: 9 });   // added on B
  const { state, report } = E.merge(A, B);
  const byId = Object.fromEntries(state.items.map((i) => [i.id, i]));
  assert.equal(byId.w1.qty, 3);
  assert.equal(byId.f1.qty, 9);
  assert.equal(byId.e1.deleted, true);
  assert.equal(E.live(state.people).length, 5);
  assert.equal(report.added, 1);
  assert.equal(report.updated, 2);
});

test("merge is idempotent and order-independent for distinct edits", () => {
  const A = worked(), B = worked();
  B.items[0] = Object.assign({}, B.items[0], { qty: 4, updated: 5 });
  const ab = E.merge(A, B).state, ba = E.merge(B, A).state;
  const norm = (s) => JSON.stringify(s.items.slice().sort((x, y) => x.id.localeCompare(y.id)));
  assert.equal(norm(ab), norm(ba));
  assert.equal(norm(E.merge(ab, B).state), norm(ab));
});

test("sanitize drops malformed records", () => {
  const out = E.sanitize({ people: [{ id: "a", name: "x".repeat(500) }, { name: "no id" }, null, "str"], items: "nope" });
  assert.equal(out.people.length, 1);
  assert.equal(out.people[0].name.length, 120);
  assert.deepEqual(out.items, []);
});

test("content: every card has steps, sources, and a reviewed date", () => {
  assert.equal(C.cards.length, 16);
  for (const c of C.cards) {
    assert.ok(c.steps.length >= 4, c.id);
    assert.ok(c.sources.length >= 1, c.id);
    for (const s of c.sources) assert.match(s.u, /^https:\/\//);
  }
  assert.match(C.reviewed, /^\d{4}-\d{2}-\d{2}$/);
  for (const p of C.playbooks.filter((p) => !p.soon)) for (const k of p.sources) assert.ok(C.refs[k], p.id + " ref " + k);
});

// ---------------- v1.1 ----------------
const EMPTY = () => ({ people: [], pets: [], items: [], log: [], tasks: [], buys: [], settings: {}, plan: {}, checks: {}, outage: {} });

test("buy list: 4 assumed people reproduce the Sheet's totals to the dollar", () => {
  const bp = E.buyPlan(EMPTY(), C.buy.items), t = E.buyTotals(bp.rows);
  assert.equal(bp.hh.assumed, true);
  assert.equal(C.buy.items.length, 43);
  assert.deepEqual([t.week.est, t.bf.est, t.d90.est, t.opt.est, t.all.est], [1844, 1469, 1550, 2030, 6893]);
  assert.equal(t.all.buy, 6893);
  assert.equal(E.floorTotal(C.buy.items), 564); // "about $565" in the plan
  const q = (id) => bp.rows.find((r) => r.item.id === id).qty;
  assert.deepEqual([q("drum"), q("brick"), q("bank"), q("mesh"), q("gmrs"), q("training"), q("cash")], [3, 4, 4, 5, 2, 4, null]);
});

test("buy list: quantities follow the household, pets add water", () => {
  const S = EMPTY();
  S.people = ["adult", "adult", "child", "child", "teen", "infant"].map((a, i) => ({ id: "p" + i, ageBand: a, updated: 1 }));
  const q = (S2, id) => E.buyPlan(S2, C.buy.items).rows.find((r) => r.item.id === id).qty;
  assert.equal(q(S, "drum"), 4);      // 14 × 2 × 6 = 168 gal → 3.05 drums → 4
  assert.equal(q(S, "brick"), 6);     // 18 gal / 3.5 → 6
  assert.equal(q(S, "gmrs"), 3);      // 6 people → 3 pairs
  assert.equal(q(S, "training"), 3);  // 2 adults + 1 teen
  const S2 = EMPTY(); S2.people = [{ id: "a", ageBand: "adult", updated: 1 }, { id: "b", ageBand: "adult", updated: 1 }];
  assert.equal(q(S2, "drum"), 2);     // 56 gal → 2
  S2.pets = [{ id: "d", weightLb: 640, updated: 1 }]; // 5 gal a day of pet water → 126 gal → 3
  assert.equal(q(S2, "drum"), 3);
});

test("buy list: overrides and statuses", () => {
  const S = EMPTY();
  S.buys = [{ id: "drum", status: "have", qty: 1, updated: 5 }, { id: "station", status: "ordered", updated: 5 }, { id: "x", status: "weird", updated: 5 }];
  const bp = E.buyPlan(S, C.buy.items), t = E.buyTotals(bp.rows);
  const drum = bp.rows.find((r) => r.item.id === "drum");
  assert.equal(drum.qty, 1); assert.equal(drum.override, true); assert.equal(drum.auto, 3);
  assert.equal(t.week.have, 120); assert.equal(t.bf.ordered, 480);
  assert.equal(t.all.buy + t.all.ordered + t.all.have, t.all.est);
  assert.equal(E.sanitize({ buys: [{ id: "x", status: "weird" }] }).buys[0].status, "buy");
});

test("missions: progress, next steps, custom tasks", () => {
  const S = EMPTY();
  let m = E.missions(C.missions, S, NOV);
  assert.equal(m.n, 25); assert.equal(m.d, 0);
  assert.deepEqual(m.next.map((x) => x.def.id), ["m-downloads", "m-plan", "m-medid"]);
  S.tasks = [{ id: "m-downloads", done: true, updated: 2 }, { id: "c1", custom: true, t: "Second can opener", phase: "today", done: false, updated: 2 }];
  m = E.missions(C.missions, S, NOV);
  assert.equal(m.n, 26); assert.equal(m.d, 1);
  assert.equal(m.phases[0].tasks.at(-1).def.id, "c1");
  assert.deepEqual(m.next.map((x) => x.def.id), ["m-plan", "m-medid", "m-sat"]);
});

test("upkeep: interval tasks and the spring window", () => {
  const month = C.missions.recurring.find((r) => r.id === "r-month"), spring = C.missions.recurring.find((r) => r.id === "r-spring");
  assert.equal(E.recurring(month, null, NOV).state, "new");
  assert.equal(E.recurring(month, { lastDone: NOV - 10 * 86400000 }, NOV).state, "ok");
  assert.equal(E.recurring(month, { lastDone: NOV - 31 * 86400000 }, NOV).state, "due");
  assert.equal(E.recurring(spring, null, NOV).state, "new");                            // November: not due
  assert.equal(E.recurring(spring, null, Date.parse("2027-03-15T12:00:00")).state, "due");
  assert.equal(E.recurring(spring, { lastDone: Date.parse("2027-03-20T12:00:00") }, Date.parse("2027-06-01T12:00:00")).state, "ok");
  assert.equal(E.recurring(spring, { lastDone: Date.parse("2026-04-01T12:00:00") }, Date.parse("2027-03-02T12:00:00")).state, "due");
});

test("merge carries tasks and buys; old cards without them still load", () => {
  const a = EMPTY(), b = EMPTY();
  a.tasks = [{ id: "m-plan", done: false, updated: 1 }];
  b.tasks = [{ id: "m-plan", done: true, updated: 9 }]; b.buys = [{ id: "drum", status: "ordered", updated: 9 }];
  const r = E.merge(a, b);
  assert.equal(r.state.tasks[0].done, true); assert.equal(r.state.buys[0].status, "ordered");
  const old = E.sanitize({ people: [{ id: "p", name: "X" }] });
  assert.deepEqual([old.tasks, old.buys], [[], []]);
});

test("v1.1 content: unique ids and every source key resolves", () => {
  const ids = C.missions.phases.flatMap((p) => p.tasks.map((t) => t.id)).concat(C.missions.recurring.map((r) => r.id));
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(C.buy.items.map((i) => i.id)).size, C.buy.items.length);
  for (const i of C.buy.items) assert.ok(C.buy.tiers.some((t) => t.id === i.tier), i.id);
  for (const r of [...C.plan.heat, ...C.comms.ladder, ...C.comms.rules]) if (r.s) assert.ok(C.refs[r.s], r.s);
  assert.ok(!C.playbooks.some((p) => p.soon));
});

test("v1.2: every phone number has a source page (except 911 and Poison Control) and US spelling", () => {
  for (const n of C.numbers) if (!["911", "1-800-222-1222"].includes(n.num)) assert.ok(n.s && C.refs[n.s], n.n);
  assert.ok(!/[Pp]ractise/.test(JSON.stringify(C)));
  assert.equal(C.missions.phases.find((p) => p.id === "dec").tasks.find((t) => t.id === "m-binder").go, "#/binder");
});
