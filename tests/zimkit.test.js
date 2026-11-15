/* HAVYN zimkit tests: XZ decoder against Python/xz reference vectors, ZIM reader against the openzim test suite.
   Run: node tests/zimkit.test.js [xz-vector-dir] [zim-testing-suite/data] */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm"), crypto = require("crypto");
const root = path.join(__dirname, "..");
vm.runInThisContext(fs.readFileSync(path.join(root, "vendor/fzstd/fzstd.js"), "utf8") + "\n" + fs.readFileSync(path.join(root, "src/zimkit.js"), "utf8"), { filename: "zimkit.js" });
const Z = globalThis.HavynZim;
const XZDIR = process.argv[2] || "/tmp/xzvec";
const DATA = process.argv[3] || "/home/claude/openzim/zim-testing-suite/data";
let pass = 0, fail = 0; const fails = [];
const ok = (c, name) => { if (c) pass++; else { fail++; fails.push(name); console.log("  FAIL " + name); } };
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const blobOf = async (p) => fs.openAsBlob(p);
async function timed(fn, ms) { let t; return Promise.race([fn(), new Promise((_, r) => { t = setTimeout(() => r(new Error("timeout")), ms); })]).finally(() => clearTimeout(t)); }

async function testXz() {
  const names = fs.readdirSync(XZDIR).filter((f) => f.endsWith(".xz")).map((f) => f.slice(0, -3)).sort();
  for (const n of names) {
    const raw = fs.readFileSync(path.join(XZDIR, n + ".raw")), comp = new Uint8Array(fs.readFileSync(path.join(XZDIR, n + ".xz")));
    const t = performance.now();
    let out; try { out = Z.XZ.decompress(comp); } catch (e) { out = null; console.log("   xz " + n + " threw " + e.message); }
    ok(out && out.length === raw.length && sha(out) === sha(raw), "xz " + n);
    const tail = new Uint8Array(comp.length + 64); tail.set(comp); tail.fill(0xAB, comp.length);
    let out2 = null; try { out2 = Z.XZ.decompress(tail); } catch (e) {}
    ok(out2 && sha(out2) === sha(raw), "xz " + n + " ignores trailing bytes");
    if (n === "mixed") console.log("   xz mixed: " + (raw.length / 1e6).toFixed(1) + " MB in " + Math.round(performance.now() - t) + " ms");
  }
  // Truncated input must throw, never return garbage
  const comp = new Uint8Array(fs.readFileSync(path.join(XZDIR, "text6.xz")));
  for (const cut of [5, 13, 40, 1000, comp.length - 40]) { let threw = false; try { Z.XZ.decompress(comp.subarray(0, cut)); } catch (e) { threw = true; } ok(threw, "xz truncated at " + cut + " throws"); }
}

async function walk(a, limit) {
  const out = new Map(); const n = Math.min(a.entryCount, limit || 1e9);
  for (let i = 0; i < n; i++) {
    const d = await a.direntAt(i);
    if (d.redirect >= 0 || d.special) continue;
    out.set(a.pathOf(d) + "", { d, b: await a.bytes(d) });
  }
  return out;
}

