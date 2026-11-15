"""v1.3 end-to-end checks: offline archives (ZIM), PDF text search, video/audio, unified search, Get more, vault kit.
Headless Chrome at iPhone size. Usage: python3 tests/e2e_v13.py [zim-testing-suite/data]"""
import json, os, re, sys, threading, time, functools
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
FX = ROOT / "tests" / "fixtures"
DATA = Path(sys.argv[1] if len(sys.argv) > 1 else "/home/claude/openzim/zim-testing-suite/data")
SHOTS = ROOT / "tests" / "shots"; SHOTS.mkdir(parents=True, exist_ok=True)
PORT = 8766; BASE = f"http://localhost:{PORT}/"
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

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = ThreadingHTTPServer(("127.0.0.1", PORT), functools.partial(Quiet, directory=str(ROOT / "app")))
threading.Thread(target=srv.serve_forever, daemon=True).start()
UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1"
INIT = "if (window.top === window) { window.__vall = []; document.addEventListener('securitypolicyviolation', e => window.__vall.push(e.violatedDirective + ' ' + e.blockedURI)); }"

FILES = [FX / "havyn-test.zim", DATA / "nons" / "wikipedia_en_climate_change_mini_2024-06.zim", DATA / "withns" / "small.zim",
         DATA / "withns" / "wikibooks_be_all_nopic_2017-02_splitted.zimaa", DATA / "withns" / "wikibooks_be_all_nopic_2017-02_splitted.zimab",
         DATA / "withns" / "wikibooks_be_all_nopic_2017-02_splitted.zimac", FX / "havyn-test.pdf", FX / "clip.mp4", FX / "tone.m4a"]
FRAME = "document.querySelector('#zframe')"
def fdoc(page, expr):
    return page.evaluate("(() => { const d = " + FRAME + ".contentDocument; return " + expr + "; })()")
def frame_title(page):
    try: return page.evaluate("(() => { const f = " + FRAME + "; return f && f.classList.contains('ready') ? f.contentDocument.title : ''; })()")
    except Exception: return ""
def wait_title(page, t, timeout=15):
    return until(lambda: frame_title(page) == t, timeout)
def click_in_frame(page, sel):
    page.frame_locator("#zframe").locator(sel).click()
def lib(page): return page.evaluate("__HAVYN.lib.map(x => ({id: x.id, type: x.type || 'pdf', name: x.name, uuid: x.uuid || '', indexed: !!x.indexed, fromZim: x.fromZim || ''}))")
def zim_id(page, name): return next(x["id"] for x in lib(page) if x["type"] == "zim" and x["name"] == name)

def import_all(page, tag):
    page.goto(BASE + "#/library"); page.wait_for_selector("#libfile", state="attached")
    page.set_input_files("#libfile", [str(f) for f in FILES])
    got = until(lambda: len(lib(page)) >= 7 and not page.is_visible("#libbar"), 60)
    L = lib(page); types = {}
    for x in L: types[x["type"]] = types.get(x["type"], 0) + 1
    ok(f"[{tag}] one Add files button imports archives, a split archive, a PDF, video and audio", types == {"zim": 4, "pdf": 1, "video": 1, "audio": 1}, types)
    return L

