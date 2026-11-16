"""v1.8 end-to-end checks: Sim Lab. Home's Train section and quest; the hub; a mission played perfectly (3 stars) and
one with a miss (2 stars, the right answer shown); a scan with labels, the UV view and picture choices; Alarm ID plays
each alarm pattern and draws it; CPR Beat scores taps at 110 a minute; the 2-Minute Drill times the family with the
alarm sound; narration plays HAVYN's recordings; leaving a sim silences it; stars survive a restart.
Headless Chrome at iPhone size. Usage: python3 tests/e2e_v18.py"""
import functools, json, re, sys, threading, time
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SHOTS = ROOT / "tests" / "shots"; SHOTS.mkdir(parents=True, exist_ok=True)
results = []
def ok(name, cond, detail=""):
    results.append((name, bool(cond), str(detail))); print(("PASS " if cond else "FAIL ") + name + (" — " + str(detail) if detail else ""))
def until(fn, timeout=15, step=0.2):
    end = time.time() + timeout
    while time.time() < end:
        try:
            v = fn()
            if v: return v
        except Exception: pass
        time.sleep(step)
    return None

class Q(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
PORT = 8792
srv = ThreadingHTTPServer(("127.0.0.1", PORT), functools.partial(Q, directory=str(ROOT / "app")))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d/" % PORT

with sync_playwright() as p:
    br = p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
    ctx = br.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    ctx.add_init_script("window.__HAVYN_NO_INTRO = true; window.__HAVYN_SIM_FAST = true;")
    pg = ctx.new_page(); errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(BASE + "#/status"); pg.wait_for_selector(".simbanner")
    ev = pg.evaluate
    go = lambda h: ev("(h) => { location.hash = h; }", h)
    frame = lambda: ev("() => { const R = window.__HAVYN.sim; return R && !R.done ? { i: R.i, n: R.frames.length, scan: !!R.frames[R.i].scan, ok: (R.frames[R.i].choices || []).findIndex((c) => c.ok), bad: (R.frames[R.i].choices || []).findIndex((c) => !c.ok), sound: R.frames[R.i].sound || '', key: 's-' + R.id + '-' + R.order[R.i] } : null; }")
    def pick(right=True):
        f = frame(); pg.click('[data-act="sim-pick"][data-i="%d"]' % (f["ok"] if right else f["bad"]))
        until(lambda: ev("!!document.querySelector('.simwhy')"), 5)
    def play_through(misses=0):
        while True:
            f = frame()
            if not f: return
            if f["scan"]: pg.click('[data-act="sim-next"]')
            else:
                pick(right=misses <= 0); misses -= 1
                pg.click('[data-act="sim-next"]')
            time.sleep(0.15)
    said = lambda key: ev("(k) => { const V = window.HAVYN_VOICE.lines[k]; return V ? window.__HAVYN.clips.played.filter((t) => t === V.text).length : -1; }", key)

    # ---- Home ----
    nums = ev("() => [...document.querySelectorAll('.sec .lab b')].map((e) => e.textContent)")
    labs = ev("() => [...document.querySelectorAll('.sec .lab')].map((e) => e.textContent.toUpperCase())")
    ok("Home sections are 01 to 05, with 03 Train", nums == ["01", "02", "03", "04", "05"] and "TRAIN" in labs[2], labs)
    ok("Home: the Sim Lab banner", "SIM LAB" in pg.inner_text(".simbanner").upper())
    ev("location.hash = '#/quests'"); time.sleep(0.6)
    ok("Readiness has a Sim Lab quest worth 10", until(lambda: "Sim Lab: 0 of 3 run" in pg.inner_text("#app")) and ev("() => [...document.querySelectorAll('a.li')].some((e) => e.textContent.includes('Sim Lab') && /\\+10 XP/.test(e.textContent))"))

    # ---- hub ----
    go("#/sim"); pg.wait_for_selector(".simtile")
    ok("Hub: 11 sims in Train, Scan, Missions", ev("document.querySelectorAll('.simtile').length") == 11 and all(w in pg.inner_text("#app").upper() for w in ("TRAIN", "SCAN", "MISSIONS")))
    ok("Hub: every tile has its drawing", ev("() => [...document.querySelectorAll('.simtile')].every((t) => t.querySelector('svg.art path, svg.art circle, svg.art rect'))"))
    ok("Hub: score starts at 0 of 33", re.search(r"^0\s*of 33", pg.inner_text(".simscore"), re.I), pg.inner_text(".simscore"))
    pg.screenshot(path=str(SHOTS / "v18-hub.png"))

    # ---- a perfect mission ----
    pg.click('a.simtile[href="#/sim/m-collapse"]'); pg.wait_for_selector(".simq")
    ok("Mission opens on its scene line and drawing", "7:42 PM" in pg.inner_text(".simscene") and ev("!!document.querySelector('.simart svg.art')"))
    ok("Narration reads the question in HAVYN's voice", until(lambda: said("s-m-collapse-0") >= 1, 8), said("s-m-collapse-0"))
    f0 = frame(); pick(True)
    ok("Right answer: marked, explained, chimed", ev("!!document.querySelector('.sch.right') && document.querySelector('.simwhy.good') !== null"))
    ok("…and the explanation is read aloud", until(lambda: said("s-m-collapse-0-ok") >= 1, 8))
    pg.click('[data-act="sim-next"]'); play_through(0)
    ok("Five right: 3 stars, saved", until(lambda: ev("document.querySelectorAll('.bigstars i.on').length") == 3) and ev("window.__HAVYN.prefs.sim['m-collapse'].stars") == 3)
    ok("Debrief: score, best, missed, sources, next sim", all(w in pg.inner_text(".simend").upper() for w in ("SCORE", "BEST", "MISSED")) and "CPR Beat" in pg.inner_text(".simbar") and "American Heart Association" in pg.inner_text(".simsrc"))
    pg.screenshot(path=str(SHOTS / "v18-mission-end.png"))

    # ---- a mission with a miss ----
    go("#/sim/m-power"); until(lambda: frame())
    pick(False)
    ok("Wrong answer: shown wrong, the right one lit, explained", ev("!!document.querySelector('.sch.wrong') && !!document.querySelector('.sch.right') && !!document.querySelector('.simwhy.bad')") and "fridge" in pg.inner_text(".simwhy").lower())
    pg.screenshot(path=str(SHOTS / "v18-mission-miss.png"))
    pg.click('[data-act="sim-next"]'); play_through(0)
    ok("One miss: 2 stars", until(lambda: ev("document.querySelectorAll('.bigstars i.on').length") == 2) and ev("window.__HAVYN.prefs.sim['m-power'].stars") == 2)

    # ---- a scan ----
    go("#/sim/scan-scorpion"); pg.wait_for_selector(".scanbox")
    ok("Scan: four labels on the drawing", ev("document.querySelectorAll('.scanbox .mark').length") == 4 and "Thin pincers" in pg.inner_text(".scanbox"))
    pg.click('[data-act="sim-uv"]')
    ok("UV light: the scorpion glows", ev("document.querySelector('.scanbox').classList.contains('uv')") and "UV" in pg.inner_text(".scantag"))
    pg.screenshot(path=str(SHOTS / "v18-scan-uv.png"))
    pg.click('[data-act="sim-next"]'); until(lambda: frame() and not frame()["scan"])
    ok("Picture choices: two drawings to choose from", ev("document.querySelectorAll('.simch.arty .sch svg.art').length") == 2)
    pick(True); pg.click('[data-act="sim-next"]'); play_through(0)
    ok("Scan done: 3 stars", until(lambda: ev("window.__HAVYN.prefs.sim['scan-scorpion'] && window.__HAVYN.prefs.sim['scan-scorpion'].stars") == 3))

    # ---- Alarm ID ----
    go("#/sim/alarm-id"); until(lambda: frame())
    heard = []
    for k in range(3):
        f = until(lambda: frame())
        ok("Alarm ID %d: the alarm plays by itself and is drawn" % (k + 1), until(lambda: ev("window.__HAVYN.alarm.last && window.__HAVYN.alarm.last.kind") == f["sound"], 5) and ev("document.querySelector('.wave').classList.contains('go')"), f["sound"])
        bars = ev("document.querySelectorAll('.wave rect').length"); heard.append((f["sound"], bars))
        pick(True); pg.click('[data-act="sim-next"]')
    ok("Smoke: 3 long beeps twice; CO: 4 short beeps twice; low battery: one chirp", sorted(heard) == [("chirp", 1), ("t3", 6), ("t4", 8)], heard)
    ok("Alarm ID: 3 stars", until(lambda: ev("window.__HAVYN.prefs.sim['alarm-id'].stars") == 3))
    go("#/sim/alarm-id"); ev("() => document.querySelector('[data-act=sim-again]') && document.querySelector('[data-act=sim-again]').click()")
    until(lambda: ev("window.__HAVYN.alarm.nodes.length > 0"), 4)
    go("#/status")
    ok("Leaving a sim silences it", until(lambda: ev("window.__HAVYN.alarm.nodes.length === 0 && !window.__HAVYN.clips.src"), 5))

    # ---- CPR Beat ----
    go("#/sim/cpr-beat"); pg.wait_for_selector(".beatart")
    ok("CPR Beat: chest, pace gauge, target 100 to 120", ev("!!document.querySelector('.beatart svg.art') && !!document.querySelector('.gauge .gzone')") and "100–120" in pg.inner_text(".beatstats"))
    pg.click('[data-act="beat-go"]')
    until(lambda: ev("window.__HAVYN.sim.beat.phase === 'run'"), 6)
    ev("() => { let n = 0; const t = setInterval(() => { const b = document.querySelector('.beatart'); if (!b || ++n > 11) return clearInterval(t); b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); }, 545); }")
    time.sleep(1.8)
    live = ev("() => [document.querySelector('#bpm').textContent, document.querySelector('#beatcall').textContent, document.querySelector('#needle').style.transform]")
    ok("While pushing: the pace shows live and says Good at 110", re.match(r"^1[01]\d$", live[0] or "") and live[1] == "Good" and "rotate" in live[2], live)
    done = until(lambda: ev("window.__HAVYN.sim.beat.phase === 'done' ? window.__HAVYN.sim.beat : null"), 12)
    ok("Steady 110 a minute: most pushes in the zone, 3 stars", done and done["pct"] >= 75 and done["stars"] == 3 and 100 <= done["avg"] <= 120, done and (done["pct"], done["avg"], done["stars"]))
    ok("Debrief keeps the real-CPR tip", "2 in" in pg.inner_text(".simtip") or "2 in deep" in pg.inner_text("#app"))
    pg.screenshot(path=str(SHOTS / "v18-beat-end.png"))

    # ---- 2-Minute Drill ----
    go("#/sim/escape"); pg.wait_for_selector(".drillbox")
    ok("Drill: suggests a meeting place when none is set", "meeting place" in pg.inner_text(".simhint").lower())
    pg.click('[data-act="drill-go"]')
    ok("Drill running: the smoke alarm sounds", until(lambda: ev("window.__HAVYN.alarm.loopT !== 0 && window.__HAVYN.alarm.last.kind === 't3'"), 4))
    time.sleep(1.6)
    ok("…and the clock runs", ev("document.querySelector('#dtime').textContent") in ("0:01", "0:02"))
    pg.click('[data-act="drill-stop"]')
    ok("Stop: under 2 minutes is 3 stars, the alarm stops, the time is kept", until(lambda: ev("window.__HAVYN.prefs.sim.escape && window.__HAVYN.prefs.sim.escape.stars") == 3) and ev("window.__HAVYN.alarm.loopT") == 0 and ev("window.__HAVYN.prefs.sim.escape.time") <= 3)
    ok("Drill debrief: tips from the fire marshal", "twice a year" in pg.inner_text(".simtips").lower())

    # ---- progress ----
    go("#/quests"); time.sleep(0.6)
    ok("Three or more sims run: the quest is complete", "Sim Lab: 3 of 3 run" in pg.inner_text("#app"))
    pg.reload(); pg.wait_for_selector("#app"); go("#/sim"); pg.wait_for_selector(".simtile")
    stars = ev("Number(document.querySelector('.simscore b').textContent)")
    ok("Stars survive a restart (3 + 2 + 3 + 3 + 3 + 3 = 17)", stars == 17, stars)
    ok("Hub tiles show stars and the drill's best time", ev("document.querySelectorAll('.simtile.done').length") == 6 and "Best 0:0" in pg.inner_text('a.simtile[href="#/sim/escape"]'))
    go("#/status"); pg.wait_for_selector(".simbanner")
    ok("Home banner shows the progress", "6 of 11 run" in pg.inner_text(".simbanner") and "17" in pg.inner_text(".simbanner"))
    ok("No errors on the page", not errors, errors[:3])
    br.close()

srv.shutdown()
(ROOT / "tests" / "e2e_v18_results.json").write_text(json.dumps([{"name": n, "pass": c, "detail": d} for n, c, d in results], indent=1))
bad = [r for r in results if not r[1]]
print("\n%d passed, %d failed" % (len(results) - len(bad), len(bad)))
sys.exit(1 if bad else 0)
