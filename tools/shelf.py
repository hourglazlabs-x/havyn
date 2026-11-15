"""The reference shelf's machine-readable catalog (shelf/catalog.json), generated from src/content.js.
GitHub Actions reads it to fetch and mirror the documents (tools/shelf_fetch.py)."""
import json
from pathlib import Path

FETCH = ("id", "sys", "t", "by", "yr", "lic", "ph", "core", "file", "u", "src", "parts", "ia", "ias", "ox", "dspace", "hp", "wb", "expect", "minpages", "strip", "alt", "rev")
MIRROR = {"pd", "cc-by", "cc-by-sa", "cc-by-nc-sa"}

def catalog(content):
    S = content["shelf"]
    items = [{k: it[k] for k in FETCH if k in it} for it in S["items"]]
    return {"release": S["release"], "checked": S["checked"], "systems": S["systems"], "items": items}

def kiwix(content):
    """The phone's archives that HAVYN downloads itself (Kiwix directory and file stem for each)."""
    return [{"id": i["id"], "dir": i["get"]["zim"], "stem": i["get"]["stem"], "core": bool(i.get("core"))}
            for i in content["archive"]["items"] if i.get("tier") == "phone" and isinstance(i.get("get"), dict) and i["get"].get("zim")]

def write(root, content):
    out = Path(root) / "shelf"; out.mkdir(exist_ok=True)
    cat = catalog(content)
    (out / "catalog.json").write_text(json.dumps(cat, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    (out / "kiwix.json").write_text(json.dumps(kiwix(content), indent=1) + "\n", encoding="utf-8")
    return cat

if __name__ == "__main__":
    import subprocess, sys
    root = Path(__file__).resolve().parent.parent
    c = json.loads(subprocess.run(["node", "-e", "process.stdout.write(JSON.stringify(require(process.argv[1])))", str(root / "src" / "content.js")], check=True, capture_output=True, text=True).stdout)
    cat = write(root, c)
    print(len(cat["items"]), "items")
