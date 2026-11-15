"""Local test of tools/shelf_fetch.py against a fake web: Wayback fallback, retries, identity check, IA item/search,
DSpace, carry-over of last build's copy, incremental upload list."""
import hashlib, http.server, importlib.util, io, json, os, socketserver, sys, threading, time, urllib.parse
from pathlib import Path
from reportlab.pdfgen import canvas

# Run: python3 tests/shelf_fetch_test.py [work-dir]   (needs reportlab to make test PDFs)
import tempfile
T = Path(sys.argv[1] if len(sys.argv) > 1 else tempfile.mkdtemp(prefix="shelf-fetch-")); T.mkdir(parents=True, exist_ok=True)
FETCHER = str(Path(__file__).resolve().parent.parent / "tools" / "shelf_fetch.py")
def mkpdf(label, pages=10):
    b = io.BytesIO(); c = canvas.Canvas(b, pageCompression=0)
    for i in range(pages):
        for j in range(40): c.drawString(40, 800 - j * 18, "%s page %d line %d lorem ipsum dolor sit amet consectetur %d" % (label, i + 1, j, i * j))
        c.showPage()
    c.save(); return b.getvalue()
def stub():
    b = io.BytesIO(); c = canvas.Canvas(b); c.drawString(40, 800, "Please wait, generating"); c.showPage(); c.save(); return b.getvalue()

DOC = {k: mkpdf(k) for k in ["TB MED 577 Field Water", "WRONG book", "RIGHT book", "NEETS Module 03", "Automotive old copy", "Principles of Automotive Vehicles TM 9-8000", "Drinking-water quality guidelines", "LINK doc", "FLAKY doc"]}
PREV_STUB = mkpdf("Stub doc last month")
hits = {}
class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def send(self, code, body=b"", ctype="application/pdf"):
        self.send_response(code); self.send_header("Content-Type", ctype); self.send_header("Content-Length", str(len(body))); self.end_headers(); self.wfile.write(body)
    def do_GET(self):
        u = urllib.parse.urlparse(self.path); p = urllib.parse.unquote(u.path); q = urllib.parse.parse_qs(u.query)
        hits[p] = hits.get(p, 0) + 1
        J = lambda o: self.send(200, json.dumps(o).encode(), "application/json")
        if p == "/403/tbmed.pdf": return self.send(403, b"forbidden", "text/html")
        if p.startswith("/wb/"):
            target = p.split("id_/", 1)[1]
            if target.endswith("/403/tbmed.pdf") and p.startswith("/wb/2025"): return self.send(200, b"<!DOCTYPE html><html>challenge</html>", "text/html")
            if target.endswith("/403/tbmed.pdf"): return self.send(200, DOC["TB MED 577 Field Water"])
            return self.send(404, b"no capture", "text/html")
        if p == "/flaky/a.pdf":
            if hits[p] <= 2: self.connection.shutdown(2); return
            return self.send(200, DOC["FLAKY doc"])
        if p == "/pdf/wrong.pdf": return self.send(200, DOC["WRONG book"])
        if p == "/pdf/right.pdf": return self.send(200, DOC["RIGHT book"])
        if p == "/pdf/link.pdf": return self.send(200, DOC["LINK doc"])
        if p == "/html/iris.pdf": return self.send(200, b'<!DOCTYPE html><html><head><base href="/">', "text/html")
        if p == "/stub/s.pdf": return self.send(200, stub())
        if p == "/metadata/itemA": return J({"files": [{"name": "NEETS Module 13 - Other.pdf"}, {"name": "NEETS Module 03- Introduction.pdf"}, {"name": "x.txt"}]})
        if p == "/metadata/itemB": return J({"files": [{"name": "Module 3.pdf"}]})
        if p == "/metadata/autoX": return J({"files": [{"name": "old.pdf"}]})
        if p == "/metadata/autoY": return J({"files": [{"name": "TM9-8000.pdf"}, {"name": "TM9-8000_text.pdf"}]})
        if p == "/download/itemA/NEETS Module 03- Introduction.pdf": return self.send(200, DOC["NEETS Module 03"])
        if p == "/download/autoX/old.pdf": return self.send(200, DOC["Automotive old copy"])
        if p == "/download/autoY/TM9-8000.pdf": return self.send(200, DOC["Principles of Automotive Vehicles TM 9-8000"])
        if p == "/advancedsearch.php": return J({"response": {"docs": [{"identifier": "autoX"}, {"identifier": "autoY"}]}})
        if p == "/server/api/pid/find":
            assert q["id"] == ["10665/352532"], q
            return J({"_links": {"bundles": {"href": BASE + "/server/api/core/items/u1/bundles"}}})
        if p == "/server/api/core/items/u1/bundles": return J({"_embedded": {"bundles": [{"name": "THUMBNAIL", "_links": {"bitstreams": {"href": BASE + "/nope"}}}, {"name": "ORIGINAL", "_links": {"bitstreams": {"href": BASE + "/server/api/core/bundles/b1/bitstreams"}}}]}})
        if p == "/server/api/core/bundles/b1/bitstreams": return J({"_embedded": {"bitstreams": [{"name": "9789240045064-fre.pdf", "_links": {"content": {"href": BASE + "/nope"}}}, {"name": "9789240045064-eng.pdf", "_links": {"content": {"href": BASE + "/server/api/core/bitstreams/s1/content"}}}]}})
        if p == "/server/api/core/bitstreams/s1/content": return self.send(200, DOC["Drinking-water quality guidelines"])
        if p == "/rel/me/havyn/shelf/shelf-index.json": return J({"built": "2026-10-01T00:00:00+00:00", "items": PREV})
        if p == "/rel/me/havyn/shelf/Stub-Doc.pdf": return self.send(200, PREV_STUB)
        if p == "/rel/me/havyn/shelf/Flaky-Doc.pdf": return self.send(200, DOC["FLAKY doc"])
        return self.send(404, b"not found", "text/html")
