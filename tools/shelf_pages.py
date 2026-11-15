#!/usr/bin/env python3
"""Serve the phone shelf from HAVYN's own address: copy the shareable phone-set PDFs from the "shelf" release
into the Pages site, so the app can fetch them with one tap (same origin, no third-party requests).
Runs in .github/workflows/pages.yml with the gh CLI signed in:  python3 tools/shelf_pages.py app/shelf"""
import hashlib, json, subprocess, sys
from pathlib import Path

LIMIT = 800_000_000   # GitHub Pages sites must stay under 1 GB
dest = Path(sys.argv[1]); dest.mkdir(parents=True, exist_ok=True)
if subprocess.run(["gh", "release", "download", "shelf", "-p", "shelf-index.json", "-D", str(dest), "--clobber"]).returncode:
    print("No shelf release yet: the app will offer publisher links instead."); sys.exit(0)
idx = json.loads((dest / "shelf-index.json").read_text(encoding="utf-8"))
keep, total = [], 0
for it in idx["items"]:
    if it.get("ok") and it.get("mirror") and it.get("ph") and total + it["size"] <= LIMIT:
        keep.append(it); total += it["size"]
if keep:
    args = ["gh", "release", "download", "shelf", "-D", str(dest), "--clobber"]
    for it in keep: args += ["-p", it["file"]]
    subprocess.run(args, check=True)
good = []
for it in keep:
    p = dest / it["file"]
    if p.exists() and hashlib.sha256(p.read_bytes()).hexdigest() == it["sha256"]: good.append(it)
    else: print("checksum mismatch, left out:", it["file"]); p.unlink(missing_ok=True)
small = {"built": idx["built"], "items": [{k: it.get(k) for k in ("id", "file", "size", "sha256", "pages")} for it in good]}
(dest / "index.json").write_text(json.dumps(small, separators=(",", ":")), encoding="utf-8")
(dest / "shelf-index.json").unlink()
print("phone shelf on Pages: %d files, %.1f MB" % (len(good), sum(i["size"] for i in good) / 1e6))
