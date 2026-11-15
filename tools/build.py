"""Build HAVYN FIELD: inline CSS + JS into one index.html, hash it into the CSP and the service worker.
Usage: python3 tools/build.py            -> app/ (deploy) and preview/ (no service worker, no CSP)
"""
import base64, hashlib, json, os, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC, APP, PREV = ROOT / "src", ROOT / "app", ROOT / "preview"
APP_VERSION = "1.5.0"

def read(p): return (SRC / p).read_text(encoding="utf-8")

def build():
    css = read("styles.css")
    js = "\n".join(read(f) for f in ("content.js", "engine.js", "app.js"))
    tpl = read("index.html")
    vendor = ROOT / "vendor" / "pdfjs"
    vend = b"".join((vendor / f).read_bytes() for f in ("pdf.min.js", "pdf.worker.min.js")) + (ROOT / "vendor" / "pdflib" / "pdf-lib.esm.min.js").read_bytes()
    # Archive reader: fzstd (vendored, MIT) + HAVYN's ZIM engine, one file for the page and the service worker.
    zimkit = (ROOT / "vendor" / "fzstd" / "fzstd.js").read_text(encoding="utf-8") + "\n" + read("zimkit.js")
    digest = hashlib.sha256((css + js + tpl + read("sw.js") + zimkit + (ROOT / "tools" / "vault.py").read_text(encoding="utf-8") + (ROOT / "tools" / "shelf.py").read_text(encoding="utf-8")).encode() + vend).hexdigest()[:10]
    version = f"{APP_VERSION}+{digest}"
    js = js.replace("__VERSION__", version)

    links = ('<link rel="manifest" href="manifest.webmanifest">\n'
             '<link rel="apple-touch-icon" href="apple-touch-icon.png">\n'
             '<link rel="icon" type="image/png" href="icon-192.png">')

    def page(script, csp):
        h = tpl.replace("/*CSS*/", css).replace("<!--LINKS-->", links)
        h = h.replace("<script>/*JS*/</script>", "<script>" + script + "</script>")
        return h.replace("<!--CSP-->", csp)

    # Deploy build: CSP pins the one inline script by hash; the only network requests allowed go to HAVYN's own address (the
    # shelf) and to Kiwix (the archive list and Kiwix's own mirror, which allows downloads from web pages), only when you tap Get.
    sha = base64.b64encode(hashlib.sha256(js.encode("utf-8")).digest()).decode()
    csp = ("<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'self'; "
           f"script-src 'self' 'sha256-{sha}'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; "
           "connect-src 'self' https://mirror.download.kiwix.org https://download.kiwix.org https://lb.download.kiwix.org; font-src 'none'; media-src 'self' blob:; object-src 'none'; frame-src 'self'; "
           "worker-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none'\">")
    if APP.exists(): shutil.rmtree(APP)
    APP.mkdir(parents=True)
    (APP / "index.html").write_text(page(js, csp), encoding="utf-8")
    (APP / "sw.js").write_text(read("sw.js").replace("__VERSION__", version), encoding="utf-8")
    (APP / "zimkit.js").write_text(zimkit, encoding="utf-8")
    manifest = {
        "id": "./", "name": "HAVYN FIELD", "short_name": "HAVYN", "start_url": "./", "scope": "./",
        "display": "standalone", "orientation": "portrait", "background_color": "#04050d", "theme_color": "#04050d",
        "description": "Offline family emergency command app.",
        "icons": [
            {"src": "icon-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "icon-512.png", "sizes": "512x512", "type": "image/png"},
            {"src": "icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}
        ]
    }
    (APP / "manifest.webmanifest").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    subprocess.run([sys.executable, str(ROOT / "tools" / "icons.py"), str(APP)], check=True)
    (APP / ".nojekyll").write_text("")
    for d in (APP,):
        (d / "pdfjs").mkdir(exist_ok=True)
        for f in ("pdf.min.js", "pdf.worker.min.js", "LICENSE", "README.txt"): shutil.copy(vendor / f, d / "pdfjs" / f)
        shutil.copytree(ROOT / "vendor" / "pdflib", d / "pdflib", dirs_exist_ok=True)
        shutil.copy(ROOT / "vendor" / "fzstd" / "LICENSE", d / "zimkit-fzstd-LICENSE.txt")

    # Preview build: same app, flagged so it skips the service worker; no CSP so a host page can frame it.
    if PREV.exists(): shutil.rmtree(PREV)
    PREV.mkdir(parents=True)
    (PREV / "index.html").write_text(page("window.HAVYN_PREVIEW=true;\n" + js, ""), encoding="utf-8")
    for f in ("manifest.webmanifest", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png"):
        shutil.copy(APP / f, PREV / f)
    shutil.copytree(APP / "pdfjs", PREV / "pdfjs")
    shutil.copytree(APP / "pdflib", PREV / "pdflib")
    shutil.copy(APP / "zimkit.js", PREV / "zimkit.js")

    # Protocol cards as markdown, one file each (generated from src/content.js, the single source).
    out = subprocess.run(["node", "-e", "process.stdout.write(JSON.stringify(require(process.argv[1])))", str(SRC / "content.js")],
                         check=True, capture_output=True, text=True).stdout
    content = json.loads(out)
    # Vault drive kit (scripts + START-HERE page), generated from the same catalog the app shows.
    sys.path.insert(0, str(ROOT / "tools"))
    import vault, shelf
    shelf.write(ROOT, content)   # shelf/catalog.json for the GitHub Actions fetcher
    rows = vault.write(ROOT, content, version)
    for d in (APP, PREV):
        (d / "vault").mkdir(exist_ok=True)
        for f in ("get-vault.sh", "get-vault.ps1", "START-HERE.html"): shutil.copy(ROOT / "vault" / f, d / "vault" / f)
    cards_dir = ROOT / "content" / "cards"
    if cards_dir.exists(): shutil.rmtree(cards_dir)
    cards_dir.mkdir(parents=True)
    for c in content["cards"]:
        lines = [f"# {c['title']}", "", f"_{c['sub']}_", "", f"Checked against sources: {content['reviewed']} · Status: {content['gate']}", ""]
        for i, s in enumerate(c["steps"], 1):
            lines.append(f"{i}. **{s['t']}.**" + (f" {s['d']}" if s.get("d") else "") + (f" (metronome {s['beat']}/min)" if s.get("beat") else ""))
        if c.get("note"): lines += ["", f"> {c['note']}"]
        lines += ["", "Sources:"] + [f"- [{s['n']}]({s['u']})" for s in c["sources"]]
        lines += ["", "Reviewer sign-off: name ______  role (EMT / RN) ______  date ______", ""]
        (cards_dir / f"{c['id']}.md").write_text("\n".join(lines), encoding="utf-8")

    size = (APP / "index.html").stat().st_size
    print(f"built {version}: index.html {size/1024:.1f} KB, {len(content['cards'])} cards, zimkit {len(zimkit)/1024:.1f} KB, vault manifest {len(rows)} items")
    return version

if __name__ == "__main__":
    build()
