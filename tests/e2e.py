"""End-to-end checks against the M1 'done when' list, in headless Chrome at iPhone size.
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
    page = ctx.new_page()
    errors, reqs = [], []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("response", lambda r: reqs.append(r.url))  # only requests that actually got a response
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

    # 6. family + add person
    page.goto(BASE + "#/family/person/new"); page.wait_for_selector("form[data-form=person]")
    page.fill("[name=name]", "Test Person"); page.select_option("[name=ageBand]", "senior"); page.click("button[type=submit]")
    page.wait_for_selector("text=Test Person")
    page.screenshot(path=str(SHOTS / "06_family.png"), full_page=True)
    ok("person saved", page.is_visible("text=Test Person"))

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

    # 9. Memory Card round trip: save -> erase -> load -> identical
    page.goto(BASE + "#/system"); page.wait_for_selector("[data-act=mc-save]")
    page.screenshot(path=str(SHOTS / "09_system.png"), full_page=True)
    original = page.evaluate("JSON.stringify({people: __HAVYN.state.people, pets: __HAVYN.state.pets, items: __HAVYN.state.items, log: __HAVYN.state.log, plan: __HAVYN.state.plan, settings: __HAVYN.state.settings, checks: __HAVYN.state.checks})")
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
    restored = page.evaluate("JSON.stringify({people: __HAVYN.state.people, pets: __HAVYN.state.pets, items: __HAVYN.state.items, log: __HAVYN.state.log, plan: __HAVYN.state.plan, settings: __HAVYN.state.settings, checks: __HAVYN.state.checks})")
    norm = lambda s: {k: (sorted(v, key=lambda r: r["id"]) if isinstance(v, list) else v) for k, v in json.loads(s).items()}
    ok("memory card round trip has zero data loss", norm(original) == norm(restored))
    # merge keeps the newer local edit
    page.evaluate("""(() => { const i = __HAVYN.state.items.find(x => !x.deleted); i.qty = 999; i.updated = Date.now() + 60000; })()""")
    page.set_input_files("#mcfile", str(card_path)); page.wait_for_selector("[data-act=mc-merge]"); page.click("[data-act=mc-merge]"); page.wait_for_timeout(300)
    ok("merge keeps the newest edit", page.evaluate("__HAVYN.state.items.some(x => x.qty === 999)"))

    # 10. offline: reload with the network off
    ctx.set_offline(True)
    page.goto(BASE + "#/status"); page.wait_for_selector("body[data-ready]", timeout=8000)
    ok("works offline after first install", page.is_visible(".hero"))
    page.click("a.tab.sos"); page.click('a.emtile[href="#/emergency/bleeding"]')
    page.wait_for_selector(".emstep", timeout=5000)
    ok("emergency card offline", page.is_visible(".emstep"))
    page.screenshot(path=str(SHOTS / "10_offline_bleeding.png"))
    ctx.set_offline(False)

    # 11. CSP blocks network from the page
    page.goto(BASE + "#/status"); page.wait_for_selector("body[data-ready]")
    page.evaluate("window.__v = []; document.addEventListener('securitypolicyviolation', e => window.__v.push(e.violatedDirective + ' ' + e.blockedURI))")
    n_before = len(reqs)
    blocked = page.evaluate("""(async () => { const r = [];
      for (const u of ['https://example.com/x', '/index.html']) { try { await fetch(u); r.push('allowed ' + u); } catch (e) { r.push('blocked ' + u); } }
      const img = new Image(); img.src = 'https://example.com/pixel.png';
      await new Promise(res => setTimeout(res, 300)); return r; })()""")
    viol = page.evaluate("window.__v")
    external = [u for u in reqs[n_before:] if not u.startswith(BASE) and not u.startswith("data:")]
    ok("CSP blocks fetch (external + same-origin) and external images", all(b.startswith("blocked") for b in blocked) and not external and any("img-src" in v for v in viol), f"{blocked}; violations={viol}")
    ext_all = sorted({u for u in reqs if not (u.startswith(BASE) or u.startswith("data:") or u.startswith("blob:"))})
    ok("no external requests during the whole session", not ext_all, ext_all)
    ok("no script errors", not [e for e in errors if "Content Security Policy" not in e and "net::ERR" not in e and "Failed to fetch" not in e], errors[:5])
    br.close()
srv.shutdown()
fails = [r for r in results if not r[1]]
print(f"\n{len(results) - len(fails)}/{len(results)} passed")
(ROOT / "tests" / "e2e-results.json").write_text(json.dumps([{"check": n, "pass": p, "detail": str(d)} for n, p, d in results], indent=1))
sys.exit(1 if fails else 0)
