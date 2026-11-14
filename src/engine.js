/* HAVYN FIELD — autonomy engine and Memory Card merge. Pure functions, no DOM. */
const HAVYN_ENGINE = (() => {
  "use strict";
  // Planning estimates (kcal/day) by age band; each person can override.
  const KCAL = { infant: 0, child: 1400, teen: 2200, adult: 2000, senior: 1800 };
  const ETA = 0.85;        // battery-to-device conversion efficiency
  const PV_DERATE = 0.7;   // portable panel real-world output factor
  const DAY = 86400000;

  const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
  const live = (arr) => (Array.isArray(arr) ? arr.filter((r) => r && !r.deleted) : []);

  function seasonOf(settings, now) {
    const s = (settings && settings.season) || "auto";
    if (s === "heat" || s === "normal") return s;
    const m = new Date(now).getMonth() + 1;
    return m >= 5 && m <= 9 ? "heat" : "normal"; // Phoenix: May–Sep
  }

  function kcalFor(p) {
    if (p.kcal !== undefined && p.kcal !== null && p.kcal !== "" && Number.isFinite(Number(p.kcal))) return Number(p.kcal);
    return KCAL[p.ageBand] !== undefined ? KCAL[p.ageBand] : KCAL.adult;
  }

  function needs(S, now) {
    const season = seasonOf(S.settings, now);
    const m = season === "heat" ? 2 : 1; // gal per person per day
    const people = live(S.people), pets = live(S.pets);
    const petGal = pets.reduce((a, p) => a + num(p.weightLb) / 128, 0); // 1 oz per lb per day
    const settings = S.settings || {};
    return {
      season,
      people: people.length,
      water: m * people.length + petGal,
      food: people.reduce((a, p) => a + kcalFor(p), 0),
      power: num(season === "heat" ? settings.loadWhHeat : settings.loadWhNormal),
      solar: num(settings.solarW) * num(settings.sunHours) * PV_DERATE
    };
  }

  function stock(S) {
    const items = live(S.items);
    const sum = (cat, key) => items.filter((i) => i.category === cat)
      .reduce((a, i) => a + num(i.qty) * num(i.per_unit && i.per_unit[key]), 0);
    return { water: sum("water", "gal"), food: sum("food", "kcal"), power: sum("power", "wh") };
  }

  function medsDays(S) {
    const meds = live(S.items).filter((i) => i.category === "meds" && i.critical && num(i.per_day) > 0);
    if (!meds.length) return { days: null, item: null };
    let best = null;
    for (const i of meds) {
      const d = (num(i.qty) * num(i.per_unit && i.per_unit.doses)) / num(i.per_day);
      if (!best || d < best.days) best = { days: d, item: i };
    }
    return best;
  }

  // Actual daily use from the usage log since the outage started (consumption mode).
  function consumption(S, now) {
    const o = S.outage || {};
    if (!o.active || !o.startedAt) return null;
    const elapsedDays = (now - o.startedAt) / DAY;
    if (elapsedDays < 0.5) return { elapsedDays, rates: {} };
    const rates = {};
    for (const e of live(S.log)) {
      if (e.t < o.startedAt || !e.res) continue;
      rates[e.res] = (rates[e.res] || 0) + num(e.amount);
    }
    for (const k of Object.keys(rates)) rates[k] = rates[k] / elapsedDays;
    return { elapsedDays, rates };
  }

  function daysFor(stockAmt, need) {
    if (!(need > 0)) return null;
    return Math.max(0, stockAmt) / need;
  }

  function autonomy(S, now) {
    const n = needs(S, now), s = stock(S), c = consumption(S, now);
    const rate = (k, planned) => (c && c.rates[k] > 0 ? c.rates[k] : planned);
    const measured = (k) => !!(c && c.rates[k] > 0);
    const water = daysFor(s.water, rate("water", n.water));
    const food = daysFor(s.food, rate("food", n.food));
    const med = medsDays(S);
    let power = null;
    const hasPower = live(S.items).some((i) => i.category === "power");
    if (hasPower || n.power > 0) {
      const load = rate("power", n.power);
      const net = load - n.solar;
      if (!hasPower && !(n.solar > 0)) power = null;
      else if (net <= 0) power = Infinity;
      else power = (s.power * ETA) / net;
    }
    const parts = [["water", water], ["food", food], ["meds", med.days]].filter((p) => p[1] !== null);
    let family = null, limiting = null;
    for (const [k, v] of parts) if (family === null || v < family) { family = v; limiting = k; }
    return {
      season: n.season, needs: n, stock: s, consumption: c,
      water, food, meds: med.days, medsItem: med.item, power, family, limiting,
      measured: { water: measured("water"), food: measured("food"), power: measured("power") }
    };
  }

  function status(days) {
    if (days === null || days === undefined || Number.isNaN(days)) return "none";
    if (days >= 14) return "ok";
    if (days >= 3) return "warn";
    return "crit";
  }

  // What to add to reach the target number of days.
  function gaps(S, now) {
    const n = needs(S, now), s = stock(S);
    const T = num((S.settings || {}).targetDays) || 14;
    const out = [];
    const g = (k, need, have, unit) => { const gap = Math.max(0, T * need - have); if (need > 0 && gap > 0) out.push({ res: k, gap, unit }); };
    g("water", n.water, s.water, "gal");
    g("food", n.food, s.food, "kcal");
    for (const i of live(S.items).filter((x) => x.category === "meds" && x.critical && num(x.per_day) > 0)) {
      const have = num(i.qty) * num(i.per_unit && i.per_unit.doses);
      const gap = Math.max(0, T * num(i.per_day) - have);
      if (gap > 0) out.push({ res: "meds", gap, unit: "doses", name: i.name, id: i.id });
    }
    return { target: T, list: out };
  }

  function expiring(S, now, within) {
    const lim = now + (within || 90) * DAY;
    return live(S.items).filter((i) => i.expires)
      .map((i) => ({ item: i, at: Date.parse(i.expires + "T12:00:00") }))
      .filter((x) => Number.isFinite(x.at) && x.at <= lim)
      .sort((a, b) => a.at - b.at)
      .map((x) => ({ item: x.item, at: x.at, expired: x.at < now, days: Math.round((x.at - now) / DAY) }));
  }

  const HOT = /\b(garage|carport|shed|attic|patio|car|truck|trunk|outside|outdoor|yard|porch)\b/i;
  function hotStorage(S) {
    return live(S.items).filter((i) => i.location && HOT.test(i.location));
  }

  function nextCheckin(times, now) {
    const d = new Date(now);
    const list = (times || []).map((t) => { const [h, m] = String(t).split(":").map(Number); return Number.isFinite(h) ? h * 60 + (m || 0) : null; })
      .filter((x) => x !== null).sort((a, b) => a - b);
    if (!list.length) return null;
    const mins = d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
    let next = list.find((x) => x > mins);
    let add = 0;
    if (next === undefined) { next = list[0]; add = 1440; }
    const inMin = Math.round(next + add - mins);
    const hh = String(Math.floor(next / 60)).padStart(2, "0"), mm = String(next % 60).padStart(2, "0");
    return { at: hh + ":" + mm, inMin };
  }

  // ---- Memory Card merge: newest edit of each record wins; deletions travel as tombstones.
  function mergeColl(a, b) {
    const map = new Map((Array.isArray(a) ? a : []).filter((r) => r && r.id).map((r) => [r.id, r]));
    let added = 0, updated = 0;
    for (const r of Array.isArray(b) ? b : []) {
      if (!r || typeof r.id !== "string") continue;
      const l = map.get(r.id);
      if (!l) { map.set(r.id, r); if (!r.deleted) added++; }
      else if (num(r.updated) > num(l.updated)) { map.set(r.id, r); updated++; }
    }
    return { list: Array.from(map.values()), added, updated };
  }
  function mergeOne(a, b) {
    if (!b || typeof b !== "object") return { rec: a, took: false };
    if (!a || num(b.updated) > num(a.updated)) return { rec: b, took: true };
    return { rec: a, took: false };
  }
  const COLLS = ["people", "pets", "items", "log"];
  const SINGLES = ["settings", "plan", "outage", "checks"];
  function merge(local, incoming) {
    const out = Object.assign({}, local);
    const report = { added: 0, updated: 0, sections: [] };
    for (const k of COLLS) {
      const r = mergeColl(local[k], incoming[k]);
      out[k] = r.list; report.added += r.added; report.updated += r.updated;
      if (r.added || r.updated) report.sections.push(k);
    }
    for (const k of SINGLES) {
      const r = mergeOne(local[k], incoming[k]);
      out[k] = r.rec; if (r.took && local[k]) { report.updated++; report.sections.push(k); }
    }
    return { state: out, report };
  }

  // Coerce an untrusted Memory Card payload into the expected shape.
  function sanitize(data) {
    const str = (v, max) => (v === undefined || v === null ? "" : String(v)).slice(0, max || 2000);
    const rec = (r) => (r && typeof r === "object" && typeof r.id === "string" ? r : null);
    const out = {};
    for (const k of COLLS) out[k] = (Array.isArray(data && data[k]) ? data[k] : []).map(rec).filter(Boolean).slice(0, 20000);
    for (const k of SINGLES) out[k] = data && data[k] && typeof data[k] === "object" ? data[k] : undefined;
    for (const p of out.people) { p.name = str(p.name, 120); }
    for (const i of out.items) { i.name = str(i.name, 160); i.qty = num(i.qty); if (i.per_unit && typeof i.per_unit !== "object") i.per_unit = {}; }
    return out;
  }

  return { KCAL, ETA, PV_DERATE, seasonOf, kcalFor, needs, stock, medsDays, consumption, autonomy, status, gaps, expiring, hotStorage, nextCheckin, merge, mergeColl, sanitize, live };
})();
if (typeof module !== "undefined") module.exports = HAVYN_ENGINE;
