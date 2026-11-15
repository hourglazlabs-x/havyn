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
  assert.equal(C.cards.length, 20);
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
  assert.equal(m.n, C.missions.phases.reduce((a, ph) => a + ph.tasks.length, 0)); assert.equal(m.d, 0);
  assert.deepEqual(m.next.map((x) => x.def.id), ["m-downloads", "m-plan", "m-medid"]);
  S.tasks = [{ id: "m-downloads", done: true, updated: 2 }, { id: "c1", custom: true, t: "Second can opener", phase: "today", done: false, updated: 2 }];
  m = E.missions(C.missions, S, NOV);
  assert.equal(m.n, C.missions.phases.reduce((a, ph) => a + ph.tasks.length, 0) + 1); assert.equal(m.d, 1);
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

test("v1.3 archive catalog: complete, sourced, and consistent", () => {
  const A = C.archive, ids = new Set();
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(A.checked));
  for (const it of A.items) {
    assert.ok(!ids.has(it.id), "duplicate id " + it.id); ids.add(it.id);
    assert.ok(A.tiers.some((t) => t.id === it.tier), it.id + " tier");
    assert.ok(it.t && it.d, it.id + " text");
    if (it.src) assert.ok(C.refs[it.src], it.id + " source " + it.src);
    if (it.get) {
      const g = it.get, kinds = ["zim", "url", "gh", "kx"].filter((k) => g[k]);
      assert.equal(kinds.length, 1, it.id + " exactly one way to fetch");
      if (g.zim) assert.ok(/^[\w.-]+$/.test(g.stem) && !/_\d{4}-\d{2}$/.test(g.stem), it.id + " undated stem");
      if (g.url) assert.ok(/^https:\/\//.test(g.url) && g.name, it.id + " https url + file name");
      if (g.gh || g.kx) new RegExp(g.match);
      assert.ok(it.dir, it.id + " drive folder");
    }
    if (it.file) assert.ok(it.get && it.file.startsWith(it.get.stem + "_"), it.id + " dated file matches stem");
    if (it.u) assert.ok(/^https:\/\//.test(it.u), it.id + " https link");
    if (it.tier === "phone" && it.kind === "zim") assert.equal(it.opens, "havyn", it.id + " phone archives must open in HAVYN");
  }
  const core = A.items.filter((i) => i.tier === "phone" && i.core).reduce((a, i) => a + (i.size || 0), 0);
  assert.ok(core > 2.5e9 && core < 3.1e9, "phone core set about 2.8 GB: " + core);
  assert.ok(A.items.some((i) => i.id === "p-wikimed" && i.core));
});

test("v1.4 reference shelf: every document licensed, fetchable, filed and consistent", () => {
  const S = C.shelf, ids = new Set(), files = new Set();
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(S.checked));
  const sys = new Set(S.systems.map((s) => s.id));
  assert.equal(sys.size, S.systems.length);
  for (const it of S.items) {
    assert.ok(!ids.has(it.id), "duplicate id " + it.id); ids.add(it.id);
    assert.ok(sys.has(it.sys), it.id + " system");
    assert.ok(it.t && it.d && it.by, it.id + " title, description and publisher");
    assert.ok(["pd", "cc-by", "cc-by-sa", "cc-by-nc-sa", "link"].includes(it.lic), it.id + " license");
    assert.ok(/^[A-Za-z0-9][A-Za-z0-9.-]*\.pdf$/.test(it.file), it.id + " plain file name"); assert.ok(!files.has(it.file), "duplicate file " + it.file); files.add(it.file);
    assert.ok(["src", "parts", "ia", "ias", "ox", "dspace", "hp"].some((k) => it[k]), it.id + " has a way to fetch");
    if (it.expect) assert.doesNotThrow(() => new RegExp(it.expect, "i"), it.id + " identity pattern");
    if (it.wb) assert.ok(Array.isArray(it.wb) && it.wb.every((y) => /^\d{4}$/.test(y)), it.id + " Wayback years");
    for (const u of (it.src || []).concat(it.parts || [], it.alt || [])) assert.ok(/^https:\/\//.test(u), it.id + " https " + u);
    if (it.u) assert.ok(/^https:\/\//.test(it.u), it.id + " https page");
    if (it.hp) assert.equal(it.lic, "link", "Hesperian books are never re-hosted");
    if (/Hesperian|Médecins|University of Arizona|Traumatic Stress/.test(it.by)) assert.equal(it.lic, "link", it.id + " publisher's terms");
    assert.ok(it.size > 0, it.id + " size");
  }
  for (const s of S.systems) assert.ok(S.items.some((i) => i.sys === s.id), s.id + " has documents");
  const phone = S.items.filter((i) => i.ph && i.lic !== "link").reduce((a, i) => a + i.size, 0);
  assert.ok(phone > 50e6 && phone < 800e6, "phone set fits HAVYN's Pages site (under 800 MB): " + phone);
  assert.equal(S.items.find((i) => i.id === "sh-cert").file, "FEMA-CERT-Basic-Training-Participant-Manual-2019.pdf", "keeps v1.3 file names so copies already on phones are recognized");
  assert.ok(!C.archive.items.some((i) => i.kind === "pdf"), "manuals live on the shelf now");
  assert.ok(S.others.length >= 5 && S.others.every((o) => o.t && o.d && o.took));
  assert.ok(C.archive.items.some((i) => i.id === "a-dict" && i.kind === "setup"), "offline dictionary and translation setup");
});

test("v1.5 resumable SHA-256 (archive downloads) matches Node's, across random chunks and save/restore", () => {
  const src = require("fs").readFileSync(require("path").join(__dirname, "..", "src", "app.js"), "utf8");
  const a = src.indexOf("  const K256 = "), b = src.indexOf("  // An archive downloaded in parts");
  assert.ok(a > 0 && b > a, "SHA-256 code found in app.js");
  const Sha256 = new Function(src.slice(a, b) + "; return Sha256;")();
  const crypto = require("crypto");
  for (const n of [0, 1, 55, 56, 63, 64, 65, 119, 120, 127, 128, 1000, 65536, 300001, 3 * 1024 * 1024 + 17]) {
    const data = crypto.randomBytes(n), want = crypto.createHash("sha256").update(data).digest("hex");
    let h = new Sha256(), i = 0;
    while (i < n) { const k = Math.min(n - i, 1 + Math.floor(Math.random() * 70000)); h.update(new Uint8Array(data.buffer, data.byteOffset + i, k)); i += k; if (Math.random() < 0.3) h = Sha256.load(JSON.parse(JSON.stringify(h.save()))); }
    assert.equal(h.hex(), want, "length " + n);
  }
  assert.equal(new Sha256().update(new TextEncoder().encode("abc")).hex(), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
});

// ---------------- v1.5 ----------------
test("v1.5 field index: every answer points at a real page of a phone-set document HAVYN hosts", () => {
  const F = C.field, ids = new Set(), groups = new Set(F.groups.map((g) => g[0]));
  assert.ok(F.items.length >= 60, "answers: " + F.items.length);
  assert.match(F.checked, /^\d{4}-\d{2}-\d{2}$/);
  for (const f of F.items) {
    assert.ok(!ids.has(f.id), "duplicate " + f.id); ids.add(f.id);
    assert.ok(groups.has(f.g), f.id + " group " + f.g);
    assert.ok(f.q && f.r.length >= 1, f.id);
    if (f.card) assert.ok(C.cards.some((c) => c.id === f.card), f.id + " card " + f.card);
    if (f.pb) assert.ok(C.playbooks.some((p) => p.id === f.pb && !p.soon), f.id + " playbook " + f.pb);
    for (const [doc, page, what] of f.r) {
      const it = C.shelf.items.find((i) => i.id === doc);
      assert.ok(it, f.id + ": no shelf document " + doc);
      assert.ok(it.ph && it.lic !== "link", f.id + ": " + doc + " must be in the phone set and hosted by HAVYN (same file, same pages)");
      assert.ok(Number.isInteger(page) && page >= 1 && page <= it.pg, f.id + ": " + doc + " p. " + page + " of " + it.pg);
      assert.ok(what && what.length > 3, f.id);
      assert.ok(F.docs[doc], "short name for " + doc);
    }
  }
  // every emergency card with a matching answer gets "Go deeper" pages; the new cards are among them
  for (const id of ["bleeding", "burns", "heatstroke", "heartattack", "unresponsive", "fracture"]) assert.ok(F.items.some((f) => f.card === id), "deeper pages for " + id);
});

test("v1.5 new cards: heart attack, won't wake up, broken bone, poisoning", () => {
  for (const id of ["heartattack", "unresponsive", "fracture", "poison"]) {
    const c = C.cards.find((x) => x.id === id);
    assert.ok(c && c.steps.length >= 5 && c.sources.length >= 3, id);
    assert.match(c.checked, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(c.steps.some((s) => s.call), id + " has a call step");
  }
  const ha = C.cards.find((x) => x.id === "heartattack");
  assert.match(ha.steps.map((s) => s.d).join(" "), /162 to 325 mg/);   // 2024 AHA/Red Cross first aid guideline
  const po = C.cards.find((x) => x.id === "poison");
  assert.ok(po.steps.some((s) => s.call && s.call.num === "1-800-222-1222"));
});