async function testValid() {
  for (const variant of ["withns", "nons", "noTitleListingV0"]) {
    for (const f of ["small.zim", "wikibooks_be_all_nopic_2017-02.zim", "wikipedia_en_climate_change_mini_2024-06.zim"]) {
      const p = path.join(DATA, variant, f); if (!fs.existsSync(p)) continue;
      const tag = variant + "/" + f;
      const a = await Z.Archive.open(await blobOf(p));
      const info = await a.info();
      ok(!!info.title && info.title !== "Untitled archive", tag + " has a title (" + info.title + ")");
      ok(!!info.main, tag + " main page (" + info.main + ")");
      const main = await a.byPath(info.main);
      ok(main && a.mimeOf(await a.resolve(main)).startsWith("text/html"), tag + " main page resolves to HTML");
      const html = main ? await a.text(await a.resolve(main)) : "";
      ok(/<html|<body|<div|<p/i.test(html), tag + " main page looks like HTML");
      ok(!!a.listing, tag + " has a title listing (v" + (a.listing && a.listing.v) + ")");
      const t0 = performance.now();
      const all = await walk(a);
      ok(all.size > 0, tag + " every entry readable (" + all.size + " blobs, " + Math.round(performance.now() - t0) + " ms)");
      const fav = await a.favicon();
      ok(!!fav && fav.mime.startsWith("image/"), tag + " favicon");
      // search: prefix of the main page title must find it
      const mt = info.mainTitle || "";
      if (a.listing && mt) {
        const res = await a.search(mt.slice(0, Math.min(6, mt.length)), 50);
        ok(res.length > 0, tag + " search '" + mt.slice(0, 6) + "' finds results");
      }
      // brute force check: listing is sorted and search(prefix) == brute force for one prefix
      if (a.listing && a.listing.count > 50) {
        let sorted = true, prev = null; const titles = [];
        for (let i = 0; i < a.listing.count; i++) { const d = await a.direntAt(await a.listing.at(i)); if (prev !== null && Z.cmp(prev, d.title) > 0) sorted = false; prev = d.title; if (await a.isArticle(d)) titles.push(d.title); }
        ok(sorted, tag + " title listing is sorted");
        const pre = titles[Math.floor(titles.length / 2)].slice(0, 4);
        const brute = titles.filter((t) => t.startsWith(pre)).slice(0, 15);
        const got = (await a.prefix(pre, 15)).map((d) => d.title);
        ok(JSON.stringify(brute) === JSON.stringify(got), tag + " prefix '" + pre + "' matches brute force (" + got.length + ")");
        const lower = await a.search(pre.toLowerCase(), 15);
        ok(lower.length >= Math.min(1, brute.length), tag + " lowercase search finds '" + pre + "'");
        const r = await a.random(); ok(!!r && a.mimeOf(r).startsWith("text/html"), tag + " random article");
      }
      globalThis["__" + variant + f] = all;
    }
  }
  // Cross-check: same content, different layout and compression (XZ in withns, Zstandard in nons)
  for (const f of ["small.zim", "wikibooks_be_all_nopic_2017-02.zim", "wikipedia_en_climate_change_mini_2024-06.zim"]) {
    const A = globalThis["__withns" + f], B = globalThis["__nons" + f]; if (!A || !B) continue;
    // Old layout links read "../-/s/style.css" or "../I/x.png"; new layout links drop the namespace. Normalise HTML only.
    const norm = (b) => Buffer.from(b).toString("utf8").replace(/((?:href|src)=["'])(?:\.\.\/)+[-AIJ]\//g, "$1").replace(/((?:href|src)=["'])\.\//g, "$1");
    let same = 0, diff = 0, missing = 0, htmlSame = 0, htmlDiff = 0;
    for (const [p, v] of A) {
      if (p[1] !== "/" || !"AI-".includes(p[0])) continue;
      const w = B.get(p.slice(2)) || B.get(p);
      if (!w) { missing++; continue; }
      const isHtml = (globalThis.__mimeA || (() => ""))(v) || /<html/i.test(Buffer.from(v.b.subarray(0, 400)).toString());
      if (isHtml) { if (norm(v.b) === norm(w.b)) htmlSame++; else htmlDiff++; }
      else if (sha(v.b) === sha(w.b)) same++; else diff++;
    }
    console.log("   cross " + f + ": assets " + same + " identical / " + diff + " differ; html " + htmlSame + " same after link normalising / " + htmlDiff + " differ; " + missing + " missing");
    ok(diff === 0 && same + htmlSame > 0, "cross-layout assets byte-identical (XZ vs Zstandard) for " + f);
    ok(htmlSame >= htmlDiff * 9, "cross-layout HTML matches after link normalising for " + f);
  }
  // Against original source files
  const src = path.join(DATA, "..", "src", "small_zimfile_data");
  if (fs.existsSync(src)) {
    const a = await Z.Archive.open(await blobOf(path.join(DATA, "withns", "small.zim")));
    const m = await a.byPath("A/main.html"); const t = m ? await a.text(m) : "";
    const orig = fs.readdirSync(src).find((x) => /main/.test(x));
    if (orig) ok(t === fs.readFileSync(path.join(src, orig), "utf8"), "small.zim main.html equals source file");
  }
}

async function testSplit() {
  for (const variant of ["withns", "nons"]) {
    const dir = path.join(DATA, variant); const parts = fs.readdirSync(dir).filter((x) => /_splitted\.zima[a-z]$/.test(x)).sort();
    if (!parts.length) continue;
    const blob = new Blob(await Promise.all(parts.map((x) => blobOf(path.join(dir, x)))));
    const a = await Z.Archive.open(blob), b = await Z.Archive.open(await blobOf(path.join(dir, "wikibooks_be_all_nopic_2017-02.zim")));
    const A = await walk(a), B = await walk(b);
    let same = true; for (const [p, v] of B) { const w = A.get(p); if (!w || sha(w.b) !== sha(v.b)) { same = false; break; } }
    ok(same && A.size === B.size, variant + " split archive (" + parts.length + " parts) reads identically");
  }
}

async function testInvalid() {
  for (const variant of ["withns", "nons", "noTitleListingV0"]) {
    const dir = path.join(DATA, variant);
    for (const f of fs.readdirSync(dir).filter((x) => x.startsWith("invalid."))) {
      let outcome = "";
      try {
        await timed(async () => {
          const a = await Z.Archive.open(await blobOf(path.join(dir, f)));
          await a.info();
          let errs = 0; for (let i = 0; i < a.entryCount; i++) { try { const d = await a.direntAt(i); if (d.redirect < 0 && !d.special) await a.bytes(d); } catch (e) { errs++; if (!(e && e.name === "ZimError")) throw e; } }
          outcome = errs ? "errors:" + errs : "clean";
        }, 15000);
      } catch (e) { outcome = e && e.name === "ZimError" ? "rejected" : "CRASH " + (e && e.message); }
      ok(!outcome.startsWith("CRASH") && outcome !== "", variant + "/" + f + " handled (" + outcome + ")");
    }
  }
  let threw = false; try { await Z.Archive.open(new Blob([new Uint8Array(100)])); } catch (e) { threw = e.name === "ZimError"; } ok(threw, "random bytes rejected as not ZIM");
}

(async () => {
  console.log("XZ decoder"); await testXz();
  console.log("ZIM archives"); await testValid();
  console.log("Split archives"); await testSplit();
  console.log("Damaged archives"); await testInvalid();
  console.log("\n" + pass + " passed, " + fail + " failed");
  if (fail) { console.log("FAILED: " + fails.join(" | ")); process.exit(1); }
})().catch((e) => { console.error(e); process.exit(2); });
