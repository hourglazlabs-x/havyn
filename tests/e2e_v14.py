"""v1.4 end-to-end checks: the reference shelf (Get more › Shelf), one-tap downloads from HAVYN's own address with
size and SHA-256 checks, Hesperian chapter joining, search inside shelf documents, offline and no-shelf fallbacks,
and the built-in dictionary setup. Headless Chrome at iPhone size, with the service worker and the deploy CSP.
Usage: python3 tests/e2e_v14.py"""
import hashlib, json, shutil, sys, tempfile, threading, time, functools
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SHOTS = ROOT / "tests" / "shots"; SHOTS.mkdir(parents=True, exist_ok=True)
C = json.loads(__import__("subprocess").run(["node", "-e", "process.stdout.write(JSON.stringify(require(process.argv[1]).shelf))", str(ROOT / "src" / "content.js")], check=True, capture_output=True, text=True).stdout)
results = []
def ok(name, cond, detail=""):
    results.append((name, bool(cond), str(detail))); print(("PASS " if cond else "FAIL ") + name + (" — " + str(detail) if detail else ""))
def until(fn, timeout=20, step=0.2):
    end = time.time() + timeout
    while time.time() < end:
        try:
            v = fn()
            if v: return v
        except Exception: pass
        time.sleep(step)
    return None

