/* HAVYN ZIMKIT - offline reader for Kiwix ZIM archives (openzim.org ZIM format).
 * Written for HAVYN from the published file format; no Kiwix code is included.
 * Reads straight from a Blob (a file saved on the phone), so a 5 GB archive never has to fit in memory.
 * Zstandard clusters use fzstd (MIT, prepended by the build). XZ/LZMA2 clusters use the decoder below.
 * Works in a page (dynamic import) and in the service worker (importScripts). */
(function (G) {
  "use strict";

  const td = new TextDecoder("utf-8");
  const TWO32 = 4294967296;
  const zerr = (msg, code) => Object.assign(new Error(msg), { name: "ZimError", code: code || "bad" });

  /* ---------------- XZ / LZMA2 decoder (whole stream in memory) ---------------- */
  const XZ = (() => {
    const O_ISMATCH = 0, O_ISREP = 192, O_ISREPG0 = 204, O_ISREPG1 = 216, O_ISREPG2 = 228, O_ISREP0LONG = 240,
      O_POSSLOT = 432, O_SPECPOS = 688, O_ALIGN = 803, O_LEN = 819, O_REPLEN = 1333, O_LIT = 1847;
    const bad = (m) => zerr("XZ data is damaged (" + m + ")", "xz");

    function Lzma() {
      let probs = null, lc = 0, lp = 0, pb = 0, state = 0, rep0 = 0, rep1 = 0, rep2 = 0, rep3 = 0;
      this.props = (b) => {
        if (b > 224) throw bad("props");
        lc = b % 9; b = (b / 9) | 0; lp = b % 5; pb = (b / 5) | 0;
        if (lc + lp > 4) throw bad("lc+lp");
        probs = new Uint16Array(O_LIT + (0x300 << (lc + lp)));
      };
      this.reset = () => { if (!probs) throw bad("no props"); probs.fill(1024); state = 0; rep0 = rep1 = rep2 = rep3 = 0; };
      // Decode exactly n bytes of one LZMA2 chunk. inp[ip..ipEnd) holds the chunk (5-byte range coder init first).
      this.chunk = (inp, ip, ipEnd, out, dictStart, dictSize, n) => {
        if (inp[ip] !== 0) throw bad("rc init");
        let range = 0xFFFFFFFF, code = ((inp[ip + 1] << 24) | (inp[ip + 2] << 16) | (inp[ip + 3] << 8) | inp[ip + 4]) >>> 0;
        ip += 5;
        const P = probs;
        const bit = (i) => {
          const p = P[i], bound = (range >>> 11) * p;
          let b;
          if (code < bound) { range = bound; P[i] = p + ((2048 - p) >>> 5); b = 0; }
          else { range = (range - bound) >>> 0; code = (code - bound) >>> 0; P[i] = p - (p >>> 5); b = 1; }
          if (range < 0x1000000) { range = (range << 8) >>> 0; code = ((code << 8) | inp[ip++]) >>> 0; }
          return b;
        };
        const tree = (base, nb) => { let m = 1; for (let i = 0; i < nb; i++) m = (m << 1) | bit(base + m); return m - (1 << nb); };
        const rtree = (base, nb) => { let m = 1, s = 0; for (let i = 0; i < nb; i++) { const b = bit(base + m); m = (m << 1) | b; s |= b << i; } return s; };
        const direct = (nb) => {
          let r = 0;
          while (nb-- > 0) {
            range = range >>> 1; let b = 0;
            if (code >= range) { code = (code - range) >>> 0; b = 1; }
            r = r * 2 + b;
            if (range < 0x1000000) { range = (range << 8) >>> 0; code = ((code << 8) | inp[ip++]) >>> 0; }
          }
          return r;
        };
        const lenDec = (base, ps) => {
          if (bit(base) === 0) return tree(base + 2 + ps * 8, 3);
          if (bit(base + 1) === 0) return 8 + tree(base + 130 + ps * 8, 3);
          return 16 + tree(base + 258, 8);
        };
        const distDec = (len) => {
          const slot = tree(O_POSSLOT + (len < 3 ? len : 3) * 64, 6);
          if (slot < 4) return slot;
          const nd = (slot >>> 1) - 1;
          let dist = (2 | (slot & 1)) * Math.pow(2, nd);
          if (slot < 14) dist += rtree(O_SPECPOS + dist - slot, nd);
          else { dist += direct(nd - 4) * 16; dist += rtree(O_ALIGN, 4); }
          return dist;
        };
        const buf = out.buf; let op = out.pos; const end = op + n;
        const pbMask = (1 << pb) - 1, lpMask = (1 << lp) - 1;
        while (op < end) {
          const tpos = op - dictStart, ps = tpos & pbMask;
          if (bit(O_ISMATCH + (state << 4) + ps) === 0) {
            const prev = tpos > 0 ? buf[op - 1] : 0;
            const base = O_LIT + 0x300 * (((tpos & lpMask) << lc) + (prev >>> (8 - lc)));
            let sym = 1;
            if (state >= 7) {
              if (rep0 >= tpos) throw bad("literal match byte");
              let mb = buf[op - rep0 - 1];
              do {
                const mbit = (mb >>> 7) & 1; mb = (mb << 1) & 0xFF;
                const b = bit(base + ((1 + mbit) << 8) + sym);
                sym = (sym << 1) | b;
                if (mbit !== b) break;
              } while (sym < 0x100);
            }
            while (sym < 0x100) sym = (sym << 1) | bit(base + sym);
            buf[op++] = sym & 0xFF;
            state = state < 4 ? 0 : state < 10 ? state - 3 : state - 6;
            continue;
          }
          let len;
          if (bit(O_ISREP + state) !== 0) {
            if (tpos === 0) throw bad("rep at start");
            if (bit(O_ISREPG0 + state) === 0) {
              if (bit(O_ISREP0LONG + (state << 4) + ps) === 0) {
                state = state < 7 ? 9 : 11;
                if (rep0 >= tpos) throw bad("short rep");
                buf[op] = buf[op - rep0 - 1]; op++;
                continue;
              }
            } else {
              let dist;
              if (bit(O_ISREPG1 + state) === 0) dist = rep1;
              else {
                if (bit(O_ISREPG2 + state) === 0) dist = rep2;
                else { dist = rep3; rep3 = rep2; }
                rep2 = rep1;
              }
              rep1 = rep0; rep0 = dist;
            }
            len = lenDec(O_REPLEN, ps);
            state = state < 7 ? 8 : 11;
          } else {
            rep3 = rep2; rep2 = rep1; rep1 = rep0;
            len = lenDec(O_LEN, ps);
            state = state < 7 ? 7 : 10;
            rep0 = distDec(len);
            if (rep0 === 0xFFFFFFFF) throw bad("end marker in LZMA2");
          }
          len += 2;
          if (rep0 >= tpos || rep0 >= dictSize) throw bad("distance");
          if (op + len > end) throw bad("match past chunk");
          let src = op - rep0 - 1;
          for (let k = 0; k < len; k++) buf[op++] = buf[src++];
        }
        out.pos = op;
        if (ip > ipEnd) throw bad("chunk overrun");
        return ip;
      };
    }

    function Out(hint) {
      this.buf = new Uint8Array(Math.max(65536, hint || 0)); this.pos = 0;
      this.need = (n) => {
        if (this.pos + n <= this.buf.length) return;
        let cap = this.buf.length * 2; while (cap < this.pos + n) cap *= 2;
        const nb = new Uint8Array(cap); nb.set(this.buf.subarray(0, this.pos)); this.buf = nb;
      };
    }

    function lzma2(inp, pos, out, dictSize) {
      const lz = new Lzma();
      let dictStart = out.pos, needDict = true, needProps = true;
      for (;;) {
        if (pos >= inp.length) throw bad("truncated");
        const c = inp[pos++];
        if (c === 0x00) return pos;
        if (c >= 0xE0 || c === 0x01) { needProps = true; needDict = false; dictStart = out.pos; }
        else if (needDict) throw bad("no dictionary reset");
        if (c >= 0x80) {
          if (pos + 4 > inp.length) throw bad("truncated");
          const unpacked = ((c & 0x1F) << 16) + (inp[pos] << 8) + inp[pos + 1] + 1;
          const packed = (inp[pos + 2] << 8) + inp[pos + 3] + 1;
          pos += 4;
          if (c >= 0xC0) { if (pos >= inp.length) throw bad("truncated"); lz.props(inp[pos++]); needProps = false; lz.reset(); }
          else if (needProps) throw bad("missing props");
          else if (c >= 0xA0) lz.reset();
          if (pos + packed > inp.length) throw bad("truncated");
          out.need(unpacked);
          lz.chunk(inp, pos, pos + packed, out, dictStart, dictSize, unpacked);
          pos += packed;
        } else if (c === 0x01 || c === 0x02) {
          if (pos + 2 > inp.length) throw bad("truncated");
          const size = (inp[pos] << 8) + inp[pos + 1] + 1; pos += 2;
          if (pos + size > inp.length) throw bad("truncated");
          out.need(size); out.buf.set(inp.subarray(pos, pos + size), out.pos); out.pos += size; pos += size;
        } else throw bad("control byte");
      }
    }

    const varint = (inp, pos) => { let v = 0, m = 1, b; do { if (pos >= inp.length) throw bad("varint"); b = inp[pos++]; v += (b & 0x7F) * m; m *= 128; } while (b & 0x80); return [v, pos]; };
    const CHECK = [0, 4, 4, 4, 8, 8, 8, 16, 16, 16, 32, 32, 32, 64, 64, 64];

    // Decompress one .xz stream (all blocks); bytes after the stream are ignored.
    function decompress(inp, hint) {
      if (!(inp.length >= 12 && inp[0] === 0xFD && inp[1] === 0x37 && inp[2] === 0x7A && inp[3] === 0x58 && inp[4] === 0x5A && inp[5] === 0x00)) throw bad("magic");
      const checkSize = CHECK[inp[7] & 0x0F];
      const out = new Out(hint);
      let pos = 12;
      for (;;) {
        if (pos >= inp.length) throw bad("truncated");
        const hb = inp[pos];
        if (hb === 0x00) break; // index: no more blocks
        const hEnd = pos + (hb + 1) * 4;
        if (hEnd > inp.length) throw bad("truncated");
        const flags = inp[pos + 1], nf = (flags & 3) + 1;
        let p = pos + 2, dictSize = 0, lzma2Seen = false;
        if (flags & 0x40) p = varint(inp, p)[1];
        if (flags & 0x80) p = varint(inp, p)[1];
        for (let f = 0; f < nf; f++) {
          let id, ps; [id, p] = varint(inp, p); [ps, p] = varint(inp, p);
          if (id === 0x21) {
            const d = inp[p] & 0x3F; if (d > 40) throw bad("dict");
            dictSize = d === 40 ? 0xFFFFFFFF : (2 | (d & 1)) * Math.pow(2, (d >>> 1) + 11);
            lzma2Seen = true;
          } else throw zerr("This archive uses an XZ filter HAVYN can't read (" + id + ").", "xz");
          p += ps;
        }
        if (!lzma2Seen) throw bad("no LZMA2 filter");
        pos = lzma2(inp, hEnd, out, dictSize);
        while (pos % 4) pos++;
        pos += checkSize;
      }
      return out.buf.subarray(0, out.pos);
    }
    return { decompress, lzma2: (inp, dictSize) => { const o = new Out(); lzma2(inp, 0, o, dictSize || 0xFFFFFFFF); return o.buf.subarray(0, o.pos); } };
  })();

  /* ---------------- helpers ---------------- */
  const u32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
  const u64 = (b, o) => { const lo = u32(b, o), hi = u32(b, o + 4); return hi === 0xFFFFFFFF && lo === 0xFFFFFFFF ? -1 : hi * TWO32 + lo; };
  const hex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  // Compare strings in Unicode code point order, which is the UTF-8 byte order ZIM uses for sorting.
  function cmp(a, b) {
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) {
      const x = a.charCodeAt(i), y = b.charCodeAt(i);
      if (x !== y) {
        const sx = x >= 0xD800 && x <= 0xDFFF, sy = y >= 0xD800 && y <= 0xDFFF;
        if (sx !== sy) { if (sx && y >= 0xE000) return 1; if (sy && x >= 0xE000) return -1; }
        return x - y;
      }
    }
    return a.length - b.length;
  }
  function parseDirent(b) {
    if (b.length < 12) return null;
    const mime = b[0] | (b[1] << 8), ns = String.fromCharCode(b[3]);
    let p, cluster = -1, blob = -1, redirect = -1;
    if (mime === 0xFFFF) { redirect = u32(b, 8); p = 12; }
    else if (mime === 0xFFFE || mime === 0xFFFD) p = 8;
    else { if (b.length < 16) return null; cluster = u32(b, 8); blob = u32(b, 12); p = 16; }
    let e = b.indexOf(0, p); if (e < 0) return null;
    const url = td.decode(b.subarray(p, e)); p = e + 1;
    e = b.indexOf(0, p); if (e < 0) return null;
    const title = td.decode(b.subarray(p, e));
    return { mime, ns, url, title: title || url, redirect, cluster, blob, special: mime === 0xFFFE || mime === 0xFFFD };
  }

  /* ---------------- the archive ---------------- */
  class Archive {
    constructor(blob, opts) {
      opts = opts || {};
      this.blob = blob; this.size = blob.size;
      this.dcache = new Map(); this.dMax = opts.direntCache || 6000;
      this.ccache = new Map(); this.ccBytes = 0; this.ccMax = opts.clusterCacheBytes || 32 * 1024 * 1024;
      this.lcache = new Map();
      this.cinfo = new Map();
    }
    static async open(blob, opts) { const a = new Archive(blob, opts); await a.init(); return a; }
    async read(pos, len) {
      const end = Math.min(this.size, pos + len);
      if (!(pos >= 0) || pos >= end) return new Uint8Array(0);
      return new Uint8Array(await this.blob.slice(pos, end).arrayBuffer());
    }
    async init() {
      const h = await this.read(0, 80);
      if (h.length < 80) throw zerr("This file is too small to be a ZIM archive.", "notzim");
      if (u32(h, 0) !== 72173914) throw zerr("This file isn't a ZIM archive.", "notzim");
      this.major = h[4] | (h[5] << 8); this.minor = h[6] | (h[7] << 8);
      if (this.major !== 5 && this.major !== 6) throw zerr("Unsupported ZIM version " + this.major + ".", "version");
      this.uuid = hex(h.subarray(8, 24));
      this.entryCount = u32(h, 24); this.clusterCount = u32(h, 28);
      this.urlPtrPos = u64(h, 32); this.titlePtrPos = u64(h, 40); this.clusterPtrPos = u64(h, 48); this.mimeListPos = u64(h, 56);
      this.mainPage = u32(h, 64); this.checksumPos = u64(h, 72);
      this.newNs = this.major >= 6 && this.minor >= 1;
      const S = this.size;
      if (this.urlPtrPos < 80 || this.urlPtrPos + 8 * this.entryCount > S) throw zerr("Damaged archive: entry table is out of bounds.", "bounds");
      if (this.clusterPtrPos < 80 || this.clusterPtrPos + 8 * this.clusterCount > S) throw zerr("Damaged archive: cluster table is out of bounds.", "bounds");
      if (this.mimeListPos < 80 || this.mimeListPos >= S) throw zerr("Damaged archive: type list is out of bounds.", "bounds");
      if (this.titlePtrPos !== -1 && (this.titlePtrPos < 80 || this.titlePtrPos + 4 * this.entryCount > S)) this.titlePtrPos = -1;
      if (this.checksumPos !== -1 && this.checksumPos > S - 16) this.checksumPos = -1;
      // MIME type list
      let mb = await this.read(this.mimeListPos, 4096);
      for (;;) {
        const list = [], p = { i: 0 }; let done = false;
        while (p.i < mb.length) {
          const e = mb.indexOf(0, p.i); if (e < 0) break;
          if (e === p.i) { done = true; break; }
          list.push(td.decode(mb.subarray(p.i, e))); p.i = e + 1;
        }
        if (done) { this.mimes = list; break; }
        if (mb.length >= 262144 || this.mimeListPos + mb.length >= S) throw zerr("Damaged archive: type list never ends.", "bounds");
        mb = await this.read(this.mimeListPos, mb.length * 4);
      }
      this.listing = await this.titleListing();
      return this;
    }

    /* directory */
    async urlPtr(i) { return u64(await this.read(this.urlPtrPos + 8 * i, 8), 0); }
    async direntAt(i) {
      if (!(i >= 0 && i < this.entryCount)) throw zerr("Damaged archive: entry " + i + " doesn't exist.", "bounds");
      const c = this.dcache.get(i);
      if (c) return c;
      const off = await this.urlPtr(i);
      if (!(off >= 80 && off < this.size)) throw zerr("Damaged archive: entry " + i + " points outside the file.", "bounds");
      let d = null;
      for (const n of [384, 4096, 65536]) { const b = await this.read(off, n); d = parseDirent(b); if (d || b.length < n) break; }
      if (!d) throw zerr("Damaged archive: unreadable entry " + i + ".", "dirent");
      d.index = i;
      if (this.dcache.size >= this.dMax) this.dcache.delete(this.dcache.keys().next().value);
      this.dcache.set(i, d);
      return d;
    }
    mimeOf(d) { return d.redirect >= 0 ? "redirect" : this.mimes[d.mime] || "application/octet-stream"; }
    async find(ns, url) {
      let lo = 0, hi = this.entryCount - 1;
      while (lo <= hi) {
        const mid = (lo + hi) >>> 1, d = await this.direntAt(mid);
        const c = cmp(ns, d.ns) || cmp(url, d.url);
        if (c === 0) return d;
        if (c < 0) hi = mid - 1; else lo = mid + 1;
      }
      return null;
    }
    async resolve(d) {
      for (let hop = 0; d && d.redirect >= 0; hop++) { if (hop > 30) throw zerr("Redirect loop in archive.", "loop"); d = await this.direntAt(d.redirect); }
      return d;
    }
    // Paths as used in links inside the archive. New-style archives keep everything in namespace C.
    pathOf(d) { return this.newNs && d.ns === "C" ? d.url : d.ns + "/" + d.url; }
    async byPath(path) {
      if (this.newNs) { const d = await this.find("C", path); if (d) return d; }
      if (path.length > 2 && path[1] === "/") return this.find(path[0], path.slice(2));
      return null;
    }

    /* clusters and blobs */
    async clusterInfo(n) {
      if (!(n >= 0 && n < this.clusterCount)) throw zerr("Damaged archive: cluster " + n + " doesn't exist.", "bounds");
      const hit = this.cinfo.get(n); if (hit) return hit;
      const b = await this.read(this.clusterPtrPos + 8 * n, 16);
      const off = u64(b, 0);
      if (!(off >= 80 && off < this.size)) throw zerr("Damaged archive: cluster " + n + " is out of bounds.", "bounds");
      let end = n + 1 < this.clusterCount && b.length >= 16 ? u64(b, 8) : -1;
      // The last cluster can overlap other tables (newer archives keep the header's title list inside it),
      // so it is bounded by the file; compressed streams are measured by walking their own headers.
      const last = !(end > off);
      if (last) end = this.size;
      const info = (await this.read(off, 1))[0];
      const ci = { off, end, last, comp: info & 15, ext: !!(info & 16) };
      if (this.cinfo.size > 4096) this.cinfo.clear();
      this.cinfo.set(n, ci);
      return ci;
    }
    // Byte length of a compressed stream that may be followed by unrelated data (only the last cluster needs this).
    async streamLen(ci) {
      const pos = ci.off + 1, lim = ci.end;
      if (ci.comp === 5) {
        let p = pos;
        for (;;) {
          const h = await this.read(p, 18); if (h.length < 8) throw zerr("Damaged archive: truncated cluster.", "cluster");
          const magic = u32(h, 0);
          if ((magic >>> 4) === 0x184D2A5) { p += 8 + u32(h, 4); continue; }
          if (magic !== 0xFD2FB528) throw zerr("Damaged archive: bad Zstandard frame.", "cluster");
          const fhd = h[4], fcf = fhd >> 6, ss = (fhd >> 5) & 1, chk = (fhd >> 2) & 1, did = fhd & 3;
          p += 5 + (ss ? 0 : 1) + (did === 3 ? 4 : did) + (fcf ? 1 << fcf : ss);
          for (;;) {
            const bh = await this.read(p, 3); if (bh.length < 3) throw zerr("Damaged archive: truncated cluster.", "cluster");
            const v = bh[0] | (bh[1] << 8) | (bh[2] << 16), lastB = v & 1, type = (v >> 1) & 3, sz = v >>> 3;
            if (type === 3) throw zerr("Damaged archive: bad Zstandard block.", "cluster");
            p += 3 + (type === 1 ? 1 : sz);
            if (p > lim) throw zerr("Damaged archive: cluster runs past its end.", "cluster");
            if (lastB) break;
          }
          if (chk) p += 4;
          return p - pos;
        }
      }
      if (ci.comp === 4) {
        const h = await this.read(pos, 12);
        const checkSize = [0, 4, 4, 4, 8, 8, 8, 16, 16, 16, 32, 32, 32, 64, 64, 64][h[7] & 15];
        let p = pos + 12;
        for (;;) {
          const hb = (await this.read(p, 1))[0];
          if (hb === undefined) throw zerr("Damaged archive: truncated cluster.", "cluster");
          if (hb === 0) return p - pos + 1;
          p += (hb + 1) * 4;
          for (;;) {
            const c = await this.read(p, 5), ctl = c[0];
            if (ctl === undefined) throw zerr("Damaged archive: truncated cluster.", "cluster");
            if (ctl === 0) { p += 1; break; }
            if (ctl === 1 || ctl === 2) p += 3 + ((c[1] << 8) | c[2]) + 1;
            else if (ctl >= 0x80) p += 5 + (ctl >= 0xC0 ? 1 : 0) + ((c[3] << 8) | c[4]) + 1;
            else throw zerr("Damaged archive: bad XZ chunk.", "cluster");
            if (p > lim) throw zerr("Damaged archive: cluster runs past its end.", "cluster");
          }
          while ((p - pos) % 4) p++;
          p += checkSize;
        }
      }
      return lim - pos;
    }
    async clusterData(n, ci) {
      const hit = this.ccache.get(n);
      if (hit) { this.ccache.delete(n); this.ccache.set(n, hit); return hit; }
      if (ci.comp === 2 || ci.comp === 3) throw zerr("This archive uses zlib/bzip2 compression from before 2012. Download a newer copy.", "oldcomp");
      if (ci.comp !== 4 && ci.comp !== 5) throw zerr("Unknown compression in cluster " + n + ".", "cluster");
      const len = ci.last ? await this.streamLen(ci) : ci.end - ci.off - 1;
      const raw = await this.read(ci.off + 1, len);
      let data;
      try { data = ci.comp === 5 ? HAVYN_FZSTD.decompressFrame(raw) : XZ.decompress(raw, raw.length * 4); }
      catch (e) { throw zerr("Damaged archive: cluster " + n + " won't decompress (" + (e && e.message) + ").", "cluster"); }
      this.ccache.set(n, data); this.ccBytes += data.length;
      while (this.ccBytes > this.ccMax && this.ccache.size > 1) { const k = this.ccache.keys().next().value; this.ccBytes -= this.ccache.get(k).length; this.ccache.delete(k); }
      return data;
    }
    // Where an entry's bytes live: {file:[start,end]} for uncompressed clusters (zero-copy), {mem:Uint8Array} otherwise.
    async locate(d) {
      if (d.redirect >= 0 || d.special) throw zerr("This entry has no content.", "nocontent");
      const ci = await this.clusterInfo(d.cluster), os = ci.ext ? 8 : 4;
      const rd = (b, o) => (os === 8 ? u64(b, o) : u32(b, o));
      if (ci.comp === 0 || ci.comp === 1) {
        const base = ci.off + 1, first = rd(await this.read(base, os), 0), nb = first / os - 1;
        if (!(nb >= 1) || first % os || d.blob >= nb) throw zerr("Damaged archive: blob " + d.blob + " missing in cluster " + d.cluster + ".", "blob");
        const pr = await this.read(base + os * d.blob, os * 2), s = rd(pr, 0), e = rd(pr, os);
        if (!(e >= s && s >= first && base + e <= ci.end)) throw zerr("Damaged archive: blob " + d.blob + " is out of bounds.", "blob");
        return { file: [base + s, base + e] };
      }
      const data = await this.clusterData(d.cluster, ci), first = rd(data, 0), nb = first / os - 1;
      if (!(nb >= 1) || first % os || d.blob >= nb || first > data.length) throw zerr("Damaged archive: blob " + d.blob + " missing in cluster " + d.cluster + ".", "blob");
      const s = rd(data, os * d.blob), e = rd(data, os * (d.blob + 1));
      if (!(e >= s && s >= first && e <= data.length)) throw zerr("Damaged archive: blob " + d.blob + " is out of bounds.", "blob");
      return { mem: data.subarray(s, e) };
    }
    async bytes(d) { const L = await this.locate(d); return L.mem ? L.mem : this.read(L.file[0], L.file[1] - L.file[0]); }
    async text(d) { return td.decode(await this.bytes(d)); }
    // A Blob for the entry. Uncompressed entries (most images, all video) are slices of the archive file: no copy.
    async blobOf(d, type) {
      const L = await this.locate(d);
      return L.mem ? new Blob([L.mem], { type: type || "" }) : this.blob.slice(L.file[0], L.file[1], type || "");
    }

    /* metadata */
    async meta(name) { const d = await this.find("M", name); if (!d || d.redirect >= 0) return ""; try { return (await this.text(d)).trim(); } catch (e) { return ""; } }
    async mainEntry() {
      let d = null;
      if (this.mainPage !== 0xFFFFFFFF && this.mainPage < this.entryCount) d = await this.direntAt(this.mainPage);
      if (!d && this.newNs) d = await this.find("W", "mainPage");
      d = d ? await this.resolve(d) : null;
      return d;
    }
    async favicon() {
      for (const [ns, u] of [["M", "Illustration_48x48@1"], ["-", "favicon"], ["I", "favicon.png"], ["C", "favicon.png"]]) {
        const d0 = await this.find(ns, u); if (!d0) continue;
        const d = await this.resolve(d0);
        if (d && !d.special) { const m = this.mimeOf(d); if (m.startsWith("image/")) { const b = await this.bytes(d); if (b.length && b.length < 200000) return { mime: m, bytes: b }; } }
      }
      return null;
    }
    async info() {
      const keys = ["Title", "Description", "LongDescription", "Language", "Creator", "Publisher", "Date", "Name", "Flavour", "Tags", "Counter", "Scraper", "Source"];
      const m = {};
      for (const k of keys) m[k] = await this.meta(k);
      const counts = {};
      for (const part of (m.Counter || "").split(";")) { const i = part.lastIndexOf("="); if (i > 0) counts[part.slice(0, i).trim()] = Number(part.slice(i + 1)) || 0; }
      const main = await this.mainEntry();
      const articles = this.listing && !this.listing.filter ? this.listing.count : counts["text/html"] || (this.listing ? this.listing.count : 0);
      const media = Object.keys(counts).filter((k) => /^(video|audio)\//.test(k)).reduce((a, k) => a + counts[k], 0);
      const scr = (m.Scraper || "").toLowerCase();
      return {
        uuid: this.uuid, version: this.major + "." + this.minor, newNs: this.newNs, size: this.size, entries: this.entryCount,
        title: m.Title || m.Name || "Untitled archive", description: m.Description, longDescription: m.LongDescription, language: m.Language,
        creator: m.Creator, publisher: m.Publisher, date: m.Date, name: m.Name, flavour: m.Flavour, tags: m.Tags, scraper: m.Scraper, source: m.Source,
        counts, articles, media, main: main ? this.pathOf(main) : "", mainTitle: main ? main.title : "",
        needsScripts: /warc2zim|zimit/.test(scr), titleSearch: !!this.listing
      };
    }

    /* title index: X/listing/titleOrdered/v1 (front articles), else the header's title list (all entries) */
    async titleListing() {
      let d = null;
      try { d = this.newNs ? await this.find("X", "listing/titleOrdered/v1") : null; } catch (e) { d = null; }
      if (d && d.redirect < 0 && !d.special) {
        try {
          const L = await this.locate(d);
          if (L.mem) { const mem = L.mem; return { v: 1, count: mem.length >>> 2, at: async (i) => u32(mem, 4 * i) }; }
          const s = L.file[0], count = Math.floor((L.file[1] - s) / 4);
          return { v: 1, count, at: async (i) => this.listAt(s, i) };
        } catch (e) { /* fall back */ }
      }
      if (this.titlePtrPos !== -1) {
        const s = this.titlePtrPos, ns = this.newNs ? "C" : "A";
        const all = { count: this.entryCount, at: async (i) => this.listAt(s, i) };
        // Narrow to the article namespace once.
        const key = async (i) => { const e = await this.direntAt(await all.at(i)); return e.ns; };
        const bound = async (target) => { let lo = 0, hi = all.count; while (lo < hi) { const mid = (lo + hi) >>> 1; if (cmp(await key(mid), target) < 0) lo = mid + 1; else hi = mid; } return lo; };
        const a = await bound(ns), b = await bound(String.fromCharCode(ns.charCodeAt(0) + 1));
        return { v: 0, count: b - a, at: async (i) => all.at(a + i), filter: true };
      }
      return null;
    }
    async listAt(start, i) {
      const k = start + 4 * i, hit = this.lcache.get(k);
      if (hit !== undefined) return hit;
      const v = u32(await this.read(k, 4), 0);
      if (this.lcache.size > 20000) this.lcache.clear();
      this.lcache.set(k, v);
      return v;
    }
    async lowerBound(prefix) {
      const L = this.listing; let lo = 0, hi = L.count;
      while (lo < hi) {
        const mid = (lo + hi) >>> 1, d = await this.direntAt(await L.at(mid));
        if (cmp(d.title, prefix) < 0) lo = mid + 1; else hi = mid;
      }
      return lo;
    }
    async isArticle(d) {
      if (!this.listing || !this.listing.filter) return true;
      if (d.special) return false;
      const t = d.redirect >= 0 ? await this.resolve(d).catch(() => null) : d;
      return !!t && this.mimeOf(t).startsWith("text/html");
    }
    async prefix(prefix, limit) {
      const L = this.listing, out = [];
      if (!L || !prefix) return out;
      let i = await this.lowerBound(prefix), scanned = 0;
      for (; i < L.count && out.length < limit && scanned < limit * 25; i++, scanned++) {
        const d = await this.direntAt(await L.at(i));
        if (!d.title.startsWith(prefix)) break;
        if (await this.isArticle(d)) out.push(d);
      }
      return out;
    }
    // Title search as you type. Tries the way you typed it, then common capitalisations.
    async search(q, limit) {
      limit = limit || 20; q = String(q || "").trim().replace(/\s+/g, " ");
      if (!q || !this.listing) return [];
      const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
      const words = (s) => s.split(" ").map(cap).join(" ");
      const vars = [q, cap(q), cap(q.toLowerCase()), q.toLowerCase(), words(q.toLowerCase()), q.toUpperCase()].filter((v, i, a) => a.indexOf(v) === i);
      const seen = new Set(), out = [];
      for (const v of vars) {
        for (const d of await this.prefix(v, limit)) {
          if (seen.has(d.index)) continue;
          seen.add(d.index); out.push(d);
        }
        if (out.length >= limit) break;
      }
      return out.slice(0, limit).map((d) => ({ title: d.title, path: this.pathOf(d), index: d.index, redirect: d.redirect >= 0 }));
    }
    async random() {
      const L = this.listing; if (!L || !L.count) return null;
      for (let k = 0; k < 24; k++) {
        const d0 = await this.direntAt(await L.at(Math.floor(Math.random() * L.count)));
        const d = await this.resolve(d0).catch(() => null);
        if (d && !d.special && this.mimeOf(d).startsWith("text/html")) return d;
      }
      return null;
    }
  }

  G.HavynZim = { Archive, XZ, cmp, parseDirent, version: "1.0" };
})(typeof globalThis !== "undefined" ? globalThis : self);
