"""End-to-end checks (v1.0 M1 list + v1.1 missions, buy list, plan, comms, PDF library), headless Chrome at iPhone size.
Usage: python3 tests/e2e.py  (serves ./app on localhost:8765, writes screenshots to tests/shots/)"""
import json, os, sys, threading, time, functools
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SHOTS = ROOT / "tests" / "shots"; SHOTS.mkdir(parents=True, exist_ok=True)
PORT = 8765
BASE = f"http://localhost:{PORT}/"
results = []
def wait_text(page, sel, pattern, timeout=20):
    """Poll text from Python: the app's CSP (no eval) blocks Playwright's string-based wait_for_function."""
    import re
    end = time.time() + timeout
    while time.time() < end:
        try:
            if re.search(pattern, page.inner_text(sel)): return True
        except Exception: pass
        time.sleep(0.2)
    return False
def ok(name, cond, detail=""):
    results.append((name, bool(cond), detail)); print(("PASS " if cond else "FAIL ") + name + (" — " + str(detail) if detail else ""))

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = ThreadingHTTPServer(("127.0.0.1", PORT), functools.partial(Quiet, directory=str(ROOT / "app")))
threading.Thread(target=srv.serve_forever, daemon=True).start()

C = json.loads(os.popen(f"node -e \"process.stdout.write(JSON.stringify(require('{ROOT}/src/content.js')))\"").read())
IPHONE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1"