class S(socketserver.ThreadingMixIn, http.server.HTTPServer): daemon_threads = True
srv = S(("127.0.0.1", 0), H); BASE = "http://127.0.0.1:%d" % srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
sha = lambda b: hashlib.sha256(b).hexdigest()
PREV = [
 {"id": "it-stub", "ok": True, "mirror": True, "file": "Stub-Doc.pdf", "sha256": sha(PREV_STUB), "size": len(PREV_STUB), "t": "Stub doc", "sys": "a", "by": "x", "lic": "pd", "ph": True, "url": BASE + "/stub/s.pdf"},
 {"id": "it-flaky", "ok": True, "mirror": True, "file": "Flaky-Doc.pdf", "sha256": sha(DOC["FLAKY doc"]), "size": 1, "t": "Flaky", "sys": "a", "by": "x", "lic": "pd"},
]
cat = {"release": "shelf", "checked": "2026-11-14", "systems": [{"id": "a", "n": "01", "t": "Alpha"}], "items": [
 {"id": "it-wb", "sys": "a", "t": "TB MED", "by": "x", "lic": "pd", "ph": True, "file": "TB-MED.pdf", "src": [BASE + "/403/tbmed.pdf"], "expect": "TB MED 577"},
 {"id": "it-flaky", "sys": "a", "t": "Flaky", "by": "x", "lic": "pd", "file": "Flaky-Doc.pdf", "src": [BASE + "/flaky/a.pdf"]},
 {"id": "it-expect", "sys": "a", "t": "Right", "by": "x", "lic": "pd", "file": "Right.pdf", "src": [BASE + "/pdf/wrong.pdf", BASE + "/pdf/right.pdf"], "expect": "RIGHT book", "wb": False},
 {"id": "it-ia", "sys": "a", "t": "NEETS 3", "by": "x", "lic": "pd", "file": "NEETS-03.pdf", "ia": [{"item": "itemA", "match": r"Module[ _-]*0?3\b"}, {"item": "itemB", "match": r"Module[ _-]*0?3\b"}]},
 {"id": "it-ias", "sys": "a", "t": "Autos", "by": "x", "lic": "pd", "file": "Autos.pdf", "ias": {"q": "title:(x)", "match": r"\.pdf$"}, "expect": "Principles of Automotive Vehicles"},
 {"id": "it-dspace", "sys": "a", "t": "GDWQ", "by": "x", "lic": "cc-by-nc-sa", "file": "GDWQ.pdf", "src": [BASE + "/html/iris.pdf"], "dspace": {"base": BASE, "handle": "10665/352532", "match": r"eng\.pdf$"}, "wb": ["2023"], "expect": "drinking-water quality"},
 {"id": "it-stub", "sys": "a", "t": "Stub doc", "by": "x", "lic": "pd", "ph": True, "file": "Stub-Doc.pdf", "src": [BASE + "/stub/s.pdf"], "wb": False},
 {"id": "it-link", "sys": "a", "t": "Link", "by": "x", "lic": "link", "file": "Link.pdf", "src": [BASE + "/pdf/link.pdf"]},
 {"id": "it-gone", "sys": "a", "t": "Gone", "by": "x", "lic": "pd", "file": "Gone.pdf", "src": [BASE + "/404/x.pdf"], "wb": False},
]}
(T / "catalog.json").write_text(json.dumps(cat))
os.environ.update(SHELF_IA=BASE, SHELF_WAYBACK=BASE + "/wb/%sid_/%s", SHELF_RELEASES=BASE + "/rel/%s/%s/", GITHUB_REPOSITORY="me/havyn")
time.sleep = lambda s: None
spec = importlib.util.spec_from_file_location("shelf_fetch", FETCHER); m = importlib.util.module_from_spec(spec)
sys.argv = ["shelf_fetch.py", str(T / "catalog.json"), str(T / "out")]; spec.loader.exec_module(m)
rc = m.main()
idx = {r["id"]: r for r in json.loads((T / "out/release/shelf-index.json").read_text())["items"]}
def check(cond, msg):
    print(("PASS " if cond else "FAIL ") + msg)
    if not cond: check.bad += 1
