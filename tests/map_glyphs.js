/* HAVYN map glyph check: every character a label can show in the offline map packs has a glyph in the fonts HAVYN ships.
   Reads PMTiles v3 archives directly (directories, gzip MVT tiles), collects the label fields the style displays,
   and checks each character against the SDF glyph files in src/maps/fonts.
   Only tiles the app can show count (zoom 5 and up: it keeps the map on the stored area). Emoji and invisible format
   characters are left out: no map font draws them, and the app answers their glyph requests with nothing.
   Passes when every town, road and water name has all its glyphs; anything else missing is listed.
   Run: node tests/map_glyphs.js [--json] /tmp/havyn-map-packs/*.pmtiles */
"use strict";
const fs = require("fs"), path = require("path"), zlib = require("zlib");

const LABEL_KEYS = new Set(["name", "name:en", "pgf:name", "name2", "name3", "pgf:name2", "pgf:name3", "ref", "ref:en", "shield_text", "addr_housenumber"]);
const FONTS = path.join(__dirname, "..", "src", "maps", "fonts");

function varint(b, st) { let r = 0, s = 0, c; do { c = b[st.i++]; r += (c & 0x7f) * 2 ** s; s += 7; } while (c >= 0x80); return r; }
function* fields(b) {
  const st = { i: 0 };
  while (st.i < b.length) {
    const key = varint(b, st), f = Math.floor(key / 8), t = key & 7;
    if (t === 0) yield [f, t, varint(b, st)];
    else if (t === 2) { const n = varint(b, st); yield [f, t, b.subarray(st.i, st.i + n)]; st.i += n; }
    else if (t === 5) { st.i += 4; } else if (t === 1) { st.i += 8; } else throw new Error("bad wire type " + t);
  }
}
function packed(b) { const st = { i: 0 }, out = []; while (st.i < b.length) out.push(varint(b, st)); return out; }
const utf8 = new TextDecoder();

// ---- glyphs: codepoints present per font
function glyphSet(font) {
  const set = new Set(), dir = path.join(FONTS, font);
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".pbf"))) {
    for (const [fs1, , stack] of fields(fs.readFileSync(path.join(dir, f)))) if (fs1 === 1)
      for (const [f2, , g] of fields(stack)) if (f2 === 3)
        for (const [f3, t3, v] of fields(g)) if (f3 === 1 && t3 === 0) set.add(v);
  }
  return set;
}

// ---- PMTiles v3
function u64(b, o) { return Number(b.readBigUInt64LE(o)); }
function zoomOf(id) { let acc = 0; for (let z = 0; z < 32; z++) { const n = 4 ** z; if (id < acc + n) return z; acc += n; } return 32; }
function readDir(fd, off, len, comp) {
  const raw = Buffer.alloc(len); fs.readSync(fd, raw, 0, len, off);
  const b = comp === 2 ? zlib.gunzipSync(raw) : raw, st = { i: 0 };
  const n = varint(b, st), ids = [], runs = [], lens = [], offs = [];
  let last = 0;
  for (let k = 0; k < n; k++) { last += varint(b, st); ids.push(last); }
  for (let k = 0; k < n; k++) runs.push(varint(b, st));
  for (let k = 0; k < n; k++) lens.push(varint(b, st));
  for (let k = 0; k < n; k++) { const v = varint(b, st); offs.push(v === 0 && k > 0 ? offs[k - 1] + lens[k - 1] : v - 1); }
  return ids.map((id, k) => ({ id, run: runs[k], len: lens[k], off: offs[k] }));
}
function tiles(file) {
  const fd = fs.openSync(file, "r"), h = Buffer.alloc(127); fs.readSync(fd, h, 0, 127, 0);
  if (h.toString("latin1", 0, 7) !== "PMTiles" || h[7] !== 3) throw new Error(file + " isn't a PMTiles v3 archive");
  const H = { root: [u64(h, 8), u64(h, 16)], leaf: u64(h, 40), data: u64(h, 56), ic: h[97], tc: h[98] };
  const out = new Map(), todo = [readDir(fd, H.root[0], H.root[1], H.ic)];
  while (todo.length) for (const e of todo.pop()) {
    if (e.run === 0) { todo.push(readDir(fd, H.leaf + e.off, e.len, H.ic)); continue; }
    const z = zoomOf(e.id + e.run - 1), t = out.get(e.off);
    out.set(e.off, { len: e.len, z: t ? Math.max(t.z, z) : z });
  }
  return { fd, H, out };
}