def pdf(lines, pages=1):
    """A small valid PDF whose text pdf.js can extract."""
    objs, kids = [], []
    font = 3
    objs.append(b"<< /Type /Catalog /Pages 2 0 R >>")
    objs.append(None)  # pages, filled below
    objs.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    for p in range(pages):
        text = "BT /F1 14 Tf 40 760 Td 18 TL " + " ".join("(%s) '" % l.replace("(", "").replace(")", "") for l in lines + ["Page %d" % (p + 1)]) + " ET"
        stream = text.encode("latin-1")
        objs.append(b"<< /Length %d >>\nstream\n" % len(stream) + stream + b"\nendstream")
        cid = len(objs)
        objs.append(b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents %d 0 R >>" % cid)
        kids.append(len(objs))
    objs[1] = b"<< /Type /Pages /Kids [" + b" ".join(b"%d 0 R" % k for k in kids) + b"] /Count %d >>" % len(kids)
    out = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"); offs = []
    for i, o in enumerate(objs, 1):
        offs.append(len(out)); out += b"%d 0 obj\n" % i + o + b"\nendobj\n"
    x = len(out)
    out += b"xref\n0 %d\n0000000000 65535 f \n" % (len(objs) + 1) + b"".join(b"%010d 00000 n \n" % o for o in offs)
    out += b"trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n" % (len(objs) + 1, x)
    return bytes(out)

# A copy of the deploy build with a test shelf: three phone documents, one with a wrong checksum.
tmp = Path(tempfile.mkdtemp(prefix="havyn-e2e14-"))
site = tmp / "site"; shutil.copytree(ROOT / "app", site)
bare = tmp / "bare"; shutil.copytree(ROOT / "app", bare)  # no shelf files at all
(site / "shelf").mkdir(exist_ok=True)
items = {it["id"]: it for it in C["items"]}
docs = {"sh-epawater": ["Emergency disinfection of drinking water", "Add unscented chlorine bleach and wait 30 minutes"],
        "sh-cpscgen": ["Portable generator hazards", "Never run a generator in a garage"],
        "sh-nifog": ["National interoperability channels", "Calling channel listing for responders"],
        "sh-erg": ["Emergency Response Guidebook", "Placard number lookup"]}
index = []
for k, lines in docs.items():
    b = pdf(lines, pages=2)
    (site / "shelf" / items[k]["file"]).write_bytes(b)
    index.append({"id": k, "file": items[k]["file"], "size": len(b), "sha256": hashlib.sha256(b).hexdigest(), "pages": 2})
index[-1]["sha256"] = "0" * 64   # sh-erg: corrupted on the server, must be refused
(site / "shelf" / "index.json").write_text(json.dumps({"built": "2026-11-15T03:00:00+00:00", "items": index}))
chap = tmp / "chapters"; chap.mkdir()
for s, words in (("fm", "Front matter"), ("01", "Chapter one: home remedies"), ("02", "Chapter two: sicknesses misunderstood"), ("bm", "Back matter: patient report")):
    (chap / ("en_wtnd_2025_%s.pdf" % s)).write_bytes(pdf([words], pages=1 if s in ("fm", "bm") else 2))

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
servers = []
def serve(d, port):
    s = ThreadingHTTPServer(("127.0.0.1", port), functools.partial(Quiet, directory=str(d))); servers.append(s)
    threading.Thread(target=s.serve_forever, daemon=True).start(); return "http://localhost:%d/" % port
BASE = serve(site, 8771); BARE = serve(bare, 8772)
UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1"
INIT = "if (window.top === window) { window.__vall = []; document.addEventListener('securitypolicyviolation', e => window.__vall.push(e.violatedDirective + ' ' + e.blockedURI)); }"
def lib(page): return page.evaluate("__HAVYN.lib.map(x => ({id: x.id, type: x.type || 'pdf', name: x.name, shelf: x.shelf || '', pages: x.pages || 0, indexed: !!x.indexed, size: x.size}))")

with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/usr/bin/google-chrome", headless=True, args=["--no-sandbox"])
    def mkctx():
        c = br.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True, user_agent=UA, accept_downloads=True)
        c.add_init_script(INIT); return c
    ctx = mkctx(); page = ctx.new_page(); errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(BASE); page.wait_for_selector("body[data-ready]")
    page.evaluate("navigator.serviceWorker.ready.then(() => true)"); page.reload(); page.wait_for_selector("body[data-ready]")
    ok("service worker controls the page", page.evaluate("!!navigator.serviceWorker.controller"))
    page.goto(BASE + "#/archive"); page.wait_for_selector("#shelf", state="attached")
    ok("Get more opens on the reference shelf", "REFERENCE SHELF" in page.inner_text("#app").upper() and page.locator(".seg a.on").inner_text().strip().upper() == "SHELF")
    ok("every system is listed with its documents", all(page.locator("#shs-" + s["id"]).count() == 1 for s in C["systems"]), [s["id"] for s in C["systems"] if page.locator("#shs-" + s["id"]).count() != 1])
    ok("every shelf document has a row", page.locator(".gi[id^='sh-']").count() == len(C["items"]), page.locator(".gi[id^='sh-']").count())
    ok("served files show their real size and pages", until(lambda: "2 PAGES" in page.inner_text("#sh-sh-epawater").upper()), page.inner_text("#sh-sh-epawater")[:200])
    ok("phone set button counts the files served here", until(lambda: "Get the phone set · 4" in page.inner_text("#app")), page.inner_text(".hero")[:300])
    ok("licenses are labeled", "PUBLIC DOMAIN" in page.inner_text("#sh-sh-epawater").upper() and "PUBLISHER'S TERMS" in page.inner_text("#sh-sh-wtnd").upper())
    ok("publisher-terms documents link to the publisher, never a Get button", page.locator("#sh-sh-msf a[href^='https://medicalguidelines.msf.org']").count() >= 1 and page.locator("#sh-sh-msf button[data-act='shelf-get']").count() == 0)
    ok("Hesperian books point to Hesperian and explain joining", page.locator("#sh-sh-wtnd a[href^='https://en.hesperian.org']").count() == 1 and "joins them into one book" in page.inner_text("#sh-sh-wtnd"))
    page.screenshot(path=str(SHOTS / "v14_shelf.png"), full_page=False)
    # one tap
    page.click("#sh-sh-epawater button[data-act='shelf-get']")
    ok("one tap downloads a document onto the phone", until(lambda: any(x["shelf"] == "sh-epawater" for x in lib(page)), 15), lib(page))
    x = next((x for x in lib(page) if x["shelf"] == "sh-epawater"), {})
    ok("it is saved under its real title", x.get("name") == items["sh-epawater"]["t"], x.get("name"))
    ok("its row now says On this phone", until(lambda: "On this phone" in page.inner_text("#sh-sh-epawater"), 10))
    # the rest of the phone set; one file is corrupted on the server
    page.click("button[data-act='shelf-get-phone']")
    ok("the phone set downloads the rest", until(lambda: sum(1 for x in lib(page) if x["shelf"]) == 3, 20), [x["shelf"] for x in lib(page)])
    ok("a file with the wrong checksum is refused and reported", until(lambda: "didn't match" in page.inner_text("#shmsg"), 10) and not any(x["shelf"] == "sh-erg" for x in lib(page)), page.inner_text("#shmsg"))
    ok("the count updates", "3/" + str(len(C["items"])) in page.inner_text(".hero"), page.inner_text(".hero")[:120])
    ok("no Content-Security-Policy violations", page.evaluate("window.__vall.length") == 0, page.evaluate("window.__vall"))
    page.screenshot(path=str(SHOTS / "v14_shelf_got.png"), full_page=False)
    # search reads inside shelf documents
    until(lambda: all(x["indexed"] for x in lib(page) if x["shelf"]), 30)
    page.goto(BASE + "#/search?q=bleach"); page.wait_for_selector("#sres .sec")
    ok("search finds words inside shelf documents", until(lambda: "Emergency Disinfection" in page.inner_text("#spdf"), 15), page.inner_text("#sres")[:300])
    page.fill("#sq", "canning")
    ok("search lists shelf documents that aren't downloaded yet", until(lambda: "USDA Complete Guide to Home Canning" in page.inner_text("#sres"), 10))
    # Hesperian chapters join into one book
    page.goto(BASE + "#/library"); page.wait_for_selector("#libfile", state="attached")
    files = sorted(str(f) for f in chap.iterdir())
    page.set_input_files("#libfile", files)
    ok("Hesperian chapters added together become one book", until(lambda: any(x["shelf"] == "sh-wtnd" for x in lib(page)), 20), [x["name"] for x in lib(page)])
    w = next((x for x in lib(page) if x["shelf"] == "sh-wtnd"), {})
    ok("the book is titled and complete", w.get("name") == "Where There Is No Doctor (2025)" and sum(1 for x in lib(page) if x["name"].startswith("en_wtnd")) == 0, w)
    page.goto(BASE + "#/library/" + w.get("id", "")); page.wait_for_selector(".pg", timeout=15000)
    ok("the joined book opens with every page", until(lambda: page.locator(".pg").count() == 6, 15), page.locator(".pg").count())
    page.goto(BASE + "#/archive?t=shelf")
    ok("its shelf row shows it on this phone", until(lambda: "On this phone" in page.inner_text("#sh-sh-wtnd"), 10))
    page.goto(BASE + "#/library"); page.wait_for_selector("#libfile", state="attached")
    n0 = len(lib(page)); page.set_input_files("#libfile", [str(site / "shelf" / items["sh-cpscgen"]["file"])]); time.sleep(1.5)
    ok("adding a shelf document that's already here is refused", len(lib(page)) == n0, len(lib(page)))
    ok("Library links to the reference shelf", page.locator("a.li[href='#/archive?t=shelf']").count() == 1)
    # built-in dictionary and translation
    page.goto(BASE + "#/archive?t=apps"); page.wait_for_selector("#gi-a-dict")
    ok("Apps explains the built-in offline dictionary and translator", "Settings → General → Dictionary" in page.inner_text("#gi-a-dict") and page.locator("#gi-a-dict a.btn").count() == 0)
    # offline: the shelf says so instead of blaming the address
    page.evaluate("location.hash = '#/status'"); time.sleep(0.3)
    ctx.set_offline(True)
    page.evaluate("location.reload()"); page.wait_for_selector("body[data-ready]"); time.sleep(0.5)
    page.evaluate("location.hash = '#/archive?t=shelf'")
    ok("OFFLINE: the shelf says it needs Wi-Fi", until(lambda: "No internet right now" in page.inner_text("#app"), 10), page.inner_text(".hero")[:300])
    ok("OFFLINE: documents already here still open", page.locator("#sh-sh-epawater a[href^='#/library/']").count() == 1)
    ctx.set_offline(False)
    ok("no page errors", not errors, errors)
    ctx.close()

    # an address without shelf files (Pages not deployed yet): the zip and publisher links
    ctx = mkctx(); page = ctx.new_page(); errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(BARE + "#/archive"); page.wait_for_selector("#shelf", state="attached")
    ok("NO SHELF: offers the phone set as one zip from the release", until(lambda: page.locator("a[href$='/releases/download/shelf/HAVYN-shelf-phone.zip']").count() == 1, 10), page.inner_text(".hero")[:300])
    ok("NO SHELF: each document links to its publisher", page.locator("#sh-sh-nifog a[href^='https://www.cisa.gov']").count() >= 1 and page.locator("button[data-act='shelf-get']").count() == 0)
    page.screenshot(path=str(SHOTS / "v14_shelf_bare.png"), full_page=False)
    ok("NO SHELF: no page errors", not errors, errors)
    ctx.close(); br.close()

for s in servers: s.shutdown()
shutil.rmtree(tmp, ignore_errors=True)
passed = sum(1 for r in results if r[1])
print("\n%d/%d passed" % (passed, len(results)))
(ROOT / "tests" / "e2e_v14_results.json").write_text(json.dumps([{"name": n, "pass": p, "detail": d} for n, p, d in results], indent=1))
sys.exit(0 if passed == len(results) else 1)
