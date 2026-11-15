#!/usr/bin/env python3
"""Check how servers answer before relying on them: status, type, size and CORS on every redirect hop.

Runs in GitHub Actions (shelf workflow, input "probe"), which can reach sites this repo's maintainers often can't:
    python3 tools/shelf_probe.py "kiwix:other/zimgit-water_en https://example.org/file.pdf"
"kiwix:<dir>/<stem>" resolves the newest archive with that stem in Kiwix's download directory first."""
import re, sys, urllib.error, urllib.parse, urllib.request

ORIGIN = "https://hourglazlabs-x.github.io"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 HAVYN-probe/1.4"

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k): return None
opener = urllib.request.build_opener(NoRedirect)

def kiwix(spec):
    d, stem = spec.split(":", 1)[1].rsplit("/", 1)
    base = "https://download.kiwix.org/zim/%s/" % d
    with urllib.request.urlopen(urllib.request.Request(base, headers={"User-Agent": UA}), timeout=60) as r:
        listing = r.read().decode("utf-8", "replace")
    names = sorted(set(re.findall(r'href="(%s_\d{4}-\d{2}\.zim)"' % re.escape(stem), listing)))
    if not names: raise RuntimeError("no %s in %s" % (stem, base))
    return base + names[-1]

BODY = {}
def hop(url, method="GET"):
    h = {"User-Agent": UA, "Origin": ORIGIN, "Range": "bytes=0-1023"}
    if method == "OPTIONS": h = {"User-Agent": UA, "Origin": ORIGIN, "Access-Control-Request-Method": "GET", "Access-Control-Request-Headers": "range"}
    try:
        r = opener.open(urllib.request.Request(url, method=method, headers=h), timeout=60)
    except urllib.error.HTTPError as e:
        r = e
    hd = r.headers
    if method == "GET":
        try: BODY[url] = r.read(300)
        except Exception: BODY[url] = b""
    return r.status if hasattr(r, "status") else r.code, hd

def probe(spec):
    url = kiwix(spec) if spec.startswith("kiwix:") else spec
    print("\n== %s" % url)
    for i in range(8):
        code, hd = hop(url)
        print("  %d %s | type=%s len=%s range=%s | ACAO=%s ACEH=%s" % (code, url[:150], hd.get("Content-Type"), hd.get("Content-Length"), hd.get("Content-Range"),
              hd.get("Access-Control-Allow-Origin"), hd.get("Access-Control-Expose-Headers")))
        if code in (301, 302, 303, 307, 308) and hd.get("Location"):
            url = urllib.parse.urljoin(url, hd["Location"]); continue
        b = BODY.get(url, b"")
        if b and (b"<" not in b[:1] and all(32 <= c < 127 or c in (9, 10, 13) for c in b[:120])): print("  body: %r" % b[:200])   # small text answers (checksums, metalinks)
        oc, oh = hop(url, "OPTIONS")
        print("  preflight %d | ACAO=%s ACAM=%s ACAH=%s" % (oc, oh.get("Access-Control-Allow-Origin"), oh.get("Access-Control-Allow-Methods"), oh.get("Access-Control-Allow-Headers")))
        break

if __name__ == "__main__":
    for s in " ".join(sys.argv[1:]).split():
        try: probe(s)
        except Exception as e: print("\n== %s\n  failed: %s" % (s, e))
