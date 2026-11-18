"""A static file server that answers byte ranges (206), like GitHub Pages, for the end-to-end tests."""
import functools, os, re, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

class RangeHandler(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def send_head(self):
        rng = self.headers.get("Range")
        path = self.translate_path(self.path)
        if not rng or not os.path.isfile(path): return super().send_head()
        m = re.match(r"bytes=(\d*)-(\d*)$", rng.strip())
        size = os.path.getsize(path)
        if not m: return super().send_head()
        a = int(m.group(1)) if m.group(1) else max(0, size - int(m.group(2)))
        b = int(m.group(2)) if m.group(1) and m.group(2) else size - 1
        if a >= size:
            self.send_response(416); self.send_header("Content-Range", "bytes */%d" % size); self.end_headers(); return None
        b = min(b, size - 1)
        f = open(path, "rb"); f.seek(a)
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path)); self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Range", "bytes %d-%d/%d" % (a, b, size)); self.send_header("Content-Length", str(b - a + 1))
        self.send_header("Access-Control-Allow-Origin", "*"); self.end_headers()
        self._left = b - a + 1
        return f
    def copyfile(self, source, outputfile):
        left = getattr(self, "_left", None)
        try:
            if left is None: return super().copyfile(source, outputfile)
            while left > 0:
                buf = source.read(min(1 << 20, left))
                if not buf: break
                outputfile.write(buf); left -= len(buf)
        except (ConnectionResetError, BrokenPipeError): pass   # the app stopped a download mid-file: that's the test
        finally: self._left = None

def serve(directory, port):
    srv = ThreadingHTTPServer(("127.0.0.1", port), functools.partial(RangeHandler, directory=str(directory)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv
