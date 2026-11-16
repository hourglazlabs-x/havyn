"""v1.5 end-to-end checks: "Download everything" puts the shelf and the core archives on the phone. Archives come from a
fake Kiwix mirror on another origin (CORS like Kiwix's real mirror): stored in parts, checked against SHA-256 as they
arrive, resumed with Range after a dropped connection and after the app is closed, refused when the checksum is wrong,
and readable afterwards through the service worker. Headless Chrome at iPhone size, deploy CSP (with the test mirror
in place of Kiwix's). Usage: python3 tests/e2e_v15.py"""
import functools, hashlib, json, re, shutil, sys, tempfile, threading, time
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler, BaseHTTPRequestHandler
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tests")); import mkzim
SHOTS = ROOT / "tests" / "shots"; SHOTS.mkdir(parents=True, exist_ok=True)
CONTENT = json.loads(__import__("subprocess").run(["node", "-e", "const C=require(process.argv[1]); process.stdout.write(JSON.stringify({shelf: C.shelf, archive: C.archive}))", str(ROOT / "src" / "content.js")], check=True, capture_output=True, text=True).stdout)
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

tmp = Path(tempfile.mkdtemp(prefix="havyn-e2e15-"))
MPORT, SPORT = 8782, 8781
MIRROR = "http://127.0.0.1:%d" % MPORT
# One distinct small archive per core catalog item, named like Kiwix's files.
core = [i for i in CONTENT["archive"]["items"] if i["tier"] == "phone" and i.get("core") and i.get("get", {}).get("zim")]
zims, arch = {}, []
for n, it in enumerate(core):
    d, stem = it["get"]["zim"], it["get"]["stem"]; f = "%s_2026-10.zim" % stem; out = tmp / f
    mkzim.build(str(out), str(ROOT / "tests/fixtures/havyn-test.pdf"), str(ROOT / "tests/fixtures/clip.mp4"), name=stem.rsplit("_", 1)[0] if stem.endswith("_en") else stem, title="Test " + it["t"], uid="6a1b2c3d-4e5f-4a7b-8c9d-%012d" % (n + 1))
    data = out.read_bytes(); zims["/zim/%s/%s" % (d, f)] = data
    arch.append({"id": it["id"], "file": f, "url": MIRROR + "/zim/%s/%s" % (d, f), "size": len(data), "sha256": hashlib.sha256(data).hexdigest()})
BAD = core[1]["id"]   # served corrupted the first time: must be refused, then succeed on a retry
DROP = core[0]["id"]  # its first request is cut off half way: must carry on with a Range request
LISTED = core[2]["id"]  # left out of HAVYN's list: the app must look it up in the (fake) Kiwix directory itself
state = {"bad_served": 0, "drop_done": False, "ranges": [], "slow": None, "hits": {}}

