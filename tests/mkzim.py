"""Write a small ZIM test archive (new namespace scheme, uncompressed clusters) for HAVYN's end-to-end tests.
Contains: pages in subfolders, an image, CSS, a video, a PDF, a redirect, a title listing, and hostile HTML
(inline script and onerror handler) that must never run.  Usage: python3 tests/mkzim.py OUT.zim PDF MP4"""
import hashlib, struct, sys, uuid, zlib

def png(w=8, h=8, rgb=(40, 170, 255)):
    raw = b"".join(b"\x00" + bytes(rgb) * w for _ in range(h))
    def chunk(t, d): return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b"")

def build(out, pdf, mp4):
    css = b"body{font-family:sans-serif} .t{color:rgb(1,2,3)} .bg{background:url(../img/drop.png) no-repeat}"
    page = lambda title, body: ("<!doctype html><html><head><meta charset='utf-8'><title>%s</title><link rel='stylesheet' href='%s'></head><body>%s</body></html>" % (title, "css/style.css", body)).encode()
    index = page("HAVYN Test Library", """
<h1 class="t">HAVYN Test Library</h1>
<script>document.title='HACKED';</script>
<img id="evil" src="missing.png" onerror="document.title='PWNED'">
<p><img id="drop" src="img/drop.png" width="8" height="8"></p>
<ul>
<li><a id="l-water" href="Water_purification">Water purification</a></li>
<li><a id="l-deep" href="sub/Deep_page">Deep page</a></li>
<li><a id="l-video" href="Video_lesson">Video lesson</a></li>
<li><a id="l-redir" href="Redirect_to_water">Clean water (redirect)</a></li>
<li><a id="l-pdf" href="doc/manual.pdf">Field manual (PDF)</a></li>
<li><a id="l-ext" href="https://example.com/">Outside link</a></li>
<li><a id="l-frag" href="#bottom">Jump to bottom</a></li>
</ul>
<div style="height:3000px"></div><h2 id="bottom">Bottom</h2>""")
    water = page("Water purification", '<h1>Water purification</h1><p class="bg">Boil for one minute.</p><img id="drop2" src="img/drop.png"><a id="l-home" href="index.html">Home</a> <a id="l-deep2" href="sub/Deep_page">Deep</a>')
    deep = ("<!doctype html><html><head><meta charset='utf-8'><title>Deep page</title><link rel='stylesheet' href='../css/style.css'></head><body>"
            "<h1>Deep page</h1><img id='drop3' src='../img/drop.png'><a id='l-up' href='../Water_purification'>Up to water</a></body></html>").encode()
    video = page("Video lesson", '<h1>Video lesson</h1><video id="vid" src="media/clip.mp4" preload="none"></video>')
    entries = [  # (ns, url, title, mime or None, data or redirect-target (ns,url))
        ("C", "index.html", "HAVYN Test Library", "text/html", index),
        ("C", "Water_purification", "Water purification", "text/html", water),
        ("C", "sub/Deep_page", "Deep page", "text/html", deep),
        ("C", "Video_lesson", "Video lesson", "text/html", video),
        ("C", "Redirect_to_water", "Clean water", None, ("C", "Water_purification")),
        ("C", "img/drop.png", "", "image/png", png()),
        ("C", "css/style.css", "", "text/css", css),
        ("C", "media/clip.mp4", "", "video/mp4", open(mp4, "rb").read()),
        ("C", "doc/manual.pdf", "Field manual", "application/pdf", open(pdf, "rb").read()),
        ("M", "Title", "", "text/plain", b"HAVYN Test Library"),
        ("M", "Name", "", "text/plain", b"havyn_test_en"),
        ("M", "Language", "", "text/plain", b"eng"),
        ("M", "Description", "", "text/plain", b"Fixture archive for HAVYN tests"),
        ("M", "Date", "", "text/plain", b"2026-11-14"),
        ("M", "Creator", "", "text/plain", b"HAVYN"),
        ("M", "Counter", "", "text/plain", b"text/html=4;image/png=1;video/mp4=1;application/pdf=1"),
        ("M", "Illustration_48x48@1", "", "image/png", png(48, 48, (255, 120, 40))),
        ("W", "mainPage", "", None, ("C", "index.html")),
    ]
    entries.sort(key=lambda e: (e[0].encode(), e[1].encode()))
    idx = {(e[0], e[1]): i for i, e in enumerate(entries)}
    front = [i for i, e in enumerate(entries) if e[0] == "C" and (e[3] in ("text/html",) or (e[3] is None and e[2]))]
    listing = b"".join(struct.pack("<I", i) for i in sorted(front, key=lambda i: (entries[i][2] or entries[i][1]).encode()))
    entries.append(("X", "listing/titleOrdered/v1", "", "application/octet-stream+zimlisting", listing))
    entries.sort(key=lambda e: (e[0].encode(), e[1].encode()))
    idx = {(e[0], e[1]): i for i, e in enumerate(entries)}
    # rebuild listing with final indices
    front = [i for i, e in enumerate(entries) if e[0] == "C" and (e[3] == "text/html" or (e[3] is None and e[2]))]
    listing = b"".join(struct.pack("<I", i) for i in sorted(front, key=lambda i: (entries[i][2] or entries[i][1]).encode()))
    entries = [(e[0], e[1], e[2], e[3], listing if e[1] == "listing/titleOrdered/v1" else e[4]) for e in entries]
    mimes = sorted({e[3] for e in entries if e[3]})
    blobs = []; dmeta = []
    for e in entries:
        if e[3] is None: dmeta.append(("R", idx[e[4]]))
        else: dmeta.append(("B", len(blobs))); blobs.append(e[4])
    # one uncompressed cluster holding every blob
    n = len(blobs); offs = [4 * (n + 1)]
    for b in blobs: offs.append(offs[-1] + len(b))
    cluster = b"\x01" + b"".join(struct.pack("<I", o) for o in offs) + b"".join(blobs)
    mimelist = b"".join(m.encode() + b"\0" for m in mimes) + b"\0"
    dirents = []
    for e, (k, v) in zip(entries, dmeta):
        t = (e[2] if e[2] != e[1] else "").encode()
        if k == "R": d = struct.pack("<HBcIIx", 0xffff, 0, e[0].encode(), 0, v)[:12] + e[1].encode() + b"\0" + t + b"\0"
        else: d = struct.pack("<HBcIII", mimes.index(e[3]), 0, e[0].encode(), 0, 0, v) + e[1].encode() + b"\0" + t + b"\0"
        dirents.append(d)
    pos = 80 + len(mimelist)
    cluster_pos = pos; pos += len(cluster)
    dpos = []
    for d in dirents: dpos.append(pos); pos += len(d)
    urlptr = pos; pos += 8 * len(entries)
    clptr = pos; pos += 8
    checksum = pos
    main = idx[("W", "mainPage")]
    hdr = struct.pack("<IHH16sIIQQQQIIQ", 72173914, 6, 1, uuid.UUID("6a1b2c3d-4e5f-4a7b-8c9d-0e1f2a3b4c5d").bytes, len(entries), 1, urlptr, 0xffffffffffffffff, clptr, 80, main, 0xffffffff, checksum)
    body = hdr + mimelist + cluster + b"".join(dirents) + b"".join(struct.pack("<Q", p) for p in dpos) + struct.pack("<Q", cluster_pos)
    assert len(body) == checksum
    open(out, "wb").write(body + hashlib.md5(body).digest())
    print(out, len(body) + 16, "bytes,", len(entries), "entries")

if __name__ == "__main__":
    build(sys.argv[1], sys.argv[2], sys.argv[3])