def reader_checks(page, tag):
    zid = zim_id(page, "HAVYN Test Library")
    page.goto(BASE + "#/library/" + zid); page.wait_for_selector("#zq")
    page.fill("#zq", "wat")
    ok(f"[{tag}] title search as you type", until(lambda: "Water purification" in page.inner_text("#zres"), 10), page.inner_text("#zres"))
    page.click("#zres a.li >> nth=0")
    ok(f"[{tag}] article opens in the reader", wait_title(page, "Water purification"), frame_title(page))
    ok(f"[{tag}] article image loads", until(lambda: fdoc(page, "d.getElementById('drop2').naturalWidth") > 0, 10))
    bg = fdoc(page, "getComputedStyle(d.querySelector('.bg')).backgroundImage")
    ok(f"[{tag}] archive CSS applies, including url() images", "drop.png" in bg or "blob:" in bg, bg)
    click_in_frame(page, "#l-home")
    ok(f"[{tag}] link inside the archive navigates", wait_title(page, "HAVYN Test Library"), frame_title(page))
    time.sleep(0.3)
    ok(f"[{tag}] archive scripts never run (inline script and onerror)", frame_title(page) == "HAVYN Test Library" and fdoc(page, "d.title") not in ("HACKED", "PWNED"), fdoc(page, "d.title"))
    click_in_frame(page, "#l-deep")
    ok(f"[{tag}] page in a subfolder opens", wait_title(page, "Deep page"))
    ok(f"[{tag}] ../ relative image resolves", until(lambda: fdoc(page, "d.getElementById('drop3').naturalWidth") > 0, 10))
    click_in_frame(page, "#l-up"); wait_title(page, "Water purification")
    page.click("[data-act=zr-back]")
    ok(f"[{tag}] reader Back returns to the previous page", wait_title(page, "Deep page"), frame_title(page))
    page.click("[data-act=zr-back]"); t1 = wait_title(page, "HAVYN Test Library")
    page.click("[data-act=zr-back]"); t2 = wait_title(page, "Water purification")
    ok(f"[{tag}] Back walks the whole trail (deep → home → water)", t1 and t2, frame_title(page))
    click_in_frame(page, "#l-home"); wait_title(page, "HAVYN Test Library")
    click_in_frame(page, "#l-redir")
    ok(f"[{tag}] redirect entry lands on its target", wait_title(page, "Water purification"))
    page.click("[data-act=zr-back]"); wait_title(page, "HAVYN Test Library")
    click_in_frame(page, "#l-frag"); time.sleep(0.4)
    ok(f"[{tag}] in-page anchor scrolls, stays on the page", frame_title(page) == "HAVYN Test Library" and page.evaluate(FRAME + ".contentWindow.scrollY") > 1000, page.evaluate(FRAME + ".contentWindow.scrollY"))
    click_in_frame(page, "#l-ext"); time.sleep(0.5)
    ok(f"[{tag}] outside link doesn't hijack the reader", frame_title(page) == "HAVYN Test Library")
    for p in page.context.pages[1:]: p.close()
    page.click("[data-act=zr-size]"); time.sleep(0.2)
    ok(f"[{tag}] text size control restyles the page", "zoom:1.15" in fdoc(page, "d.getElementById('havyn-zr').textContent"))
    page.click("[data-act=zr-size]"); page.click("[data-act=zr-size]"); page.click("[data-act=zr-size]"); page.click("[data-act=zr-size]")
    dark1 = "invert" in fdoc(page, "d.getElementById('havyn-zr').textContent")
    page.click("[data-act=zr-dark]"); time.sleep(0.2)
    dark2 = "invert" in fdoc(page, "d.getElementById('havyn-zr').textContent")
    ok(f"[{tag}] dark pages on by default, toggles off", dark1 and not dark2, (dark1, dark2))
    page.click("[data-act=zr-dark]")
    page.screenshot(path=str(SHOTS / f"v13_{tag}_reader.png"))
    click_in_frame(page, "#l-video")
    wait_title(page, "Video lesson")
    ok(f"[{tag}] archive video gets native controls", fdoc(page, "d.getElementById('vid').hasAttribute('controls')"))
    page.evaluate("(() => { const v = " + FRAME + ".contentDocument.getElementById('vid'); v.preload = 'auto'; v.load(); })()")
    dur = until(lambda: page.evaluate("(() => { const v = " + FRAME + ".contentDocument.getElementById('vid'); return isFinite(v.duration) && v.duration > 2.5 && v.readyState >= 1; })()"), 15)
    ok(f"[{tag}] archive video plays from the archive (byte ranges)", dur, page.evaluate(FRAME + ".contentDocument.getElementById('vid').duration"))
    page.click("[data-act=zr-back]"); wait_title(page, "HAVYN Test Library")
    n0 = len([x for x in lib(page) if x["type"] == "pdf"])
    click_in_frame(page, "#l-pdf")
    ok(f"[{tag}] PDF inside an archive opens in HAVYN's PDF reader", until(lambda: page.query_selector(".pg canvas"), 20) is not None)
    ok(f"[{tag}] ...and is kept in the library once", len([x for x in lib(page) if x["type"] == "pdf"]) == n0 + 1 and any(x["fromZim"] for x in lib(page)))
    page.goto(BASE + "#/library/" + zid); page.wait_for_selector("[data-act=zim-random]")
    page.click("[data-act=zim-random]")
    ok(f"[{tag}] Random opens an article", until(lambda: frame_title(page) in ("Water purification", "Deep page", "Video lesson", "HAVYN Test Library"), 15), frame_title(page))
    # real Wikipedia (zstd, new layout), old layout XZ archive, split archive
    cid = zim_id(page, next(x["name"] for x in lib(page) if x["type"] == "zim" and "limate" in x["name"]))
    page.goto(BASE + "#/library/" + cid); page.wait_for_selector("#zq"); page.fill("#zq", "Climate")
    ok(f"[{tag}] Wikipedia archive: search finds many titles", until(lambda: page.locator("#zres a.li").count() >= 10, 15), page.locator("#zres a.li").count())
    page.click("text=Main page")
    ok(f"[{tag}] Wikipedia main page renders with its images (WebP)", until(lambda: frame_title(page) and fdoc(page, "Array.from(d.images).filter(i => i.naturalWidth > 0).length") > 10, 25), frame_title(page))
    page.screenshot(path=str(SHOTS / f"v13_{tag}_wikipedia.png"))
    sid = next(x["id"] for x in lib(page) if x["type"] == "zim" and "Test ZIM file" in x["name"])
    page.goto(BASE + "#/library/" + sid + "/read?p=")
    ok(f"[{tag}] old-layout XZ archive opens its main page", until(lambda: frame_title(page) != "", 15), frame_title(page))
    bid = next(x["id"] for x in lib(page) if x["type"] == "zim" and x["id"] not in (zid, cid, sid))
    page.goto(BASE + "#/library/" + bid + "/read?p=")
    ok(f"[{tag}] split archive (.zimaa/.zimab/.zimac) opens", until(lambda: frame_title(page) != "", 15), frame_title(page))

