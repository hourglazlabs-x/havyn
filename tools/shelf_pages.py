#!/usr/bin/env python3
"""Serve the phone shelf from HAVYN's own address: copy the shareable phone-set PDFs from the "shelf" release
into the Pages site, so the app can fetch them with one tap (same origin, no third-party requests), and write
archives.json: the current Kiwix file, exact size and SHA-256 of each archive the app downloads itself from Kiwix's
own mirror (shelf/kiwix.json lists them).
Runs in .github/workflows/pages.yml with the gh CLI signed in:  python3 tools/shelf_pages.py app/shelf"""
import datetime, hashlib, json, re, subprocess, sys, urllib.request
from pathlib import Path

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 HAVYN-pages/1.4"
LIST, MIRROR = "https://download.kiwix.org/zim/", "https://mirror.download.kiwix.org/zim/"

def get(url, headers=None, n=8_000_000):
    h = {"User-Agent": UA}; h.update(headers or {})
    with urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=90) as r:
        return r, r.read(n)

def archives(dest):
    """Resolve each archive the app downloads: newest dated file in Kiwix's directory, its exact size, Kiwix's SHA-256."""
    src = Path(__file__).resolve().parent.parent / "shelf" / "kiwix.json"
    if not src.exists(): return
    out, listings = [], {}
    for a in json.loads(src.read_text()):
        try:
            if a["dir"] not in listings: listings[a["dir"]] = get(LIST + a["dir"] + "/")[1].decode("utf-8", "replace")
            names = sorted(set(re.findall(r'href="(%s_\d{4}-\d{2}\.zim)"' % re.escape(a["stem"]), listings[a["dir"]])))
            if not names: raise RuntimeError("not listed")
            f = names[-1]; url = MIRROR + a["dir"] + "/" + f
            r, _ = get(url, {"Range": "bytes=0-0"}, 1)
            size = int(str(r.headers.get("Content-Range", "")).split("/")[-1])
            if r.headers.get("Access-Control-Allow-Origin") not in ("*", "https://hourglazlabs-x.github.io"): raise RuntimeError("the mirror no longer allows downloads from web pages")
            sha = ""
            try:
                m = re.match(r"\s*([0-9a-fA-F]{64})", get(url + ".sha256", n=4096)[1].decode("ascii", "replace"))
                sha = m.group(1).lower() if m else ""
            except Exception as e:
                print("no published SHA-256 for", f, e)
            out.append({"id": a["id"], "file": f, "url": url, "size": size, "sha256": sha})
            print("archive %-16s %s %.1f MB %s" % (a["id"], f, size / 1e6, "sha256 ok" if sha else "no sha256"))
        except Exception as e:
            print("archive %s: %s (the app will look it up itself)" % (a["id"], e))
    (dest / "archives.json").write_text(json.dumps({"built": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"), "items": out}, separators=(",", ":")), encoding="utf-8")

LIMIT = 800_000_000   # GitHub Pages sites must stay under 1 GB
dest = Path(sys.argv[1]); dest.mkdir(parents=True, exist_ok=True)
archives(dest)
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