with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/usr/bin/google-chrome", headless=True, args=["--no-sandbox"])
    ctx = br.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True, user_agent=IPHONE_UA, accept_downloads=True)
    ctx.add_init_script("window.__vall = []; document.addEventListener('securitypolicyviolation', e => window.__vall.push(e.violatedDirective + ' ' + e.blockedURI));")
    page = ctx.new_page()
    vio_all = []
    def keep_violations():
        try: vio_all.extend(page.evaluate('window.__vall || []'))
        except Exception: pass
    errors, reqs = [], []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("response", lambda r: reqs.append(r.url))  # only requests that actually got a response
    missing = []  # 404s; the shelf lists (shelf/index.json, shelf/archives.json) are only added at deploy, so a local build has none
    page.on("response", lambda r: missing.append(r.url) if r.status == 404 else None)
    blocked_reqs = []
    page.on("requestfailed", lambda r: blocked_reqs.append((r.url, r.failure)))

    # 1. first screen time (normal, then CPU-throttled 6x as a stand-in for an old iPhone)
    page.goto(BASE); page.wait_for_selector("body[data-ready]")
    t_ready = page.evaluate("window.__HAVYN_READY_AT")
    cdp = ctx.new_cdp_session(page)
    cdp.send("Emulation.setCPUThrottlingRate", {"rate": 6})
    page.reload(); page.wait_for_selector("body[data-ready]")
    t_slow = page.evaluate("window.__HAVYN_READY_AT")
    cdp.send("Emulation.setCPUThrottlingRate", {"rate": 1})
    ok("first screen under 1 s (6x CPU throttle)", t_slow < 1000, f"{t_ready} ms normal, {t_slow} ms throttled")

    # 2. service worker installs and controls the page
    page.evaluate("navigator.serviceWorker.ready.then(() => true)")
    page.reload(); page.wait_for_selector("body[data-ready]")
    ok("service worker controls the page", page.evaluate("!!navigator.serviceWorker.controller"))
    page.screenshot(path=str(SHOTS / "01_status_empty.png"))

    # 3. two taps from launch to every emergency card
    for c in C["cards"]:
        page.goto(BASE + "#/status"); page.wait_for_selector("body[data-ready]")
        page.click("a.tab.sos")
        page.click(f'a.emtile[href="#/emergency/{c["id"]}"]')
        txt = page.inner_text(".emstep")
        ok(f"card '{c['id']}' in 2 taps", txt.strip() == c["steps"][0]["t"], txt)
        src = page.inner_text(".emsrc")
        ok(f"card '{c['id']}' shows source + checked date", "Source:" in src and C["reviewed"] in src)
    page.goto(BASE + "#/emergency"); page.wait_for_selector(".emgrid")
    page.screenshot(path=str(SHOTS / "03_emergency_grid.png"))
    page.click('a.emtile[href="#/emergency/cpr"]')
    for _ in range(3): page.click("[data-act=step-next]")
    ok("CPR beat step shows the metronome", page.is_visible(".beat") and "110" in page.inner_text(".beat"))
    time.sleep(0.4)
    page.screenshot(path=str(SHOTS / "04_cpr_beat.png"))
    page.click("[data-act=step-next]")
    page.screenshot(path=str(SHOTS / "04b_cpr_step5.png"))

    # 4. example household -> status towers
    page.goto(BASE + "#/status"); page.wait_for_selector("body[data-ready]")
    page.click("[data-act=example]"); page.wait_for_timeout(1100)
    page.screenshot(path=str(SHOTS / "02_status_example.png"), full_page=True)
    fam = page.evaluate("(() => { const a = __HAVYN.E.autonomy(__HAVYN.state, Date.now()); return [a.family, a.limiting]; })()")
    ok("autonomy computed for example", fam[0] is not None and fam[0] > 0, fam)

    # 5. playbook checklist persists
    page.goto(BASE + "#/playbooks/blackout"); page.wait_for_selector(".chk")
    page.screenshot(path=str(SHOTS / "05_playbook.png"))
    page.locator(".chk input").nth(1).check()
    page.wait_for_timeout(300); page.reload(); page.wait_for_selector(".chk")
    ok("playbook tick persists after reload", page.locator(".chk input").nth(1).is_checked())
    for pb in C["playbooks"]:
        page.goto(BASE + "#/playbooks/" + pb["id"]); page.wait_for_selector(".chk")
        n_items = sum(len(ph["items"]) for ph in pb["phases"])
        ok(f"playbook '{pb['id']}' live with {n_items} steps", page.locator(".chk input").count() == n_items and (pb.get("ruleTitle") or "Hard rule: leave now if").upper() in page.inner_text("body").upper())
    ok("boil-water has its own rule and no leave destination", "Destination" not in page.inner_text("body"))
    page.goto(BASE + "#/emergency/scorpion"); page.wait_for_selector(".emstep")
    ok("scorpion card: one-tap Poison Control", page.locator("a.emlink[href='tel:18002221222']").count() == 1)

    # 6. family + add person
    page.goto(BASE + "#/family/person/new"); page.wait_for_selector("form[data-form=person]")
    page.fill("[name=name]", "Test Person"); page.select_option("[name=ageBand]", "senior"); page.click("button[type=submit]")
    page.wait_for_selector("text=Test Person")
    page.screenshot(path=str(SHOTS / "06_family.png"), full_page=True)
    ok("person saved", page.is_visible("text=Test Person"))
    page.goto(BASE + "#/family/pet/new"); page.wait_for_selector("form[data-form=pet]")
    page.fill("[name=name]", "Temp Pet"); page.click("button[type=submit]"); page.wait_for_selector("text=Temp Pet")
    page.click("text=Temp Pet"); page.wait_for_selector("[data-act=del]")
    page.click("[data-act=del]"); page.click("[data-act=del]"); page.wait_for_timeout(300)
    ok("delete removes the record and returns to the list", page.url.endswith("#/family") and not page.is_visible("text=Temp Pet"), page.url)

    # 7. supplies: add from preset, log use
    page.goto(BASE + "#/supplies/edit/new?cat=water"); page.wait_for_selector("form[data-form=item]")
    page.click('[data-preset^="55-gal drum"]'); page.fill("[name=qty]", "1"); page.fill("[name=location]", "Kitchen"); page.click("button[type=submit]")
    page.wait_for_selector("[data-act=use]")
    before = page.evaluate("__HAVYN.state.items.filter(i=>!i.deleted).find(i=>i.name==='55-gal drum' && i.location==='Kitchen').qty")
    page.click('[data-act=use][data-n="0.5"]'); page.wait_for_timeout(200)
    after = page.evaluate("__HAVYN.state.items.filter(i=>!i.deleted).find(i=>i.name==='55-gal drum' && i.location==='Kitchen').qty")
    ok("item from preset + log use", before == 1 and after == 0.5, f"{before} -> {after}")
    page.goto(BASE + "#/supplies"); page.wait_for_selector(".list")
    page.screenshot(path=str(SHOTS / "07_supplies.png"), full_page=True)

    # 8. night mode
    page.goto(BASE + "#/status"); page.wait_for_selector("body[data-ready]")
    page.click("[data-act=night]"); page.wait_for_timeout(1000)
    page.screenshot(path=str(SHOTS / "08_night.png"))
    page.click("[data-act=night]")


    # 8b. v1.1: missions, buy list, plan, comms (with the example household loaded)
    page.goto(BASE + "#/status"); page.wait_for_selector("[data-task]")
    first = page.get_attribute("[data-task] >> nth=0", "data-task")
    page.click(f"[data-task='{first}']"); page.wait_for_timeout(250)
    page.reload(); page.wait_for_selector("body[data-ready]")
    ok("mission tick on Status persists", page.evaluate(f"__HAVYN.state.tasks.some(t => t.id === '{first}' && t.done)"))
    n_ms = sum(len(ph["tasks"]) for ph in C["missions"]["phases"])
    ok("Status shows mission progress", f"1 of {n_ms} done" in page.inner_text(".ph .rt"), page.inner_text(".ph .rt"))
    page.goto(BASE + "#/missions"); page.wait_for_selector("form[data-form=task]")
    page.fill("form[data-form=task] [name=t]", "Test mission"); page.select_option("form[data-form=task] [name=phase]", "bf"); page.click("form[data-form=task] button[type=submit]")
    page.wait_for_timeout(250)
    ok("custom mission added to its phase", page.evaluate("__HAVYN.state.tasks.some(t => t.custom && t.t === 'Test mission' && t.phase === 'bf')"))
    page.click("[data-act=up-done][data-id=r-month]"); page.wait_for_timeout(200)
    ok("upkeep marked done shows OK", page.locator(".up").nth(0).locator(".chip.ok").count() == 1)
    page.screenshot(path=str(SHOTS / "11_missions.png"), full_page=True)
    tot = page.evaluate("(() => { const b = __HAVYN.E.buyPlan(__HAVYN.state, __HAVYN.C.buy.items); return [b.hh.P, b.hh.pets, b.rows.find(r => r.item.id === 'drum').qty]; })()")
    ok("buy list sizes itself to the household (5 people + dog)", tot == [5, 1, 3], tot)
    page.goto(BASE + "#/buy?f=floor"); page.wait_for_selector(".li")
    ok("safety floor: 7 items, $564", page.locator(".list .li").count() == 7 and "$564" in page.inner_text(".hero"), page.inner_text(".hero")[:60])
    page.goto(BASE + "#/buy/drum"); page.wait_for_selector("[data-act=buy-status]")
    page.click("[data-act=buy-status][data-v=have]"); page.wait_for_selector("[data-act=buy-add]")
    page.click("[data-act=buy-add]"); page.wait_for_selector("form[data-form=item]")
    pre = [page.input_value("[name=name]"), page.input_value("[name=qty]"), page.input_value("[name=per]")]
    ok("Add to Supplies prefills the item form", pre == ["55-gal drum", "3", "55"], pre)
    page.click("button[type=submit]"); page.wait_for_selector("[data-act=use]")
    linked = page.evaluate("(() => { const b = __HAVYN.state.buys.find(x => x.id === 'drum'); const i = b && __HAVYN.state.items.find(x => x.id === b.itemId); return !!(i && i.per_unit.gal === 55 && i.qty === 3 && b.status === 'have'); })()")
    ok("bought item lands in Supplies and stays linked", linked)
    page.goto(BASE + "#/buy"); page.wait_for_selector(".hero")
    page.screenshot(path=str(SHOTS / "12_buylist.png"))
    page.goto(BASE + "#/plan"); page.wait_for_selector(".step")
    ok("plan shows live floor and tier figures", "$564 minimum" in page.inner_text("body"))
    page.screenshot(path=str(SHOTS / "13_plan.png"), full_page=True)
    page.goto(BASE + "#/comms"); page.wait_for_selector("a[href^='sms:']")
    sms = page.get_attribute("a.btn[href^='sms:5']", "href")
    ok("comms: one-tap OK text to the out-of-area contact", sms.startswith("sms:5550100&body=OK"), sms)
    ok("comms: text-911 and call-911", page.locator("a[href='sms:911']").count() == 1 and page.locator("a[href='tel:911']").count() >= 1)
    ok("comms: 7 one-tap Phoenix numbers", page.locator("a.li[href^='tel:']").count() == 7, page.locator("a.li[href^='tel:']").count())
    ok("comms: rally points open in Apple Maps", page.locator("a[href^='https://maps.apple.com/?q=']").count() == 4)
    page.screenshot(path=str(SHOTS / "14_comms.png"), full_page=True)
    page.goto(BASE + "#/guides"); page.wait_for_selector(".li")
    ok("Guides tab is highlighted for guides pages", page.get_attribute("a.tab[data-tab=guides]", "class").endswith("on"))
    keep_violations()

    # 9. Memory Card round trip: save -> erase -> load -> identical
    page.goto(BASE + "#/system"); page.wait_for_selector("[data-act=mc-save]")
    page.screenshot(path=str(SHOTS / "09_system.png"), full_page=True)
    original = page.evaluate("JSON.stringify({people: __HAVYN.state.people, pets: __HAVYN.state.pets, items: __HAVYN.state.items, log: __HAVYN.state.log, plan: __HAVYN.state.plan, settings: __HAVYN.state.settings, checks: __HAVYN.state.checks, tasks: __HAVYN.state.tasks, buys: __HAVYN.state.buys})")
    page.click("[data-act=mc-save]"); page.wait_for_selector("#mcsend:not(.hide)")
    with page.expect_download() as dl: page.click("[data-act=mc-download]")
    card_path = SHOTS / "memorycard.json"; dl.value.save_as(str(card_path))
    card = json.loads(card_path.read_text())
    ok("memory card file written", card.get("format") == "havyn.memorycard" and len(card.get("checksum", "")) == 64, f"{card_path.stat().st_size} bytes")
    page.click("[data-act=erase]"); page.click("[data-act=erase]"); page.wait_for_timeout(300)
    ok("erase empties the phone", page.evaluate("__HAVYN.state.items.length") == 0)
    page.goto(BASE + "#/system"); page.wait_for_selector("#mcfile", state="attached")
    page.set_input_files("#mcfile", str(card_path)); page.wait_for_selector("[data-act=mc-merge]")
    page.click("[data-act=mc-merge]"); page.wait_for_timeout(300)
    restored = page.evaluate("JSON.stringify({people: __HAVYN.state.people, pets: __HAVYN.state.pets, items: __HAVYN.state.items, log: __HAVYN.state.log, plan: __HAVYN.state.plan, settings: __HAVYN.state.settings, checks: __HAVYN.state.checks, tasks: __HAVYN.state.tasks, buys: __HAVYN.state.buys})")
    norm = lambda s: {k: (sorted(v, key=lambda r: r["id"]) if isinstance(v, list) else v) for k, v in json.loads(s).items()}
    ok("memory card round trip has zero data loss", norm(original) == norm(restored))
    # merge keeps the newer local edit
    page.evaluate("""(() => { const i = __HAVYN.state.items.find(x => !x.deleted); i.qty = 999; i.updated = Date.now() + 60000; })()""")
    page.set_input_files("#mcfile", str(card_path)); page.wait_for_selector("[data-act=mc-merge]"); page.click("[data-act=mc-merge]"); page.wait_for_timeout(300)
    ok("merge keeps the newest edit", page.evaluate("__HAVYN.state.items.some(x => x.qty === 999)"))


    # 9b. v1.1: PDF library (after the erase, which also clears PDFs)
    page.goto(BASE + "#/library"); page.wait_for_selector("#libfile", state="attached")
    page.set_input_files("#libfile", str(ROOT / "tests" / "fixtures" / "havyn-test.pdf"))
    page.wait_for_selector("a.li[href^='#/library/']")
    ok("PDF imported into the library", page.locator("a.li[href^='#/library/']").count() == 1)
    page.click("a.li[href^='#/library/']"); page.wait_for_selector(".pg canvas", timeout=15000)
    for _ in range(50):
        if page.locator(".pg canvas").count() >= 2: break
        time.sleep(0.1)
    ok("reader renders pages", page.inner_text("#pgnum").strip() == "1 / 4" and page.locator(".pg canvas").count() >= 2, page.inner_text("#pgnum") + f" · {page.locator('.pg canvas').count()} drawn")
    page.screenshot(path=str(SHOTS / "15_reader.png"))
    page.click("[data-act=pdf-toc]"); page.wait_for_selector(".toc button")
    ok("reader: table of contents", page.locator(".toc button").all_inner_texts() == ["Water storage", "Dehydration and heat", "Power station care", "Radio channels"])
    page.click("[data-act=pdf-find]"); page.fill("#pdfpanel [name=q]", "dehydration"); page.click("#pdfpanel button[type=submit]")
    page.wait_for_selector("#findres .toc button")
    hits = page.locator("#findres .toc button").all_inner_texts()
    ok("reader: find text", len(hits) == 1 and hits[0].startswith("p. 2"), hits)
    page.fill("form[data-form=pdfgo] [name=p]", "4"); page.click("form[data-form=pdfgo] button[type=submit]"); page.wait_for_timeout(1200)
    ok("reader: go to page", page.inner_text("#pgnum").strip() == "4 / 4", page.inner_text("#pgnum"))
    page.goto(BASE + "#/library"); page.wait_for_selector("a.li[href^='#/library/']")
    page.click("a.li[href^='#/library/']"); page.wait_for_selector(".pg canvas", timeout=15000); page.wait_for_timeout(600)
    ok("reader resumes where you left off", page.inner_text("#pgnum").strip() == "4 / 4", page.inner_text("#pgnum"))
    # binder: built on the phone, saved to the library, readable and searchable
    page.goto(BASE + "#/family/person/new"); page.wait_for_selector("form[data-form=person]")
    page.fill("[name=name]", "Binder Test"); page.fill("[name=allergies]", "Penicillin"); page.click("button[type=submit]"); page.wait_for_selector("text=Binder Test")
    page.goto(BASE + "#/binder"); page.wait_for_selector(".paper")
    ok("binder preview holds people, numbers and every card", "Penicillin" in page.inner_text(".paper") and "602-261-8000" in page.inner_text(".paper") and all(("Card: " + c["title"]) in page.inner_text(".paper") for c in C["cards"]))
    page.click("[data-act=binder-pdf]"); page.wait_for_selector("#bdsend:not(.hide)", timeout=20000)
    with page.expect_download() as dl: page.click("[data-act=binder-dl]")
    bpath = SHOTS / "binder.pdf"; dl.value.save_as(str(bpath))
    ok("binder PDF made on the phone", bpath.read_bytes()[:5] == b"%PDF-" and bpath.stat().st_size > 10000, f"{bpath.stat().st_size} bytes")
    bid = page.evaluate("(async () => await new Promise(r => { const q = indexedDB.open('havyn-field'); q.onsuccess = () => { const t = q.result.transaction('kv').objectStore('kv').get('lib'); t.onsuccess = () => r((t.result || []).filter(x => x.binder).map(x => [x.id, x.pages])); }; }))()")
    ok("binder copy saved to the library", len(bid) == 1 and bid[0][1] >= 12, bid)
    page.goto(BASE + "#/library/" + bid[0][0]); page.wait_for_selector(".pg canvas", timeout=15000)
    page.click("[data-act=pdf-find]"); page.fill("#pdfpanel [name=q]", "Penicillin"); page.click("#pdfpanel button[type=submit]")
    page.wait_for_selector("#findres .toc button", timeout=15000)
    ok("binder PDF is searchable in the reader", page.locator("#findres .toc button").count() >= 1)
    page.screenshot(path=str(SHOTS / "17_binder_reader.png"))
    page.click("[data-act=night]") if page.locator("[data-act=night]").count() else None
    page.evaluate("__HAVYN.prefs.theme = 'night'"); page.goto(BASE + "#/status"); page.go_back(); page.wait_for_selector(".pg canvas", timeout=15000); page.wait_for_timeout(500)
    page.screenshot(path=str(SHOTS / "16_reader_night.png"))
    page.evaluate("__HAVYN.prefs.theme = 'void'")
    keep_violations()

    # 10. offline: reload with the network off
    ctx.set_offline(True)
    page.goto(BASE + "#/status"); page.reload(); page.wait_for_selector("body[data-ready]", timeout=8000)
    ok("works offline after first install", page.is_visible(".hero"))
    page.click("a.tab.sos"); page.click('a.emtile[href="#/emergency/bleeding"]')
    page.wait_for_selector(".emstep", timeout=5000)
    ok("emergency card offline", page.is_visible(".emstep"))
    page.goto(BASE + "#/library"); page.wait_for_selector("a.li[href^='#/library/']", timeout=8000)
    page.click("a.li[href^='#/library/']"); page.wait_for_selector(".pg canvas", timeout=15000)
    ok("PDF reader works offline (pdf.js from the offline copy)", page.locator(".pg canvas").count() >= 1)
    page.goto(BASE + "#/binder"); page.wait_for_selector("[data-act=binder-pdf]")
    page.click("[data-act=binder-pdf]"); wait_text(page, "#bdmsg", "Ready|Couldn")
    ok("binder PDF can be made offline (pdf-lib from the offline copy)", "Ready" in page.inner_text("#bdmsg"), page.inner_text("#bdmsg"))
    keep_violations()
    page.screenshot(path=str(SHOTS / "10_offline_bleeding.png"))
    ctx.set_offline(False)

    # 11. CSP blocks network from the page (except HAVYN's own address, for shelf downloads)
    page.goto(BASE + "#/status"); page.wait_for_selector("body[data-ready]")
    page.evaluate("window.__v = []; document.addEventListener('securitypolicyviolation', e => window.__v.push(e.violatedDirective + ' ' + e.blockedURI))")
    n_before = len(reqs)
    blocked = page.evaluate("""(async () => { const r = [];
      for (const u of ['https://example.com/x', '/index.html']) { try { await fetch(u); r.push('allowed ' + u); } catch (e) { r.push('blocked ' + u); } }
      const img = new Image(); img.src = 'https://example.com/pixel.png';
      await new Promise(res => setTimeout(res, 300)); return r; })()""")
    viol = page.evaluate("window.__v")
    external = [u for u in reqs[n_before:] if not u.startswith(BASE) and not u.startswith("data:")]
    # v1.4: the page may fetch its own address (the reference shelf), never anywhere else.
    ok("CSP blocks fetch to other sites and external images; only HAVYN's own address is allowed", blocked == ["blocked https://example.com/x", "allowed /index.html"] and not external and any("img-src" in v for v in viol) and any("connect-src" in v for v in viol), f"{blocked}; violations={viol}")
    ext_all = sorted({u for u in reqs if not (u.startswith(BASE) or u.startswith("data:") or u.startswith("blob:"))})
    ok("no external requests during the whole session", not ext_all, ext_all)
    ok("no CSP violations in normal use (incl. pdf.js)", not vio_all, vio_all[:5])
    deploy_only = all("/shelf/" in u for u in missing)
    ok("no script errors", not [e for e in errors if "Content Security Policy" not in e and "net::ERR" not in e and "Failed to fetch" not in e and not (deploy_only and "status of 404" in e)], errors[:5] + [u for u in missing if "/shelf/" not in u][:3])
    br.close()
srv.shutdown()
fails = [r for r in results if not r[1]]
print(f"\n{len(results) - len(fails)}/{len(results)} passed")
(ROOT / "tests" / "e2e-results.json").write_text(json.dumps([{"check": n, "pass": p, "detail": str(d)} for n, p, d in results], indent=1))
sys.exit(1 if fails else 0)
