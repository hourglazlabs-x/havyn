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
and out/report.md (job summary) and out/notes.md (release notes).
Documents under the publisher's own terms (lic "link") are downloaded only to check the links; they are never uploaded."""
import concurrent.futures as cf, datetime, hashlib, json, logging, os, re, shutil, sys, time, urllib.error, urllib.parse, urllib.request, zipfile
logging.getLogger("pypdf").setLevel(logging.ERROR)
from pathlib import Path

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 HAVYN-shelf/1.4 (+https://github.com/hourglazlabs-x/havyn)"
MIRROR = {"pd", "cc-by", "cc-by-sa", "cc-by-nc-sa"}
MAX_BYTES = 450_000_000
FILE_DEADLINE = 600          # seconds for one file, so one slow server can't stall the build
START = time.time(); BUDGET = 55 * 60   # stop starting new documents after this; the job has 90 minutes
LIC_NAME = {"pd": "Public domain (US government work)", "cc-by": "CC BY", "cc-by-sa": "CC BY-SA", "cc-by-nc-sa": "CC BY-NC-SA", "link": "Publisher's terms (not re-hosted)"}

def req(url, method="GET", headers=None, timeout=60):
    h = {"User-Agent": UA, "Accept": "application/pdf,application/json,text/html;q=0.9,*/*;q=0.8"}
    if headers: h.update(headers)
    return urllib.request.urlopen(urllib.request.Request(url, method=method, headers=h), timeout=timeout)

def get_text(url, timeout=60):
    with req(url, timeout=timeout) as r:
        return r.read(8_000_000).decode("utf-8", "replace")

def is_pdf_bytes(b): return b[:1024].find(b"%PDF-") >= 0

def probe_pdf(url):
    """True if url answers with a PDF (first KB), without downloading it all."""
    try:
        with req(url, headers={"Range": "bytes=0-1023"}, timeout=40) as r:
            return r.status in (200, 206) and is_pdf_bytes(r.read(1024))
    except Exception:
        return False

def download(url, dest, tries=4):
    """Stream url to dest; returns (size, sha256). Raises if it isn't a PDF or is too big."""
    last = None
    for attempt in range(tries):
        part = Path(str(dest) + ".part")
        try:
            h = hashlib.sha256(); size = 0; t0 = time.time()
            with req(url, timeout=60) as r, open(part, "wb") as f:
                first = True
                while True:
                    if time.time() - t0 > FILE_DEADLINE: raise TimeoutError("slower than %d s" % FILE_DEADLINE)
                    chunk = r.read1(1 << 20) if hasattr(r, "read1") else r.read(1 << 16)
                    if not chunk: break
                    if first:
                        if not is_pdf_bytes(chunk): raise ValueError("not a PDF (got %r)" % chunk[:60])
                        first = False
                    size += len(chunk)
                    if size > MAX_BYTES: raise ValueError("bigger than %d MB" % (MAX_BYTES // 1_000_000))
                    h.update(chunk); f.write(chunk)
            if size < 20_000: raise ValueError("only %d bytes" % size)
            part.replace(dest)
            return size, h.hexdigest()
        except urllib.error.HTTPError as e:
            last = "HTTP %d" % e.code
            if e.code in (401, 403, 404, 410): break
        except Exception as e:
            last = "%s: %s" % (type(e).__name__, e)
            if isinstance(e, (ValueError, TimeoutError)): break
        finally:
            try: part.unlink()
            except FileNotFoundError: pass
        time.sleep(4 * (attempt + 1))
    raise RuntimeError(last or "failed")

def pdf_info(path):
    try:
        from pypdf import PdfReader
        r = PdfReader(str(path))
        n = len(r.pages); text = ""
        for i in range(min(n, 4)):
            try: text += " " + (r.pages[i].extract_text() or "")
            except Exception: pass
            if len(text) > 600: break
        return n, re.sub(r"\s+", " ", text).strip()[:400]
    except Exception as e:
        return 0, "(text unreadable: %s)" % type(e).__name__

def merge(paths, dest):
    from pypdf import PdfWriter
    w = PdfWriter()
    for p in paths: w.append(str(p))
    with open(dest, "wb") as f: w.write(f)

def resolve_ia(item, match):
    meta = json.loads(get_text("https://archive.org/metadata/" + urllib.parse.quote(item)))
    names = sorted(f["name"] for f in meta.get("files", []) if f.get("name", "").lower().endswith(".pdf") and re.search(match, f["name"], re.I))
    if not names: raise RuntimeError("no file in %s matches %s" % (item, match))
    return "https://archive.org/download/%s/%s" % (urllib.parse.quote(item), urllib.parse.quote(names[0]))

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
    print("%s %-16s %7.1f MB  %s" % ("✓" if r.get("ok") else "✗", r["id"], (r.get("size") or 0) / 1e6, r.get("url") if r.get("ok") else r.get("error", "")[:200]), flush=True)
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
        cands = list(it.get("src") or [])
        if it.get("ia"):
            try: cands.append(resolve_ia(it["ia"]["item"], it["ia"]["match"]))
            except Exception as e: errors.append("ia: %s" % e)
        if it.get("ox"):
            try: cands.append(resolve_ox(it["ox"]))
            except Exception as e: errors.append("openstax: %s" % e)
        out = d / it["file"]; used = None
        for u in cands:
            try:
                size, sha = download(u, out); used = u; break
            except Exception as e:
                errors.append("%s → %s" % (u, e))
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
        n, text = pdf_info(out)
        r.update(ok=True, url=used, size=size, sha256=sha, pages=n, probe=text)
        if r["mirror"]: shutil.copy(out, rel / it["file"])
    except Exception as e:
        r.update(ok=False, error=str(e)[:900])
    return r

def main():
    cat = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    out = Path(sys.argv[2]); rel = out / "release"; work = out / "work"
    for p in (rel, work): p.mkdir(parents=True, exist_ok=True)
    repo = os.environ.get("GITHUB_REPOSITORY", "hourglazlabs-x/havyn"); tag = cat.get("release", "shelf")
    items = cat["items"]
    only = set(filter(None, os.environ.get("SHELF_ONLY", "").split(",")))
    if only: items = [i for i in items if i["id"] in only]
    with cf.ThreadPoolExecutor(6) as ex:
        results = list(ex.map(lambda it: fetch_item(it, work, rel), items))
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

    okn = sum(1 for r in results if r.get("ok")); mb = lambda b: "%.1f MB" % (b / 1e6)
    lines = ["# HAVYN shelf build", "", "%d of %d documents fetched and checked. Mirrored: %d files, %s. Phone set: %d files, %s." % (
        okn, len(results), len(sums), mb(sum(r["size"] for r in results if r.get("ok") and r["mirror"])), len(phone), mb(sum(r["size"] for r in phone))), "",
        "| | id | title | size | pages | source | first words |", "|---|---|---|---|---|---|---|"]
    for r in results:
        if r.get("ok"):
            host = urllib.parse.urlparse(r["url"].replace("parts:", "")).netloc
            lines.append("| ✓ | %s | %s | %s | %s | %s | %s |" % (r["id"], r["t"], mb(r["size"]), r.get("pages", ""), host, (r.get("probe") or "")[:140].replace("|", "/")))
        else:
            lines.append("| ✗ | %s | %s | | | | %s |" % (r["id"], r["t"], r.get("error", "")[:300].replace("|", "/")))
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