function scan(files, minZoom) {
  const used = new Map(), scripts = new Map(); let nt = 0, nf = 0;
  const note = (s, layer) => { for (const ch of s) { const cp = ch.codePointAt(0); if (cp <= 32 || cp > 0xffff || /\p{Cf}|\p{Mn}(?<=[\uFE00-\uFE0F])/u.test(ch)) continue; const u = used.get(cp) || { n: 0, ex: s, layers: {} }; u.n++; u.layers[layer] = (u.layers[layer] || 0) + 1; used.set(cp, u); } };
  for (const file of files) {
    const { fd, H, out } = tiles(file);
    for (const [off, { len, z }] of out) {
      if (z < (minZoom || 0)) continue;
      const raw = Buffer.alloc(len); fs.readSync(fd, raw, 0, len, H.data + off); nt++;
      const mvt = H.tc === 2 ? zlib.gunzipSync(raw) : raw;
      for (const [f, , layer] of fields(mvt)) {
        if (f !== 3) continue;
        let name = "", keys = [], vals = [], feats = [];
        for (const [lf, , v] of fields(layer)) {
          if (lf === 1) name = utf8.decode(v);
          else if (lf === 2) feats.push(v);
          else if (lf === 3) keys.push(utf8.decode(v));
          else if (lf === 4) { let sv = null; for (const [vf, vt, vv] of fields(v)) if (vf === 1 && vt === 2) sv = utf8.decode(vv); vals.push(sv); }
        }
        const want = new Set(keys.map((k, i) => (LABEL_KEYS.has(k) || k === "script" ? i : -1)).filter((i) => i >= 0));
        if (!want.size) continue;
        for (const ft of feats) {
          nf++;
          for (const [ff, , fv] of fields(ft)) if (ff === 2) {
            const tg = packed(fv);
            for (let i = 0; i < tg.length; i += 2) if (want.has(tg[i]) && vals[tg[i + 1]] != null) {
              if (keys[tg[i]] === "script") scripts.set(vals[tg[i + 1]], (scripts.get(vals[tg[i + 1]]) || 0) + 1);
              else note(vals[tg[i + 1]], name);
            }
          }
        }
      }
    }
    fs.closeSync(fd);
  }
  return { used, scripts, nt, nf };
}

if (require.main === module) {
  const args = process.argv.slice(2), json = args.includes("--json"), files = args.filter((a) => a !== "--json");
  if (!files.length) { console.error("usage: node tests/map_glyphs.js [--json] pack.pmtiles..."); process.exit(2); }
  const fonts = fs.readdirSync(FONTS).filter((f) => fs.statSync(path.join(FONTS, f)).isDirectory());
  const G = Object.fromEntries(fonts.map((f) => [f, glyphSet(f)]));
  const t0 = Date.now(), { used, scripts, nt, nf } = scan(files, 5);
  const missing = [...used].filter(([cp]) => fonts.some((f) => !G[f].has(cp))).sort((a, b) => b[1].n - a[1].n);
  const NAV = ["places", "roads", "water"], hex = (cp) => "U+" + cp.toString(16).toUpperCase().padStart(4, "0");
  const navMissing = missing.filter(([, u]) => NAV.some((l) => u.layers[l]));
  const lost = missing.reduce((a, [, u]) => a + u.n, 0), all = [...used.values()].reduce((a, u) => a + u.n, 0);
  const res = { tiles: nt, features: nf, chars: used.size, uses: all, fonts: Object.fromEntries(fonts.map((f) => [f, G[f].size])), scripts: Object.fromEntries(scripts),
    missing: missing.map(([cp, u]) => ({ cp: hex(cp), ch: String.fromCodePoint(cp), n: u.n, layers: u.layers, example: u.ex.slice(0, 40) })), lostUses: lost, navMissing: navMissing.length, seconds: (Date.now() - t0) / 1000 };
  if (json) console.log(JSON.stringify(res));
  else {
    console.log("tiles %d (zoom 5+), labelled features %d, distinct characters %d, %s s", nt, nf, used.size, res.seconds.toFixed(1));
    console.log("fonts:", fonts.map((f) => f + " " + G[f].size).join(", "), "· scripts:", JSON.stringify(res.scripts));
    for (const m of res.missing) console.log("  missing %s %s ×%d %j e.g. %j", m.cp, m.ch, m.n, m.layers, m.example);
    console.log("characters without a glyph: %d distinct, %d of %d uses; in town, road or water names: %d", missing.length, lost, all, navMissing.length);
  }
  process.exit(navMissing.length ? 1 : 0);
}
module.exports = { glyphSet, scan, tiles, zoomOf };
