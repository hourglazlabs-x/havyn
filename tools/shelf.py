"""The reference shelf's machine-readable catalog (shelf/catalog.json), generated from src/content.js.
GitHub Actions reads it to fetch and mirror the documents (tools/shelf_fetch.py)."""
import json
from pathlib import Path

FETCH = ("id", "sys", "t", "by", "yr", "lic", "ph", "core", "file", "u", "src", "parts", "ia", "ox", "hp")
MIRROR = {"pd", "cc-by", "cc-by-sa", "cc-by-nc-sa"}

def catalog(content):
    S = content["shelf"]
    items = [{k: it[k] for k in FETCH if k in it} for it in S["items"]]
    return {"release": S["release"], "checked": S["checked"], "systems": S["systems"], "items": items}

def write(root, content):
    out = Path(root) / "shelf"; out.mkdir(exist_ok=True)
    cat = catalog(content)
    (out / "catalog.json").write_text(json.dumps(cat, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    return cat

if __name__ == "__main__":
    import subprocess, sys
    root = Path(__file__).resolve().parent.parent
    c = json.loads(subprocess.run(["node", "-e", "process.stdout.write(JSON.stringify(require(process.argv[1])))", str(root / "src" / "content.js")], check=True, capture_output=True, text=True).stdout)
    cat = write(root, c)
    print(len(cat["items"]), "items")
