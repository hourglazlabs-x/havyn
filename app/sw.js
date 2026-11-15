/* HAVYN FIELD service worker: cache the app once, then serve it with no network.
   It also serves the offline library: ./z/<archive id>/<path> reads pages straight out of ZIM archives
   saved on this phone (IndexedDB), with byte ranges so video can seek. Only shelf downloads (./shelf/) reach the network,
   and only HAVYN's own address. */
importScripts("./zimkit.js");
const VERSION = "1.6.0+9c32dd890c";
const CACHE = "havyn-field-" + VERSION;
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./apple-touch-icon.png", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png",
  "./pdfjs/pdf.min.js", "./pdfjs/pdf.worker.min.js", "./pdflib/pdf-lib.esm.min.js", "./zimkit.js",
  "./vault/get-vault.sh", "./vault/get-vault.ps1", "./vault/START-HERE.html"];

// Archive pages never run scripts and never reach the network.
const ZCSP = "default-src 'self' data: blob:; script-src 'none'; object-src 'none'; frame-src 'none'; worker-src 'none'; connect-src 'none'; " +
  "form-action 'none'; base-uri 'self'; style-src 'self' 'unsafe-inline' data:; img-src 'self' data: blob:; media-src 'self' data: blob:; font-src 'self' data:";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("havyn-field-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* ---------- archives ---------- */
let dbP = null;
function db() {
  if (!dbP) {
    dbP = new Promise((res, rej) => {
      const r = indexedDB.open("havyn-field", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("kv");
      r.onsuccess = () => { const d = r.result; d.onversionchange = () => { d.close(); dbP = null; }; res(d); };
      r.onerror = () => { dbP = null; rej(r.error); };
    });
  }
  return dbP;
}
async function kvGet(k) {
  const d = await db();
  return new Promise((res) => { try { const q = d.transaction("kv", "readonly").objectStore("kv").get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(undefined); } catch (e) { res(undefined); } });
}
const archives = new Map();
function archive(id) {
  let p = archives.get(id);
  if (!p) {
    p = kvGet("zim:" + id).then(async (blob) => {
      // Archives downloaded inside HAVYN are stored in parts ({parts: [keys]}); they open as one Blob without copying.
      if (blob && Array.isArray(blob.parts)) {
        const bs = [];
        for (const k of blob.parts) { const b = await kvGet(k); if (!b) throw Object.assign(new Error("Part of this archive is missing on this phone."), { status: 404 }); bs.push(b); }
        blob = new Blob(bs);
      }
      if (!blob) throw Object.assign(new Error("This archive isn't on this phone any more."), { status: 404 });
      return HavynZim.Archive.open(blob, { clusterCacheBytes: 24 * 1024 * 1024 });
    });
    archives.set(id, p); p.catch(() => archives.delete(id));
    while (archives.size > 4) archives.delete(archives.keys().next().value);
  }
  return p;
}
self.addEventListener("message", (e) => { if (e.data && e.data.t === "zim-drop") archives.delete(String(e.data.id)); });

const encPath = (p) => String(p).split("/").map(encodeURIComponent).join("/");
function page(status, title, body) {
  const html = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + title + "</title>" +
    '<body style="font:17px -apple-system,system-ui,sans-serif;padding:24px;line-height:1.45;color:#111;background:#fff"><h3>' + title + "</h3><p>" + body + "</p></body>";
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": ZCSP, "Cache-Control": "no-store" } });
}
const escH = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function ranged(req, body, mime) {
  const size = body.size !== undefined ? body.size : body.length;
  const h = new Headers({ "Content-Type": mime, "Accept-Ranges": "bytes", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": ZCSP, "Referrer-Policy": "no-referrer" });
  const r = req.headers.get("Range"), m = r && /^bytes=(\d*)-(\d*)$/.exec(r.trim());
  if (m && (m[1] !== "" || m[2] !== "")) {
    let s, e;
    if (m[1] === "") { s = Math.max(0, size - Number(m[2])); e = size - 1; }
    else { s = Number(m[1]); e = m[2] === "" ? size - 1 : Math.min(size - 1, Number(m[2])); }
    if (!(s < size) || s > e) { h.set("Content-Range", "bytes */" + size); return new Response(null, { status: 416, headers: h }); }
    h.set("Content-Range", "bytes " + s + "-" + e + "/" + size); h.set("Content-Length", String(e - s + 1));
    return new Response(body.slice(s, e + 1), { status: 206, headers: h });
  }
  h.set("Content-Length", String(size));
  return new Response(body, { status: 200, headers: h });
}

async function zimResponse(rest, req, base) {
  const k = rest.indexOf("/");
  const id = decodeURIComponent(k < 0 ? rest : rest.slice(0, k));
  let path = k < 0 ? "" : rest.slice(k + 1);
  try { path = path.split("/").map(decodeURIComponent).join("/"); } catch (e) {}
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const a = await archive(id);
      if (!path) {
        const m = await a.mainEntry();
        if (!m) return page(404, "No main page", "Use search to find a page in this archive.");
        return Response.redirect(base + "z/" + encodeURIComponent(id) + "/" + encPath(a.pathOf(m)), 302);
      }
      const d = await a.byPath(path);
      if (!d) return page(404, "Not in this archive", escH(path) + " isn't part of this archive. It may live in a bigger edition, or online only.");
      if (d.redirect >= 0) { const t = await a.resolve(d); return Response.redirect(base + "z/" + encodeURIComponent(id) + "/" + encPath(a.pathOf(t)), 302); }
      if (d.special) return page(404, "Empty entry", "This entry has no content.");
      const L = await a.locate(d);
      return ranged(req, L.mem ? L.mem : a.blob.slice(L.file[0], L.file[1]), a.mimeOf(d));
    } catch (e) {
      archives.delete(id);
      if (attempt === 0 && !(e && e.status === 404) && !(e && e.name === "ZimError")) continue; // reopen once (file handle may be stale)
      return page(e && e.status ? e.status : 500, "Can't open this page", escH(e && e.message ? e.message : String(e)));
    }
  }
}

/* ---------- routing ---------- */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch other origins
  const base = self.registration.scope, scopePath = new URL(base).pathname;
  const rel = url.pathname.startsWith(scopePath) ? url.pathname.slice(scopePath.length) : "";
  if (rel.startsWith("z/")) { event.respondWith(zimResponse(rel.slice(2), req, base)); return; }
  if (rel.startsWith("shelf/")) return; // shelf downloads go straight to HAVYN's address; the app stores them itself, never twice
  if (req.mode === "navigate") {
    event.respondWith(caches.match("./index.html").then((r) => r || fetch(req)));
    return;
  }
  event.respondWith(caches.match(req, { ignoreSearch: true }).then((r) => r || fetch(req)));
});
