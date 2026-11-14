/* HAVYN FIELD — app. Vanilla JS, no network, no dependencies. */
(() => {
  "use strict";
  const C = HAVYN_CONTENT, E = HAVYN_ENGINE;
  const VERSION = "__VERSION__";
  const PREVIEW = !!window.HAVYN_PREVIEW;
  const DAY = 86400000;
  const t0 = performance.now();

  /* ---------------- utilities ---------------- */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (v) => String(v === undefined || v === null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const now = () => Date.now();
  const num = (v) => { const n = Number(String(v === undefined || v === null ? "" : v).replace(",", ".").trim()); return Number.isFinite(n) ? n : 0; };
  const optNum = (v) => (String(v === undefined || v === null ? "" : v).trim() === "" ? "" : num(v));
  const ymd = (t) => { const d = new Date(t); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const fmtDays = (d) => (d === null || d === undefined ? "—" : d === Infinity ? "∞" : d >= 100 ? Math.round(d).toString() : (Math.round(d * 10) / 10).toFixed(1));
  const fmtN = (n, dp) => { const p = Math.pow(10, dp || 0); const r = Math.round(n * p) / p; return r.toLocaleString("en-US", { maximumFractionDigits: dp || 0 }); };
  const dur = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h > 23 ? Math.floor(h / 24) + "d " + String(h % 24).padStart(2, "0") : String(h).padStart(2, "0")) + ":" + String(m).padStart(2, "0") + ":" + String(x).padStart(2, "0"); };
  const STATUS_WORD = { ok: "OK", warn: "LOW", crit: "CRITICAL", none: "NO DATA" };
  const RES = {
    water: { label: "Water", unit: "gal", key: "gal", icon: "drop" },
    food: { label: "Food", unit: "kcal", key: "kcal", icon: "food" },
    meds: { label: "Meds", unit: "doses", key: "doses", icon: "pill" },
    power: { label: "Power", unit: "Wh", key: "wh", icon: "bolt" },
    gear: { label: "Gear", unit: "", key: null, icon: "box" }
  };

  /* ---------------- icons ---------------- */
  const P = {
    drop: '<path d="M12 3c3.6 4.6 6 8 6 11a6 6 0 0 1-12 0c0-3 2.4-6.4 6-11z"/>',
    food: '<path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M9 7c0-1.4.9-1.8.9-3M13 7c0-1.4.9-1.8.9-3"/>',
    pill: '<path d="M10.5 3.5a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7-7z"/><path d="M7 7l7 7"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    box: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M8 12h2l1-2 2 4 1-2h2"/>',
    choke: '<circle cx="12" cy="7" r="3.2"/><path d="M6.5 21v-2.5a5.5 5.5 0 0 1 11 0V21"/><path d="M10 14l2 1.6 2-1.6"/>',
    allergy: '<path d="M14.5 3.5l6 6M17.5 6.5l-9 9-3.5 1 1-3.5 9-9M5 19l-2 2"/>',
    brain: '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 3 5 3 3 0 0 0 5 1.5V5a3 3 0 0 0-3-1zM12 5a3 3 0 0 1 3-1 3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-3 5 3 3 0 0 1-5 1.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    gas: '<path d="M7 18a4 4 0 0 1-.6-8A5.5 5.5 0 0 1 17 8.6 4.6 4.6 0 0 1 17 18z"/><path d="M9 14h6"/>',
    flame: '<path d="M12 3c1 3 5 5.2 5 10a5 5 0 0 1-10 0c0-2.5 1.4-4.1 2.5-5 .3 1.6 1 2.6 2 3 .5-2.6-.5-5.4.5-8z"/>',
    pulse: '<path d="M3 12h4l2-5 3 10 2-6 2 3h5"/>',
    wind: '<path d="M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7"/>',
    people: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17.5" cy="9" r="2.4"/><path d="M15.8 14.3A5 5 0 0 1 21 19"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H19v-5"/><path d="M8 7h7M8 10.5h5"/>',
    towers: '<path d="M5 20V12M10 20V6M15 20v-5M20 20V9"/>',
    card: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 3v4.5M12 3v4.5M15.5 3v4.5"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    cross: '<path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z"/>',
    phone: '<path d="M5 3h4l2 5-2.5 1.6a11 11 0 0 0 5.9 5.9L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    chev: '<path d="M9 5l7 7-7 7"/>',
    paw: '<circle cx="7" cy="9" r="1.8"/><circle cx="11" cy="6" r="1.8"/><circle cx="15" cy="6.5" r="1.8"/><circle cx="18" cy="10" r="1.8"/><path d="M12 12c-3 0-6 3.5-5 6 1 2 3.5 1 5 1s4 1 5-1c1-2.5-2-6-5-6z"/>',
    pin: '<path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>'
  };
  const ic = (n, cls) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (cls ? ' class="' + cls + '"' : "") + ">" + (P[n] || "") + "</svg>";
  const icFill = (n) => '<svg viewBox="0 0 24 24" aria-hidden="true">' + P[n] + "</svg>";
  const MARK = '<svg viewBox="0 0 26 26" aria-hidden="true"><defs><linearGradient id="mk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8fdff"/><stop offset="1" stop-color="#2fb4ff"/></linearGradient></defs><rect x="2.5" y="11" width="5" height="12" rx="1.2" fill="url(#mk)" opacity=".55"/><rect x="10.5" y="4" width="5" height="19" rx="1.2" fill="url(#mk)"/><rect x="18.5" y="8" width="5" height="15" rx="1.2" fill="url(#mk)" opacity=".75"/></svg>';

  /* ---------------- storage (IndexedDB, memory fallback) ---------------- */
  const Store = (() => {
    let db = null; const mem = {};
    const open = () => new Promise((res) => {
      try {
        const r = indexedDB.open("havyn-field", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("kv");
        r.onsuccess = () => { db = r.result; res(true); };
        r.onerror = r.onblocked = () => res(false);
      } catch (e) { res(false); }
    });
    const tx = (mode, fn) => new Promise((res) => {
      if (!db) return res(fn(null));
      try { const t = db.transaction("kv", mode); const s = t.objectStore("kv"); const out = fn(s); t.oncomplete = () => res(out && out.result !== undefined ? out.result : out); t.onerror = () => res(undefined); }
      catch (e) { res(undefined); }
    });
    return {
      open,
      get ok() { return !!db; },
      get: (k) => (db ? tx("readonly", (s) => s.get(k)) : Promise.resolve(mem[k])),
      set: (k, v) => { mem[k] = v; return db ? tx("readwrite", (s) => { s.put(v, k); return true; }) : Promise.resolve(true); },
      del: (k) => { delete mem[k]; return db ? tx("readwrite", (s) => { s.delete(k); return true; }) : Promise.resolve(true); },
      keys: () => (db ? tx("readonly", (s) => s.getAllKeys()) : Promise.resolve(Object.keys(mem)))
    };
  })();

  /* ---------------- state ---------------- */
  const defaults = () => ({
    settings: { season: "auto", targetDays: 14, loadWhNormal: 300, loadWhHeat: 1080, solarW: 0, sunHours: 6.5, checkins: ["08:00", "12:00", "18:00"], updated: 0 },
    plan: { contactName: "", contactPhone: "", rally1: "Home", rally2: "", rally3: "", leaveTo: "", leaveNotes: "", gas: "", water: "", power: "", updated: 0 },
    outage: { active: false, startedAt: 0, endedAt: 0, updated: 0 },
    checks: { updated: 0 },
    people: [], pets: [], items: [], log: []
  });
  const prefDefaults = () => ({ theme: "void", sound: true, deviceName: "", lastBackup: 0, installHidden: false });
  let S = defaults(), PR = prefDefaults();
  let saveTimer = null;
  function save() { clearTimeout(saveTimer); saveTimer = setTimeout(flush, 120); }
  function flush() { clearTimeout(saveTimer); Store.set("state", S); Store.set("prefs", PR); }
  function touch(o) { o.updated = now(); return o; }
  function upsert(coll, rec) {
    touch(rec);
    const i = S[coll].findIndex((r) => r.id === rec.id);
    if (i >= 0) S[coll][i] = rec; else S[coll].push(rec);
    save(); requestPersist();
  }
  function remove(coll, id) { const i = S[coll].findIndex((r) => r.id === id); if (i >= 0) S[coll][i] = { id, deleted: true, updated: now() }; save(); }
  function setOne(key, patch) { S[key] = Object.assign({}, S[key], patch); touch(S[key]); save(); }
  const L = (coll) => E.live(S[coll]);
  const byId = (coll, id) => L(coll).find((r) => r.id === id);

  let persistAsked = false;
  function requestPersist() {
    if (persistAsked || !navigator.storage || !navigator.storage.persist) return;
    persistAsked = true; navigator.storage.persist().catch(() => {});
  }

  /* ---------------- sound (synthesized, no files) ---------------- */
  const Snd = (() => {
    let ac = null;
    const ctx = () => {
      if (!ac) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; try { ac = new A(); } catch (e) { return null; } }
      if (ac.state === "suspended") ac.resume().catch(() => {});
      return ac;
    };
    const tone = (f, t, d, g, type) => {
      const a = ctx(); if (!a) return;
      const o = a.createOscillator(), v = a.createGain();
      o.type = type || "sine"; o.frequency.setValueAtTime(f, t);
      v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(g, t + 0.008); v.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(v).connect(a.destination); o.start(t); o.stop(t + d + 0.03);
    };
    const chime = (kind) => {
      if (!PR.sound || document.body.classList.contains("em")) return;
      const a = ctx(); if (!a) return; const t = a.currentTime + 0.01;
      if (kind === "nav") { tone(1318.5, t, 0.16, 0.022); tone(2637, t, 0.09, 0.006); }
      else if (kind === "ok") [1046.5, 1318.5, 1568].forEach((f, i) => { tone(f, t + i * 0.07, 0.42, 0.028); tone(f * 2.01, t + i * 0.07, 0.25, 0.006); });
      else if (kind === "save") [784, 1046.5, 1318.5, 1568, 2093].forEach((f, i) => { tone(f, t + i * 0.085, 0.6, 0.026); tone(f * 2.01, t + i * 0.085, 0.3, 0.006); });
      else if (kind === "warn") { tone(392, t, 0.25, 0.04, "triangle"); tone(330, t + 0.16, 0.35, 0.04, "triangle"); }
    };
    const click = (t) => { tone(1760, t, 0.045, 0.32, "square"); tone(880, t, 0.06, 0.18); };
    return { ctx, chime, click };
  })();

  // CPR metronome: audio clock drives the clicks; the visual follows the same clock.
  const Metro = {
    on: false, sound: true, bpm: 110, nextT: 0, timer: 0, raf: 0, p0: 0, a0: 0, startedAt: 0,
    start(bpm) {
      this.stop(); this.bpm = bpm; this.on = true; this.startedAt = now();
      const a = this.sound ? Snd.ctx() : null;
      try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
      this.p0 = performance.now() + 60;
      if (a) { this.a0 = a.currentTime + 0.06; this.nextT = this.a0; this.schedule(); }
      this.loop();
    },
    schedule() {
      const a = Snd.ctx(); if (!a || !this.on || !this.sound) return;
      const spb = 60 / this.bpm;
      while (this.nextT < a.currentTime + 0.25) { Snd.click(this.nextT); this.nextT += spb; }
      this.timer = setTimeout(() => this.schedule(), 60);
    },
    loop() {
      const el = $(".beat"); if (!el || !this.on) return;
      const spb = 60 / this.bpm;
      const a = this.sound ? Snd.ctx() : null;
      const t = a && a.state === "running" ? a.currentTime - this.a0 : (performance.now() - this.p0) / 1000;
      const ph = ((t % spb) + spb) % spb / spb;
      el.classList.toggle("hit", ph < 0.22);
      const tEl = $("#cprtime");
      if (tEl) { const s = Math.floor((now() - this.startedAt) / 1000); tEl.textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); const sw = $("#swap"); if (sw) sw.classList.toggle("hide", !(s >= 120 && (s % 120) < 10)); }
      cancelAnimationFrame(this.raf);
      this.raf = requestAnimationFrame(() => this.loop());
    },
    stop() {
      this.on = false; clearTimeout(this.timer); cancelAnimationFrame(this.raf);
      try { if (navigator.audioSession) navigator.audioSession.type = "auto"; } catch (e) {}
    }
  };

  // Keep the screen on during emergency screens.
  const Wake = { lock: null,
    async on() { try { if (!this.lock && navigator.wakeLock) { this.lock = await navigator.wakeLock.request("screen"); this.lock.addEventListener("release", () => { this.lock = null; }); } } catch (e) {} },
    off() { try { if (this.lock) this.lock.release(); } catch (e) {} this.lock = null; }
  };

  /* ---------------- router ---------------- */
  const app = () => $("#app");
  let route = { path: "status", parts: [], q: {} };
  function parseHash() {
    const h = (location.hash || "#/status").replace(/^#\/?/, "");
    const [p, qs] = h.split("?");
    const parts = p.split("/").filter(Boolean);
    const q = {}; (qs || "").split("&").filter(Boolean).forEach((kv) => { const [k, v] = kv.split("="); q[decodeURIComponent(k)] = decodeURIComponent(v || ""); });
    return { path: parts[0] || "status", parts, q };
  }
  function go(h) { if (location.hash === h) render(); else location.hash = h; }

  const SCREENS = {
    status: renderStatus, emergency: renderEmergency, playbooks: renderPlaybooks, family: renderFamily, supplies: renderSupplies, system: renderSystem
  };
  let lastPath = "";
  function render() {
    route = parseHash();
    const em = route.path === "emergency";
    document.body.classList.toggle("em", em);
    document.body.classList.toggle("night", PR.theme === "night");
    if (em) Wake.on(); else { Wake.off(); Metro.stop(); cardView.id = null; cardView.autoBeat = false; }
    if (!(route.path === "supplies" && route.parts[1] === "edit")) draft = null;
    const fn = SCREENS[route.path] || renderStatus;
    const html = fn();
    app().innerHTML = html;
    $$(".tab").forEach((t) => t.classList.toggle("on", t.dataset.tab === route.path));
    if (lastPath !== location.hash) { window.scrollTo(0, 0); lastPath = location.hash; }
    afterRender();
  }
  function afterRender() {
    tick();
    hydratePhotos();
    if (route.path === "emergency" && cardView.beatStep && Metro.on === false && cardView.autoBeat) { Metro.start(cardView.beatStep); }
    if (!$(".beat")) Metro.stop(); else if (Metro.on) Metro.loop();
  }

  /* ---------------- shared chrome ---------------- */
  function topbar(title) {
    return '<header class="top"><a class="brand" href="#/status" aria-label="HAVYN FIELD home">' + MARK + "<b>HAVYN</b><span>FIELD</span></a>" +
      '<div class="tools"><button class="ibtn' + (PR.theme === "night" ? " on" : "") + '" data-act="night" aria-label="Night mode">' + ic("moon") + "</button>" +
      '<a class="ibtn" href="#/system" aria-label="Memory card and settings">' + ic("card") + "</a></div></header>" +
      (title ? '<div class="sec" style="margin-top:4px"><span class="lab">' + esc(title) + "</span></div>" : "");
  }
  function backbar(href, label) {
    return '<header class="top"><a class="ibtn" href="' + href + '" aria-label="Back">' + ic("back") + '</a><span class="lab">' + esc(label) + '</span><span style="width:44px"></span></header>';
  }
  const srcLine = (list) => list.map((s) => '<a href="' + esc(s.u) + '" target="_blank" rel="noopener">' + esc(s.n) + "</a>").join(" · ");

  /* ---------------- STATUS ---------------- */
  function towersSVG(a) {
    const W = 360, H = 262, ground = 200, w = 50, d = 24;
    const xs = [52, 136, 220, 304];
    const rs = [["water", a.water], ["food", a.food], ["meds", a.meds], ["power", a.power]];
    const color = { ok: "var(--ok)", warn: "var(--warn)", crit: "var(--crit)", none: "var(--none)", solar: "var(--solar)" };
    let out = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Days of supply: ' + rs.map(([k, v]) => k + " " + fmtDays(v)).join(", ") + '"><defs>';
    rs.forEach(([k, v]) => {
      const st = v === Infinity ? "solar" : E.status(v);
      out += '<linearGradient id="g' + k + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:' + color[st] + ';stop-opacity:.62"/><stop offset="1" style="stop-color:' + color[st] + ';stop-opacity:.06"/></linearGradient>';
    });
    out += '<radialGradient id="floor" cx="50%" cy="0%" r="70%"><stop offset="0" style="stop-color:var(--cyan);stop-opacity:.20"/><stop offset="1" style="stop-color:var(--cyan);stop-opacity:0"/></radialGradient></defs>';
    // floor grid in perspective
    out += '<g opacity=".55"><ellipse cx="180" cy="' + (ground + 8) + '" rx="190" ry="34" fill="url(#floor)"/>';
    for (let i = 0; i < 5; i++) { const y = ground + 2 + i * i * 3.2 + i * 4; out += '<line x1="' + (6 + i * 6) + '" y1="' + y + '" x2="' + (354 - i * 6) + '" y2="' + y + '" style="stroke:var(--cyan)" stroke-opacity="' + (0.22 - i * 0.035) + '" stroke-width="1"/>'; }
    for (let i = -6; i <= 6; i++) { out += '<line x1="' + (180 + i * 22) + '" y1="' + (ground + 2) + '" x2="' + (180 + i * 52) + '" y2="' + (ground + 60) + '" style="stroke:var(--cyan)" stroke-opacity=".08" stroke-width="1"/>'; }
    out += "</g>";
    rs.forEach(([k, v], i) => {
      const x = xs[i];
      const st = v === Infinity ? "solar" : E.status(v);
      const hgt = v === null ? 14 : v === Infinity ? 150 : 16 + Math.min(v, 30) / 30 * 138;
      const y = ground, top = y - hgt;
      const L = [[x - w / 2, y], [x, y + d / 2], [x, top + d / 2], [x - w / 2, top]];
      const R = [[x, y + d / 2], [x + w / 2, y], [x + w / 2, top], [x, top + d / 2]];
      const T = [[x - w / 2, top], [x, top + d / 2], [x + w / 2, top], [x, top - d / 2]];
      const pts = (a) => a.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
      const c = color[st];
      const ghost = v === null;
      out += '<g class="twlink" data-go="#/supplies' + (k === "power" || k === "meds" || k === "water" || k === "food" ? "?cat=" + k : "") + '" tabindex="0" role="link" aria-label="' + RES[k].label + " " + fmtDays(v) + ' days">';
      out += '<g class="tw" style="animation-delay:' + (i * 0.07).toFixed(2) + "s," + (-i * 1.7).toFixed(1) + 's">';
      out += '<ellipse cx="' + x + '" cy="' + (y + d / 2 + 2) + '" rx="' + (w * 0.72) + '" ry="9" style="fill:' + c + '" opacity="' + (ghost ? 0.05 : 0.16) + '"/>';
      if (ghost) {
        out += '<polygon points="' + pts(L) + '" fill="none" style="stroke:var(--none)" stroke-dasharray="3 3"/><polygon points="' + pts(R) + '" fill="none" style="stroke:var(--none)" stroke-dasharray="3 3"/><polygon points="' + pts(T) + '" fill="none" style="stroke:var(--none)" stroke-dasharray="3 3"/>';
      } else {
        out += '<polygon points="' + pts(L) + '" fill="url(#g' + k + ')" style="stroke:' + c + '" stroke-opacity=".75" stroke-width="1"/>';
        out += '<polygon points="' + pts(R) + '" fill="url(#g' + k + ')" opacity=".72" style="stroke:' + c + '" stroke-opacity=".55" stroke-width="1"/>';
        out += '<polygon points="' + pts(T) + '" style="fill:' + c + ';stroke:#fff" fill-opacity=".55" stroke-opacity=".7" stroke-width="1"/>';
        out += '<line x1="' + (x - w / 2 + 3) + '" y1="' + (top + 4) + '" x2="' + (x - w / 2 + 3) + '" y2="' + (y - 6) + '" stroke="#fff" stroke-opacity=".38" stroke-width="1.4"/>';
      }
      out += '<text x="' + x + '" y="' + (top - d / 2 - 10) + '" text-anchor="middle" style="fill:var(--ink);font:300 22px var(--mono)">' + fmtDays(v) + "</text>";
      out += "</g>";
      out += '<text x="' + x + '" y="' + (ground + 38) + '" text-anchor="middle" style="fill:var(--ink2);font:600 10.5px var(--mono);letter-spacing:.16em">' + RES[k].label.toUpperCase() + "</text>";
      out += '<text x="' + x + '" y="' + (ground + 53) + '" text-anchor="middle" style="fill:' + c + ';font:600 9px var(--mono);letter-spacing:.14em">' + (st === "solar" ? "SOLAR" : STATUS_WORD[st]) + "</text>";
      out += "</g>";
    });
    return out + "</svg>";
  }

  function renderStatus() {
    const t = now();
    const a = E.autonomy(S, t);
    const people = L("people");
    let h = topbar();
    const fam = a.family;
    const st = E.status(fam);
    h += '<section class="glass hero"><div class="lab">Family autonomy</div>';
    if (!people.length) {
      h += '<div class="num"><span class="big">—</span><span class="unit">DAYS</span></div><div class="sub">Add your household and supplies to see how long you can last.</div></section>';
    } else {
      h += '<div class="num"><span class="big">' + fmtDays(fam) + '</span><span class="unit">DAYS</span> <span class="chip ' + st + '">' + STATUS_WORD[st] + "</span></div>";
      h += '<div class="sub">' + (a.limiting ? "Limited by <b>" + esc(RES[a.limiting].label.toLowerCase()) + "</b> · " : "") + "target " + E.gaps(S, t).target + " days · " +
        '<span class="chip ' + (a.season === "heat" ? "heat" : "") + '">' + (a.season === "heat" ? "Heat mode" : "Normal mode") + "</span>" +
        (a.measured.water || a.measured.food || a.measured.power ? ' <span class="chip cyan">Measured use</span>' : "") + "</div></section>";
    }
    h += '<div class="scene">' + towersSVG(a) + "</div>";

    // Outage + check-in
    const o = S.outage || {};
    const nc = E.nextCheckin(S.settings.checkins, t);
    h += '<div class="grid2"><section class="glass panel"><div class="lab">Outage clock</div>';
    if (o.active) h += '<div class="mono" style="font-size:1.6rem;margin:6px 0" data-tick="outage">' + dur(t - o.startedAt) + '</div><button class="btn ghost sm" data-act="outage-stop">Power is back</button>';
    else h += '<div class="mono" style="font-size:1.6rem;margin:6px 0;color:var(--mute)">00:00:00</div><button class="btn sm" data-act="outage-start">Start</button>';
    h += '</section><section class="glass panel"><div class="lab">Next check-in</div>' +
      (nc ? '<div class="mono" style="font-size:1.6rem;margin:6px 0">' + nc.at + '</div><div style="color:var(--ink2)" data-tick="checkin">in ' + Math.floor(nc.inMin / 60) + "h " + (nc.inMin % 60) + "m</div>" : '<div style="margin-top:8px;color:var(--mute)">Set times in settings</div>') +
      "</section></div>";

    // Alerts
    const alerts = [];
    if (!people.length && !L("items").length) {
      alerts.push('<div class="glass panel"><h3>Start here</h3><div class="list">' +
        '<a class="li" href="#/family">' + '<span class="ic">' + ic("people") + '</span><span class="tx"><b>1. Add your household</b><small>People, pets, contacts, meeting places</small></span>' + ic("chev") + "</a>" +
        '<a class="li" href="#/supplies">' + '<span class="ic">' + ic("box") + '</span><span class="tx"><b>2. Add supplies</b><small>Water, food, critical meds, batteries</small></span>' + ic("chev") + "</a>" +
        '<a class="li" href="#/system">' + '<span class="ic">' + ic("card") + '</span><span class="tx"><b>3. Save a Memory Card</b><small>Back up and share to every phone</small></span>' + ic("chev") + "</a>" +
        '</div><div class="btnrow" style="margin-top:12px"><button class="btn ghost" data-act="example">Try with an example household</button></div></div>');
    }
    if (L("items").some((i) => i.example) || L("people").some((p) => p.example)) alerts.push('<button class="alert info" data-act="clear-example" style="width:100%;text-align:left"><span class="dot"></span><span><b>Example data loaded</b><small>Tap to remove it and start with your own.</small></span></button>');
    if (!PREVIEW && !isStandalone() && !PR.installHidden) alerts.push('<div class="alert info"><span class="dot"></span><span><b>Install for offline use</b><small>In Safari tap Share, then Add to Home Screen. Open it from the icon once while online.</small></span><button class="ibtn" data-act="hide-install" aria-label="Dismiss" style="margin-left:auto;width:36px;height:36px">×</button></div>');
    if ((people.length || L("items").length) && t - (PR.lastBackup || 0) > 30 * DAY) alerts.push('<a class="alert" href="#/system"><span class="dot"></span><span><b>Save a Memory Card</b><small>Last backup: ' + (PR.lastBackup ? ymd(PR.lastBackup) : "never") + "</small></span></a>");
    const ex = E.expiring(S, t, 90);
    if (ex.length) { const bad = ex.filter((x) => x.expired).length; alerts.push('<a class="alert' + (bad ? " crit" : "") + '" href="#/supplies"><span class="dot"></span><span><b>' + ex.length + " item" + (ex.length > 1 ? "s" : "") + " expire within 90 days</b><small>" + (bad ? bad + " already expired · " : "") + "Use them in normal life and replace</small></span></a>"); }
    const hot = E.hotStorage(S);
    if (hot.length) alerts.push('<a class="alert" href="#/supplies"><span class="dot"></span><span><b>' + hot.length + " item" + (hot.length > 1 ? "s" : "") + " stored somewhere hot</b><small>Phoenix garages and cars cook food, medicine and batteries</small></span></a>");
    const g = E.gaps(S, t);
    if (people.length && g.list.length) alerts.push('<a class="alert" href="#/supplies"><span class="dot"></span><span><b>To reach ' + g.target + " days</b><small>" + g.list.slice(0, 3).map((x) => "+" + fmtN(x.gap, x.unit === "gal" ? 1 : 0) + " " + x.unit + " " + (x.name ? esc(x.name) : x.res)).join(" · ") + "</small></span></a>");
    if (alerts.length) h += '<div class="sec"><span class="lab">Attention</span></div>' + alerts.join("");
    if (PREVIEW) h += '<div class="alert info"><span class="dot"></span><span><b>Preview build</b><small>Data stays in this browser only. Install from your own link for offline use on iPhone.</small></span></div>';
    return h;
  }

  /* ---------------- EMERGENCY ---------------- */
  const cardView = { id: null, step: 0, beatStep: 0, autoBeat: false };
  function emTop() {
    return '<div class="emtop"><a class="exit" href="#/status">EXIT</a><a class="call" href="tel:911">' + ic("phone") + "CALL 911</a></div>";
  }
  function renderEmergency() {
    const id = route.parts[1];
    if (id) return renderCard(id);
    cardView.id = null; cardView.beatStep = 0;
    let h = emTop() + '<div class="emgrid">';
    for (const c of C.cards) h += '<a class="emtile" href="#/emergency/' + c.id + '">' + ic(c.icon) + "<span><b>" + esc(c.title) + "</b><br><small>" + esc(c.sub) + "</small></span></a>";
    h += "</div>";
    h += '<div class="emnote">' + esc(C.noSignal) + "</div>";
    h += '<p class="emsrc">Cards: ' + esc(C.gate) + ". Checked against sources " + esc(C.reviewed) + ". Training beats any app: take a CPR and Stop the Bleed class.</p>";
    return h;
  }
  function renderCard(id) {
    const c = C.cards.find((x) => x.id === id);
    if (!c) return renderEmergency();
    if (cardView.id !== id) { cardView.id = id; cardView.step = 0; }
    const n = c.steps.length, i = Math.min(cardView.step, n - 1), s = c.steps[i];
    cardView.beatStep = s.beat || 0;
    let h = emTop();
    h += '<div class="emhead"><span>' + esc(c.title) + "</span><span>Step " + (i + 1) + " of " + n + "</span></div>";
    h += '<div class="dots">' + c.steps.map((_, k) => "<i" + (k <= i ? ' class="on"' : "") + "></i>").join("") + "</div>";
    h += '<div class="emstep">' + esc(s.t) + '</div><div class="emdet">' + esc(s.d) + "</div>";
    if (s.beat) {
      h += '<div class="beat" aria-hidden="true"><div><b>PUSH</b><small>' + s.beat + " / min</small></div></div>";
      h += '<div class="cprbar"><span>Time <b class="mono" id="cprtime">0:00</b> <span id="swap" class="swap hide">SWITCH</span></span>' +
        '<button data-act="beat-toggle">' + (Metro.on || cardView.autoBeat ? "Stop beat" : "Start beat") + "</button>" +
        '<button data-act="beat-sound">' + (Metro.sound ? "Sound on" : "Sound off") + "</button></div>";
    }
    if (s.link) h += '<a class="emlink" href="#/emergency/' + s.link + '" data-act="card-jump" data-card="' + s.link + '">Open ' + esc(C.cards.find((x) => x.id === s.link).title) + " card</a>";
    h += '<div class="emnav"><button data-act="step-prev"' + (i === 0 ? " disabled" : "") + ">BACK</button>" +
      (i < n - 1 ? '<button class="next" data-act="step-next">NEXT</button>' : '<a class="next" href="#/emergency">ALL CARDS</a>') + "</div>";
    if (c.note) h += '<div class="emnote">' + esc(c.note) + "</div>";
    if (c.noteLink) h += '<a class="emlink" href="#/emergency/' + c.noteLink + '" data-act="card-jump">Open ' + esc(C.cards.find((x) => x.id === c.noteLink).title) + " card</a>";
    h += '<div class="emsrc">' + esc(C.noSignal) + '<br><br>Source: ' + srcLine(c.sources) + "<br>Checked " + esc(C.reviewed) + " · " + esc(C.gate) + "</div>";
    return h;
  }
  function stepTo(delta) {
    const c = C.cards.find((x) => x.id === cardView.id); if (!c) return;
    cardView.step = Math.max(0, Math.min(c.steps.length - 1, cardView.step + delta));
    const s = c.steps[cardView.step];
    if (s.beat) { cardView.autoBeat = true; Snd.ctx(); } else { Metro.stop(); }
    render();
  }

  /* ---------------- PLAYBOOKS ---------------- */
  function renderPlaybooks() {
    const id = route.parts[1];
    if (id) return renderPlaybook(id);
    let h = topbar("Playbooks");
    h += '<div class="list">';
    for (const p of C.playbooks) {
      if (p.soon) h += '<div class="li soon"><span class="ic">' + ic(p.icon) + '</span><span class="tx"><b>' + esc(p.title) + "</b><small>" + esc(p.sub) + "</small></span></div>";
      else {
        const done = countChecks(p);
        h += '<a class="li" href="#/playbooks/' + p.id + '"><span class="ic">' + ic(p.icon) + '</span><span class="tx"><b>' + esc(p.title) + "</b><small>" + esc(p.sub) + '</small></span><span class="rt">' + done.d + "/" + done.n + "</span>" + ic("chev") + "</a>";
      }
    }
    h += "</div>";
    h += '<p class="empty" style="margin-top:14px">Each playbook: what to do in the first 10 minutes, hour, day, and the hard rule for leaving. Tick items as you go; reset after the event.</p>';
    return h;
  }
  function countChecks(p) {
    const ch = (S.checks && S.checks[p.id]) || {};
    let n = 0, d = 0; p.phases.forEach((ph, a) => ph.items.forEach((_, b) => { n++; if (ch[a + "." + b]) d++; }));
    return { n, d };
  }
  function renderPlaybook(id) {
    const p = C.playbooks.find((x) => x.id === id && !x.soon);
    if (!p) return renderPlaybooks();
    const ch = (S.checks && S.checks[p.id]) || {};
    let h = backbar("#/playbooks", "Playbook");
    h += '<section class="glass hero"><div class="lab">Playbook</div><h2 style="margin:6px 0 4px;font-size:1.6rem">' + esc(p.title) + '</h2><div class="sub">' + esc(p.trigger) + "</div></section>";
    h += '<section class="panel" style="border:2px solid var(--crit);border-radius:var(--r);background:rgba(255,77,94,.06)"><h3 style="color:var(--crit)">Hard rule: leave now if</h3>' +
      p.leave.map((l) => '<div class="kv"><span style="color:var(--ink)">' + esc(l) + "</span></div>").join("") +
      (S.plan.leaveTo ? '<div class="kv"><span>Destination</span><span>' + esc(S.plan.leaveTo) + "</span></div>" : '<div class="kv"><span>Destination</span><a href="#/family/plan">Set it now</a></div>') + "</section>";
    p.phases.forEach((ph, a) => {
      h += '<section class="glass panel"><h3>' + esc(ph.label) + "</h3>";
      ph.items.forEach((it, b) => {
        const k = a + "." + b, on = !!ch[k];
        h += '<label class="chk' + (on ? " done" : "") + '"><input type="checkbox" data-chk="' + p.id + "|" + k + '"' + (on ? " checked" : "") + '><span class="tx"><b>' + esc(it.t) + "</b>" +
          (it.d ? "<small>" + esc(it.d) + "</small>" : "") +
          (it.s && C.refs[it.s] ? '<small class="mono" style="font-size:.7rem;margin-top:4px">' + esc(C.refs[it.s].n) + "</small>" : "") +
          (it.act === "outage-start" && !(S.outage && S.outage.active) ? '<span style="display:block;margin-top:8px"><button class="btn sm" data-act="outage-start">Start outage clock</button></span>' : "") +
          (it.go ? '<span style="display:block;margin-top:8px"><a class="btn ghost sm" href="#/playbooks/' + it.go + '">Open</a></span>' : "") +
          (it.card ? '<span style="display:block;margin-top:8px"><a class="btn red sm" href="#/emergency/' + it.card + '">Open card</a></span>' : "") +
          "</span></label>";
      });
      h += "</section>";
    });
    h += '<div class="btnrow"><button class="btn ghost" data-act="reset-checks" data-id="' + p.id + '">Reset checklist</button></div>';
    h += '<p class="empty" style="margin-top:14px;font-size:.85rem">Sources: ' + srcLine(p.sources.map((k) => C.refs[k])) + "<br>Checked " + esc(C.reviewed) + ".</p>";
    return h;
  }

  /* ---------------- FAMILY ---------------- */
  const AGE = { infant: "Infant (under 1)", child: "Child (1–12)", teen: "Teen (13–17)", adult: "Adult (18–64)", senior: "65 or older" };
  function renderFamily() {
    const sub = route.parts[1];
    if (sub === "person") return renderPersonForm(route.parts[2]);
    if (sub === "pet") return renderPetForm(route.parts[2]);
    if (sub === "plan") return renderPlanForm();
    let h = topbar("Family");
    const pl = S.plan || {};
    h += '<section class="glass panel"><h3>Plan</h3>' +
      '<div class="kv"><span>Out-of-area contact</span><span>' + (pl.contactName ? esc(pl.contactName) + (pl.contactPhone ? ' · <a href="tel:' + esc(pl.contactPhone.replace(/[^0-9+]/g, "")) + '">' + esc(pl.contactPhone) + "</a>" : "") : '<span style="color:var(--mute)">not set</span>') + "</span></div>" +
      '<div class="kv"><span>Meet 1 · near home</span><span>' + (esc(pl.rally1) || "—") + "</span></div>" +
      '<div class="kv"><span>Meet 2 · neighborhood</span><span>' + (esc(pl.rally2) || "—") + "</span></div>" +
      '<div class="kv"><span>Meet 3 · out of area</span><span>' + (esc(pl.rally3) || "—") + "</span></div>" +
      '<div class="kv"><span>If heat forces us out</span><span>' + (esc(pl.leaveTo) || "—") + "</span></div>" +
      '<div class="kv"><span>Check-ins</span><span class="mono">' + esc((S.settings.checkins || []).join(" · ")) + "</span></div>" +
      '<div class="btnrow" style="margin-top:10px"><a class="btn ghost" href="#/family/plan">Edit plan and shutoffs</a></div></section>';
    h += '<div class="sec"><span class="lab">People</span><a class="btn sm" href="#/family/person/new">' + ic("plus") + "Add</a></div><div class=\"list\">";
    const ppl = L("people");
    if (!ppl.length) h += '<div class="empty">No one yet. Add everyone who lives in the house.</div>';
    for (const p of ppl) {
      const flags = [p.meds ? "meds" : "", p.allergies ? "allergies" : "", p.conditions ? "conditions" : ""].filter(Boolean).join(" · ");
      h += '<a class="li" href="#/family/person/' + esc(p.id) + '"><span class="ic">' + ic("people") + '</span><span class="tx"><b>' + esc(p.name || "Unnamed") + "</b><small>" + esc(AGE[p.ageBand] || "") + (flags ? " · " + flags : "") + "</small></span>" + ic("chev") + "</a>";
    }
    h += '</div><div class="sec"><span class="lab">Pets</span><a class="btn sm" href="#/family/pet/new">' + ic("plus") + "Add</a></div><div class=\"list\">";
    const pets = L("pets");
    if (!pets.length) h += '<div class="empty">No pets added.</div>';
    for (const p of pets) h += '<a class="li" href="#/family/pet/' + esc(p.id) + '"><span class="ic">' + ic("paw") + '</span><span class="tx"><b>' + esc(p.name || "Pet") + "</b><small>" + esc(p.species || "") + (p.weightLb ? " · " + esc(p.weightLb) + " lb" : "") + "</small></span>" + ic("chev") + "</a>";
    h += "</div>";
    h += '<section class="glass panel" style="margin-top:14px"><h3>Utility shutoffs</h3>' +
      ["gas", "water", "power"].map((k) => '<div class="kv"><span>' + k[0].toUpperCase() + k.slice(1) + "</span><span>" + (esc(pl[k]) || '<span style="color:var(--mute)">not set</span>') + "</span></div>" + (pl[k + "Photo"] ? '<img class="photo" data-photo="' + esc(pl[k + "Photo"]) + '" alt="' + k + ' shutoff photo">' : "")).join("") + "</section>";
    h += '<p class="empty" style="font-size:.85rem">Stored only on this phone and in Memory Cards you make. Never sent anywhere.</p>';
    return h;
  }
  function fld(name, label, val, o) {
    o = o || {};
    const v = esc(val === undefined || val === null ? "" : val);
    if (o.type === "area") return '<label class="fld"><span>' + esc(label) + '</span><textarea name="' + name + '" placeholder="' + esc(o.ph || "") + '">' + v + "</textarea>" + (o.hint ? '<span class="hint">' + esc(o.hint) + "</span>" : "") + "</label>";
    if (o.type === "select") return '<label class="fld"><span>' + esc(label) + '</span><select name="' + name + '">' + o.opts.map(([k, l]) => '<option value="' + esc(k) + '"' + (String(val) === String(k) ? " selected" : "") + ">" + esc(l) + "</option>").join("") + "</select>" + (o.hint ? '<span class="hint">' + esc(o.hint) + "</span>" : "") + "</label>";
    const type = o.type === "num" ? 'text" inputmode="decimal' : o.type === "date" ? "date" : o.type === "time" ? "time" : o.type === "tel" ? "tel" : "text";
    return '<label class="fld"><span>' + esc(label) + '</span><input name="' + name + '" type="' + type + '" value="' + v + '" placeholder="' + esc(o.ph || "") + '" autocomplete="off">' + (o.hint ? '<span class="hint">' + esc(o.hint) + "</span>" : "") + "</label>";
  }
  function formEnd(delId, coll) {
    return '<div class="btnrow" style="margin-top:6px"><button class="btn" type="submit">Save</button></div>' +
      (delId ? '<div class="btnrow" style="margin-top:10px"><button class="btn ghost danger" type="button" data-act="del" data-coll="' + coll + '" data-id="' + esc(delId) + '">Delete</button></div>' : "") + "</form>";
  }
  function renderPersonForm(id) {
    const p = id && id !== "new" ? byId("people", id) || {} : {};
    let h = backbar("#/family", p.id ? "Edit person" : "Add person");
    h += '<form class="glass panel" data-form="person" data-id="' + esc(p.id || "") + '">' +
      fld("name", "Name", p.name, { ph: "First name" }) +
      fld("ageBand", "Age group", p.ageBand || "adult", { type: "select", opts: Object.entries(AGE) }) +
      fld("conditions", "Medical conditions", p.conditions, { type: "area" }) +
      fld("meds", "Medications and doses", p.meds, { type: "area", hint: "Add critical medicines to Supplies too, to track days left." }) +
      fld("allergies", "Allergies", p.allergies, { type: "area" }) +
      '<div class="two">' + fld("blood", "Blood type", p.blood) + fld("kcal", "Calories a day", p.kcal, { type: "num", ph: String(E.kcalFor({ ageBand: p.ageBand || "adult" })) }) + "</div>" +
      fld("doctor", "Doctor and pharmacy", p.doctor) +
      fld("device", "Powered medical device", p.device, { hint: "CPAP, oxygen, pump: plan its backup power first." }) +
      fld("notes", "Notes", p.notes, { type: "area" }) + formEnd(p.id, "people");
    return h;
  }
  function renderPetForm(id) {
    const p = id && id !== "new" ? byId("pets", id) || {} : {};
    let h = backbar("#/family", p.id ? "Edit pet" : "Add pet");
    h += '<form class="glass panel" data-form="pet" data-id="' + esc(p.id || "") + '">' + fld("name", "Name", p.name) +
      fld("species", "Kind", p.species || "Dog", { type: "select", opts: [["Dog", "Dog"], ["Cat", "Cat"], ["Other", "Other"]] }) +
      fld("weightLb", "Weight (lb)", p.weightLb, { type: "num", hint: "Water need: about 1 oz per lb per day." }) +
      fld("notes", "Food, medicine, vet", p.notes, { type: "area" }) + formEnd(p.id, "pets");
    return h;
  }
  function renderPlanForm() {
    const pl = S.plan || {};
    let h = backbar("#/family", "Family plan");
    h += '<form class="glass panel" data-form="plan"><h3>Out-of-area contact</h3><div class="two">' + fld("contactName", "Name", pl.contactName) + fld("contactPhone", "Phone", pl.contactPhone, { type: "tel" }) + "</div>" +
      '<p class="empty" style="margin-top:-4px;font-size:.85rem">Everyone texts this person "OK + location". Long-distance texts often get through when local lines can\'t.</p>' +
      "<h3>Meeting places</h3>" + fld("rally1", "1 · Near home", pl.rally1, { ph: "Front of the house" }) + fld("rally2", "2 · Neighborhood", pl.rally2, { ph: "Park, school, church" }) + fld("rally3", "3 · Out of area", pl.rally3, { ph: "Relative's address" }) +
      "<h3>If heat forces us out</h3>" + fld("leaveTo", "Destination", pl.leaveTo, { ph: "Family on another grid, a hotel, a cooler town" }) + fld("leaveNotes", "Route and contact", pl.leaveNotes, { type: "area" }) +
      "<h3>Check-in times</h3>" + '<div class="two">' + fld("c1", "First", (S.settings.checkins || [])[0], { type: "time" }) + fld("c2", "Second", (S.settings.checkins || [])[1], { type: "time" }) + "</div>" + fld("c3", "Third", (S.settings.checkins || [])[2], { type: "time" }) +
      "<h3>Utility shutoffs</h3>" + ["gas", "water", "power"].map((k) =>
        fld(k, k[0].toUpperCase() + k.slice(1) + " shutoff: where and how", pl[k], { ph: k === "gas" ? "Meter, east wall. Wrench in hall closet." : "" }) +
        '<div class="btnrow" style="margin:-4px 0 14px"><label class="btn ghost sm">' + (pl[k + "Photo"] ? "Replace photo" : "Add photo") + '<input class="sr" type="file" accept="image/*" data-photo-for="' + k + '"></label></div>' +
        (pl[k + "Photo"] ? '<img class="photo" data-photo="' + esc(pl[k + "Photo"]) + '" alt="' + k + ' shutoff" style="margin:-6px 0 14px">' : "")).join("") +
      formEnd(null);
    return h;
  }

  /* ---------------- SUPPLIES ---------------- */
  function itemLine(i) {
    const r = RES[i.category] || RES.gear;
    const per = r.key && i.per_unit ? num(i.per_unit[r.key]) : 0;
    const total = per * num(i.qty);
    let right = r.key ? fmtN(total, r.key === "gal" ? 1 : 0) + " " + r.unit : "×" + fmtN(num(i.qty), 1);
    let sub = "×" + fmtN(num(i.qty), 2) + (r.key ? " · " + fmtN(per, 2) + " " + r.unit + " each" : "") + (i.location ? " · " + i.location : "");
    if (i.category === "meds" && num(i.per_day) > 0) right = fmtDays(total / num(i.per_day)) + " d";
    const exp = i.expires ? Date.parse(i.expires + "T12:00:00") : NaN;
    const expTag = Number.isFinite(exp) && exp < now() + 90 * DAY ? ' <span class="chip ' + (exp < now() ? "crit" : "warn") + '">' + (exp < now() ? "expired" : "exp " + esc(i.expires)) + "</span>" : "";
    return '<a class="li" href="#/supplies/item/' + esc(i.id) + '"><span class="ic">' + ic(r.icon) + '</span><span class="tx"><b>' + esc(i.name || "Item") + (i.critical ? ' <span class="chip crit">critical</span>' : "") + expTag + "</b><small>" + esc(sub) + '</small></span><span class="rt">' + right + "</span></a>";
  }
  function renderSupplies() {
    const sub = route.parts[1];
    if (sub === "item") return renderItem(route.parts[2]);
    if (sub === "edit") return renderItemForm(route.parts[2]);
    const t = now(), a = E.autonomy(S, t), g = E.gaps(S, t), cat = route.q.cat || "all";
    let h = topbar("Supplies");
    h += '<div class="grid2">' + ["water", "food", "meds", "power"].map((k) => {
      const v = a[k], st = v === Infinity ? "ok" : E.status(v);
      return '<a class="glass panel" href="#/supplies?cat=' + k + '" style="text-decoration:none;color:var(--ink)"><div class="lab">' + RES[k].label + '</div><div class="mono" style="font-size:1.7rem;margin-top:4px">' + fmtDays(v) + ' <span style="font-size:.8rem;color:var(--mute)">days</span></div><span class="chip ' + st + '" style="margin-top:6px">' + (v === Infinity ? "SOLAR" : STATUS_WORD[st]) + (a.measured[k] ? " · measured" : "") + "</span></a>";
    }).join("") + "</div>";
    if (L("people").length && g.list.length) h += '<section class="glass panel"><h3>To reach ' + g.target + " days</h3>" + g.list.map((x) => '<div class="kv"><span>' + esc(x.name || RES[x.res].label) + '</span><span class="mono">+' + fmtN(x.gap, x.unit === "gal" ? 1 : 0) + " " + x.unit + "</span></div>").join("") + "</section>";
    const ex = E.expiring(S, t, 90);
    if (ex.length) h += '<section class="glass panel"><h3>Expiring within 90 days</h3>' + ex.map((x) => '<div class="kv"><span>' + esc(x.item.name) + '</span><span class="mono" style="color:' + (x.expired ? "var(--crit)" : "var(--warn)") + '">' + (x.expired ? "expired" : x.days + " d") + "</span></div>").join("") + '<p class="empty" style="font-size:.85rem">Use these in normal life and restock.</p></section>';
    const hot = E.hotStorage(S);
    if (hot.length) h += '<section class="glass panel"><h3>Stored somewhere hot</h3>' + hot.map((i) => '<div class="kv"><span>' + esc(i.name) + "</span><span>" + esc(i.location) + "</span></div>").join("") + '<p class="empty" style="font-size:.85rem">Move food, medicine and batteries indoors.</p></section>';
    h += '<div class="sec"><span class="lab">Inventory</span><a class="btn sm" href="#/supplies/edit/new' + (cat !== "all" ? "?cat=" + cat : "") + '">' + ic("plus") + "Add</a></div>";
    h += '<div class="filters">' + ["all", "water", "food", "meds", "power", "gear"].map((k) => '<a href="#/supplies' + (k === "all" ? "" : "?cat=" + k) + '"><span class="chip' + (cat === k ? " on" : "") + '">' + (k === "all" ? "All" : RES[k].label) + "</span></a>").join("") + "</div>";
    const items = L("items").filter((i) => cat === "all" || i.category === cat).sort((x, y) => (x.category + x.name).localeCompare(y.category + y.name));
    h += '<div class="list">' + (items.length ? items.map(itemLine).join("") : '<div class="empty">Nothing here yet.</div>') + "</div>";
    return h;
  }
  const PRESETS = {
    water: [["55-gal drum", 55], ["WaterBrick 3.5 gal", 3.5], ["Case: 24 bottles × 16.9 oz", 3.17], ["1-gal jug", 1], ["waterBOB (bathtub)", 100]],
    power: [["1 kWh station (DELTA 3 Classic)", 1024], ["1 kWh station (SOLIX C1000)", 1056], ["Power bank 20,000 mAh", 74]],
    food: [], meds: [], gear: []
  };
  let draft = null;
  function renderItemForm(id) {
    const base = id && id !== "new" ? byId("items", id) || {} : { category: route.q.cat && RES[route.q.cat] ? route.q.cat : "water", qty: 1 };
    const i = draft && draft.id === (base.id || "") ? Object.assign({}, base, draft.vals) : base;
    const cat = i.category || "water", r = RES[cat];
    let h = backbar(base.id ? "#/supplies/item/" + esc(base.id) : "#/supplies", base.id ? "Edit item" : "Add item");
    h += '<form class="glass panel" data-form="item" data-id="' + esc(base.id || "") + '">' +
      fld("category", "Type", cat, { type: "select", opts: Object.keys(RES).map((k) => [k, RES[k].label]) });
    if (PRESETS[cat] && PRESETS[cat].length && !base.id) h += '<div class="filters" style="margin-top:-4px">' + PRESETS[cat].map(([n, v]) => '<button type="button" class="chip" data-preset="' + esc(n) + "|" + v + '">' + esc(n) + "</button>").join("") + "</div>";
    h += fld("name", "Name", i.name, { ph: cat === "food" ? "Rice, 20 lb bag" : cat === "meds" ? "Insulin pens" : "" }) +
      '<div class="two">' + fld("qty", "How many", i.qty, { type: "num" }) +
      (r.key ? fld("per", r.unit + " each", i.per_unit ? i.per_unit[r.key] : "", { type: "num", ph: cat === "food" ? "from the label" : "" }) : "<span></span>") + "</div>";
    if (cat === "food") h += '<p class="empty" style="margin:-6px 0 12px;font-size:.85rem">Calories per unit = calories per serving × servings per container.</p>';
    if (cat === "meds") h += '<div class="two">' + fld("per_day", "Doses used a day", i.per_day, { type: "num" }) + fld("critical", "Critical", i.critical ? "yes" : "no", { type: "select", opts: [["yes", "Yes, life-critical"], ["no", "No"]] }) + "</div>" +
      fld("owner", "For", i.owner || "", { type: "select", opts: [["", "Anyone"]].concat(L("people").map((p) => [p.id, p.name || "Unnamed"])) });
    h += fld("location", "Stored where", i.location, { ph: "Hall closet", hint: "Avoid the garage and car in Phoenix." }) +
      '<div class="two">' + fld("expires", "Expires", i.expires, { type: "date" }) + fld("min_qty", "Keep at least", i.min_qty, { type: "num" }) + "</div>" +
      fld("notes", "Notes", i.notes, { type: "area" }) + formEnd(base.id, "items");
    return h;
  }
  function renderItem(id) {
    const i = byId("items", id);
    if (!i) return renderSupplies();
    const r = RES[i.category] || RES.gear;
    const per = r.key && i.per_unit ? num(i.per_unit[r.key]) : 0;
    let h = backbar("#/supplies" + (i.category ? "?cat=" + i.category : ""), r.label);
    h += '<section class="glass hero"><div class="lab">' + esc(r.label) + '</div><h2 style="margin:6px 0 2px;font-size:1.5rem">' + esc(i.name) + "</h2>" +
      '<div class="num"><span class="big" style="font-size:2.6rem">' + fmtN(num(i.qty), 2) + '</span><span class="unit">ON HAND' + (r.key ? " · " + fmtN(per * num(i.qty), r.key === "gal" ? 1 : 0) + " " + r.unit : "") + "</span></div>" +
      '<div class="sub">' + [i.location ? "Stored: " + esc(i.location) : "", i.expires ? "Expires " + esc(i.expires) : "", i.min_qty ? "Keep at least " + esc(i.min_qty) : ""].filter(Boolean).join(" · ") + "</div></section>";
    h += '<section class="glass panel"><h3>Log use</h3><div class="btnrow"><button class="btn ghost" data-act="use" data-id="' + esc(i.id) + '" data-n="1">−1</button><button class="btn ghost" data-act="use" data-id="' + esc(i.id) + '" data-n="0.5">−½</button><button class="btn ghost" data-act="use" data-id="' + esc(i.id) + '" data-n="-1">+1 restock</button></div>' +
      '<form data-form="use" data-id="' + esc(i.id) + '" style="margin-top:12px"><div class="two">' + fld("n", "Custom amount used", "", { type: "num" }) + '<div style="display:flex;align-items:flex-end;margin-bottom:12px"><button class="btn wide" type="submit">Log</button></div></div></form>' +
      '<p class="empty" style="font-size:.85rem">During an outage, logged use replaces the planning numbers on Status.</p></section>';
    const logs = L("log").filter((e) => e.itemId === i.id).sort((a, b) => b.t - a.t).slice(0, 8);
    if (logs.length) h += '<section class="glass panel"><h3>Recent</h3>' + logs.map((e) => '<div class="kv"><span>' + new Date(e.t).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) + '</span><span class="mono">' + (e.delta > 0 ? "−" : "+") + fmtN(Math.abs(e.delta), 2) + "</span></div>").join("") + "</section>";
    h += '<div class="btnrow"><a class="btn ghost" href="#/supplies/edit/' + esc(i.id) + '">Edit item</a></div>';
    return h;
  }
  function logUse(id, n) {
    const i = byId("items", id); if (!i || !n) return;
    const r = RES[i.category] || RES.gear;
    const per = r.key && i.per_unit ? num(i.per_unit[r.key]) : 0;
    const q = Math.max(0, num(i.qty) - n);
    const used = num(i.qty) - q;
    upsert("items", Object.assign({}, i, { qty: Math.round(q * 1000) / 1000 }));
    upsert("log", { id: uid(), t: now(), itemId: i.id, delta: n > 0 ? used : n, res: n > 0 && r.key ? i.category : null, amount: n > 0 ? used * per : 0 });
    toast(n > 0 ? "Logged: used " + fmtN(used, 2) : "Restocked +" + fmtN(-n, 2));
    Snd.chime("nav");
  }

  /* ---------------- SYSTEM: memory card + settings ---------------- */
  let pendingCard = null, preparedFile = null;
  function isStandalone() { return window.navigator.standalone === true || (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches); }
  function renderSystem() {
    const st = S.settings;
    let h = topbar("System");
    h += '<section class="glass panel"><div class="mc"><div class="card" aria-hidden="true"></div><div style="flex:1"><div class="lab">Memory card · slot 1</div><div style="font-weight:650;margin-top:4px">Backup and share</div>' +
      '<div style="color:var(--ink2);font-size:.9rem">Last saved: ' + (PR.lastBackup ? new Date(PR.lastBackup).toLocaleString() : "never") + "</div></div></div>" +
      '<div class="bar" style="margin:14px 0 10px"><i id="mcbar"></i></div><div id="mcmsg" class="empty" style="min-height:1.4em"></div>' +
      '<div class="btnrow"><button class="btn" data-act="mc-save">Save to Memory Card</button></div>' +
      '<div class="btnrow' + (preparedFile ? "" : " hide") + '" id="mcsend" style="margin-top:10px"><button class="btn" data-act="mc-share">Send (AirDrop, Files)</button><button class="btn ghost" data-act="mc-download">Download</button></div>' +
      '<div class="btnrow" style="margin-top:10px"><label class="btn ghost">Load Memory Card<input class="sr" type="file" id="mcfile"></label></div>' +
      (pendingCard ? '<div class="alert info" style="margin-top:12px"><span class="dot"></span><span><b>Card from ' + esc(pendingCard.device || "another phone") + " · " + esc((pendingCard.exported || "").slice(0, 10)) + "</b><small>" + pendingCard.preview + "</small></span></div>" +
        '<div class="btnrow"><button class="btn" data-act="mc-merge">Merge (newest edit wins)</button><button class="btn ghost" data-act="mc-replace">Replace all</button></div><div class="btnrow" style="margin-top:8px"><button class="btn ghost" data-act="mc-cancel">Cancel</button></div>' : "") +
      '<p class="empty" style="font-size:.85rem;margin-top:12px">Save on each phone, AirDrop the card to the others, and load it there. Merging keeps the newest edit of every record. Keep a copy on the vault drive.</p></section>';
    h += '<form class="glass panel" data-form="settings"><h3>Household settings</h3>' +
      fld("season", "Season mode", st.season, { type: "select", opts: [["auto", "Auto: heat May to September"], ["normal", "Normal: 1 gal per person a day"], ["heat", "Heat: 2 gal per person a day"]] }) +
      '<div class="two">' + fld("targetDays", "Target days", st.targetDays, { type: "num" }) + fld("deviceName", "This phone's name", PR.deviceName, { ph: "Dad's iPhone" }) + "</div>" +
      '<div class="two">' + fld("loadWhNormal", "Daily use, normal (Wh)", st.loadWhNormal, { type: "num" }) + fld("loadWhHeat", "Daily use, heat (Wh)", st.loadWhHeat, { type: "num" }) + "</div>" +
      '<div class="two">' + fld("solarW", "Solar panels (W)", st.solarW, { type: "num" }) + fld("sunHours", "Sun hours a day", st.sunHours, { type: "num", hint: "Phoenix averages about 6.5" }) + "</div>" +
      fld("sound", "Interface sounds", PR.sound ? "on" : "off", { type: "select", opts: [["on", "On"], ["off", "Off"]] }) +
      '<div class="btnrow"><button class="btn" type="submit">Save settings</button></div></form>';
    h += '<section class="glass panel"><h3>This phone</h3>' +
      '<div class="kv"><span>Installed to Home Screen</span><span>' + (isStandalone() ? "Yes" : "No") + "</span></div>" +
      '<div class="kv"><span>Offline copy</span><span id="swst">' + (PREVIEW ? "Preview: none" : navigator.serviceWorker && navigator.serviceWorker.controller ? "Saved for offline" : "Not yet: open once online") + "</span></div>" +
      '<div class="kv"><span>Storage</span><span id="stst">' + (Store.ok ? "On this phone" : "Temporary") + "</span></div>" +
      '<div class="kv"><span>Network use</span><span>None (blocked by policy)</span></div>' +
      '<div class="kv"><span>Version</span><span class="mono">' + esc(VERSION) + "</span></div>" +
      '<p class="empty" style="font-size:.85rem">Deleting the app icon deletes its data. Keep Memory Cards on another phone and the vault drive.</p></section>';
    h += '<section class="glass panel"><h3>Danger zone</h3><button class="btn ghost danger wide" data-act="erase">Erase everything on this phone</button></section>';
    return h;
  }
  async function sha256(text) {
    try { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)); return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join(""); } catch (e) { return ""; }
  }
  function snapshot() { return JSON.parse(JSON.stringify({ settings: S.settings, plan: S.plan, outage: S.outage, checks: S.checks, people: S.people, pets: S.pets, items: S.items, log: S.log })); }
  async function allPhotos() {
    const out = {}; const keys = (await Store.keys()) || [];
    for (const k of keys) if (String(k).startsWith("photo:")) out[String(k).slice(6)] = await Store.get(k);
    return out;
  }
  async function prepareCard() {
    const bar = $("#mcbar"), msg = $("#mcmsg");
    const step = (p, m) => { if (bar) bar.style.width = p + "%"; if (msg) msg.textContent = m; };
    if (PREVIEW) { step(100, "Preview only. The installed app saves the card here and sends it by AirDrop or Files."); return; }
    step(15, "Saving data. Do not close the app.");
    const data = snapshot();
    const json = JSON.stringify(data);
    const card = { format: "havyn.memorycard", version: 1, app: "HAVYN FIELD " + VERSION, exported: new Date().toISOString(), device: PR.deviceName || "", checksum: await sha256(json), data, photos: await allPhotos() };
    step(70, "Writing Memory Card…");
    const name = "HAVYN-MemoryCard-" + ymd(now()) + "-" + (PR.deviceName || "phone").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".json";
    preparedFile = new File([JSON.stringify(card)], name, { type: "application/json" });
    PR.lastBackup = now(); flush();
    setTimeout(() => { step(100, "Complete. " + name + " (" + fmtN(preparedFile.size / 1024, 0) + " KB)"); Snd.chime("save"); const s = $("#mcsend"); if (s) s.classList.remove("hide"); }, 260);
  }
  async function shareCard() {
    if (!preparedFile) return;
    if (navigator.canShare && navigator.canShare({ files: [preparedFile] })) {
      try { await navigator.share({ files: [preparedFile], title: "HAVYN Memory Card" }); toast("Sent"); return; } catch (e) { if (e && e.name === "AbortError") return; }
    }
    downloadCard();
  }
  function downloadCard() {
    if (!preparedFile) return;
    const url = URL.createObjectURL(preparedFile); const a = document.createElement("a");
    a.href = url; a.download = preparedFile.name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
  async function readCardFile(file) {
    if (!file) return;
    if (file.size > 60 * 1024 * 1024) { toast("That file is too large to be a Memory Card"); return; }
    let card;
    try { card = JSON.parse(await file.text()); } catch (e) { toast("Not a Memory Card file"); return; }
    if (!card || card.format !== "havyn.memorycard" || !card.data) { toast("Not an HAVYN Memory Card"); return; }
    let warn = "";
    if (card.checksum) { const sum = await sha256(JSON.stringify(card.data)); if (sum && sum !== card.checksum) warn = " Checksum mismatch: the file may be damaged."; }
    const data = E.sanitize(card.data);
    const dry = E.merge(snapshot(), data).report;
    pendingCard = { device: card.device, exported: card.exported, data, photos: card.photos && typeof card.photos === "object" ? card.photos : {}, preview: dry.added + " new and " + dry.updated + " newer records." + warn };
    render();
  }
  async function applyCard(mode) {
    if (!pendingCard) return;
    if (mode === "replace") { const d = defaults(); S = Object.assign(d, Object.fromEntries(Object.entries(pendingCard.data).filter(([, v]) => v !== undefined))); S.settings = Object.assign(defaults().settings, S.settings || {}); S.plan = Object.assign(defaults().plan, S.plan || {}); }
    else S = Object.assign(S, E.merge(snapshot(), pendingCard.data).state);
    for (const [id, url] of Object.entries(pendingCard.photos)) if (typeof url === "string" && url.startsWith("data:image/") && /^[\w-]+$/.test(id)) await Store.set("photo:" + id, url);
    pendingCard = null; flush(); Snd.chime("ok"); toast("Memory Card loaded"); render();
  }

  /* ---------------- photos ---------------- */
  function hydratePhotos() {
    $$("img[data-photo]").forEach(async (img) => { const u = await Store.get("photo:" + img.dataset.photo); if (u) img.src = u; else img.remove(); });
  }
  function shrinkPhoto(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => {
        const im = new Image();
        im.onload = () => { const m = 1280, k = Math.min(1, m / Math.max(im.width, im.height)); const c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL("image/jpeg", 0.72)); };
        im.onerror = rej; im.src = r.result;
      };
      r.onerror = rej; r.readAsDataURL(file);
    });
  }

  /* ---------------- example household ---------------- */
  function loadExample() {
    const ex = (o) => Object.assign(o, { id: uid(), example: true, updated: now() });
    S.people.push(ex({ name: "Parent A", ageBand: "adult" }), ex({ name: "Parent B", ageBand: "adult", meds: "Rescue inhaler" }), ex({ name: "Teen", ageBand: "teen" }), ex({ name: "Kid", ageBand: "child", allergies: "Peanuts: epinephrine in kitchen drawer" }));
    S.pets.push(ex({ name: "Dog", species: "Dog", weightLb: 45 }));
    const soon = ymd(now() + 40 * DAY), later = ymd(now() + 400 * DAY);
    S.items.push(
      ex({ category: "water", name: "55-gal drum", qty: 2, per_unit: { gal: 55 }, location: "Hall closet", expires: ymd(now() + 300 * DAY) }),
      ex({ category: "water", name: "WaterBrick 3.5 gal", qty: 4, per_unit: { gal: 3.5 }, location: "Bedroom closet" }),
      ex({ category: "water", name: "Case: 24 bottles", qty: 2, per_unit: { gal: 3.17 }, location: "Garage shelf" }),
      ex({ category: "food", name: "Rice, 20 lb", qty: 1, per_unit: { kcal: 32000 }, location: "Pantry", expires: later }),
      ex({ category: "food", name: "Canned meals", qty: 24, per_unit: { kcal: 450 }, location: "Pantry", expires: later }),
      ex({ category: "food", name: "Granola bars, box", qty: 3, per_unit: { kcal: 1200 }, location: "Pantry", expires: soon }),
      ex({ category: "meds", name: "Rescue inhaler", qty: 1, per_unit: { doses: 200 }, per_day: 4, critical: true, location: "Kitchen drawer", expires: later }),
      ex({ category: "power", name: "1 kWh station", qty: 1, per_unit: { wh: 1024 }, location: "Office" }),
      ex({ category: "power", name: "Power bank 20,000 mAh", qty: 4, per_unit: { wh: 74 }, location: "Go-bags" }),
      ex({ category: "gear", name: "Headlamp", qty: 4, location: "Go-bags" }),
      ex({ category: "gear", name: "CO alarm (battery)", qty: 3, location: "Hallways" })
    );
    S.plan = Object.assign({}, S.plan, { contactName: "Aunt in Tucson (example)", contactPhone: "555-0100", rally1: "Front of the house", rally2: "Park at the corner", rally3: "Aunt's house, Tucson", leaveTo: "Hotel on another grid", updated: now() });
    save(); toast("Example household loaded"); Snd.chime("ok"); render();
  }
  function clearExample() {
    for (const k of ["people", "pets", "items"]) S[k] = S[k].map((r) => (r.example ? { id: r.id, deleted: true, updated: now() } : r));
    if ((S.plan.contactName || "").includes("(example)")) S.plan = Object.assign(defaults().plan, { updated: now() });
    save(); toast("Example data removed"); render();
  }

  /* ---------------- events ---------------- */
  let toastTimer = 0;
  function toast(msg) {
    let el = $(".toast"); if (!el) { el = document.createElement("div"); el.className = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
    el.textContent = msg; el.classList.remove("hide"); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.add("hide"), 2400);
  }
  const armed = {};
  function confirmTap(btn, key, label) {
    if (armed[key] && now() - armed[key] < 4000) { delete armed[key]; return true; }
    armed[key] = now(); btn.textContent = label; Snd.chime("warn");
    setTimeout(() => { if (armed[key]) { delete armed[key]; render(); } }, 4000);
    return false;
  }
  document.addEventListener("click", (ev) => {
    const go = ev.target.closest("[data-go]"); if (go) { location.hash = go.dataset.go; return; }
    const pre = ev.target.closest("[data-preset]");
    if (pre) { const [n, v] = pre.dataset.preset.split("|"); const f = pre.closest("form"); const nm = f.querySelector("[name=name]"), pv = f.querySelector("[name=per]"); if (nm) nm.value = n; if (pv) pv.value = v; return; }
    const b = ev.target.closest("[data-act]"); if (!b) return;
    const act = b.dataset.act;
    if (act === "night") { PR.theme = PR.theme === "night" ? "void" : "night"; flush(); render(); }
    else if (act === "outage-start") { setOne("outage", { active: true, startedAt: now(), endedAt: 0 }); Snd.chime("warn"); toast("Outage clock started"); render(); }
    else if (act === "outage-stop") { setOne("outage", { active: false, endedAt: now() }); Snd.chime("ok"); toast("Outage ended: " + dur(now() - S.outage.startedAt)); render(); }
    else if (act === "example") loadExample();
    else if (act === "clear-example") clearExample();
    else if (act === "hide-install") { PR.installHidden = true; flush(); render(); }
    else if (act === "step-next") { ev.preventDefault(); stepTo(1); }
    else if (act === "step-prev") { ev.preventDefault(); stepTo(-1); }
    else if (act === "card-jump") { cardView.id = null; Metro.stop(); }
    else if (act === "beat-toggle") { if (Metro.on) { Metro.stop(); cardView.autoBeat = false; } else { cardView.autoBeat = true; Metro.start(cardView.beatStep || 110); } b.textContent = Metro.on ? "Stop beat" : "Start beat"; }
    else if (act === "beat-sound") { Metro.sound = !Metro.sound; if (Metro.on) Metro.start(cardView.beatStep || 110); b.textContent = Metro.sound ? "Sound on" : "Sound off"; }
    else if (act === "reset-checks") { const c = Object.assign({}, S.checks); delete c[b.dataset.id]; S.checks = touch(c); save(); render(); }
    else if (act === "use") logUse(b.dataset.id, num(b.dataset.n)), render();
    else if (act === "del") { if (confirmTap(b, "del" + b.dataset.id, "Tap again to delete")) { remove(b.dataset.coll, b.dataset.id); toast("Deleted"); go(b.dataset.coll === "items" ? "#/supplies" : "#/family"); } }
    else if (act === "mc-save") prepareCard();
    else if (act === "mc-share") shareCard();
    else if (act === "mc-download") downloadCard();
    else if (act === "mc-merge") applyCard("merge");
    else if (act === "mc-replace") { if (confirmTap(b, "replace", "Tap again: replace everything")) applyCard("replace"); }
    else if (act === "mc-cancel") { pendingCard = null; render(); }
    else if (act === "erase") { if (confirmTap(b, "erase", "Tap again to erase this phone")) eraseAll(); }
  });
  document.addEventListener("keydown", (ev) => { const g = ev.target.closest && ev.target.closest("[data-go]"); if (g && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); location.hash = g.dataset.go; } });
  document.addEventListener("change", async (ev) => {
    const t = ev.target;
    if (t.dataset && t.dataset.chk) {
      const [pid, k] = t.dataset.chk.split("|"); const c = Object.assign({}, S.checks); c[pid] = Object.assign({}, c[pid]); if (t.checked) c[pid][k] = now(); else delete c[pid][k];
      S.checks = touch(c); save(); t.closest(".chk").classList.toggle("done", t.checked); if (t.checked) Snd.chime("nav"); return;
    }
    if (t.id === "mcfile") { await readCardFile(t.files && t.files[0]); t.value = ""; return; }
    if (t.dataset && t.dataset.photoFor) {
      const f = t.files && t.files[0]; if (!f) return;
      try { const url = await shrinkPhoto(f); const id = uid(); await Store.set("photo:" + id, url); const old = S.plan[t.dataset.photoFor + "Photo"]; if (old) Store.del("photo:" + old); const p = {}; p[t.dataset.photoFor + "Photo"] = id; setOne("plan", p); toast("Photo saved"); render(); } catch (e) { toast("Could not read that photo"); }
      return;
    }
    const form = t.closest && t.closest("form[data-form=item]");
    if (form && t.name === "category") { draft = { id: form.dataset.id || "", vals: formVals(form) }; render(); }
  });
  function formVals(f) { const o = {}; new FormData(f).forEach((v, k) => { o[k] = typeof v === "string" ? v.trim() : v; }); return o; }
  document.addEventListener("submit", (ev) => {
    const f = ev.target.closest("form[data-form]"); if (!f) return;
    ev.preventDefault();
    const v = formVals(f), kind = f.dataset.form, id = f.dataset.id;
    if (kind === "person") {
      const p = Object.assign({}, id ? byId("people", id) : { id: uid() }, { name: v.name, ageBand: v.ageBand, conditions: v.conditions, meds: v.meds, allergies: v.allergies, blood: v.blood, kcal: optNum(v.kcal), doctor: v.doctor, device: v.device, notes: v.notes });
      delete p.example; upsert("people", p); toast("Saved"); Snd.chime("ok"); go("#/family");
    } else if (kind === "pet") {
      const p = Object.assign({}, id ? byId("pets", id) : { id: uid() }, { name: v.name, species: v.species, weightLb: optNum(v.weightLb), notes: v.notes });
      delete p.example; upsert("pets", p); toast("Saved"); Snd.chime("ok"); go("#/family");
    } else if (kind === "plan") {
      const checkins = [v.c1, v.c2, v.c3].filter(Boolean);
      setOne("plan", { contactName: v.contactName, contactPhone: v.contactPhone, rally1: v.rally1, rally2: v.rally2, rally3: v.rally3, leaveTo: v.leaveTo, leaveNotes: v.leaveNotes, gas: v.gas, water: v.water, power: v.power });
      setOne("settings", { checkins }); toast("Plan saved"); Snd.chime("ok"); go("#/family");
    } else if (kind === "item") {
      const cat = RES[v.category] ? v.category : "gear", r = RES[cat];
      const base = id ? byId("items", id) : { id: uid() };
      const it = Object.assign({}, base, { category: cat, name: v.name || r.label, qty: num(v.qty), location: v.location, expires: v.expires, min_qty: optNum(v.min_qty), notes: v.notes });
      it.per_unit = r.key ? (() => { const o = {}; o[r.key] = num(v.per); return o; })() : {};
      if (cat === "meds") { it.per_day = num(v.per_day); it.critical = v.critical === "yes"; it.owner = v.owner; } else { delete it.per_day; delete it.critical; delete it.owner; }
      delete it.example; draft = null; upsert("items", it); toast("Saved"); Snd.chime("ok"); go("#/supplies/item/" + it.id);
    } else if (kind === "use") {
      logUse(id, num(v.n)); render();
    } else if (kind === "settings") {
      setOne("settings", { season: v.season, targetDays: num(v.targetDays) || 14, loadWhNormal: num(v.loadWhNormal), loadWhHeat: num(v.loadWhHeat), solarW: num(v.solarW), sunHours: num(v.sunHours) });
      PR.deviceName = v.deviceName; PR.sound = v.sound === "on"; flush(); toast("Settings saved"); Snd.chime("ok"); render();
    }
  });
  // Swipe left/right on emergency cards.
  let sx = 0, sy = 0;
  document.addEventListener("touchstart", (e) => { if (!document.body.classList.contains("em")) return; sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  document.addEventListener("touchend", (e) => {
    if (!document.body.classList.contains("em") || !cardView.id) return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 70 && Math.abs(dy) < 50) stepTo(dx < 0 ? 1 : -1);
  }, { passive: true });
  document.addEventListener("click", (e) => { const t = e.target.closest(".tab, a.li"); if (t && !document.body.classList.contains("em")) Snd.chime("nav"); }, true);
  window.addEventListener("hashchange", render);
  document.addEventListener("visibilitychange", () => { if (document.hidden) flush(); else if (document.body.classList.contains("em")) Wake.on(); });

  async function eraseAll() {
    const keys = (await Store.keys()) || [];
    for (const k of keys) await Store.del(k);
    S = defaults(); PR = prefDefaults(); preparedFile = null; pendingCard = null; flush(); toast("Erased"); go("#/status");
  }

  /* ---------------- ticking clocks ---------------- */
  function tick() {
    const o = $("[data-tick=outage]"); if (o && S.outage.active) o.textContent = dur(now() - S.outage.startedAt);
    const c = $("[data-tick=checkin]"); if (c) { const n = E.nextCheckin(S.settings.checkins, now()); if (n) c.textContent = "in " + Math.floor(n.inMin / 60) + "h " + (n.inMin % 60) + "m"; }
  }
  setInterval(tick, 1000);

  /* ---------------- boot ---------------- */
  async function boot() {
    await Store.open();
    const st = await Store.get("state"), pr = await Store.get("prefs");
    if (st && typeof st === "object") { const d = defaults(); S = Object.assign(d, st); S.settings = Object.assign(d.settings, st.settings || {}); S.plan = Object.assign(d.plan, st.plan || {}); }
    if (pr && typeof pr === "object") PR = Object.assign(prefDefaults(), pr);
    const v = $(".void"); if (v && !v.children.length) for (let i = 0; i < 14; i++) { const m = document.createElement("i"); m.style.left = (5 + Math.random() * 90) + "%"; m.style.top = (40 + Math.random() * 55) + "%"; m.style.animationDelay = (-Math.random() * 22).toFixed(1) + "s"; v.appendChild(m); }
    render();
    document.body.dataset.ready = "1";
    window.__HAVYN_READY_MS = Math.round(performance.now() - t0); window.__HAVYN_READY_AT = Math.round(performance.now());
    if (!PREVIEW && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").then(() => navigator.serviceWorker.ready).then(() => { const s = $("#swst"); if (s) s.textContent = "Saved for offline"; }).catch(() => { const s = $("#swst"); if (s) s.textContent = "Not available"; });
    }
  }
  window.__HAVYN = { get state() { return S; }, get prefs() { return PR; }, E, C, version: VERSION };
  boot();
})();