class Mirror(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    def log_message(self, *a): pass
    def cors(self):
        self.send_header("Access-Control-Allow-Origin", "*"); self.send_header("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges")
    def do_OPTIONS(self):
        self.send_response(204); self.cors(); self.send_header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS"); self.send_header("Access-Control-Allow-Headers", "Range"); self.send_header("Content-Length", "0"); self.end_headers()
    def do_GET(self):
        path = self.path.split("?")[0]; state["hits"][path] = state["hits"].get(path, 0) + 1
        if path.startswith("/list/zim/"):
            d = path[len("/list/zim/"):].strip("/")
            body = "".join('<a href="%s">%s</a>\n' % (k.rsplit("/", 1)[1], k.rsplit("/", 1)[1]) for k in zims if k.startswith("/zim/%s/" % d)).encode()
            self.send_response(200); self.cors(); self.send_header("Content-Type", "text/html"); self.send_header("Content-Length", str(len(body))); self.end_headers(); self.wfile.write(body); return
        z = path[:-7].replace("/list/zim/", "/zim/", 1) if path.endswith(".sha256") else None
        if z in zims and path.startswith("/list/") and not z.endswith("/%s_2026-10.zim" % core[2]["get"]["stem"]):   # like Kiwix: in the directory, not on the mirror; none for LISTED
            body = ("%s  %s\n" % (hashlib.sha256(zims[z]).hexdigest(), z.rsplit("/", 1)[1])).encode()
            self.send_response(200); self.cors(); self.send_header("Content-Length", str(len(body))); self.end_headers(); self.wfile.write(body); return
        if path not in zims:
            self.send_response(404); self.cors(); self.send_header("Content-Length", "0"); self.end_headers(); return
        data = zims[path]; idd = next(a["id"] for a in arch if a["url"].endswith(path))
        rng = self.headers.get("Range"); start = 0
        if rng:
            m = re.match(r"bytes=(\d+)-(\d*)", rng); start = int(m.group(1)); end = int(m.group(2)) if m.group(2) else len(data) - 1
            state["ranges"].append((idd, rng))
            body = data[start:end + 1]
            self.send_response(206); self.send_header("Content-Range", "bytes %d-%d/%d" % (start, end, len(data)))
        else:
            body = data; self.send_response(200)
        if idd == BAD and state["bad_served"] == 0 and not rng:
            body = bytearray(body); body[len(body) // 2] ^= 0xFF; body = bytes(body); state["bad_served"] += 1
        self.cors(); self.send_header("Content-Type", "application/octet-stream"); self.send_header("Accept-Ranges", "bytes"); self.send_header("Content-Length", str(len(body))); self.end_headers()
        # Trickle it out like a real network, so the app reads it in many small chunks.
        cut = len(body) // 2 if idd == DROP and not state["drop_done"] else None
        if cut is not None: state["drop_done"] = True
        gap = 0.25 if state["slow"] == idd else 0.01
        try:
            for i in range(0, cut if cut is not None else len(body), 2048):
                self.wfile.write(body[i:min(i + 2048, cut if cut is not None else len(body))]); self.wfile.flush(); time.sleep(gap)
            if cut is not None:
                time.sleep(0.3); self.close_connection = True; self.connection.shutdown(2)   # cut off half way
        except (BrokenPipeError, ConnectionResetError, OSError): self.close_connection = True

# Sites: a copy of the deploy build whose CSP and archive list point at the test mirror, with a small test shelf.
site = tmp / "site"; shutil.copytree(ROOT / "app", site)
idx = site / "index.html"; h = idx.read_text()
h = h.replace("https://mirror.download.kiwix.org https://download.kiwix.org", MIRROR); idx.write_text(h)
(site / "shelf").mkdir(exist_ok=True)
items = {it["id"]: it for it in CONTENT["shelf"]["items"]}
from tinypdf import pdf  # noqa: E402
sh = []
for k, n in (("sh-epawater", 2), ("sh-cpscgen", 1), ("sh-nifog", 192), ("sh-cert", 268)):   # page counts as in the real files
    b = pdf([items[k]["t"], "Test page"], pages=n); (site / "shelf" / items[k]["file"]).write_bytes(b)
    sh.append({"id": k, "file": items[k]["file"], "size": len(b), "sha256": hashlib.sha256(b).hexdigest(), "pages": n})
(site / "shelf" / "index.json").write_text(json.dumps({"built": "2026-11-15T06:00:00+00:00", "items": sh}))
(site / "shelf" / "archives.json").write_text(json.dumps({"built": "2026-11-15T06:00:00+00:00", "mirror": MIRROR + "/zim/", "list": MIRROR + "/list/zim/", "items": [a for a in arch if a["id"] != LISTED]}))

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
servers = []
def serve(handler, port):
    s = ThreadingHTTPServer(("127.0.0.1", port), handler); servers.append(s); threading.Thread(target=s.serve_forever, daemon=True).start()
serve(functools.partial(Quiet, directory=str(site)), SPORT); serve(Mirror, MPORT)
BASE = "http://localhost:%d/" % SPORT
UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1"
INIT = "window.__HAVYN_NO_INTRO = true; if (window.top === window) { window.__vall = []; document.addEventListener('securitypolicyviolation', e => window.__vall.push(e.violatedDirective + ' ' + e.blockedURI)); }"
def lib(page): return page.evaluate("__HAVYN.lib.map(x => ({id: x.id, type: x.type || 'pdf', name: x.name, shelf: x.shelf || '', catalog: x.catalog || '', verified: !!x.verified, check: x.check || '', size: x.size, file: x.file || ''}))")
def zims_on(page): return [x for x in lib(page) if x["type"] == "zim"]

with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/usr/bin/google-chrome", headless=True, args=["--no-sandbox"])
    ctx = br.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True, user_agent=UA)
    ctx.add_init_script(INIT); page = ctx.new_page(); errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(BASE); page.wait_for_selector("body[data-ready]")
    page.evaluate("navigator.serviceWorker.ready.then(() => true)"); page.reload(); page.wait_for_selector("body[data-ready]")
    ok("service worker controls the page", page.evaluate("!!navigator.serviceWorker.controller"))
    page.wait_for_selector("#ready")
    ok("Status shows how ready this phone is", until(lambda: "% READY" in page.inner_text("#ready").upper()), page.inner_text("#ready")[:200])
    ok("one button offers to download everything", until(lambda: "DOWNLOAD EVERYTHING ·" in page.inner_text("#ready").upper()), page.inner_text("#ready")[:300])
    ok("Home shows the next quests with their XP", page.locator("#ready .quests.mini .li").count() == 3 and "XP" in page.inner_text("#ready"), page.inner_text("#ready")[:300])
    page.goto(BASE + "#/quests"); page.wait_for_selector("#ready .quests")
    rows = page.inner_text("#ready")
    ok("the Quests screen covers manuals, encyclopedias, plan, supplies and backup", all(k in rows for k in ("Manuals and guides", "Encyclopedias", "Family plan", "Count your supplies", "Memory Card")), rows[:400])
    page.goto(BASE + "#/status"); page.wait_for_selector("#ready")
    page.screenshot(path=str(SHOTS / "v15_ready.png"), full_page=False)
    page.evaluate("__HAVYN.arc.PART = 8192")   # small parts, so each test archive is stored in several
    page.click("button[data-act='get-everything']")
    ok("progress shows while downloading", until(lambda: "Downloading" in page.inner_text("#rdymsg"), 10), page.inner_text("#ready")[:300])
    ok("the shelf documents arrive first", until(lambda: sum(1 for x in lib(page) if x["shelf"]) == 4, 30), [x["shelf"] for x in lib(page)])
    ok("archives download from the Kiwix mirror into HAVYN", until(lambda: len(zims_on(page)) >= len(core) - 1, 60), [x["catalog"] for x in zims_on(page)])
    ok("a dropped connection carries on from the last byte saved (Range)", any(i == DROP and not r.startswith("bytes=0-") for i, r in state["ranges"]) and any(x["catalog"] == DROP for x in zims_on(page)), state["ranges"][:5])
    ok("an archive missing from HAVYN's list is found in Kiwix's directory", any(x["catalog"] == LISTED for x in zims_on(page)) and state["hits"].get("/list/zim/%s/" % core[2]["get"]["zim"], 0) >= 1, state["hits"])
    ok("a corrupted archive is refused (checksum) and not added", until(lambda: "checksum" in page.evaluate("__HAVYN.arc.failed.join(' ')"), 30) and not any(x["catalog"] == BAD for x in zims_on(page)), page.evaluate("__HAVYN.arc.failed"))
    ok("every downloaded archive was checked", zims_on(page) and all(x["verified"] for x in zims_on(page)), zims_on(page))
    ok("against Kiwix's SHA-256, or the ZIM's own MD5 when Kiwix has none", all(x["check"] == ("md5" if x["catalog"] == LISTED else "sha256") for x in zims_on(page)), [(x["catalog"], x["check"]) for x in zims_on(page)])
    parts = page.evaluate("(async () => { const id = __HAVYN.lib.find(x => x.type === 'zim').id; const v = await __HAVYN.store.get('zim:' + id); return v && v.parts ? v.parts.length : 0; })()")
    ok("archives are stored in parts (no second full copy)", parts >= 3, parts)
    ok("no Content-Security-Policy violations", page.evaluate("window.__vall.length") == 0, page.evaluate("window.__vall"))
    until(lambda: not page.evaluate("__HAVYN.arc.busy"), 20)
    # retry the refused one: the mirror now serves it intact
    page.goto(BASE + "#/archive?t=phone"); page.wait_for_selector("#arc", state="attached")
    ok("Get more › Phone offers Get for the one still missing", until(lambda: page.locator("#gi-%s button[data-act='arc-get']" % BAD).count() == 1, 10), page.inner_text("#gi-" + BAD)[:200])
    page.click("#gi-%s button[data-act='arc-get']" % BAD)
    ok("trying again downloads it", until(lambda: any(x["catalog"] == BAD for x in zims_on(page)), 30), page.inner_text("#arcmsg"))
    ok("the core set is complete", until(lambda: "CORE SET ON THIS PHONE" in page.inner_text("#app").upper(), 10), page.inner_text("#arc")[-300:])
    page.screenshot(path=str(SHOTS / "v15_phone.png"), full_page=False)
    # a downloaded archive reads through the service worker
    zid = next(x["id"] for x in zims_on(page) if x["catalog"] == core[0]["id"])
    page.goto(BASE + "#/library/" + zid + "/read"); fr = page.wait_for_selector("iframe#zframe", timeout=15000)
    ok("a downloaded archive opens in the reader", until(lambda: "HAVYN Test Library" in (page.frame_locator("iframe#zframe").locator("body").inner_text(timeout=2000)), 15))
    page.goto(BASE + "#/library/" + zid)
    ok("its library page says it came from Kiwix with a matching checksum", until(lambda: "from Kiwix, checksum matched" in page.inner_text(".zhero"), 8), page.inner_text("#app")[:300])
    # carry on after closing the app: a slow download is cut by a reload and finishes on its own
    page.goto(BASE + "#/status")
    page.evaluate("(async () => { const it = __HAVYN.lib.find(x => x.catalog === %r); })()" % core[3]["id"])
    victim = next(x for x in zims_on(page) if x["catalog"] == core[3]["id"])
    page.evaluate("(async () => { await __HAVYN.store.del('zim:' + %r); })()" % victim["id"])
    page.evaluate("(() => { const L = __HAVYN.lib; const i = L.findIndex(x => x.id === %r); L.splice(i, 1); return __HAVYN.store.set('lib', L); })()" % victim["id"])
    state["slow"] = core[3]["id"]
    page.reload(); page.wait_for_selector("body[data-ready]")
    page.evaluate("__HAVYN.arc.PART = 8192")
    ok("on opening, HAVYN carries on with downloads you started", until(lambda: page.evaluate("__HAVYN.arc.busy"), 15))
    ok("part of the slow archive is stored before the app closes", until(lambda: page.evaluate("(async () => { const s = await __HAVYN.store.get('zdl:' + %r); return s ? s.parts.length : 0; })()" % core[3]["id"]) >= 1, 20))
    n_before = len(state["ranges"])
    state["slow"] = None
    page.reload(); page.wait_for_selector("body[data-ready]"); page.evaluate("__HAVYN.arc.PART = 8192")
    ok("after closing and reopening, it finishes from where it stopped", until(lambda: any(x["catalog"] == core[3]["id"] for x in zims_on(page)), 40) and any(i == core[3]["id"] for i, _ in state["ranges"][n_before:]), state["ranges"][n_before:])
    page.goto(BASE + "#/quests")
    ok("Quests say the downloads are done", until(lambda: "Encyclopedias: %d of %d" % (len(core), len(core)) in page.inner_text("#app"), 15), page.inner_text("#app")[:400])
    ok("readiness counts only manuals HAVYN's shelf holds, and says what's missing", "Manuals and guides: 4 of 4" in page.inner_text("#app") and "on HAVYN's shelf yet" in page.inner_text("#app"), page.inner_text("#ready")[:600] if page.locator("#ready").count() else "")
    # the field index: "How do I…" opens the exact page in a manual on this phone, and comes back
    page.goto(BASE + "#/field"); page.wait_for_selector("#fq")
    hero = page.inner_text(".hero")
    ok("the field index lists answers and how many manuals are here", "64 answers" in hero and "4 of 25 on this phone" in hero, hero[-160:])
    page.fill("#fq", "tourniquet")
    vis = page.evaluate("Array.from(document.querySelectorAll('.fi')).filter(e => !e.classList.contains('hide')).map(e => e.id)")
    ok("typing filters the answers", vis == ["f-bleed"], vis)
    page.fill("#fq", "")
    page.click("#f-bleed a.ref[href*='page=102']")
    ok("a page link opens the manual at that page", until(lambda: page.inner_text("#pgnum").startswith("102 /"), 15), page.evaluate("location.hash") + " " + (page.inner_text("#pgnum") if page.locator("#pgnum").count() else ""))
    page.click(".rhead a[aria-label='Back']")
    ok("Back returns to the field index", until(lambda: page.evaluate("location.hash").startswith("#/field"), 5), page.evaluate("location.hash"))
    off = page.locator("#f-latrine a.ref.off").count()
    ok("pages in manuals not on this phone say so", off == 1 and "not on this phone yet" in page.inner_text("#f-latrine"), page.inner_text("#f-latrine"))
    page.goto(BASE + "#/emergency/bleeding"); page.wait_for_selector(".emhead")
    deep = page.inner_text(".emdeep") if page.locator(".emdeep").count() else ""
    page.screenshot(path=str(SHOTS / "v15_card.png"), full_page=True)
    ok("an emergency card links to the pages behind it", "CERT manual p. 102" in deep and "Basic Emergency Care" not in deep, deep)
    page.click(".emdeep a.emlink")
    ok("and the card's page link opens the manual there", until(lambda: page.inner_text("#pgnum").startswith("102 /"), 15))
    page.click(".rhead a[aria-label='Back']")
    ok("Back returns to the card", until(lambda: page.evaluate("location.hash") == "#/emergency/bleeding", 5), page.evaluate("location.hash"))
    page.goto(BASE + "#/emergency/heartattack"); page.wait_for_selector(".emhead")
    ok("new cards: heart attack, won't wake up, broken bone, poisoning", all(page.goto(BASE + "#/emergency/" + c) or page.wait_for_selector(".emhead") for c in ("heartattack", "unresponsive", "fracture", "poison")))
    page.goto(BASE + "#/playbooks/blackout"); page.wait_for_selector(".panel")
    page.locator("text=Read more on this phone").scroll_into_view_if_needed(); page.screenshot(path=str(SHOTS / "v15_playbook.png"), full_page=False)
    ok("a playbook lists the pages that go with it", "READ MORE ON THIS PHONE" in page.inner_text("#app").upper() and page.locator("#f-gen a.ref:not(.off)").count() >= 1, page.inner_text("#f-gen") + " | " + json.dumps([x for x in lib(page) if x["shelf"]]))
    page.goto(BASE + "#/search?q=tourniquet"); 
    ok("Search everything finds field answers", until(lambda: "Stop heavy bleeding" in page.inner_text("#sres"), 10), page.inner_text("#sres")[:300] if page.locator("#sres").count() else "")
    page.screenshot(path=str(SHOTS / "v15_search.png"), full_page=False)
    page.goto(BASE + "#/field"); page.wait_for_selector("#fq"); page.screenshot(path=str(SHOTS / "v15_field.png"), full_page=False)
    # back online (or back on screen): downloads you started carry on by themselves, then stop asking
    v2 = next(x for x in zims_on(page) if x["catalog"] == core[4]["id"])
    page.evaluate("(async () => { await __HAVYN.store.del('zim:' + %r); const L = __HAVYN.lib; L.splice(L.findIndex(x => x.id === %r), 1); await __HAVYN.store.set('lib', L); __HAVYN.prefs.autoGet = true; })()" % (v2["id"], v2["id"]))
    page.evaluate("window.dispatchEvent(new Event('online'))")
    ok("back online, HAVYN carries on with the downloads by itself", until(lambda: any(x["catalog"] == core[4]["id"] for x in zims_on(page)), 40), [x["catalog"] for x in zims_on(page)])
    ok("and stops carrying on once everything is here", until(lambda: page.evaluate("!__HAVYN.prefs.autoGet"), 20))
    # deleting an archive removes its parts
    page.goto(BASE + "#/library/" + zid); time.sleep(0.5)
    keys0 = page.evaluate("__HAVYN.store.keys().then(k => k.filter(x => String(x).startsWith('zpart:')).length)")
    page.evaluate("(async () => { const v = await __HAVYN.store.get('zim:' + %r); for (const k of v.parts) await __HAVYN.store.del(k); await __HAVYN.store.del('zim:' + %r); })()" % (zid, zid))
    keys1 = page.evaluate("__HAVYN.store.keys().then(k => k.filter(x => String(x).startsWith('zpart:')).length)")
    ok("parts are separate storage entries that delete cleanly", keys1 < keys0, (keys0, keys1))
    # ---------------- v1.6 the command deck ----------------
    SIT = json.loads(__import__("subprocess").run(["node", "-e", "const C=require(process.argv[1]); process.stdout.write(JSON.stringify(C.situations))", str(ROOT / "src" / "content.js")], check=True, capture_output=True, text=True).stdout)
    page.goto(BASE + "#/status"); page.wait_for_selector("#ready")
    ok("deck: Home leads with the level, the red tile, What's happening and know-how", page.locator("#ready .ring .lv b").count() == 1 and page.locator(".sostile").count() == 1 and page.locator(".nowgrid .gt").count() == len(SIT) and page.locator(".menugrid .mt").count() == 4,
       [page.locator(x).count() for x in ("#ready .ring", ".sostile", ".nowgrid .gt", ".menugrid .mt")])
    ok("deck: the rank is one of the levels", page.inner_text("#ready .rank").strip() in ("Recruit", "Scout", "Ranger", "Guardian", "Sentinel", "Fortress"), page.inner_text("#ready .rank"))
    bad = []
    for x in SIT:
        page.goto(BASE + "#/now/" + x["id"]); page.wait_for_selector(".nowhero h2")
        got = (page.inner_text(".nowhero h2").strip() == x["t"], page.locator(".nowcards .nc").count() == len(x["cards"]), page.locator(".fl .fi").count() == len(x["field"]),
               (not x.get("pb")) or page.locator("a[href='#/playbooks/%s']" % x["pb"]).count() == 1, "911" in page.inner_text("#app"))
        if not all(got): bad.append((x["id"], got))
    ok("deck: each situation brings its plan, cards, manual pages and numbers together", not bad, bad)
    page.goto(BASE + "#/now/power"); page.wait_for_selector(".nowhero"); page.click("button[data-act=outage-start]")
    ok("deck: Power out starts the outage clock", until(lambda: page.evaluate("__HAVYN.state.outage.active === true"), 5))
    page.evaluate("(() => { __HAVYN.state.outage.active = false; })()")
    page.goto(BASE + "#/quick/household"); page.wait_for_selector("#q-adult")
    for k, n in (("adult", 2), ("child", 1), ("pet", 1)):
        for _ in range(n): page.click("button[data-act='q+'][data-k=%s]" % k)
    ok("quick: + and − count on the spot", page.inner_text("#q-adult") == "2" and page.inner_text("#q-child") == "1")
    page.click("button[data-act=q-save]")
    ppl = until(lambda: page.evaluate("__HAVYN.state.people.filter(p => !p.deleted).map(p => p.name + '/' + p.ageBand)"), 5)
    ok("quick: the household is made from counts (names can come later)", sorted(ppl or []) == ["Adult 1/adult", "Adult 2/adult", "Kid 1/child"] and page.evaluate("__HAVYN.state.pets.filter(p => !p.deleted).length") == 1 and page.evaluate("location.hash") == "#/status", ppl)
    page.goto(BASE + "#/quick/supplies"); page.wait_for_selector("#q-w-case")
    for k, n in (("w-case", 3), ("f-can", 12), ("p-bank", 2)):
        for _ in range(n): page.click("button[data-act='q+'][data-k=%s]" % k)
    page.click("button[data-act=q-save]")
    its = until(lambda: page.evaluate("__HAVYN.state.items.filter(i => !i.deleted).map(i => [i.category, i.qty, JSON.stringify(i.per_unit || {})])"), 5)
    ok("quick: supplies are made from counts, with what each holds", sorted(map(tuple, its or [])) == sorted([("water", 3, '{"gal":3.17}'), ("food", 12, '{"kcal":450}'), ("power", 2, '{"wh":74}')]), its)
    page.goto(BASE + "#/status"); page.wait_for_selector(".hero .big")
    ok("quick: Home turns them into days you can last", page.inner_text(".hero .big").strip() not in ("—", ""), page.inner_text(".hero")[:120])
    page.goto(BASE + "#/quick/supplies"); page.wait_for_selector("#q-w-case")
    ok("quick: counting again starts from what's saved", page.inner_text("#q-w-case") == "3" and page.inner_text("#q-f-can") == "12")
    for _ in range(3): page.click("button[data-act='q-'][data-k=w-case]")
    page.click("button[data-act=q-save]")
    ok("quick: counting down to zero removes it", until(lambda: page.evaluate("!__HAVYN.state.items.some(i => !i.deleted && i.category === 'water')"), 5))
    page.goto(BASE + "#/quests"); page.wait_for_selector("#ready .quests")
    ok("quick: the household and supplies quests move", "Family plan: 1 of 4" in page.inner_text("#ready") and "Count your supplies" in page.inner_text("#ready"), page.inner_text("#ready")[:500])
    pick = lambda vs: page.evaluate("(vs) => { speechSynthesis.getVoices = () => vs; const v = __HAVYN.voice.pick(); return v && v.name; }", vs)
    v1 = pick([{"name": "Daniel", "lang": "en-GB"}, {"name": "Samantha", "lang": "en-US"}, {"name": "Serena (Enhanced)", "lang": "en-GB"}, {"name": "Fred", "lang": "en-US"}, {"name": "Martha", "lang": "en-GB"}])
    v2 = pick([{"name": "Daniel", "lang": "en-GB"}, {"name": "Samantha", "lang": "en-US"}, {"name": "Moira", "lang": "en-IE"}])
    v3 = pick([{"name": "Daniel", "lang": "en-GB"}, {"name": "Arthur", "lang": "en-GB"}, {"name": "Samantha", "lang": "en-US"}])
    ok("voice: an elegant British woman first (Serena, Enhanced), then the nearest woman's voice, never a man's while a woman's is there", (v1, v2, v3) == ("Serena (Enhanced)", "Moira", "Samantha"), (v1, v2, v3))
    page.goto(BASE + "#/system"); 
    sysx = page.inner_text("#app")
    ok("voice: System says which voice speaks (HAVYN's own British voice when it ships), with Hear it", "VOICE" in sysx.upper() and "Hear it" in sysx and (("HAVYN's own British voice" in sysx) if page.evaluate("!!window.HAVYN_VOICE") else ("Serena" in sysx or "Voices" in sysx)), sysx[-500:])
    page.screenshot(path=str(SHOTS / "v16_home.png"), full_page=False)
    ok("no page errors", not errors, errors)

    # ---------------- the welcome: first open from the Home Screen ----------------
    WINIT = ("window.__said = []; try { speechSynthesis.speak = (u) => window.__said.push(u.text); speechSynthesis.cancel = () => {}; } catch (e) {} "
             "if (window.top === window) { window.__vall = []; document.addEventListener('securitypolicyviolation', e => window.__vall.push(e.violatedDirective + ' ' + e.blockedURI)); }")
    STANDALONE = "Object.defineProperty(navigator, 'standalone', { get: () => true });"
    def newctx(init):
        c = br.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True, user_agent=UA); c.add_init_script(init); return c
    def rect(pg, sel): return pg.evaluate("(s) => { const r = document.querySelector(s).getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }", sel)
    def contains(a, b): return a[0] <= b[0] + 1 and a[1] <= b[1] + 1 and a[2] >= b[2] - 1 and a[3] >= b[3] - 1
    wctx = newctx(STANDALONE + WINIT); w = wctx.new_page(); werr = []; w.on("pageerror", lambda e: werr.append(str(e)))
    w.goto(BASE); w.wait_for_selector("#wel")
    ok("welcome: first open waits for a touch, with Emergency and Skip on screen", "TOUCH TO BEGIN" in w.inner_text("#wel").upper() and w.locator("#wel [data-act=wel-sos]").count() == 1 and w.locator("#wel [data-act=wel-skip]").count() == 1)
    ok("welcome: set to fill the phone by itself, but nothing downloads under the intro", w.evaluate("__HAVYN.prefs.autoGet === true && !!__HAVYN.prefs.setupAt") and not w.evaluate("__HAVYN.arc.busy || __HAVYN.shelf.busy"))
    w.screenshot(path=str(SHOTS / "v15_welcome_begin.png"))
    w.mouse.click(70, 600)   # a touch anywhere begins
    ok("welcome: a touch anywhere starts the LABS ANALYTIX open", until(lambda: w.evaluate("document.querySelector('#wel').classList.contains('p1')") and w.inner_text("#wellabs") == "LABS ANALYTIX", 6))
    heard = lambda: w.evaluate("__HAVYN.clips.played.concat(window.__said)")
    ok("welcome: then the HAVYN mark and the voice says Welcome to Haven", until(lambda: "Welcome to Haven." in heard(), 8), heard())
    if w.evaluate("!!window.HAVYN_VOICE"):
        ok("welcome: in HAVYN's own recorded British voice, not the phone's", until(lambda: "Welcome to Haven." in w.evaluate("__HAVYN.clips.played"), 5) and "Welcome to Haven." not in w.evaluate("window.__said"), (w.evaluate("__HAVYN.clips.played"), w.evaluate("window.__said")))
    w.screenshot(path=str(SHOTS / "v15_welcome_mark.png"))
    ok("welcome: then a tour of the real screens", until(lambda: w.locator("#tour .tcard h3").count() == 1, 10))
    targets = ["#ready .rdyhead", ".nowgrid", ".simbanner", ".tab.sos", ".tab[data-tab=guides]", ".tab[data-tab=family]", ".tab[data-tab=supplies]", ".tools a[href='#/search']"]  # v1.8: Sim Lab after What's happening?
    lit = []
    for k, sel in enumerate(targets):
        until(lambda: w.inner_text("#tour .tmeta .lab").startswith("%d of" % (k + 1)), 5); time.sleep(0.8)   # the spotlight glides into place
        lit.append(contains(rect(w, "#tour .thole"), rect(w, sel))); w.click("#tour [data-act=wel-next]")
    ok("welcome: the spotlight lands on the level, What's happening, Sim Lab, each tab and Search", all(lit), lit)
    ok("welcome: every step is spoken", len([x for x in heard() if x.strip()]) >= 10, heard())
    ok("welcome: the last step starts Download everything by itself", until(lambda: "Getting this phone ready" in w.inner_text("#tour") and w.evaluate("__HAVYN.shelf.busy || __HAVYN.arc.busy || __HAVYN.lib.length > 0"), 10), w.inner_text("#tour")[:200])
    w.click("#tour [data-act=wel-next]")
    ok("welcome: it ends with You're equipped", until(lambda: "equipped" in w.inner_text("#tour"), 5))
    w.screenshot(path=str(SHOTS / "v15_welcome_end.png"))
    w.click("#tour [data-act=wel-done]")
    ok("welcome: Enter HAVYN lands on Status and is remembered", until(lambda: w.locator("#tour, #wel").count() == 0, 5) and w.evaluate("location.hash") == "#/status" and w.evaluate("!!__HAVYN.prefs.introSeen"))
    ok("welcome: the phone fills itself with no setup (manuals, then encyclopedias)", until(lambda: sum(1 for x in lib(w) if x["shelf"]) == 4 and len(zims_on(w)) == len(core), 60), [x["catalog"] or x["shelf"] for x in lib(w)])
    w.reload(); w.wait_for_selector("body[data-ready]"); time.sleep(0.6)
    ok("welcome: it doesn't come back", w.locator("#wel").count() == 0)
    w.goto(BASE + "#/welcome")
    ok("welcome: Guides and System replay it", until(lambda: w.locator("#wel").count() == 1, 5))
    w.click("#wel [data-act=wel-skip]")
    ok("welcome: Skip closes it", until(lambda: w.locator("#wel, #tour").count() == 0, 5))
    ok("welcome: no errors or policy violations", not werr and w.evaluate("window.__vall.length") == 0, werr + w.evaluate("window.__vall"))
    wctx.close()
    # opened in Safari, in the middle of an emergency
    sctx = newctx(WINIT); s2 = sctx.new_page(); s2.goto(BASE); s2.wait_for_selector("#wel")
    s2.click("#wel [data-act=wel-sos]")
    ok("welcome: Emergency now goes straight to the cards", until(lambda: s2.evaluate("location.hash") == "#/emergency" and s2.locator("#wel").count() == 0, 5))
    ok("welcome: it won't stand in the way again, and in Safari nothing downloads by itself", s2.evaluate("!!__HAVYN.prefs.introSeen && !__HAVYN.prefs.autoGet"))
    sctx.close()
    dctx = newctx(WINIT); d2 = dctx.new_page(); d2.goto(BASE + "#/emergency/cpr"); d2.wait_for_selector("body[data-ready]"); time.sleep(0.6)
    ok("welcome: a link straight to a card skips it", d2.locator("#wel").count() == 0)
    dctx.close()
    ctx.close(); br.close()

for s in servers: s.shutdown()
shutil.rmtree(tmp, ignore_errors=True)
passed = sum(1 for r in results if r[1])
print("\n%d/%d passed" % (passed, len(results)))
(ROOT / "tests" / "e2e_v15_results.json").write_text(json.dumps([{"name": n, "pass": p, "detail": d} for n, p, d in results], indent=1))
sys.exit(0 if passed == len(results) else 1)
