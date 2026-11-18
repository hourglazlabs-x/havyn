#!/usr/bin/env python3
"""Serve the offline map packs from HAVYN's own address: copy the newest packs from the "maps" release into the Pages
site with index.json (name, area, zoom, exact size and SHA-256 of each), so phones download them with resumable range
requests from the same origin as the app. A pack whose bytes don't match the index is left out.
Runs in .github/workflows/pages.yml with the gh CLI signed in:  python3 tools/maps_pages.py app/maps/packs"""
import hashlib, json, os, subprocess, sys
from pathlib import Path

REPO = os.environ.get("GITHUB_REPOSITORY", "hourglazlabs-x/havyn")
dest = Path(sys.argv[1]); dest.mkdir(parents=True, exist_ok=True)
r = subprocess.run(["gh", "api", "repos/%s/releases/tags/maps" % REPO], capture_output=True, text=True)
if r.returncode:
    (dest / "index.json").write_text('{"packs":[]}')
    print("No map release yet: the app will say the maps aren't on its address yet."); sys.exit(0)
assets = {a["name"]: a for a in json.loads(r.stdout)["assets"]}

def fetch(name):
    with open(dest / name, "wb") as f:
        subprocess.run(["gh", "api", "-H", "Accept: application/octet-stream", "repos/%s/releases/assets/%d" % (REPO, assets[name]["id"])], stdout=f, check=True)

def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""): h.update(b)
    return h.hexdigest()

fetch("maps-index.json")
idx = json.loads((dest / "maps-index.json").read_text()); (dest / "maps-index.json").unlink()
keep = []
for p in idx.get("packs", []):
    if p["file"] not in assets: print("missing from the release:", p["file"]); continue
    fetch(p["file"]); f = dest / p["file"]
    if f.stat().st_size != p["size"] or sha(f) != p["sha256"]:
        print("doesn't match its index, left out:", p["file"]); f.unlink(); continue
    keep.append(p); print("map pack %-28s %6.1f MB  sha256 ok" % (p["file"], p["size"] / 1e6))
(dest / "index.json").write_text(json.dumps(dict(idx, packs=keep), separators=(",", ":")))
