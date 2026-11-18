#!/usr/bin/env python3
"""HAVYN offline maps: cut the map packs, gather the places that matter in an emergency, and vendor the map renderer.
Runs in GitHub Actions (.github/workflows/maps.yml), which can reach the sources:
    python3 tools/maps_build.py probe     # sizes only (pmtiles extract --dry-run), nothing written
    python3 tools/maps_build.py packs     # cut maps/packs.json into out/*.pmtiles + out/maps-index.json (for the "maps" release)
    python3 tools/maps_build.py places    # emergency places and place names from OpenStreetMap (Overpass) into src/maps/places.json
Map data: Protomaps basemap daily build (OpenStreetMap, ODbL). Places: OpenStreetMap via the Overpass API (ODbL)."""
import datetime, hashlib, json, os, subprocess, sys, time, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UA = "HAVYN-maps/1.0 (+https://github.com/hourglazlabs-x/havyn)"
CFG = json.loads((ROOT / "maps" / "packs.json").read_text())
PMT = os.environ.get("PMTILES", "pmtiles")

def head_ok(url):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, method="HEAD", headers={"User-Agent": UA}), timeout=30) as r: return r.status == 200
    except Exception: return False

def latest_build():
    d = datetime.datetime.now(datetime.timezone.utc).date()
    for i in range(10):
        day = (d - datetime.timedelta(days=i)).strftime("%Y%m%d"); url = "https://build.protomaps.com/%s.pmtiles" % day
        if head_ok(url): return day, url
    raise SystemExit("no Protomaps build found in the last 10 days")

def extract(url, pack, out, maxzoom=None, dry=False):
    b = ",".join(str(x) for x in pack["bbox"])
    cmd = [PMT, "extract", url, str(out), "--bbox=" + b, "--maxzoom=%d" % (maxzoom if maxzoom is not None else pack["maxzoom"]), "--download-threads=8"]
    if dry: cmd.append("--dry-run")
    r = subprocess.run(cmd, capture_output=True, text=True)
    print((r.stdout + r.stderr).strip()[-600:])
    if r.returncode: raise SystemExit("extract failed for %s" % pack["id"])

def probe():
    day, url = latest_build(); print("build", day, url)
    for p in CFG["packs"]:
        for z in sorted({p["maxzoom"] - 1, p["maxzoom"], p["maxzoom"] + 1}):
            print("== %s maxzoom %d" % (p["id"], z)); extract(url, p, "/tmp/x.pmtiles", z, dry=True)

def sha(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""): h.update(b)
    return h.hexdigest()

