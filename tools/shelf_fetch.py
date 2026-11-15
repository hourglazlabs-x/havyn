#!/usr/bin/env python3
"""Fetch every document on HAVYN's reference shelf from its publisher, check it, and package the mirror.

Runs in GitHub Actions (.github/workflows/shelf.yml), which has open internet:
    python3 tools/shelf_fetch.py shelf/catalog.json out

Writes out/release/ (uploaded to the repository's "shelf" release):
  * the PDFs HAVYN may re-share (public domain and Creative Commons), under their catalog file names
  * shelf-index.json   every item: source used, size, SHA-256, page count, first words (for review)
  * shelf-files.tsv    the vault drive's shelf manifest (mirror links for shareable files, publisher links for the rest)
  * SHA256SUMS.txt     checksums of the mirrored files
  * HAVYN-shelf-phone.zip   the shareable phone set in one file, for phones without HAVYN's own address
and out/report.md (job summary), out/notes.md (release notes) and out/changed.txt (release files that differ
from the last build, so unchanged files aren't uploaded again).
Documents under the publisher's own terms (lic "link") are downloaded only to check the links; they are never uploaded.

Where each document comes from, in order: the catalog's "src" links; then resolvers ("ia" Internet Archive item,
"ox" OpenStax book, "dspace" repository handle); then "alt" copies on other sites; then the Internet Archive's Wayback copy of each "src" link,
byte for byte (for publishers that block cloud servers); then "ias", a search of other people's Internet Archive uploads;
then "parts" joined into one PDF. "expect" (a pattern)
must appear in the first pages, so a mirror can't hand over the wrong document. If a publisher is down on the
day of a full build, last build's checked copy is kept and the report says so."""
import concurrent.futures as cf, datetime, hashlib, json, logging, os, re, shutil, sys, threading, time, urllib.error, urllib.parse, urllib.request, zipfile
logging.getLogger("pypdf").setLevel(logging.ERROR)
from pathlib import Path

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 HAVYN-shelf/1.4 (+https://github.com/hourglazlabs-x/havyn)"
MIRROR = {"pd", "cc-by", "cc-by-sa", "cc-by-nc-sa"}
MAX_BYTES = 1_200_000_000    # release files must stay under 2 GiB; OpenStax's Anatomy and Physiology is about half a gigabyte
MIN_BYTES = 20_000
FILE_DEADLINE = 600          # seconds for one file, so one slow server can't stall the build
START = time.time(); BUDGET = 55 * 60   # stop starting new documents after this; the job has 90 minutes
IA = os.environ.get("SHELF_IA", "https://archive.org")                         # overridable for the local test only
WAYBACK = os.environ.get("SHELF_WAYBACK", "https://web.archive.org/web/%sid_/%s")
CDX = os.environ.get("SHELF_CDX", "https://web.archive.org/cdx/search/cdx")
RELEASES = os.environ.get("SHELF_RELEASES", "https://github.com/%s/releases/download/%s/")
WB_YEARS = ["2025", "2021"]
LIC_NAME = {"pd": "Public domain (US government work)", "cc-by": "CC BY", "cc-by-sa": "CC BY-SA", "cc-by-nc-sa": "CC BY-NC-SA", "link": "Publisher's terms (not re-hosted)"}

class Fatal(Exception):
    """This URL won't work however often it's tried: wrong file, too big, too slow."""

_slots_lock = threading.Lock(); _slots = {}
WB_HOST = urllib.parse.urlparse(WAYBACK).netloc.lower()
def slot(url):
    """One request at a time to the Wayback Machine (it rate-limits hard), two to the rest of the Internet Archive
    (it drops TLS handshakes under load), three to anyone else."""
    host = urllib.parse.urlparse(url).netloc.lower()
    with _slots_lock:
        if host not in _slots: _slots[host] = Paced() if host == WB_HOST else threading.BoundedSemaphore(2 if host.endswith("archive.org") else 3)
        return _slots[host]

class Paced:
    """A one-at-a-time slot that also waits a few seconds between requests."""
    GAP = float(os.environ.get("SHELF_WB_GAP", "6"))   # the Wayback Machine allows about 15 requests a minute
    def __init__(self): self.lock = threading.Lock(); self.last = 0.0
    def __enter__(self):
        self.lock.acquire()
        wait = self.last + self.GAP - time.time()
        if wait > 0: time.sleep(wait)
    def __exit__(self, *a):
        self.last = time.time(); self.lock.release()

class Breaker:
    """After the Wayback Machine refuses us a few times running (rate limit or block), stop asking it this build."""
    LIMIT = 3
    def __init__(self): self.lock = threading.Lock(); self.fails = 0; self.tripped = False
    def ok(self):
        with self.lock: self.fails = 0
    def bad(self):
        with self.lock:
            self.fails += 1
            if self.fails >= self.LIMIT and not self.tripped:
                self.tripped = True; print("Wayback Machine is refusing requests: not asking it again in this build", flush=True)
WB = Breaker()
def is_wb(url): return urllib.parse.urlparse(url).netloc.lower() == WB_HOST
def refused(e):
    return (isinstance(e, urllib.error.HTTPError) and e.code in (429, 503)) or (isinstance(e, urllib.error.URLError) and "refused" in str(e.reason).lower())

def cool_off(e):
    """When the Wayback Machine says "too many requests", wait as long as it asks (1-5 minutes) before trying again."""
    if isinstance(e, urllib.error.HTTPError) and e.code == 429:
        ra = (e.headers.get("Retry-After") or "") if e.headers else ""
        time.sleep(min(300, max(60, int(ra) if ra.isdigit() else 90)))

def slow_host(url):
    return urllib.parse.urlparse(url).netloc.lower().endswith("archive.org") or urllib.parse.urlparse(url).netloc.lower() == WB_HOST

def req(url, method="GET", headers=None, timeout=60):
    h = {"User-Agent": UA, "Accept": "application/pdf,application/json,text/html;q=0.9,*/*;q=0.8"}
    if headers: h.update(headers)
    return urllib.request.urlopen(urllib.request.Request(url, method=method, headers=h), timeout=timeout)

def get_text(url, timeout=60, headers=None, tries=3):
    last = None
    for a in range(tries):
        if is_wb(url) and WB.tripped: raise RuntimeError("Wayback Machine refused earlier requests; skipped")
        try:
            with slot(url):
                if is_wb(url) and WB.tripped: raise RuntimeError("Wayback Machine refused earlier requests; skipped")
                with req(url, headers=headers, timeout=timeout) as r:
                    return r.read(8_000_000).decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            last = e
            if is_wb(url) and refused(e):
                WB.bad()
                if not WB.tripped and a + 1 < tries: cool_off(e)
            if e.code in (400, 401, 403, 404, 410): break
        except Exception as e:
            last = e
            if is_wb(url) and refused(e): WB.bad()
        if is_wb(url) and WB.tripped: raise RuntimeError("Wayback Machine refused earlier requests; skipped")
        if a + 1 < tries: time.sleep((30 if slow_host(url) else 4) * (a + 1))
    raise last

def is_pdf_bytes(b): return b[:1024].find(b"%PDF-") >= 0

def probe_pdf(url):
    """True if url answers with a PDF (first KB), without downloading it all."""
    for a in range(2):
        try:
            with req(url, headers={"Range": "bytes=0-1023"}, timeout=40) as r:
                return r.status in (200, 206) and is_pdf_bytes(r.read(1024))
        except urllib.error.HTTPError:
            return False
        except Exception:
            time.sleep(3)
    return False

def download(url, dest, tries=None):
    """Stream url to dest; returns (size, sha256). Retries timeouts, dropped connections and TLS hiccups."""
    last = None; slow = slow_host(url); tries = tries or (5 if slow else 4)
    for attempt in range(tries):
        if is_wb(url) and WB.tripped: raise RuntimeError(last or "Wayback Machine refused earlier requests; skipped")
        part = Path(str(dest) + ".part"); expected = None
        try:
            with slot(url):
                if is_wb(url) and WB.tripped: raise Fatal(last or "Wayback Machine refused earlier requests; skipped")
                h = hashlib.sha256(); size = 0; t0 = time.time()
                with req(url, timeout=60) as r, open(part, "wb") as f:
                    if (r.headers.get("Content-Length") or "").isdigit() and not r.headers.get("Content-Encoding"): expected = int(r.headers["Content-Length"])
                    first = True
                    while True:
                        if time.time() - t0 > FILE_DEADLINE: raise Fatal("slower than %d s" % FILE_DEADLINE)
                        chunk = r.read1(1 << 20) if hasattr(r, "read1") else r.read(1 << 16)
                        if not chunk: break
                        if first:
                            if not is_pdf_bytes(chunk): raise Fatal("not a PDF (got %r)" % chunk[:60])
                            first = False
                        size += len(chunk)
                        if size > MAX_BYTES: raise Fatal("bigger than %d MB" % (MAX_BYTES // 1_000_000))
                        h.update(chunk); f.write(chunk)
            if expected is not None and size != expected: raise ValueError("connection closed early: %d of %d bytes" % (size, expected))
            if size < MIN_BYTES:
                n, text = pdf_info(part)
                raise ValueError("only %d bytes, %d pages: %s" % (size, n, text[:160]))
            if not pdf_info(part, pages=1)[0]: raise ValueError("the PDF doesn't open (damaged or cut short)")
            part.replace(dest)
            if is_wb(url): WB.ok()
            return size, h.hexdigest()
        except Fatal as e:
            last = str(e); break
        except urllib.error.HTTPError as e:
            last = "HTTP %d" % e.code
            if is_wb(url) and refused(e):
                WB.bad()
                if not WB.tripped and attempt + 1 < tries: cool_off(e)
            if e.code in (401, 403, 404, 410, 451): break
        except Exception as e:
            last = "%s: %s" % (type(e).__name__, e)
            if is_wb(url) and refused(e): WB.bad()
        finally:
            try: part.unlink()
            except FileNotFoundError: pass
        if attempt + 1 < tries: time.sleep((15 if slow else 5) * (attempt + 1))
    raise RuntimeError(last or "failed")

def pdf_info(path, pages=4, chars=600):
    try:
        from pypdf import PdfReader
        r = PdfReader(str(path))
        n = len(r.pages); text = ""
        for i in range(min(n, pages)):
            try: text += " " + (r.pages[i].extract_text() or "")
            except Exception: pass
            if len(text) > chars: break
        return n, re.sub(r"\s+", " ", text).strip()[:max(chars, 400)]
    except Exception as e:
        return 0, "(text unreadable: %s)" % type(e).__name__

def check_expect(path, pattern):
    """None if the first pages mention pattern; a note if the PDF has no text to check; raises if it's another document."""
    if not pattern: return None
    n, text = pdf_info(path, pages=8, chars=6000)
    if len(text) < 200: return "identity not checked: no text layer"
    if re.search(pattern, text, re.I): return None
    raise Fatal("wrong document: first pages don't match %r (%s)" % (pattern, text[:120]))

def strip_pages(path, spec):
    """Take off cover pages a re-host added ({"marker": text on the added page, "pages": how many}); None if there were none."""
    from pypdf import PdfReader, PdfWriter
    if not re.search(spec["marker"], PdfReader(str(path)).pages[0].extract_text() or "", re.I): return None
    w = PdfWriter(clone_from=str(path))
    for _ in range(spec.get("pages", 1)): w.remove_page(0)
    try: w.compress_identical_objects()
    except Exception: pass
    tmp = Path(str(path) + ".strip")
    with open(tmp, "wb") as f: w.write(f)
    tmp.replace(path)
    return "took off %d cover page(s) added by the site it came from" % spec.get("pages", 1)

def merge(paths, dest):
    from pypdf import PdfWriter
    w = PdfWriter()
    for p in paths: w.append(str(p))
    with open(dest, "wb") as f: w.write(f)

def resolve_ia(spec):
    """Internet Archive items: [{"item", "match"}, ...]; one download link per item that has a matching PDF."""
    out, notes = [], []
    for s in (spec if isinstance(spec, list) else [spec]):
        try:
            meta = json.loads(get_text(IA + "/metadata/" + urllib.parse.quote(s["item"])))
        except Exception as e:
            notes.append("%s: %s" % (s["item"], e)); continue
        pdfs = sorted(f["name"] for f in meta.get("files", []) if f.get("name", "").lower().endswith(".pdf"))
        hit = [n for n in pdfs if re.search(s["match"], n, re.I)]
        if hit: out.append(IA + "/download/%s/%s" % (urllib.parse.quote(s["item"]), urllib.parse.quote(hit[0])))
        else: notes.append("%s has no PDF matching %s (has: %s)" % (s["item"], s["match"], "; ".join(pdfs[:24])))
    if not out: raise RuntimeError(" / ".join(notes))
    if notes: print("archive.org:", " / ".join(notes)[:600], file=sys.stderr)
    return out

def resolve_ias(spec):
    """Internet Archive search, most-downloaded first: {"q", "match"} -> PDFs from up to four matching items ("expect" checks which is right)."""
    q = urllib.parse.urlencode([("q", spec["q"]), ("fl[]", "identifier"), ("sort[]", "downloads desc"), ("rows", "8"), ("output", "json")])
    docs = json.loads(get_text(IA + "/advancedsearch.php?" + q))["response"]["docs"]
    if not docs: raise RuntimeError("Internet Archive search found nothing for %s" % spec["q"])
    return resolve_ia([{"item": d["identifier"], "match": spec.get("match", r"\.pdf$")} for d in docs])[:4]

OX_API = "https://openstax.org/apps/cms/api/v2/pages/"
def resolve_ox(slug):
    """OpenStax's CMS (Wagtail) API: find the book page, then read its PDF links (low resolution first: smaller)."""
    tries = [OX_API + "?type=books.Book&slug=%s&fields=high_resolution_pdf_url,low_resolution_pdf_url" % slug,
             OX_API + "?type=books.Book&slug=%s&fields=*" % slug, OX_API + "?slug=%s" % slug]
    for u in tries:
        try:
            items = json.loads(get_text(u)).get("items") or []
        except Exception as e:
            print("openstax", u, e, file=sys.stderr); continue
        for b in items:
            if not (b.get("low_resolution_pdf_url") or b.get("high_resolution_pdf_url")) and b.get("id"):
                try: b = json.loads(get_text(OX_API + "%d/" % b["id"]))
                except Exception as e: print("openstax page", b.get("id"), e, file=sys.stderr); continue
            for k in ("low_resolution_pdf_url", "high_resolution_pdf_url"):
                if b.get(k): return b[k]
    raise RuntimeError("OpenStax book %s: no PDF link in the API" % slug)

def resolve_dspace(spec):
    """DSpace 7 repositories (WHO IRIS): handle -> item -> ORIGINAL bundle -> the bitstream whose name matches."""
    base = spec["base"].rstrip("/"); J = {"Accept": "application/json"}
    item = json.loads(get_text(base + "/server/api/pid/find?id=" + urllib.parse.quote(spec["handle"], safe="/"), headers=J))
    bundles = json.loads(get_text(item["_links"]["bundles"]["href"], headers=J))["_embedded"]["bundles"]
    for b in bundles:
        if b.get("name") != "ORIGINAL": continue
        for s in json.loads(get_text(b["_links"]["bitstreams"]["href"], headers=J))["_embedded"]["bitstreams"]:
            if re.search(spec.get("match", r"\.pdf$"), s.get("name", ""), re.I): return s["_links"]["content"]["href"]
    raise RuntimeError("DSpace %s: no file matching %s" % (spec["handle"], spec.get("match")))

def wayback(urls, years):
    """The Internet Archive's stored copies of each link that were PDFs when captured, newest first (id_ = the
    original bytes, no toolbar). If the capture index can't be reached, try the captures nearest the given years."""
    out = []
    for u in urls:
        if WB.tripped: break
        if re.search(r"(archive\.org|webarchive\.)", u): continue
        try:
            q = urllib.parse.urlencode([("url", u), ("output", "json"), ("filter", "statuscode:200"), ("filter", "mimetype:application/pdf"), ("limit", "-3")])
            rows = json.loads(get_text(CDX + "?" + q) or "[]")
            out += [WAYBACK % (c[1], c[2]) for c in reversed(rows[1:])]
        except Exception as e:
            print("Wayback index unavailable for %s (%s): trying by year" % (u, e), file=sys.stderr)
            out += [WAYBACK % (y, u) for y in years]
    return out

HP_SUFFIX = ["fm", "if", "toc", "intro", "how", "wo"] + ["%02d" % i for i in range(0, 46)] + ["gp", "green", "voc", "vocab", "resc", "res", "indx", "index", "bm", "ib", "ob"]
def resolve_hp(code, years):
    for y in years:
        base = "https://hesperian.org/wp-content/uploads/pdf/en_%s_%d/en_%s_%d_" % (code, y, code, y)
        if not probe_pdf(base + "fm.pdf") and not probe_pdf(base + "01.pdf"): continue
        with cf.ThreadPoolExecutor(8) as ex:
            ok = list(ex.map(lambda s: probe_pdf(base + s + ".pdf"), HP_SUFFIX))
        urls = [base + s + ".pdf" for s, good in zip(HP_SUFFIX, ok) if good]
        if len(urls) >= 5: return y, urls
    raise RuntimeError("no Hesperian %s edition found" % code)

def fetch_item(it, work, rel):
    r = fetch_item1(it, work, rel)
    if r.get("ok"):
        info = " · ".join(filter(None, ["%s pages" % r.get("pages"), r.get("note"), r.get("license_seen"), (r.get("probe") or "")[:220]]))
        print("✓ %-16s %7.1f MB  %s\n      %s" % (r["id"], (r.get("size") or 0) / 1e6, r.get("url"), info), flush=True)
    else:
        print("✗ %-16s          %s" % (r["id"], r.get("error", "")[:1500]), flush=True)
    return r

def fetch_item1(it, work, rel):
    r = {k: it.get(k) for k in ("id", "sys", "t", "by", "yr", "lic", "ph", "core", "file", "u")}
    if time.time() - START > BUDGET:
        r.update(ok=False, error="skipped: build time budget used up (run again)"); return r
    r["mirror"] = it["lic"] in MIRROR
    d = work / it["id"]; d.mkdir(parents=True, exist_ok=True)
    errors = []
    try:
        if it.get("hp"):
            y, urls = resolve_hp(it["hp"]["code"], it["hp"].get("years", [2026, 2025, 2024]))
            parts = []
            for u in urls:
                name = u.rsplit("/", 1)[1]
                size, sha = download(u, d / name)
                n, _ = pdf_info(d / name)
                parts.append({"url": u, "name": name, "size": size, "sha256": sha, "pages": n})
            first = pdf_info(d / parts[0]["name"])[1]
            r.update(ok=True, edition=y, parts=parts, size=sum(p["size"] for p in parts), pages=sum(p["pages"] for p in parts), url=urls[0], probe=first)
            return r
        src = list(it.get("src") or []); cands = list(src)
        for key, fn in (("ia", resolve_ia), ("ox", resolve_ox), ("dspace", resolve_dspace)):
            if it.get(key):
                try:
                    got = fn(it[key]); cands += got if isinstance(got, list) else [got]
                except Exception as e: errors.append("%s: %s" % (key, e))
        cands += list(it.get("alt") or [])   # other copies, after the publisher and the archive lookups
        out = d / it["file"]; used = None; note = None
        def first_good(urls):
            for u in urls:
                try:
                    size, sha = download(u, out)
                    note = check_expect(out, it.get("expect"))
                    if it.get("minpages") and pdf_info(out, pages=1)[0] < it["minpages"]:
                        raise Fatal("only %d pages, expected at least %d (part of the book?)" % (pdf_info(out, pages=1)[0], it["minpages"]))
                    return u, size, sha, note
                except Exception as e:
                    errors.append("%s → %s" % (u, e)); out.unlink(missing_ok=True)
            return None
        got = first_good(cands)
        if not got and src and it.get("wb") is not False:   # only now ask the Wayback Machine (it rate-limits)
            got = first_good(wayback(src, it.get("wb") or WB_YEARS))
        if not got and it.get("ias"):                          # last: other people's uploads to the Internet Archive ("expect" checks them)
            try: got = first_good(resolve_ias(it["ias"]))
            except Exception as e: errors.append("ias: %s" % e)
        if got: used, size, sha, note = got
        if not used and it.get("parts"):
            try:
                ps = []
                for i, u in enumerate(it["parts"]):
                    p = d / ("part%02d.pdf" % i); download(u, p); ps.append(p)
                merge(ps, out)
                size = out.stat().st_size; sha = hashlib.sha256(out.read_bytes()).hexdigest(); used = "parts:" + it["parts"][0]
            except Exception as e:
                errors.append("parts → %s" % e)
        if not used: raise RuntimeError("; ".join(errors) or "no source")
        if it.get("strip"):
            cut = strip_pages(out, it["strip"])
            if cut:
                note = "; ".join(filter(None, [note, cut])); size = out.stat().st_size; sha = hashlib.sha256(out.read_bytes()).hexdigest()
        n, text = pdf_info(out)
        r.update(ok=True, url=used, size=size, sha256=sha, pages=n, probe=text)
        if used.startswith(WAYBACK.split("%s")[0]): r["via"] = "wayback"
        if it["lic"].startswith("cc"):
            m = re.search(r"(Creative Commons[^.;]{0,160}|Attribution[- ][^.;]{0,120}(?:International|IGO|Unported))", pdf_info(out, pages=12, chars=20000)[1])
            r["license_seen"] = m.group(0)[:200] if m else "(no license statement in the first pages)"
        if note: r["note"] = note
        if errors: r["tried"] = errors[:6]
        if r["mirror"]: shutil.copy(out, rel / it["file"])
    except Exception as e:
        r.update(ok=False, error=str(e)[:1500])
    return r

def keep_prev(p, repo, tag, rel):
    """Make sure last build's copy is still in the release; phone-set files are fetched too (they go in the phone zip)."""
    if not p.get("mirror"): return True
    url = RELEASES % (repo, tag) + urllib.parse.quote(p["file"])
    try:
        if p.get("ph"):
            size, sha = download(url, rel / p["file"])
            if sha != p.get("sha256"): raise RuntimeError("checksum differs from last build")
        else:
            with req(url, method="HEAD", timeout=60) as r:
                if r.status != 200: raise RuntimeError("HTTP %d" % r.status)
        return True
    except Exception as e:
        print("could not keep last build's %s: %s" % (p["id"], e)); return False

def carry_over(results, prev, prev_built, repo, tag, rel):
    """A publisher being down on build day shouldn't take a checked document off everyone's shelf: keep last build's copy."""
    for i, r in enumerate(results):
        p = prev.get(r["id"])
        if r.get("ok") or not p or p.get("file") != r.get("file") or bool(p.get("mirror")) != bool(r.get("mirror")): continue
        if not keep_prev(p, repo, tag, rel): continue
        results[i] = dict(p, carried=r.get("error", "")[:600], carried_from=prev_built)
        print("↺ %-16s kept last build's copy (today: %s)" % (r["id"], r.get("error", "")[:160]), flush=True)

def main():
    cat = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    out = Path(sys.argv[2]); rel = out / "release"; work = out / "work"
    for p in (rel, work): p.mkdir(parents=True, exist_ok=True)
    repo = os.environ.get("GITHUB_REPOSITORY", "hourglazlabs-x/havyn"); tag = cat.get("release", "shelf")
    items = cat["items"]
    only = set(filter(None, os.environ.get("SHELF_ONLY", "").split(",")))
    merge = bool(only) and os.environ.get("SHELF_PUBLISH") == "1"   # re-check a few documents, keep everything else as it is
    if only: items = [i for i in items if i["id"] in only]
    prev, prev_built = {}, None
    if not only or merge:
        try:
            pj = json.loads(get_text(RELEASES % (repo, tag) + "shelf-index.json"))
            prev = {p["id"]: p for p in pj.get("items", []) if p.get("ok")}; prev_built = pj.get("built")
        except Exception as e:
            print("no earlier shelf build to compare with (%s)" % e)
    with cf.ThreadPoolExecutor(6) as ex:
        results = list(ex.map(lambda it: fetch_item(it, work, rel), items))
    if prev: carry_over(results, prev, prev_built, repo, tag, rel)
    if merge:
        got = {r["id"]: r for r in results}
        for it in cat["items"]:
            p = prev.get(it["id"])
            if it["id"] not in got and p and p.get("file") == it["file"] and keep_prev(p, repo, tag, rel): got[it["id"]] = p
        results = [got[it["id"]] for it in cat["items"] if it["id"] in got]
    sysdir = {s["id"]: "10-shelf/%s-%s" % (s["n"], re.sub(r"[^a-z0-9]+", "-", s["t"].lower()).strip("-")) for s in cat["systems"]}
    rows, sums = [], []
    for r in results:
        if not r.get("ok"): continue
        st = "core" if r.get("core") else "full"; folder = sysdir[r["sys"]]; title = r["t"].replace("\t", " ")
        if r.get("parts"):
            book = re.sub(r"[^A-Za-z0-9]+", "-", r["t"]).strip("-")
            for p in r["parts"]: rows.append([r["id"], st, folder + "/" + book, p["name"], p["url"], p["sha256"], str(p["size"]), title])
        elif r["mirror"]:
            url = "https://github.com/%s/releases/download/%s/%s" % (repo, tag, urllib.parse.quote(r["file"]))
            rows.append([r["id"], st, folder, r["file"], url, r["sha256"], str(r["size"]), title]); sums.append("%s  %s" % (r["sha256"], r["file"]))
        else:
            rows.append([r["id"], st, folder, r["file"], r["url"], r["sha256"], str(r["size"]), title])
    (rel / "shelf-files.tsv").write_text("".join("\t".join(x) + "\n" for x in rows), encoding="utf-8")
    (rel / "SHA256SUMS.txt").write_text("\n".join(sums) + "\n", encoding="utf-8")
    phone = [r for r in results if r.get("ok") and r["mirror"] and r.get("ph")]
    readme = ("HAVYN reference shelf: phone set\n\nUnzip this in the Files app (tap the file once), then in HAVYN open Library, tap Add files,\n"
              "open the unzipped folder and select every PDF. Each document keeps its publisher's own license (see shelf-index.json in the\n"
              "same release). Built %s from %s.\n" % (datetime.date.today().isoformat(), repo))
    with zipfile.ZipFile(rel / "HAVYN-shelf-phone.zip", "w", zipfile.ZIP_STORED) as z:
        z.writestr("HAVYN-shelf-phone/README.txt", readme)
        for r in phone: z.write(rel / r["file"], "HAVYN-shelf-phone/" + r["file"])
    index = {"built": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"), "repo": repo, "release": tag, "items": results}
    (rel / "shelf-index.json").write_text(json.dumps(index, indent=1, ensure_ascii=False), encoding="utf-8")
    prev_sha = {p["file"]: p.get("sha256") for p in prev.values() if p.get("mirror")}
    meta = ["shelf-index.json", "shelf-files.tsv", "SHA256SUMS.txt", "HAVYN-shelf-phone.zip"]
    changed = meta + [r["file"] for r in results if r.get("ok") and r["mirror"] and prev_sha.get(r["file"]) != r["sha256"]]
    (out / "changed.txt").write_text("\n".join(changed) + "\n", encoding="utf-8")
    keep = meta + [r["file"] for r in results if r.get("ok") and r["mirror"]]
    (out / "keep.txt").write_text("\n".join(keep) + "\n", encoding="utf-8")

    okn = sum(1 for r in results if r.get("ok")); mb = lambda b: "%.1f MB" % (b / 1e6)
    kept = sum(1 for r in results if r.get("carried") is not None)
    lines = ["# HAVYN shelf build", "", "%d of %d documents fetched and checked%s. Mirrored: %d files, %s. Phone set: %d files, %s." % (
        okn, len(results), (" (%d kept from the last build because the publisher failed today)" % kept) if kept else "",
        len(sums), mb(sum(r["size"] for r in results if r.get("ok") and r["mirror"])), len(phone), mb(sum(r["size"] for r in phone))), "",
        "| | id | title | size | pages | source | first words |", "|---|---|---|---|---|---|---|"]
    for r in results:
        if r.get("ok"):
            host = urllib.parse.urlparse(r["url"].replace("parts:", "")).netloc + (" (Wayback copy)" if r.get("via") == "wayback" else "")
            mark = "↺" if r.get("carried") is not None else "✓"
            extra = (" [%s]" % r["note"]) if r.get("note") else ""
            lines.append("| %s | %s | %s | %s | %s | %s | %s |" % (mark, r["id"], r["t"], mb(r["size"]), r.get("pages", ""), host, ((r.get("probe") or "")[:140] + extra).replace("|", "/")))
        else:
            lines.append("| ✗ | %s | %s | | | | %s |" % (r["id"], r["t"], r.get("error", "")[:400].replace("|", "/")))
    try:
        listing = get_text("https://download.kiwix.org/zim/wiktionary/")
        wk = sorted(set(re.findall(r"wiktionary_en_[a-z_]+_\d{4}-\d{2}\.zim", listing)))
        sizes = {m.group(1): m.group(2) for m in re.finditer(r'(wiktionary_en_[a-z_]+_\d{4}-\d{2}\.zim)</a>\s+\S+\s+\S+\s+(\S+)', listing)}
        lines += ["", "## Kiwix English dictionaries today", ""] + ["- %s %s" % (w, sizes.get(w, "")) for w in wk]
    except Exception as e:
        lines += ["", "Kiwix dictionary listing unavailable: %s" % e]
    (out / "report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    notes = ["HAVYN's reference shelf: real documents from their publishers, checked and mirrored for offline use. "
             "Public domain and Creative Commons documents are attached here; the rest download from their publishers (see shelf-files.tsv).", "",
             "Built %s. %d documents checked." % (index["built"], okn), ""]
    for r in results:
        if r.get("ok"): notes.append("- **%s** — %s%s. %s. %s" % (r["t"], r["by"], (", %s" % r["yr"]) if r.get("yr") else "", LIC_NAME.get(r["lic"], r["lic"]), r.get("u") or r["url"]))
    (out / "notes.md").write_text("\n".join(notes) + "\n", encoding="utf-8")
    print("\n".join(lines[:3]))
    return 0 if okn else 1

if __name__ == "__main__":
    sys.exit(main())
