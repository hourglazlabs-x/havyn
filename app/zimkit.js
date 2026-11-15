/* fzstd 0.1.1 - Zstandard decompression in pure JavaScript.
 * MIT License, Copyright (c) 2020 Arjun Barrett - https://github.com/101arrowz/fzstd
 * Source: commit 4527daeb1fd8e5c3cff89262fc0d779593e5f2fd, src/index.ts, compiled with tsc (ES2019).
 * HAVYN changes: exports removed, wrapped in a closure, decompressFrame() added. */
const HAVYN_FZSTD = (function () {
"use strict";
// Some numerical data is initialized as -1 even when it doesn't need initialization to help the JIT infer types
// aliases for shorter compressed code (most minifers don't do this)
const ab = ArrayBuffer, u8 = Uint8Array, u16 = Uint16Array, i16 = Int16Array, u32 = Uint32Array, i32 = Int32Array;
const slc = (v, s, e) => {
    if (u8.prototype.slice)
        return u8.prototype.slice.call(v, s, e);
    if (s == null || s < 0)
        s = 0;
    if (e == null || e > v.length)
        e = v.length;
    const n = new u8(e - s);
    n.set(v.subarray(s, e));
    return n;
};
const fill = (v, n, s, e) => {
    if (u8.prototype.fill)
        return u8.prototype.fill.call(v, n, s, e);
    if (s == null || s < 0)
        s = 0;
    if (e == null || e > v.length)
        e = v.length;
    for (; s < e; ++s)
        v[s] = n;
    return v;
};
const cpw = (v, t, s, e) => {
    if (u8.prototype.copyWithin)
        return u8.prototype.copyWithin.call(v, t, s, e);
    if (s == null || s < 0)
        s = 0;
    if (e == null || e > v.length)
        e = v.length;
    while (s < e) {
        v[t++] = v[s++];
    }
};
/**
 * Codes for errors generated within this library
 */
const ZstdErrorCode = {
    InvalidData: 0,
    WindowSizeTooLarge: 1,
    InvalidBlockType: 2,
    FSEAccuracyTooHigh: 3,
    DistanceTooFarBack: 4,
    UnexpectedEOF: 5
};
// error codes
const ec = [
    'invalid zstd data',
    'window size too large (>2046MB)',
    'invalid block type',
    'FSE accuracy too high',
    'match distance too far back',
    'unexpected EOF'
];
const err = (ind, msg, nt) => {
    const e = new Error(msg || ec[ind]);
    e.code = ind;
    if (Error.captureStackTrace)
        Error.captureStackTrace(e, err);
    if (!nt)
        throw e;
    return e;
};
const rb = (d, b, n) => {
    let i = 0, o = 0;
    for (; i < n; ++i)
        o |= d[b++] << (i << 3);
    return o;
};
const b4 = (d, b) => (d[b] | (d[b + 1] << 8) | (d[b + 2] << 16) | (d[b + 3] << 24)) >>> 0;
// read Zstandard frame header
const rzfh = (dat, w) => {
    const n3 = dat[0] | (dat[1] << 8) | (dat[2] << 16);
    if (n3 == 0x2FB528 && dat[3] == 253) {
        // Zstandard
        const flg = dat[4];
        //    single segment       checksum             dict flag     frame content flag
        const ss = (flg >> 5) & 1, cc = (flg >> 2) & 1, df = flg & 3, fcf = flg >> 6;
        if (flg & 8)
            err(0);
        // byte
        let bt = 6 - ss;
        // dict bytes
        const db = df == 3 ? 4 : df;
        // dictionary id
        const di = rb(dat, bt, db);
        bt += db;
        // frame size bytes
        const fsb = fcf ? (1 << fcf) : ss;
        // frame source size
        const fss = rb(dat, bt, fsb) + ((fcf == 1) && 256);
        // window size
        let ws = fss;
        if (!ss) {
            // window descriptor
            const wb = 1 << (10 + (dat[5] >> 3));
            ws = wb + (wb >> 3) * (dat[5] & 7);
        }
        if (ws > 2145386496)
            err(1);
        const buf = new u8((w == 1 ? (fss || ws) : w ? 0 : ws) + 12);
        buf[0] = 1, buf[4] = 4, buf[8] = 8;
        return {
            b: bt + fsb,
            y: 0,
            l: 0,
            d: di,
            w: (w && w != 1) ? w : buf.subarray(12),
            e: ws,
            o: new i32(buf.buffer, 0, 3),
            u: fss,
            c: cc,
            m: Math.min(131072, ws)
        };
    }
    else if (((n3 >> 4) | (dat[3] << 20)) == 0x184D2A5) {
        // skippable
        return b4(dat, 4) + 8;
    }
    err(0);
};
// most significant bit for nonzero
const msb = (val) => {
    let bits = 0;
    for (; (1 << bits) <= val; ++bits)
        ;
    return bits - 1;
};
// read finite state entropy
const rfse = (dat, bt, mal) => {
    // table pos
    let tpos = (bt << 3) + 4;
    // accuracy log
    const al = (dat[bt] & 15) + 5;
    if (al > mal)
        err(3);
    // size
    const sz = 1 << al;
    // probabilities symbols  repeat   index   high threshold
    let probs = sz, sym = -1, re = -1, i = -1, ht = sz;
    // optimization: single allocation is much faster
    const buf = new ab(512 + (sz << 2));
    const freq = new i16(buf, 0, 256);
    // same view as freq
    const dstate = new u16(buf, 0, 256);
    const nstate = new u16(buf, 512, sz);
    const bb1 = 512 + (sz << 1);
    const syms = new u8(buf, bb1, sz);
    const nbits = new u8(buf, bb1 + sz);
    while (sym < 255 && probs > 0) {
        const bits = msb(probs + 1);
        const cbt = tpos >> 3;
        // mask
        const msk = (1 << (bits + 1)) - 1;
        let val = ((dat[cbt] | (dat[cbt + 1] << 8) | (dat[cbt + 2] << 16)) >> (tpos & 7)) & msk;
        // mask (1 fewer bit)
        const msk1fb = (1 << bits) - 1;
        // max small value
        const msv = msk - probs - 1;
        // small value
        const sval = val & msk1fb;
        if (sval < msv)
            tpos += bits, val = sval;
        else {
            tpos += bits + 1;
            if (val > msk1fb)
                val -= msv;
        }
        freq[++sym] = --val;
        if (val == -1) {
            probs += val;
            syms[--ht] = sym;
        }
        else
            probs -= val;
        if (!val) {
            do {
                // repeat byte
                const rbt = tpos >> 3;
                re = ((dat[rbt] | (dat[rbt + 1] << 8)) >> (tpos & 7)) & 3;
                tpos += 2;
                sym += re;
            } while (re == 3);
        }
    }
    if (sym > 255 || probs)
        err(0);
    let sympos = 0;
    // sym step (coprime with sz - formula from zstd source)
    const sstep = (sz >> 1) + (sz >> 3) + 3;
    // sym mask
    const smask = sz - 1;
    for (let s = 0; s <= sym; ++s) {
        const sf = freq[s];
        if (sf < 1) {
            dstate[s] = -sf;
            continue;
        }
        // This is split into two loops in zstd to avoid branching, but as JS is higher-level that is unnecessary
        for (i = 0; i < sf; ++i) {
            syms[sympos] = s;
            do {
                sympos = (sympos + sstep) & smask;
            } while (sympos >= ht);
        }
    }
    // After spreading symbols, should be zero again
    if (sympos)
        err(0);
    for (i = 0; i < sz; ++i) {
        // next state
        const ns = dstate[syms[i]]++;
        // num bits
        const nb = nbits[i] = al - msb(ns);
        nstate[i] = (ns << nb) - sz;
    }
    return [(tpos + 7) >> 3, {
            b: al,
            s: syms,
            n: nbits,
            t: nstate
        }];
};
// read huffman
const rhu = (dat, bt) => {
    //  index  weight count
    let i = 0, wc = -1;
    //    buffer             header byte
    const buf = new u8(292), hb = dat[bt];
    // huffman weights
    const hw = buf.subarray(0, 256);
    // rank count
    const rc = buf.subarray(256, 268);
    // rank index
    const ri = new u16(buf.buffer, 268);
    // NOTE: at this point bt is 1 less than expected
    if (hb < 128) {
        // end byte, fse decode table
        const [ebt, fdt] = rfse(dat, bt + 1, 6);
        bt += hb;
        const epos = ebt << 3;
        // last byte
        const lb = dat[bt];
        if (!lb)
            err(0);
        //  state1   state2   state1 bits   state2 bits
        let st1 = 0, st2 = 0, btr1 = fdt.b, btr2 = btr1;
        // fse pos
        // pre-increment to account for original deficit of 1
        let fpos = (++bt << 3) - 8 + msb(lb);
        for (;;) {
            fpos -= btr1;
            if (fpos < epos)
                break;
            let cbt = fpos >> 3;
            st1 += ((dat[cbt] | (dat[cbt + 1] << 8)) >> (fpos & 7)) & ((1 << btr1) - 1);
            hw[++wc] = fdt.s[st1];
            fpos -= btr2;
            if (fpos < epos)
                break;
            cbt = fpos >> 3;
            st2 += ((dat[cbt] | (dat[cbt + 1] << 8)) >> (fpos & 7)) & ((1 << btr2) - 1);
            hw[++wc] = fdt.s[st2];
            btr1 = fdt.n[st1];
            st1 = fdt.t[st1];
            btr2 = fdt.n[st2];
            st2 = fdt.t[st2];
        }
        if (++wc > 255)
            err(0);
    }
    else {
        wc = hb - 127;
        for (; i < wc; i += 2) {
            const byte = dat[++bt];
            hw[i] = byte >> 4;
            hw[i + 1] = byte & 15;
        }
        ++bt;
    }
    // weight exponential sum
    let wes = 0;
    for (i = 0; i < wc; ++i) {
        const wt = hw[i];
        // bits must be at most 11, same as weight
        if (wt > 11)
            err(0);
        wes += wt && (1 << (wt - 1));
    }
    // max bits
    const mb = msb(wes) + 1;
    // table size
    const ts = 1 << mb;
    // remaining sum
    const rem = ts - wes;
    // must be power of 2
    if (rem & (rem - 1))
        err(0);
    hw[wc++] = msb(rem) + 1;
    for (i = 0; i < wc; ++i) {
        const wt = hw[i];
        ++rc[hw[i] = wt && (mb + 1 - wt)];
    }
    // huf buf
    const hbuf = new u8(ts << 1);
    //    symbols                      num bits
    const syms = hbuf.subarray(0, ts), nb = hbuf.subarray(ts);
    ri[mb] = 0;
    for (i = mb; i > 0; --i) {
        const pv = ri[i];
        fill(nb, i, pv, ri[i - 1] = pv + rc[i] * (1 << (mb - i)));
    }
    if (ri[0] != ts)
        err(0);
    for (i = 0; i < wc; ++i) {
        const bits = hw[i];
        if (bits) {
            const code = ri[bits];
            fill(syms, i, code, ri[bits] = code + (1 << (mb - bits)));
        }
    }
    return [bt, {
            n: nb,
            b: mb,
            s: syms
        }];
};
// Tables generated using this:
// https://gist.github.com/101arrowz/a979452d4355992cbf8f257cbffc9edd
// default literal length table
const dllt = /*#__PURE__*/ rfse(/*#__PURE__*/ new u8([
    81, 16, 99, 140, 49, 198, 24, 99, 12, 33, 196, 24, 99, 102, 102, 134, 70, 146, 4
]), 0, 6)[1];
// default match length table
const dmlt = /*#__PURE__*/ rfse(/*#__PURE__*/ new u8([
    33, 20, 196, 24, 99, 140, 33, 132, 16, 66, 8, 33, 132, 16, 66, 8, 33, 68, 68, 68, 68, 68, 68, 68, 68, 36, 9
]), 0, 6)[1];
// default offset code table
const doct = /*#__PURE__ */ rfse(/*#__PURE__*/ new u8([
    32, 132, 16, 66, 102, 70, 68, 68, 68, 68, 36, 73, 2
]), 0, 5)[1];
// bits to baseline
const b2bl = (b, s) => {
    const len = b.length, bl = new i32(len);
    for (let i = 0; i < len; ++i) {
        bl[i] = s;
        s += 1 << b[i];
    }
    return bl;
};
// literal length bits
const llb = /*#__PURE__ */ new u8(( /*#__PURE__ */new i32([
    0, 0, 0, 0, 16843009, 50528770, 134678020, 202050057, 269422093
])).buffer, 0, 36);
// literal length baseline
const llbl = /*#__PURE__ */ b2bl(llb, 0);
// match length bits
const mlb = /*#__PURE__ */ new u8(( /*#__PURE__ */new i32([
    0, 0, 0, 0, 0, 0, 0, 0, 16843009, 50528770, 117769220, 185207048, 252579084, 16
])).buffer, 0, 53);
// match length baseline
const mlbl = /*#__PURE__ */ b2bl(mlb, 3);
// decode huffman stream
const dhu = (dat, out, hu) => {
    const len = dat.length, ss = out.length, lb = dat[len - 1], msk = (1 << hu.b) - 1, eb = -hu.b;
    if (!lb)
        err(0);
    let st = 0, btr = hu.b, pos = (len << 3) - 8 + msb(lb) - btr, i = -1;
    for (; pos > eb && i < ss;) {
        const cbt = pos >> 3;
        const val = (dat[cbt] | (dat[cbt + 1] << 8) | (dat[cbt + 2] << 16)) >> (pos & 7);
        st = ((st << btr) | val) & msk;
        out[++i] = hu.s[st];
        pos -= (btr = hu.n[st]);
    }
    if (pos != eb || i + 1 != ss)
        err(0);
};
// decode huffman stream 4x
// TODO: use workers to parallelize
const dhu4 = (dat, out, hu) => {
    let bt = 6;
    const ss = out.length, sz1 = (ss + 3) >> 2, sz2 = sz1 << 1, sz3 = sz1 + sz2;
    dhu(dat.subarray(bt, bt += dat[0] | (dat[1] << 8)), out.subarray(0, sz1), hu);
    dhu(dat.subarray(bt, bt += dat[2] | (dat[3] << 8)), out.subarray(sz1, sz2), hu);
    dhu(dat.subarray(bt, bt += dat[4] | (dat[5] << 8)), out.subarray(sz2, sz3), hu);
    dhu(dat.subarray(bt), out.subarray(sz3), hu);
};
// read Zstandard block
const rzb = (dat, st, out) => {
    let bt = st.b;
    //    byte 0        block type
    const b0 = dat[bt], btype = (b0 >> 1) & 3;
    st.l = b0 & 1;
    const sz = (b0 >> 3) | (dat[bt + 1] << 5) | (dat[bt + 2] << 13);
    // end byte for block
    const ebt = (bt += 3) + sz;
    if (btype == 1) {
        if (bt >= dat.length)
            return;
        st.b = bt + 1;
        if (out) {
            fill(out, dat[bt], st.y, st.y += sz);
            return out;
        }
        return fill(new u8(sz), dat[bt]);
    }
    if (ebt > dat.length)
        return;
    if (btype == 0) {
        st.b = ebt;
        if (out) {
            out.set(dat.subarray(bt, ebt), st.y);
            st.y += sz;
            return out;
        }
        return slc(dat, bt, ebt);
    }
    if (btype == 2) {
        //    byte 3        lit btype     size format
        const b3 = dat[bt], lbt = b3 & 3, sf = (b3 >> 2) & 3;
        // lit src size  lit cmp sz 4 streams
        let lss = b3 >> 4, lcs = 0, s4 = 0;
        if (lbt < 2) {
            if (sf & 1)
                lss |= (dat[++bt] << 4) | ((sf & 2) && (dat[++bt] << 12));
            else
                lss = b3 >> 3;
        }
        else {
            s4 = sf;
            if (sf < 2)
                lss |= ((dat[++bt] & 63) << 4), lcs = (dat[bt] >> 6) | (dat[++bt] << 2);
            else if (sf == 2)
                lss |= (dat[++bt] << 4) | ((dat[++bt] & 3) << 12), lcs = (dat[bt] >> 2) | (dat[++bt] << 6);
            else
                lss |= (dat[++bt] << 4) | ((dat[++bt] & 63) << 12), lcs = (dat[bt] >> 6) | (dat[++bt] << 2) | (dat[++bt] << 10);
        }
        ++bt;
        // add literals to end - can never overlap with backreferences because unused literals always appended
        let buf = out ? out.subarray(st.y, st.y + st.m) : new u8(st.m);
        // starting point for literals
        let spl = buf.length - lss;
        if (lbt == 0)
            buf.set(dat.subarray(bt, bt += lss), spl);
        else if (lbt == 1)
            fill(buf, dat[bt++], spl);
        else {
            // huffman table
            let hu = st.h;
            if (lbt == 2) {
                const hud = rhu(dat, bt);
                // subtract description length
                lcs += bt - (bt = hud[0]);
                st.h = hu = hud[1];
            }
            else if (!hu)
                err(0);
            (s4 ? dhu4 : dhu)(dat.subarray(bt, bt += lcs), buf.subarray(spl), hu);
        }
        // num sequences
        let ns = dat[bt++];
        if (ns) {
            if (ns == 255)
                ns = (dat[bt++] | (dat[bt++] << 8)) + 0x7F00;
            else if (ns > 127)
                ns = ((ns - 128) << 8) | dat[bt++];
            // symbol compression modes
            const scm = dat[bt++];
            if (scm & 3)
                err(0);
            const dts = [dmlt, doct, dllt];
            for (let i = 2; i > -1; --i) {
                const md = (scm >> ((i << 1) + 2)) & 3;
                if (md == 1) {
                    // rle buf
                    const rbuf = new u8([0, 0, dat[bt++]]);
                    dts[i] = {
                        s: rbuf.subarray(2, 3),
                        n: rbuf.subarray(0, 1),
                        t: new u16(rbuf.buffer, 0, 1),
                        b: 0
                    };
                }
                else if (md == 2) {
                    // accuracy log 8 for offsets, 9 for others
                    [bt, dts[i]] = rfse(dat, bt, 9 - (i & 1));
                }
                else if (md == 3) {
                    if (!st.t)
                        err(0);
                    dts[i] = st.t[i];
                }
            }
            const [mlt, oct, llt] = st.t = dts;
            const lb = dat[ebt - 1];
            if (!lb)
                err(0);
            let spos = (ebt << 3) - 8 + msb(lb) - llt.b, cbt = spos >> 3, oubt = 0;
            let lst = ((dat[cbt] | (dat[cbt + 1] << 8)) >> (spos & 7)) & ((1 << llt.b) - 1);
            cbt = (spos -= oct.b) >> 3;
            let ost = ((dat[cbt] | (dat[cbt + 1] << 8)) >> (spos & 7)) & ((1 << oct.b) - 1);
            cbt = (spos -= mlt.b) >> 3;
            let mst = ((dat[cbt] | (dat[cbt + 1] << 8)) >> (spos & 7)) & ((1 << mlt.b) - 1);
            for (++ns; --ns;) {
                const llc = llt.s[lst];
                const lbtr = llt.n[lst];
                const mlc = mlt.s[mst];
                const mbtr = mlt.n[mst];
                const ofc = oct.s[ost];
                const obtr = oct.n[ost];
                cbt = (spos -= ofc) >> 3;
                const ofp = 1 << ofc;
                let off = ofp + (((dat[cbt] | (dat[cbt + 1] << 8) | (dat[cbt + 2] << 16) | (dat[cbt + 3] << 24)) >>> (spos & 7)) & (ofp - 1));
                cbt = (spos -= mlb[mlc]) >> 3;
                let ml = mlbl[mlc] + (((dat[cbt] | (dat[cbt + 1] << 8) | (dat[cbt + 2] << 16)) >> (spos & 7)) & ((1 << mlb[mlc]) - 1));
                cbt = (spos -= llb[llc]) >> 3;
                const ll = llbl[llc] + (((dat[cbt] | (dat[cbt + 1] << 8) | (dat[cbt + 2] << 16)) >> (spos & 7)) & ((1 << llb[llc]) - 1));
                cbt = (spos -= lbtr) >> 3;
                lst = llt.t[lst] + (((dat[cbt] | (dat[cbt + 1] << 8)) >> (spos & 7)) & ((1 << lbtr) - 1));
                cbt = (spos -= mbtr) >> 3;
                mst = mlt.t[mst] + (((dat[cbt] | (dat[cbt + 1] << 8)) >> (spos & 7)) & ((1 << mbtr) - 1));
                cbt = (spos -= obtr) >> 3;
                ost = oct.t[ost] + (((dat[cbt] | (dat[cbt + 1] << 8)) >> (spos & 7)) & ((1 << obtr) - 1));
                if (off > 3) {
                    st.o[2] = st.o[1];
                    st.o[1] = st.o[0];
                    st.o[0] = off -= 3;
                }
                else {
                    const idx = off - (ll != 0);
                    if (idx) {
                        off = idx == 3 ? st.o[0] - 1 : st.o[idx];
                        if (idx > 1)
                            st.o[2] = st.o[1];
                        st.o[1] = st.o[0];
                        st.o[0] = off;
                    }
                    else
                        off = st.o[0];
                }
                for (let i = 0; i < ll; ++i) {
                    buf[oubt + i] = buf[spl + i];
                }
                oubt += ll, spl += ll;
                let stin = oubt - off;
                if (stin < 0) {
                    let len = -stin;
                    const bs = st.e + stin;
                    if (len > ml)
                        len = ml;
                    for (let i = 0; i < len; ++i) {
                        buf[oubt + i] = st.w[bs + i];
                    }
                    oubt += len, ml -= len, stin = 0;
                }
                for (let i = 0; i < ml; ++i) {
                    buf[oubt + i] = buf[stin + i];
                }
                oubt += ml;
            }
            if (oubt != spl) {
                while (spl < buf.length) {
                    buf[oubt++] = buf[spl++];
                }
            }
            else
                oubt = buf.length;
            if (out)
                st.y += oubt;
            else
                buf = slc(buf, 0, oubt);
        }
        else if (out) {
            st.y += lss;
            if (spl) {
                for (let i = 0; i < lss; ++i) {
                    buf[i] = buf[spl + i];
                }
            }
        }
        else if (spl)
            buf = slc(buf, spl);
        st.b = ebt;
        return buf;
    }
    err(2);
};
// concat
const cct = (bufs, ol) => {
    if (bufs.length == 1)
        return bufs[0];
    const buf = new u8(ol);
    for (let i = 0, b = 0; i < bufs.length; ++i) {
        const chk = bufs[i];
        buf.set(chk, b);
        b += chk.length;
    }
    return buf;
};
/**
 * Decompresses Zstandard data
 * @param dat The input data
 * @param buf The output buffer. If unspecified, the function will allocate
 *            exactly enough memory to fit the decompressed data. If your
 *            data has multiple frames and you know the output size, specifying
 *            it will yield better performance.
 * @returns The decompressed data
 */
function decompress(dat, buf) {
    const bufs = [], nb = +!buf;
    let bt = 0, ol = 0;
    for (; dat.length;) {
        const st = rzfh(dat, nb || buf);
        if (typeof st == 'object') {
            if (nb) {
                buf = null;
                if (st.w.length == st.u) {
                    bufs.push(buf = st.w);
                    ol += st.u;
                }
            }
            else {
                bufs.push(buf);
                st.e = 0;
            }
            for (; !st.l;) {
                const blk = rzb(dat, st, buf);
                if (!blk)
                    err(5);
                if (buf)
                    st.e = st.y;
                else {
                    bufs.push(blk);
                    ol += blk.length;
                    cpw(st.w, 0, blk.length);
                    st.w.set(blk, st.w.length - blk.length);
                }
            }
            bt = st.b + (st.c * 4);
        }
        else
            bt = st;
        dat = dat.subarray(bt);
    }
    return cct(bufs, ol);
}
/**
 * Decompressor for Zstandard streamed data
 */
class Decompress {
    /**
     * Creates a Zstandard decompressor
     * @param ondata The handler for stream data
     */
    constructor(ondata) {
        this.ondata = ondata;
        this.c = [];
        this.l = 0;
        this.z = 0;
    }
    /**
     * Pushes data to be decompressed
     * @param chunk The chunk of data to push
     * @param final Whether or not this is the last chunk in the stream
     */
    push(chunk, final) {
        if (typeof this.s == 'number') {
            const sub = Math.min(chunk.length, this.s);
            chunk = chunk.subarray(sub);
            this.s -= sub;
        }
        const sl = chunk.length;
        const ncs = sl + this.l;
        if (!this.s) {
            if (final) {
                if (!ncs) {
                    this.ondata(new u8(0), true);
                    return;
                }
                // min for frame + one block
                if (ncs < 5)
                    err(5);
            }
            else if (ncs < 18) {
                this.c.push(chunk);
                this.l = ncs;
                return;
            }
            if (this.l) {
                this.c.push(chunk);
                chunk = cct(this.c, ncs);
                this.c = [];
                this.l = 0;
            }
            if (typeof (this.s = rzfh(chunk)) == 'number')
                return this.push(chunk, final);
        }
        if (typeof this.s != 'number') {
            if (ncs < (this.z || 3)) {
                if (final)
                    err(5);
                this.c.push(chunk);
                this.l = ncs;
                return;
            }
            if (this.l) {
                this.c.push(chunk);
                chunk = cct(this.c, ncs);
                this.c = [];
                this.l = 0;
            }
            if (!this.z && ncs < (this.z = (chunk[this.s.b] & 2) ? 4 : 3 + ((chunk[this.s.b] >> 3) | (chunk[this.s.b + 1] << 5) | (chunk[this.s.b + 2] << 13)))) {
                if (final)
                    err(5);
                this.c.push(chunk);
                this.l = ncs;
                return;
            }
            else
                this.z = 0;
            for (;;) {
                const blk = rzb(chunk, this.s);
                if (!blk) {
                    if (final)
                        err(5);
                    const adc = chunk.subarray(this.s.b);
                    this.s.b = 0;
                    this.c.push(adc), this.l += adc.length;
                    return;
                }
                else {
                    this.ondata(blk, false);
                    cpw(this.s.w, 0, blk.length);
                    this.s.w.set(blk, this.s.w.length - blk.length);
                }
                if (this.s.l) {
                    const rest = chunk.subarray(this.s.b);
                    this.s = this.s.c * 4;
                    this.push(rest, final);
                    return;
                }
            }
        }
        else if (final)
            err(5);
    }
}

// HAVYN addition: decode exactly one Zstandard frame and ignore any bytes after it
// (ZIM archives place other data straight after the last cluster).
function decompressFrame(dat) {
    for (;;) {
        if (dat.length < 5) err(5);
        const st = rzfh(dat, 1);
        if (typeof st == 'object') {
            const bufs = [];
            let ol = 0, buf = null;
            if (st.w.length == st.u) { bufs.push(buf = st.w); ol += st.u; }
            for (; !st.l;) {
                const blk = rzb(dat, st, buf);
                if (!blk) err(5);
                if (buf) st.e = st.y;
                else { bufs.push(blk); ol += blk.length; cpw(st.w, 0, blk.length); st.w.set(blk, st.w.length - blk.length); }
            }
            return cct(bufs, ol);
        }
        dat = dat.subarray(st);
    }
}

return { decompress, decompressFrame, Decompress, ZstdErrorCode };
})();

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