with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/usr/bin/google-chrome", headless=True, args=["--no-sandbox", "--autoplay-policy=no-user-gesture-required"])
    def mkctx(**kw): 
        c = br.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True, user_agent=UA, accept_downloads=True, **kw)
        c.add_init_script(INIT); return c
    # ---------------- A: installed app (service worker) ----------------
    ctx = mkctx(); page = ctx.new_page()
    errors = []; page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(BASE); page.wait_for_selector("body[data-ready]")
    page.evaluate("navigator.serviceWorker.ready.then(() => true)"); page.reload(); page.wait_for_selector("body[data-ready]")
    ok("[sw] service worker controls the page", page.evaluate("!!navigator.serviceWorker.controller"))
    L = import_all(page, "sw")
    page.set_input_files("#libfile", str(FX / "havyn-test.zim")); time.sleep(1.5)
    ok("[sw] the same archive twice is refused", len([x for x in lib(page) if x["type"] == "zim"]) == 4)
    page.goto(BASE + "#/library"); page.wait_for_selector("a.li[href^='#/library/']")
    page.screenshot(path=str(SHOTS / "v13_library.png"), full_page=True)
    ok("[sw] library groups archives, documents, video, audio", all(s in page.inner_text("#app").upper() for s in ("ENCYCLOPEDIAS AND ARCHIVES", "DOCUMENTS", "VIDEO", "AUDIO")))
    reader_checks(page, "sw")
    # media
    vid = next(x["id"] for x in lib(page) if x["type"] == "video")
    page.goto(BASE + "#/library/" + vid); page.wait_for_selector("#mplayer")
    ok("[sw] video plays in the player", until(lambda: page.evaluate("(() => { const v = document.getElementById('mplayer'); return isFinite(v.duration) && v.duration > 2.5; })()"), 15), page.evaluate("document.getElementById('mplayer').duration"))
    page.click("[data-act=m-skip][data-s='30']")
    aud = next(x["id"] for x in lib(page) if x["type"] == "audio")
    page.goto(BASE + "#/library/" + aud); page.wait_for_selector("#mplayer")
    ok("[sw] audio plays in the player", until(lambda: page.evaluate("(() => { const v = document.getElementById('mplayer'); return isFinite(v.duration) && v.duration > 3; })()"), 15))
    # unified search (PDF text indexing runs in the background)
    ok("[sw] PDF text is indexed in the background", until(lambda: any(x["indexed"] for x in lib(page) if x["type"] == "pdf"), 30))
    page.goto(BASE + "#/search?q=water"); page.wait_for_selector("#sres .sec")
    ok("[sw] search finds HAVYN content (cards, playbooks, plan)", until(lambda: page.locator("#sres a.li.hit[href^='#/playbooks/'], #sres a.li.hit[href^='#/emergency/']").count() > 0, 10))
    ok("[sw] search finds words inside PDFs", until(lambda: "INSIDE YOUR PDFS" in page.inner_text("#sres").upper() and page.locator("#spdf a.li").count() > 0, 15), page.inner_text("#spdf")[:200])
    ok("[sw] search finds archive titles", until(lambda: "Water purification" in page.inner_text("#sres"), 15))
    page.screenshot(path=str(SHOTS / "v13_search.png"), full_page=True)
    page.fill("#sq", "CPR"); ok("[sw] search updates as you type", until(lambda: page.locator("#sres a.li.hit[href='#/emergency/cpr']").count() == 1, 10))
    page.click("#spdf a.li >> nth=0") if page.locator("#spdf a.li").count() else None
    # get more
    page.goto(BASE + "#/archive"); page.wait_for_selector(".glist")
    ok("[sw] Get more lists the phone set with sizes", page.locator(".gi").count() >= 10 and "WikiMed" in page.inner_text(".glist"))
    page.screenshot(path=str(SHOTS / "v13_get_phone.png"), full_page=True)
    page.check("input[data-chk='archive|p-water']"); time.sleep(0.3); page.reload(); page.wait_for_selector(".glist")
    ok("[sw] a Downloaded mark persists", page.is_checked("input[data-chk='archive|p-water']"))
    page.goto(BASE + "#/archive?t=drive"); page.wait_for_selector("code.cmd")
    ok("[sw] drive tab shows the one-line commands", "get-vault.sh" in page.inner_text("code.cmd >> nth=0") and "get-vault.ps1" in page.inner_text("code.cmd >> nth=1"))
    page.screenshot(path=str(SHOTS / "v13_get_drive.png"), full_page=True)
    with page.expect_download() as dl: page.click("a[href='./vault/get-vault.sh']")
    d = dl.value; path = d.path(); txt = open(path).read()
    ok("[sw] Mac script downloads from the app", txt.startswith("#!/bin/bash") and "MANIFEST" in txt)
    page.goto(BASE + "#/archive?t=hub"); page.wait_for_selector("form[data-form=hub]")
    page.fill("[name=hub]", "javascript:alert(1)"); page.click("form[data-form=hub] button[type=submit]"); time.sleep(0.3)
    ok("[sw] home library refuses a non-web address", not page.evaluate("__HAVYN.state.plan.hub"))
    page.fill("[name=hub]", "http://192.168.1.20:8080"); page.click("form[data-form=hub] button[type=submit]"); time.sleep(0.3)
    ok("[sw] home library address saved, Open it appears", page.locator("a[href='http://192.168.1.20:8080']").count() >= 1)
    page.goto(BASE + "#/library"); page.wait_for_selector("#libfile", state="attached")
    ok("[sw] library shows the home library button", page.locator("a[href='http://192.168.1.20:8080']").count() == 1)
    # offline: everything from the phone
    ctx.set_offline(True); page.reload(); page.wait_for_selector("body[data-ready]")
    zid = zim_id(page, "HAVYN Test Library")
    page.goto(BASE + "#/library/" + zid + "/read?p=Water_purification")
    ok("[sw] OFFLINE: archive page opens", wait_title(page, "Water purification", 20), frame_title(page))
    ok("[sw] OFFLINE: archive image loads", until(lambda: fdoc(page, "d.getElementById('drop2').naturalWidth") > 0, 10))
    page.goto(BASE + "#/search?q=deep"); page.wait_for_selector("#sres")
    ok("[sw] OFFLINE: search across archives", until(lambda: "Deep page" in page.inner_text("#sres"), 15))
    ctx.set_offline(False)
    # delete an archive
    page.goto(BASE + "#/library/" + zid); page.wait_for_selector("[data-act=lib-del]")
    page.click("[data-act=lib-del]"); page.click("[data-act=lib-del]"); time.sleep(0.6)
    gone = page.evaluate("(async () => await new Promise(r => { const q = indexedDB.open('havyn-field'); q.onsuccess = () => { const t = q.result.transaction('kv').objectStore('kv').get('zim:" + zid + "'); t.onsuccess = () => r(t.result === undefined); }; }))()")
    ok("[sw] delete removes the archive and its file", gone and not any(x["id"] == zid for x in lib(page)))
    vio = page.evaluate("window.__vall || []")
    ok("[sw] zero CSP violations in HAVYN itself", len(vio) == 0, vio[:5])
    ok("[sw] no page errors", len(errors) == 0, errors[:3])
    ctx.close()
    # ---------------- B: no service worker (preview / first launch): rebuilt pages ----------------
    ctx = mkctx(service_workers="block"); page = ctx.new_page(); errors = []; page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(BASE); page.wait_for_selector("body[data-ready]")
    ok("[fallback] no service worker", not page.evaluate("!!navigator.serviceWorker && !!navigator.serviceWorker.controller"))
    import_all(page, "fallback")
    reader_checks(page, "fallback")
    vio = page.evaluate("window.__vall || []")
    ok("[fallback] zero CSP violations in HAVYN itself", len(vio) == 0, vio[:5])
    ok("[fallback] no page errors", len(errors) == 0, errors[:3])
    ctx.close(); br.close()

srv.shutdown()
passed = sum(1 for r in results if r[1]); print(f"\n{passed}/{len(results)} passed")
(ROOT / "tests" / "e2e_v13_results.json").write_text(json.dumps([{"name": n, "pass": c, "detail": d} for n, c, d in results], indent=1))
sys.exit(0 if passed == len(results) else 1)
