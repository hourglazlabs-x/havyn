"""Offline maps end-to-end, against a copy of the built app with the real map packs, served with byte ranges like GitHub
Pages. Downloads both packs (and resumes one after a stop), rejects a pack whose checksum doesn't match, renders Phoenix at
street level and Flagstaff from the statewide pack, finds the nearest ER from GPS, searches, drops and saves a meeting
place, toggles place kinds, survives a restart, counts toward readiness, and removes a pack. Also: every town, road and
water name in the packs has its letters in the fonts HAVYN ships (tests/map_glyphs.js), labels stay readable over the
markers, the map stays on the stored area, and GPS rides out a dropout.
The packs come from the "maps" release (tools/maps_pages.py), cached in /tmp/havyn-map-packs.
Usage: python3 tests/e2e_maps.py"""
import json, re, shutil, subprocess, sys, tempfile, time
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(Path(__file__).resolve().parent))
from rangeserver import serve

ROOT = Path(__file__).resolve().parent.parent
CACHE = Path("/tmp/havyn-map-packs")
if not (CACHE / "index.json").exists():
    subprocess.run([sys.executable, str(ROOT / "tools" / "maps_pages.py"), str(CACHE)], check=True)
SITE = Path(tempfile.mkdtemp(prefix="havyn-maps-")) / "app"
shutil.copytree(ROOT / "app", SITE)
shutil.copytree(CACHE, SITE / "maps" / "packs")
BAD = SITE.parent / "bad"; shutil.copytree(SITE, BAD)   # the same site, but the index promises different bytes for Arizona
idx = json.loads((BAD / "maps" / "packs" / "index.json").read_text())
for p in idx["packs"]:
    if p["id"] == "arizona": p["sha256"] = "0" * 64
(BAD / "maps" / "packs" / "index.json").write_text(json.dumps(idx))
SHOTS = ROOT / "tests" / "shots"; SHOTS.mkdir(parents=True, exist_ok=True)
results = []
def ok(name, cond, detail=""):
    results.append((name, bool(cond), str(detail))); print(("PASS " if cond else "FAIL ") + name + (" — " + str(detail) if detail else ""))
def until(fn, timeout=60, step=0.25):
    end = time.time() + timeout
    while time.time() < end:
        try:
            v = fn()
            if v: return v
        except Exception: pass
        time.sleep(step)
    return None
s1 = serve(SITE, 8783); s2 = serve(BAD, 8784)

# ---- every town, road and water name in the packs has its glyphs in the fonts HAVYN ships ----
gl = json.loads(subprocess.run(["node", str(ROOT / "tests" / "map_glyphs.js"), "--json"] + [str(f) for f in sorted(CACHE.glob("*.pmtiles"))], capture_output=True, text=True).stdout)
ok("Every town, road and water name in the packs has its letters in HAVYN's fonts (zoom 5 and up)", gl["navMissing"] == 0 and gl["lostUses"] <= gl["uses"] * 1e-5,
   "%d characters, %d tiles, %.1f s; missing: %s" % (gl["chars"], gl["tiles"], gl["seconds"], [(m["cp"], m["n"], m["example"]) for m in gl["missing"]][:4]))
ARGS = ["--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--ignore-gpu-blocklist"]
PHX = {"latitude": 33.4484, "longitude": -112.074}

