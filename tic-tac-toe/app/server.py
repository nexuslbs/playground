#!/usr/bin/env python3
"""Tiny static-file server for the tic-tac-toe game with a /api/status endpoint.

Run: python3 server.py   (PORT env var overrides the default 8080)
"""
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("PORT", "8080"))

APP_INFO = {"app": "tic-tac-toe", "status": "ok", "version": "1.0.0"}

CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".ico": "image/x-icon",
}


class Handler(BaseHTTPRequestHandler):
    server_version = "tic-tac-toe/1.0.0"

    def _send(self, code, body, ctype):
        data = body if isinstance(body, bytes) else body.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        path = self.path.split("?", 1)[0].split("#", 1)[0]
        if path == "/api/status":
            self._send(200, json.dumps(APP_INFO), "application/json; charset=utf-8")
            return

        rel = "index.html" if path in ("/", "/index.html") else path.lstrip("/")
        fpath = os.path.normpath(os.path.join(ROOT, rel))
        if not fpath.startswith(ROOT) or not os.path.isfile(fpath):
            self._send(404, json.dumps({"error": "not found", "path": path}),
                       "application/json; charset=utf-8")
            return

        ext = os.path.splitext(fpath)[1].lower()
        ctype = CONTENT_TYPES.get(ext) or "application/octet-stream"
        with open(fpath, "rb") as fh:
            self._send(200, fh.read(), ctype)

    def log_message(self, fmt, *args):  # keep the container logs quiet
        pass


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print("tic-tac-toe server listening on 0.0.0.0:%d (root=%s)" % (PORT, ROOT), flush=True)
    server.serve_forever()
