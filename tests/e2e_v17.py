"""v1.7 end-to-end checks. The voice guide reads each emergency-card step aloud in HAVYN's recorded voice as it comes up,
repeats it, switches off and on, and stops when the card closes; every recording is saved for use with no internet, and
one that goes missing is saved again the next time it plays online. The log for responders stamps the time of what was
done, runs a live timer that warns when the card's wait is up, pairs a seizure's start with its end, logs a call to 911,
survives a restart, and clears only with a second tap. Home's status line and numbered sections.
Headless Chrome at iPhone size. Usage: python3 tests/e2e_v17.py"""
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
PORT = 8791
srv = ThreadingHTTPServer(("127.0.0.1", PORT), functools.partial(Q, directory=str(ROOT / "app")))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d/" % PORT

with sync_playwright() as p:
    br = p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
    ctx = br.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    ctx.add_init_script("window.__HAVYN_NO_INTRO = true;")
    pg = ctx.new_page(); errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(BASE + "#/status"); pg.wait_for_selector(".strip")
    ev = pg.evaluate
    said = lambda key: ev("(k) => { const V = window.HAVYN_VOICE.lines[k]; return V ? window.__HAVYN.clips.played.filter((t) => t === V.text).length : -1; }", key)

    # ---- Home: status line and numbered sections ----
    labels = ev("() => [...document.querySelectorAll('.strip .sc small')].map((e) => e.textContent.toLowerCase())")
    ok("Home status line: offline, stored, backup, network", labels == ["offline", "stored", "backup", "network"], labels)
    ok("Home status line: storage on this phone fills in", until(lambda: re.search(r"\d+ (KB|MB|GB)", ev("document.querySelector('#stuse').textContent"))), ev("document.querySelector('#stuse').textContent"))
    ok("Home status line: no Memory Card yet reads Never (amber)", ev("(() => { const c = [...document.querySelectorAll('.strip .sc')][2]; return c.classList.contains('warn') && c.textContent.includes('Never'); })()"))
    nums = ev("() => [...document.querySelectorAll('.sec .lab b')].map((e) => e.textContent)")
    ok("Home sections are numbered 01 to 05", nums == ["01", "02", "03", "04", "05"], nums)
    ok("Know-how tiles say short things (nothing cut off)", ev("() => [...document.querySelectorAll('.mt small')].every((e) => e.scrollHeight <= e.clientHeight + 1)"))
    pg.screenshot(path=str(SHOTS / "v17-home.png"))

    # ---- the voice guide ----
    VG = ev("() => Object.keys((window.HAVYN_VOICE || {}).lines || {}).filter((k) => k.startsWith('c-')).length")
    steps = ev("() => window.__HAVYN.C.cards.reduce((n, c) => n + c.steps.length, 0)")
    ok("Every card step ships with its recording", VG == steps, "%d of %d" % (VG, steps))
    pg.click(".sostile"); pg.wait_for_selector(".emgrid")
    pg.click('a.emtile[href="#/emergency/cpr"]'); pg.wait_for_selector(".emvrow")
    ok("Opening a card reads step 1 aloud in HAVYN's voice", until(lambda: said("c-cpr-0") == 1), said("c-cpr-0"))
    ok("Voice guide is on by default, with Repeat", ev("document.querySelector('.emvoice').classList.contains('on') && !!document.querySelector('[data-act=card-say]')"))
    pg.click('[data-act="step-next"]')
    ok("Next reads step 2", until(lambda: said("c-cpr-1") == 1), said("c-cpr-1"))
    ok("…and it is playing", until(lambda: ev("!!window.__HAVYN.clips.src")))
    pg.click('[data-act="card-say"]')
    ok("Repeat reads the step again", until(lambda: said("c-cpr-1") == 2), said("c-cpr-1"))
    pg.click('[data-act="card-voice"]')
    ok("Voice guide switches off (and stops talking)", until(lambda: ev("window.__HAVYN.prefs.cardVoice === false && !window.__HAVYN.clips.src && !document.querySelector('[data-act=card-say]')")) and "off" in pg.inner_text(".emvoice").lower())
    pg.click('[data-act="step-next"]'); time.sleep(1.5)
    ok("Off means quiet on the next step", said("c-cpr-2") == 0, said("c-cpr-2"))
    pg.click('[data-act="card-voice"]')
    ok("Switching it back on reads the current step", until(lambda: said("c-cpr-2") == 1), said("c-cpr-2"))
    ok("Opening another card reads its first step", (ev("location.hash = '#/emergency/choking'") or True) and until(lambda: said("c-choking-0") == 1))
    ev("location.hash = '#/status'")
    ok("Leaving the cards stops the voice", until(lambda: ev("!window.__HAVYN.clips.src")))
    ok("No card log without a time button (Choking has none)", (ev("location.hash = '#/emergency/choking'") or True) and until(lambda: ev("!!document.querySelector('.emstep')")) and not ev("!!document.querySelector('.emlog')"))

    # ---- recordings saved for no internet ----
    cached = until(lambda: ev("""async () => { const k = (await caches.keys()).find((x) => x.startsWith('havyn-field-')); if (!k) return 0;
      const c = await caches.open(k); return (await c.keys()).filter((r) => /\\/voice\\//.test(r.url)).length; }""") >= VG, timeout=30)
    ok("All recordings are saved with the app", cached, ev("""async () => { const k = (await caches.keys()).find((x) => x.startsWith('havyn-field-')); const c = await caches.open(k); return (await c.keys()).filter((r) => /\\/voice\\//.test(r.url)).length; }"""))
    ctx.set_offline(True)
    n = ev("() => fetch('./voice/c/c-seizure-3.mp3?offline').then((r) => (r.ok ? r.arrayBuffer() : null)).then((b) => (b ? b.byteLength : 0)).catch(() => -1)")
    ok("With no internet, a card step's recording still plays (from the phone)", n > 2000, n)
    ctx.set_offline(False)
    healed = ev("""async () => { const k = (await caches.keys()).find((x) => x.startsWith('havyn-field-')), c = await caches.open(k);
      await c.delete('./voice/c/c-bleeding-0.mp3'); const gone = !(await c.match('./voice/c/c-bleeding-0.mp3'));
      const r = await fetch('./voice/c/c-bleeding-0.mp3?abc'); await r.arrayBuffer();
      for (let i = 0; i < 30; i++) { if (await c.match('./voice/c/c-bleeding-0.mp3')) return gone; await new Promise((s) => setTimeout(s, 100)); } return false; }""")
    ok("A recording that went missing is saved again when it next plays online", healed)

    # ---- the log for responders ----
    ev("location.hash = '#/emergency/cpr'"); pg.wait_for_selector(".emlog")
    ok("Opening a card doesn't start a log by itself", ev("window.__HAVYN.incident === null"))
    ev("location.hash = '#/emergency/seizure'"); until(lambda: ev("document.querySelectorAll('.emmark').length === 2"))
    ok("Seizure card has its two time buttons", pg.inner_text(".emlog").count("Tap when it happens") == 2)
    pg.click('[data-w="Seizure started"]')
    evs = ev("window.__HAVYN.incident && window.__HAVYN.incident.ev.map((e) => e.w)")
    ok("A tap stamps the time (and when the card was opened)", evs == ["Opened the Seizure card", "Seizure started"], evs)
    t1 = ev("document.querySelector('.emmark [data-since]').textContent"); time.sleep(2.2)
    t2 = ev("document.querySelector('.emmark [data-since]').textContent")
    ok("The timer runs", t1 != t2 and re.match(r"^\d+:\d\d$", t2 or ""), (t1, t2))
    ok("No warning before the card's 5 minutes", ev("!document.querySelector('.emmark.due')"))
    ev("() => { window.__HAVYN.incident.ev.forEach((e) => (e.t -= 320000)); }")
    ev("location.hash = '#/emergency/log'"); time.sleep(0.3); ev("history.back()")
    ok("After 5 minutes the button warns, in the card's own words", until(lambda: ev("!!document.querySelector('.emmark.due')")) and "Over 5 minutes: call 911" in pg.inner_text(".emmark.due"))
    pg.screenshot(path=str(SHOTS / "v17-seizure-due.png"))
    pg.click('[data-w="Seizure stopped"]')
    ok("Stopping shows how long it lasted, and the warning goes", until(lambda: re.search(r"lasted 5:\d\d", pg.inner_text(".emlog"))) and ev("!document.querySelector('.emmark.due')"), pg.inner_text(".emlog")[:160])
    ev("""() => document.addEventListener('click', (e) => { if (e.target.closest('a[href^="tel:"]')) e.preventDefault(); }, true)""")
    pg.click(".emtop .call")
    ok("Calling 911 from a card goes in the log", until(lambda: "Called 911" in ev("window.__HAVYN.incident.ev.map((e) => e.w)")))
    pg.click(".emlogl"); pg.wait_for_selector(".loglist")
    rows = ev("() => [...document.querySelectorAll('.loglist li')].map((li) => li.innerText.replace(/\\s+/g, ' '))")
    ok("The log lists every entry in order", len(rows) == 4 and "Opened the Seizure card" in rows[0] and "Seizure started" in rows[1] and re.search(r"Seizure stopped lasted 5:\d\d", rows[2]) and "Called 911" in rows[3], rows)
    ok("…with the time since the first entry", re.search(r"\+5:\d\d", rows[2] or "") is not None)
    pg.screenshot(path=str(SHOTS / "v17-log.png"))
    ev("location.hash = '#/emergency'")
    ok("All cards: the log is one tap away", until(lambda: "4 entries" in pg.inner_text(".emlogbar")))
    pg.reload(); pg.wait_for_selector(".emgrid")
    ok("The log survives closing the app", until(lambda: ev("!!document.querySelector('.emlogbar')")) and ev("window.__HAVYN.incident.ev.length") == 4)
    pg.click(".emlogbar"); pg.wait_for_selector(".loglist")
    pg.click('[data-act="inc-clear"]')
    ok("Clear asks for a second tap", "TAP AGAIN" in pg.inner_text('[data-act="inc-clear"]') and ev("window.__HAVYN.incident !== null"))
    pg.click('[data-act="inc-clear"]')
    ok("…then clears it", until(lambda: ev("window.__HAVYN.incident === null && location.hash === '#/emergency' && !document.querySelector('.emlogbar')")))
    ok("No errors on the page", not errors, errors[:3])
    br.close()

srv.shutdown()
(ROOT / "tests" / "e2e_v17_results.json").write_text(json.dumps([{"name": n, "pass": c, "detail": d} for n, c, d in results], indent=1))
bad = [r for r in results if not r[1]]
print("\n%d passed, %d failed" % (len(results) - len(bad), len(bad)))
sys.exit(1 if bad else 0)