def packs():
    day, url = latest_build(); out = ROOT / "out"; out.mkdir(exist_ok=True); items = []
    for p in CFG["packs"]:
        f = out / ("%s-%s.pmtiles" % (p["id"], day)); extract(url, p, f)
        items.append(dict(p, file=f.name, size=f.stat().st_size, sha256=sha(f), data=day))
        print("%s %.1f MB" % (f.name, f.stat().st_size / 1e6))
    (out / "maps-index.json").write_text(json.dumps({"built": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"), "source": "Protomaps basemap daily build " + day + " (OpenStreetMap)", "packs": items}, indent=1))

OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"]
def overpass(q):
    for i in range(6):
        ep = OVERPASS[i % len(OVERPASS)]
        try:
            req = urllib.request.Request(ep, data=urllib.parse.urlencode({"data": q}).encode(), headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=300) as r: return json.loads(r.read().decode("utf-8"))
        except Exception as e:
            print("overpass", ep, e); time.sleep(20 * (i + 1))
    raise SystemExit("Overpass didn't answer")

# What each kind is, in OpenStreetMap terms. Order matters: the first match wins.
KINDS = [
    ("er", lambda t: t.get("amenity") == "hospital" and t.get("emergency") == "yes"),
    ("hospital", lambda t: t.get("amenity") == "hospital" or t.get("healthcare") == "hospital"),
    ("urgent", lambda t: t.get("healthcare") == "urgent_care" or "urgent care" in (t.get("name", "") + " " + t.get("healthcare:speciality", "")).lower().replace("_", " ")),
    ("aed", lambda t: t.get("emergency") == "defibrillator"),
    ("fire", lambda t: t.get("amenity") == "fire_station"),
    ("police", lambda t: t.get("amenity") == "police"),
    ("pharmacy", lambda t: t.get("amenity") == "pharmacy" or t.get("healthcare") == "pharmacy"),
    ("water", lambda t: t.get("amenity") == "drinking_water"),
    ("fuel", lambda t: t.get("amenity") == "fuel"),
]
def kind(t):
    for k, f in KINDS:
        if f(t): return k
    return ""

def places():
    m = next(p for p in CFG["packs"] if p["id"] == "phoenix")["bbox"]; a = next(p for p in CFG["packs"] if p["id"] == "arizona")["bbox"]
    bb = lambda b: "%s,%s,%s,%s" % (b[1], b[0], b[3], b[2])
    q = """[out:json][timeout:240];
(
  nwr["amenity"~"^(hospital|fire_station|police|pharmacy|drinking_water|fuel)$"](%s);
  nwr["healthcare"~"^(hospital|urgent_care|pharmacy)$"](%s);
  nwr["amenity"="clinic"]["name"~"[Uu]rgent"](%s);
  node["emergency"="defibrillator"](%s);
  nwr["amenity"="hospital"](%s);
  nwr["amenity"="fire_station"](%s);
);
out center tags;""" % (bb(m), bb(m), bb(m), bb(m), bb(a), bb(a))
    d = overpass(q); pts, seen = [], set()
    for e in d.get("elements", []):
        t = e.get("tags", {}); k = kind(t)
        lat = e.get("lat") or (e.get("center") or {}).get("lat"); lon = e.get("lon") or (e.get("center") or {}).get("lon")
        if not k or lat is None: continue
        name = t.get("name") or t.get("brand") or ""
        if k in ("water", "aed") and not name: name = {"water": "Drinking water", "aed": "AED (defibrillator)"}[k]
        if not name: continue
        key = (k, name.lower(), round(lat, 3), round(lon, 3))
        if key in seen: continue
        seen.add(key)
        addr = " ".join(x for x in [t.get("addr:housenumber", ""), t.get("addr:street", "")] if x).strip()
        city = t.get("addr:city", "")
        pts.append([k, name, round(lat, 5), round(lon, 5), addr + (", " + city if addr and city else city if city else ""), t.get("phone") or t.get("contact:phone") or "", t.get("opening_hours", "")[:60]])
    q2 = """[out:json][timeout:180];
(
  node["place"~"^(city|town|village|suburb|neighbourhood|hamlet|locality)$"]["name"](%s);
  node["place"~"^(city|town|village)$"]["name"](%s);
);
out tags;""" % (bb(m), bb(a))
    d2 = overpass(q2); names, seen2 = [], set()
    for e in d2.get("elements", []):
        t = e.get("tags", {}); n = t.get("name", "")
        k = (n.lower(), round(e["lat"], 2), round(e["lon"], 2))
        if not n or k in seen2: continue
        seen2.add(k); names.append([t.get("place"), n, round(e["lat"], 5), round(e["lon"], 5)])
    out = {"built": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"), "license": "© OpenStreetMap contributors, ODbL 1.0",
           "fields": ["kind", "name", "lat", "lon", "address", "phone", "hours"], "pois": sorted(pts, key=lambda x: (x[0], x[1])),
           "placeFields": ["kind", "name", "lat", "lon"], "places": sorted(names, key=lambda x: x[1])}
    dest = ROOT / "src" / "maps"; dest.mkdir(parents=True, exist_ok=True)
    (dest / "places.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")))
    from collections import Counter
    print("places:", Counter(p[0] for p in pts), len(names), "place names", round((dest / "places.json").stat().st_size / 1e3), "KB")

if __name__ == "__main__":
    {"probe": probe, "packs": packs, "places": places}[sys.argv[1]]()
