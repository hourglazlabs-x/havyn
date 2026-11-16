"""Updates end-to-end: the installed app stays attached to the live site. Simulates three deploys against a copy of the
built app: a manual "Check now" in System (offers Restart, never restarts by itself away from Home), an update that
arrives while an emergency card is open (never interrupts it), and a background check on an idle Home screen (restarts
by itself into the new version). Usage: python3 tests/e2e_update.py"""
import functools, json, re, shutil, sys, tempfile, threading, time
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SITE = Path(tempfile.mkdtemp(prefix="havyn-upd-")) / "app"
shutil.copytree(ROOT / "app", SITE)
results = []
def ok(name, cond, detail=""):
    results.append((name, bool(cond), str(detail))); print(("PASS " if cond else "FAIL ") + name + (" — " + str(detail) if detail else ""))
def until(fn, timeout=30, step=0.25):
    end = time.time() + timeout
    while time.time() < end:
        try:
            v = fn()
            if v: return v
        except Exception: pass
        time.sleep(step)
    return None
def deploy(ver):  # what a push to main does, as far as a phone can tell: a new service worker version
    sw = SITE / "sw.js"; t = sw.read_text(encoding="utf-8")
    sw.write_text(re.sub(r'const VERSION = "[^"]*";', 'const VERSION = "%s";' % ver, t, count=1), encoding="utf-8")

class Q(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
PORT = 8794
srv = ThreadingHTTPServer(("127.0.0.1", PORT), functools.partial(Q, directory=str(SITE)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d/" % PORT

with sync_playwright() as p:
    br = p.chromium.launch()
    ctx = br.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    ctx.add_init_script("window.__HAVYN_NO_INTRO = true;")
    pg = ctx.new_page(); errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    ev = pg.evaluate
    caches = lambda: ev("async () => (await caches.keys()).filter((k) => k.startsWith('havyn-field-'))")
    pg.goto(BASE + "#/status"); pg.wait_for_selector(".strip")
    ok("First open: saved for offline, no restart offered", until(lambda: ev("!!navigator.serviceWorker.controller")) and not ev("window.__HAVYN.upd.ready"))

    # 1) a deploy, found with Check now in System
    deploy("9.9.1+test")
    ev("location.hash = '#/system'"); pg.wait_for_selector('[data-act="upd-check"]')
    pg.click('[data-act="upd-check"]')
    ok("Check now finds the new version and offers Restart", until(lambda: ev("window.__HAVYN.upd.ready")) and until(lambda: pg.locator('[data-act="upd-restart"]').count() > 0, 5))
    ok("…without restarting by itself away from Home", ev("location.hash") == "#/system")
    ev("location.hash = '#/status'")
    ok("Home shows Update ready", until(lambda: pg.locator(".updbar").count() == 1, 5))
    pg.click(".updbar"); pg.wait_for_selector(".strip")
    ok("Restart opens the new version", until(lambda: "havyn-field-9.9.1+test" in caches()) and not ev("window.__HAVYN.upd.ready"), caches())

    # 2) a deploy that lands while a card is open
    ev("location.hash = '#/emergency/cpr'"); pg.wait_for_selector(".emstep")
    ev("window.__mark = 1"); deploy("9.9.2+test")
    ev("() => { window.__HAVYN.upd.last = 0; window.__HAVYN.upd.check(false); }")
    ok("An update during an emergency card never restarts it", until(lambda: ev("window.__HAVYN.upd.ready")) and ev("window.__mark") == 1 and ev("location.hash") == "#/emergency/cpr")

    # 3) a deploy found in the background on an idle Home screen
    pg.reload(); pg.wait_for_selector("#app"); ev("location.hash = '#/status'"); pg.wait_for_selector(".strip")
    ev("window.__mark = 2"); deploy("9.9.3+test")
    ev("() => { window.__HAVYN.upd.last = 0; window.__HAVYN.upd.check(false); }")
    ok("On an idle Home screen it restarts into the new version by itself", until(lambda: ev("window.__mark === undefined && !!document.querySelector('.strip')")) and until(lambda: "havyn-field-9.9.3+test" in caches()), caches())
    ok("Old versions are cleaned up", until(lambda: caches() == ["havyn-field-9.9.3+test"], 10), caches())
    ok("No errors on the page", not errors, errors[:3])
    br.close()

srv.shutdown()
shutil.rmtree(SITE.parent, ignore_errors=True)
(ROOT / "tests" / "e2e_update_results.json").write_text(json.dumps([{"name": n, "pass": c, "detail": d} for n, c, d in results], indent=1))
bad = [r for r in results if not r[1]]
print("\n%d passed, %d failed" % (len(results) - len(bad), len(bad)))
sys.exit(1 if bad else 0)