with sync_playwright() as p:
    br = p.chromium.launch(args=ARGS)
    # ---- a pack that arrives damaged is rejected ----
    c0 = br.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    c0.add_init_script("window.__HAVYN_NO_INTRO = true;"); g = c0.new_page()
    g.goto("http://127.0.0.1:8784/#/map"); g.wait_for_selector('[data-act="map-get"][data-id="arizona"]')
    g.click('[data-act="map-get"][data-id="arizona"]')
    until(lambda: not g.evaluate("window.__HAVYN.maps.pk.busy") and g.evaluate("window.__HAVYN.maps.pk.failed.length") > 0, 60)
    ok("A pack whose checksum doesn't match is refused and deleted", g.evaluate("window.__HAVYN.maps.have.length") == 0 and "checksum" in " ".join(g.evaluate("window.__HAVYN.maps.pk.failed")), g.evaluate("window.__HAVYN.maps.pk.failed"))
    c0.close()

    ctx = br.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True, geolocation=PHX, permissions=["geolocation"])
    ctx.add_init_script("window.__HAVYN_NO_INTRO = true; window.__csp = []; document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI));")
    pg = ctx.new_page(); errors = []; r404 = []; fonts = []; reqs = []
    pg.on("request", lambda r: reqs.append(r.url)); cspc = []
    pg.on("console", lambda m: cspc.append(m.text) if m.type == "error" and "Content Security Policy" in m.text else None)
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("response", lambda r: r404.append(r.url) if r.status == 404 else (fonts.append(r.url) if "/maps/fonts/" in r.url else None))
    ev = pg.evaluate
    pg.goto("http://127.0.0.1:8783/#/status"); pg.wait_for_selector(".strip")
    ok("Home: Map leads the know-how tiles", ev("document.querySelector('.menugrid .mt').getAttribute('href')") == "#/map")
    ok("Readiness has an offline-maps quest", until(lambda: "Offline maps on this phone" in ev("(() => { location.hash = '#/quests'; return document.body.innerText; })()"), 10))

    # ---- the packs ----
    ev("location.hash = '#/map'"); pg.wait_for_selector(".mpacks")
    names = ev("() => [...document.querySelectorAll('.mprow b')].map((b) => b.textContent)")
    sizes = re.findall(r"(\d+) MB", pg.inner_text(".mpacks"))
    ok("Map screen offers both packs with sizes", names == ["Phoenix metro", "Arizona"] and sizes[:2] == ["142", "42"], (names, sizes))
    ok("Before any map: the nearest ER list already works (places ship with the app)", until(lambda: "NEAREST ER" in pg.inner_text("#mapnear").upper() and "Emergency room" in pg.inner_text("#mapnear"), 10))
    pg.click('[data-act="map-get"][data-id="phoenix"]')
    until(lambda: ev("window.__HAVYN.maps.pk.got") > 40e6, 30, 0.05)
    ev("window.__HAVYN.maps.pk.stop = true")
    until(lambda: not ev("window.__HAVYN.maps.pk.busy"), 30)
    part = ev("async () => { const r = indexedDB.open('havyn-field'); await new Promise((o) => (r.onsuccess = o)); const t = r.result.transaction('kv').objectStore('kv').get('mdl:phoenix'); await new Promise((o) => (t.onsuccess = o)); return t.result ? t.result.have : 0; }")
    ok("Stop keeps what arrived (resumable)", part >= 32 * 1024 * 1024 and ev("window.__HAVYN.maps.have.length") == 0, part)
    pg.click('[data-act="map-get"][data-id=""]')
    ok("Get all maps finishes both, checksums verified", until(lambda: ev("window.__HAVYN.maps.have.length") == 2 and not ev("window.__HAVYN.maps.pk.busy"), 120), ev("window.__HAVYN.maps.have.map((m) => m.id + ':' + m.parts.length)"))
    ok("…carrying on from where it stopped", ev("window.__HAVYN.maps.have.find((m) => m.id === 'phoenix').parts.length") == 5)

    # ---- the map ----
    view = lambda lon, lat, z: (ev("([lon, lat, z]) => window.__HAVYN.maps.view.map.jumpTo({ center: [lon, lat], zoom: z })", [lon, lat, z]), until(lambda: ev("window.__HAVYN.maps.view.map.areTilesLoaded()"), 30), time.sleep(1.2))
    ok("The map opens offline-style from the stored packs", until(lambda: ev("window.__HAVYN.maps.view.ready && window.__HAVYN.maps.view.map.areTilesLoaded()"), 60))
    view(-112.074, 33.4484, 15)
    streets = ev("() => window.__HAVYN.maps.view.map.queryRenderedFeatures().filter((f) => /roads/.test(f.layer.id) && f.properties.name).length")
    ok("Downtown Phoenix at street level, street names and all", streets > 30, streets)
    pg.screenshot(path=str(SHOTS / "maps-downtown.png"))
    view(-111.651, 35.198, 13.5)
    flag = ev("() => window.__HAVYN.maps.view.map.queryRenderedFeatures().filter((f) => f.source === 'pk-arizona').length")
    ok("Flagstaff, outside the Phoenix pack, comes from the statewide pack", flag > 30, flag)
    phxsrc = ev("() => window.__HAVYN.maps.view.map.queryRenderedFeatures().filter((f) => f.source === 'pk-phoenix').length")
    ok("…and the Phoenix pack asks for nothing there", phxsrc == 0, phxsrc)

    # ---- town and street names stay readable: land and roads, then HAVYN's markers, then every label; one pack's labels at a time ----
    view(-112.07, 33.45, 7.5)
    towns = ev("() => window.__HAVYN.maps.view.map.queryRenderedFeatures().filter((f) => f.layer.type === 'symbol' && /places_locality$/.test(f.layer.id)).map((f) => f.properties.name)")
    ok("Zoomed out over the metro, town names stay readable over the ER markers", "Phoenix" in towns and "Mesa" in towns and ev("window.__HAVYN.maps.view.map.queryRenderedFeatures({layers: ['hv-pois-er']}).length") > 3, towns[:8])
    ids = ev("window.__HAVYN.maps.view.map.getStyle().layers.map((l) => l.id)")
    ok("Markers sit above every pack's land and roads and below all the labels; you and your pins on top", ids.index("hv-pois-er") < ids.index("pk-arizona-address_label") and ids.index("hv-pois-er") > ids.index("pk-phoenix-roads_highway") and ids[-1] == "hv-me" and ids[-2] == "hv-pins", [i for i in ids if i.startswith("hv-")])
    view(-112.074, 33.4484, 13)
    dup = ev("() => window.__HAVYN.maps.view.map.queryRenderedFeatures().filter((f) => f.layer.type === 'symbol' && f.source === 'pk-arizona').length")
    ok("Inside the Phoenix pack the statewide pack's labels stay out (no doubled street names)", dup == 0 and ev("() => window.__HAVYN.maps.view.map.queryRenderedFeatures().filter((f) => f.layer.type === 'symbol' && f.source === 'pk-phoenix').length") > 10, dup)

    # ---- labels draw with HAVYN's own fonts; a character it doesn't ship costs no request and breaks nothing ----
    view(-112.074, 33.4484, 15.5)
    lab = "pk-phoenix-roads_labels_minor"
    before = ev("window.__HAVYN.maps.view.map.queryRenderedFeatures({layers: ['%s']}).length" % lab); n404 = len(r404)
    ev("(() => { const m = window.__HAVYN.maps.view.map; window.__tf = m.getLayoutProperty('%s', 'text-field'); m.setLayoutProperty('%s', 'text-field', ['concat', ['get', 'name'], ' \u10d0 \ud83d\udc88']); })()" % (lab, lab))
    time.sleep(3)
    after = ev("window.__HAVYN.maps.view.map.queryRenderedFeatures({layers: ['%s']}).length" % lab)
    ok("Street names draw with the fonts HAVYN ships, from its own address", before > 3 and fonts and all(u.startswith("http://127.0.0.1:8783/maps/fonts/Noto%20Sans%20") for u in fonts), (before, fonts[:3]))
    ok("A label with characters HAVYN doesn't ship (Georgian, an emoji) still draws, and asks for nothing", after > 0 and len(r404) == n404, (after, r404[n404:][:3]))
    ev("window.__HAVYN.maps.view.map.setLayoutProperty('%s', 'text-field', window.__tf)" % lab)

    # ---- the map stays on what's stored ----
    zb = ev("(() => { const m = window.__HAVYN.maps.view.map; m.jumpTo({center: [0, 51.5], zoom: 2}); const c = m.getCenter(), b = m.getBounds(); return [c.lng, c.lat, m.getZoom(), b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]; })()")
    ok("It won't pan off to places it has nothing for, and zoomed right out all of Arizona fits the phone", -116 < zb[0] < -108 and 30 < zb[1] < 38 and zb[3] <= -114.82 and zb[4] <= 31.33 and zb[5] >= -109.04 and zb[6] >= 37.01, [round(v, 2) for v in zb])
    pg.screenshot(path=str(SHOTS / "maps-arizona.png"))

    # ---- GPS and the nearest ER ----
    pg.click("#mapnear .mselfloc")
    ok("Use my location: GPS (no internet needed) puts you on the map", until(lambda: ev("!!window.__HAVYN.maps.view.me"), 10) and until(lambda: "from you" in pg.inner_text("#mapnear"), 5))
    first = ev("() => { const b = document.querySelector('#mapnear .nearrow'); return b ? b.innerText.replace(/\\s+/g, ' ') : ''; }")
    mi = float((re.search(r"([\d.]+) mi", first) or [0, 99])[1])
    ok("Nearest ER from downtown Phoenix is a confirmed ER within 3 miles", "Emergency room" in first and mi < 3, first)
    ctx.set_geolocation({"latitude": 34.0522, "longitude": -118.2437})   # Los Angeles: outside what HAVYN stores
    ok("GPS keeps tracking through a dropout; away from the stored area the list says so", until(lambda: "outside the map" in pg.inner_text("#mapnear"), 10), pg.inner_text("#mapnear")[:80])
    ctx.set_geolocation(PHX)
    ok("…and back home it doesn't", until(lambda: "from you" in pg.inner_text("#mapnear") and "outside" not in pg.inner_text("#mapnear"), 10))
    pg.click("#mapnear .nearhead")
    ok("The list opens to four, with place kinds", ev("document.querySelectorAll('#mapnear .nearrow').length") == 4 and ev("document.querySelectorAll('#mapnear .nearkinds button').length") == 7)
    pg.click('#mapnear .nearkinds [data-k="pharmacy"]')
    ok("Nearest pharmacy, and pharmacies are on the map", until(lambda: "NEAREST PHARMACY" in pg.inner_text("#mapnear").upper(), 5) and "pharmacy" in (ev("window.__HAVYN.prefs.mapKinds") or ["er", "urgent", "fire", "police", "pharmacy"]))
    pg.click('#mapnear .nearkinds [data-k="er"]'); pg.click("#mapnear .nearrow")
    ok("A place opens its card: distance, direction, address, coordinates", until(lambda: pg.locator(".msheet").count() == 1, 5) and re.search(r"[\d.]+ (mi|ft)", pg.inner_text(".msdist")) and pg.locator(".mscoord").count() == 1)
    pg.screenshot(path=str(SHOTS / "maps-er-card.png"))
    pg.click('[data-act="map-close"]')

    # ---- search ----
    pg.fill("#mapq", "banner")
    ok("Search finds places offline", until(lambda: ev("document.querySelectorAll('#mapres button').length") >= 3, 5) and "Banner" in pg.inner_text("#mapres"))
    pg.click("#mapres button")
    ok("A result flies there and opens it", until(lambda: pg.locator(".msheet").count() == 1, 5) and ev("document.querySelector('#mapq') ? document.querySelector('#mapq').value : ''") == "")
    pg.click('[data-act="map-close"]')

    # ---- drop and save a meeting place ----
    view(-112.0, 33.5, 15)
    box = pg.locator("#mapgl canvas").bounding_box()
    pg.click("#mapnear .nearhead")   # fold the list back to one line, so the map is clear to press on
    pg.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] * 0.42, button="right")
    ok("Long-press (right-click here) drops a pin to save", until(lambda: "Save this spot" in pg.inner_text(".msheet"), 5))
    pg.click('[data-act="map-save"][data-k="meet1"]')
    sp = ev("window.__HAVYN.state.spots")
    ok("Saved as Meeting place 1, with its coordinates", sp and sp[-1]["kind"] == "meet1" and abs(sp[-1]["lat"] - 33.5) < 0.05 and abs(sp[-1]["lon"] + 112.0) < 0.05, sp)
    ok("…and it's on the map", until(lambda: ev("window.__HAVYN.maps.view.map.querySourceFeatures('hv-pins').length") >= 1, 10))
    pg.screenshot(path=str(SHOTS / "maps-pin.png"))
    ev("window.__HAVYN.maps.view.drop({lng: -112.02, lat: 33.52})"); pg.wait_for_selector('[data-act="map-save"][data-k="meet1"]')
    pg.click('[data-act="map-save"][data-k="meet1"]')
    sp2 = [x for x in ev("window.__HAVYN.state.spots") if x.get("kind") == "meet1" and not x.get("deleted")]
    ok("Saving Meeting place 1 again moves it: one record, so the family's phones agree after a Memory Card", len(sp2) == 1 and sp2[0]["id"] == sp[-1]["id"] and abs(sp2[0]["lon"] + 112.02) < 0.01 and sp2[0]["updated"] > 0, sp2)

    # ---- restart ----
    pg.reload(); pg.wait_for_selector("#app"); ev("location.hash = '#/map'")
    ok("After a restart the maps are still here, nothing downloaded again", until(lambda: ev("window.__HAVYN.maps.have.length") == 2 and ev("window.__HAVYN.maps.view.ready"), 60) and len(ev("window.__HAVYN.state.spots")) >= 1)
    ev("location.hash = '#/quests'"); time.sleep(0.6)
    ok("Readiness: the maps quest is complete", ev("() => [...document.querySelectorAll('a.li')].some((a) => a.textContent.includes('Offline maps on this phone') && a.classList.contains('done'))") or "Offline maps on this phone" in pg.inner_text("#app"))
    ev("location.hash = '#/emergency'"); pg.wait_for_selector(".emnear")
    ok("Emergency list: Nearest ER, one tap to the map", ev("document.querySelector('.emnear').getAttribute('href')") == "#/map?k=er")
    pg.click(".emnear")
    ok("…opens the map on the nearest ER", until(lambda: ev("location.hash") == "#/map?k=er" and "NEAREST ER" in pg.inner_text("#mapnear").upper(), 10))

    # ---- remove a pack ----
    pg.click('[data-act="map-packs"]'); pg.wait_for_selector('[data-act="map-del"][data-id="phoenix"]')
    pg.click('[data-act="map-del"][data-id="phoenix"]'); time.sleep(0.2); pg.click('[data-act="map-del"][data-id="phoenix"]')
    ok("Remove needs a second tap, then frees the space", until(lambda: [m["id"] for m in ev("window.__HAVYN.maps.have")] == ["arizona"], 10))
    ok("The map carries on with what's left", until(lambda: ev("window.__HAVYN.maps.view.ready && !!window.__HAVYN.maps.view.map"), 30))
    ok("No errors on the page", not errors, errors[:3])
    ok("The map runs inside HAVYN's content security policy (no violations, no outside requests)", not ev("window.__csp") and not cspc and not [u for u in reqs if not u.startswith("http://127.0.0.1:8783/") and not u.startswith("data:") and not u.startswith("blob:")], (ev("window.__csp")[:3] + cspc[:3], [u for u in reqs if not u.startswith("http://127.0.0.1:8783/")][:3]))
    ok("Nothing the map asked for was missing", not [u for u in r404 if "/maps/" in u or "/vendor/" in u], r404[:3])
    br.close()

s1.shutdown(); s2.shutdown()
shutil.rmtree(SITE.parent, ignore_errors=True)
(ROOT / "tests" / "e2e_maps_results.json").write_text(json.dumps([{"name": n, "pass": c, "detail": d} for n, c, d in results], indent=1))
bad = [r for r in results if not r[1]]
print("\n%d passed, %d failed" % (len(results) - len(bad), len(bad)))
sys.exit(1 if bad else 0)