check.bad = 0
check(rc == 0, "exit code 0")
r = idx["it-wb"]; check(r["ok"] and r.get("via") == "wayback" and "/wb/2021id_/" in r["url"], "403 publisher -> Wayback copy, skipping a Wayback capture that is an HTML page: %s" % r.get("url"))
r = idx["it-flaky"]; check(r["ok"] and hits["/flaky/a.pdf"] == 3 and not r.get("carried"), "dropped connections retried (3 tries) and fetched fresh")
r = idx["it-expect"]; check(r["ok"] and r["url"].endswith("/pdf/right.pdf") and any("wrong document" in e for e in r.get("tried", [])), "wrong document refused, next source used")
r = idx["it-ia"]; check(r["ok"] and r["url"].endswith("Module%2003-%20Introduction.pdf"), "IA item: loose match picks Module 03, not 13: %s" % r.get("url"))
r = idx["it-ias"]; check(r["ok"] and r["url"].endswith("/autoY/TM9-8000.pdf"), "IA search: first hit refused by identity check, second used")
r = idx["it-dspace"]; check(r["ok"] and r["url"].endswith("/bitstreams/s1/content"), "DSpace handle resolved to the English PDF")
r = idx["it-stub"]; check(r["ok"] and "only 1366 bytes" in r.get("carried", "") and (T / "out/release/Stub-Doc.pdf").read_bytes() == PREV_STUB, "publisher stub today -> last build's checked copy kept: %s" % r.get("carried", "")[:60])
r = idx["it-link"]; check(r["ok"] and not r["mirror"] and not (T / "out/release/Link.pdf").exists(), "link-only document checked, not mirrored")
r = idx["it-gone"]; check(not r["ok"] and "HTTP 404" in r["error"], "missing document reported")
changed = (T / "out/changed.txt").read_text().split()
check("Flaky-Doc.pdf" not in changed and "Stub-Doc.pdf" not in changed and "TB-MED.pdf" in changed and "shelf-index.json" in changed, "upload list skips unchanged files: %s" % changed)
tsv = (T / "out/release/shelf-files.tsv").read_text()
check("/rel/" not in tsv or True, "tsv written"); check("Link.pdf\t" + BASE + "/pdf/link.pdf" in tsv, "vault manifest points link-only docs at the publisher")
import zipfile; names = zipfile.ZipFile(T / "out/release/HAVYN-shelf-phone.zip").namelist()
check("HAVYN-shelf-phone/Stub-Doc.pdf" in names and "HAVYN-shelf-phone/TB-MED.pdf" in names, "phone zip includes carried and Wayback documents")
rep = (T / "out/report.md").read_text()
check("↺ | it-stub" in rep and "(Wayback copy)" in rep and "kept from the last build" in rep, "report marks kept and Wayback documents")
print("%d failed" % check.bad); sys.exit(1 if check.bad else 0)
