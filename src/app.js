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
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
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
    map: '<path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z"/><path d="M9 4v13.5M15 6.5V20"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    wave: '<circle cx="12" cy="5.5" r="2"/><path d="M3 12c2 0 2-2 4.5-2s2.5 2 4.5 2 2-2 4.5-2 2.5 2 4.5 2"/><path d="M3 17c2 0 2-2 4.5-2s2.5 2 4.5 2 2-2 4.5-2 2.5 2 4.5 2"/>',
    bug: '<ellipse cx="12" cy="15" rx="3.5" ry="4.5"/><path d="M12 10.5V7a3 3 0 0 1 3-3h2l1.5 1.5"/><path d="M8.7 13 5 11.5M8.5 16.5 5 17.5M15.3 13l3.7-1.5M15.5 16.5l3.5 1"/>',
    snake: '<path d="M4 19c3 0 4-3 7-3s3 3 6 3 3-2.5 3-5.5S17.5 8 14.5 8H12"/><circle cx="10" cy="8" r="2.2"/><path d="M7.8 8H5.5l-1 1M5.5 8l-1-1"/>',
    quake: '<path d="M3 20.5h18"/><path d="M5 20.5V9.5l7-5.5 7 5.5v11"/><path d="M12.5 8.5l-2 3.5 3 2-2.5 6.5"/>',
    evac: '<path d="M13 3.5h5a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1h-5"/><path d="M3 12h11M10.5 8l4 4-4 4"/>',
    thermo: '<path d="M14 14.6V5.5a2 2 0 0 0-4 0v9.1a4 4 0 1 0 4 0z"/><path d="M12 10.5v6"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l5.5-3.5z"/>',
    speaker: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
    speakeroff: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
    bone: '<path d="M9.2 14.8l5.6-5.6"/><circle cx="6.6" cy="15.2" r="2.1"/><circle cx="8.8" cy="17.4" r="2.1"/><circle cx="15.2" cy="6.6" r="2.1"/><circle cx="17.4" cy="8.8" r="2.1"/>',
    poison: '<path d="M9.5 3h5M10.5 3v4.2L6.5 12v8a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-8l-4-4.8V3"/><path d="M10 13.5l4 4M14 13.5l-4 4"/>',
    side: '<circle cx="5.5" cy="11" r="2.2"/><path d="M8.5 12.5h6.5l3 3.5"/><path d="M13 12.5l-1.5 4.5"/><path d="M3 19.5h18"/>',
    candy: '<circle cx="12" cy="12" r="4.5"/><path d="M7.6 11 3 8v8l4.6-3M16.4 11 21 8v8l-4.6-3"/>',
    lungs: '<path d="M12 4v8"/><path d="M12 11c-1.2-.8-2.2-1-3.4-1C6 10 4 13 4 16.5 4 19 5 20 6.5 20 9 20 10 18.5 10 16v-3.5"/><path d="M12 11c1.2-.8 2.2-1 3.4-1 2.6 0 4.6 3 4.6 6.5 0 2.5-1 3.5-2.5 3.5-2.5 0-3.5-1.5-3.5-4v-3.5"/>',
    cart: '<path d="M3 4h2l2.4 11h10.2L20 8H6.2"/><circle cx="9.5" cy="19.5" r="1.4"/><circle cx="16.5" cy="19.5" r="1.4"/>',
    radio: '<rect x="4" y="9" width="16" height="12" rx="2.5"/><path d="M8 9l9-5"/><circle cx="9" cy="15" r="2.4"/><path d="M14 13.5h3M14 16.5h3"/>',
    file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 15.5h6"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    search: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5"/>',
    toc: '<path d="M4 6h2M9 6h11M4 12h2M9 12h11M4 18h2M9 18h11"/>',
    minus: '<path d="M5 12h14"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 3 3.9 6 3.9 9s-1.3 6-3.9 9c-2.6-3-3.9-6-3.9-9s1.3-6 3.9-9z"/>',
    film: '<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><path d="M10 9.3v5.4l4.6-2.7z"/>',
    music: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
    dice: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="9" cy="9" r="1.2"/><circle cx="15" cy="15" r="1.2"/><circle cx="15" cy="9" r="1.2"/><circle cx="9" cy="15" r="1.2"/>',
    home: '<path d="M4 11.5 12 5l8 6.5V20H4z"/><path d="M10 20v-5h4v5"/>',
    textsize: '<path d="M3.5 18 8 6l4.5 12M5.2 14h5.6M14.5 18l3-8 3 8M15.4 15.6h4.2"/>',
    contrast: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor" stroke="none"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    drive: '<rect x="3" y="12.5" width="18" height="7.5" rx="2"/><path d="M5 12.5 7.5 5h9l2.5 7.5M7 16.3h.01M15.5 16.3h3"/>',
    server: '<rect x="4" y="3.5" width="16" height="7" rx="2"/><rect x="4" y="13.5" width="16" height="7" rx="2"/><path d="M8 7h.01M8 17h.01M12 7h4M12 17h4"/>'
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
      try { const t = db.transaction("kv", mode); const s = t.objectStore("kv"); const out = fn(s); t.oncomplete = () => res(out && out.result !== undefined ? out.result : out); t.onerror = t.onabort = () => res(undefined); }
      catch (e) { res(undefined); }
    });
    return {
      open,
      get ok() { return !!db; },
      get: (k) => (db ? tx("readonly", (s) => s.get(k)) : Promise.resolve(mem[k])),
      // Only fall back to memory when IndexedDB is unavailable: keeping a reference to every saved file here would hold
      // downloaded documents and archives in RAM for the whole session.
      set: (k, v) => { if (!db) { mem[k] = v; return Promise.resolve(true); } return tx("readwrite", (s) => { s.put(v, k); return true; }); },
      del: (k) => { delete mem[k]; return db ? tx("readwrite", (s) => { s.delete(k); return true; }) : Promise.resolve(true); },
      keys: () => (db ? tx("readonly", (s) => s.getAllKeys()) : Promise.resolve(Object.keys(mem)))
    };
  })();

  /* ---------------- state ---------------- */
  const defaults = () => ({
    settings: { season: "auto", targetDays: 14, loadWhNormal: 300, loadWhHeat: 1080, solarW: 0, sunHours: 6.5, checkins: ["08:00", "12:00", "18:00"], updated: 0 },
    plan: { contactName: "", contactPhone: "", rally1: "Home", rally2: "", rally3: "", leaveTo: "", leaveNotes: "", gas: "", water: "", power: "", gmrsCh: "", meshCh: "", updated: 0 },
    outage: { active: false, startedAt: 0, endedAt: 0, updated: 0 },
    checks: { updated: 0 },
    people: [], pets: [], items: [], log: [], tasks: [], buys: [], spots: []
  });
  const prefDefaults = () => ({ theme: "void", sound: true, deviceName: "", lastBackup: 0, installHidden: false });
  let S = defaults(), PR = prefDefaults(), INC = null;
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
    status: renderStatus, emergency: renderEmergency, playbooks: renderPlaybooks, guides: renderGuides, family: renderFamily, supplies: renderSupplies, buy: renderBuy,
    missions: renderMissions, plan: renderPlan, comms: renderComms, library: renderLibrary, binder: renderBinder, system: renderSystem, field: renderField, now: renderNow, quick: renderQuick, quests: renderQuests,
    search: renderSearch, archive: renderArchive, sim: renderSim, map: renderMap
  };
  const TAB_OF = { status: "status", sim: "status", map: "status", missions: "status", now: "status", quick: "status", quests: "status", guides: "guides", playbooks: "guides", plan: "guides", comms: "guides", library: "guides", binder: "guides", search: "guides", field: "guides", archive: "guides", emergency: "emergency", family: "family", supplies: "supplies", buy: "supplies" };
  let lastPath = "";
  function render() {
    route = parseHash();
    if (route.path === "welcome") { location.replace("#/status"); setTimeout(() => Welcome.open(true), 60); return; }
    const em = route.path === "emergency";
    document.body.classList.toggle("em", em);
    document.body.classList.toggle("night", PR.theme === "night");
    const lx = route.path === "library" && route.parts[1] ? LIB.find((d) => d.id === route.parts[1]) : null;
    document.body.classList.toggle("reader", !!lx && typeOf(lx) === "pdf");
    document.body.classList.toggle("zread", !!lx && typeOf(lx) === "zim" && route.parts[2] === "read");
    if (em) Wake.on(); else { Wake.off(); Metro.stop(); cardView.id = null; cardView.autoBeat = false; }
    if (!(route.path === "supplies" && route.parts[1] === "edit")) draft = null;
    const fn = SCREENS[route.path] || renderStatus;
    const html = fn();
    app().innerHTML = html;
    $$(".tab").forEach((t) => t.classList.toggle("on", t.dataset.tab === TAB_OF[route.path]));
    if (lastPath !== location.hash) {
      window.scrollTo(0, 0); lastPath = location.hash;
      // a new screen fades in (not in Emergency, where every millisecond counts, and not when motion is reduced)
      if (!em && !matchMedia("(prefers-reduced-motion: reduce)").matches) { const a = app(); a.classList.remove("enter"); void a.offsetWidth; a.classList.add("enter"); }
    }
    afterRender();
  }
  function afterRender() {
    tick();
    hydratePhotos();
    if (route.path === "emergency" && cardView.beatStep && Metro.on === false && cardView.autoBeat) { Metro.start(cardView.beatStep); }
    if (!$(".beat")) Metro.stop(); else if (Metro.on) Metro.loop();
    const lx = route.path === "library" && route.parts[1] ? LIB.find((d) => d.id === route.parts[1]) : null, lt = lx ? typeOf(lx) : "";
    if (lt === "pdf") PdfV.mount(lx.id); else if (PdfV.id) PdfV.close();
    if (lt === "zim" && route.parts[2] === "read") ZR.mount(lx.id, route.q.p); else ZR.unmount();
    if (lt === "video" || lt === "audio") Media.mount(lx.id); else if (Media.id) Media.close();
    if (route.path === "library" && !route.parts[1]) { libQuota(); PdfIndex.kick(); }
    if (route.path === "search") SearchUI.mount();
    if (route.path === "archive") Get.mount();
    if (route.path === "status" || route.path === "" || route.path === "quests") Ready.mount();
    if (route.path === "map") MapView.mount(); else if (document.body.classList.contains("mapon")) MapView.show(false);
    const simLive = route.path === "sim" && !!route.parts[1];
    if (!simLive && SimVoice.live) {
      SimVoice.live = false; Clips.stop(); AlarmSnd.stop(); Beat.stop(); Drill.stopT();
      if (SR && SR.beat && SR.beat.phase !== "done") SR.beat.phase = "ready";
      if (SR && SR.drill && SR.drill.phase === "run") SR.drill.phase = "ready";
      if (!Welcome.on) AudioMode.set("auto");
    }
    if (simLive && SR) {
      SimVoice.live = true; if (!Welcome.on) AudioMode.set("playback");
      const sm = SR.s;
      if (sm.type === "quiz" && !SR.done) {
        const f = SR.frames[SR.i], key = "s-" + sm.id + "-" + SR.order[SR.i];
        if (SR.said !== key && SR.pick < 0) { SR.said = key; if (f.sound) setTimeout(() => { if (route.path === "sim" && SR && SR.frames[SR.i] === f) simSound(); }, 450); else SimVoice.say(key); }
      } else if ((sm.type === "beat" || sm.type === "drill") && SR.said !== "intro" && ((SR.beat || SR.drill || {}).phase || "ready") === "ready") { SR.said = "intro"; SimVoice.say("s-" + sm.id); }
      if (SR.drill && SR.drill.phase === "run") Wake.on();
    }
    CardVoice.sync();
    if (route.path === "status" || route.path === "") Strip.fill();
  }

  /* ---------------- shared chrome ---------------- */
  function topbar(title) {
    return '<header class="top"><a class="brand" href="#/status" aria-label="HAVYN FIELD home">' + MARK + "<b>HAVYN</b><span>FIELD</span></a>" +
      '<div class="tools"><a class="ibtn" href="#/search" aria-label="Search everything">' + ic("search") + '</a><button class="ibtn' + (PR.theme === "night" ? " on" : "") + '" data-act="night" aria-label="Night mode">' + ic("moon") + "</button>" +
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

  // Home's status line, like an operating system's: works offline, what's stored, the last Memory Card, online or not.
  const Strip = {
    html() {
      const off = !!(navigator.serviceWorker && navigator.serviceWorker.controller) || PREVIEW, card = PR.lastBackup ? Math.floor((now() - PR.lastBackup) / DAY) : -1, net = navigator.onLine !== false;
      const cell = (k, v, cl, id) => '<div class="sc' + (cl ? " " + cl : "") + '"><small>' + k + "</small><b" + (id ? ' id="' + id + '"' : "") + ">" + v + "</b></div>";
      return '<div class="strip" aria-label="System status">' + cell("Offline", off ? "Ready" : "Not yet", off ? "ok" : "warn") + cell("Stored", this.used ? sz(this.used) : "…", "", "stuse") +
        cell("Backup", card < 0 ? "Never" : card === 0 ? "Today" : card + "d ago", card < 0 || card > 30 ? "warn" : "ok") + cell("Network", net ? "Online" : "Offline", net ? "ok" : "") + "</div>";
    },
    fill() {
      if (!navigator.storage || !navigator.storage.estimate) return;
      navigator.storage.estimate().then((e) => { this.used = e.usage || 0; const el = $("#stuse"); if (el && this.used) el.textContent = sz(this.used); }).catch(() => {});
    }
  };
  function deck() {
    // The command deck: the one red button, then "What's happening?", then the rest of HAVYN as tiles.
    let h = '<a class="sostile" href="#/emergency"><span class="sd">' + ic("cross") + '</span><span class="tx"><b>Someone\'s hurt</b><small>Not breathing, bleeding, choking, chest pain: the cards, with one-tap 911</small></span>' + ic("chev") + "</a>";
    h += '<div class="sec"><span class="lab"><b>02</b> What\'s happening?</span></div><div class="nowgrid">' + (C.situations || []).map((x) => {
      const pb = x.pb && C.playbooks.find((p) => p.id === x.pb && !p.soon), pr = pb ? countChecks(pb) : null;
      return '<a class="gt" href="#/now/' + x.id + '">' + ic(x.icon) + "<b>" + esc(x.t) + "</b>" + (pr && pr.d ? '<small class="on">' + pr.d + " of " + pr.n + " done</small>" : "<small>" + esc(x.sub) + "</small>") + "</a>";
    }).join("") + "</div>";
    const sd = simDone(), sst = simStars(), smax = SIMS.list.length * 3;
    h += '<div class="sec"><span class="lab"><b>03</b> Train</span></div><a class="simbanner" href="#/sim"><span class="sbgrid" aria-hidden="true"></span><span class="sbx"><small>HAVYN</small><b>SIM LAB</b><span>' +
      (sd ? sd + " of " + SIMS.list.length + " run · " + sst + " ★" : "Practice in about a minute. Tap, listen, decide.") + '</span><span class="sbbar"><i style="width:' + Math.round(sst / Math.max(1, smax) * 100) + '%"></i></span></span><span class="sbic" aria-hidden="true">' + ["heart", "speaker", "bug", "flame"].map((i) => "<i>" + ic(i) + "</i>").join("") + "</span></a>";
    h += '<div class="sec"><span class="lab"><b>04</b> Know-how</span></div><div class="menugrid">' +
      [["#/map", "map", "Map", MAPS.length ? "Offline · nearest ER" : "Streets, ERs, GPS"], ["#/field", "book", "How do I…", FIELD().length + " answers"], ["#/library", "globe", "Library", libSummary() || "Books and manuals"], ["#/plan", "pin", "Plan", "Where to meet"], ["#/comms", "radio", "Comms", "Radios, check-ins"]]
        .map(([href, icn, b, sm]) => '<a class="mt" href="' + href + '">' + ic(icn) + "<span><b>" + esc(b) + "</b><small>" + esc(sm) + "</small></span></a>").join("") + "</div>";
    return h;
  }
  function renderStatus() {
    const t = now();
    const a = E.autonomy(S, t);
    const people = L("people");
    let h = topbar();
    const fam = a.family;
    const st = E.status(fam);
    // Readiness is the game: level up as quests are done (a toast and a chime when it happens).
    const rs = Ready.score(), lv = level(rs);
    if (PR.level && lv.n > PR.level && !Welcome.on) setTimeout(() => { toast("LEVEL UP · " + lv.rank.toUpperCase() + " · LV " + lv.n); Snd.chime("save"); }, 400);
    if (PR.level !== lv.n) { PR.level = lv.n; flush(); }
    if (Upd.ready) h += '<button class="updbar" data-act="upd-restart">' + ic("download") + "<span><b>Update ready</b><small>Tap to restart HAVYN with the new version</small></span></button>";
    h += Strip.html() + '<div class="sec first"><span class="lab"><b>01</b> Readiness</span></div>' + Ready.panel() + deck();
    h += '<div class="sec"><span class="lab"><b>05</b> Family status</span></div>';
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

    h += missionsPanel(t);

    // Alerts
    const alerts = [];
    if (!people.length && !L("items").length) {
      alerts.push('<div class="glass panel"><h3>Start here</h3><div class="list">' +
        '<a class="li" href="#/quick/household">' + '<span class="ic">' + ic("people") + '</span><span class="tx"><b>1. Add your household</b><small>People, pets, contacts, meeting places</small></span>' + ic("chev") + "</a>" +
        '<a class="li" href="#/quick/supplies">' + '<span class="ic">' + ic("box") + '</span><span class="tx"><b>2. Add supplies</b><small>Water, food, critical meds, batteries</small></span>' + ic("chev") + "</a>" +
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
    const bf = bfAlert(t); if (bf) alerts.push(bf);
    for (const u of E.missions(C.missions, S, t).due) alerts.push('<a class="alert" href="#/missions"><span class="dot"></span><span><b>' + esc(u.def.t) + " is due</b><small>" + esc(u.def.time) + " · " + esc(u.def.d.split(". ")[0]) + "</small></span></a>");
    const g = E.gaps(S, t);
    if (people.length && g.list.length) alerts.push('<a class="alert" href="#/supplies"><span class="dot"></span><span><b>To reach ' + g.target + " days</b><small>" + g.list.slice(0, 3).map((x) => "+" + fmtN(x.gap, x.unit === "gal" ? 1 : 0) + " " + x.unit + " " + (x.name ? esc(x.name) : x.res)).join(" · ") + "</small></span></a>");
    if (alerts.length) h += '<div class="sec"><span class="lab">Attention</span></div>' + alerts.join("");
    if (false) h += '<a class="alert info" href="#/archive?t=shelf" id="ready"><span class="dot" style="background:var(--ok)"></span><span><b>This phone is ready</b><small>Manuals, encyclopedias, plan and backup are all on it. Open Get more for updates.</small></span></a>';
    if (PREVIEW) h += '<div class="alert info"><span class="dot"></span><span><b>Preview build</b><small>Data stays in this browser only. Install from your own link for offline use on iPhone.</small></span></div>';
    return h;
  }

  function renderQuests() { return backbar("#/status", "Quests") + Ready.panel(true); }

  // The voice guide reads each step of an emergency card aloud, in HAVYN's own voice, as it comes up (hands-free).
  const CardVoice = {
    said: "",
    sync() {
      const m = /^#\/emergency\/([\w-]+)/.exec(location.hash || "");
      const key = m && PR.cardVoice !== false ? "c-" + m[1] + "-" + (cardView.id === m[1] ? cardView.step : 0) : "";
      if (!key || !Clips.hasId(key)) { if (this.said) this.off(); return; }
      if (key === this.said) return;
      this.said = key; this.say(key);
    },
    say(key) { AudioMode.set("playback"); Clips.playId(key || this.said); },
    off() { Clips.stop(); this.said = ""; AudioMode.set("auto"); }
  };

  // The log for responders: one tap stamps the time of what was done (CPR started, a tourniquet on, a dose given, a
  // seizure's start and end), with a live timer where the card says to wait. Paramedics see it all on one screen.
  // Kept on this phone only (not in Memory Cards); a log with nothing new for 6 hours is finished.
  const mss = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(x).padStart(2, "0"); };
  const hm = (t) => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const STOPS = () => { const o = {}; C.cards.forEach((c) => (c.log || []).forEach((m) => { if (m.of) o[m.w] = m.of; })); return o; };
  const Inc = {
    arm: 0,
    on() { return INC && now() - INC.last < 6 * 3600e3 ? INC : null; },
    add(w, card) {
      if (!this.on()) {
        INC = { last: now(), ev: [] };
        const c = cardView.id && C.cards.find((x) => x.id === cardView.id);
        if (c && cardView.at && !/^Opened /.test(w)) INC.ev.push({ t: cardView.at, c: c.id, w: "Opened the " + c.title + " card" });
      }
      INC.ev.push({ t: now(), c: card || "", w }); INC.last = now(); Store.set("incident", INC);
    },
    opened(c) { // while a log is running, opening a card is part of the story (once per card in 10 minutes)
      if (!this.on()) return;
      const l = INC.ev.filter((e) => e.c === c.id && /^Opened /.test(e.w)).pop();
      if (!l || now() - l.t > 10 * 60e3) this.add("Opened the " + c.title + " card", c.id);
    },
    last(w) { const I = this.on(); return I ? I.ev.filter((e) => e.w === w).pop() : null; },
    count(w) { const I = this.on(); return I ? I.ev.filter((e) => e.w === w).length : 0; },
    clear() { INC = null; this.arm = 0; Store.set("incident", null); }
  };
  function logRow(c) {
    if (!c.log || !c.log.length) return "";
    const stopOf = (m, e) => { const x = c.log.find((y) => y.of === m.w), se = x && Inc.last(x.w); return se && se.t >= e.t ? se : null; };
    return '<div class="emlog"><div class="emdh">' + ic("clock") + "Times for the paramedics</div>" + c.log.map((m) => {
      const e = Inc.last(m.w), n = Inc.count(m.w);
      let t = "Tap when it happens", due = false;
      if (e && m.of) { const st = Inc.last(m.of); t = hm(e.t) + (st && st.t <= e.t ? " · lasted " + mss(e.t - st.t) : ""); }
      else if (e) {
        const sp = stopOf(m, e);
        if (sp) t = hm(e.t) + " · lasted " + mss(sp.t - e.t);
        else { due = !!m.due && now() - e.t >= m.due * 60e3; t = hm(e.t) + ' · <b data-since="' + e.t + '"' + (m.due ? ' data-due="' + m.due + '"' : "") + ">" + mss(now() - e.t) + "</b> ago"; }
      }
      return '<button class="emmark' + (e ? " done" : "") + (due ? " due" : "") + '" data-act="inc-mark" data-w="' + esc(m.w) + '" data-card="' + c.id + '">' +
        '<span class="mw">' + ic(e ? "check" : "clock") + esc(m.w) + (n > 1 ? " ×" + n : "") + '</span><span class="mtime">' + t + "</span>" +
        (m.hint && e && !stopOf(m, e) ? '<span class="mh">' + esc(m.hint) + "</span>" : "") + "</button>";
    }).join("") + (Inc.on() ? '<a class="emlogl" href="#/emergency/log">' + ic("clock") + "<span>Show the log</span><b>" + Inc.on().ev.length + "</b></a>" : "") + "</div>";
  }
  function renderLog() {
    const I = INC, st = STOPS();
    let h = emTop() + '<div class="emhead"><span>Log for responders</span>' + (I && I.ev.length ? "<span>From " + hm(I.ev[0].t) + "</span>" : "") + "</div>";
    if (!I || !I.ev.length) return h + '<div class="emdet" style="margin-top:14px">Nothing logged yet. On a card, tap a time button (like "CPR started") when it happens.</div><div class="emnav"><a class="next" href="#/emergency" style="grid-column:1/-1">ALL CARDS</a></div>';
    const t0 = I.ev[0].t;
    h += '<p class="logsub">Show this screen to the paramedics, or read it to the 911 dispatcher.' + (Inc.on() ? "" : " It's from " + new Date(t0).toLocaleDateString() + ".") + "</p>";
    h += '<ol class="loglist">' + I.ev.map((e, i) => {
      const from = st[e.w] && I.ev.slice(0, i).filter((x) => x.w === st[e.w]).pop();
      return "<li" + (/^Opened /.test(e.w) ? "" : ' class="key"') + "><time>" + hm(e.t) + "</time><span>" + esc(e.w) + (from ? " <em>lasted " + mss(e.t - from.t) + "</em>" : "") + "</span><small>" + (i ? "+" + mss(e.t - t0) : "first") + "</small></li>";
    }).join("") + "</ol>";
    if (Inc.on()) h += '<div class="loglive">Since the first entry <b data-since="' + t0 + '">' + mss(now() - t0) + "</b></div>";
    h += '<div class="emnav"><button data-act="inc-clear">' + (Inc.arm && now() - Inc.arm < 5000 ? "TAP AGAIN" : "CLEAR LOG") + '</button><a class="next" href="#/emergency">ALL CARDS</a></div>';
    return h;
  }

  /* ---------------- SIM LAB: train by doing (tap, listen, decide), about a minute each ----------------
     Content in src/sims.js. Three engines: quiz (scans, missions, Alarm ID), beat (CPR rhythm) and drill (family escape
     timer). Stars per sim live in prefs.sim; three runs count as a readiness quest. Narration plays HAVYN's recordings
     (s-<sim>-<frame> and s-<sim>-<frame>-ok) when they exist. */
  const SIMS = typeof HAVYN_SIMS !== "undefined" ? HAVYN_SIMS : { list: [], art: {}, checked: "" };
  const simById = (id) => SIMS.list.find((x) => x.id === id);
  const simRec = (id) => (PR.sim || {})[id] || null;
  const simDone = () => SIMS.list.filter((x) => (simRec(x.id) || {}).stars > 0).length;
  const simStars = () => SIMS.list.reduce((a, x) => a + ((simRec(x.id) || {}).stars || 0), 0);
  const art = (k, cls) => (SIMS.art[k] ? '<svg class="art' + (cls ? " " + cls : "") + '" viewBox="0 0 240 160" aria-hidden="true">' + SIMS.art[k] + "</svg>" : "");
  const starRow = (n) => '<span class="stars" aria-label="' + n + ' of 3 stars">' + [0, 1, 2].map((i) => "<i" + (i < n ? ' class="on"' : "") + ">★</i>").join("") + "</span>";
  const SIMKIND = { train: "Train", scan: "Scan", mission: "Mission" };
  // Alarm sounds, as the standards describe them: smoke T3 (three half-second beeps, 1.5 s pause), CO T4 (four short
  // beeps, about 5 s pause), low battery (one chirp, repeating every 30 to 60 seconds).
  const ALARM = {
    t3: { f: 3100, dur: 7, pulses: [[0, 0.5], [1, 0.5], [2, 0.5], [4, 0.5], [5, 0.5], [6, 0.5]] },
    t4: { f: 3100, dur: 7, pulses: [[0, 0.1], [0.2, 0.1], [0.4, 0.1], [0.6, 0.1], [5.7, 0.1], [5.9, 0.1], [6.1, 0.1], [6.3, 0.1]] },
    chirp: { f: 3500, dur: 7, pulses: [[0, 0.05]] }
  };
  const AlarmSnd = {
    nodes: [], loopT: 0, last: null,
    once(kind, gain) {
      const a = Snd.ctx(), P = ALARM[kind]; if (!a || !P) return false;
      const t0 = a.currentTime + 0.06, g = gain || 0.09;
      for (const [s, d] of P.pulses) {
        const o = a.createOscillator(), v = a.createGain();
        o.type = "square"; o.frequency.value = P.f;
        v.gain.setValueAtTime(0, t0 + s); v.gain.linearRampToValueAtTime(g, t0 + s + 0.008); v.gain.setValueAtTime(g, t0 + s + d - 0.01); v.gain.linearRampToValueAtTime(0, t0 + s + d);
        o.connect(v).connect(a.destination); o.start(t0 + s); o.stop(t0 + s + d + 0.02); this.nodes.push(o);
      }
      this.last = { kind, at: now() }; return true;
    },
    play(kind, gain) { this.stop(); return this.once(kind, gain); },
    loop(kind, gain) { this.stop(); this.once(kind, gain); this.loopT = setInterval(() => { this.nodes = this.nodes.slice(-12); this.once(kind, gain); }, ALARM[kind].dur * 1000); },
    stop() { this.nodes.forEach((o) => { try { o.stop(); } catch (e) {} }); this.nodes = []; clearInterval(this.loopT); this.loopT = 0; }
  };
  const SimVoice = {
    live: false,
    say(key) { if (PR.simVoice === false || !Clips.hasId(key)) return false; Clips.playId(key); return true; }
  };

  let SR = null; // the run on screen: {id, s, i, frames, order, ch, pick, miss, score, bonus, t0, uv, done, stars, gain, said}
  function simStart(id) {
    const s = simById(id); if (!s) return null;
    const idx = (s.frames || []).map((_, k) => k);
    const order = s.shuffle ? idx.map((k) => [Math.random(), k]).sort((a, b) => a[0] - b[0]).map((x) => x[1]) : idx;
    const frames = order.map((k) => s.frames[k]);
    const ch = frames.map((f) => (f.choices || []).map((_, k) => [Math.random(), k]).sort((a, b) => a[0] - b[0]).map((x) => x[1]));
    return { id, s, i: 0, frames, order, ch, pick: -1, miss: 0, score: 0, bonus: 0, t0: now(), uv: false, done: false, stars: 0, gain: 0, said: "" };
  }
  function simSave(id, stars, score, time) {
    PR.sim = PR.sim || {}; const r = PR.sim[id] || { stars: 0, best: 0, n: 0 }, before = simStars();
    PR.sim[id] = { stars: Math.max(r.stars || 0, stars), best: Math.max(r.best || 0, score || 0), n: (r.n || 0) + 1, at: now() };
    if (time) PR.sim[id].time = r.time ? Math.min(r.time, time) : time; else if (r.time) PR.sim[id].time = r.time;
    if (SR) SR.gain = simStars() - before;
    flush();
  }
  function renderSim() {
    const id = route.parts[1];
    if (!id) { SR = null; return renderSimHub(); }
    if (!SR || SR.id !== id) SR = simStart(id);
    if (!SR) return renderSimHub();
    const s = SR.s;
    if (s.type === "beat") return renderBeat(s);
    if (s.type === "drill") return renderDrill(s);
    return SR.done ? renderSimEnd(s) : renderSimFrame(s);
  }
  function renderSimHub() {
    const st = simStars(), max = SIMS.list.length * 3;
    let h = backbar("#/status", "Sim Lab");
    h += '<div class="simhero"><div class="simgrid" aria-hidden="true"></div><div class="simhx"><small>HAVYN</small><b>SIM LAB</b><span>Train in about a minute. Tap, listen, decide.</span></div>' +
      '<div class="simscore"><b>' + st + "</b><small>of " + max + ' ★</small></div><div class="simbarp"><i style="width:' + Math.round(st / max * 100) + '%"></i></div></div>';
    [["train", "01", "Train", "Hands and ears"], ["scan", "02", "Scan", "Know it when you see it"], ["mission", "03", "Missions", "Five calls, one minute"]].forEach(([k, n, t, sub]) => {
      h += '<div class="sec"><span class="lab"><b>' + n + "</b> " + t + '</span><span class="sec2">' + sub + '</span></div><div class="simtiles">';
      for (const x of SIMS.list.filter((y) => y.kind === k)) {
        const r = simRec(x.id) || {};
        h += '<a class="simtile k-' + k + (r.stars ? " done" : "") + '" href="#/sim/' + x.id + '"><div class="sta">' + art(x.art) + "</div><b>" + esc(x.title) + "</b><small>" + esc(r.time ? "Best " + mss(r.time * 1000) : x.sub) + "</small>" + starRow(r.stars || 0) + "</a>";
      }
      h += "</div>";
    });
    return h + '<p class="simsrc">Every answer comes from HAVYN\'s cards and playbooks or the source named with it. Practice helps; a class helps more.</p>';
  }
  function simHud(s, i, n) {
    return '<div class="simhud"><a class="ibtn" href="#/sim" aria-label="Back to Sim Lab">' + ic("back") + '</a><div class="shx"><small>' + esc(SIMKIND[s.kind] || "Sim") + "</small><b>" + esc(s.title) + "</b></div>" +
      (n ? '<div class="sdots">' + Array.from({ length: n }, (_, k) => "<i" + (k < i ? ' class="on"' : k === i ? ' class="cur"' : "") + "></i>").join("") + "</div>" : '<div class="sdots"></div>') +
      '<button class="ibtn" data-act="sim-voice" aria-pressed="' + (PR.simVoice !== false) + '" aria-label="Narration">' + ic(PR.simVoice === false ? "speakeroff" : "speaker") + "</button></div>";
  }
  function soundPanel(kind, a) {
    const P = ALARM[kind];
    return '<div class="simsound"><div class="ssart">' + art(a) + '</div><button class="ssplay" data-act="sim-play">' + ic("play") + "<span>Play the sound</span></button>" +
      '<svg class="wave" viewBox="0 0 300 40" preserveAspectRatio="none" aria-hidden="true">' + P.pulses.map(([s, d]) => '<rect x="' + (s / P.dur * 300).toFixed(1) + '" y="6" width="' + Math.max(3, d / P.dur * 300).toFixed(1) + '" height="28" rx="2"/>').join("") + '<line class="head" x1="1" y1="0" x2="1" y2="40"/></svg>' +
      '<div class="ssnote">' + (kind === "chirp" ? "…then quiet for 30 to 60 seconds" : "Count the beeps") + "</div></div>";
  }
  function renderSimFrame(s) {
    const f = SR.frames[SR.i], n = SR.frames.length;
    let h = simHud(s, SR.i, n) + (s.scene ? '<div class="simscene"><i></i>' + esc(s.scene) + "</div>" : "");
    if (f.scan) {
      const mk = (m, k) => '<span class="mark' + (m[1] < 20 ? " lft" : m[1] > 80 ? " rgt" : "") + '" style="left:' + m[1] + "%;top:" + m[2] + "%;animation-delay:" + (0.45 + k * 0.4).toFixed(2) + 's"><i></i>' + esc(m[0]) + "</span>";
      h += '<div class="scanbox' + (SR.uv ? " uv" : "") + '"><div class="scanart' + (f.art2 ? " two" : "") + '">' + art(f.art) + (f.art2 ? art(f.art2) : "") + (f.marks || []).map(mk).join("") + '</div><div class="scanline" aria-hidden="true"></div><div class="scantag">' + (SR.uv ? "UV SCAN" : "SCAN COMPLETE") + "</div></div>";
      h += '<div class="simq"><b>' + esc(f.title) + "</b>" + (f.sub ? "<small>" + esc(f.sub) + "</small>" : "") + "</div>";
      return h + '<div class="simbar">' + (f.uv ? '<button class="simbtn ghost' + (SR.uv ? " on" : "") + '" data-act="sim-uv">' + ic("sun") + "UV light</button>" : "") + '<button class="simbtn" data-act="sim-next">Got it ›</button></div>';
    }
    const arty = f.choices.some((c) => c.art);
    if (f.sound) h += soundPanel(f.sound, f.art);
    else if (f.art && !arty) h += '<div class="simart">' + art(f.art) + "</div>";
    h += '<div class="simq"><b>' + esc(f.q) + "</b></div>";
    h += '<div class="simch' + (arty ? " arty" : "") + '">' + SR.ch[SR.i].map((k) => {
      const c = f.choices[k], st = SR.pick < 0 ? "" : c.ok ? " right" : k === SR.pick ? " wrong" : " dim";
      return '<button class="sch' + st + '" data-act="sim-pick" data-i="' + k + '"' + (SR.pick >= 0 ? " disabled" : "") + ">" + (c.art ? art(c.art) : "") + "<span>" + esc(c.t) + "</span>" + (st === " right" ? ic("check") : "") + "</button>";
    }).join("") + "</div>";
    if (SR.pick >= 0) {
      const good = !!f.choices[SR.pick].ok;
      h += '<div class="simwhy ' + (good ? "good" : "bad") + '"><b>' + (good ? "Correct" : "Not quite") + (good && SR.bonus ? " <em>+" + SR.bonus + " speed</em>" : "") + "</b><span>" + esc(f.ok) + "</span></div>";
      h += '<div class="simbar"><button class="simbtn" data-act="sim-next">' + (SR.i < n - 1 ? "Next ›" : "Finish ›") + "</button></div>";
    }
    return h;
  }
  function simSrc(s) {
    const card = s.card && C.cards.find((c) => c.id === s.card), src = (s.src || []).concat(card ? card.sources : []);
    return '<p class="simsrc">' + (s.from ? "From " + esc(s.from) + ". " : "") + (src.length ? "Sources: " + srcLine(src) + ". " : "") + "Checked " + esc(SIMS.checked) + ". Training beats any app: take a CPR class.</p>";
  }
  function simEndHtml(s, stars, title, stats) {
    const nx = s.next && simById(s.next);
    return '<div class="simend"><div class="bigstars">' + [0, 1, 2].map((i) => '<i class="' + (i < stars ? "on" : "") + '" style="animation-delay:' + (0.15 + i * 0.28).toFixed(2) + 's">★</i>').join("") + "</div>" +
      "<b>" + esc(title) + '</b><div class="endstats">' + stats.map(([k, v]) => "<span><small>" + k + "</small><b>" + v + "</b></span>").join("") + "</div>" +
      (SR.gain > 0 ? '<div class="xpgain">+' + SR.gain + " ★ to your Sim Lab</div>" : "") + "</div>" +
      '<div class="simbar"><button class="simbtn ghost" data-act="sim-again">Again</button>' + (nx ? '<a class="simbtn" href="#/sim/' + nx.id + '">Next: ' + esc(nx.title) + " ›</a>" : '<a class="simbtn" href="#/sim">Sim Lab ›</a>') + "</div>" + simSrc(s);
  }
  function renderSimEnd(s) {
    const r = simRec(s.id) || {}, n = SR.frames.length;
    return simHud(s, n, n) + simEndHtml(s, SR.stars, SR.stars === 3 ? "Perfect run" : SR.stars === 2 ? "Nicely done" : "Run complete", [["Score", SR.score], ["Best", Math.max(r.best || 0, SR.score)], ["Missed", SR.miss]]);
  }
  function simPick(k) {
    if (!SR || SR.pick >= 0) return;
    const f = SR.frames[SR.i], c = f.choices[k]; if (!c) return;
    SR.pick = k; AlarmSnd.stop(); Clips.stop();
    if (c.ok) { const dt = (now() - SR.t0) / 1000; SR.bonus = Math.max(0, Math.round(50 * (1 - Math.max(0, dt - 3) / 9))); SR.score += 100 + SR.bonus; Snd.chime("ok"); }
    else { SR.miss++; SR.bonus = 0; Snd.chime("warn"); }
    render();
    SimVoice.say("s-" + SR.id + "-" + SR.order[SR.i] + "-ok");
  }
  function simNext() {
    if (!SR) return;
    SR.i++; SR.pick = -1; SR.t0 = now(); SR.uv = false; SR.bonus = 0; AlarmSnd.stop(); Clips.stop();
    if (SR.i >= SR.frames.length) { SR.done = true; SR.stars = SR.miss === 0 ? 3 : SR.miss === 1 ? 2 : 1; simSave(SR.id, SR.stars, SR.score); Snd.chime("save"); }
    render();
  }
  function simSound() {
    const f = SR && !SR.done && SR.frames[SR.i]; if (!f || !f.sound) return;
    Clips.stop(); AlarmSnd.play(f.sound);
    const w = $(".wave"); if (w) { w.style.setProperty("--d", ALARM[f.sound].dur + "s"); w.classList.remove("go"); void w.getBoundingClientRect(); w.classList.add("go"); }
  }

  // CPR Beat: tap the chest; the first 6 seconds have a 110-a-minute guide beat, then you keep the rhythm yourself.
  const Beat = {
    raf: 0, t: 0,
    st() { return SR && SR.beat; },
    start() {
      const B = this.st(); if (!B) return; this.stop(); Snd.ctx(); Clips.stop();
      Object.assign(B, { phase: "count", taps: [], start: 0 }); render();
      let n = 3;
      const step = () => { const el = $("#beatcall"); if (!this.st() || this.st().phase !== "count") return; if (n > 0) { if (el) el.textContent = String(n); const a = Snd.ctx(); if (a) Snd.click(a.currentTime + 0.01); n--; this.t = setTimeout(step, 650); } else this.go(); };
      step();
    },
    go() {
      const B = this.st(); if (!B) return;
      B.phase = "run"; B.start = performance.now();
      const a = Snd.ctx(); if (a) { const t0 = a.currentTime + 0.05; for (let k = 0; k * 0.545 < 6; k++) Snd.click(t0 + k * 0.545); }
      const box = $(".beatart"); if (box) box.classList.add("guide");
      const call = $("#beatcall"); if (call) call.textContent = "Push";
      this.loop();
    },
    tap() {
      const B = this.st(); if (!B || B.phase !== "run") return;
      const t = performance.now(); B.taps.push(t);
      const box = $(".beatart"); if (box) { box.classList.remove("hit"); void box.getBoundingClientRect(); box.classList.add("hit"); }
      const r = this.rate(B.taps); const c = $("#bcount"); if (c) c.textContent = String(B.taps.length);
      if (r) {
        const nd = $("#needle"), bp = $("#bpm"), call = $("#beatcall");
        if (nd) nd.style.transform = "rotate(" + Math.max(-90, Math.min(90, -90 + (r - 60) / 100 * 180)).toFixed(1) + "deg)";
        if (bp) bp.textContent = String(Math.round(r));
        if (call) { call.textContent = r < 100 ? "Faster" : r > 120 ? "Slower" : "Good"; call.className = r < 100 || r > 120 ? "warn" : "ok"; }
      }
    },
    rate(taps, upto) { // the pace over the last four pushes (a minute's worth of pushes at that pace)
      const n = upto === undefined ? taps.length : upto + 1; if (n < 3) return 0;
      const a = taps.slice(Math.max(0, n - 5), n), dt = (a[a.length - 1] - a[0]) / (a.length - 1);
      return dt > 0 && dt < 1500 ? 60000 / dt : 0;
    },
    loop() {
      const B = this.st(); if (!B || B.phase !== "run") return;
      const el = performance.now() - B.start, secs = (SR.s.secs || 20) * (window.__HAVYN_SIM_FAST ? 0.25 : 1), left = Math.max(0, secs - el / 1000);
      const tm = $("#btime"); if (tm) tm.textContent = Math.ceil(left) + "s";
      if (el > 6000) { const box = $(".beatart"); if (box) box.classList.remove("guide"); }
      if (left <= 0) return this.finish();
      this.raf = requestAnimationFrame(() => this.loop());
    },
    finish() {
      const B = this.st(); if (!B) return; this.stop();
      const rates = B.taps.map((_, k) => this.rate(B.taps, k)).filter(Boolean), zone = rates.filter((r) => r >= 100 && r <= 120).length;
      B.pct = rates.length ? Math.round(zone / rates.length * 100) : 0;
      B.avg = B.taps.length > 2 ? Math.round(60000 / ((B.taps[B.taps.length - 1] - B.taps[0]) / (B.taps.length - 1))) : 0;
      const secs = (SR.s.secs || 20) * (window.__HAVYN_SIM_FAST ? 0.25 : 1); // fewer than one push a second isn't CPR
      B.stars = B.taps.length < secs ? 1 : B.pct >= 75 ? 3 : B.pct >= 50 ? 2 : 1;
      B.phase = "done"; SR.stars = B.stars; simSave(SR.id, B.stars, B.pct); Snd.chime("save"); render();
    },
    stop() { cancelAnimationFrame(this.raf); clearTimeout(this.t); }
  };
  function renderBeat(s) {
    const B = SR.beat || (SR.beat = { phase: "ready", taps: [] });
    let h = simHud(s, 0, 0);
    if (B.phase === "done") return h + simEndHtml(s, B.stars, B.pct >= 75 ? "Steady hands" : B.pct >= 50 ? "Getting there" : "Keep practicing", [["Average", (B.avg || "—") + "/min"], ["In the zone", B.pct + "%"], ["Pushes", B.taps.length]]) .replace('<div class="simbar">', '<p class="simtip">' + esc(s.tip) + '</p><div class="simbar">');
    const zx = (b) => { const th = (180 - (b - 60) / 100 * 180) * Math.PI / 180; return (100 + 80 * Math.cos(th)).toFixed(1) + " " + (100 - 80 * Math.sin(th)).toFixed(1); };
    h += '<div class="beatbox"><div class="beatart' + (B.phase === "run" ? " live" : "") + '" role="button" aria-label="Tap here to push">' + art("chest") + '<div class="ring" aria-hidden="true"></div><div id="beatcall">' + (B.phase === "ready" ? "Tap here" : B.phase === "count" ? "3" : "Push") + "</div></div>" +
      '<div class="gauge"><svg viewBox="0 0 200 112" aria-hidden="true"><path class="gtrack" d="M20 100A80 80 0 0 1 180 100"/><path class="gzone" d="M' + zx(100) + "A80 80 0 0 1 " + zx(120) + '"/><g id="needle" style="transform:rotate(-90deg)"><path d="M100 100V30"/></g><circle cx="100" cy="100" r="6"/>' +
      '<text x="14" y="110">60</text><text x="70" y="14">100</text><text x="118" y="14">120</text><text x="168" y="110">160</text></svg><div class="gnum"><b id="bpm">—</b><small>per minute</small></div></div>' +
      '<div class="beatstats"><span><small>Time</small><b id="btime">' + (s.secs || 20) + 's</b></span><span><small>Pushes</small><b id="bcount">0</b></span><span><small>Target</small><b>100–120</b></span></div></div>';
    if (B.phase === "ready") h += '<div class="simq"><b>Tap the chest to the beat</b><small>100 to 120 a minute. The beat stops after 6 seconds: keep going.</small></div><div class="simbar"><button class="simbtn" data-act="beat-go">' + ic("play") + "Start</button></div>";
    return h;
  }

  // The 2-Minute Drill: a real escape practice for the whole family, with a stopwatch and (if you like) the smoke alarm.
  const Drill = {
    t: 0,
    st() { return SR && SR.drill; },
    go() {
      const D = this.st(); if (!D) return; Clips.stop();
      D.phase = "run"; D.start = performance.now(); if (D.alarm) AlarmSnd.loop("t3", 0.05);
      render(); this.t = setInterval(() => this.tick(), 200);
    },
    tick() {
      const D = this.st(); if (!D || D.phase !== "run") return this.stopT();
      const s = (performance.now() - D.start) / 1000, el = $("#dtime"), pr = $("#dprog");
      if (el) el.textContent = mss(s * 1000);
      if (pr) { pr.setAttribute("stroke-dasharray", Math.min(120, s).toFixed(2) + " 120"); pr.classList.toggle("over", s > 120); }
    },
    stop() {
      const D = this.st(); if (!D || D.phase !== "run") return;
      this.stopT(); AlarmSnd.stop();
      D.secs = Math.max(1, Math.round((performance.now() - D.start) / 1000)); D.phase = "done";
      D.stars = D.secs <= 120 ? 3 : D.secs <= 180 ? 2 : 1; SR.stars = D.stars; simSave(SR.id, D.stars, Math.max(0, 300 - D.secs), D.secs); Snd.chime("save"); render();
    },
    stopT() { clearInterval(this.t); this.t = 0; }
  };
  function renderDrill(s) {
    const D = SR.drill || (SR.drill = { phase: "ready", alarm: true }), P = S.plan || {}, meet = P.rally1 && P.rally1 !== "Home" ? P.rally1 : "";
    let h = simHud(s, 0, 0);
    if (D.phase === "done") {
      const r = simRec(s.id) || {};
      return h + simEndHtml(s, D.stars, D.secs <= 120 ? "Out in time" : "Practice again", [["Your time", mss(D.secs * 1000)], ["Best", r.time ? mss(r.time * 1000) : mss(D.secs * 1000)], ["Goal", "2:00"]])
        .replace('<div class="simbar">', '<ul class="simtips">' + s.tips.map((t) => "<li>" + esc(t) + "</li>").join("") + '</ul><div class="simbar">');
    }
    h += '<div class="drillbox"><svg class="dring" viewBox="0 0 200 200" aria-hidden="true"><circle class="trk" cx="100" cy="100" r="86"/><circle id="dprog" class="prog" cx="100" cy="100" r="86" pathLength="120" stroke-dasharray="0 120" transform="rotate(-90 100 100)"/></svg>' +
      '<div class="dtime"><b id="dtime">0:00</b><small>goal 2:00</small></div></div>';
    if (D.phase === "ready") {
      h += '<div class="drsteps">' + [["alarm", "Alarm"], ["people", "Everyone up"], ["evac", "Out"], ["pin", meet ? esc(meet) : "Meeting place"]].map(([i, t], k) => (k ? '<span class="dra">›</span>' : "") + "<span>" + (i === "alarm" ? ic("speaker") : ic(i)) + "<small>" + t + "</small></span>").join("") + "</div>";
      if (!meet) h += '<a class="simhint" href="#/plan">' + ic("pin") + "Pick a meeting place outside (a tree, a mailbox) in Plan ›</a>";
      h += '<div class="simbar"><button class="simbtn ghost' + (D.alarm ? " on" : "") + '" data-act="drill-alarm" aria-pressed="' + !!D.alarm + '">' + ic(D.alarm ? "speaker" : "speakeroff") + "Alarm sound</button><button class=\"simbtn\" data-act=\"drill-go\">" + ic("play") + "Start the drill</button></div>";
    } else h += '<div class="simbar"><button class="simbtn stop" data-act="drill-stop">Everyone\'s out: STOP</button></div>';
    return h;
  }

  /* ---------------- WHAT'S HAPPENING: one situation, everything for it ---------------- */
  function renderNow() {
    const x = (C.situations || []).find((y) => y.id === route.parts[1]);
    if (!x) { location.replace("#/status"); return ""; }
    const pb = x.pb && C.playbooks.find((p) => p.id === x.pb && !p.soon), from = "#/now/" + x.id, P = S.plan || {};
    let h = backbar("#/status", "Home");
    h += '<section class="glass hero nowhero"><div class="lab">What\'s happening</div><div class="nowh"><span class="nic">' + ic(x.icon) + "</span><div><h2>" + esc(x.t) + "</h2><div class=\"sub\">" + esc(pb ? pb.trigger : x.sub) + "</div></div></div>";
    if (pb) {
      const pr = countChecks(pb), ph = pb.phases[0];
      h += '<div class="nowfirst"><div class="lab">' + esc(ph.label) + "</div>" + ph.items.slice(0, 3).map((it) => '<div class="nowi">' + ic("chev") + "<span>" + esc(it.t) + "</span></div>").join("") + "</div>" +
        '<div class="btnrow"><a class="btn" href="#/playbooks/' + pb.id + '">' + ic("play") + (pr.d ? "Carry on: " + pr.d + " of " + pr.n + " done" : "Start the step-by-step plan") + "</a></div>";
    }
    if (x.clock) { const o = S.outage || {}; h += '<div class="btnrow" style="margin-top:8px">' + (o.active ? '<span class="chip warn">Outage clock running</span>' : '<button class="btn ghost" data-act="outage-start">' + ic("clock") + "Start the outage clock</button>") + "</div>"; }
    h += "</section>";
    if (pb) h += '<section class="panel leaveif"><h3>' + esc(pb.ruleTitle || "Hard rule: leave now if") + "</h3>" + pb.leave.map((l) => '<div class="kv"><span>' + esc(l) + "</span></div>").join("") + "</section>";
    if (x.plan) h += '<section class="glass panel"><h3>Your plan</h3>' +
      [["Meet 1 · near home", P.rally1], ["Meet 2 · neighborhood", P.rally2], ["Meet 3 · out of area", P.rally3], ["If you must leave", P.leaveTo], ["Out-of-area contact", P.contactName ? P.contactName + (P.contactPhone ? " · " + P.contactPhone : "") : ""]]
        .map(([k, v]) => '<div class="kv"><span>' + esc(k) + "</span><span>" + (v ? esc(v) : '<span style="color:var(--mute)">not set</span>') + "</span></div>").join("") +
      '<div class="btnrow" style="margin-top:10px"><a class="btn ghost" href="#/family/plan">Edit the plan</a>' + (P.contactPhone ? '<a class="btn" href="tel:' + esc(P.contactPhone.replace(/[^0-9+]/g, "")) + '">' + ic("phone") + "Call contact</a>" : "") + "</div></section>";
    const cards = x.cards.map((id) => C.cards.find((c) => c.id === id)).filter(Boolean);
    if (cards.length) h += '<div class="sec"><span class="lab">If someone is hurt</span></div><div class="nowcards">' + cards.map((c) => '<a class="nc" href="#/emergency/' + c.id + '">' + ic(c.icon) + "<span><b>" + esc(c.title) + "</b><small>" + esc(c.sub) + "</small></span></a>").join("") + "</div>";
    const fs = x.field.map((id) => FIELD().find((f) => f.id === id)).filter(Boolean);
    if (fs.length) h += '<div class="sec"><span class="lab">How to, from the manuals on this phone</span></div><div class="list fl">' + fs.map((f) => fieldRow(f, from)).join("") + "</div>";
    const nums = [0].concat(x.nums || []).map((i) => C.numbers[i]).filter(Boolean);
    h += '<div class="sec"><span class="lab">Numbers</span></div><div class="list">' + nums.map((n) => '<a class="li" href="tel:' + esc(String(n.num).replace(/[^0-9+]/g, "")) + '"><span class="ic">' + ic("phone") + '</span><span class="tx"><b>' + esc(n.n) + " · " + esc(n.num) + "</b><small>" + esc(n.d) + "</small></span>" + ic("chev") + "</a>").join("") + "</div>";
    return h;
  }

  /* ---------------- QUICK SETUP: tap counts instead of forms ---------------- */
  let quick = null;
  function renderQuick() {
    const kind = route.parts[1] === "supplies" ? "supplies" : "household", Q = C.quick;
    if (!quick || quick.kind !== kind) {
      quick = { kind, n: {} };
      if (kind === "household") { for (const r of Q.household) quick.n[r.k] = r.k === "pet" ? L("pets").length : L("people").filter((x) => (x.ageBand || "adult") === r.k).length; }
      else for (const g of Q.supplies) for (const it of g.items) { const ex = L("items").find((i) => i.name === it.name && !i.example); quick.n[it.k] = ex ? Number(ex.qty) || 0 : 0; }
    }
    const row = (k, t, sub, icn) => '<div class="qrow">' + (icn ? '<span class="qic">' + ic(icn) + "</span>" : "") + '<span class="qtx"><b>' + esc(t) + "</b><small>" + esc(sub) + '</small></span><span class="qstep"><button data-act="q-" data-k="' + k + '" aria-label="Fewer ' + esc(t) + '">' + ic("minus") + '</button><output id="q-' + k + '">' + (quick.n[k] || 0) + '</output><button data-act="q+" data-k="' + k + '" aria-label="More ' + esc(t) + '">' + ic("plus") + "</button></span></div>";
    let h = backbar("#/status", kind === "household" ? "Your household" : "Your supplies");
    if (kind === "household") {
      h += '<section class="glass hero qhero"><div class="lab">Quest · +15 XP</div><h2>Who lives with you?</h2><div class="sub">Tap + for each person and pet. Names can wait: HAVYN works out water, food and medicine from the count.</div></section>';
      h += '<section class="glass panel qpanel">' + Q.household.map((r) => row(r.k, r.t, r.sub, r.k === "pet" ? "paw" : "people")).join("") + "</section>";
    } else {
      h += '<section class="glass hero qhero"><div class="lab">Quest · +10 XP</div><h2>What do you have?</h2><div class="sub">Count what\'s in the house. Home turns it into days you can last; fine-tune anything later in Supplies.</div></section>';
      for (const g of Q.supplies) h += '<div class="sec"><span class="lab">' + esc(g.g) + '</span></div><section class="glass panel qpanel">' + g.items.map((it) => row(it.k, it.t, it.sub, g.icon)).join("") + "</section>";
    }
    h += '<div class="btnrow qsave"><button class="btn" data-act="q-save">' + ic("check") + "Save</button></div>";
    return h;
  }
  function quickSave() {
    if (!quick) return;
    const t = now(), Q = C.quick;
    if (quick.kind === "household") {
      let added = 0;
      for (const r of Q.household) {
        if (r.k === "pet") { const have = L("pets").length; for (let i = have; i < (quick.n.pet || 0); i++) { S.pets.push({ id: uid(), name: "Pet " + (i + 1), species: "Pet", updated: t }); added++; } continue; }
        const have = L("people").filter((x) => (x.ageBand || "adult") === r.k).length;
        for (let i = have; i < (quick.n[r.k] || 0); i++) { S.people.push({ id: uid(), name: r.t.replace(/s$/, "").replace(/^Babie$/, "Baby") + " " + (i + 1), ageBand: r.k, updated: t }); added++; }
      }
      save(); quick = null; Snd.chime("save");
      toast(added ? "Household saved. Add names, medicines and allergies any time in Family" : "Nothing new to add");
    } else {
      for (const g of Q.supplies) for (const it of g.items) {
        const n = quick.n[it.k] || 0, ex = S.items.find((i) => !i.deleted && i.name === it.name && !i.example);
        if (ex) { if (n) { ex.qty = n; ex.updated = t; } else { Object.keys(ex).forEach((k) => { if (k !== "id") delete ex[k]; }); ex.deleted = true; ex.updated = t; } }
        else if (n) S.items.push(Object.assign({ id: uid(), category: it.category, name: it.name, qty: n, updated: t }, it.per_unit ? { per_unit: Object.assign({}, it.per_unit) } : {}));
      }
      save(); quick = null; Snd.chime("save"); toast("Supplies saved. Home shows how many days they last");
    }
    location.hash = "#/status";
  }

  /* ---------------- EMERGENCY ---------------- */
  const cardView = { id: null, step: 0, beatStep: 0, autoBeat: false, at: 0 };
  function emTop() {
    return '<div class="emtop"><a class="exit" href="#/status">EXIT</a><a class="call" href="tel:911">' + ic("phone") + "CALL 911</a></div>";
  }
  function renderEmergency() {
    const id = route.parts[1];
    if (id === "log") return renderLog();
    if (id) return renderCard(id);
    cardView.id = null; cardView.beatStep = 0;
    let h = emTop();
    const I = Inc.on();
    h += '<a class="emnear" href="#/map?k=er">' + ic("cross") + "<span><b>Nearest ER</b><small>Distance and direction, on the offline map</small></span>" + ic("chev") + "</a>";
    if (I) h += '<a class="emlogbar" href="#/emergency/log">' + ic("clock") + "<span><b>Log for responders</b><small>" + I.ev.length + (I.ev.length === 1 ? " entry" : " entries") + " since " + hm(I.ev[0].t) + "</small></span></a>";
    h += '<div class="emgrid">';
    for (const c of C.cards) h += '<a class="emtile" href="#/emergency/' + c.id + '">' + ic(c.icon) + "<span><b>" + esc(c.title) + "</b><br><small>" + esc(c.sub) + "</small></span></a>";
    h += "</div>";
    h += '<div class="emnote">' + esc(C.noSignal) + "</div>";
    h += '<p class="emsrc">Cards: ' + esc(C.gate) + ". Checked against sources " + esc(C.reviewed) + ". Training beats any app: take a CPR and Stop the Bleed class.</p>";
    return h;
  }
  function renderCard(id) {
    const c = C.cards.find((x) => x.id === id);
    if (!c) return renderEmergency();
    if (cardView.id !== id) { cardView.id = id; cardView.step = 0; cardView.at = now(); Inc.opened(c); }
    const n = c.steps.length, i = Math.min(cardView.step, n - 1), s = c.steps[i];
    cardView.beatStep = s.beat || 0;
    let h = emTop();
    const vg = Clips.hasId("c-" + c.id + "-" + i);
    h += '<div class="emhead"><span>' + esc(c.title) + "</span><span>Step " + (i + 1) + " of " + n + "</span></div>";
    h += '<div class="dots">' + c.steps.map((_, k) => "<i" + (k <= i ? ' class="on"' : "") + "></i>").join("") + "</div>";
    h += '<div class="emstep">' + esc(s.t) + '</div><div class="emdet">' + esc(s.d) + "</div>";
    if (vg) h += '<div class="emvrow"><button class="emvoice' + (PR.cardVoice === false ? "" : " on") + '" data-act="card-voice" aria-pressed="' + (PR.cardVoice !== false) + '">' + ic(PR.cardVoice === false ? "speakeroff" : "speaker") + "<span>" + (PR.cardVoice === false ? "Voice guide off" : "Voice guide on") + "</span></button>" +
      (PR.cardVoice !== false ? '<button class="emagain" data-act="card-say">' + ic("play") + "<span>Repeat</span></button>" : "") + "</div>";
    if (s.beat) {
      h += '<div class="beat" aria-hidden="true"><div><b>PUSH</b><small>' + s.beat + " / min</small></div></div>";
      h += '<div class="cprbar"><span>Time <b class="mono" id="cprtime">0:00</b> <span id="swap" class="swap hide">SWITCH</span></span>' +
        '<button data-act="beat-toggle">' + (Metro.on || cardView.autoBeat ? "Stop beat" : "Start beat") + "</button>" +
        '<button data-act="beat-sound">' + (Metro.sound ? "Sound on" : "Sound off") + "</button></div>";
    }
    if (s.call) h += '<a class="emlink" href="' + telHref(s.call.num) + '">' + ic("phone") + "Call " + esc(s.call.n) + "</a> ";
    if (s.link) h += '<a class="emlink" href="#/emergency/' + s.link + '" data-act="card-jump" data-card="' + s.link + '">Open ' + esc(C.cards.find((x) => x.id === s.link).title) + " card</a>";
    h += '<div class="emnav"><button data-act="step-prev"' + (i === 0 ? " disabled" : "") + ">BACK</button>" +
      (i < n - 1 ? '<button class="next" data-act="step-next">NEXT</button>' : '<a class="next" href="#/emergency">ALL CARDS</a>') + "</div>";
    h += logRow(c);
    if (c.note) h += '<div class="emnote">' + esc(c.note) + "</div>";
    if (c.noteLink) h += '<a class="emlink" href="#/emergency/' + c.noteLink + '" data-act="card-jump">Open ' + esc(C.cards.find((x) => x.id === c.noteLink).title) + " card</a>";
    const deep = deeperRefs("card", c.id), here = deep.filter((r) => pageHref(r[0], r[1]));
    if (deep.length) h += '<div class="emdeep"><div class="emdh">Go deeper on this phone</div>' + (here.length ? here.map((r) => '<a class="emlink" href="' + pageHref(r[0], r[1], "#/emergency/" + c.id) + '">' + ic("book") + esc(fieldDoc(r[0])) + " p. " + r[1] + ": " + esc(r[2]) + "</a>").join("") : '<div class="emdn">The manuals behind this card aren\'t on this phone yet. When this is over: Status › Download everything.</div>') + "</div>";
    h += '<div class="emsrc">' + esc(C.noSignal) + '<br><br>Source: ' + srcLine(c.sources) + "<br>Checked " + esc(c.checked || C.reviewed) + " · " + esc(C.gate) + "</div>";
    return h;
  }
  function stepTo(delta) {
    const c = C.cards.find((x) => x.id === cardView.id); if (!c) return;
    cardView.step = Math.max(0, Math.min(c.steps.length - 1, cardView.step + delta));
    const s = c.steps[cardView.step];
    if (s.beat) { cardView.autoBeat = true; Snd.ctx(); } else { Metro.stop(); }
    render();
  }

  /* ---------------- FIELD INDEX: "How do I…" → the exact page in the manuals on this phone ---------------- */
  const FIELD = () => (C.field && C.field.items) || [];
  const shelfItem = (id) => C.shelf.items.find((i) => i.id === id);
  const fieldDoc = (id) => (C.field && C.field.docs && C.field.docs[id]) || (shelfItem(id) || {}).t || id;
  // A page link that opens the reader at that page and comes back to where you were (from = a route inside HAVYN).
  function pageHref(docId, page, from) {
    const it = shelfItem(docId), have = it && shelfHave(it);
    return have ? "#/library/" + have.id + "?page=" + page + (from ? "&from=" + encodeURIComponent(from) : "") : "";
  }
  function refRow(r, from) {
    const href = pageHref(r[0], r[1], from);
    return '<a class="ref' + (href ? "" : " off") + '" href="' + (href || "#/archive?t=shelf&s=" + esc((shelfItem(r[0]) || {}).sys || "")) + '">' + ic(href ? "book" : "download") +
      '<span class="tx"><b>' + esc(fieldDoc(r[0])) + " · p. " + r[1] + "</b><small>" + esc(r[2]) + (href ? "" : " · not on this phone yet") + "</small></span></a>";
  }
  // Unique pages behind a card or playbook (the field entries that name it).
  function deeperRefs(kind, id) {
    const seen = new Set(), out = [];
    for (const f of FIELD()) if (f[kind] === id) for (const r of f.r) { const k = r[0] + ":" + r[1]; if (!seen.has(k)) { seen.add(k); out.push(r); } }
    return out;
  }
  function fieldRow(f, from) {
    const sit = /^#\/now\/([\w-]+)/.exec(from || ""), inSit = sit && (C.situations || []).find((x) => x.id === sit[1]);
    const pb = f.pb && !String(from || "").endsWith("/" + f.pb) && !(inSit && inSit.pb === f.pb) && C.playbooks.find((x) => x.id === f.pb && !x.soon);   // no link to the playbook you're in (or whose situation you're in)
    return '<div class="fi" id="' + esc(f.id) + '" data-k="' + esc(fold(f.q + " " + (f.k || "") + " " + f.r.map((r) => r[2] + " " + fieldDoc(r[0])).join(" "))) + '"><div class="fq"><b>' + esc(f.q) + "</b>" +
      (f.card ? '<a class="chip crit" href="#/emergency/' + esc(f.card) + '">Card</a>' : "") + (pb ? '<a class="chip" href="#/playbooks/' + esc(pb.id) + '">' + esc(pb.title) + "</a>" : "") + "</div>" +
      f.r.map((r) => refRow(r, from)).join("") + "</div>";
  }
  function renderField() {
    const F = C.field, sel = FIELD().find((f) => f.id === route.q.f);
    let h = backbar(sel ? "#/field" : "#/guides", "How do I…");
    const docs = Array.from(new Set(FIELD().flatMap((f) => f.r.map((r) => r[0])))), have = docs.filter((id) => { const it = shelfItem(id); return it && shelfHave(it); }).length;
    if (sel) {
      h += '<div class="list fl" style="margin-top:6px">' + fieldRow(sel, "#/field?f=" + sel.id) + "</div>" + '<div class="btnrow" style="margin-top:10px"><a class="btn ghost sm" href="#/field">Every answer</a></div>';
      return h;
    }
    h += '<section class="glass hero"><div class="lab">Field index · pages checked ' + esc(F.checked) + '</div><h2 style="margin:6px 0 4px;font-size:1.6rem">How do I…</h2><div class="sub">' + esc(F.note) + "</div>" +
      '<div class="sub mono" style="font-size:.78rem;margin-top:8px">' + FIELD().length + " answers · " + docs.length + " documents · " + have + " of " + docs.length + " on this phone</div>" +
      (have < docs.length && !PREVIEW ? '<div class="btnrow" style="margin-top:10px"><a class="btn sm" href="#/status">' + ic("download") + "Download everything</a></div>" : "") + "</section>";
    h += '<div class="zs fsearch"><input id="fq" type="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Bleeding, bleach, generator, compass…" aria-label="Filter the field index"></div>';
    for (const [g, label] of F.groups) {
      const xs = FIELD().filter((f) => f.g === g); if (!xs.length) continue;
      h += '<div class="sec" data-fg="' + g + '"><span class="lab">' + esc(label) + '</span></div><div class="list fl" data-fg="' + g + '">' + xs.map((f) => fieldRow(f, "#/field")).join("") + "</div>";
    }
    h += '<div id="fnone" class="empty hide">No answer here for that. Try Search everything: it also looks inside every PDF and archive on this phone.</div>';
    return h;
  }
  function fieldFilter(v) {
    const words = fold(v).trim().split(/\s+/).filter(Boolean); let any = false;
    document.querySelectorAll(".fi").forEach((el) => { const ok = words.every((w) => el.dataset.k.includes(w)); el.classList.toggle("hide", !ok); if (ok) any = true; });
    document.querySelectorAll("[data-fg]").forEach((el) => { const g = el.dataset.fg, list = document.querySelector('.fl[data-fg="' + g + '"]'); el.classList.toggle("hide", !!list && !list.querySelector(".fi:not(.hide)")); });
    const n = $("#fnone"); if (n) n.classList.toggle("hide", any);
  }

  /* ---------------- PLAYBOOKS ---------------- */
  function renderPlaybooks() {
    const id = route.parts[1];
    if (id) return renderPlaybook(id);
    return renderGuides();
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
    let h = backbar("#/guides", "Playbook");
    h += '<section class="glass hero"><div class="lab">Playbook</div><h2 style="margin:6px 0 4px;font-size:1.6rem">' + esc(p.title) + '</h2><div class="sub">' + esc(p.trigger) + "</div></section>";
    h += '<section class="panel" style="border:2px solid var(--crit);border-radius:var(--r);background:rgba(255,77,94,.06)"><h3 style="color:var(--crit)">' + esc(p.ruleTitle || "Hard rule: leave now if") + "</h3>" +
      p.leave.map((l) => '<div class="kv"><span style="color:var(--ink)">' + esc(l) + "</span></div>").join("") +
      (p.ruleTitle ? "" : S.plan.leaveTo ? '<div class="kv"><span>Destination</span><span>' + esc(S.plan.leaveTo) + "</span></div>" : '<div class="kv"><span>Destination</span><a href="#/family/plan">Set it now</a></div>') + "</section>";
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
          (it.href ? '<span style="display:block;margin-top:8px"><a class="btn ghost sm" href="' + esc(it.href) + '">Open</a></span>' : "") +
          "</span></label>";
      });
      h += "</section>";
    });
    const more = FIELD().filter((f) => f.pb === p.id);
    if (more.length) h += '<section class="glass panel"><h3>Read more on this phone</h3><div class="list fl">' + more.map((f) => fieldRow(f, "#/playbooks/" + p.id)).join("") + "</div></section>";
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
    h += '<a class="quickbtn" href="#/quick/household">' + ic("people") + "<span><b>" + (L("people").length ? "Add people fast" : "Set up your household in a few taps") + "</b><small>Counts first, names later</small></span>" + ic("chev") + "</a>";
    const pl = S.plan || {};
    h += '<section class="glass panel"><h3>Plan</h3>' +
      '<div class="kv"><span>Out-of-area contact</span><span>' + (pl.contactName ? esc(pl.contactName) + (pl.contactPhone ? ' · <a href="tel:' + esc(pl.contactPhone.replace(/[^0-9+]/g, "")) + '">' + esc(pl.contactPhone) + "</a>" : "") : '<span style="color:var(--mute)">not set</span>') + "</span></div>" +
      '<div class="kv"><span>Meet 1 · near home</span><span>' + (esc(pl.rally1) || "—") + "</span></div>" +
      '<div class="kv"><span>Meet 2 · neighborhood</span><span>' + (esc(pl.rally2) || "—") + "</span></div>" +
      '<div class="kv"><span>Meet 3 · out of area</span><span>' + (esc(pl.rally3) || "—") + "</span></div>" +
      '<div class="kv"><span>If heat forces us out</span><span>' + (esc(pl.leaveTo) || "—") + "</span></div>" +
      '<div class="kv"><span>Check-ins</span><span class="mono">' + esc((S.settings.checkins || []).join(" · ")) + "</span></div>" +
      '<div class="btnrow" style="margin-top:10px"><a class="btn ghost" href="#/family/plan">Edit plan and shutoffs</a><a class="btn ghost" href="#/comms">Comms</a></div></section>';
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
      "<h3>Radio channels</h3>" + '<div class="two">' + fld("gmrsCh", "GMRS channel", pl.gmrsCh, { ph: "e.g. 16" }) + fld("meshCh", "Meshtastic channel", pl.meshCh, { ph: "Family channel name" }) + "</div>" +
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
    let h = topbar("Supplies") + segNav("inv");
    h += '<a class="quickbtn" href="#/quick/supplies">' + ic("box") + "<span><b>Quick count</b><small>Tap how many cases, jugs, cans and batteries you have</small></span>" + ic("chev") + "</a>";
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

  /* ---------------- v1.1 helpers ---------------- */
  const money = (v) => "$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const mb = (b) => (b < 1048576 ? Math.max(1, Math.round(b / 1024)) + " KB" : (b / 1048576).toFixed(b < 10485760 ? 1 : 0) + " MB");
  const shortDate = (t) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const kv = (k, v, raw) => '<div class="kv"><span>' + esc(k) + "</span><span>" + (raw ? v : esc(v)) + "</span></div>";
  const NOTSET = '<span style="color:var(--mute)">not set</span>';
  const li = (href, icon, title, sub, rt) => '<a class="li" href="' + href + '"><span class="ic">' + ic(icon) + '</span><span class="tx"><b>' + esc(title) + "</b><small>" + esc(sub) + "</small></span>" + (rt ? '<span class="rt">' + rt + "</span>" : "") + ic("chev") + "</a>";
  const srcRefs = (keys) => srcLine(keys.filter((k) => C.refs[k]).map((k) => C.refs[k]));
  const segNav = (on) => '<div class="seg wide" style="margin:0 0 12px"><a href="#/supplies"' + (on === "inv" ? ' class="on"' : "") + '>INVENTORY</a><a href="#/buy"' + (on === "buy" ? ' class="on"' : "") + ">BUY LIST</a></div>";
  const recOf = (coll, id) => S[coll].find((r) => r.id === id && !r.deleted);

  /* ---------------- GUIDES ---------------- */
  function renderGuides() {
    let h = topbar("Guides");
    h += '<div class="sec" style="margin-top:4px"><span class="lab">Playbooks</span></div><div class="list">';
    for (const p of C.playbooks) {
      if (p.soon) h += '<div class="li soon"><span class="ic">' + ic(p.icon) + '</span><span class="tx"><b>' + esc(p.title) + "</b><small>" + esc(p.sub) + "</small></span></div>";
      else { const done = countChecks(p); h += li("#/playbooks/" + p.id, p.icon, p.title, p.sub, done.d + "/" + done.n); }
    }
    h += '</div><div class="sec"><span class="lab">Plan</span></div><div class="list">' +
      li("#/plan", "flag", "The plan", "Phases, power, Phoenix heat rules, upkeep") +
      li("#/comms", "radio", "Comms", "Who to text, rally points, check-ins, radios") +
      li("#/missions", "check", "Missions", "Step by step, today through May") +
      li("#/binder", "card", "Printable binder", "Plan, numbers, medicines and every card on paper") +
      '</div><div class="sec"><span class="lab">Library</span></div><div class="list">' +
      li("#/field", "book", "How do I…", FIELD().length + " answers, each opening the exact page in the manuals on this phone") +
      li("#/welcome", "play", "Welcome tour", "One minute: what's where, and what to tap in an emergency") +
      li("#/library", "globe", "Offline library", libSummary() || "Encyclopedias, PDFs, video and audio, all offline") +
      li("#/search", "search", "Search everything", "One box: cards, plan, PDFs and every archive") +
      li("#/archive?t=shelf", "book", "Reference shelf", "Real manuals by system: medicine, water, power, tools, building") +
      li("#/archive?t=phone", "download", "Get more", "Wikipedia, WikiMed, apps, the vault drive and the home library") + "</div>";
    h += '<p class="empty" style="margin-top:14px">Each playbook: what to do in the first 10 minutes, hour, day, and the hard rule for leaving. Tick items as you go; reset after the event.</p>';
    return h;
  }

  /* ---------------- MISSIONS ---------------- */
  function taskRow(def, done, phase) {
    return '<label class="chk' + (done ? " done" : "") + '"><input type="checkbox" data-task="' + esc(def.id) + '"' + (done ? " checked" : "") + '><span class="tx"><b>' + esc(def.t) + "</b>" +
      (phase ? "<small>" + esc(phase.label) + (phase.when ? " · " + esc(phase.when) : "") + "</small>" : def.d ? "<small>" + esc(def.d) + "</small>" : "") +
      (def.go && !done ? '<span style="display:block;margin-top:8px"><a class="btn ghost sm" href="' + esc(def.go) + '">Open</a></span>' : "") +
      (def.custom ? '<span style="display:block;margin-top:8px"><button type="button" class="btn ghost sm danger" data-act="task-del" data-id="' + esc(def.id) + '">Remove</button></span>' : "") +
      "</span></label>";
  }
  function missionsPanel(t) {
    const ms = E.missions(C.missions, S, t);
    return '<section class="glass panel"><div class="ph"><h3>Missions</h3><a class="rt" href="#/missions">' + ms.d + " of " + ms.n + " done" + ic("chev") + "</a></div>" +
      '<div class="bar" style="margin:0 0 6px"><i style="width:' + (ms.n ? Math.round((ms.d / ms.n) * 100) : 0) + '%"></i></div>' +
      (ms.next.length ? ms.next.map((x) => taskRow(x.def, false, x.phase)).join("") : '<div class="empty">Every mission is done. Keep up the upkeep.</div>') +
      '<div class="btnrow" style="margin-top:8px"><a class="btn ghost sm" href="#/missions">All missions</a></div></section>';
  }
  function renderMissions() {
    const t = now(), ms = E.missions(C.missions, S, t);
    let h = backbar("#/status", "Missions");
    h += '<section class="glass hero"><div class="lab">Missions</div><div class="num"><span class="big">' + ms.d + '</span><span class="unit">OF ' + ms.n + " DONE</span></div>" +
      '<div class="bar" style="margin:10px 0 8px"><i style="width:' + (ms.n ? Math.round((ms.d / ms.n) * 100) : 0) + '%"></i></div><div class="sub">' + esc(C.plan.line) + "</div></section>";
    for (const p of ms.phases) {
      h += '<section class="glass panel"><div class="ph"><h3>' + esc(p.ph.label) + (p.ph.when ? ' <span class="when">· ' + esc(p.ph.when) + "</span>" : "") + '</h3><span class="rt">' + p.d + "/" + p.n + "</span></div>" +
        p.tasks.map((x) => taskRow(x.def, x.done)).join("") +
        '<div class="gate' + (p.complete ? " done" : "") + '">' + ic(p.complete ? "check" : "flag") + "<span><b>Done when:</b> " + esc(p.ph.gate) + (p.ph.gateD ? "<small>" + esc(p.ph.gateD) + "</small>" : "") + "</span></div></section>";
    }
    h += '<form class="glass panel" data-form="task"><h3>Add a mission</h3>' + fld("t", "What needs doing", "", { ph: "Buy a second can opener" }) +
      fld("phase", "When", "week", { type: "select", opts: C.missions.phases.map((p) => [p.id, p.label + (p.when ? " · " + p.when : "")]) }) +
      '<div class="btnrow"><button class="btn" type="submit">Add</button></div></form>';
    h += '<div class="sec"><span class="lab">Upkeep</span><span class="lab">' + (ms.due.length ? ms.due.length + " due" : "") + "</span></div>";
    for (const u of ms.upkeep) {
      const chip = u.state === "due" ? '<span class="chip warn">DUE</span>' : u.state === "ok" ? '<span class="chip ok">OK</span>' : '<span class="chip">NOT STARTED</span>';
      const when = u.state === "ok" ? "Done " + shortDate(u.last) + " · next " + shortDate(u.dueAt) : u.state === "due" ? (u.last ? "Last done " + shortDate(u.last) : "Due now") : u.dueAt ? "Starts " + shortDate(u.dueAt) : "Start once your gear arrives";
      const today = u.last && ymd(u.last) === ymd(t);
      h += '<section class="glass panel up"><div class="ph"><h3>' + esc(u.def.t) + ' <span class="when">· ' + esc(u.def.time) + "</span></h3>" + chip + "</div><p>" + esc(u.def.d) + '</p><div class="upk"><small>' + esc(when) + "</small>" +
        (today ? '<button class="btn ghost sm" data-act="up-undo" data-id="' + esc(u.def.id) + '">Undo</button>' : '<button class="btn sm" data-act="up-done" data-id="' + esc(u.def.id) + '">Mark done</button>') + "</div></section>";
    }
    h += '<p class="empty" style="font-size:.85rem">Ticks travel in Memory Cards, so every phone sees the same progress.</p>';
    return h;
  }
  function setTask(id, patch) { upsert("tasks", Object.assign({ id }, recOf("tasks", id) || {}, patch)); }

  /* ---------------- BUY LIST ---------------- */
  const BUYST = { buy: ["TO BUY", ""], ordered: ["ORDERED", "cyan"], have: ["HAVE", "ok"] };
  const BUYF = [["all", "All"], ["floor", "Safety floor"], ["week", "This week"], ["bf", "Black Friday"], ["d90", "90 days"], ["opt", "Optional"]];
  function hhLine(hh) {
    return hh.assumed ? "Sized for 4 people (assumed). Add your household on Family." : "Sized for " + hh.P + (hh.P === 1 ? " person" : " people") + (hh.pets ? " and " + hh.pets + (hh.pets === 1 ? " pet" : " pets") : "") + ".";
  }
  function dateChips(t) {
    return '<div class="dates">' + C.buy.dates.map((d) => {
      const at = Date.parse(d.d + "T00:00:00"), days = Math.ceil((at - t) / DAY);
      const rel = days > 1 ? "in " + days + " days" : days === 1 ? "tomorrow" : days === 0 ? "today" : "passed";
      return '<span class="chip' + (days >= 0 && days <= 14 ? " warn" : "") + '">' + esc(d.n) + " · " + shortDate(at) + " · " + rel + "</span>";
    }).join("") + "</div>";
  }
  function buyLine(r, floor) {
    const it = r.item, st = BUYST[r.status];
    const q = floor ? it.floor : r.qty;
    const line = q !== null && q !== undefined && typeof it.price === "number" ? q * it.price : null;
    const sub = (q !== null && q !== undefined ? "×" + fmtN(q, 2) + (floor && r.qty !== null && r.qty !== it.floor ? " of " + fmtN(r.qty, 2) : "") + " · " : "") + it.pick;
    return '<a class="li' + (r.status === "have" ? " got" : "") + '" href="#/buy/' + esc(it.id) + '"><span class="ic">' + ic(r.status === "have" ? "check" : r.status === "ordered" ? "cart" : "box") + '</span><span class="tx"><b>' + esc(it.n) + "</b><small>" + esc(sub) + '</small></span><span class="rt">' + (line !== null ? money(line) : "—") + '<br><span class="chip ' + st[1] + '">' + st[0] + "</span></span></a>";
  }
  function renderBuy() {
    if (route.parts[1]) return renderBuyItem(route.parts[1]);
    const t = now(), bp = E.buyPlan(S, C.buy.items), tot = E.buyTotals(bp.rows), f = BUYF.some((x) => x[0] === route.q.f) ? route.q.f : "all", floor = f === "floor";
    let h = topbar("Supplies") + segNav("buy");
    if (floor) {
      const rows = bp.rows.filter((r) => r.item.floor), got = rows.filter((r) => r.status !== "buy").length;
      h += '<section class="glass hero"><div class="lab">Safety floor</div><div class="num"><span class="big" style="font-size:2.8rem">' + money(E.floorTotal(C.buy.items)) + '</span><span class="unit">' + got + " OF " + rows.length + " ORDERED</span></div>" +
        '<div class="sub">If money is tight, these buy the most protection first. Quantities here are the floor, not the full tier.</div></section>';
    } else {
      const a = tot.all;
      h += '<section class="glass hero"><div class="lab">Still to buy</div><div class="num"><span class="big" style="font-size:2.8rem">' + money(a.buy) + "</span></div>" +
        '<div class="sub">Ordered ' + money(a.ordered) + " · have " + money(a.have) + " · plan " + money(a.est) + "<br>" + esc(hhLine(bp.hh)) + "</div></section>";
    }
    h += dateChips(t);
    h += '<div class="filters">' + BUYF.map(([k, l]) => '<a href="#/buy' + (k === "all" ? "" : "?f=" + k) + '"><span class="chip' + (f === k ? " on" : "") + '">' + esc(l) + "</span></a>").join("") + "</div>";
    for (const tier of C.buy.tiers) {
      const rows = bp.rows.filter((r) => r.item.tier === tier.id && (f === "all" || f === tier.id || (floor && r.item.floor)));
      if (!rows.length) continue;
      const x = tot[tier.id] || { est: 0, buy: 0 };
      h += '<div class="sec"><span class="lab">' + esc(tier.label) + '</span><span class="lab">' + (floor ? "" : money(x.est) + (x.buy !== x.est ? " · " + money(x.buy) + " to buy" : "")) + '</span></div><div class="list">' + rows.map((r) => buyLine(r, floor)).join("") + "</div>";
    }
    h += '<section class="glass panel" style="margin-top:14px"><h3>Deal rules</h3>' + C.buy.rules.map((r, i) => '<div class="step"><span class="n">' + (i + 1) + "</span><span><small style=\"margin:0\">" + esc(r) + "</small></span></div>").join("") + "</section>";
    h += '<p class="empty" style="font-size:.85rem">Prices checked ' + esc(C.buy.checked) + "; most are estimates. Store links need internet.</p>";
    return h;
  }
  function qtyBasis(it, r, hh) {
    if (r.override) return "Set by you. Automatic: " + (r.auto === null ? "none" : "×" + fmtN(r.auto, 2)) + ".";
    const who = hh.assumed ? "4 people (assumed)" : hh.P + (hh.P === 1 ? " person" : " people");
    const gal = 14 * (2 * hh.P + hh.petGal);
    const m = { drum: "14 days at 2 gal per person a day for " + who + (hh.petGal ? " plus pets" : "") + ": " + fmtN(gal, 0) + " gal", brick: "3 days on the move at 1 gal per person a day for " + who, P: "One per person, " + who, "P+1": "One per person plus a base, " + who, "P/2": "Pairs, one radio per person, " + who, AT: "Each teen and adult" + (hh.assumed ? ", 4 assumed" : "") };
    return typeof it.q === "string" && m[it.q] ? esc(m[it.q]) + "." : it.q === null ? "Amount is your call." : "";
  }
  function renderBuyItem(id) {
    const bp = E.buyPlan(S, C.buy.items), r = bp.rows.find((x) => x.item.id === id);
    if (!r) return renderBuy();
    const it = r.item, tier = C.buy.tiers.find((x) => x.id === it.tier);
    let h = backbar("#/buy?f=" + it.tier, tier ? tier.label : "Buy list");
    h += '<section class="glass hero"><div class="lab">' + esc(it.n) + '</div><h2 style="margin:6px 0 4px;font-size:1.25rem;font-weight:650">' + esc(it.pick) + "</h2>" +
      '<div class="num"><span class="big" style="font-size:2.6rem">' + (r.qty !== null ? "×" + fmtN(r.qty, 2) : "—") + '</span><span class="unit">' + (r.line !== null ? money(r.line) : "") + "</span></div>" +
      '<div class="sub">' + qtyBasis(it, r, bp.hh) + "</div></section>";
    let add = "";
    if (r.status === "have" && it.add) {
      if (it.add.solarW) {
        const w = it.add.solarW * (r.qty || 1);
        add = num(S.settings.solarW) >= w ? '<p class="note">Counted on Status: solar is set to ' + esc(S.settings.solarW) + " W.</p>" : '<div class="btnrow" style="margin-top:12px"><button class="btn" data-act="buy-solar" data-id="' + esc(it.id) + '">Count ' + w + " W of solar on Status</button></div>";
      } else {
        const linked = r.rec && r.rec.itemId && byId("items", r.rec.itemId);
        add = linked ? '<div class="btnrow" style="margin-top:12px"><a class="btn ghost" href="#/supplies/item/' + esc(linked.id) + '">In Supplies · open</a></div>' : '<div class="btnrow" style="margin-top:12px"><button class="btn" data-act="buy-add" data-id="' + esc(it.id) + '">Add to Supplies</button></div><p class="note">Adds it to your inventory so Status counts it.</p>';
      }
    }
    h += '<section class="glass panel"><h3>Status</h3><div class="seg wide">' + ["buy", "ordered", "have"].map((s) => '<button data-act="buy-status" data-id="' + esc(it.id) + '" data-v="' + s + '"' + (r.status === s ? ' class="on"' : "") + ">" + BUYST[s][0] + "</button>").join("") + "</div>" + add + "</section>";
    h += '<section class="glass panel"><h3>Details</h3>' + kv("Price each", typeof it.price === "number" ? money(it.price) + (it.note === "Estimate" ? " (estimate)" : "") : "—") + kv("Deal target", it.target ? money(it.target) : "—") +
      (it.note && it.note !== "Estimate" ? kv("Price seen", it.note) : "") + kv("Safety floor", it.floor ? "×" + it.floor : "—") +
      '<p class="note">' + esc(it.why) + "</p>" + (it.u ? '<div class="btnrow" style="margin-top:12px"><a class="btn ghost" href="' + esc(it.u) + '" target="_blank" rel="noopener">' + esc(it.uName || "Search Amazon") + "</a></div>" : "") + "</section>";
    if (r.auto !== null || r.override) h += '<form class="glass panel" data-form="buyqty" data-id="' + esc(it.id) + '"><h3>Quantity</h3><div class="two">' + fld("qty", "How many", r.override ? r.qty : "", { type: "num", ph: r.auto !== null ? String(r.auto) : "" }) +
      '<div style="display:flex;align-items:flex-end;margin-bottom:12px"><button class="btn wide" type="submit">Set</button></div></div>' +
      (r.override ? '<button class="btn ghost sm" type="button" data-act="buy-auto" data-id="' + esc(it.id) + '">Back to automatic' + (r.auto !== null ? " (×" + fmtN(r.auto, 2) + ")" : "") + "</button>" : '<p class="empty" style="font-size:.85rem;margin:0">Leave it to follow the household.</p>') + "</form>";
    return h;
  }
  function setBuy(id, patch) { upsert("buys", Object.assign({ id }, recOf("buys", id) || {}, patch)); }
  function bfAlert(t) {
    const start = Date.parse(C.buy.dates[0].d + "T00:00:00"), end = Date.parse(C.buy.dates[1].d + "T23:59:59");
    if (!(t < end && start - t < 14 * DAY)) return "";
    const rows = E.buyPlan(S, C.buy.items).rows.filter((r) => r.item.tier === "bf" && r.status === "buy");
    if (!rows.length) return "";
    const days = Math.ceil((start - t) / DAY), sum = rows.reduce((a, r) => a + (r.line || 0), 0);
    return '<a class="alert" href="#/buy?f=bf"><span class="dot"></span><span><b>' + (t >= start ? "Black Friday is on" : "Black Friday in " + days + (days === 1 ? " day" : " days")) + "</b><small>" + rows.length + " items still to buy · " + money(sum) + "</small></span></a>";
  }

  /* ---------------- PLAN ---------------- */
  function renderPlan() {
    const t = now(), tot = E.buyTotals(E.buyPlan(S, C.buy.items).rows), ms = E.missions(C.missions, S, t), pl = S.plan || {};
    let h = backbar("#/guides", "The plan");
    h += '<section class="glass hero"><div class="lab">The plan</div><h2 style="margin:6px 0 4px;font-size:1.45rem;line-height:1.2">' + esc(C.plan.line) + '</h2><div class="sub">Missions ' + ms.d + " of " + ms.n + ' done · <a href="#/missions">open</a></div></section>';
    h += '<section class="glass panel"><h3>Phases</h3>' + C.plan.stages.map((s, i) => {
      const title = s.id === "week" ? "This week, " + money(E.floorTotal(C.buy.items)) + " minimum (" + money(tot.week ? tot.week.est : 0) + " for the full tier)" : s.t;
      return '<div class="step"><span class="n">' + (i + 1) + "</span><span><b>" + esc(title) + "</b><small>" + esc(s.d) + "</small></span></div>";
    }).join("") + '<div class="btnrow" style="margin-top:10px"><a class="btn ghost sm" href="#/missions">Missions</a><a class="btn ghost sm" href="#/buy">Buy list</a></div></section>';
    h += '<section class="glass panel"><h3>Our plan</h3>' +
      kv("Out-of-area contact", pl.contactName ? esc(pl.contactName) + (pl.contactPhone ? " · " + esc(pl.contactPhone) : "") : NOTSET, true) +
      kv("Meeting places", [pl.rally1, pl.rally2, pl.rally3].filter(Boolean).map(esc).join(" · ") || NOTSET, true) +
      kv("If heat forces us out", pl.leaveTo ? esc(pl.leaveTo) : NOTSET, true) + kv("Check-ins", (S.settings.checkins || []).join(" · ") || "—") +
      '<div class="btnrow" style="margin-top:10px"><a class="btn ghost sm" href="#/family/plan">Edit</a><a class="btn ghost sm" href="#/comms">Comms</a></div></section>';
    h += '<section class="glass panel"><h3>Power</h3>' + C.plan.power.map((p) => '<div class="blk"><b>' + esc(p.n) + "</b><small>" + esc(p.cap) + "</small><span>" + esc(p.runs) + "</span></div>").join("") + '<p class="note">' + esc(C.plan.powerRule) + "</p></section>";
    h += '<section class="glass panel"><h3>Phoenix heat rules</h3>' + C.plan.heat.map((r, i) => '<div class="step"><span class="n">' + (i + 1) + "</span><span><b>" + esc(r.t) + "</b><small>" + esc(r.d) + "</small></span></div>").join("") +
      '<div class="btnrow" style="margin-top:10px"><a class="btn ghost sm" href="#/playbooks/heat">Heat playbook</a></div></section>';
    h += '<section class="glass panel"><h3>Upkeep</h3>' + ms.upkeep.map((u) => kv(u.def.t + " · " + u.def.time, u.state === "due" ? '<span class="chip warn">DUE</span>' : u.state === "ok" ? "next " + shortDate(u.dueAt) : '<span style="color:var(--mute)">not started</span>', true)).join("") +
      '<div class="btnrow" style="margin-top:10px"><a class="btn ghost sm" href="#/missions">Open upkeep</a></div></section>';
    h += '<p class="empty" style="font-size:.85rem">Sources: ' + srcRefs(["cdcoa", "cdcab", "cdcpo"]) + ". Power figures are estimates from the plan.</p>";
    return h;
  }

  /* ---------------- COMMS ---------------- */
  function renderComms() {
    const t = now(), pl = S.plan || {}, nc = E.nextCheckin(S.settings.checkins, t);
    const ph = (pl.contactPhone || "").replace(/[^0-9+]/g, "");
    let h = backbar("#/guides", "Comms");
    h += '<section class="glass hero"><div class="lab">Out-of-area contact</div>' +
      (pl.contactName ? '<h2 style="margin:6px 0 2px;font-size:1.4rem">' + esc(pl.contactName) + "</h2>" + (pl.contactPhone ? '<div class="sub mono">' + esc(pl.contactPhone) + "</div>" : "") : '<div class="sub" style="margin-top:6px">Not set yet. <a href="#/family/plan">Add one</a>: everyone texts them "OK + location".</div>') +
      (ph ? '<div class="btnrow" style="margin-top:12px"><a class="btn" href="sms:' + esc(ph) + "&body=" + encodeURIComponent("OK. I'm at ") + '">Text "OK"</a><a class="btn ghost" href="tel:' + esc(ph) + '">Call</a></div>' : "") + "</section>";
    h += '<div class="btnrow" style="margin:12px 0"><a class="btn red" href="tel:911">' + ic("phone") + 'Call 911</a><a class="btn ghost" href="sms:911">Text 911</a></div>';
    h += '<section class="glass panel"><h3>Check-ins</h3>' + (nc ? '<div class="mono" style="font-size:1.6rem;margin:2px 0">' + nc.at + '</div><div style="color:var(--ink2);margin-bottom:6px" data-tick="checkin">in ' + Math.floor(nc.inMin / 60) + "h " + (nc.inMin % 60) + "m</div>" : '<div class="empty">Set times in the family plan.</div>') +
      kv("Windows", (S.settings.checkins || []).join(" · ") || "—") + kv("GMRS channel", pl.gmrsCh ? esc(pl.gmrsCh) : NOTSET, true) + kv("Meshtastic channel", pl.meshCh ? esc(pl.meshCh) : NOTSET, true) +
      '<p class="note">' + esc(C.comms.rules[1].d) + "</p></section>";
    h += '<section class="glass panel"><h3>Numbers</h3><div class="list">' + C.numbers.filter((x) => x.num !== "911").map((x) => '<a class="li" href="' + telHref(x.num) + '"><span class="ic">' + ic("phone") + '</span><span class="tx"><b>' + esc(x.n) + "</b><small>" + esc(x.d) + '</small></span><span class="rt" style="font-size:.8rem">' + esc(x.num) + "</span></a>").join("") + "</div></section>";
    h += '<section class="glass panel"><h3>Rally points</h3>' + [["1 · Near home", pl.rally1], ["2 · Neighborhood", pl.rally2], ["3 · Out of area", pl.rally3], ["Heat destination", pl.leaveTo]].map(([k, v]) => kv(k, v ? esc(v) + ' · <a href="' + esc(mapsHref(v)) + '">Map</a>' : NOTSET, true)).join("") +
      '<p class="note">Map opens Apple Maps. Download Phoenix in Apple Maps first so it works with no signal (Maps → your picture → Offline Maps).</p>' +
      '<div class="btnrow" style="margin-top:10px"><a class="btn ghost sm" href="#/family/plan">Edit plan and channels</a></div></section>';
    h += '<div class="sec"><span class="lab">The ladder · try in this order</span></div>';
    C.comms.ladder.forEach((r, i) => {
      h += '<section class="glass panel"><h3>' + (i + 1) + " · " + esc(r.rung) + '</h3><b class="big2">' + esc(r.t) + "</b>" + kv("Works when", r.when) + kv("Range", r.range) + '<p class="note">' + esc(r.d) + "</p></section>";
    });
    h += '<section class="glass panel"><h3>Rules</h3>' + C.comms.rules.filter((r, i) => i !== 1).map((r) => '<div class="blk"><b>' + esc(r.t) + "</b><span>" + esc(r.d) + "</span></div>").join("") + "</section>";
    h += '<p class="empty" style="font-size:.85rem">Sources: ' + srcRefs(["fcc", "text911", "gmrs", "phxcontacts", "srp", "srpc", "swgas", "phxwater", "phxpd", "applemaps"]) + ". Numbers checked 2026-11-14. Ranges are estimates.</p>";
    return h;
  }

  /* ---------------- LIBRARY: archives (ZIM), PDFs, video and audio, all stored on this phone ---------------- */
  let LIB = [];
  async function saveLib() { await Store.set("lib", LIB); }
  const typeOf = (x) => (x && x.type) || "pdf";
  const KINDS = [["zim", "globe", "Encyclopedias and archives"], ["pdf", "file", "Documents"], ["video", "film", "Video"], ["audio", "music", "Audio"]];
  const KEY = { zim: "zim:", pdf: "pdf:", video: "media:", audio: "media:" };
  // Apple shows storage in decimal units, so the library does too.
  const sz = (b) => { b = b || 0; return b >= 1e9 ? (b / 1e9).toFixed(b >= 1e11 ? 0 : 1) + " GB" : b >= 1e6 ? Math.round(b / 1e6) + " MB" : Math.max(1, Math.round(b / 1e3)) + " KB"; };
  const clock = (s) => { s = Math.max(0, Math.floor(s || 0)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(x).padStart(2, "0"); };
  const LANGS = { eng: "English", en: "English", spa: "Español", es: "Español", fra: "Français", fr: "Français", deu: "Deutsch", de: "Deutsch", por: "Português", pt: "Português", ita: "Italiano", it: "Italiano", zho: "中文", zh: "中文", ara: "العربية", ar: "العربية", rus: "Русский", ru: "Русский", hin: "हिन्दी", hi: "हिन्दी", vie: "Tiếng Việt", tgl: "Tagalog", kor: "한국어", jpn: "日本語", bel: "Беларуская", mul: "Multilingual" };
  const langName = (c) => String(c || "").split(",").map((x) => LANGS[x.trim()] || x.trim().toUpperCase()).filter(Boolean).join(", ");
  const zHref = (id, p) => "#/library/" + encodeURIComponent(id) + "/read?p=" + encodeURIComponent(p || "");
  const dec = (s) => { try { return decodeURIComponent(s); } catch (e) { return s; } };
  function libCounts() { const c = { zim: 0, pdf: 0, video: 0, audio: 0 }; for (const x of LIB) c[typeOf(x)] = (c[typeOf(x)] || 0) + 1; return c; }
  function libSummary() {
    const c = libCounts(), parts = [];
    if (c.zim) parts.push(c.zim + (c.zim === 1 ? " archive" : " archives"));
    if (c.pdf) parts.push(c.pdf + " PDF" + (c.pdf === 1 ? "" : "s"));
    if (c.video) parts.push(c.video + " video" + (c.video === 1 ? "" : "s"));
    if (c.audio) parts.push(c.audio + " audio");
    return parts.length ? parts.join(" · ") + " · " + sz(LIB.reduce((a, x) => a + (x.size || 0), 0)) : "";
  }
  function libRow(x) {
    const t = typeOf(x), icon = t === "zim" ? "globe" : t === "video" ? "film" : t === "audio" ? "music" : "file";
    const sub = t === "zim" ? [x.articles ? fmtN(x.articles) + (x.articles === 1 ? " article" : " articles") : "", sz(x.size), x.date].filter(Boolean).join(" · ")
      : t === "pdf" ? [sz(x.size), x.pages ? x.pages + " pages" : "", x.lastPage > 1 ? "at p. " + x.lastPage : "", x.indexed ? "searchable" : ""].filter(Boolean).join(" · ")
      : [sz(x.size), x.dur ? clock(x.dur) : "", x.pos > 5 ? "at " + clock(x.pos) : ""].filter(Boolean).join(" · ");
    return '<a class="li" href="#/library/' + esc(x.id) + '"><span class="ic">' + (t === "zim" && x.fav ? '<img class="fav" alt="" src="' + esc(x.fav) + '">' : ic(icon)) + '</span><span class="tx"><b>' + esc(x.name) + "</b><small>" + esc(sub) + "</small></span>" + ic("chev") + "</a>";
  }
  function renderLibrary() {
    const id = route.parts[1];
    if (id) {
      const x = LIB.find((d) => d.id === id);
      if (!x) { route.parts = ["library"]; return renderLibrary(); }
      const t = typeOf(x);
      if (t === "zim") return route.parts[2] === "read" ? renderZimRead(x) : renderZimHome(x);
      if (t === "video" || t === "audio") return renderMedia(x);
      return renderReader(id);
    }
    const total = LIB.reduce((a, x) => a + (x.size || 0), 0);
    let h = backbar("#/guides", "Library");
    h += '<section class="glass hero"><div class="lab">Offline library · this phone</div><div class="num"><span class="big" style="font-size:2.8rem">' + LIB.length + '</span><span class="unit">' + (LIB.length === 1 ? "ITEM" : "ITEMS") + (LIB.length ? " · " + sz(total) : "") + "</span></div>" +
      '<div class="sub">' + esc(C.library.note) + '</div><div class="sub mono" id="libq" style="font-size:.75rem;margin-top:6px"></div>' +
      '<div class="btnrow" style="margin-top:12px"><label class="btn">' + ic("plus") + 'Add files<input class="sr" type="file" multiple id="libfile"></label><a class="btn ghost" href="#/archive">' + ic("download") + "Get more</a></div>" +
      (hubUrl() ? '<div class="btnrow" style="margin-top:8px"><a class="btn ghost" href="' + esc(hubUrl()) + '" target="_blank" rel="noopener">' + ic("server") + "Home library (full-text search)</a></div>" : "") +
      '<div class="bar hide" id="libbar" style="margin-top:12px"><i class="indet"></i></div><div id="libmsg" class="empty" style="min-height:1.3em"></div></section>';
    h += '<div class="list"><a class="li" href="#/search"><span class="ic">' + ic("search") + '</span><span class="tx"><b>Search everything</b><small>Cards, playbooks, your plan, PDFs and every archive</small></span>' + ic("chev") + "</a>" +
      '<a class="li" href="#/archive?t=shelf"><span class="ic">' + ic("book") + '</span><span class="tx"><b>Reference shelf</b><small>' + (C.shelf ? C.shelf.items.length + " manuals and guides in " + C.shelf.systems.length + " systems: medicine, water, power, tools…" : "") + "</small></span>" + ic("chev") + "</a></div>";
    for (const [k, , label] of KINDS) {
      const xs = LIB.filter((x) => typeOf(x) === k).sort((a, b) => (b.opened || b.added) - (a.opened || a.added));
      if (!xs.length) continue;
      h += '<div class="sec"><span class="lab">' + esc(label) + '</span><span class="mono" style="color:var(--mute);font-size:.8rem">' + xs.length + " · " + sz(xs.reduce((a, x) => a + (x.size || 0), 0)) + '</span></div><div class="list">' + xs.map(libRow).join("") + "</div>";
    }
    if (!LIB.length) h += '<div class="empty" style="margin-top:12px">Nothing here yet. Tap Get more for the recommended archives, or Add files to bring in a ZIM archive, PDF, video or audio file from the Files app.</div>';
    h += '<section class="glass panel" style="margin-top:14px"><h3>How files get here</h3>' + C.library.how.map((s) => '<div class="blk"><b>' + esc(s.t) + "</b><span>" + esc(s.d) + "</span></div>").join("") + "</section>";
    return h;
  }
  function renderReader(id) {
    const x = LIB.find((d) => d.id === id);
    if (!x) { route.parts = ["library"]; return renderLibrary(); }
    const from = /^#\/[\w\-/?=&.%]{1,200}$/.test(route.q.from || "") ? route.q.from : "#/library";
    let h = '<div class="rhead"><header class="top"><a class="ibtn" href="' + esc(from) + '" aria-label="Back">' + ic("back") + '</a><span class="rtitle">' + esc(x.name) + '</span><span class="mono rpg" id="pgnum">' + (x.lastPage || 1) + " / " + (x.pages || "…") + "</span></header>" +
      '<div class="rbar"><button class="ibtn" data-act="pdf-toc" aria-label="Contents">' + ic("toc") + '</button><button class="ibtn" data-act="pdf-find" aria-label="Find text">' + ic("search") + "</button>" +
      '<form data-form="pdfgo" class="rgo"><input name="p" inputmode="numeric" placeholder="Page" aria-label="Go to page" autocomplete="off"><button class="btn sm" type="submit">Go</button></form>' +
      '<button class="ibtn" data-act="pdf-zoom" data-z="-1" aria-label="Zoom out">' + ic("minus") + '</button><button class="ibtn" data-act="pdf-zoom" data-z="1" aria-label="Zoom in">' + ic("plus") + "</button></div></div>";
    h += '<div id="pdfpanel" class="glass panel hide"></div><div id="pdfmsg" class="empty">Opening…</div><div class="pgwrap"><div id="pdfpages" class="pdfv"></div></div>';
    h += '<div class="btnrow" style="margin-top:16px"><button class="btn ghost danger" data-act="lib-del" data-id="' + esc(id) + '">Delete from this phone</button></div>';
    return h;
  }

  /* encyclopedia home: title search, main page, random, continue */
  function renderZimHome(x) {
    let h = backbar("#/library", "Archive");
    h += '<section class="glass hero zhero">' + (x.fav ? '<img class="zfav" alt="" src="' + esc(x.fav) + '">' : "") + '<div class="lab">' + esc([langName(x.lang), x.flavour].filter(Boolean).join(" · ") || "Archive") + '</div><h2 class="ztitle">' + esc(x.name) + "</h2>" +
      (x.desc ? '<div class="sub">' + esc(x.desc) + "</div>" : "") +
      '<div class="sub mono" style="font-size:.78rem;margin-top:8px">' + esc([x.articles ? fmtN(x.articles) + (x.articles === 1 ? " article" : " articles") : "", x.media ? fmtN(x.media) + " video and audio" : "", sz(x.size), x.date ? "made " + x.date : "", x.from === "kiwix" ? "from Kiwix" + (x.verified ? (x.check === "md5" ? ", checked: arrived intact" : ", checksum matched") : "") : ""].filter(Boolean).join(" · ")) + "</div></section>";
    if (x.needsScripts) h += '<div class="alert"><span class="dot"></span><span><b>This archive needs the Kiwix app</b><small>It is a copy of a website that runs its own scripts. HAVYN keeps archive scripts off for safety, so its pages may not work here. Open it in Kiwix, or on the home library.</small></span></div>';
    if (x.search !== false) h += '<form data-form="zsearch" data-id="' + esc(x.id) + '" class="zs"><input id="zq" name="q" type="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Search ' + (x.articles ? esc(fmtN(x.articles)) + (x.articles === 1 ? " title" : " titles") : "titles") + '" aria-label="Search titles in ' + esc(x.name) + '"></form><div id="zres" class="list" style="margin-top:8px"></div>';
    h += '<div class="btnrow" style="margin-top:12px">' + (x.main ? '<a class="btn" href="' + zHref(x.id, x.main) + '">' + ic("home") + "Main page</a>" : "") + '<button class="btn ghost" data-act="zim-random" data-id="' + esc(x.id) + '">' + ic("dice") + "Random</button></div>";
    if (x.lastPath && x.lastPath !== x.main) h += '<div class="list" style="margin-top:10px">' + li(zHref(x.id, x.lastPath), "book", "Continue reading", x.lastTitle || x.lastPath) + "</div>";
    h += '<p class="empty" style="font-size:.85rem;margin-top:12px">' + (x.search === false ? "This archive has no title index, so search is off here. Use Main page and its links." : "Search finds titles that start with what you type. Full-text search of every word runs on the home library (see Get more).") + "</p>";
    h += '<div class="btnrow" style="margin-top:16px"><button class="btn ghost danger" data-act="lib-del" data-id="' + esc(x.id) + '">Delete from this phone</button></div>';
    return h;
  }
  function renderZimRead(x) {
    return '<div class="zhead"><a class="ibtn" data-act="zr-back" href="#/library/' + esc(x.id) + '" aria-label="Back">' + ic("back") + '</a><span class="rtitle" id="ztitle">' + esc(x.lastTitle || x.name) + "</span>" +
      '<button class="ibtn" data-act="zr-size" aria-label="Text size">' + ic("textsize") + '</button><button class="ibtn' + (PR.zDark !== false ? " on" : "") + '" data-act="zr-dark" aria-label="Dark pages">' + ic("contrast") + '</button><a class="ibtn" href="#/library/' + esc(x.id) + '" aria-label="Search this archive">' + ic("search") + "</a></div>" +
      '<div id="zmsg" class="empty zmsg">Opening…</div><iframe id="zframe" class="zframe" title="' + esc(x.name) + '" sandbox="allow-same-origin" referrerpolicy="no-referrer"></iframe>';
  }

  // Archive reader. Installed app: the service worker serves archive pages at ./z/<id>/<path>, read straight
  // from the file saved on this phone. Preview or no service worker: pages are rebuilt here with blob: links.
  // Either way archive scripts never run: the frame is sandboxed without scripts and pages carry a no-script policy.
  const ZR = {
    mod: null, open: new Map(), id: null, cur: "", qp: null, pending: null, stack: [], token: 0, urls: [], amap: new Map(), saveT: 0,
    async lib() {
      if (!this.mod) { await import("./zimkit.js"); this.mod = globalThis.HavynZim; if (!this.mod) throw new Error("The archive reader didn't load."); }
      return this.mod;
    },
    archive(id) {
      let p = this.open.get(id);
      if (!p) {
        p = (async () => {
          const Z = await this.lib(), blob = await archiveBlob(id);
          if (!blob) throw Object.assign(new Error("This archive is missing on this phone. Add it again."), { name: "Missing" });
          return Z.Archive.open(blob);
        })();
        this.open.set(id, p); p.catch(() => this.open.delete(id));
        while (this.open.size > 3) this.open.delete(this.open.keys().next().value);
      }
      return p;
    },
    drop(id) { this.open.delete(id); try { const c = navigator.serviceWorker && navigator.serviceWorker.controller; if (c) c.postMessage({ t: "zim-drop", id }); } catch (e) {} },
    sw() { return !PREVIEW && !!(navigator.serviceWorker && navigator.serviceWorker.controller); },
    url(id, p) { return "./z/" + encodeURIComponent(id) + "/" + String(p || "").split("/").map(encodeURIComponent).join("/"); },
    msg(m) { const e = $("#zmsg"); if (e) { e.textContent = m || ""; e.classList.toggle("hide", !m); } },
    async mount(id, qp) {
      const fr = $("#zframe"); if (!fr) return;
      const x = LIB.find((d) => d.id === id);
      if (this.id !== id) { this.stack = []; this.cur = ""; this.qp = null; }
      let path;
      if (this.id === id && this.cur && qp === this.qp) path = this.cur;          // re-render: stay on the current page
      else { path = qp || (x && x.main) || ""; if (this.id === id && this.cur && path !== this.cur) this.stack.push(this.cur); }
      this.id = id; this.qp = qp;
      fr.addEventListener("load", () => this.loaded(fr));
      this.show(fr, path, "");
    },
    unmount() { this.token++; this.revoke(); },
    async show(fr, path, hash) {
      const tk = ++this.token; this.pending = path; fr.classList.remove("ready"); this.msg("Opening…");
      try {
        const a = await this.archive(this.id);
        if (tk !== this.token) return;
        if (path) {
          let d = await a.byPath(path);
          if (d) d = await a.resolve(d);
          if (d && a.mimeOf(d) === "application/pdf") { await this.savePdf(a, d); return; }
        }
      } catch (e) { if (tk === this.token) this.msg(e && e.message ? e.message : "Couldn't open this archive."); return; }
      if (this.sw()) {
        const u = this.url(this.id, path) + (hash || "");
        try { if (fr.contentWindow && fr.getAttribute("src")) fr.contentWindow.location.replace(u); else fr.src = u; } catch (e) { fr.src = u; }
      } else await this.renderDoc(fr, path, hash, tk);
    },
    go(path, hash) { if (this.cur) this.stack.push(this.cur); if (this.stack.length > 80) this.stack.shift(); const fr = $("#zframe"); if (fr) this.show(fr, path, hash); },
    back() { const p = this.stack.pop(); if (p === undefined) return false; const fr = $("#zframe"); if (fr) this.show(fr, p, ""); return true; },
    framePath(fr) {
      try {
        const pn = fr.contentWindow.location.pathname, pre = "/z/" + encodeURIComponent(this.id) + "/", k = pn.indexOf(pre);
        if (k >= 0) return pn.slice(k + pre.length).split("/").map(dec).join("/");
      } catch (e) {}
      return null;
    },
    loaded(fr) {
      if (!fr.isConnected) return;
      let doc = null; try { doc = fr.contentDocument; } catch (e) {}
      if (!doc || !doc.documentElement || (fr.getAttribute("src") === null && !fr.srcdoc)) return;
      const actual = this.sw() ? this.framePath(fr) : this.pending;
      if (actual === null) return;
      if (this.pending === null && this.cur && actual !== this.cur) this.stack.push(this.cur); // a link we didn't catch
      this.cur = actual; this.pending = null;
      this.style(doc);
      const x = LIB.find((d) => d.id === this.id);
      const t = (doc.title || "").trim() || (x && x.name) || "";
      const te = $("#ztitle"); if (te) te.textContent = t;
      if (x) { x.lastPath = actual; x.lastTitle = t; x.opened = now(); clearTimeout(this.saveT); this.saveT = setTimeout(saveLib, 800); }
      doc.addEventListener("click", (ev) => this.click(ev, doc), true);
      for (const m of doc.querySelectorAll("video,audio")) { m.setAttribute("controls", ""); m.setAttribute("playsinline", ""); m.removeAttribute("autoplay"); m.setAttribute("preload", "metadata"); }
      const b = $("[data-act=zr-back]"); if (b) b.classList.toggle("on", this.stack.length > 0);
      this.msg(""); fr.classList.add("ready");
    },
    style(doc) {
      const z = PR.zScale || 1, dark = PR.zDark !== false, night = PR.theme === "night";
      let css = "html{-webkit-text-size-adjust:100%;min-height:100%}body{zoom:" + z + ";overflow-wrap:break-word}img,video{max-width:100%;height:auto}table{max-width:100%}pre{white-space:pre-wrap}";
      if (night) css += "html{background:#fff;filter:invert(1) sepia(1) saturate(5) hue-rotate(-50deg) brightness(.8)}";
      else if (dark) css += "html{background:#fff;filter:invert(1) hue-rotate(180deg)}img,video,picture,canvas,svg image,iframe,[style*='background-image']{filter:invert(1) hue-rotate(180deg)}";
      let s = doc.getElementById("havyn-zr");
      if (!s) { s = doc.createElement("style"); s.id = "havyn-zr"; (doc.head || doc.documentElement).appendChild(s); }
      s.textContent = css;
    },
    restyle() { const fr = $("#zframe"); try { if (fr && fr.contentDocument) this.style(fr.contentDocument); } catch (e) {} },
    click(ev, doc) {
      const a = ev.target.closest && ev.target.closest("a[href]"); if (!a) return;
      const raw = a.getAttribute("href") || "";
      if (raw.startsWith("#")) {
        ev.preventDefault();
        const name = dec(raw.slice(1)), el = name && (doc.getElementById(name) || doc.getElementsByName(name)[0]);
        if (el) el.scrollIntoView({ block: "start" });
        return;
      }
      ev.preventDefault();
      let tgt = null;
      if (a.dataset.zx) tgt = { ext: a.dataset.zx };
      else if (a.dataset.zp !== undefined) tgt = { p: a.dataset.zp, h: a.dataset.zh || "" };
      else {
        try {
          const u = new URL(a.href), pre = new URL(this.url(this.id, ""), location.href);
          if (u.origin === location.origin && u.pathname.startsWith(pre.pathname)) tgt = { p: u.pathname.slice(pre.pathname.length).split("/").map(dec).join("/"), h: u.hash };
          else tgt = { ext: u.href };
        } catch (e) { return; }
      }
      if (tgt.ext) { if (/^https?:/i.test(tgt.ext) && navigator.onLine) window.open(tgt.ext, "_blank", "noopener"); else toast("That link goes to the internet"); return; }
      if (tgt.p === this.cur && tgt.h) { const el = doc.getElementById(dec(tgt.h.slice(1))); if (el) el.scrollIntoView({ block: "start" }); return; }
      this.go(tgt.p, tgt.h);
    },
    // PDFs inside archives open in HAVYN's PDF reader (copied into the library once).
    async savePdf(a, d) {
      const name = (d.title || d.url).replace(/\.pdf$/i, "").split("/").pop().slice(0, 140) || "Document";
      let x = LIB.find((p) => typeOf(p) === "pdf" && p.fromZim === this.id + "|" + d.index);
      if (!x) {
        const blob = await a.blobOf(d, "application/pdf");
        if (!(await roomFor(blob.size))) { this.msg("Not enough space to open this PDF."); return; }
        const id = uid();
        if (!(await Store.set("pdf:" + id, blob))) { this.msg("Couldn't save this PDF."); return; }
        x = { id, name, size: blob.size, added: now(), pages: 0, lastPage: 1, fromZim: this.id + "|" + d.index };
        LIB.push(x); await saveLib(); toast("Saved to your library");
      }
      go("#/library/" + x.id);
    },
    revoke() { for (const u of this.urls) URL.revokeObjectURL(u); this.urls = []; this.amap = new Map(); },
    blobUrl(b) { const u = URL.createObjectURL(b); this.urls.push(u); return u; },
    async asset(a, p) {
      if (this.amap.has(p)) return this.amap.get(p);
      const job = (async () => {
        let d = await a.byPath(p); if (!d) return "";
        d = await a.resolve(d); if (!d || d.special) return "";
        return this.blobUrl(await a.blobOf(d, a.mimeOf(d)));
      })().catch(() => "");
      this.amap.set(p, job); return job;
    },
    async css(a, text, base, depth) {
      const refs = new Map(), re = /url\(\s*(['"]?)([^'")]+)\1\s*\)|@import\s+(['"])([^'"]+)\3/g;
      let m; while ((m = re.exec(text))) { const r = (m[2] || m[4] || "").trim(); if (r && !/^(data|blob):/i.test(r) && !refs.has(r)) refs.set(r, null); }
      for (const r of refs.keys()) {
        const t = this.resolveRef(r, base);
        if (!t || t.ext) { refs.set(r, ""); continue; }
        if (/@import/.test(text) && depth < 2 && /\.css$/i.test(t.p)) {
          try { let d = await a.byPath(t.p); d = d && (await a.resolve(d)); if (d && a.mimeOf(d).startsWith("text/css")) { const inner = await this.css(a, await a.text(d), this.base(t.p), depth + 1); refs.set(r, this.blobUrl(new Blob([inner], { type: "text/css" }))); continue; } } catch (e) {}
        }
        refs.set(r, await this.asset(a, t.p));
      }
      return text.replace(re, (all, q1, u1, q2, u2) => { const r = (u1 || u2 || "").trim(), v = refs.get(r); if (v === undefined || v === null) return all; return u1 !== undefined ? "url(" + JSON.stringify(v) + ")" : '@import "' + v + '"'; });
    },
    base(p) { return "https://zim.invalid/" + String(p).split("/").map(encodeURIComponent).join("/"); },
    resolveRef(ref, base) {
      try { const u = new URL(ref, base); if (u.origin !== "https://zim.invalid") return { ext: u.href }; return { p: u.pathname.slice(1).split("/").map(dec).join("/"), h: u.hash }; } catch (e) { return null; }
    },
    async renderDoc(fr, path, hash, tk) {
      try {
        const a = await this.archive(this.id);
        let d = path ? await a.byPath(path) : await a.mainEntry();
        if (d) d = await a.resolve(d);
        if (tk !== this.token) return;
        if (!d) { this.pending = path; fr.srcdoc = '<!doctype html><meta charset="utf-8"><body style="font:17px -apple-system,sans-serif;padding:24px"><h3>Not in this archive</h3><p>' + esc(path) + "</p></body>"; return; }
        path = a.pathOf(d);
        const mime = a.mimeOf(d);
        this.revoke();
        const base = this.base(path);
        let html;
        if (mime.startsWith("text/html")) {
          const doc = new DOMParser().parseFromString(await a.text(d), "text/html");
          doc.querySelectorAll("script,noscript,iframe,frame,object,embed,base,meta[http-equiv],link[rel~=preload],link[rel~=prefetch],link[rel~=manifest],link[rel~=icon],form").forEach((n) => n.remove());
          doc.querySelectorAll("*").forEach((el) => { for (const at of Array.from(el.attributes)) if (/^on/i.test(at.name) || /^\s*javascript:/i.test(at.value)) el.removeAttribute(at.name); });
          const jobs = [];
          const src = (el, at) => { const t = this.resolveRef(el.getAttribute(at), base); if (!t || t.ext) { el.removeAttribute(at); return; } jobs.push(this.asset(a, t.p).then((u) => { if (u) el.setAttribute(at, u); else el.removeAttribute(at); })); };
          doc.querySelectorAll("img[src],source[src],video[src],audio[src],track[src]").forEach((el) => src(el, "src"));
          doc.querySelectorAll("video[poster]").forEach((el) => src(el, "poster"));
          doc.querySelectorAll("[srcset]").forEach((el) => { if (el.tagName === "IMG") el.removeAttribute("srcset"); else el.remove(); });
          doc.querySelectorAll("link[rel~=stylesheet][href]").forEach((el) => {
            const t = this.resolveRef(el.getAttribute("href"), base);
            if (!t || t.ext) { el.remove(); return; }
            jobs.push((async () => { let e = await a.byPath(t.p); e = e && (await a.resolve(e)); const s = doc.createElement("style"); s.textContent = e ? await this.css(a, await a.text(e), this.base(t.p), 0) : ""; el.replaceWith(s); })().catch(() => el.remove()));
          });
          doc.querySelectorAll("style").forEach((el) => jobs.push(this.css(a, el.textContent, base, 0).then((c) => { el.textContent = c; })));
          doc.querySelectorAll("a[href]").forEach((el) => {
            const raw = el.getAttribute("href"); if (raw.startsWith("#")) return;
            const t = this.resolveRef(raw, base); if (!t) return;
            if (t.ext) el.dataset.zx = t.ext; else { el.dataset.zp = t.p; if (t.h) el.dataset.zh = t.h; }
          });
          await Promise.all(jobs);
          if (!doc.querySelector("meta[name=viewport]")) { const mv = doc.createElement("meta"); mv.name = "viewport"; mv.content = "width=device-width, initial-scale=1"; doc.head.prepend(mv); }
          html = "<!doctype html>" + doc.documentElement.outerHTML;
        } else if (/^(image|video|audio)\//.test(mime)) {
          const u = this.blobUrl(await a.blobOf(d, mime));
          html = '<!doctype html><meta name="viewport" content="width=device-width"><body style="margin:0;background:#000;display:grid;place-items:center;min-height:100vh">' +
            (mime.startsWith("image/") ? '<img style="max-width:100%" src="' + u + '">' : mime.startsWith("video/") ? '<video controls playsinline style="max-width:100%" src="' + u + '"></video>' : '<audio controls src="' + u + '"></audio>') + "</body>";
        } else html = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><pre style="white-space:pre-wrap;font:15px ui-monospace,monospace;padding:14px">' + esc((await a.text(d)).slice(0, 400000)) + "</pre>";
        if (tk !== this.token) return;
        this.pending = path;
        fr.srcdoc = html;
        if (hash) setTimeout(() => { try { const el = fr.contentDocument.getElementById(dec(hash.slice(1))); if (el) el.scrollIntoView({ block: "start" }); } catch (e) {} }, 120);
      } catch (e) { if (tk === this.token) this.msg(e && e.message ? e.message : "Couldn't open that page."); }
    },
    async random(id) {
      try { const a = await this.archive(id), d = await a.random(); if (d) go(zHref(id, a.pathOf(d))); else toast("No articles to pick from"); }
      catch (e) { toast(e && e.message ? e.message : "Couldn't open this archive"); }
    },
    async search(id, q, box) {
      const tk = (this.stoken = (this.stoken || 0) + 1);
      if (!box) return;
      if (!String(q || "").trim()) { box.innerHTML = ""; return; }
      try {
        const a = await this.archive(id), res = await a.search(q, 30);
        if (tk !== this.stoken) return;
        box.innerHTML = res.length ? res.map((r) => li(zHref(id, r.path), "book", r.title, r.redirect ? "Redirect" : "")).join("") : '<div class="empty">No titles start with that. Try fewer letters or another spelling.</div>';
      } catch (e) { if (tk === this.stoken) box.innerHTML = '<div class="empty">' + esc(e && e.message ? e.message : "Search failed") + "</div>"; }
    }
  };

  /* video and audio */
  function renderMedia(x) {
    const v = typeOf(x) === "video";
    let h = backbar("#/library", v ? "Video" : "Audio");
    h += '<section class="glass panel media">' + (v ? '<video id="mplayer" controls playsinline preload="metadata"></video>' : '<div class="aud">' + ic("music") + '</div><audio id="mplayer" controls preload="metadata"></audio>') +
      '<div class="mtitle">' + esc(x.name) + '</div><div class="sub mono" style="font-size:.78rem;color:var(--mute)">' + esc([sz(x.size), x.dur ? clock(x.dur) : "", x.mime || ""].filter(Boolean).join(" · ")) + '</div><div id="mmsg" class="empty"></div></section>';
    h += '<div class="btnrow"><button class="btn ghost" data-act="m-skip" data-s="-15">Back 15 s</button><button class="btn ghost" data-act="m-skip" data-s="30">Forward 30 s</button></div>';
    h += '<div class="btnrow" style="margin-top:16px"><button class="btn ghost danger" data-act="lib-del" data-id="' + esc(x.id) + '">Delete from this phone</button></div>';
    return h;
  }
  const Media = {
    id: null, url: "", saveT: 0,
    async mount(id) {
      const el = $("#mplayer"); if (!el) return;
      if (this.id !== id) this.close();
      this.id = id;
      const x = LIB.find((d) => d.id === id), blob = await Store.get("media:" + id);
      if (!blob) { const m = $("#mmsg"); if (m) m.textContent = "This file is missing on this phone. Add it again."; return; }
      if (!this.url) this.url = URL.createObjectURL(blob);
      if (!el.isConnected) return;
      el.addEventListener("loadedmetadata", () => { if (!x) return; x.dur = el.duration || 0; if (x.pos > 5 && x.pos < el.duration - 5) el.currentTime = x.pos; }, { once: true });
      const keep = () => { if (!x) return; x.pos = el.currentTime || 0; x.opened = now(); clearTimeout(this.saveT); this.saveT = setTimeout(saveLib, 1500); };
      el.addEventListener("timeupdate", keep);
      el.addEventListener("pause", () => { keep(); saveLib(); });
      el.addEventListener("error", () => { const m = $("#mmsg"); if (m) m.textContent = "This phone can't play this file's format. MP4 (H.264) video and M4A or MP3 audio play on every iPhone."; });
      el.src = this.url;
    },
    skip(s) { const el = $("#mplayer"); if (el && el.duration) el.currentTime = Math.max(0, Math.min(el.duration - 0.5, el.currentTime + s)); },
    close() { const el = $("#mplayer"); if (el) { try { el.pause(); } catch (e) {} } if (this.url) { URL.revokeObjectURL(this.url); this.url = ""; } this.id = null; }
  };

  /* import: one button for every kind of file; the type comes from the file's contents */
  async function roomFor(bytes) {
    try { if (navigator.storage && navigator.storage.estimate) { const e = await navigator.storage.estimate(); if (e && e.quota) return e.quota - (e.usage || 0) > bytes * 1.02 + 5e6; } } catch (e) {}
    return true;
  }
  const VEXT = ["mp4", "m4v", "mov", "webm", "mkv", "3gp"], AEXT = ["mp3", "m4a", "m4b", "aac", "wav", "ogg", "oga", "opus", "flac", "caf"];
  const MIMES = { mp4: "video/mp4", m4v: "video/mp4", mov: "video/quicktime", webm: "video/webm", mkv: "video/x-matroska", "3gp": "video/3gpp", mp3: "audio/mpeg", m4a: "audio/mp4", m4b: "audio/mp4", aac: "audio/aac", wav: "audio/wav", ogg: "audio/ogg", oga: "audio/ogg", opus: "audio/ogg", flac: "audio/flac", caf: "audio/x-caf" };
  async function sniff(f) {
    let h = new Uint8Array(0); try { h = new Uint8Array(await f.slice(0, 16).arrayBuffer()); } catch (e) {}
    if (h[0] === 0x5A && h[1] === 0x49 && h[2] === 0x4D && h[3] === 0x04) return "zim";
    try { if ((await f.slice(0, 1024).text()).includes("%PDF-")) return "pdf"; } catch (e) {}
    const t = (f.type || "").toLowerCase(), ext = (String(f.name).split(".").pop() || "").toLowerCase();
    if (AEXT.includes(ext) || (t.startsWith("audio/") && !VEXT.includes(ext))) return "audio";
    if (VEXT.includes(ext) || t.startsWith("video/")) return "video";
    return "";
  }
  async function toDataUrl(fav) {
    let s = ""; for (let i = 0; i < fav.bytes.length; i++) s += String.fromCharCode(fav.bytes[i]);
    return "data:" + fav.mime.split(";")[0] + ";base64," + btoa(s);
  }
  async function addZim(blob, fileName, say) {
    say("Checking " + fileName + "…");
    let info, fav = "";
    try { const Z = await ZR.lib(); const a = await Z.Archive.open(blob); info = await a.info(); const f = await a.favicon().catch(() => null); if (f) fav = await toDataUrl(f); }
    catch (e) { toast(fileName + ": " + (e && e.message ? e.message : "not a readable archive")); return false; }
    if (LIB.some((x) => typeOf(x) === "zim" && x.uuid === info.uuid)) { toast(info.title + " is already on this phone"); return false; }
    if (!(await roomFor(blob.size))) { toast("Not enough space for " + info.title + " (" + sz(blob.size) + ")"); return false; }
    say("Saving " + info.title + " (" + sz(blob.size) + ") to this phone. Keep HAVYN open…");
    const id = uid();
    if (!(await Store.set("zim:" + id, blob))) { toast("Couldn't save " + info.title + ". The phone may be out of space."); return false; }
    LIB.push({ id, type: "zim", name: info.title, file: fileName, size: blob.size, added: now(), uuid: info.uuid, date: info.date, lang: info.language, desc: info.description,
      articles: info.articles, media: info.media, main: info.main, mainTitle: info.mainTitle, fav, needsScripts: info.needsScripts, search: info.titleSearch, flavour: info.flavour, zname: info.name, creator: info.creator });
    return true;
  }
  async function addPdf(f, say, meta) {
    meta = meta || {};
    const sh = C.shelf && C.shelf.items.find((i) => (meta.shelf && i.id === meta.shelf) || i.file === f.name);
    if (sh && shelfHave(sh)) { toast(sh.t + " is already on this phone"); return false; }
    say("Saving " + (meta.name || (sh && sh.t) || f.name) + "…");
    if (!(await roomFor(f.size))) { toast("Not enough space for " + f.name); return false; }
    const id = uid();
    if (!(await Store.set("pdf:" + id, f))) { toast("Not enough space for " + f.name); return false; }
    LIB.push({ id, name: (meta.name || (sh && sh.t) || f.name.replace(/\.pdf$/i, "")).slice(0, 140) || "Untitled", file: String(f.name).slice(0, 200), size: f.size, added: now(), pages: 0, lastPage: 1, shelf: sh ? sh.id : undefined });
    return true;
  }
  // Hesperian publishes its books as chapter PDFs (en_wtnd_2025_01.pdf …). Added together, HAVYN joins them into one book.
  const HPRE = /^en_([a-z]+)_(\d{4})_([a-z0-9]+)\.pdf$/i;
  const HP_ORDER = ["fm", "if", "toc", "intro", "how", "wo"].concat(Array.from({ length: 46 }, (_, i) => String(i).padStart(2, "0"))).concat(["gp", "green", "voc", "vocab", "resc", "res", "indx", "index", "bm", "ib", "ob"]);
  async function joinChapters(key, parts, say) {
    const [code, year] = key.split("_");
    const it = C.shelf && C.shelf.items.find((i) => i.hp && i.hp.code === code);
    const title = (it ? it.t : "Hesperian " + code.toUpperCase()) + " (" + year + ")";
    const rank = (s) => { const k = HP_ORDER.indexOf(s); return k < 0 ? 999 : k; };
    parts.sort((a, b) => rank(a.s) - rank(b.s) || (a.f.name < b.f.name ? -1 : 1));
    if (!(await roomFor(parts.reduce((a, p) => a + p.f.size, 0) * 2))) { toast("Not enough space to join " + title); return null; }
    try {
      const { PDFDocument } = await import("./pdflib/pdf-lib.esm.min.js");
      const out = await PDFDocument.create();
      let i = 0;
      for (const p of parts) {
        say("Joining " + title + ": chapter " + (++i) + " of " + parts.length + "…");
        const src = await PDFDocument.load(await p.f.arrayBuffer(), { ignoreEncryption: true });
        for (const pg of await out.copyPages(src, src.getPageIndices())) out.addPage(pg);
      }
      out.setTitle(title); out.setCreator("HAVYN (joined from Hesperian's chapter PDFs)");
      const bytes = await out.save({ useObjectStreams: true });
      return { file: new File([bytes], it ? it.file : "Hesperian-" + code + "-" + year + ".pdf", { type: "application/pdf" }), meta: { name: title, shelf: it ? it.id : undefined } };
    } catch (e) { toast("Couldn't join " + title + "; adding the chapters one by one"); return null; }
  }
  async function addMedia(f, kind, say) {
    say("Saving " + f.name + " (" + sz(f.size) + ")…");
    if (!(await roomFor(f.size))) { toast("Not enough space for " + f.name); return false; }
    const ext = (String(f.name).split(".").pop() || "").toLowerCase(), mime = f.type || MIMES[ext] || (kind === "video" ? "video/mp4" : "audio/mpeg");
    const blob = f.type ? f : new Blob([f], { type: mime });
    const id = uid();
    if (!(await Store.set("media:" + id, blob))) { toast("Not enough space for " + f.name); return false; }
    LIB.push({ id, type: kind, name: f.name.replace(/\.[A-Za-z0-9]{2,4}$/, "").slice(0, 140) || "Untitled", size: f.size, added: now(), mime, pos: 0, dur: 0 });
    return true;
  }
  let importing = false;
  async function importFiles(files) {
    files = Array.from(files || []); if (!files.length || importing) return;
    importing = true;
    const say = (m) => { const e = $("#libmsg"); if (e) e.textContent = m; const b = $("#libbar"); if (b) b.classList.toggle("hide", !m); };
    let n = 0;
    try {
      const groups = new Map(), singles = [];
      for (const f of files) { const m = /^(.*\.zim)a[a-z]$/i.exec(f.name); if (m) { const k = m[1].toLowerCase(); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(f); } else singles.push(f); }
      for (const [, parts] of groups) { parts.sort((a, b) => (a.name < b.name ? -1 : 1)); if (await addZim(new Blob(parts), parts[0].name.replace(/a[a-z]$/i, ""), say)) n++; }
      const books = new Map(), rest = [];
      for (const f of singles) { const m = HPRE.exec(f.name); if (m) { const k = m[1].toLowerCase() + "_" + m[2]; if (!books.has(k)) books.set(k, []); books.get(k).push({ f, s: m[3].toLowerCase() }); } else rest.push(f); }
      for (const [k, parts] of books) {
        const j = parts.length >= 3 ? await joinChapters(k, parts, say) : null;
        if (j) { if (await addPdf(j.file, say, j.meta)) n++; } else rest.push(...parts.map((p) => p.f));
      }
      for (const f of rest) {
        const kind = await sniff(f);
        if (kind === "zim") { if (await addZim(f, f.name, say)) n++; }
        else if (kind === "pdf") { if (await addPdf(f, say)) n++; }
        else if (kind) { if (await addMedia(f, kind, say)) n++; }
        else toast(f.name + ": HAVYN reads ZIM archives, PDFs, video and audio");
      }
      await saveLib(); requestPersist();
    } finally { importing = false; say(""); }
    if (n) { Snd.chime("save"); toast(n === 1 ? "Saved on this phone" : n + " files saved on this phone"); }
    PdfIndex.kick();
    render();
  }
  async function deleteItem(id) {
    const x = LIB.find((d) => d.id === id); if (!x) return;
    const t = typeOf(x);
    if (t === "pdf") await PdfV.close();
    if (t === "zim") { ZR.drop(id); const v = await Store.get("zim:" + id); if (v && Array.isArray(v.parts)) for (const k of v.parts) await Store.del(k); }
    if (t === "video" || t === "audio") Media.close();
    await Store.del(KEY[t] + id); await Store.del("ptext:" + id);
    LIB = LIB.filter((d) => d.id !== id); await saveLib(); toast("Deleted from this phone"); go("#/library");
  }
  async function libQuota() {
    const el = $("#libq"); if (!el || !navigator.storage || !navigator.storage.estimate) return;
    try {
      const e = await navigator.storage.estimate(), kept = navigator.storage.persisted ? await navigator.storage.persisted() : false;
      el.textContent = "Storage: " + sz(e.usage || 0) + " used · about " + sz(Math.max(0, (e.quota || 0) - (e.usage || 0))) + " more allowed" + (kept ? " · kept safe from cleanup" : "");
    } catch (e) {}
  }

  /* PDF text, extracted once in the background so Search can find words inside PDFs */
  const PdfIndex = {
    busy: false,
    kick() { if (!this.busy) setTimeout(() => this.run(), 1500); },
    async run() {
      if (this.busy) return; this.busy = true;
      try {
        for (;;) {
          const x = LIB.find((d) => typeOf(d) === "pdf" && !d.indexed && !d.noText && (d.size || 0) < 150e6);
          if (!x) break;
          await this.one(x);
        }
      } finally { this.busy = false; }
    },
    async one(x) {
      let doc = null;
      try {
        const blob = await Store.get("pdf:" + x.id); if (!blob) { x.noText = true; return; }
        const lib = await PdfV.engine();
        doc = await lib.getDocument({ data: new Uint8Array(await blob.arrayBuffer()), useWorkerFetch: false, useWasm: false, isEvalSupported: false, verbosity: 0 }).promise;
        const pages = [];
        for (let n = 1; n <= doc.numPages; n++) {
          const tc = await (await doc.getPage(n)).getTextContent();
          pages.push(tc.items.map((it) => it.str).join(" ").replace(/\s+/g, " ").trim());
          if (n % 8 === 0) await new Promise((r) => setTimeout(r, 30));
        }
        const chars = pages.reduce((a, p) => a + p.length, 0);
        if (chars < 20) { x.noText = true; } else { await Store.set("ptext:" + x.id, pages); x.indexed = true; }
        x.pages = doc.numPages;
      } catch (e) { x.noText = true; }
      finally { if (doc) try { doc.destroy(); } catch (e) {} await saveLib(); }
    }
  };

  /* SEARCH: one box over HAVYN, your household, the library and every archive */
  const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  let IDX = null;
  function localIndex() {
    if (IDX) return IDX;
    // w: tie-break weight, so life-safety content ranks above shopping and catalog entries.
    const out = [], add = (kind, icon, title, text, href, w) => out.push({ kind, icon, title, text: String(text || ""), href, w: w || 0, ft: fold(title), fx: fold(title + " \n " + text) });
    for (const c of C.cards) add("Emergency card", c.icon, c.title, [c.sub].concat(c.steps.map((s) => s.t + ". " + (s.d || "")), c.note || "").join(" "), "#/emergency/" + c.id, 8);
    for (const f of FIELD()) add("How do I", "book", f.q, f.r.map((r) => fieldDoc(r[0]) + " p. " + r[1] + ": " + r[2]).join(" · ") + " · " + (f.k || ""), "#/field?f=" + f.id, 7);
    for (const p of C.playbooks) add("Playbook", p.icon, p.title, [p.sub, p.trigger].concat(p.leave || [], ...(p.phases || []).map((ph) => ph.items.map((it) => it.t + ". " + (it.d || "")))).join(" "), "#/playbooks/" + p.id, 6);
    for (const n of C.numbers) add("Phone number", "phone", n.n, n.num + " " + (n.d || ""), "#/comms", 5);
    for (const r of C.comms.ladder) add("Comms", "radio", r.rung + ": " + r.t, [r.when, r.range, r.d].join(" "), "#/comms", 2);
    for (const r of C.comms.rules) add("Comms rule", "radio", r.t, r.d, "#/comms", 2);
    for (const s of C.plan.stages) add("Plan", "flag", s.t, s.d, "#/plan", 1);
    for (const r of C.plan.heat) add("Heat rule", "sun", r.t, r.d, "#/plan", 3);
    for (const r of C.plan.power) add("Power", "bolt", r.n, [r.cap, r.runs].join(" "), "#/plan", 1);
    for (const ph of C.missions.phases) for (const t of ph.tasks) add("Mission · " + ph.label, "check", t.t, t.d || "", "#/missions", 1);
    for (const t of C.missions.recurring) add("Upkeep", "check", t.t, t.d || "", "#/missions", 1);
    for (const b of C.buy.items) add("Buy list", "cart", b.n, [b.pick, b.why, b.note].join(" "), "#/buy/" + b.id, 0);
    if (C.archive) for (const a of C.archive.items) add("Get more", a.kind === "app" ? "download" : a.kind === "video" ? "film" : "globe", a.t, [a.d, a.tier].join(" "), "#/archive?t=" + a.tier, 0);
    if (C.shelf) for (const it of C.shelf.items) { const sy = C.shelf.systems.find((x) => x.id === it.sys); add("Shelf · " + (sy ? sy.t : ""), "file", it.t, [it.d, it.by].join(" "), "#/archive?t=shelf&s=" + it.sys, 0); }
    IDX = out; return out;
  }
  function liveIndex() {
    const out = [], add = (kind, icon, title, text, href, w) => out.push({ kind, icon, title: title || "", text: String(text || ""), href, w: w || 0, ft: fold(title), fx: fold(title + " \n " + text) });
    for (const p of L("people")) add("Family", "people", p.name || "Unnamed", [p.conditions, p.meds, p.allergies, p.blood, p.doctor, p.device, p.notes].filter(Boolean).join(" · "), "#/family/person/" + p.id, 4);
    for (const p of L("pets")) add("Pet", "paw", p.name || "Pet", [p.species, p.notes].filter(Boolean).join(" · "), "#/family", 3);
    for (const it of L("items")) add("Supplies", RES[it.category] ? RES[it.category].icon : "box", it.name || "Item", [it.location, it.notes, it.owner].filter(Boolean).join(" · "), "#/supplies/item/" + it.id, 3);
    for (const x of LIB) add("Library", typeOf(x) === "zim" ? "globe" : typeOf(x) === "pdf" ? "file" : typeOf(x) === "video" ? "film" : "music", x.name, [x.desc, x.file].filter(Boolean).join(" "), "#/library/" + x.id, 2);
    return out;
  }
  function snippet(text, words) {
    const ft = fold(text); let i = -1;
    for (const w of words) { i = ft.indexOf(w); if (i >= 0) break; }
    if (i < 0) return text.slice(0, 120);
    let s = Math.max(0, i - 50); const e = Math.min(text.length, i + 90);
    if (s > 0) { const sp = text.indexOf(" ", s); if (sp > -1 && sp < i) s = sp + 1; }
    return (s ? "…" : "") + text.slice(s, e).trim() + (e < text.length ? "…" : "");
  }
  function scoreDoc(d, q, words) {
    for (const w of words) if (!d.fx.includes(w)) return 0;
    let s = 1;
    if (d.ft === q) s += 40; else if (d.ft.startsWith(q)) s += 25; else if (d.ft.includes(q)) s += 15;
    for (const w of words) { if (d.ft.includes(w)) s += 5; if (new RegExp("(^|[^a-z0-9])" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).test(d.ft)) s += 3; }
    return s + d.w;
  }
  function hitRow(href, icon, title, kind, snip) {
    return '<a class="li hit" href="' + esc(href) + '"><span class="ic">' + ic(icon) + '</span><span class="tx"><b>' + esc(title) + '</b><small class="hk">' + esc(kind) + "</small>" + (snip ? '<span class="snip">' + esc(snip) + "</span>" : "") + "</span>" + ic("chev") + "</a>";
  }
  function renderSearch() {
    const q = route.q.q || "";
    let h = backbar("#/guides", "Search everything");
    h += '<form data-form="search" class="zs"><input id="sq" name="q" type="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Water, CPR, scorpion, generator…" aria-label="Search everything" value="' + esc(q) + '"></form>';
    if (hubUrl()) h += '<div class="btnrow" style="margin-top:8px"><a class="btn ghost sm" href="' + esc(hubUrl()) + '" target="_blank" rel="noopener">' + ic("server") + "Full-text search on the home library</a></div>";
    h += '<div id="sres" style="margin-top:10px"></div>';
    return h;
  }
  const SearchUI = {
    token: 0, t: 0,
    mount() { const i = $("#sq"); if (!i) return; if (!i.value) setTimeout(() => { try { i.focus(); } catch (e) {} }, 60); this.run(i.value); },
    later(q) { clearTimeout(this.t); this.t = setTimeout(() => this.run(q), 160); },
    async run(q) {
      const tk = ++this.token, box = $("#sres"); if (!box) return;
      try { history.replaceState(null, "", "#/search" + (q ? "?q=" + encodeURIComponent(q) : "")); lastPath = location.hash; } catch (e) {}
      const fq = fold(q).trim(); const words = fq.split(/\s+/).filter((w) => w.length > 0);
      if (!fq) { box.innerHTML = '<p class="empty">Searches the emergency cards, playbooks, plan, phone numbers, missions, buy list, your family and supplies, words inside your PDFs, and the titles in every archive on this phone. Everything works with no internet.</p>'; return; }
      const docs = localIndex().concat(liveIndex()).map((d) => ({ d, s: scoreDoc(d, fq, words) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 25);
      let h = '<div class="sec"><span class="lab">In HAVYN</span><span class="mono" style="color:var(--mute);font-size:.8rem">' + docs.length + "</span></div>";
      h += docs.length ? '<div class="list">' + docs.map((x) => hitRow(x.d.href, x.d.icon, x.d.title, x.d.kind, x.d.ft.includes(fq) ? "" : snippet(x.d.text, words))).join("") + "</div>" : '<div class="empty">Nothing in the cards, plan or your records.</div>';
      h += '<div id="spdf"></div>';
      const zims = LIB.filter((x) => typeOf(x) === "zim" && x.search !== false);
      for (const z of zims) h += '<div id="sz-' + esc(z.id) + '"></div>';
      if (!zims.length) h += '<div class="sec"><span class="lab">Archives</span></div><div class="empty">No archives on this phone yet. <a href="#/archive">Get Wikipedia, WikiMed and more</a>.</div>';
      box.innerHTML = h;
      // PDF text
      const pdfs = LIB.filter((x) => typeOf(x) === "pdf" && x.indexed);
      const phits = [];
      for (const x of pdfs) {
        const pages = await Store.get("ptext:" + x.id); if (tk !== this.token) return;
        if (!Array.isArray(pages)) continue;
        let k = 0;
        for (let i = 0; i < pages.length && k < 3; i++) { const f = fold(pages[i]); if (words.every((w) => f.includes(w))) { phits.push({ x, page: i + 1, snip: snippet(pages[i], words) }); k++; } }
      }
      const pe = $("#spdf");
      if (pe && (phits.length || pdfs.length)) pe.innerHTML = '<div class="sec"><span class="lab">Inside your PDFs</span><span class="mono" style="color:var(--mute);font-size:.8rem">' + phits.length + "</span></div>" + (phits.length ? '<div class="list">' + phits.slice(0, 15).map((r) => hitRow("#/library/" + r.x.id + "?page=" + r.page, "file", r.x.name, "Page " + r.page, r.snip)).join("") + "</div>" : '<div class="empty">No PDF pages contain all of those words.</div>');
      // archive titles, one archive at a time so the first results show quickly
      for (const z of zims) {
        if (tk !== this.token) return;
        const el = $("#sz-" + z.id); if (!el) continue;
        el.innerHTML = '<div class="sec"><span class="lab">' + esc(z.name) + '</span><span class="mono" style="color:var(--mute);font-size:.8rem">…</span></div>';
        try {
          const a = await ZR.archive(z.id), res = await a.search(q, 8);
          if (tk !== this.token) return;
          el.innerHTML = '<div class="sec"><span class="lab">' + esc(z.name) + '</span><span class="mono" style="color:var(--mute);font-size:.8rem">' + res.length + (res.length === 8 ? "+" : "") + "</span></div>" +
            (res.length ? '<div class="list">' + res.map((r) => hitRow(zHref(z.id, r.path), "book", r.title, "Article", "")).join("") + '</div>' + (res.length === 8 ? '<div class="btnrow" style="margin-top:6px"><a class="btn ghost sm" href="#/library/' + esc(z.id) + '">More in ' + esc(z.name) + "</a></div>" : "") : '<div class="empty">No titles start with that.</div>');
        } catch (e) { el.innerHTML = '<div class="sec"><span class="lab">' + esc(z.name) + '</span></div><div class="empty">' + esc(e && e.message ? e.message : "Couldn't search this archive") + "</div>"; }
      }
    }
  };

  /* ---------------- GET MORE: the archive catalog, the vault drive kit and the home library ---------------- */
  const KIWIX_DL = "https://download.kiwix.org/zim/";
  const hubUrl = () => { const u = String((S.plan && S.plan.hub) || "").trim(); return /^https?:\/\/[^\s"'<>]{3,200}$/i.test(u) ? u : ""; };
  function haveOnPhone(it) {
    const stem = it.get && it.get.stem;
    return LIB.find((x) => {
      if (it.kind === "zim" && typeOf(x) === "zim") {
        const zn = (x.zname || "") + (x.flavour ? "_" + x.flavour : "");
        return !!stem && (zn === stem || (x.zname || "") === stem || String(x.file || "").startsWith(stem + "_"));
      }
      if (it.kind === "pdf" && typeOf(x) === "pdf") return !!(it.get && it.get.name) && (x.file === it.get.name || x.name === it.get.name.replace(/\.pdf$/i, ""));
      return false;
    }) || null;
  }
  function getLink(it) {
    if (it.u) return it.u;
    if (it.kind === "zim" || it.kind === "video") {
      if (it.file && it.get && it.get.zim) return KIWIX_DL + it.get.zim + "/" + it.file;
      if (it.get && it.get.stem) return "https://library.kiwix.org/#lang=eng&q=" + encodeURIComponent(it.get.stem);
    }
    if (it.get && it.get.url) return it.get.url;
    if (it.get && it.get.gh) return "https://github.com/" + it.get.gh + "/releases/latest";
    if (it.get && it.get.kx) return it.get.kx;
    return "";
  }
  const sizeTxt = (it) => (it.size ? (it.est ? "~" : "") + sz(it.size) : "");
  function getRow(it, tier) {
    const have = tier === "phone" ? haveOnPhone(it) : null;
    const marked = !!(S.checks.archive && S.checks.archive[it.id]);
    const link = getLink(it);
    const chips = [sizeTxt(it), it.kind === "app" ? "App Store" : it.kind === "setup" ? "Built in" : it.kind === "ai" ? "AI" : it.kind === "soft" ? "Software" : it.kind === "video" ? "Video" : it.kind === "pdf" ? "PDF" : it.kind === "zim" ? "Archive" : "",
      it.opens === "havyn" ? "Opens in HAVYN" : it.opens === "kiwix" ? "Needs Kiwix" : "", it.core ? "Core" : ""].filter(Boolean);
    let h = '<div class="gi' + (have || marked ? " got" : "") + '" id="gi-' + esc(it.id) + '"><div class="gh"><b>' + esc(it.t) + '</b><span class="gc">' + chips.map((c) => '<span class="chip' + (c === "Core" ? " core" : "") + '">' + esc(c) + "</span>").join("") + "</span></div>" +
      '<div class="gd">' + esc(it.d) + "</div>";
    const btns = [];
    if (have) btns.push('<a class="btn sm" href="#/library/' + esc(have.id) + '">' + ic("check") + "On this phone · open</a>");
    else if (tier === "phone" && Arc.can(it)) {
      btns.push('<button class="btn sm" data-arcget data-act="arc-get" data-id="' + esc(it.id) + '"' + (Arc.busy || Shelf.busy ? " disabled" : "") + ">" + ic("download") + "Get · " + sz(Arc.size(it)) + "</button>");
      if (link) btns.push('<a class="btn sm ghost" href="' + esc(link) + '" target="_blank" rel="noopener">In Safari</a>');
    }
    else if (link && it.kind !== "hub" && it.kind !== "own" && it.kind !== "setup") btns.push('<a class="btn sm' + (tier === "phone" || tier === "apps" ? "" : " ghost") + '" href="' + esc(link) + '" target="_blank" rel="noopener">' + ic("download") + (it.kind === "app" || (it.kind === "ai" && tier === "apps") ? "App Store" : tier === "drive" ? "Source" : "Download") + "</a>");
    if (!have && tier !== "phone") btns.push('<label class="mk"><input type="checkbox" data-chk="archive|' + esc(it.id) + '"' + (marked ? " checked" : "") + "><span>" + (it.kind === "setup" ? "Done" : tier === "apps" ? "Installed" : tier === "drive" ? "On the drive" : "Set up") + "</span></label>");
    if (!have && tier === "phone" && it.kind !== "own") btns.push('<label class="mk"><input type="checkbox" data-chk="archive|' + esc(it.id) + '"' + (marked ? " checked" : "") + "><span>Downloaded</span></label>");
    if (btns.length) h += '<div class="gb">' + btns.join("") + "</div>";
    return h + "</div>";
  }
  function renderArchive() {
    const A = C.archive, t = ["shelf", "phone", "apps", "drive", "hub"].includes(route.q.t) ? route.q.t : Get.tier;
    Get.tier = t;
    const items = A.items.filter((i) => i.tier === t), T = A.tiers.find((x) => x.id === t);
    let h = backbar("#/library", "Get more");
    h += '<div class="seg wide" style="margin:0 0 12px">' + [{ id: "shelf" }].concat(A.tiers).map((x) => '<a href="#/archive?t=' + x.id + '"' + (x.id === t ? ' class="on"' : "") + ">" + esc(x.id === "hub" ? "HOME" : x.id.toUpperCase()) + "</a>").join("") + "</div>";
    if (t === "shelf") return h + renderShelf();
    h += '<section class="glass hero"><div class="lab">' + esc(T.t) + " · checked " + esc(A.checked) + '</div><div class="sub" style="margin-top:6px">' + esc(T.d) + "</div>";
    if (t === "phone") {
      const core = items.filter((i) => i.core), cs = core.reduce((a, i) => a + (i.size || 0), 0), got = core.filter((i) => haveOnPhone(i)).length;
      const todo = Arc.todo(core), tsz = todo.reduce((a, i) => a + Arc.size(i), 0);
      h += '<div id="arc"></div><div class="num" style="margin-top:10px"><span class="big" style="font-size:2.4rem">' + got + "/" + core.length + '</span><span class="unit">CORE ON THIS PHONE · ' + sz(cs) + "</span></div>" +
        '<div class="bar" style="margin:6px 0 4px"><i style="width:' + Math.round((got / Math.max(1, core.length)) * 100) + '%"></i></div><div class="sub mono" id="getq" style="font-size:.75rem"></div>' +
        '<div class="btnrow" style="margin-top:12px">' + (todo.length ? '<button class="btn" data-arcget data-act="arc-get-core"' + (Arc.busy || Shelf.busy ? " disabled" : "") + ">" + ic("download") + "Get the core set · " + todo.length + " · " + sz(tsz) + "</button>" : got === core.length ? '<span class="chip ok">' + ic("check") + "Core set on this phone</span>" : "") +
        '<button class="btn ghost' + (Arc.busy ? "" : " hide") + '" id="arcstop" data-act="arc-stop">Stop</button><a class="btn ghost" href="#/library">' + ic("plus") + "Add files</a></div>" +
        '<div class="sub" style="font-size:.78rem;margin-top:6px">' + (PREVIEW ? "This preview can't download archives; the installed app can." : "Straight from Kiwix's own mirror into HAVYN, checked against Kiwix's published SHA-256. Use Wi-Fi; if the download stops, Get carries on from where it left off.") + "</div>" +
        '<div class="bar' + (Arc.busy ? "" : " hide") + '" id="arcbar" style="margin-top:10px"><i style="width:' + Arc.pct() + '%"></i></div><div id="arcmsg" class="empty" style="min-height:1.1em;font-size:.82rem">' + esc(Arc.msg()) + "</div>";
    }
    if (t === "drive") {
      const all = A.items.filter((i) => i.tier === "drive" || i.tier === "phone");
      const core = all.filter((i) => i.core && i.get), cs = core.reduce((a, i) => a + (i.size || 0), 0), fs = all.filter((i) => i.get).reduce((a, i) => a + (i.size || 0), 0);
      const marked = items.filter((i) => S.checks.archive && S.checks.archive[i.id]).length;
      const cp = sz(cs).split(" ");
      h += '<div class="num" style="margin-top:10px"><span class="big" style="font-size:2.6rem">~' + cp[0] + '</span><span class="unit">' + cp[1] + " CORE SET<br>~" + sz(fs) + " EVERYTHING</span></div>" +
        '<div class="sub">' + marked + " of " + items.length + " marked on the drive. A 1 TB drive holds everything twice over.</div>";
    }
    h += "</section>";
    if (t === "drive") {
      h += '<section class="glass panel"><h3>Fill the drive tonight</h3>' +
        '<div class="blk"><b>1 · Plug in the drive</b><span>A 1–2 TB USB SSD on a Mac or Windows PC. Format it exFAT and name it HAVYN-VAULT: Macs, PCs and iPhones can all read exFAT, and it holds files over 4 GB.</span></div>' +
        '<div class="blk"><b>2 · Run one command</b><span>Mac or Linux, in Terminal:</span><code class="cmd">curl -fsSL ' + esc(Get.raw("get-vault.sh")) + " | bash -s -- /Volumes/HAVYN-VAULT</code>" +
        "<span>Windows, in PowerShell (change E: to the drive's letter):</span><code class=\"cmd\">irm " + esc(Get.raw("get-vault.ps1")) + " -OutFile get-vault.ps1; powershell -ExecutionPolicy Bypass -File .\\get-vault.ps1 -Drive E:\\</code>" +
        "<span>Add <b>--full</b> (Mac) or <b>-Full</b> (Windows) for everything instead of the core set.</span></div>" +
        '<div class="blk"><b>3 · Leave it overnight</b><span>It downloads the newest copy of each item, resumes after any interruption, checks every archive against Kiwix\'s published checksum, and writes START-HERE.html on the drive. Run it again any time to finish or update.</span></div>' +
        '<div class="btnrow" style="margin-top:6px"><a class="btn ghost sm" href="./vault/get-vault.sh" download>Save Mac script</a><a class="btn ghost sm" href="./vault/get-vault.ps1" download>Save Windows script</a></div>' +
        '<p class="empty" style="font-size:.82rem;margin-top:8px">No computer? Download items one at a time from this page; in Safari\'s download prompt choose the drive in Files.</p></section>';
    }
    if (t === "hub") {
      const u = hubUrl();
      h += '<form class="glass panel" data-form="hub"><h3>Your home library address</h3>' + fld("hub", "Address", (S.plan && S.plan.hub) || "", { ph: "http://192.168.1.20:8080", hint: "Kiwix shows it (and a QR code) when you start its Hotspot. It works only on the same Wi-Fi." }) +
        '<div class="btnrow"><button class="btn" type="submit">Save</button>' + (u ? '<a class="btn ghost" href="' + esc(u) + '" target="_blank" rel="noopener">' + ic("server") + "Open it</a>" : "") + "</div></form>";
    }
    if (t === "drive") {
      const G = [["02", "Encyclopedias"], ["03", "Medical"], ["04", "Skills and repair"], ["05", "Video (opens in Kiwix)"], ["06", "Books"], ["07", "Offline AI"], ["08", "Software"], ["09", "Builder (optional)"]];
      const ph = A.items.filter((i) => i.tier === "phone" && i.get);
      h += '<p class="empty" style="font-size:.85rem">The drive also gets the phone set (' + ph.length + " items, ~" + sz(ph.reduce((a, i) => a + (i.size || 0), 0)) + "), so any phone can be refilled from it.</p>";
      for (const [k, label] of G) {
        const xs = items.filter((i) => String(i.dir || "").startsWith(k)).sort((a, b) => (b.core ? 1 : 0) - (a.core ? 1 : 0));
        if (!xs.length) continue;
        h += '<div class="sec"><span class="lab">' + esc(label) + '</span><span class="mono" style="color:var(--mute);font-size:.8rem">' + xs.length + " · ~" + sz(xs.reduce((a, i) => a + (i.size || 0), 0)) + '</span></div><div class="glist">' + xs.map((i) => getRow(i, t)).join("") + "</div>";
      }
    } else h += '<div class="glist">' + items.map((i) => getRow(i, t)).join("") + "</div>";
    if (t === "apps") h += '<p class="empty" style="font-size:.85rem;margin-top:10px">HAVYN can\'t install apps for you: Apple allows App Store installs only. Bluetooth mesh chat (Bitchat) and satellite messaging stay in their own apps for the same reason.</p>';
    h += '<p class="empty" style="font-size:.82rem;margin-top:12px">' + esc(A.note) + " Sources: " + srcRefs(["kiwix", "kiwixprep", "kiwixmirror", "kiwixapple", "webkitstore"]) + ".</p>";
    return h;
  }
  const Get = {
    tier: "shelf",
    raw: (f) => "https://raw.githubusercontent.com/hourglazlabs-x/havyn/main/vault/" + f,
    async mount() {
      if ($("#shelf")) Shelf.mount();
      if ($("#arc")) Arc.mount();
      const el = $("#getq"); if (!el || !navigator.storage || !navigator.storage.estimate) return;
      try {
        const e = await navigator.storage.estimate(), free = Math.max(0, (e.quota || 0) - (e.usage || 0));
        const need = C.archive.items.filter((i) => i.tier === "phone" && i.core && !haveOnPhone(i)).reduce((a, i) => a + (i.size || 0), 0);
        el.textContent = "HAVYN can use about " + sz(free) + " more on this phone" + (need ? " · the rest of the core set needs about " + sz(need) : " · core set complete");
      } catch (e) {}
    }
  };

  /* ---------------- SHELF: real manuals and guides, by system, one tap each from HAVYN's own address ---------------- */
  const LICS = { pd: "Public domain", "cc-by": "CC BY", "cc-by-sa": "CC BY-SA", "cc-by-nc-sa": "CC BY-NC-SA", link: "Publisher's terms" };
  const SHELF_ZIP = "https://github.com/hourglazlabs-x/havyn/releases/download/shelf/HAVYN-shelf-phone.zip";
  function shelfHave(it) { return LIB.find((x) => typeOf(x) === "pdf" && (x.shelf === it.id || x.file === it.file)) || null; }
  const shelfSize = (it) => { const i = Shelf.info(it); return i ? i.size : it.size || 0; };
  const Shelf = {
    idx: null, state: "idle", reason: "", built: "", loading: null, busy: false, stop: false, done: 0, total: 0, cur: "", got: 0, need: 0, base: 0, ok: 0, failed: [], t0: 0,
    load() {
      if (this.state !== "idle") return this.loading || Promise.resolve();
      return (this.loading = this.load1());
    },
    async load1() {
      this.state = "checking";
      try {
        const r = await fetch("./shelf/index.json", { cache: "no-store" });
        if (!r.ok) throw new Error("HTTP " + r.status);
        const j = await r.json();
        this.idx = new Map((j.items || []).filter((x) => x && x.id && x.file).map((x) => [x.id, x]));
        this.built = j.built || ""; this.state = this.idx.size ? "ready" : "absent";
        this.reason = this.idx.size ? "" : "missing";
      } catch (e) { this.idx = null; this.state = "absent"; this.reason = navigator.onLine === false || (e && e.name === "TypeError") ? "offline" : "missing"; }
      if ($("#shelf") || $("#ready")) render();
    },
    info(it) { return this.idx ? this.idx.get(it.id) || null : null; },
    served(it) { return !!this.info(it); },
    todo(list) { return list.filter((it) => this.served(it) && !shelfHave(it)); },
    async fetchOne(it, info) {
      const res = await fetch("./shelf/" + encodeURIComponent(info.file), { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      let blob;
      if (res.body && res.body.getReader) {
        const rd = res.body.getReader(), chunks = []; let got = 0;
        for (;;) {
          const { done, value } = await rd.read(); if (done) break;
          chunks.push(value); got += value.length; this.got = got; this.paint();
          if (this.stop) { try { rd.cancel(); } catch (e) {} throw Object.assign(new Error("Stopped"), { name: "Stop" }); }
        }
        blob = new Blob(chunks, { type: "application/pdf" });
      } else blob = await res.blob();
      if (info.size && blob.size !== info.size) throw new Error("the download was incomplete");
      if (info.sha256 && window.crypto && crypto.subtle) {
        const h = new Uint8Array(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()));
        if (Array.from(h, (b) => b.toString(16).padStart(2, "0")).join("") !== info.sha256) throw new Error("its checksum didn't match");
      }
      return new File([blob], info.file, { type: "application/pdf" });
    },
    async get(list, opt) {
      opt = opt || {};
      if (this.busy) return;
      list = this.todo(list);
      if (!list.length) { if (!opt.quiet) toast("Already on this phone"); return; }
      const need = list.reduce((a, it) => a + shelfSize(it), 0);
      if (!(await roomFor(need))) { toast("Not enough space on this phone for " + sz(need)); return; }
      Object.assign(this, { busy: true, stop: false, done: 0, total: list.length, need, base: 0, ok: 0, failed: [], t0: Date.now() });
      Wake.on(); requestPersist(); this.paint();
      for (const it of list) {
        if (this.stop) break;
        const info = this.info(it); this.cur = it.t; this.got = 0; this.paint();
        try { const f = await this.fetchOne(it, info); if (await addPdf(f, () => {}, { name: it.t, shelf: it.id })) { this.ok++; await saveLib(); } }
        catch (e) { if (e && e.name === "Stop") break; this.failed.push(it.t + " (" + (e && e.message ? e.message : "failed") + ")"); }
        this.done++; this.base += info.size || 0; this.got = 0;
      }
      this.busy = false; this.cur = "";
      if (!document.body.classList.contains("em") && !Everything.busy) Wake.off();
      if (this.ok) Snd.chime("save");
      if (!opt.quiet) toast(this.ok ? (this.ok === 1 ? "1 document saved on this phone" : this.ok + " documents saved on this phone") + (this.failed.length ? "; " + this.failed.length + " didn't download" : "") : this.stop ? "Stopped" : "Nothing downloaded");
      PdfIndex.kick(); render();
    },
    pct() { return this.need ? Math.min(100, Math.round(((this.base + this.got) / this.need) * 100)) : 0; },
    msg() {
      if (this.busy) return "Downloading " + Math.min(this.done + 1, this.total) + " of " + this.total + ": " + this.cur + " · " + this.pct() + "%" + Arc.eta.call(this) + ". Keep HAVYN open; the screen stays on.";
      return this.failed.length ? "Didn't download: " + this.failed.join("; ") + ". Try again later; if it keeps failing, use the publisher's link." : "";
    },
    paint() {
      const bar = $("#shbar"), msg = $("#shmsg"), stop = $("#shstop");
      if (bar) { bar.classList.toggle("hide", !this.busy); bar.firstElementChild.style.width = this.pct() + "%"; }
      if (stop) stop.classList.toggle("hide", !this.busy);
      if (msg) msg.textContent = this.msg();
      $$("[data-shget]").forEach((b) => { b.disabled = this.busy || Arc.busy; });
      if (typeof Ready !== "undefined") Ready.paint();
    },
    mount() { if (this.state === "absent" && this.reason === "offline" && navigator.onLine !== false) this.state = "idle"; if (this.state === "idle") this.load(); else this.paint(); }
  };
  /* ---------------- SHA-256 that can stop and resume (FIPS 180-4) ----------------
     crypto.subtle can only hash a whole file held in memory; a 2 GB archive is hashed as it arrives instead, and the
     state is saved with each stored part so the check survives an interrupted download or a closed app. */
  const K256 = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);
  class Sha256 {
    constructor() { this.h = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]); this.buf = new Uint8Array(64); this.bl = 0; this.len = 0; this.w = new Int32Array(64); }
    block(p, o) {
      const w = this.w, h = this.h;
      for (let i = 0; i < 16; i++, o += 4) w[i] = (p[o] << 24) | (p[o + 1] << 16) | (p[o + 2] << 8) | p[o + 3];
      for (let i = 16; i < 64; i++) {
        const a = w[i - 15], b = w[i - 2];
        w[i] = (w[i - 16] + (((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3)) + w[i - 7] + (((b >>> 17) | (b << 15)) ^ ((b >>> 19) | (b << 13)) ^ (b >>> 10))) | 0;
      }
      let A = h[0] | 0, B = h[1] | 0, Cc = h[2] | 0, D = h[3] | 0, Ee = h[4] | 0, F = h[5] | 0, G = h[6] | 0, H = h[7] | 0;
      for (let i = 0; i < 64; i++) {
        const t1 = (H + (((Ee >>> 6) | (Ee << 26)) ^ ((Ee >>> 11) | (Ee << 21)) ^ ((Ee >>> 25) | (Ee << 7))) + ((Ee & F) ^ (~Ee & G)) + K256[i] + w[i]) | 0;
        const t2 = ((((A >>> 2) | (A << 30)) ^ ((A >>> 13) | (A << 19)) ^ ((A >>> 22) | (A << 10))) + ((A & B) ^ (A & Cc) ^ (B & Cc))) | 0;
        H = G; G = F; F = Ee; Ee = (D + t1) | 0; D = Cc; Cc = B; B = A; A = (t1 + t2) | 0;
      }
      h[0] += A; h[1] += B; h[2] += Cc; h[3] += D; h[4] += Ee; h[5] += F; h[6] += G; h[7] += H;
    }
    update(d) {
      let i = 0; const n = d.length; this.len += n;
      if (this.bl) { const k = Math.min(64 - this.bl, n); this.buf.set(d.subarray(0, k), this.bl); this.bl += k; i = k; if (this.bl === 64) { this.block(this.buf, 0); this.bl = 0; } }
      for (; i + 64 <= n; i += 64) this.block(d, i);
      if (i < n) { this.buf.set(d.subarray(i), 0); this.bl = n - i; }
      return this;
    }
    hex() {
      const t = new Uint8Array(this.bl < 56 ? 64 : 128); t.set(this.buf.subarray(0, this.bl)); t[this.bl] = 0x80;
      const bits = this.len * 8, hi = Math.floor(bits / 4294967296), lo = bits % 4294967296, e = t.length;
      t[e - 8] = hi >>> 24; t[e - 7] = (hi >>> 16) & 255; t[e - 6] = (hi >>> 8) & 255; t[e - 5] = hi & 255;
      t[e - 4] = lo >>> 24; t[e - 3] = (lo >>> 16) & 255; t[e - 2] = (lo >>> 8) & 255; t[e - 1] = lo & 255;
      const x = new Sha256(); x.h.set(this.h);
      for (let o = 0; o < e; o += 64) x.block(t, o);
      return Array.from(x.h, (v) => v.toString(16).padStart(8, "0")).join("");
    }
    save() { return { h: Array.from(this.h), b: Array.from(this.buf.subarray(0, this.bl)), n: this.len }; }
    static load(s) { const x = new Sha256(); if (s) { x.h.set(s.h); x.buf.set(s.b); x.bl = s.b.length; x.len = s.n; } return x; }
  }
  // MD5, incremental and resumable like Sha256: checks a ZIM file against the checksum written inside it (its last 16 bytes
  // are the MD5 of everything before them). Used when Kiwix's own SHA-256 for the file can't be fetched.
  const MD5K = [0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501, 0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8, 0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70, 0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1, 0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391].map((v) => v | 0);
  const MD5S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
  class Md5 {
    constructor() { this.h = new Int32Array([0x67452301, 0xefcdab89 | 0, 0x98badcfe | 0, 0x10325476]); this.buf = new Uint8Array(64); this.bl = 0; this.len = 0; this.x = new Int32Array(16); }
    block(p, o) {
      const X = this.x, h = this.h;
      for (let i = 0; i < 16; i++, o += 4) X[i] = p[o] | (p[o + 1] << 8) | (p[o + 2] << 16) | (p[o + 3] << 24);
      let a = h[0], b = h[1], c = h[2], d = h[3];
      for (let i = 0; i < 64; i++) {
        let f, g;
        if (i < 16) { f = (b & c) | (~b & d); g = i; } else if (i < 32) { f = (d & b) | (~d & c); g = (5 * i + 1) & 15; }
        else if (i < 48) { f = b ^ c ^ d; g = (3 * i + 5) & 15; } else { f = c ^ (b | ~d); g = (7 * i) & 15; }
        const t = d, x = (a + f + MD5K[i] + X[g]) | 0, r = MD5S[(i >> 4) * 4 + (i & 3)];
        d = c; c = b; b = (b + ((x << r) | (x >>> (32 - r)))) | 0; a = t;
      }
      h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
    }
    update(d) { return Sha256.prototype.update.call(this, d); }
    hex() {
      const t = new Uint8Array(this.bl < 56 ? 64 : 128); t.set(this.buf.subarray(0, this.bl)); t[this.bl] = 0x80;
      const bits = this.len * 8, e = t.length; let lo = bits % 4294967296, hi = Math.floor(bits / 4294967296);
      for (let i = 0; i < 4; i++) { t[e - 8 + i] = lo & 255; lo = Math.floor(lo / 256); t[e - 4 + i] = hi & 255; hi = Math.floor(hi / 256); }
      const x = new Md5(); x.h.set(this.h);
      for (let o = 0; o < e; o += 64) x.block(t, o);
      return Array.from(new Uint8Array(x.h.buffer), (v) => v.toString(16).padStart(2, "0")).join("");
    }
    save() { return { h: Array.from(this.h), b: Array.from(this.buf.subarray(0, this.bl)), n: this.len, md5: 1 }; }
    static load(s) { const x = new Md5(); if (s) { x.h.set(s.h); x.buf.set(s.b); x.bl = s.b.length; x.len = s.n; } return x; }
  }
  const hasher = (st) => (st.algo === "md5" ? Md5 : Sha256).load(st.h);

  // An archive downloaded in parts is stored as {parts: [keys], size}; one added from Files is a single Blob. Either opens as one Blob.
  async function archiveBlob(id) {
    const v = await Store.get("zim:" + id);
    if (v && Array.isArray(v.parts)) {
      const bs = [];
      for (const k of v.parts) { const b = await Store.get(k); if (!b) throw new Error("Part of this archive is missing on this phone. Delete it and get it again."); bs.push(b); }
      return new Blob(bs);
    }
    return v;
  }

  /* ---------------- ARCHIVES: Kiwix archives straight into HAVYN ----------------
     Kiwix's own mirror (mirror.download.kiwix.org) lets web pages download its archives. HAVYN streams each one into the
     phone's storage in 32 MB parts, checks it against Kiwix's published SHA-256 as it arrives, and carries on from the last
     stored part if the connection drops or the app is closed. The links come from HAVYN's own address (shelf/archives.json,
     refreshed with each deploy); if a link has gone stale, HAVYN looks up the newest file in Kiwix's library itself. */
  const coreArchives = () => C.archive.items.filter((i) => i.tier === "phone" && i.core && i.get && i.get.zim);
  const KIWIX = { mirror: "https://mirror.download.kiwix.org/zim/", list: "https://download.kiwix.org/zim/" };
  const stopErr = () => Object.assign(new Error("Stopped"), { name: "Stop" });
  const pause = (ms) => new Promise((r) => setTimeout(r, ms));
  const Arc = {
    idx: null, state: "idle", built: "", loading: null, busy: false, stop: false, done: 0, total: 0, cur: "", got: 0, need: 0, base: 0, ok: 0, failed: [], t0: 0, b0: 0,
    PART: 32 * 1024 * 1024,
    load() {
      if (this.state !== "idle") return this.loading || Promise.resolve();
      this.state = "checking";
      return (this.loading = (async () => {
        try {
          const r = await fetch("./shelf/archives.json", { cache: "no-store" });
          if (!r.ok) throw new Error("HTTP " + r.status);
          const j = await r.json();
          this.idx = new Map((j.items || []).filter((x) => x && x.id && x.url && x.size).map((x) => [x.id, x]));
          this.built = j.built || "";
          if (j.mirror) KIWIX.mirror = j.mirror; if (j.list) KIWIX.list = j.list;   // the deploy can point at another Kiwix base (the CSP still limits where)
        } catch (e) { this.idx = new Map(); }
        this.state = "ready";   // even without the list: each archive can still be looked up in Kiwix's library when you tap Get
        if ($("#arc") || $("#ready")) render();
      })());
    },
    info(it) { return this.idx ? this.idx.get(it.id) || null : null; },
    can(it) { return !!(it && it.get && it.get.zim && it.get.stem) && !PREVIEW; },
    todo(list) { return list.filter((it) => this.can(it) && !haveOnPhone(it)); },
    size(it) { const i = this.info(it); return i ? i.size : it.size || 0; },
    // Look up the newest copy in Kiwix's library (used when HAVYN's own list is missing or out of date).
    async resolve(it) {
      const d = it.get.zim, stem = it.get.stem;
      const html = await (await fetch(KIWIX.list + d + "/", { cache: "no-store", credentials: "omit" })).text();
      const re = new RegExp('href="(' + stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + '_\\d{4}-\\d{2}\\.zim)"', "g");
      const names = Array.from(new Set(Array.from(html.matchAll(re), (m) => m[1]))).sort();
      if (!names.length) throw new Error("Kiwix's library doesn't list it right now");
      const file = names[names.length - 1], url = KIWIX.mirror + d + "/" + file;
      const r = await fetch(url, { headers: { Range: "bytes=0-0" }, cache: "no-store", credentials: "omit" });
      const total = +(String(r.headers.get("Content-Range") || "").split("/")[1] || 0); try { await r.body.cancel(); } catch (e) {}
      if (!total) throw new Error("Kiwix's mirror didn't say how big it is");
      let sha256 = "";
      // Kiwix publishes the SHA-256 beside each file in its directory (the mirror host doesn't); without it, the ZIM's own MD5 is checked.
      try { const r2 = await fetch(KIWIX.list + d + "/" + file + ".sha256", { cache: "no-store", credentials: "omit" }); const m = r2.ok ? /^[0-9a-f]{64}/i.exec((await r2.text()).trim()) : null; if (m) sha256 = m[0].toLowerCase(); } catch (e) {}
      const info = { id: it.id, file, url, size: total, sha256 };
      if (this.idx) this.idx.set(it.id, info);
      return info;
    },
    async getOne(it) {
      let info = this.info(it);
      if (!info) info = await this.resolve(it);
      const key = "zdl:" + it.id;
      let st = await Store.get(key);
      const fresh = async () => { if (st && st.parts) for (const k of st.parts) await Store.del(k); st = { file: info.file, url: info.url, size: info.size, sha256: info.sha256 || "", algo: info.sha256 ? "sha256" : "md5", uid: uid(), parts: [], have: 0, h: null }; await Store.set(key, st); };
      if (!st || st.file !== info.file || st.size !== info.size) await fresh();
      if (!(await roomFor(st.size - st.have))) throw new Error("not enough space on this phone (needs " + sz(st.size - st.have) + ")");
      if (!st.algo) st.algo = st.sha256 ? "sha256" : "md5";
      let hash = hasher(st), tries = 0, relooked = false, buf = [], bl = 0;
      // SHA-256 covers the whole file; the ZIM's own MD5 covers all but its last 16 bytes (the checksum itself).
      const feed = (v, at) => { if (st.algo !== "md5") return hash.update(v); const n = Math.min(v.length, st.size - 16 - at); if (n > 0) hash.update(n === v.length ? v : v.subarray(0, n)); };
      // Whatever has arrived is kept, even when the connection drops or you tap Stop: the next request carries on from the
      // last byte saved. (Each part is in order and the checksum state is saved with it.)
      const commit = async () => {
        if (!bl) return;
        const k = "zpart:" + st.uid + ":" + st.parts.length;
        if (!(await Store.set(k, new Blob(buf)))) throw new Error("couldn't save on this phone (out of space?)");
        st.parts.push(k); st.have += bl; st.h = hash.save(); buf = []; bl = 0;
        await Store.set(key, st);
      };
      this.got = st.have; this.paint();
      while (st.have < st.size) {
        if (this.stop) throw stopErr();
        buf = []; bl = 0;
        try {
          const res = await fetch(st.url, { headers: st.have ? { Range: "bytes=" + st.have + "-" } : {}, cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer" });
          if (res.status === 404 && !relooked) { relooked = true; info = await this.resolve(it); if (info.file !== st.file || info.size !== st.size) await fresh(); else st.url = info.url; hash = hasher(st); continue; }
          if (!res.ok) throw new Error("HTTP " + res.status);
          const from = res.status === 206 ? +((/bytes (\d+)-/.exec(res.headers.get("Content-Range") || "") || [])[1]) : 0;
          if (st.have && (res.status !== 206 || from !== st.have)) { try { await res.body.cancel(); } catch (e) {} await fresh(); hash = hasher(st); continue; }   // the server didn't carry on from where we were: start over
          const rd = res.body.getReader();
          for (;;) {
            const { done, value } = await rd.read();
            if (value && value.length) { feed(value, st.have + bl); buf.push(value); bl += value.length; this.got = st.have + bl; this.paint(); }
            if (bl >= this.PART || done) await commit();
            if (done) break;
            if (this.stop) { try { await rd.cancel(); } catch (e) {} await commit(); throw stopErr(); }
          }
          if (st.have > st.size) throw new Error("the download was bigger than expected");
          if (st.have < st.size) throw new Error("the connection closed early");
          tries = 0;
        } catch (e) {
          if (e && e.name === "Stop") throw e;
          try { await commit(); } catch (e2) { buf = []; bl = 0; hash = hasher(st); }
          this.got = st.have; this.paint();
          if (++tries > 5 || navigator.onLine === false) throw e;
          await pause(2500 * tries);
        }
      }
      // Open it from the stored parts (read back from storage: no copy, nothing held in memory) and check it.
      const blob = await archiveBlob.fromParts(st.parts);
      let want = st.sha256;
      if (st.algo === "md5") {
        const tail = new Uint8Array(await blob.slice(Math.max(0, st.size - 16), st.size).arrayBuffer()), head = new DataView(await blob.slice(72, 80).arrayBuffer());
        const pos = head.getUint32(0, true) + head.getUint32(4, true) * 4294967296;
        want = pos === st.size - 16 ? Array.from(tail, (v) => v.toString(16).padStart(2, "0")).join("") : "";   // an old ZIM without a checksum can't be checked
      }
      if (want && hash.hex() !== want) {
        for (const k of st.parts) await Store.del(k); await Store.del(key);
        throw new Error(st.algo === "md5" ? "it arrived damaged (its built-in checksum didn't match), so it was deleted (try again)" : "its checksum didn't match Kiwix's, so it was deleted (try again)");
      }
      const Z = await ZR.lib(), a = await Z.Archive.open(blob), zi = await a.info();
      let fav = ""; try { const f = await a.favicon(); if (f) fav = await toDataUrl(f); } catch (e) {}
      if (LIB.some((x) => typeOf(x) === "zim" && x.uuid === zi.uuid)) { for (const k of st.parts) await Store.del(k); await Store.del(key); return false; }
      await Store.set("zim:" + st.uid, { parts: st.parts, size: st.size, file: st.file, sha256: st.sha256 });
      LIB.push({ id: st.uid, type: "zim", name: zi.title, file: st.file, size: st.size, added: now(), uuid: zi.uuid, date: zi.date, lang: zi.language, desc: zi.description,
        articles: zi.articles, media: zi.media, main: zi.main, mainTitle: zi.mainTitle, fav, needsScripts: zi.needsScripts, search: zi.titleSearch, flavour: zi.flavour, zname: zi.name, creator: zi.creator,
        from: "kiwix", catalog: it.id, verified: !!want, check: want ? st.algo : "" });
      await saveLib(); await Store.del(key);
      return true;
    },
    async get(list, opt) {
      opt = opt || {};
      if (this.busy) return;
      list = this.todo(list);
      if (!list.length) { if (!opt.quiet) toast("Already on this phone"); return; }
      const need = list.reduce((a, it) => a + this.size(it), 0);
      if (!(await roomFor(need))) { toast("Not enough space on this phone for " + sz(need)); return; }
      Object.assign(this, { busy: true, stop: false, done: 0, total: list.length, need, base: 0, ok: 0, failed: [], t0: Date.now(), b0: 0 });
      Wake.on(); requestPersist(); this.paint();
      for (const it of list) {
        if (this.stop) break;
        this.cur = it.t; this.got = 0; this.paint();
        try { if (await this.getOne(it)) this.ok++; }
        catch (e) { if (e && e.name === "Stop") break; this.failed.push(it.t + " (" + (e && e.message ? e.message : "failed") + ")"); }
        this.done++; this.base += this.size(it); this.got = 0;
      }
      this.busy = false; this.cur = "";
      if (!document.body.classList.contains("em") && !Everything.busy) Wake.off();
      if (this.ok) Snd.chime("save");
      if (!opt.quiet) toast(this.ok ? (this.ok === 1 ? "1 archive saved on this phone" : this.ok + " archives saved on this phone") + (this.failed.length ? "; " + this.failed.length + " didn't finish" : "") : this.stop ? "Stopped. Tap Get again to carry on from where it stopped." : this.failed.length ? "Didn't finish: " + this.failed[0] : "Nothing downloaded");
      render();
    },
    pct() { return this.need ? Math.min(100, Math.round(((this.base + this.got) / this.need) * 100)) : 0; },
    eta() {
      const el = (Date.now() - this.t0) / 1000, gotNow = this.base + this.got; if (el < 8 || !gotNow) return "";
      const rate = gotNow / el, left = (this.need - gotNow) / Math.max(rate, 1);
      return left > 90 ? " · about " + Math.round(left / 60) + " min left" : left > 5 ? " · under 2 min left" : "";
    },
    msg() {
      if (this.busy) return "Downloading " + Math.min(this.done + 1, this.total) + " of " + this.total + ": " + this.cur + " · " + sz(this.base + this.got) + " of " + sz(this.need) + this.eta() + ". Keep HAVYN open; the screen stays on.";
      return this.failed.length ? "Didn't finish: " + this.failed.join("; ") + ". Tap Get again on Wi-Fi: it carries on from where it stopped." : "";
    },
    paint() {
      const bar = $("#arcbar"), msg = $("#arcmsg"), stop = $("#arcstop");
      if (bar) { bar.classList.toggle("hide", !this.busy); bar.firstElementChild.style.width = this.pct() + "%"; }
      if (msg) msg.textContent = this.msg();
      if (stop) stop.classList.toggle("hide", !this.busy);
      $$("[data-arcget]").forEach((b) => { b.disabled = this.busy || Shelf.busy; });
      Ready.paint();
    },
    mount() { if (this.state === "idle") this.load(); else this.paint(); }
  };
  archiveBlob.fromParts = async (keys) => { const bs = []; for (const k of keys) { const b = await Store.get(k); if (!b) throw new Error("a stored part is missing"); bs.push(b); } return new Blob(bs); };
  // Stored downloads that never finished (app closed mid-way): how far each got, for "carry on" buttons.
  async function arcPartial(it) { const st = await Store.get("zdl:" + it.id); return st && st.size ? st.have / st.size : 0; }

  /* ---------------- MAPS: offline street maps, the places that matter in an emergency, and your family's spots ----------------
     Map packs (PMTiles cut from OpenStreetMap by the Maps workflow) download from HAVYN's own address into this phone's
     storage in 32 MB parts (resumable, SHA-256 checked) and are read where they lie, a few kilobytes at a time. MapLibre GL
     draws them in the HAVYN Night style, one copy of the style per pack, least detailed at the bottom: each more detailed
     pack covers its own area with solid land, so the statewide map shows only where the street-level one has nothing. Emergency places and place names ship with the app
     (maps/places.json, OpenStreetMap, ODbL). GPS needs no signal; nothing here needs the internet once the packs are saved. */
  let MAPS = [];   // installed packs: {id, uid, name, sub, file, size, sha256, data, bbox, maxzoom, center, zoom, parts, added}
  const KM_MI = 0.621371;
  const MAPK = {   // kinds of place: label, colour, icon
    er: ["Emergency room", "#ff4d5e", "cross"], hospital: ["Hospital", "#ff7f91", "cross"], urgent: ["Urgent care", "#ff9f5a", "plus"],
    fire: ["Fire station", "#ff6a3d", "flame"], police: ["Police", "#6f95ff", "people"], pharmacy: ["Pharmacy", "#3de58e", "pill"],
    aed: ["AED", "#ffd23d", "heart"], water: ["Drinking water", "#4fc3ff", "drop"], fuel: ["Fuel", "#b48cff", "gas"],
    home: ["Home", "#6ff3ff", "home"], meet1: ["Meeting place 1", "#6ff3ff", "pin"], meet2: ["Meeting place 2", "#6ff3ff", "pin"], meet3: ["Meeting place 3", "#6ff3ff", "pin"],
    work: ["Work", "#6ff3ff", "pin"], school: ["School", "#6ff3ff", "pin"], spot: ["Saved spot", "#6ff3ff", "pin"]
  };
  const MAPCHIPS = [["er", "ER"], ["urgent", "Urgent care"], ["fire", "Fire"], ["police", "Police"], ["pharmacy", "Pharmacy"], ["aed", "AED"], ["water", "Water"], ["fuel", "Fuel"]];
  const havKm = (a, b) => { const R = 6371, r = Math.PI / 180, dLa = (b[1] - a[1]) * r, dLo = (b[0] - a[0]) * r, s = Math.sin(dLa / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(s)); };
  const bearing = (a, b) => { const r = Math.PI / 180, y = Math.sin((b[0] - a[0]) * r) * Math.cos(b[1] * r), x = Math.cos(a[1] * r) * Math.sin(b[1] * r) - Math.sin(a[1] * r) * Math.cos(b[1] * r) * Math.cos((b[0] - a[0]) * r); return (Math.atan2(y, x) / r + 360) % 360; };
  const compass = (deg) => ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(deg / 45) % 8];
  const miles = (km) => { const m = km * KM_MI; return m < 0.1 ? Math.round(m * 5280 / 10) * 10 + " ft" : m < 10 ? m.toFixed(1) + " mi" : Math.round(m) + " mi"; };
  const tileBox = (z, x, y) => { const n = 2 ** z, lon = (v) => v / n * 360 - 180, lat = (v) => Math.atan(Math.sinh(Math.PI * (1 - 2 * v / n))) * 180 / Math.PI; return [lon(x), lat(y + 1), lon(x + 1), lat(y)]; };
  const boxHit = (a, b) => a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
  const inBox = (p, b) => p[0] >= b[0] && p[0] <= b[2] && p[1] >= b[1] && p[1] <= b[3];

  // Map packs: what HAVYN's address offers (maps/packs/index.json, from the deploy) and what this phone holds.
  const MapPk = {
    idx: null, why: "", state: "idle", loading: null, busy: false, stop: false, cur: "", got: 0, need: 0, base: 0, failed: [], t0: 0, PART: 32 * 1024 * 1024,
    load() {
      if (this.state !== "idle") return this.loading || Promise.resolve();
      this.state = "checking";
      return (this.loading = (async () => {
        try { const r = await fetch("./maps/packs/index.json", { cache: "no-store" }); if (!r.ok) throw new Error("HTTP " + r.status); this.idx = ((await r.json()).packs || []).filter((p) => p && p.id && p.file && p.size && p.sha256); this.why = ""; }
        catch (e) { this.idx = null; this.why = navigator.onLine === false || e instanceof TypeError ? "offline" : "missing"; }
        this.state = "ready"; if (route.path === "map" || $("#ready")) render();
      })());
    },
    have(id) { return MAPS.find((m) => m.id === id) || null; },
    list() { return this.idx || []; },
    todo() { return this.list().filter((p) => !this.have(p.id)); },
    newer(p) { const m = this.have(p.id); return !!(m && m.sha256 !== p.sha256 && p.data > (m.data || "")); },
    size(list) { return (list || this.todo()).reduce((a, p) => a + p.size, 0); },
    async getOne(p) {
      const key = "mdl:" + p.id, url = "./maps/packs/" + encodeURIComponent(p.file);
      let st = await Store.get(key);
      const fresh = async () => { if (st && st.parts) for (const k of st.parts) await Store.del(k); st = { file: p.file, size: p.size, sha256: p.sha256, uid: uid(), parts: [], have: 0, h: null }; await Store.set(key, st); };
      if (!st || st.file !== p.file || st.size !== p.size) await fresh();
      if (!(await roomFor(st.size - st.have))) throw new Error("not enough space on this phone (needs " + sz(st.size - st.have) + ")");
      let hash = Sha256.load(st.h), tries = 0, buf = [], bl = 0;
      const commit = async () => {
        if (!bl) return;
        const k = "mpart:" + st.uid + ":" + st.parts.length;
        if (!(await Store.set(k, new Blob(buf)))) throw new Error("couldn't save on this phone (out of space?)");
        st.parts.push(k); st.have += bl; st.h = hash.save(); buf = []; bl = 0; await Store.set(key, st);
      };
      this.got = st.have; this.paint();
      while (st.have < st.size) {
        if (this.stop) throw stopErr();
        buf = []; bl = 0;
        try {
          const res = await fetch(url, { headers: st.have ? { Range: "bytes=" + st.have + "-" } : {}, cache: "no-store" });
          if (!res.ok) throw new Error("HTTP " + res.status);
          const from = res.status === 206 ? +((/bytes (\d+)-/.exec(res.headers.get("Content-Range") || "") || [])[1]) : 0;
          if (st.have && (res.status !== 206 || from !== st.have)) { try { await res.body.cancel(); } catch (e) {} await fresh(); hash = Sha256.load(null); continue; }
          const rd = res.body.getReader();
          for (;;) {
            const { done, value } = await rd.read();
            if (value && value.length) { hash.update(value); buf.push(value); bl += value.length; this.got = st.have + bl; this.paint(); }
            if (bl >= this.PART || done) await commit();
            if (done) break;
            if (this.stop) { try { await rd.cancel(); } catch (e) {} await commit(); throw stopErr(); }
          }
          if (st.have !== st.size) throw new Error(st.have > st.size ? "the download was bigger than expected" : "the connection closed early");
          tries = 0;
        } catch (e) {
          if (e && e.name === "Stop") throw e;
          try { await commit(); } catch (e2) { buf = []; bl = 0; hash = Sha256.load(st.h); }
          this.got = st.have; this.paint();
          if (++tries > 5 || navigator.onLine === false) throw e;
          await pause(2500 * tries);
        }
      }
      if (hash.hex() !== st.sha256) { for (const k of st.parts) await Store.del(k); await Store.del(key); throw new Error("it arrived damaged (its checksum didn't match), so it was deleted (try again)"); }
      const old = this.have(p.id);
      MAPS = MAPS.filter((m) => m.id !== p.id).concat([{ id: p.id, uid: st.uid, name: p.name, sub: p.sub || "", file: p.file, size: p.size, sha256: p.sha256, data: p.data || "", bbox: p.bbox, maxzoom: p.maxzoom, center: p.center, zoom: p.zoom, parts: st.parts, added: now() }]);
      await Store.set("maps", MAPS); await Store.del(key);
      if (old) for (const k of old.parts) await Store.del(k);
      MapView.reopen();
      return true;
    },
    async get(list, opt) {
      opt = opt || {};
      if (this.busy || PREVIEW) return;
      list = (list || this.todo()).filter(Boolean);
      if (!list.length) { if (!opt.quiet) toast("The maps are already on this phone"); return; }
      const need = this.size(list);
      if (!(await roomFor(need))) { toast("Not enough space on this phone for " + sz(need)); return; }
      Object.assign(this, { busy: true, stop: false, need, base: 0, got: 0, failed: [], t0: Date.now() });
      Wake.on(); requestPersist(); this.paint();
      let ok = 0;
      for (const p of list) {
        if (this.stop) break;
        this.cur = p.name; this.got = 0; this.paint();
        try { if (await this.getOne(p)) ok++; } catch (e) { if (e && e.name === "Stop") break; this.failed.push(p.name + " (" + (e && e.message ? e.message : "failed") + ")"); }
        this.base += p.size; this.got = 0;
      }
      this.busy = false; this.cur = "";
      if (!document.body.classList.contains("em") && !Everything.busy) Wake.off();
      if (ok) Snd.chime("save");
      if (!opt.quiet) toast(ok ? (ok === 1 ? "Map saved on this phone" : ok + " maps saved on this phone") + (this.failed.length ? "; " + this.failed.length + " didn't finish" : "") : this.stop ? "Stopped. Tap Get again to carry on" : "The map didn't finish: tap Get again on Wi-Fi");
      render();
    },
    async remove(id) {
      const m = this.have(id); if (!m) return;
      MAPS = MAPS.filter((x) => x.id !== id); await Store.set("maps", MAPS);
      for (const k of m.parts) await Store.del(k);
      MapView.reopen(); toast(m.name + " map removed"); render();
    },
    pct() { return this.need ? Math.min(100, Math.round(((this.base + this.got) / this.need) * 100)) : 0; },
    msg() { return this.busy ? "Downloading " + this.cur + " · " + sz(this.base + this.got) + " of " + sz(this.need) + ". Keep HAVYN open." : this.failed.length ? "Didn't finish: " + this.failed.join("; ") : ""; },
    paint() {
      const bar = $("#mapbar"), msg = $("#mapmsg");
      if (bar) { bar.classList.toggle("hide", !this.busy); bar.firstElementChild.style.width = this.pct() + "%"; }
      if (msg) msg.textContent = this.msg();
      Ready.paint();
    }
  };
  class PartSource { constructor(blob, key) { this.blob = blob; this.key = key; } getKey() { return this.key; } async getBytes(o, n) { return { data: await this.blob.slice(o, o + n).arrayBuffer() }; } }
  const loadJs = (src) => new Promise((ok, no) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => no(new Error("couldn't load " + src)); document.head.appendChild(s); });

  // The map itself. It lives outside the screen's HTML (re-drawing a screen must not tear down the map), on #mapstage.
  // An old-style filter (["in", "kind", "a", "b"]) as an expression, so it can be combined with one.
  function exprFilter(f) {
    if (!Array.isArray(f)) return f;
    const [op, a, ...v] = f;
    if (op === "all" || op === "any") return [op].concat(f.slice(1).map(exprFilter));
    if (op === "none") return ["!", ["any"].concat(f.slice(1).map(exprFilter))];
    if (typeof a !== "string") return f;   // already an expression
    const get = a === "$type" ? ["geometry-type"] : a === "$id" ? ["id"] : ["get", a];
    if (["==", "!=", "<", "<=", ">", ">="].includes(op)) return [op, get, v[0]];
    if (op === "in") return ["in", get, ["literal", v]];
    if (op === "!in") return ["!", ["in", get, ["literal", v]]];
    if (op === "has") return ["has", a];
    if (op === "!has") return ["!", ["has", a]];
    return f;
  }
  const MapView = {
    map: null, gl: null, readers: null, places: null, ready: false, err: "", me: null, meAt: 0, watch: null, sel: null, kinds: null, q: "", lp: 0, origin: null,
    async libs() {
      if (this.gl) return this.gl;
      if (!$("#maplibrecss")) { const l = document.createElement("link"); l.id = "maplibrecss"; l.rel = "stylesheet"; l.href = "./vendor/maplibre/maplibre-gl.css"; document.head.appendChild(l); }
      if (!window.maplibregl) await loadJs("./vendor/maplibre/maplibre-gl-csp.js");
      if (!window.pmtiles) await loadJs("./vendor/pmtiles/pmtiles.js");
      maplibregl.setWorkerUrl("./vendor/maplibre/maplibre-gl-csp-worker.js");
      maplibregl.addProtocol("havyn", (params, ac) => this.tile(params, ac));
      return (this.gl = maplibregl);
    },
    async data() {
      if (this.places) return this.places;
      try { const j = await (await fetch("./maps/places.json")).json(); this.places = { pois: j.pois || [], names: j.places || [], built: j.built || "" }; }
      catch (e) { this.places = { pois: [], names: [], built: "" }; }
      this.places.box = this.places.pois.reduce((a, p) => [Math.min(a[0], p[3]), Math.min(a[1], p[2]), Math.max(a[2], p[3]), Math.max(a[3], p[2])], [180, 90, -180, -90]);
      return this.places;
    },
    reopen() { this.readers = null; if (this.map) { try { this.map.remove(); } catch (e) {} this.map = null; this.ready = false; } },
    async open() {
      if (this.readers) return this.readers;
      const rs = [];
      for (const m of MAPS.slice().sort((a, b) => b.maxzoom - a.maxzoom)) {
        try {
          const pm = new pmtiles.PMTiles(new PartSource(await archiveBlob.fromParts(m.parts), "havyn-" + m.uid)), h = await pm.getHeader();
          rs.push({ m, pm, minZ: h.minZoom, maxZ: h.maxZoom, b: [h.minLon, h.minLat, h.maxLon, h.maxLat] });
        } catch (e) { this.err = m.name + ": " + (e.message || e); }
      }
      return (this.readers = rs);
    },
    async tile(params, ac) {
      const g = /^havyn:\/\/glyphs\/(.+)\/(\d+-\d+)$/.exec(params.url); if (g) return this.glyph(decodeURIComponent(g[1]), g[2], ac);
      const t = /^havyn:\/\/([\w-]+)\/(\d+)\/(\d+)\/(\d+)/.exec(params.url); if (!t) throw new Error("havyn: bad tile");
      const z = +t[2], x = +t[3], y = +t[4], r = (await this.open()).find((q) => q.m.id === t[1]);
      if (r && z >= r.minZ && z <= r.maxZ && boxHit(tileBox(z, x, y), r.b)) { const res = await r.pm.getZxy(z, x, y, ac && ac.signal); if (res && res.data) return { data: res.data }; }
      return { data: new ArrayBuffer(0) };   // nothing here in this pack: the pack below shows through
    },
    // Label glyphs come from HAVYN's own copy. A range it doesn't ship (an emoji, a script nobody here uses) is answered
    // with nothing, without a request: those few characters are left out and everything else draws.
    async glyph(stack, range, ac) {
      const have = this.glyphs, f = stack.split(",").map((x) => x.trim()).find((x) => !have || (have[x] && have[x].includes(range)));
      if (f) {
        try { const r = await fetch("./maps/fonts/" + encodeURIComponent(f) + "/" + range + ".pbf", { signal: ac && ac.signal }); if (r.ok) return { data: await r.arrayBuffer() }; }
        catch (e) { if (e && e.name === "AbortError") throw e; }
      }
      return { data: new ArrayBuffer(0) };
    },
    // The stored area plus a margin, stretched to the screen's shape: the map doesn't pan off into places it has nothing
    // for, and zoomed all the way out the whole area fits the screen, portrait or landscape.
    bounds() {
      const b = MAPS.reduce((a, m) => [Math.min(a[0], m.bbox[0]), Math.min(a[1], m.bbox[1]), Math.max(a[2], m.bbox[2]), Math.max(a[3], m.bbox[3])], [180, 90, -180, -90]);
      const my = (lat) => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) * 180 / Math.PI, iy = (y) => Math.atan(Math.exp(y * Math.PI / 180)) * 360 / Math.PI - 90;
      const el = $("#mapgl"), want = ((el && el.clientWidth) || 390) / ((el && el.clientHeight) || 844);
      let x0 = b[0], x1 = b[2], y0 = my(b[1]), y1 = my(b[3]);
      const px = (x1 - x0) * 0.15, py = (y1 - y0) * 0.15, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      x0 -= px; x1 += px; y0 -= py; y1 += py;
      if ((x1 - x0) / (y1 - y0) < want) { const h = (y1 - y0) * want / 2; x0 = cx - h; x1 = cx + h; } else { const h = (x1 - x0) / want / 2; y0 = cy - h; y1 = cy + h; }
      return [[Math.max(-180, x0), Math.max(-85, iy(y0))], [Math.min(180, x1), Math.min(85, iy(y1))]];
    },
    outside() { const P = this.places; return !!(this.me && P && P.pois.length && !inBox(this.me.at, P.box)); },
    async style() {
      const s = await (await fetch("./maps/style.json")).json(), base = new URL("./", location.href).href, layers = [];
      this.glyphs = (s.metadata && s.metadata["havyn:glyphs"]) || null;
      s.glyphs = "havyn://glyphs/{fontstack}/{range}"; s.sprite = base + "maps/sprites/dark"; s.sources = {};
      // One copy of the style per pack, least detailed first: a more detailed pack only asks for tiles in its own area,
      // and its land covers what's below. Every pack's land, water and roads come first, then HAVYN's markers, then all
      // the labels, so town and street names stay readable over the markers. A coarser pack's labels stay out of a finer
      // pack's area, where the finer pack has its own.
      const packs = MAPS.slice().sort((a, b) => a.maxzoom - b.maxzoom), labels = [];
      packs.forEach((m, i) => {
        const src = "pk-" + m.id, finer = packs.slice(i + 1).map((q) => { const b = q.bbox; return [[[b[0], b[1]], [b[2], b[1]], [b[2], b[3]], [b[0], b[3]], [b[0], b[1]]]]; });
        s.sources[src] = Object.assign({ type: "vector", tiles: ["havyn://" + m.id + "/{z}/{x}/{y}"], minzoom: 0, maxzoom: m.maxzoom }, i ? { bounds: m.bbox } : { attribution: "© OpenStreetMap contributors · Protomaps" });
        for (const l of this.base || (this.base = s.layers)) {
          if (l.type === "background") { if (!i) layers.push(l); continue; }
          const c = Object.assign({}, l, { id: src + "-" + l.id, source: src });
          if (l.type !== "symbol") { layers.push(c); continue; }
          if (finer.length) c.filter = ["all", exprFilter(l.filter === undefined ? true : l.filter), ["!", ["within", { type: "MultiPolygon", coordinates: finer }]]];
          labels.push(c);
        }
      });
      this.slot = labels.length ? labels[0].id : undefined;   // HAVYN's markers go in just below the labels
      s.layers = layers.concat(labels);
      return s;
    },
    stage() { let st = $("#mapstage"); if (!st) { st = document.createElement("div"); st.id = "mapstage"; st.innerHTML = '<div id="mapgl"></div>'; document.body.appendChild(st); } return st; },
    show(on) { const st = $("#mapstage"); if (st) st.classList.toggle("on", !!on); document.body.classList.toggle("mapon", !!on); if (on && this.map) this.map.resize(); if (!on) this.stopGps(); },
    async mount() {
      this.stage(); this.show(true);
      if (this.map || this.busy || !MAPS.length) return;
      this.busy = true; this.err = "";
      try {
        await this.libs(); await this.data(); await this.open();
        const home = this.spot("home"), m0 = MAPS.find((m) => m.id === "phoenix") || MAPS[0];
        const map = (this.map = new maplibregl.Map({ container: "mapgl", style: await this.style(), center: home ? [home.lon, home.lat] : m0.center || [-112.07, 33.45], zoom: home ? 13 : m0.zoom || 10,
          maxBounds: this.bounds(), attributionControl: { compact: true }, maxPitch: 60, fadeDuration: 150, localIdeographFontFamily: false }));
        map.on("error", (e) => console.warn("map", String((e && e.error && e.error.message) || e)));
        map.on("styleimagemissing", (e) => { if (!map.hasImage(e.id)) map.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) }); });
        map.on("load", () => { this.layers(); this.ready = true; const s = $("#mapstate"); if (s) s.textContent = ""; });
        map.on("click", (e) => this.pick(e));
        map.on("contextmenu", (e) => this.drop(e.lngLat));
        map.on("touchstart", (e) => { clearTimeout(this.lp); if (e.points && e.points.length === 1) this.lp = setTimeout(() => this.drop(e.lngLat), 600); });
        ["touchend", "touchmove", "dragstart", "zoomstart", "rotatestart"].forEach((ev) => map.on(ev, () => clearTimeout(this.lp)));
        map.on("rotate", () => { const c = $("#mapnorth svg"); if (c) c.style.transform = "rotate(" + -map.getBearing() + "deg)"; });
        map.on("moveend", () => { if (!this.me) this.paintNear(); });
        map.on("resize", () => { try { map.setMaxBounds(this.bounds()); } catch (e) {} });
        if (PR.mapGps) this.gps(false);
      } catch (e) { this.err = (e && e.message) || "the map couldn't start"; }
      finally { this.busy = false; render(); }
    },
    spot(kind) { return L("spots").find((s) => s.kind === kind) || null; },
    shown() { return this.kinds || (this.kinds = new Set(PR.mapKinds || ["er", "urgent", "fire", "police", "pharmacy"])); },
    geo() {
      const P = this.places || { pois: [] }, on = this.shown(), f = [];
      P.pois.forEach((p, i) => { if (on.has(p[0]) || (p[0] === "hospital" && on.has("er"))) f.push({ type: "Feature", id: i, properties: { k: p[0], n: p[1], i }, geometry: { type: "Point", coordinates: [p[3], p[2]] } }); });
      return { type: "FeatureCollection", features: f };
    },
    pinGeo() { return { type: "FeatureCollection", features: (S.spots || []).map((s, i) => (s.deleted ? null : { type: "Feature", id: i, properties: { k: s.kind, n: s.name || (MAPK[s.kind] || MAPK.spot)[0], i }, geometry: { type: "Point", coordinates: [s.lon, s.lat] } })).filter(Boolean) }; },
    meGeo() {
      if (!this.me) return { type: "FeatureCollection", features: [] };
      const [lon, lat] = this.me.at, acc = Math.max(5, this.me.acc || 30), ring = [];
      for (let i = 0; i <= 48; i++) { const a = i / 48 * 2 * Math.PI; ring.push([lon + (acc / 111320 / Math.cos(lat * Math.PI / 180)) * Math.cos(a), lat + (acc / 110540) * Math.sin(a)]); }
      return { type: "FeatureCollection", features: [{ type: "Feature", properties: { t: "acc" }, geometry: { type: "Polygon", coordinates: [ring] } }, { type: "Feature", properties: { t: "me" }, geometry: { type: "Point", coordinates: [lon, lat] } }] };
    },
    async images() {
      const map = this.map, mk = (kind) => new Promise((ok) => {
        const [, col, icon] = MAPK[kind], pin = /^(home|meet|work|school|spot)/.test(kind);
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">' + (pin ? '<path d="M32 60C32 60 10 38 10 24a22 22 0 0 1 44 0c0 14-22 36-22 36z" fill="' + col + '" stroke="#03071a" stroke-width="4"/>' : '<circle cx="32" cy="32" r="26" fill="' + col + '" stroke="#03071a" stroke-width="5"/>') +
          '<g transform="translate(' + (pin ? "20 12" : "20 20") + ')" fill="none" stroke="' + (pin ? "#03071a" : "#fff") + '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">' + P[icon] + "</g></svg>";
        const im = new Image(64, 64); im.onload = () => { const c = document.createElement("canvas"); c.width = c.height = 64; c.getContext("2d").drawImage(im, 0, 0); ok([kind, c.getContext("2d").getImageData(0, 0, 64, 64)]); }; im.onerror = () => ok(null);
        im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
      });
      for (const r of await Promise.all(Object.keys(MAPK).map(mk))) if (r && !map.hasImage("hv-" + r[0])) map.addImage("hv-" + r[0], r[1], { pixelRatio: 2 });
    },
    async layers() {
      const map = this.map; await this.images();
      map.addSource("hv-pois", { type: "geojson", data: this.geo() });
      map.addSource("hv-pins", { type: "geojson", data: this.pinGeo() });
      map.addSource("hv-me", { type: "geojson", data: this.meGeo() });
      map.addLayer({ id: "hv-me-acc", type: "fill", source: "hv-me", filter: ["==", ["get", "t"], "acc"], paint: { "fill-color": "#36d6f5", "fill-opacity": 0.12, "fill-outline-color": "#36d6f5" } }, this.slot);
      // Places: ERs and hospitals at every zoom, the rest from city level. Zoomed out, a marker that would cover a
      // town's name or another marker gives way (ERs win); zoomed in, every one shows.
      const ers = ["literal", ["er", "hospital"]], poi = (id, filter, over, names, extra) => map.addLayer(Object.assign({ id, type: "symbol", source: "hv-pois", filter,
        layout: { "icon-image": ["concat", "hv-", ["get", "k"]], "icon-size": ["interpolate", ["linear"], ["zoom"], 6, 0.5, 14, 0.95], "icon-allow-overlap": ["step", ["zoom"], false, over, true], "icon-padding": 1,
          "symbol-sort-key": ["match", ["get", "k"], "er", 0, "hospital", 1, "urgent", 2, "fire", 3, "police", 4, "pharmacy", 5, "aed", 6, "water", 7, 8],
          "text-field": ["step", ["zoom"], "", names, ["get", "n"]], "text-font": ["Noto Sans Medium"], "text-size": 12, "text-offset": [0, 1.25], "text-anchor": "top", "text-optional": true, "text-max-width": 9 },
        paint: { "text-color": "#eaf6ff", "text-halo-color": "#03071a", "text-halo-width": 1.6 } }, extra), this.slot);
      poi("hv-pois", ["!", ["in", ["get", "k"], ers]], 14, 13, { minzoom: 10 });
      poi("hv-pois-er", ["in", ["get", "k"], ers], 11, 12);
      map.addLayer({ id: "hv-pins", type: "symbol", source: "hv-pins", layout: { "icon-image": ["concat", "hv-", ["get", "k"]], "icon-size": 0.9, "icon-anchor": "bottom", "icon-allow-overlap": true, "text-field": ["get", "n"], "text-font": ["Noto Sans Medium"], "text-size": 13, "text-offset": [0, 0.3], "text-anchor": "top", "text-optional": true },
        paint: { "text-color": "#bdf2ff", "text-halo-color": "#03071a", "text-halo-width": 1.8 } });
      map.addLayer({ id: "hv-me", type: "circle", source: "hv-me", filter: ["==", ["get", "t"], "me"], paint: { "circle-radius": 8, "circle-color": "#36d6f5", "circle-stroke-color": "#fff", "circle-stroke-width": 3 } });
      this.paintNear();
    },
    refresh() { if (!this.map || !this.ready) return; const s = this.map.getSource("hv-pois"), p = this.map.getSource("hv-pins"), m = this.map.getSource("hv-me"); if (s) s.setData(this.geo()); if (p) p.setData(this.pinGeo()); if (m) m.setData(this.meGeo()); },
    gps(fly) {
      if (!navigator.geolocation) { toast("This phone can't share its location"); return; }
      PR.mapGps = true; flush();
      if (this.watch !== null) { if (fly && this.me && this.map) this.map.flyTo({ center: this.me.at, zoom: Math.max(this.map.getZoom(), 14) }); return; }
      this.flyMe = fly; this.warned = false;
      this.watch = navigator.geolocation.watchPosition((p) => {
        this.me = { at: [p.coords.longitude, p.coords.latitude], acc: p.coords.accuracy, at0: now() };
        this.refresh(); this.paintNear();
        if (this.flyMe && this.map) { this.flyMe = false; this.map.flyTo({ center: this.me.at, zoom: Math.max(this.map.getZoom(), 14) }); }
      }, (e) => {
        // Only a refusal ends it. No fix for a while (indoors, a garage) is normal: the watch carries on and picks the signal back up.
        if (e.code === 1) { this.stopGps(); PR.mapGps = false; flush(); toast("Location is off for HAVYN: Settings › Privacy › Location Services"); return; }
        if (!this.me && !this.warned) { this.warned = true; toast("No GPS fix yet: try near a window or outside"); }
        if (this.me) this.paintNear();
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 30000 });
    },
    stopGps() { if (this.watch !== null) { try { navigator.geolocation.clearWatch(this.watch); } catch (e) {} this.watch = null; } },
    from() { return this.me ? this.me.at : this.map ? this.map.getCenter().toArray() : (this.spot("home") ? [this.spot("home").lon, this.spot("home").lat] : [-112.07, 33.45]); },
    near(kinds, n) {
      const P = this.places || { pois: [] }, o = this.from(), out = [];
      P.pois.forEach((p, i) => { if (kinds.includes(p[0])) out.push({ i, p, km: havKm(o, [p[3], p[2]]), deg: bearing(o, [p[3], p[2]]) }); });
      return out.sort((a, b) => a.km - b.km).slice(0, n || 5);
    },
    nearKind() { return [PR.mapNear || "er"]; },
    paintNear() { const el = $("#mapnearl"); if (el) el.innerHTML = nearHtml(); },
    pick(e) {
      const f = this.map.queryRenderedFeatures(e.point, { layers: ["hv-pins", "hv-pois-er", "hv-pois"] })[0];
      if (!f) { if (this.sel) { this.sel = null; render(); } return; }
      this.sel = f.layer.id === "hv-pins" ? { pin: f.properties.i } : { poi: f.properties.i }; render();
    },
    drop(ll) {
      if (!ll) return;
      this.sel = { drop: [ll.lng, ll.lat] }; if (navigator.vibrate) try { navigator.vibrate(15); } catch (e) {}
      render();
    },
    focus(at, z) { if (this.map) this.map.flyTo({ center: at, zoom: Math.max(this.map.getZoom(), z || 15) }); }
  };
  function nearHtml() {
    if (!MapView.places) return "";
    if (!MapView.places.pois.length) return '<p class="nearnone">' + (PREVIEW ? "The preview doesn't carry the map's places: open HAVYN from its address." : "The map's places aren't on this phone yet: open HAVYN once while online.") + "</p>";
    const k = PR.mapNear || "er", open = !!PR.mapNearOpen, L = MapView.near(MapView.nearKind(), open ? 4 : 1), old = MapView.me ? Math.floor((now() - MapView.me.at0) / 60000) : 0,
      from = MapView.me ? "from you" + (old >= 2 ? " · fix " + old + " min old" : "") + (MapView.outside() ? " · outside the map's area" : "") : MapView.spot("home") && !MapView.map ? "from home" : "from the map's center";
    return '<button class="nearhead" data-act="map-nearopen" aria-expanded="' + open + '"><b>Nearest ' + esc(k === "er" ? "ER" : MAPK[k][0].toLowerCase()) + '</b><small>' + from + ' <i>' + (open ? "▾" : "▴") + "</i></small></button>" + (k === "er" && open ? '<p class="nearnote">Hospitals OpenStreetMap lists with an emergency room. Not sure? Call 911.</p>' : "") + (L.length ? L.map((x) =>
      '<button class="nearrow" data-act="map-poi" data-i="' + x.i + '"><span class="nk" style="--k:' + MAPK[x.p[0]][1] + '">' + ic(MAPK[x.p[0]][2]) + '</span><span class="nn"><b>' + esc(x.p[1]) + "</b><small>" + esc(x.p[0] === "hospital" ? "Hospital (no ER listed)" : MAPK[x.p[0]][0]) + (x.p[4] ? " · " + esc(x.p[4]) : "") + '</small></span><span class="nd"><b>' + miles(x.km) + '</b><small><i style="transform:rotate(' + Math.round(x.deg) + 'deg)">↑</i> ' + compass(x.deg) + "</small></span></button>").join("") : '<p class="nearnone">None in the map data nearby.</p>');
  }
  function mapSheet() {
    const V = MapView, s = V.sel; if (!s) return "";
    const o = V.from(), row = (at) => { const km = havKm(o, at), d = bearing(o, at); return '<div class="msdist"><b>' + miles(km) + '</b><span><i style="transform:rotate(' + Math.round(d) + 'deg)">↑</i> ' + compass(d) + " " + (V.me ? "of you" : "of the map's center") + "</span></div>"; };
    const coords = (at) => '<button class="mscoord" data-act="map-copy" data-v="' + at[1].toFixed(5) + ", " + at[0].toFixed(5) + '">' + at[1].toFixed(5) + ", " + at[0].toFixed(5) + "<small>Copy</small></button>";
    let h = '<div class="msheet"><button class="msx" data-act="map-close" aria-label="Close">×</button>';
    if (s.poi !== undefined) {
      const p = V.places.pois[s.poi], at = [p[3], p[2]], K = MAPK[p[0]];
      h += '<div class="mshead"><span class="nk" style="--k:' + K[1] + '">' + ic(K[2]) + '</span><span><small>' + esc(p[0] === "hospital" ? "Hospital · ER not listed in the map data" : K[0]) + "</small><b>" + esc(p[1]) + "</b></span></div>" + row(at) +
        (p[4] ? '<div class="msline">' + ic("pin") + esc(p[4]) + "</div>" : "") + (p[6] ? '<div class="msline">' + ic("clock") + esc(p[6]) + "</div>" : "") + coords(at) +
        '<div class="msbtns">' + (p[5] ? '<a class="msbtn call" href="tel:' + esc(p[5].replace(/[^\d+]/g, "")) + '">' + ic("phone") + "Call</a>" : "") + '<button class="msbtn" data-act="map-fly" data-lon="' + at[0] + '" data-lat="' + at[1] + '">' + ic("search") + "Show</button></div>";
    } else if (s.pin !== undefined) {
      const p = (S.spots || [])[s.pin]; if (!p || p.deleted) return "";
      h += '<div class="mshead"><span class="nk" style="--k:#6ff3ff">' + ic("pin") + '</span><span><small>' + esc((MAPK[p.kind] || MAPK.spot)[0]) + "</small><b>" + esc(p.name || (MAPK[p.kind] || MAPK.spot)[0]) + "</b></span></div>" + row([p.lon, p.lat]) + coords([p.lon, p.lat]) +
        '<div class="msbtns"><button class="msbtn" data-act="map-fly" data-lon="' + p.lon + '" data-lat="' + p.lat + '">' + ic("search") + 'Show</button><button class="msbtn ghost" data-act="map-unpin" data-i="' + s.pin + '">Remove</button></div>';
    } else if (s.drop) {
      const at = s.drop;
      h += '<div class="mshead"><span class="nk" style="--k:#6ff3ff">' + ic("pin") + '</span><span><small>Dropped pin</small><b>Save this spot as…</b></span></div>' + row(at) + coords(at) +
        '<div class="mssave">' + [["home", "Home"], ["meet1", "Meeting place 1"], ["meet2", "Meeting place 2"], ["meet3", "Meeting place 3"], ["work", "Work"], ["school", "School"], ["spot", "Other"]].map(([k, t]) => '<button data-act="map-save" data-k="' + k + '">' + t + "</button>").join("") + "</div>";
    }
    return h + '<p class="mattr">© OpenStreetMap contributors</p></div>';
  }
  function mapRes() {
    const V = MapView; if (!V.q || !V.places) return "";
    const q = V.q.toLowerCase(), o = V.from(), res = [];
    V.places.pois.forEach((p, i) => { if (p[1].toLowerCase().includes(q)) res.push({ t: "poi", i, n: p[1], s: MAPK[p[0]][0], at: [p[3], p[2]] }); });
    V.places.names.forEach((p) => { if (p[1].toLowerCase().includes(q)) res.push({ t: "place", n: p[1], s: p[0], at: [p[3], p[2]] }); });
    (S.spots || []).forEach((p, i) => { if (!p.deleted && (p.name || "").toLowerCase().includes(q)) res.push({ t: "pin", i, n: p.name, s: (MAPK[p.kind] || MAPK.spot)[0], at: [p.lon, p.lat] }); });
    res.forEach((r) => (r.km = havKm(o, r.at)));
    res.sort((a, b) => (a.n.toLowerCase().startsWith(q) ? 0 : 1) - (b.n.toLowerCase().startsWith(q) ? 0 : 1) || a.km - b.km);
    return res.length ? res.slice(0, 8).map((r) => '<button data-act="map-go" data-t="' + r.t + '" data-i="' + (r.i === undefined ? "" : r.i) + '" data-lon="' + r.at[0] + '" data-lat="' + r.at[1] + '"><b>' + esc(r.n) + "</b><small>" + esc(r.s) + " · " + miles(r.km) + "</small></button>").join("") : '<p class="nearnone">Nothing called that in the map data.</p>';
  }
  function renderMap() {
    MapPk.load();
    const V = MapView, have = MAPS.length > 0, idx = MapPk.list(), todo = MapPk.todo(), k = route.q.k;
    if (k && MAPK[k]) { PR.mapNear = k; if (!V.shown().has(k)) { V.shown().add(k); PR.mapKinds = [...V.shown()]; } }
    if (!V.places) V.data().then(() => { if (route.path === "map") render(); });
    let h = '<div class="maphud">';
    h += '<div class="mtop"><a class="ibtn" href="#/status" aria-label="Home">' + ic("back") + '</a><label class="msearch">' + ic("search") + '<input id="mapq" type="search" placeholder="Search places, hospitals…" autocomplete="off" value="' + esc(V.q) + '"></label>' +
      '<button class="ibtn" data-act="map-packs" aria-label="Map packs">' + ic("map") + "</button></div>";
    h += '<div class="mres" id="mapres">' + mapRes() + "</div>";
    h += '<div class="mchips">' + MAPCHIPS.map(([kk, t]) => '<button class="mchip' + (V.shown().has(kk) ? " on" : "") + '" data-act="map-kind" data-k="' + kk + '" style="--k:' + MAPK[kk][1] + '"><i></i>' + t + "</button>").join("") + "</div>";
    if (have) h += '<div class="mside"><button class="ibtn" data-act="map-gps" aria-label="Show where I am">' + ic("pin") + '</button><button class="ibtn" id="mapnorth" data-act="map-north" aria-label="North up">' + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l4 9h-8z" fill="#ff5f6d"/><path d="M12 21l-4-9h8z" fill="#cfe9ff"/></svg></button></div>';
    if (!have || V.packs) {
      h += '<div class="mpacks glass"><div class="mph"><b>' + (have ? "Map packs on this phone" : "Offline maps") + "</b>" + (have ? '<button class="msx" data-act="map-packs" aria-label="Close">×</button>' : "") + "</div>" +
        (!have ? "<p>Street maps that work with no signal. GPS works without the internet too.</p>" : "") +
        (idx.length ? idx.map((p) => { const m = MapPk.have(p.id); return '<div class="mprow"><span><b>' + esc(p.name) + "</b><small>" + esc(p.sub || "") + " · " + sz(p.size) + (m ? " · saved " + esc(m.data || "") : "") + "</small></span>" +
          (m ? (MapPk.newer(p) ? '<button class="msbtn" data-act="map-get" data-id="' + p.id + '"' + (MapPk.busy ? " disabled" : "") + ">Update</button>" : '<button class="msbtn ghost" data-act="map-del" data-id="' + p.id + '">Remove</button>') :
          '<button class="msbtn" data-act="map-get" data-id="' + p.id + '"' + (MapPk.busy || PREVIEW ? " disabled" : "") + ">Get</button>") + "</div>"; }).join("") :
          '<p class="nearnone">' + (MapPk.state === "ready" ? (PREVIEW ? "The preview can't download maps: open HAVYN from its address." : MapPk.why === "offline" ? "No internet right now: map downloads need Wi-Fi. Maps already on this phone work." : "The map packs aren't on HAVYN's address yet. Try again later on Wi-Fi.") : "Checking…") + "</p>") +
        (todo.length > 1 && !MapPk.busy ? '<button class="simbtn" data-act="map-get" data-id="">' + ic("download") + "Get all maps · " + sz(MapPk.size()) + "</button>" : "") +
        '<div class="bar' + (MapPk.busy ? "" : " hide") + '" id="mapbar"><i style="width:' + MapPk.pct() + '%"></i></div><p class="mapmsg" id="mapmsg">' + esc(MapPk.msg()) + "</p>" +
        '<p class="mapcredit">Map data © OpenStreetMap contributors (ODbL), cut by Protomaps' + (idx[0] && idx[0].data ? " on " + esc(idx[0].data) : "") + ". Places: OpenStreetMap" + (V.places && V.places.built ? ", " + esc(V.places.built.slice(0, 10)) : "") + ". Check anything critical: the map can be out of date.</p></div>";
    }
    if (V.err) h += '<p class="mapmsg warn">' + esc(V.err) + "</p>";
    if (have && !V.ready && !V.err) h += '<p class="mapmsg" id="mapstate">Opening the map…</p>';
    h += V.sel ? mapSheet() : '<div class="mnear glass" id="mapnear"><div id="mapnearl">' + nearHtml() + "</div>" + (PR.mapNearOpen ? '<div class="nearkinds">' + [["er", "ER"], ["urgent", "Urgent care"], ["fire", "Fire"], ["police", "Police"], ["pharmacy", "Pharmacy"], ["aed", "AED"], ["water", "Water"]].map(([kk, t]) => '<button class="' + ((PR.mapNear || "er") === kk ? "on" : "") + '" data-act="map-near" data-k="' + kk + '">' + t + "</button>").join("") + "</div>" : "") +
      (!V.me ? '<button class="mselfloc" data-act="map-gps">' + ic("pin") + "Use my location</button>" : "") + '<p class="mattr">© OpenStreetMap contributors</p></div>';
    return h + "</div>";
  }

  /* ---------------- READY: everything this phone should hold before an emergency, and one button to get it ---------------- */
  const Everything = {
    busy: false, stop: false,
    async run(auto) {
      if (this.busy || Shelf.busy || Arc.busy || MapPk.busy || PREVIEW) return;
      this.busy = true; this.stop = false;
      if (!auto) { PR.autoGet = true; flush(); }
      try {
        Shelf.mount(); await Promise.all([Shelf.loading || Promise.resolve(), Arc.load(), MapPk.load()]);
        const sh = Shelf.state === "ready" ? Shelf.todo(C.shelf.items.filter((i) => i.ph)) : [], ar = Arc.todo(coreArchives()), mp = MapPk.todo();
        if (!sh.length && !ar.length && !mp.length) {
          if (Shelf.state === "ready" && Arc.idx && Arc.idx.size && PR.autoGet) { PR.autoGet = false; flush(); }   // all done: nothing more to carry on with
          if (!auto) toast(Shelf.state === "ready" ? "Everything is already on this phone" : "Nothing to download right now"); return;
        }
        const left = sz(sh.reduce((a, i) => a + shelfSize(i), 0) + ar.reduce((a, i) => a + Arc.size(i), 0) + MapPk.size(mp));
        if (auto) toast(PR.firstGet ? "Getting this phone ready: downloading " + left + " (best on Wi-Fi; Stop is on Status)" : "Carrying on with this phone's downloads (" + left + " left)");
        PR.firstGet = false;
        Wake.on();
        if (sh.length) await Shelf.get(sh, { quiet: true });
        if (mp.length && !this.stop && !Shelf.stop) await MapPk.get(mp, { quiet: true });
        if (ar.length && !this.stop && !Shelf.stop && !MapPk.stop) await Arc.get(ar, { quiet: true });
        const failed = Shelf.failed.length + Arc.failed.length + MapPk.failed.length;
        if (!this.stop && !Shelf.stop && !Arc.stop && !MapPk.stop) {
          if (!failed && PR.autoGet) { PR.autoGet = false; flush(); }
          toast(failed ? failed + " item" + (failed > 1 ? "s" : "") + " didn't finish: it carries on when HAVYN is open on Wi-Fi, or tap Download everything" : "This phone has everything it needs offline");
        }
      } finally { this.busy = false; if (!document.body.classList.contains("em")) Wake.off(); render(); }
    },
    halt() { this.stop = true; Shelf.stop = true; Arc.stop = true; MapPk.stop = true; if (PR.autoGet) { PR.autoGet = false; flush(); } },
    // iOS pauses a web app that isn't on screen, which breaks its downloads: carry on when it's back on screen or back online.
    carryOn() {
      const idle = () => !(this.busy || Shelf.busy || Arc.busy || MapPk.busy);
      if (!PR.autoGet || PREVIEW || document.hidden || navigator.onLine === false || document.body.classList.contains("em") || !idle()) return;
      clearTimeout(this.t); this.t = setTimeout(() => { if (PR.autoGet && !document.hidden && idle() && !document.body.classList.contains("em")) this.run(true); }, 2000);
    }
  };
  // Levels: readiness as a game. Each quest is worth its share of the 100 points.
  const LEVELS = [[0, "Recruit"], [20, "Scout"], [40, "Ranger"], [60, "Guardian"], [80, "Sentinel"], [100, "Fortress"]];
  function level(sc) {
    let n = 1; LEVELS.forEach(([at], i) => { if (sc >= at) n = i + 1; });
    const nx = LEVELS[n]; return { n, rank: LEVELS[n - 1][1], next: nx ? { at: nx[0], rank: nx[1] } : null };
  }
  const Ready = {
    rows() {
      // Count only what HAVYN's shelf actually holds today (a document whose publisher was down on build day can't be fetched yet).
      const ph = C.shelf.items.filter((i) => i.ph), hosted = ph.filter((i) => i.lic !== "link"), share = hosted.filter((i) => Shelf.state !== "ready" || Shelf.info(i) || shelfHave(i)), shHave = share.filter((i) => shelfHave(i)).length, later = hosted.length - share.length;
      const link = ph.filter((i) => i.lic === "link"), lkHave = link.filter((i) => shelfHave(i)).length;
      const core = coreArchives(), arHave = core.filter((i) => haveOnPhone(i)).length;
      const people = L("people").length, P = S.plan || {}, its = L("items"), hasW = its.some((i) => i.category === "water" && i.qty > 0), hasF = its.some((i) => i.category === "food" && i.qty > 0);
      const plan = [people > 0, !!P.contactPhone, !!(P.rally2 || P.rally3), !!P.leaveTo].filter(Boolean).length;
      const sw = !!(navigator.serviceWorker && navigator.serviceWorker.controller);
      return [
        { k: "app", w: 10, f: isStandalone() ? 1 : 0, t: "On the Home Screen", d: isStandalone() ? "Opens like an app, with its own storage." : "In Safari: Share › Add to Home Screen, then open HAVYN from its icon. Downloads made in a Safari tab stay in that tab.", go: "#/system" },
        { k: "offline", w: 10, f: sw || PREVIEW ? 1 : 0, t: "Works with no internet", d: sw ? "The app itself is saved on this phone." : "Open HAVYN once while online; it saves itself for offline use.", go: "#/system" },
        { k: "shelf", w: 10, f: share.length ? shHave / share.length : 1, t: "Manuals and guides: " + shHave + " of " + share.length, d: (shHave === share.length ? "Every phone-set document on HAVYN's shelf is here and searchable." : "First aid, water, food, power, radio, repair and survival manuals (" + sz(share.filter((i) => !shelfHave(i)).reduce((a, i) => a + shelfSize(i), 0)) + " to go)."), n: later ? later + (later === 1 ? " more isn't" : " more aren't") + " on HAVYN's shelf yet (the publisher was unreachable); HAVYN's shelf retries every day." : "", go: "#/archive?t=shelf" },
        { k: "arc", w: 10, f: core.length ? arHave / core.length : 1, t: "Encyclopedias: " + arHave + " of " + core.length, d: arHave === core.length ? "WikiMed and the survival libraries are here." : "WikiMed, post-disaster, water, food, medicine, knots and a kids' encyclopedia (" + sz(core.filter((i) => !haveOnPhone(i)).reduce((a, i) => a + Arc.size(i), 0)) + " to go).", go: "#/archive?t=phone" },
        { k: "books", w: 5, f: link.length ? lkHave / link.length : 1, t: "Health books from their publishers: " + lkHave + " of " + link.length, d: "Where There Is No Doctor and the others aren't re-hosted; get them from Get more › Shelf (Hesperian chapters are joined into one book).", go: "#/archive?t=shelf" },
        { k: "family", w: 15, f: plan / 4, t: "Family plan: " + plan + " of 4", d: people ? "An out-of-area contact, meeting places and where to go if you must leave." : "Start with who lives with you: a few taps.", go: people ? "#/family" : "#/quick/household" },
        { k: "supplies", w: 10, f: (hasW ? 0.5 : 0) + (hasF ? 0.5 : 0), t: hasW && hasF ? "Supplies counted" : "Count your supplies", d: "A few taps for water, food, power and gear; Home turns them into days you can last.", go: "#/quick/supplies" },
        { k: "map", w: 10, f: MapPk.list().length ? MAPS.filter((m) => MapPk.list().some((p) => p.id === m.id)).length / MapPk.list().length : Math.min(1, MAPS.length / 2), t: "Offline maps on this phone", d: "Every street in the Phoenix area and Arizona's highways, the nearest ER and GPS, with no signal.", go: "#/map" },
        { k: "sim", w: 10, f: Math.min(1, simDone() / 3), t: "Sim Lab: " + Math.min(3, simDone()) + " of 3 run", d: "About a minute each: CPR to the beat, alarm sounds, scorpions, snakes, quick missions.", go: "#/sim" },
        { k: "card", w: 10, f: now() - (PR.lastBackup || 0) < 30 * DAY ? 1 : 0, t: "Memory Card saved this month", d: "Copies your plan to every family phone and keeps a backup.", go: "#/system" }
      ];
    },
    score() { const r = this.rows(); return Math.round(r.reduce((a, x) => a + x.w * Math.max(0, Math.min(1, x.f)), 0) / r.reduce((a, x) => a + x.w, 0) * 100); },
    left() {
      const sh = Shelf.state === "ready" ? Shelf.todo(C.shelf.items.filter((i) => i.ph)) : C.shelf.items.filter((i) => i.ph && i.lic !== "link" && !shelfHave(i));
      const ar = coreArchives().filter((i) => Arc.can(i) && !haveOnPhone(i));
      const mp = MapPk.state === "ready" ? MapPk.todo() : [];
      return { n: sh.length + ar.length + mp.length, bytes: sh.reduce((a, i) => a + shelfSize(i), 0) + ar.reduce((a, i) => a + Arc.size(i), 0) + MapPk.size(mp) };
    },
    panel(full) {
      const rows = this.rows(), sc = this.score(), lf = this.left(), busy = Shelf.busy || Arc.busy || MapPk.busy || Everything.busy, done = lf.n === 0;
      const st = sc >= 90 ? "ok" : sc >= 50 ? "warn" : "crit", lv = level(sc), circ = 2 * Math.PI * 34;
      let h = '<section class="glass panel ready hud" id="ready"><div class="rdyhead">' +
        '<div class="ring" aria-hidden="true"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" class="rt"/><circle cx="40" cy="40" r="34" class="rp" style="stroke-dasharray:' + circ.toFixed(1) + ";stroke-dashoffset:" + (circ * (1 - sc / 100)).toFixed(1) + '"/></svg><div class="lv"><small>LV</small><b>' + lv.n + "</b></div></div>" +
        '<div class="hudtx"><div class="lab">This phone · rank</div><div class="rank">' + esc(lv.rank) + "</div>" +
        '<div class="num"><span class="big">' + sc + '</span><span class="unit">% READY</span>' + (lv.next ? '<span class="xpn">' + (lv.next.at - sc) + " XP to " + esc(lv.next.rank) + "</span>" : '<span class="xpn">Max level</span>') + "</div></div></div>" +
        '<div class="bar xp"><i style="width:' + sc + '%"></i></div>';
      if (!PREVIEW && !done) {
        h += '<div class="btnrow">' + '<button class="btn" data-act="get-everything" data-arcget data-shget' + (busy ? " disabled" : "") + ">" + ic("download") + (busy ? "Downloading · " + sz(lf.bytes) + " to go" : (PR.autoGet && !PR.firstGet ? "Carry on downloading · " : "Download everything · ") + sz(lf.bytes)) + "</button>" +
          '<button class="btn ghost' + (busy ? "" : " hide") + '" id="rdystop" data-act="get-stop">Stop</button></div>' +
          '<div class="sub" style="font-size:.8rem;margin-top:6px">' + lf.n + " items · on Wi-Fi, keep HAVYN open; it picks up where it stopped.</div>";
      }
      h += '<div class="bar' + (busy ? "" : " hide") + '" id="rdybar" style="margin-top:10px"><i style="width:0%"></i></div><div id="rdymsg" class="empty" style="min-height:1.1em;font-size:.82rem"></div>';
      const open = rows.filter((r) => r.f < 1), doneQ = rows.length - open.length;
      // On Home: the next three quests, one line each. Every quest, with what it means: the Quests screen.
      if (!full) {
        h += '<div class="qhead"><span class="lab">' + (open.length ? "Next quests" : "Quests") + '</span><a class="lab qall" href="#/quests">' + doneQ + " of " + rows.length + " complete ›</a></div>";
        h += '<div class="list rdy quests mini">' + (open.length ? open.slice(0, 3).map((r) => '<a class="li" href="' + r.go + '"><span class="ic">' + ic(r.f > 0 ? "clock" : "plus") + '</span><span class="tx"><b>' + esc(r.t) + '</b></span><span class="xpc">+' + Math.round(r.w * (1 - Math.max(0, r.f))) + " XP</span>" + ic("chev") + "</a>").join("")
          : '<a class="li ok" href="#/quests"><span class="ic">' + ic("check") + '</span><span class="tx"><b>Every quest complete</b></span>' + ic("chev") + "</a>") + "</div></section>";
        return h;
      }
      h += '<div class="qhead"><span class="lab">Quests</span><span class="lab">' + doneQ + " of " + rows.length + " complete</span></div>";
      h += '<div class="list rdy quests">' + open.concat(rows.filter((r) => r.f >= 1)).map((r) => {
        const ok = r.f >= 1, part = !ok && r.f > 0;
        const note = ok ? r.n || "" : [r.d, r.n].filter(Boolean).join(" ");
        return '<a class="li' + (ok ? " ok" : "") + '" href="' + r.go + '"><span class="ic">' + ic(ok ? "check" : part ? "clock" : "plus") + '</span><span class="tx"><b>' + esc(r.t) + "</b>" + (note ? "<small" + (ok ? ' class="keep"' : "") + ">" + esc(note) + "</small>" : "") + "</span>" +
          '<span class="xpc' + (ok ? " got" : "") + '">' + (ok ? "" : "+") + Math.round(r.w * (ok ? 1 : 1 - Math.max(0, r.f))) + " XP</span>" + ic("chev") + "</a>";
      }).join("") + "</div></section>";
      return h;
    },
    paint() {
      const bar = $("#rdybar"), msg = $("#rdymsg"), stop = $("#rdystop"); if (!bar && !msg) return;
      const m = Shelf.busy ? Shelf : MapPk.busy ? MapPk : Arc.busy ? Arc : null;
      if (bar) { bar.classList.toggle("hide", !m); if (m) bar.firstElementChild.style.width = m.pct() + "%"; }
      if (msg) msg.textContent = m ? m.msg() : "";
      if (stop) stop.classList.toggle("hide", !(Shelf.busy || Arc.busy || MapPk.busy || Everything.busy));
    },
    mount() { Shelf.mount(); Arc.mount(); MapPk.load(); this.paint(); }
  };
  function shelfRow(it) {
    const have = shelfHave(it), info = Shelf.info(it), sy = C.shelf.systems.find((x) => x.id === it.sys);
    const size = info ? info.size : it.size, pages = (info && info.pages) || it.pg;
    const chips = [it.by + (it.yr ? " · " + it.yr : ""), (info || !it.est ? "" : "~") + sz(size) + (pages ? " · " + fmtN(pages) + " pages" : ""), LICS[it.lic] || it.lic, it.ph ? "Phone set" : "Drive"];
    let h = '<div class="gi' + (have ? " got" : "") + '" id="sh-' + esc(it.id) + '"><div class="gh"><b>' + esc(it.t) + '</b><span class="gc">' +
      chips.map((c, i) => '<span class="chip' + (i === 3 && it.ph ? " core" : i === 2 ? " lic" : "") + '">' + esc(c) + "</span>").join("") + "</span></div>" +
      '<div class="gd">' + esc(it.d) + "</div>";
    const btns = [];
    if (have) btns.push('<a class="btn sm" href="#/library/' + esc(have.id) + '">' + ic("check") + "On this phone · open</a>");
    else if (info) btns.push('<button class="btn sm" data-shget data-act="shelf-get" data-id="' + esc(it.id) + '">' + ic("download") + "Get · " + sz(info.size) + "</button>");
    else if (it.hp) btns.push('<a class="btn sm ghost" href="' + esc(it.u) + '" target="_blank" rel="noopener">' + ic("download") + "Chapters at Hesperian</a>");
    else if (it.src && it.src[0]) btns.push('<a class="btn sm ghost" href="' + esc(it.src[0]) + '" target="_blank" rel="noopener">' + ic("download") + "From the publisher</a>");
    if (!have && it.u && !(it.src && it.src[0] === it.u) && !it.hp) btns.push('<a class="btn sm ghost" href="' + esc(it.u) + '" target="_blank" rel="noopener">Source page</a>');
    if (!have && it.hp) btns.push('<span class="note sm">On the vault drive under 10-shelf › ' + esc(sy ? sy.n : "") + ", in its own folder. Add every chapter at once and HAVYN joins them into one book.</span>");
    return h + '<div class="gb">' + btns.join("") + "</div></div>";
  }
  function renderShelf() {
    const S = C.shelf, all = S.items, have = all.filter((i) => shelfHave(i)), phone = all.filter((i) => i.ph);
    const todoPh = Shelf.todo(phone), todoSize = todoPh.reduce((a, i) => a + shelfSize(i), 0);
    const share = phone.filter((i) => i.lic !== "link"), shareSize = share.reduce((a, i) => a + shelfSize(i), 0);
    let h = '<div id="shelf"></div><section class="glass hero"><div class="lab">Reference shelf · checked ' + esc(S.checked) + '</div><div class="num" style="margin-top:6px"><span class="big" style="font-size:2.6rem">' + have.length + "/" + all.length +
      '</span><span class="unit">ON THIS PHONE<br>' + S.systems.length + " SYSTEMS</span></div>" + '<div class="sub">' + esc(S.note) + "</div>";
    if (Shelf.state === "ready") {
      h += '<div class="btnrow" style="margin-top:12px">' + (todoPh.length ? '<button class="btn" data-shget data-act="shelf-get-phone">' + ic("download") + "Get the phone set · " + todoPh.length + " · " + sz(todoSize) + "</button>" : '<span class="chip ok">' + ic("check") + "Phone set on this phone</span>") +
        '<button class="btn ghost hide" id="shstop" data-act="shelf-stop">Stop</button></div>' +
        '<div class="sub mono" style="font-size:.75rem;margin-top:6px">From HAVYN\'s own address, each file checked against its SHA-256' + (Shelf.built ? " · shelf built " + esc(Shelf.built.slice(0, 10)) : "") + "</div>";
    } else if (Shelf.state === "absent") {
      h += '<div class="sub" style="margin-top:10px">' + (Shelf.reason === "offline" ? "No internet right now: shelf downloads need Wi-Fi. Everything already on this phone works." : window.HAVYN_PREVIEW ? "This preview can't hold the shelf files." : "The shelf files aren't on this address yet (GitHub Pages has to be on).") +
        " Get the phone set (" + share.length + " documents, about " + sz(shareSize) + ") as one zip, unzip it in Files, then Library › Add files and select them all. Or use each document's own link below.</div>" +
        '<div class="btnrow" style="margin-top:10px"><a class="btn" href="' + SHELF_ZIP + '" target="_blank" rel="noopener">' + ic("download") + "Phone set as one zip</a></div>";
    } else h += '<div class="sub mono" style="margin-top:10px;font-size:.8rem">Checking for the shelf files…</div>';
    h += '<div class="bar hide" id="shbar" style="margin-top:12px"><i style="width:0%"></i></div><div id="shmsg" class="empty" style="min-height:1.2em"></div></section>';
    h += '<div class="shnav">' + S.systems.map((x) => '<button class="chip" data-act="shelf-jump" data-s="' + esc(x.id) + '">' + esc(x.n + " " + x.t) + "</button>").join("") + "</div>";
    for (const x of S.systems) {
      const xs = all.filter((i) => i.sys === x.id); if (!xs.length) continue;
      const got = xs.filter((i) => shelfHave(i)).length, todo = Shelf.todo(xs);
      h += '<div class="sec shsys" id="shs-' + esc(x.id) + '"><span class="lab">' + ic(x.icon) + esc(x.n + " · " + x.t) + '</span><span class="mono" style="color:var(--mute);font-size:.8rem">' + got + "/" + xs.length + " · ~" + sz(xs.reduce((a, i) => a + shelfSize(i), 0)) + "</span></div>" +
        '<p class="empty shd">' + esc(x.d) + "</p>" +
        (todo.length > 1 ? '<div class="btnrow" style="margin:0 0 8px"><button class="btn ghost sm" data-shget data-act="shelf-get-sys" data-s="' + esc(x.id) + '">' + ic("download") + "Get these " + todo.length + " · " + sz(todo.reduce((a, i) => a + shelfSize(i), 0)) + "</button></div>" : "") +
        '<div class="glist">' + xs.map(shelfRow).join("") + "</div>";
    }
    h += '<details class="glass panel shcmp"><summary><b>How this compares with other offline libraries</b></summary>' +
      S.others.map((o) => '<div class="blk"><b>' + esc(o.t) + "</b><span>" + esc(o.d) + "</span><span class=\"took\">HAVYN: " + esc(o.took) + "</span></div>").join("") + "</details>";
    h += '<p class="empty" style="font-size:.82rem;margin-top:12px">Public-domain and Creative Commons documents are re-shared from HAVYN\'s own address and its GitHub release, unchanged, with their credits. ' +
      "Documents under their publisher's terms (Hesperian, MSF, the University of Arizona, NCTSN) come straight from the publisher; HAVYN never re-hosts them. Dictionaries and translation: Get more › Apps. " +
      "The vault drive script copies the whole shelf into its 10-shelf folder. Sources: " + srcRefs(["hesperiancopy", "applelookup", "appletranslate"]) + ".</p>";
    return h;
  }

  // PDF reader: pdf.js renders pages to canvas on demand; pages far off screen are released to save memory.
  const PdfV = {
    lib: null, task: null, loadP: null, doc: null, id: null, n: 0, ratio: 1.294, zoom: 1, cur: 1, io: null, io2: null,
    vis: new Set(), rendered: new Map(), queue: [], busy: false, token: 0, ftoken: 0, text: null, outline: null, saveT: 0,
    async engine() {
      if (this.lib) return this.lib;
      const lib = await import("./pdfjs/pdf.min.js");
      lib.GlobalWorkerOptions.workerSrc = new URL("./pdfjs/pdf.worker.min.js", location.href).href;
      this.lib = lib; return lib;
    },
    msg(m) { const e = $("#pdfmsg"); if (e) { e.textContent = m || ""; e.classList.toggle("hide", !m); } },
    async load(id) {
      const tk = this.token;
      const blob = await Store.get("pdf:" + id);
      if (!blob) throw Object.assign(new Error("This PDF is missing on this phone. Import it again."), { name: "Missing" });
      const lib = await this.engine();
      const data = new Uint8Array(await blob.arrayBuffer());
      if (tk !== this.token) return;
      this.task = lib.getDocument({ data, useWorkerFetch: false, useWasm: false, isEvalSupported: false, verbosity: 0 });
      const doc = await this.task.promise;
      if (tk !== this.token) { doc.destroy(); return; }
      const v = (await doc.getPage(1)).getViewport({ scale: 1 });
      this.doc = doc; this.n = doc.numPages; this.text = new Map(); this.outline = null; this.ratio = v.height / v.width;
      const meta = LIB.find((d) => d.id === id);
      if (meta) { meta.pages = this.n; meta.opened = now(); saveLib(); }
    },
    async mount(id) {
      if (!$("#pdfpages")) return;
      try {
        if (this.id !== id) { await this.close(); this.id = id; this.loadP = this.load(id); }
        await this.loadP;
        if (!this.doc || this.id !== id || !$("#pdfpages")) return;
        this.msg("");
        this.layout($("#pdfpages"));
        const meta = LIB.find((d) => d.id === id);
        const start = Math.min(this.n, Math.max(1, Math.round(num(route.q.page)) || (meta && meta.lastPage) || 1));
        this.setNum(start); if (start > 1) this.go(start);
      } catch (e) {
        if (this.id !== id) return;
        this.msg(e && e.name === "PasswordException" ? "This PDF is password-protected, so HAVYN can't open it." : e && e.name === "Missing" ? e.message : "Couldn't open this PDF" + (e && e.message ? ": " + e.message : "."));
      }
    },
    layout(box) {
      this.unobserve();
      for (const [, c] of this.rendered) if (c && c !== "busy") { c.width = 0; c.height = 0; }
      this.rendered = new Map(); this.vis = new Set(); this.queue = [];
      box.style.setProperty("--z", this.zoom);
      let html = ""; for (let i = 1; i <= this.n; i++) html += '<div class="pg" data-n="' + i + '" style="aspect-ratio:1 / ' + this.ratio.toFixed(4) + '"></div>';
      box.innerHTML = html;
      this.io = new IntersectionObserver((ents) => {
        for (const e of ents) { const n = +e.target.dataset.n; if (e.isIntersecting) { this.vis.add(n); this.want(n); } else { this.vis.delete(n); this.free(n); } }
        this.pump();
      }, { rootMargin: "120% 0px" });
      this.io2 = new IntersectionObserver((ents) => { for (const e of ents) if (e.isIntersecting) this.setNum(+e.target.dataset.n); }, { rootMargin: "-45% 0px -54% 0px" });
      $$(".pg", box).forEach((el) => { this.io.observe(el); this.io2.observe(el); });
    },
    want(n) { if (!this.rendered.has(n) && !this.queue.includes(n)) this.queue.push(n); },
    free(n) {
      const c = this.rendered.get(n);
      if (c && c !== "busy") { c.width = 0; c.height = 0; c.remove(); this.rendered.delete(n); }
      const i = this.queue.indexOf(n); if (i >= 0) this.queue.splice(i, 1);
    },
    async pump() {
      if (this.busy || !this.doc) return;
      this.busy = true;
      try {
        while (this.queue.length && this.doc) {
          this.queue.sort((a, b) => Math.abs(a - this.cur) - Math.abs(b - this.cur));
          const n = this.queue.shift();
          if (this.vis.has(n) && !this.rendered.has(n)) await this.draw(n);
        }
      } catch (e) {} finally { this.busy = false; }
    },
    async draw(n) {
      const el = $('.pg[data-n="' + n + '"]'); if (!el || !this.doc) return;
      const doc = this.doc; this.rendered.set(n, "busy");
      try {
        const page = await doc.getPage(n);
        const v1 = page.getViewport({ scale: 1 });
        el.style.aspectRatio = v1.width + " / " + v1.height;
        let s = ((el.clientWidth || 360) / v1.width) * Math.min(window.devicePixelRatio || 1, 3);
        const px = v1.width * v1.height * s * s, MAX = 5e6; if (px > MAX) s *= Math.sqrt(MAX / px);
        const vp = page.getViewport({ scale: s });
        const cv = document.createElement("canvas"); cv.width = Math.floor(vp.width); cv.height = Math.floor(vp.height);
        await page.render({ canvas: cv, viewport: vp }).promise;
        page.cleanup();
        if (doc !== this.doc || !el.isConnected || !this.vis.has(n)) { cv.width = 0; cv.height = 0; if (this.rendered.get(n) === "busy") this.rendered.delete(n); return; }
        el.replaceChildren(cv); this.rendered.set(n, cv);
      } catch (e) { if (this.rendered.get(n) === "busy") this.rendered.delete(n); }
    },
    setNum(n) {
      this.cur = n; const e = $("#pgnum"); if (e) e.textContent = n + " / " + this.n;
      clearTimeout(this.saveT); const id = this.id;
      this.saveT = setTimeout(() => { const m = LIB.find((d) => d.id === id); if (m && m.lastPage !== n) { m.lastPage = n; saveLib(); } }, 700);
    },
    go(n) { const el = $('.pg[data-n="' + n + '"]'); if (el) { el.scrollIntoView({ block: "start" }); window.scrollBy(0, -(($(".rhead") || {}).offsetHeight || 0) - 6); this.setNum(n); } },
    setZoom(dz) {
      const Z = [1, 1.5, 2, 3]; const i = Math.max(0, Math.min(Z.length - 1, Z.indexOf(this.zoom) + dz));
      if (Z[i] === this.zoom || !this.doc) return;
      const keep = this.cur; this.zoom = Z[i];
      const box = $("#pdfpages"); if (!box) return;
      this.layout(box); this.go(keep); toast("Zoom " + Math.round(this.zoom * 100) + "%");
    },
    panel(kind) {
      const pn = $("#pdfpanel"); if (!pn) return null;
      if (!pn.classList.contains("hide") && pn.dataset.kind === kind) { pn.classList.add("hide"); return null; }
      pn.dataset.kind = kind; pn.classList.remove("hide"); return pn;
    },
    async toc() {
      if (!this.doc) return; const pn = this.panel("toc"); if (!pn) return;
      pn.innerHTML = '<h3>Contents</h3><div class="empty">Reading contents…</div>';
      if (!this.outline) {
        const flat = [], walk = (items, d) => { for (const it of items || []) { flat.push({ title: it.title, dest: it.dest, d }); if (d < 2 && it.items && it.items.length) walk(it.items, d + 1); } };
        try { walk(await this.doc.getOutline(), 0); } catch (e) {}
        this.outline = flat;
      }
      pn.innerHTML = "<h3>Contents</h3>" + (this.outline.length ? '<div class="toc">' + this.outline.map((o, i) => '<button data-act="pdf-dest" data-i="' + i + '" style="padding-left:' + (10 + o.d * 16) + 'px">' + esc(o.title) + "</button>").join("") + "</div>" : '<div class="empty">This PDF has no table of contents. Use Find or Go.</div>');
    },
    async dest(i) {
      const o = this.outline && this.outline[i]; if (!o || !this.doc) return;
      try {
        let d = o.dest; if (typeof d === "string") d = await this.doc.getDestination(d);
        if (!Array.isArray(d)) return;
        const n = typeof d[0] === "number" ? d[0] + 1 : (await this.doc.getPageIndex(d[0])) + 1;
        $("#pdfpanel").classList.add("hide"); this.go(n);
      } catch (e) { toast("Couldn't follow that link"); }
    },
    findPanel() {
      if (!this.doc) return; const pn = this.panel("find"); if (!pn) return;
      pn.innerHTML = '<h3>Find</h3><form data-form="pdffind" class="rgo"><input name="q" placeholder="Word or phrase" aria-label="Find text" autocomplete="off"><button class="btn sm" type="submit">Find</button></form><div id="findres" style="margin-top:10px"></div>';
      const q = $("[name=q]", pn); if (q) q.focus();
    },
    async search(q) {
      const res = $("#findres"); if (!res || !this.doc) return;
      const ql = String(q || "").trim().toLowerCase();
      if (ql.length < 2) { res.innerHTML = '<div class="empty">Type at least 2 letters.</div>'; return; }
      const tk = ++this.ftoken, doc = this.doc, hits = [];
      res.innerHTML = '<div class="empty" id="findprog">Searching…</div>';
      for (let n = 1; n <= this.n; n++) {
        if (tk !== this.ftoken || doc !== this.doc) return;
        let txt = this.text.get(n);
        if (txt === undefined) {
          try { const page = await doc.getPage(n); const tc = await page.getTextContent(); txt = tc.items.map((it) => (it.str || "") + (it.hasEOL ? " " : "")).join("").replace(/\s+/g, " "); page.cleanup(); } catch (e) { txt = ""; }
          if (doc !== this.doc) return; this.text.set(n, txt);
        }
        const at = txt.toLowerCase().indexOf(ql);
        if (at >= 0) { hits.push({ n, s: txt.slice(Math.max(0, at - 50), at + ql.length + 70) }); if (hits.length >= 80) break; }
        if (n % 20 === 0) { const p = $("#findprog"); if (p) p.textContent = "Searching… page " + n + " of " + this.n; }
      }
      if (!$("#findres")) return;
      $("#findres").innerHTML = hits.length ? '<div class="toc">' + hits.map((x) => '<button data-act="pdf-go" data-n="' + x.n + '"><b>p. ' + x.n + "</b>" + esc(x.s) + "</button>").join("") + "</div>" + (hits.length >= 80 ? '<div class="empty">Showing the first 80 pages with a match.</div>' : "") : '<div class="empty">No match. Scanned pages without a text layer can\'t be searched.</div>';
    },
    unobserve() { if (this.io) this.io.disconnect(); if (this.io2) this.io2.disconnect(); this.io = this.io2 = null; },
    async close() {
      this.token++; this.ftoken++; this.unobserve(); clearTimeout(this.saveT);
      for (const [, c] of this.rendered) if (c && c !== "busy") { c.width = 0; c.height = 0; }
      this.rendered = new Map(); this.queue = []; this.vis = new Set();
      const d = this.doc, t = this.task; this.doc = null; this.task = null; this.id = null; this.loadP = null; this.text = null; this.outline = null; this.zoom = 1;
      try { if (d) await d.destroy(); else if (t) await t.destroy(); } catch (e) {}
    }
  };

  /* ---------------- BINDER: the paper copy (HTML preview + PDF made on the phone) ---------------- */
  const mapsHref = (q) => "https://maps.apple.com/?q=" + encodeURIComponent(q);
  const telHref = (num) => "tel:" + String(num).replace(/[^0-9+]/g, "");
  function binderDoc() {
    const pl = S.plan || {}, dash = (v) => (v ? String(v) : "—");
    const sec = [];
    sec.push({ h: "Family plan", kv: [
      ["Out-of-area contact", pl.contactName ? pl.contactName + (pl.contactPhone ? " · " + pl.contactPhone : "") : "—"],
      ["Meeting place 1 · near home", dash(pl.rally1)], ["Meeting place 2 · neighborhood", dash(pl.rally2)], ["Meeting place 3 · out of area", dash(pl.rally3)],
      ["If heat forces us out", dash(pl.leaveTo)], ["Route and contact", dash(pl.leaveNotes)],
      ["Check-in times", (S.settings.checkins || []).join(", ") || "—"], ["GMRS channel", dash(pl.gmrsCh)], ["Meshtastic channel", dash(pl.meshCh)],
      ["Gas shutoff", dash(pl.gas)], ["Water shutoff", dash(pl.water)], ["Power shutoff", dash(pl.power)]] });
    sec.push({ h: "Phone numbers", kv: C.numbers.map((x) => [x.n, x.num]) });
    const ppl = L("people");
    sec.push({ h: "People", items: ppl.map((p) => ({ t: (p.name || "Unnamed") + (AGE[p.ageBand] ? " · " + AGE[p.ageBand] : ""),
      kv: [["Conditions", p.conditions], ["Medicines", p.meds], ["Allergies", p.allergies], ["Blood type", p.blood], ["Doctor and pharmacy", p.doctor], ["Powered device", p.device], ["Notes", p.notes]].filter(([, v]) => v) })),
      empty: "No one entered yet. Add the household on the Family screen, then make the binder again." });
    const pets = L("pets");
    if (pets.length) sec.push({ h: "Pets", items: pets.map((p) => ({ t: (p.name || "Pet") + (p.species ? " · " + p.species : "") + (p.weightLb ? " · " + p.weightLb + " lb" : ""), kv: p.notes ? [["Notes", p.notes]] : [] })) });
    const meds = L("items").filter((i) => i.category === "meds");
    if (meds.length) sec.push({ h: "Medicines in stock", kv: meds.map((i) => [i.name || "Medicine", [i.critical ? "critical" : "", num(i.per_day) ? i.per_day + " doses a day" : "", i.owner && byId("people", i.owner) ? "for " + byId("people", i.owner).name : "", i.location ? "stored: " + i.location : "", i.expires ? "expires " + i.expires : ""].filter(Boolean).join(" · ") || "—"]) });
    sec.push({ h: "Comms ladder", steps: C.comms.ladder.map((r) => [r.rung + ": " + r.t, "Works when: " + r.when + ". Range: " + r.range + ". " + r.d]) });
    sec.push({ h: "Comms rules", steps: C.comms.rules.map((r) => [r.t, r.d]) });
    for (const p of C.playbooks.filter((x) => !x.soon)) {
      sec.push({ h: "Playbook: " + p.title, sub: p.trigger, page: true, leave: p.leave, rule: p.ruleTitle || "Leave now if", phases: p.phases.map((ph) => [ph.label, ph.items.map((it) => it.t + (it.d ? ": " + it.d : ""))]) });
    }
    sec.push({ h: "Phoenix heat rules", steps: C.plan.heat.map((r) => [r.t, r.d]) });
    for (const c of C.cards) sec.push({ h: "Card: " + c.title, sub: c.sub, page: true, steps: c.steps.map((s) => [s.t, (s.d || "") + (s.beat ? " (push to a beat of " + s.beat + " a minute)" : "")]), note: c.note, src: "Source: " + c.sources.map((x) => x.n).join("; ") });
    return { title: "HAVYN binder", date: ymd(now()), gate: "Cards: " + C.gate + ". Checked against sources " + C.reviewed + ". Training beats any app.", sections: sec };
  }
  function binderHTML(d) {
    let h = '<article class="paper"><h1>' + esc(d.title) + '</h1><p class="meta">Made ' + esc(d.date) + " · " + esc(d.gate) + "</p>";
    for (const s of d.sections) {
      h += '<section class="' + (s.page ? "pb" : "") + '"><h2>' + esc(s.h) + "</h2>" + (s.sub ? '<p class="sub2">' + esc(s.sub) + "</p>" : "");
      if (s.kv) h += "<table>" + s.kv.map(([k, v]) => "<tr><th>" + esc(k) + "</th><td>" + esc(v) + "</td></tr>").join("") + "</table>";
      if (s.items) h += s.items.length ? s.items.map((it) => "<h3>" + esc(it.t) + "</h3>" + (it.kv.length ? "<table>" + it.kv.map(([k, v]) => "<tr><th>" + esc(k) + "</th><td>" + esc(v) + "</td></tr>").join("") + "</table>" : "")).join("") : "<p>" + esc(s.empty || "") + "</p>";
      if (s.leave) h += '<p class="leave"><b>' + esc(s.rule || "Leave now if") + ":</b> " + s.leave.map(esc).join(" · ") + "</p>";
      if (s.phases) h += s.phases.map(([lab, items]) => "<h3>" + esc(lab) + "</h3><ul>" + items.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul>").join("");
      if (s.steps) h += "<ol>" + s.steps.map(([t, x]) => "<li><b>" + esc(t) + ".</b>" + (x ? " " + esc(x) : "") + "</li>").join("") + "</ol>";
      if (s.note) h += '<p class="sub2">' + esc(s.note) + "</p>";
      if (s.src) h += '<p class="src2">' + esc(s.src) + "</p>";
      h += "</section>";
    }
    return h + "</article>";
  }
  let binderFile = null;
  function renderBinder() {
    const d = binderDoc();
    let h = '<div class="noprint">' + backbar("#/guides", "Binder");
    h += '<section class="glass hero"><div class="lab">Printable binder</div><h2 style="margin:6px 0 4px;font-size:1.4rem">Paper for when the phones are dead.</h2>' +
      '<div class="sub">Your plan, numbers, medicines, playbooks and all ' + C.cards.length + " cards. Make it again whenever something changes.</div>" +
      '<div class="btnrow" style="margin-top:12px"><button class="btn" data-act="binder-pdf">Make binder PDF</button></div>' +
      '<div class="btnrow' + (binderFile ? "" : " hide") + '" id="bdsend" style="margin-top:10px"><button class="btn" data-act="binder-share">Share or print</button><button class="btn ghost" data-act="binder-dl">Download</button></div>' +
      '<div id="bdmsg" class="empty" style="min-height:1.3em"></div>' +
      '<div class="btnrow"><button class="btn ghost sm" data-act="binder-print">Print this page</button></div>' +
      '<p class="note">It holds your family\'s medical details. Keep the paper somewhere safe. A copy also goes into your Library.</p></section></div>';
    return h + binderHTML(d);
  }
  const WINANSI = new Set("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ".split(""));
  const pdfSafe = (s) => Array.from(String(s === undefined || s === null ? "" : s).replace(/→/g, "->").replace(/←/g, "<-").replace(/≥/g, ">=").replace(/≤/g, "<=").replace(/[  ]/g, " ").replace(/\s+/g, " "))
    .filter((ch) => { const c = ch.charCodeAt(0); return (c >= 32 && c < 127) || (c >= 160 && c <= 255) || WINANSI.has(ch); }).join("");
  async function makeBinderPdf() {
    const msg = (m) => { const e = $("#bdmsg"); if (e) e.textContent = m; };
    msg("Making the binder…");
    const { PDFDocument, StandardFonts, rgb } = await import("./pdflib/pdf-lib.esm.min.js");
    const d = binderDoc(), pdf = await PDFDocument.create();
    pdf.setTitle(d.title + " " + d.date); pdf.setAuthor("HAVYN FIELD"); pdf.setCreator("HAVYN FIELD " + VERSION); pdf.setProducer("HAVYN FIELD");
    const F = await pdf.embedFont(StandardFonts.Helvetica), FB = await pdf.embedFont(StandardFonts.HelveticaBold);
    const W = 612, H = 792, M = 54, INK = rgb(0, 0, 0), GREY = rgb(0.35, 0.35, 0.35);
    let page = null, y = 0;
    const newPage = () => { page = pdf.addPage([W, H]); y = H - M; };
    const room = (h) => { if (!page || y - h < M + 18) newPage(); };
    const wrap = (txt, font, size, maxW) => {
      const out = []; let cur = "";
      for (const w of pdfSafe(txt).split(" ")) {
        const t = cur ? cur + " " + w : w;
        if (font.widthOfTextAtSize(t, size) <= maxW) { cur = t; continue; }
        if (cur) out.push(cur);
        cur = w;
        while (cur.length > 1 && font.widthOfTextAtSize(cur, size) > maxW) { let k = cur.length - 1; while (k > 1 && font.widthOfTextAtSize(cur.slice(0, k), size) > maxW) k--; out.push(cur.slice(0, k)); cur = cur.slice(k); }
      }
      if (cur) out.push(cur);
      return out;
    };
    const text = (txt, o) => {
      o = o || {}; const font = o.font || F, size = o.size || 10.5, x = o.x || M, maxW = (o.w || W - 2 * M) - (x - M);
      for (const ln of wrap(txt, font, size, maxW)) { room(size + 2); page.drawText(ln, { x, y: y - size, size, font, color: o.color || INK }); y -= size + (o.gap || 3.5); }
    };
    const kvRows = (rows, x0) => {
      x0 = x0 || M;
      for (const [k, v] of rows) {
        const kl = wrap(k, FB, 9.5, 150), vl = wrap(v, F, 10, W - M - x0 - 160), n = Math.max(kl.length, vl.length, 1), lh = 13.5;
        room(n * lh + 2);
        kl.forEach((ln, i) => page.drawText(ln, { x: x0, y: y - 10 - i * lh, size: 9.5, font: FB, color: INK }));
        vl.forEach((ln, i) => page.drawText(ln, { x: x0 + 160, y: y - 10 - i * lh, size: 10, font: F, color: INK }));
        y -= n * lh + 3;
      }
    };
    newPage();
    text(d.title.toUpperCase(), { font: FB, size: 22, gap: 6 }); text("Made " + d.date + ". " + d.gate, { size: 9, color: GREY, gap: 12 }); y -= 6;
    for (const s of d.sections) {
      if (s.page) newPage(); else room(60);
      y -= 4; text(s.h, { font: FB, size: 15, gap: 5 });
      if (s.sub) text(s.sub, { size: 9.5, color: GREY, gap: 6 });
      y -= 2;
      if (s.kv) kvRows(s.kv);
      if (s.items) { if (!s.items.length) text(s.empty || ""); for (const it of s.items) { room(40); y -= 2; text(it.t, { font: FB, size: 11.5, gap: 4 }); kvRows(it.kv, M + 10); } }
      if (s.leave) { y -= 2; text((s.rule || "Leave now if") + ": " + s.leave.join(" · "), { font: FB, size: 10.5 }); }
      if (s.phases) for (const [lab, items] of s.phases) { room(40); y -= 4; text(lab, { font: FB, size: 11.5, gap: 4 }); for (const it of items) text("•  " + it, { size: 10, x: M + 8 }); }
      if (s.steps) s.steps.forEach(([t, x], i) => { y -= 3; room(30); text((i + 1) + ". " + t + "." + (x ? " " + x : ""), { size: s.page ? 12 : 10.5, gap: 4 }); });
      if (s.note) { y -= 4; text(s.note, { size: 10, color: GREY }); }
      if (s.src) { y -= 4; text(s.src, { size: 8.5, color: GREY }); }
      y -= 10;
    }
    const pages = pdf.getPages();
    pages.forEach((pg, i) => pg.drawText(pdfSafe("HAVYN binder · " + d.date + " · page " + (i + 1) + " of " + pages.length), { x: M, y: 30, size: 8, font: F, color: GREY }));
    const bytes = await pdf.save();
    const name = "HAVYN-binder-" + d.date + ".pdf";
    binderFile = new File([bytes], name, { type: "application/pdf" });
    // keep a copy in the Library so it can be read offline in the reader
    const id = uid();
    if (await Store.set("pdf:" + id, binderFile)) {
      for (const o of LIB.filter((x) => x.binder)) await Store.del("pdf:" + o.id);
      LIB = LIB.filter((x) => !x.binder);
      LIB.push({ id, name: "HAVYN binder " + d.date, size: binderFile.size, added: now(), pages: pages.length, lastPage: 1, binder: true });
      await saveLib();
    }
    msg("Ready: " + pages.length + " pages, " + mb(binderFile.size) + ". Saved in your Library too.");
    const b = $("#bdsend"); if (b) b.classList.remove("hide");
    Snd.chime("save");
  }
  async function shareBinder() {
    if (!binderFile) return;
    if (navigator.canShare && navigator.canShare({ files: [binderFile] })) {
      try { await navigator.share({ files: [binderFile], title: "HAVYN binder" }); return; } catch (e) { if (e && e.name === "AbortError") return; }
    }
    downloadBinder();
  }
  function downloadBinder() {
    if (!binderFile) return;
    if (PREVIEW) { toast("Downloads work in the installed app"); return; }
    const url = URL.createObjectURL(binderFile), a = document.createElement("a");
    a.href = url; a.download = binderFile.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
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
      '<div class="kv"><span>Library</span><span>' + esc(libSummary() || "Empty") + "</span></div>" +
      '<div class="kv"><span>Network use</span><span>Downloads you start, from HAVYN and Kiwix only</span></div>' +
      '<div class="kv"><span>Version</span><span class="mono">' + esc(VERSION) + "</span></div>" +
      '<div class="kv"><span>Updates</span><span>' + (Upd.ready ? '<button class="updbtn go" data-act="upd-restart">Restart to update</button>' : '<button class="updbtn" data-act="upd-check">' + esc(Upd.msg || "Check now") + "</button>") + "</span></div>" +
      '<p class="empty" style="font-size:.85rem">Deleting the app icon deletes its data. Keep Memory Cards on another phone and the vault drive.</p>' +
      '<div class="btnrow"><button class="btn ghost" data-act="wel-replay">' + ic("play") + "Replay the welcome tour</button></div></section>";
    const vi = Voice.ok() ? Voice.info() : null, VV = window.HAVYN_VOICE;
    h += '<section class="glass panel"><h3>Voice</h3><div class="kv"><span>In use</span><span>' + (VV ? "HAVYN's own British voice (built in, works offline)" : vi ? esc(vi.name) + " · " + esc(vi.lang) : Voice.ok() ? "Loading…" : "This browser can't speak") + "</span></div>" +
      (VV || (vi && vi.gb) ? "" : '<p class="empty" style="font-size:.85rem">HAVYN speaks with an elegant British woman\'s voice when the iPhone has one: Settings › Accessibility › Spoken Content › Voices › English › English (UK) › Serena or Martha, then download the Enhanced or Premium version. HAVYN picks it up by itself.</p>') +
      '<div class="btnrow"><button class="btn ghost" data-act="voice-test">' + ic("speaker") + "Hear it</button></div></section>";
    h += '<section class="glass panel"><h3>Danger zone</h3><button class="btn ghost danger wide" data-act="erase">Erase everything on this phone</button></section>';
    return h;
  }
  async function sha256(text) {
    try { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)); return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join(""); } catch (e) { return ""; }
  }
  function snapshot() { return JSON.parse(JSON.stringify({ settings: S.settings, plan: S.plan, outage: S.outage, checks: S.checks, people: S.people, pets: S.pets, items: S.items, log: S.log, tasks: S.tasks, buys: S.buys })); }
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
  // Updates. The installed app stays attached to the live site: it looks for a new version when it opens and whenever
  // it comes back to the front (at most every 10 minutes), fetches it in the background, then restarts by itself on an
  // idle Home screen, or offers a one-tap restart anywhere else. Nothing restarts mid-emergency, mid-drill or mid-download.
  const Upd = {
    reg: null, ready: false, last: 0, msg: "", had: false,
    init(reg) {
      this.reg = reg; this.had = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!this.had) { this.had = true; return; }   // the very first install: nothing to restart
        this.ready = true; this.msg = "";
        if (this.idle()) { location.reload(); return; }
        toast("Update ready: tap Restart"); render();
      });
      document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") this.check(false); });
      setTimeout(() => this.check(false), 6000);
    },
    idle() {
      return (route.path === "status" || route.path === "") && !document.body.classList.contains("em") && !Welcome.on && !Shelf.busy && !Arc.busy && !MapPk.busy && !Everything.busy &&
        !(SR && ((SR.drill && SR.drill.phase === "run") || (SR.beat && SR.beat.phase !== "ready" && SR.beat.phase !== "done")));
    },
    check(manual) {
      if (this.ready) { if (manual) location.reload(); return; }
      if (!this.reg || navigator.onLine === false) { if (manual) { this.msg = navigator.onLine === false ? "No internet right now" : "Open the installed app to update"; render(); } return; }
      if (!manual && now() - this.last < 10 * 60e3) return;
      this.last = now(); if (manual) { this.msg = "Checking…"; render(); }
      this.reg.update().then(() => {
        if (!manual || this.ready) return;
        const w = this.reg.installing || this.reg.waiting;
        this.msg = w ? "Downloading the update…" : "Up to date"; render();
      }).catch(() => { if (manual) { this.msg = "Couldn't reach the site"; render(); } });
    }
  };
  function toast(msg) {
    if (Welcome.on) return;   // the tour card is saying what's happening
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
    const dg = ev.target.closest("[data-go]"); if (dg) { location.hash = dg.dataset.go; return; }
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
    else if (act === "up-done") { const r = recOf("tasks", b.dataset.id) || {}; setTask(b.dataset.id, { prevDone: r.lastDone || 0, lastDone: now() }); Snd.chime("ok"); toast("Marked done"); render(); }
    else if (act === "up-undo") { const r = recOf("tasks", b.dataset.id) || {}; setTask(b.dataset.id, { lastDone: r.prevDone || 0, prevDone: 0 }); render(); }
    else if (act === "task-del") { if (confirmTap(b, "task" + b.dataset.id, "Tap again to remove")) { remove("tasks", b.dataset.id); toast("Removed"); render(); } }
    else if (act === "buy-status") { setBuy(b.dataset.id, { status: b.dataset.v }); Snd.chime(b.dataset.v === "have" ? "ok" : "nav"); render(); }
    else if (act === "buy-auto") { setBuy(b.dataset.id, { qty: null }); render(); }
    else if (act === "buy-add") {
      const r = E.buyPlan(S, C.buy.items).rows.find((x) => x.item.id === b.dataset.id); if (!r || !r.item.add) return;
      const a = r.item.add, cat = RES[a.cat] ? a.cat : "gear", key = RES[cat].key;
      const vals = { category: cat, name: a.name || r.item.n, qty: r.qty !== null ? r.qty : 1, notes: r.item.pick };
      if (key && a.per) { vals.per_unit = {}; vals.per_unit[key] = a.per; }
      draft = { id: "", vals, fromBuy: r.item.id }; go("#/supplies/edit/new?cat=" + cat);
    }
    else if (act === "buy-solar") { const r = E.buyPlan(S, C.buy.items).rows.find((x) => x.item.id === b.dataset.id); const w = 200 * ((r && r.qty) || 1); setOne("settings", { solarW: Math.max(num(S.settings.solarW), w) }); toast("Solar set to " + w + " W"); Snd.chime("ok"); render(); }
    else if (act === "pdf-toc") PdfV.toc();
    else if (act === "pdf-find") PdfV.findPanel();
    else if (act === "pdf-zoom") PdfV.setZoom(num(b.dataset.z));
    else if (act === "pdf-dest") PdfV.dest(num(b.dataset.i));
    else if (act === "pdf-go") { const pn = $("#pdfpanel"); if (pn) pn.classList.add("hide"); PdfV.go(num(b.dataset.n)); }
    else if (act === "get-everything") Everything.run(false);
    else if (act === "q+" || act === "q-") {
      if (!quick) return; const k = b.dataset.k, v = Math.max(0, Math.min(999, (quick.n[k] || 0) + (act === "q+" ? 1 : -1)));
      quick.n[k] = v; const o = $("#q-" + k); if (o) { o.textContent = v; o.classList.remove("bump"); void o.offsetWidth; o.classList.add("bump"); }
      Snd.chime("nav");
    }
    else if (act === "q-save") quickSave();
    else if (act === "map-packs") { MapView.packs = !MapView.packs; render(); }
    else if (act === "map-get") { const p = b.dataset.id ? MapPk.list().filter((x) => x.id === b.dataset.id) : null; MapPk.get(p); }
    else if (act === "map-del") { if (confirmTap(b, "mapdel" + b.dataset.id, "Tap again to remove")) MapPk.remove(b.dataset.id); }
    else if (act === "map-kind") { const k = b.dataset.k, on = MapView.shown(); on.has(k) ? on.delete(k) : on.add(k); PR.mapKinds = [...on]; flush(); MapView.refresh(); render(); }
    else if (act === "map-near") { PR.mapNear = b.dataset.k; if (!MapView.shown().has(b.dataset.k)) { MapView.shown().add(b.dataset.k); PR.mapKinds = [...MapView.shown()]; MapView.refresh(); } flush(); render(); }
    else if (act === "map-gps") MapView.gps(true);
    else if (act === "map-nearopen") { PR.mapNearOpen = !PR.mapNearOpen; flush(); render(); }
    else if (act === "map-north") { if (MapView.map) MapView.map.easeTo({ bearing: 0, pitch: 0 }); }
    else if (act === "map-poi") { const i = +b.dataset.i, p = MapView.places && MapView.places.pois[i]; if (p) { MapView.sel = { poi: i }; MapView.focus([p[3], p[2]], 14); render(); } }
    else if (act === "map-go") { const t = b.dataset.t, i = b.dataset.i === "" ? -1 : +b.dataset.i; MapView.q = ""; MapView.sel = t === "poi" ? { poi: i } : t === "pin" ? { pin: i } : null; MapView.focus([+b.dataset.lon, +b.dataset.lat], t === "place" ? 13 : 15); render(); }
    else if (act === "map-close") { MapView.sel = null; render(); }
    else if (act === "map-fly") MapView.focus([+b.dataset.lon, +b.dataset.lat], 15);
    else if (act === "map-copy") { const v = b.dataset.v; (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(() => toast("Copied " + v)).catch(() => toast(v)); }
    else if (act === "map-save") {
      const s0 = MapView.sel && MapView.sel.drop; if (!s0) return;
      const k = b.dataset.k, n = /^meet(\d)$/.exec(k), plan = S.plan || {}, nm = n && plan["rally" + n[1]] && plan["rally" + n[1]] !== "Home" ? plan["rally" + n[1]] : MAPK[k][0];
      // Home, work, school and each meeting place are one spot each (saving again moves it); a record per spot, so
      // a Memory Card carries it to the family's other phones and the newest move wins.
      S.spots = S.spots || [];
      const old = k === "spot" ? null : L("spots").find((x) => x.kind === k), rec = { id: old ? old.id : uid(), kind: k, name: nm, lon: +s0[0].toFixed(6), lat: +s0[1].toFixed(6), at: now() };
      upsert("spots", rec); flush(); MapView.sel = { pin: S.spots.findIndex((x) => x.id === rec.id) }; MapView.refresh(); Snd.chime("save"); toast("Saved: " + nm); render();
    }
    else if (act === "map-unpin") { if (confirmTap(b, "unpin" + b.dataset.i, "Tap again to remove")) { const r = (S.spots || [])[+b.dataset.i]; if (r) remove("spots", r.id); flush(); MapView.sel = null; MapView.refresh(); render(); } }
    else if (act === "upd-check") Upd.check(true);
    else if (act === "upd-restart") location.reload();
    else if (act === "sim-pick") simPick(Number(b.dataset.i));
    else if (act === "sim-next") simNext();
    else if (act === "sim-uv") { if (SR) { SR.uv = !SR.uv; const sb = $(".scanbox"), tg = $(".scantag"); if (sb) sb.classList.toggle("uv", SR.uv); if (tg) tg.textContent = SR.uv ? "UV SCAN" : "SCAN COMPLETE"; b.classList.toggle("on", SR.uv); } }
    else if (act === "sim-play") simSound();
    else if (act === "sim-again") { if (SR) { Beat.stop(); Drill.stopT(); AlarmSnd.stop(); Clips.stop(); SR = simStart(SR.id); render(); } }
    else if (act === "sim-voice") { PR.simVoice = PR.simVoice === false; flush(); if (PR.simVoice === false) Clips.stop(); render(); }
    else if (act === "beat-go") Beat.start();
    else if (act === "drill-go") Drill.go();
    else if (act === "drill-stop") Drill.stop();
    else if (act === "drill-alarm") { if (SR && SR.drill) { SR.drill.alarm = !SR.drill.alarm; if (SR.drill.alarm) AlarmSnd.play("t3", 0.05); else AlarmSnd.stop(); render(); } }
    else if (act === "inc-mark") { Inc.add(b.dataset.w, b.dataset.card); render(); }
    else if (act === "inc-clear") { if (Inc.arm && now() - Inc.arm < 5000) { Inc.clear(); go("#/emergency"); } else { Inc.arm = now(); render(); } }
    else if (act === "card-voice") { PR.cardVoice = PR.cardVoice === false; flush(); if (PR.cardVoice === false) CardVoice.off(); else { Snd.ctx(); CardVoice.said = ""; } render(); }
    else if (act === "card-say") { Snd.ctx(); const m = /^#\/emergency\/([\w-]+)/.exec(location.hash || ""); if (m) CardVoice.say("c-" + m[1] + "-" + cardView.step); }
    else if (act === "voice-test") { Welcome.muted = false; Snd.ctx(); Voice.unlock(); Voice.say("Welcome to Haven. This is my voice."); setTimeout(render, 600); }
    else if (act === "wel-begin") Welcome.begin();
    else if (act === "wel-skip") Welcome.close("skip");
    else if (act === "wel-sos") Welcome.close("sos");
    else if (act === "wel-done") Welcome.close("done");
    else if (act === "wel-next") Welcome.tour(Welcome.i + 1);
    else if (act === "wel-back") Welcome.tour(Welcome.i - 1);
    else if (act === "wel-mute") { Welcome.muted = !Welcome.muted; if (Welcome.muted) Voice.stop(); Welcome.tour(Welcome.i); }
    else if (act === "wel-pause") { Everything.halt(); toast("Paused. Tap Download everything on Status when you're on Wi-Fi"); }
    else if (act === "wel-replay") Welcome.open(true);
    else if (act === "get-stop") { Everything.halt(); b.textContent = "Stopping…"; }
    else if (act === "arc-get") { const it = C.archive.items.find((i) => i.id === b.dataset.id); if (it) Arc.get([it]); }
    else if (act === "arc-get-core") Arc.get(coreArchives());
    else if (act === "arc-stop") { Arc.stop = true; b.textContent = "Stopping…"; }
    else if (act === "shelf-get") { const it = C.shelf.items.find((i) => i.id === b.dataset.id); if (it) Shelf.get([it]); }
    else if (act === "shelf-get-phone") Shelf.get(C.shelf.items.filter((i) => i.ph));
    else if (act === "shelf-get-sys") Shelf.get(C.shelf.items.filter((i) => i.sys === b.dataset.s));
    else if (act === "shelf-stop") { Shelf.stop = true; b.textContent = "Stopping…"; }
    else if (act === "shelf-jump") { const el = $("#shs-" + b.dataset.s); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }
    else if (act === "lib-del") { if (confirmTap(b, "libdel" + b.dataset.id, "Tap again to delete")) deleteItem(b.dataset.id); }
    else if (act === "zim-random") ZR.random(b.dataset.id);
    else if (act === "zr-back") { if (ZR.back()) ev.preventDefault(); }
    else if (act === "zr-size") { const Z = [1, 1.15, 1.3, 1.5, 0.9]; PR.zScale = Z[(Z.indexOf(PR.zScale || 1) + 1) % Z.length]; flush(); ZR.restyle(); toast("Text " + Math.round(PR.zScale * 100) + "%"); }
    else if (act === "zr-dark") { PR.zDark = PR.zDark === false; flush(); b.classList.toggle("on", PR.zDark !== false); ZR.restyle(); }
    else if (act === "m-skip") Media.skip(num(b.dataset.s));

    else if (act === "binder-pdf") { b.disabled = true; makeBinderPdf().catch((e) => { const m = $("#bdmsg"); if (m) m.textContent = "Couldn't make the PDF: " + (e && e.message ? e.message : e); }).finally(() => { b.disabled = false; }); }
    else if (act === "binder-share") shareBinder();
    else if (act === "binder-dl") downloadBinder();
    else if (act === "binder-print") window.print();
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
      S.checks = touch(c); save();
      const row = t.closest(".chk"); if (row) row.classList.toggle("done", t.checked);
      const gi = t.closest(".gi"); if (gi) gi.classList.toggle("got", t.checked);
      if (t.checked) Snd.chime("nav"); return;
    }
    if (t.dataset && t.dataset.task) {
      setTask(t.dataset.task, { done: t.checked, doneAt: t.checked ? now() : 0 });
      if (t.checked) Snd.chime("ok"); render(); return;
    }
    if (t.id === "mcfile") { await readCardFile(t.files && t.files[0]); t.value = ""; return; }
    if (t.id === "libfile") { const fs = Array.from(t.files || []); t.value = ""; await importFiles(fs); return; }
    if (t.dataset && t.dataset.photoFor) {
      const f = t.files && t.files[0]; if (!f) return;
      try { const url = await shrinkPhoto(f); const id = uid(); await Store.set("photo:" + id, url); const old = S.plan[t.dataset.photoFor + "Photo"]; if (old) Store.del("photo:" + old); const p = {}; p[t.dataset.photoFor + "Photo"] = id; setOne("plan", p); toast("Photo saved"); render(); } catch (e) { toast("Could not read that photo"); }
      return;
    }
    const form = t.closest && t.closest("form[data-form=item]");
    if (form && t.name === "category") { draft = { id: form.dataset.id || "", vals: formVals(form), fromBuy: draft && draft.fromBuy }; render(); }
  });
  let zqT = 0;
  document.addEventListener("input", (ev) => {
    const t = ev.target;
    if (t.id === "sq") SearchUI.later(t.value);
    else if (t.id === "fq") fieldFilter(t.value);
    else if (t.id === "zq") { clearTimeout(zqT); const id = t.closest("form").dataset.id; zqT = setTimeout(() => ZR.search(id, t.value, $("#zres")), 140); }
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
      setOne("plan", { contactName: v.contactName, contactPhone: v.contactPhone, rally1: v.rally1, rally2: v.rally2, rally3: v.rally3, leaveTo: v.leaveTo, leaveNotes: v.leaveNotes, gas: v.gas, water: v.water, power: v.power, gmrsCh: v.gmrsCh, meshCh: v.meshCh });
      setOne("settings", { checkins }); toast("Plan saved"); Snd.chime("ok"); go("#/family");
    } else if (kind === "item") {
      const cat = RES[v.category] ? v.category : "gear", r = RES[cat];
      const base = id ? byId("items", id) : { id: uid() };
      const it = Object.assign({}, base, { category: cat, name: v.name || r.label, qty: num(v.qty), location: v.location, expires: v.expires, min_qty: optNum(v.min_qty), notes: v.notes });
      it.per_unit = r.key ? (() => { const o = {}; o[r.key] = num(v.per); return o; })() : {};
      if (cat === "meds") { it.per_day = num(v.per_day); it.critical = v.critical === "yes"; it.owner = v.owner; } else { delete it.per_day; delete it.critical; delete it.owner; }
      const fromBuy = draft && draft.fromBuy;
      delete it.example; draft = null; upsert("items", it); if (fromBuy) setBuy(fromBuy, { itemId: it.id, status: "have" }); toast("Saved"); Snd.chime("ok"); go("#/supplies/item/" + it.id);
    } else if (kind === "task") {
      if (!v.t) { toast("Type what needs doing"); return; }
      upsert("tasks", { id: uid(), custom: true, t: String(v.t).slice(0, 200), phase: C.missions.phases.some((x) => x.id === v.phase) ? v.phase : "week", done: false });
      toast("Mission added"); Snd.chime("ok"); render();
    } else if (kind === "buyqty") {
      setBuy(id, { qty: String(v.qty || "").trim() === "" ? null : Math.max(0, num(v.qty)) }); toast("Quantity saved"); render();
    } else if (kind === "pdfgo") {
      const n = Math.round(num(v.p)); const inp = f.querySelector("input"); if (inp) { inp.value = ""; inp.blur(); }
      if (n >= 1 && n <= PdfV.n) PdfV.go(n); else toast("Pages 1 to " + PdfV.n);
    } else if (kind === "hub") {
      const u = String(v.hub || "").trim().slice(0, 200);
      if (u && !/^https?:\/\/[^\s"'<>]{3,200}$/i.test(u)) { toast("Use the full address, starting with http://"); return; }
      setOne("plan", { hub: u }); toast(u ? "Home library saved" : "Home library cleared"); Snd.chime("ok"); render();
    } else if (kind === "search") {
      const inp = f.querySelector("input"); if (inp) inp.blur(); SearchUI.run(v.q || "");
    } else if (kind === "zsearch") {
      const inp = f.querySelector("input"); if (inp) inp.blur(); ZR.search(id, v.q || "", $("#zres"));
    } else if (kind === "pdffind") {
      const inp = f.querySelector("input"); if (inp) inp.blur(); PdfV.search(v.q);
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
  document.addEventListener("click", (e) => { const t = e.target.closest(".tab, a.li, a.gt, a.mt, a.nc, a.sostile"); if (t && !document.body.classList.contains("em")) Snd.chime("nav"); }, true);
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="tel:"]'); if (!a || !document.body.classList.contains("em")) return;
    const n = decodeURIComponent(a.getAttribute("href").slice(4)), w = n === "911" ? "Called 911" : "Called " + (a.textContent.trim().replace(/^call\s+/i, "") || n);
    Inc.add(w, cardView.id || ""); if (route.path === "emergency") setTimeout(render, 50);
  }, true);
  document.addEventListener("input", (e) => { if (e.target && e.target.id === "mapq") { MapView.q = e.target.value; const r = $("#mapres"); if (r) r.innerHTML = mapRes(); } });
  document.addEventListener("pointerdown", (e) => { if (e.target.closest(".beatart") && SR && SR.beat && SR.beat.phase === "run") { e.preventDefault(); Beat.tap(); } }, true);
  // An iPhone lets a page make sound only after a touch: unlock it on the first touch of every session (silently),
  // so the voice guide can speak the moment a card opens.
  ["pointerdown", "touchend", "keydown"].forEach((ev) => document.addEventListener(ev, function once() { Snd.ctx(); document.removeEventListener(ev, once, true); }, true));
  window.addEventListener("hashchange", render);
  document.addEventListener("visibilitychange", () => { if (document.hidden) flush(); else { if (document.body.classList.contains("em")) Wake.on(); Everything.carryOn(); } });
  window.addEventListener("online", () => { if (MapPk.state === "ready" && MapPk.why === "offline") { MapPk.state = "idle"; MapPk.load(); } Everything.carryOn(); });

  async function eraseAll() {
    await PdfV.close(); Media.close(); for (const x of LIB) if (typeOf(x) === "zim") ZR.drop(x.id); LIB = [];
    const keys = (await Store.keys()) || [];
    for (const k of keys) await Store.del(k);
    S = defaults(); PR = prefDefaults(); preparedFile = null; pendingCard = null; Inc.clear(); flush(); toast("Erased"); go("#/status");
  }

  /* ---------------- ticking clocks ---------------- */
  function tick() {
    const o = $("[data-tick=outage]"); if (o && S.outage.active) o.textContent = dur(now() - S.outage.startedAt);
    $$("[data-since]").forEach((el) => { const ms = now() - Number(el.dataset.since), d = Number(el.dataset.due || 0); el.textContent = mss(ms); if (d) { const b = el.closest(".emmark"); if (b) b.classList.toggle("due", ms >= d * 60e3); } });
    const c = $("[data-tick=checkin]"); if (c) { const n = E.nextCheckin(S.settings.checkins, now()); if (n) c.textContent = "in " + Math.floor(n.inMin / 60) + "h " + (n.inMin % 60) + "m"; }
  }
  setInterval(tick, 1000);

  /* ---------------- boot ---------------- */
  /* ---------------- WELCOME: the first-open intro and a guided tour of the real screens ----------------
     Shown once (and again from System or Guides). Touch to begin (an iPhone only plays sound after a touch), then the
     LABS ANALYTIX open: a synthesized chime, the HAVYN mark over the PS2 void, and the phone's best English voice (British
     first). Then a tour with a spotlight on the actual tabs and panels. On the Home Screen the tour ends by starting
     Download everything by itself. An Emergency button is on screen the whole time: someone opening HAVYN for the first
     time in an emergency is one tap from the cards, and HAVYN never shows the welcome again. */
  const Voice = {
    v: null,
    ok() { return "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function"; },
    pick() {
      if (!this.ok()) return null;
      const novelty = /(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Deranged|Good News|Hysterical|Jester|Junior|Organ|Pipe|Superstar|Trinoids|Whisper|Wobble|Zarvox|Fred|Ralph|Kathy|Grandma|Grandpa|Eddy|Flo|Reed|Rocko|Sandy|Shelley)/i;
      // An elegant British woman first: Serena or Martha (or Kate, Stephanie; Libby, Sonia, Maisie or "UK English Female" on other
      // systems), then any other woman's voice, never a man's while a woman's is there. Premium and Enhanced voices sound best.
      const gbF = /(Serena|Martha|Kate|Stephanie|Fiona|Libby|Sonia|Maisie|Hazel|Bella|UK English Female)/i, otherF = /(Moira|Karen|Tessa|Samantha|Ava|Zoe|Allison|Susan|Victoria|Nicky|Noelle|Catherine|Joelle|Kathy)/i,
        male = /(Daniel|Arthur|Oliver|Malcolm|Jamie|Gordon|George|Ryan|Thomas|Alfie|Elliot|Ethan|Noah|Rishi|Lee|Tom|Evan|Nathan|Aaron|Alex|UK English Male|Fred)/i;
      const score = (x) => { const l = String(x.lang || "").replace("_", "-");
        return (/premium/i.test(x.name) ? 30 : /enhanced/i.test(x.name) ? 20 : 0) + (gbF.test(x.name) ? 100 : otherF.test(x.name) ? 45 : 0) - (male.test(x.name) ? 120 : 0) +
          (/^en-GB/i.test(l) ? 12 : /^en-(IE|AU|NZ|ZA)/i.test(l) ? 5 : 0) + (x.localService ? 3 : 0); };
      let vs = []; try { vs = speechSynthesis.getVoices().filter((x) => /^en/i.test(x.lang || "") && !novelty.test(x.name)); } catch (e) {}
      vs.sort((a, b) => score(b) - score(a));
      return (this.v = vs[0] || null);
    },
    unlock() {   // must run inside the touch
      if (!this.ok()) return;
      try { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; speechSynthesis.speak(u); } catch (e) {}
      if (!this.pick()) try { speechSynthesis.addEventListener("voiceschanged", () => this.pick(), { once: true }); } catch (e) {}
    },
    say(t) {
      if (Welcome.muted || !t) return;
      if (Clips.has(t)) { this.stop(); Clips.play(t).then((ok) => { if (ok === false) this.speak(t); }); return; }
      this.speak(t);
    },
    speak(t) {
      if (!this.ok() || Welcome.muted || !t) return;
      try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t), v = this.v || this.pick(); if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "en-GB"; u.rate = 0.92; u.pitch = 1.02; speechSynthesis.speak(u); } catch (e) {}
    },
    stop() { Clips.stop(); try { if (this.ok()) speechSynthesis.cancel(); } catch (e) {} },
    // what System shows: the voice in use, and whether it's the British woman's voice HAVYN was made for
    info() { const v = this.v || this.pick(); return v ? { name: v.name, lang: v.lang, gb: /(Serena|Martha|Kate|Stephanie|Fiona|Libby|Sonia|Maisie|Hazel|Bella|UK English Female)/i.test(v.name) } : null; }
  };
  // HAVYN's own voice: every line the welcome and the tour speak, pre-rendered in an elegant British woman's voice
  // (Kokoro-82M, tools/voice_render.py) and shipped with the app, so it sounds the same on every phone, offline.
  // Played through Web Audio, which the first touch unlocks; a line with no recording falls back to the phone's voice.
  const Clips = {
    map: null, buf: {}, played: [], src: null, seq: 0,
    init() { if (this.map) return; this.map = {}; this.ids = {}; const V = window.HAVYN_VOICE; if (V && V.lines) for (const k in V.lines) { const u = "./voice/" + V.lines[k].file + "?" + (V.lines[k].sha || ""); this.map[V.lines[k].text] = u; this.ids[k] = V.lines[k].text; } },
    hasId(id) { this.init(); return !!this.ids[id]; },
    playId(id) { this.init(); return this.ids[id] ? this.play(this.ids[id]) : Promise.resolve(false); },
    has(t) { this.init(); return !!this.map[t]; },
    load(t) {
      this.init(); const u = this.map[t], a = Snd.ctx(); if (!u || !a) return Promise.resolve(null);
      if (!this.buf[u]) this.buf[u] = fetch(u).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error("HTTP " + r.status))))
        .then((ab) => new Promise((res, rej) => a.decodeAudioData(ab, res, rej))).catch(() => { delete this.buf[u]; return null; });
      return this.buf[u];
    },
    preload() { this.init(); Object.keys(this.map).forEach((t) => this.load(t)); },
    // true: playing; false: can't play it (fall back); null: a newer line or a stop came first (stay quiet).
    async play(t) {
      const my = ++this.seq, b = await this.load(t), a = Snd.ctx();
      if (my !== this.seq) return null;
      if (!b || !a || (Welcome.on && Welcome.muted)) return false;
      this.halt(); if (a.state === "suspended") try { await a.resume(); } catch (e) {}
      if (my !== this.seq) return null;
      const s = a.createBufferSource(), g = a.createGain(); g.gain.value = 1; s.buffer = b; s.connect(g).connect(a.destination); s.start(); this.src = s; this.played.push(t); return true;
    },
    stop() { this.seq++; this.halt(); },
    halt() { try { if (this.src) this.src.stop(); } catch (e) {} this.src = null; }
  };
  // While the welcome plays, its sound plays like a video (even with the ring switch on silent); after it, back to normal.
  const AudioMode = { set(t) { try { if (navigator.audioSession) navigator.audioSession.type = t; } catch (e) {} } };

  // The open's sound, made on the phone: a low swell that opens into an unresolved A major chord, a bell as the mark lands,
  // and soft ticks as the letters resolve. No audio files.
  const WelSnd = {
    out() {
      const a = Snd.ctx(); if (!a || Welcome.muted) return null;
      if (!this.bus || this.bus.context !== a) {
        const o = a.createGain(), dl = a.createDelay(1), fb = a.createGain(), lp = a.createBiquadFilter(), wet = a.createGain();
        o.gain.value = 0.9; dl.delayTime.value = 0.29; fb.gain.value = 0.4; lp.type = "lowpass"; lp.frequency.value = 2600; wet.gain.value = 0.33;
        o.connect(a.destination); o.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(wet); wet.connect(a.destination);
        this.bus = o;
      }
      return a;
    },
    tone(f, at, dur, peak, type, det, atk) {
      const a = this.out(); if (!a) return;
      const o = a.createOscillator(), g = a.createGain(); o.type = type || "sine"; o.frequency.value = f; if (det) o.detune.value = det;
      g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(peak, at + (atk || Math.min(1.4, dur * 0.35))); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      o.connect(g).connect(this.bus); o.start(at); o.stop(at + dur + 0.05);
    },
    boot() {
      const a = this.out(); if (!a) return; const t = a.currentTime + 0.05;
      this.tone(55, t, 6, 0.05); this.tone(110, t + 0.1, 5.6, 0.03, "triangle");
      [[164.81, 0.5], [246.94, 0.9], [277.18, 1.3], [415.3, 1.7]].forEach(([f, d]) => { this.tone(f, t + d, 5 - d * 0.6, 0.016, "sine", -5); this.tone(f, t + d, 5 - d * 0.6, 0.011, "sine", 6); });
    },
    bell() { const a = this.out(); if (!a) return; const t = a.currentTime + 0.02; [[1760, 0.03, 2.6], [2637, 0.012, 1.7], [3520, 0.005, 1.1]].forEach(([f, g, d]) => this.tone(f, t, d, g, "sine", 0, 0.006)); },
    tick(i) { const a = this.out(); if (!a) return; this.tone(2200 + (i % 5) * 180, a.currentTime + 0.005, 0.05, 0.006, "sine", 0, 0.003); },
    step() { const a = this.out(); if (!a) return; const t = a.currentTime + 0.01; this.tone(1318.5, t, 0.22, 0.02, "sine", 0, 0.008); this.tone(1975.5, t + 0.06, 0.3, 0.012, "sine", 0, 0.008); }
  };
  // The void behind the open: a perspective floor drifting toward you and dust rising through the light (PS2-era boot).
  const WelFx = {
    raf: 0,
    start(c) {
      const g = c.getContext && c.getContext("2d"); if (!g) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1), still = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const size = () => { c.width = Math.round(innerWidth * dpr); c.height = Math.round(innerHeight * dpr); };
      size(); this.size = size; addEventListener("resize", size);
      const dust = Array.from({ length: 64 }, () => ({ x: Math.random(), y: Math.random(), z: 0.25 + Math.random() * 0.75, s: Math.random() * 6.28 }));
      const t0 = performance.now();
      const frame = (nw) => {
        const w = c.width, h = c.height, t = (nw - t0) / 1000, hy = h * 0.66;
        g.clearRect(0, 0, w, h);
        g.lineWidth = dpr; g.strokeStyle = "rgba(92,232,255,0.11)";
        for (let i = -14; i <= 14; i++) { g.beginPath(); g.moveTo(w / 2 + i * w * 0.018, hy); g.lineTo(w / 2 + i * w * 0.2, h); g.stroke(); }
        for (let k = 0; k < 16; k++) { const z = (k + (still ? 0 : (t * 0.3) % 1)) / 16, y = hy + (h - hy) * z * z; g.globalAlpha = Math.min(1, z * 1.8); g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
        g.globalAlpha = 1;
        const glow = g.createRadialGradient(w / 2, hy, 0, w / 2, hy, w * 0.7); glow.addColorStop(0, "rgba(47,180,255,0.16)"); glow.addColorStop(1, "rgba(47,180,255,0)");
        g.fillStyle = glow; g.fillRect(0, 0, w, h);
        for (const q of dust) {
          if (!still) { q.y -= 0.0007 * q.z; if (q.y < -0.02) { q.y = 1.02; q.x = Math.random(); } }
          g.fillStyle = "rgba(166,255,240," + (0.12 + q.z * 0.42).toFixed(3) + ")"; g.beginPath(); g.arc(q.x * w + Math.sin(t * 0.5 + q.s) * 5 * dpr, q.y * h, (0.5 + q.z * 1.5) * dpr, 0, 6.2832); g.fill();
        }
        this.raf = requestAnimationFrame(frame);
      };
      this.raf = requestAnimationFrame(frame);
    },
    stop() { cancelAnimationFrame(this.raf); if (this.size) removeEventListener("resize", this.size); this.size = null; }
  };
  function scramble(el, text, ms, onStep) {
    const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+=/<>#", t0 = performance.now(); let last = -1;
    return new Promise((done) => {
      const frame = () => {
        const p = Math.min(1, (performance.now() - t0) / ms), n = Math.floor(p * text.length);
        if (n !== last) { last = n; if (onStep) onStep(n); }
        el.textContent = Array.from(text, (ch, i) => (ch === " " || i < n ? ch : glyphs[(Math.random() * glyphs.length) | 0])).join("");
        if (p < 1) requestAnimationFrame(frame); else { el.textContent = text; done(); }
      };
      frame();
    });
  }
  const Welcome = {
    on: false, muted: false, i: -1, seq: 0, iv: 0,
    should() { return !PR.introSeen && !window.__HAVYN_NO_INTRO && !/^#\/(emergency|library\/|field\?|playbooks\/)/.test(location.hash || ""); },
    open(replay) {
      if (this.on) return;
      this.on = true; this.replay = !!replay; this.muted = !PR.sound; this.i = -1; const seq = ++this.seq;
      const d = document.createElement("div"); d.id = "wel"; d.className = "wel"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-label", "Welcome to HAVYN");
      d.innerHTML = '<canvas class="welfx" aria-hidden="true"></canvas>' +
        '<div class="weltop"><button class="welsos" data-act="wel-sos"><span class="d"></span>Emergency now</button><button class="welskip" data-act="wel-skip">Skip</button></div>' +
        '<div class="welstage" data-act="wel-begin">' +   // a touch anywhere begins; once the mark is up, a touch moves on to the tour
          '<button class="welbegin" data-act="wel-begin"><span class="ring" aria-hidden="true"><i></i><i></i><i></i></span><span class="t">TOUCH TO BEGIN</span><small>' + (this.muted ? "Sound is off in System" : "Sound on for the welcome") + "</small></button>" +
          '<div class="wellabs" aria-hidden="true"><div class="scan"></div><b id="wellabs">LABS ANALYTIX</b><small>PRESENTS</small></div>' +
          '<div class="weltowers" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>' +
          '<div class="welmark"><div class="w" aria-label="HAVYN">' + Array.from("HAVYN", (c) => "<span>" + c + "</span>").join("") + '</div><div class="s">FIELD · OFFLINE EMERGENCY SYSTEM</div><div class="tag">Ready when the grid isn\'t.</div></div>' +
        "</div>";
      document.body.appendChild(d); document.body.classList.add("welcoming");
      WelFx.start(d.querySelector(".welfx"));
      requestAnimationFrame(() => requestAnimationFrame(() => { if (seq === this.seq) d.classList.add("in"); }));
    },
    async begin() {
      const d = $("#wel"); if (!d) return;
      if (d.classList.contains("go")) { if (d.classList.contains("p2") && !$("#tour")) this.tour(0); return; }
      const seq = this.seq, alive = () => seq === this.seq && this.on && !!$("#wel"), rm = matchMedia("(prefers-reduced-motion: reduce)").matches;
      AudioMode.set("playback"); Snd.ctx(); Voice.unlock(); Clips.preload();   // inside the touch: sound and voice are allowed from here on
      d.classList.add("go"); WelSnd.boot();
      await pause(rm ? 80 : 500); if (!alive()) return;
      d.classList.add("p1");
      await scramble($("#wellabs"), "LABS ANALYTIX", rm ? 150 : 1150, (n) => WelSnd.tick(n)); if (!alive()) return;
      await pause(rm ? 350 : 1250); if (!alive()) return;
      d.classList.add("p2");
      await pause(rm ? 250 : 1000); if (!alive()) return;
      WelSnd.bell(); Voice.say("Welcome to Haven.");   // spoken as a word: voices spell out capitals
      await pause(rm ? 700 : 1900); if (!alive()) return;
      d.classList.add("p3"); Voice.say("Let me show you around.");
      await pause(rm ? 900 : 2300); if (!alive()) return;
      this.tour(0);
    },
    steps() {
      const L = Ready.left(), size = L.n ? sz(L.bytes) : "", home = isStandalone();
      const ready = PREVIEW ? { t: "Everything, on every phone", d: "In HAVYN on your Home Screen, this is where the manuals and encyclopedias download by themselves, then work with no internet.", say: "In the app on your Home Screen, everything downloads right here, by itself." }
        : !L.n ? { t: "This phone is stocked", d: "The manuals and encyclopedias are already here and work with no internet. HAVYN tops them up when you open it on Wi-Fi.", say: "This phone already has everything. It works with no internet." }
        : home ? { t: "Getting this phone ready", d: "HAVYN is downloading everything now: " + L.n + " manuals and encyclopedias, " + size + ". Stay on Wi-Fi and keep HAVYN open; if it closes, it picks up where it stopped. Your first quest completes itself.", say: "Now I'm downloading everything this phone needs. Stay on Wi-Fi, and keep me open.", get: true }
        : { t: "One step left: the Home Screen", d: "Tap Share (in Safari's ••• menu if you don't see it), then Add to Home Screen. Open HAVYN from the new icon and it downloads everything by itself (" + size + " on Wi-Fi).", say: "One last step. Add Haven to your Home Screen, and open it from the icon." };
      return [
        { go: "#/status", at: "#ready .rdyhead", t: "Your level", d: "Your phone levels up as you finish quests: the downloads, your household, your supplies, a Memory Card. Most of it happens by itself, and every quest is a few taps.", say: "This is your command deck. Your level rises as you finish quests, and most of them finish themselves." },
        { go: "#/status", at: ".nowgrid", t: "What's happening?", d: "Tap what's going on: power out, extreme heat, a storm, smoke, unsafe water, an earthquake. You get everything for it in one place: the steps, the cards, the manual pages and the numbers to call.", say: "When something happens, tap it here. Everything you need is in one place." },
        { go: "#/status", at: ".simbanner", t: "Sim Lab", d: "Practice in about a minute: CPR to the beat, the sounds alarms make, scorpions and snakes, and quick missions. Stars as you go.", say: "Sim Lab trains you in about a minute. Tap, listen and decide." },
        { go: "#/status", at: ".tab.sos", t: "Someone hurt? The red button", d: "This red button, on every screen (and the red tile on Home), opens twenty step-by-step cards: CPR with a beat to follow, bleeding, choking, heart attack, heat stroke and more. Each card reads its steps aloud, keeps the times for the paramedics, and calls 911 in one tap.", say: "In an emergency, tap the red button. Each card talks you through it, step by step, and keeps the times for the paramedics." },
        { go: "#/guides", at: ".tab[data-tab=guides]", t: "Guides: know what to do", d: "How do I… opens the exact page in the manuals on this phone. Playbooks walk you through blackouts, extreme heat, storms and smoke.", say: "Guides tells you what to do, step by step." },
        { go: "#/family", at: ".tab[data-tab=family]", t: "Family: your people", d: "Everyone's medicines, allergies and needs. Fill it in once, then copy it to every phone with the Memory Card.", say: "Family keeps everyone's medicines, allergies and needs in one place." },
        { go: "#/supplies", at: ".tab[data-tab=supplies]", t: "Supplies: what you have", d: "Water, food, medicine and power on hand become days of autonomy, and HAVYN warns you before anything expires.", say: "Supplies turns what you have into days you can last." },
        { go: "#/status", at: ".tools a[href='#/search']", t: "Find anything", d: "Search looks through the cards, playbooks, your plan, and every page of every manual and encyclopedia on this phone. No internet needed.", say: "Search finds anything, even inside every manual, with no internet." },
        Object.assign({ go: "#/status", at: "#ready .rdyhead|#ready .bar.xp|#rdybar|#rdymsg" }, ready),
        { fin: true }
      ];
    },
    tour(i) {
      const d = $("#wel"); if (d && !d.classList.contains("out")) { d.classList.add("out"); setTimeout(() => { WelFx.stop(); d.remove(); }, 650); }
      let tv = $("#tour");
      if (!tv) {
        tv = document.createElement("div"); tv.id = "tour"; tv.className = "tour"; tv.setAttribute("role", "dialog"); tv.setAttribute("aria-modal", "true"); tv.setAttribute("aria-label", "A tour of HAVYN");
        tv.innerHTML = '<div class="thole"></div><div class="tcard"></div>';
        document.body.appendChild(tv);
        clearInterval(this.iv); this.iv = setInterval(() => this.place(), 450);
        addEventListener("resize", this.onrs = () => this.place());
      }
      const steps = this.steps(), s = steps[Math.max(0, Math.min(steps.length - 1, i))]; this.i = steps.indexOf(s); this.cur = s;
      const card = tv.querySelector(".tcard"), n = steps.length - 1;
      if (s.fin) {
        tv.classList.add("fin");
        card.innerHTML = '<div class="fintop"><div class="lab">HAVYN FIELD · ' + esc(VERSION.split("+")[0]) + '</div><h2>You\'re equipped.</h2><p>Everything here works with no internet, no signal and no account, and nothing you enter leaves this phone.</p></div>' +
          '<div class="finlist">' + [["heart", C.cards.length + " emergency cards", "Two taps from anywhere"], ["book", FIELD().length + " answers", "The exact page in the manuals"], ["globe", "Offline library", "Medical encyclopedia, manuals, maps help"], ["card", "Memory Card", "One family plan on every phone"]]
            .map(([icn, b, sm]) => '<div class="fi2">' + ic(icn) + "<span><b>" + esc(b) + "</b><small>" + esc(sm) + "</small></span></div>").join("") + "</div>" +
          '<div class="btnrow"><button class="btn" data-act="wel-done">Enter HAVYN</button></div><div class="tfoot"><button class="tlink" data-act="wel-back">Back</button><span>Replay this any time: System › Welcome tour</span></div>';
        WelSnd.bell(); Voice.say("You're equipped. Everything works with no internet, and nothing leaves this phone.");
        if (location.hash !== "#/status") location.hash = "#/status";
        this.place(); return;
      }
      tv.classList.remove("fin");
      card.innerHTML = '<div class="tmeta"><span class="lab">' + (this.i + 1) + " of " + n + '</span><span class="tdots">' + Array.from({ length: n }, (_, k) => "<i" + (k === this.i ? ' class="on"' : k < this.i ? ' class="done"' : "") + "></i>").join("") + "</span>" +
        '<button class="tmute" data-act="wel-mute" aria-label="' + (this.muted ? "Turn the voice on" : "Turn the voice off") + '">' + ic(this.muted ? "speakeroff" : "speaker") + "</button></div>" +
        "<h3>" + esc(s.t) + "</h3><p>" + esc(s.d) + "</p>" +
        (s.get ? '<div class="tget"><div class="bar"><i id="tgetbar"></i></div><button class="tlink" data-act="wel-pause">Not on Wi-Fi? Pause</button></div>' : "") +
        '<div class="btnrow"><button class="btn ghost" data-act="wel-back"' + (this.i ? "" : " disabled") + '>Back</button><button class="btn" data-act="wel-next">' + (this.i === n - 1 ? "Finish" : "Next") + "</button></div>" +
        '<div class="tfoot"><button class="tlink sos" data-act="wel-sos">Emergency now</button><button class="tlink" data-act="wel-skip">Skip tour</button></div>';
      if (s.go && location.hash !== s.go) location.hash = s.go;
      if (s.get && !Everything.busy && !Shelf.busy && !Arc.busy) { PR.autoGet = true; flush(); Everything.run(true); }
      WelSnd.step(); Voice.say(s.say);
      card.classList.remove("show"); void card.offsetWidth; card.classList.add("show");
      requestAnimationFrame(() => requestAnimationFrame(() => this.place(true)));
    },
    place(scroll) {
      const tv = $("#tour"), s = this.cur; if (!tv || !s) return;
      const hole = tv.querySelector(".thole"), card = tv.querySelector(".tcard"), vh = innerHeight;
      const bar = $("#tgetbar"); if (bar) { const b = Arc.busy ? Arc.pct() : Shelf.busy ? Shelf.pct() : 0; bar.style.width = Math.max(3, Math.min(100, b || 0)) + "%"; }
      // The spotlight goes round one element, or round several ("a|b|c") as one box.
      const els = !s.fin && s.at ? s.at.split("|").map((q) => Array.from(document.querySelectorAll(q)).find((x) => x.getClientRects().length)).filter(Boolean) : [];
      if (!els.length) { hole.classList.add("none"); Object.assign(hole.style, { left: "50%", top: "45%", width: "0px", height: "0px" }); card.classList.add("mid"); card.style.top = ""; return; }
      if (scroll) { const r0 = els[0].getBoundingClientRect(); if (r0.top < 60 || r0.bottom > vh - 90) els[0].scrollIntoView({ block: "center" }); }
      const rs = els.map((x) => x.getBoundingClientRect()), pad = 7;
      const r = { left: Math.min(...rs.map((x) => x.left)), top: Math.min(...rs.map((x) => x.top)), right: Math.max(...rs.map((x) => x.right)), bottom: Math.max(...rs.map((x) => x.bottom)) };
      r.width = r.right - r.left; r.height = r.bottom - r.top;
      hole.classList.remove("none"); card.classList.remove("mid");
      Object.assign(hole.style, { left: r.left - pad + "px", top: r.top - pad + "px", width: r.width + pad * 2 + "px", height: r.height + pad * 2 + "px" });
      const ch = card.offsetHeight, below = r.top + r.height / 2 < vh * 0.45;
      card.style.top = (below ? Math.min(vh - ch - 18, r.bottom + pad + 16) : Math.max(18, r.top - pad - 16 - ch)) + "px";
    },
    close(how) {
      this.seq++; this.on = false; this.cur = null; Voice.stop(); AudioMode.set("auto"); clearInterval(this.iv); if (this.onrs) removeEventListener("resize", this.onrs);
      WelFx.stop(); const d = $("#wel"), tv = $("#tour");
      if (d) d.remove();
      if (tv) { tv.classList.add("bye"); setTimeout(() => tv.remove(), 350); }
      document.body.classList.remove("welcoming");
      if (!PR.introSeen) PR.introSeen = Date.now(); flush();
      if (how === "sos") { location.hash = "#/emergency"; return; }
      if (location.hash !== "#/status") location.hash = "#/status";
      if (PR.autoGet && !PREVIEW && navigator.onLine !== false && !document.body.classList.contains("em")) setTimeout(() => Everything.run(true), 700);
    }
  };

  async function boot() {
    await Store.open();
    const st = await Store.get("state"), pr = await Store.get("prefs");
    if (st && typeof st === "object") { const d = defaults(); S = Object.assign(d, st); S.settings = Object.assign(d.settings, st.settings || {}); S.plan = Object.assign(d.plan, st.plan || {}); }
    if (pr && typeof pr === "object") PR = Object.assign(prefDefaults(), pr);
    const lib = await Store.get("lib"); LIB = Array.isArray(lib) ? lib.filter((x) => x && typeof x.id === "string") : [];
    const inc = await Store.get("incident"); INC = inc && Array.isArray(inc.ev) && inc.ev.length ? inc : null;
    const mp = await Store.get("maps"); MAPS = Array.isArray(mp) ? mp.filter((m) => m && m.id && Array.isArray(m.parts)) : [];
    const v = $(".void"); if (v && !v.children.length) for (let i = 0; i < 14; i++) { const m = document.createElement("i"); m.style.left = (5 + Math.random() * 90) + "%"; m.style.top = (40 + Math.random() * 55) + "%"; m.style.animationDelay = (-Math.random() * 22).toFixed(1) + "s"; v.appendChild(m); }
    // First open from the Home Screen: get everything onto this phone without being asked (the welcome says so, and Stop stops it).
    if (isStandalone() && !PREVIEW && !PR.setupAt) { PR.setupAt = Date.now(); PR.autoGet = true; PR.firstGet = true; flush(); }
    const intro = Welcome.should();
    if (intro) Welcome.open(false);   // before the first screen is drawn, so the app never flashes up behind it
    render();
    PdfIndex.kick();
    if (!intro && PR.autoGet && !PREVIEW && navigator.onLine !== false) setTimeout(() => { if (!document.body.classList.contains("em") && !Welcome.on) Everything.run(true); }, 3500);
    document.body.dataset.ready = "1";
    window.__HAVYN_READY_MS = Math.round(performance.now() - t0); window.__HAVYN_READY_AT = Math.round(performance.now());
    if (!PREVIEW && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").then((reg) => { Upd.init(reg); return navigator.serviceWorker.ready; }).then(() => { const s = $("#swst"); if (s) s.textContent = "Saved for offline"; }).catch(() => { const s = $("#swst"); if (s) s.textContent = "Not available"; });
    }
  }
  window.__HAVYN = { upd: Upd, maps: { pk: MapPk, view: MapView, get have() { return MAPS; } }, get sim() { return SR; }, sims: SIMS, beat: Beat, drill: Drill, alarm: AlarmSnd, get incident() { return INC; }, get state() { return S; }, get prefs() { return PR; }, get lib() { return LIB; }, E, C, version: VERSION, arc: Arc, shelf: Shelf, ready: Ready, store: Store, welcome: Welcome, voice: Voice, clips: Clips };
  boot();
})();
