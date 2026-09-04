#!/usr/bin/env python3
"""Self-test against a RUNNING tic-tac-toe server.

Usage: python3 tests/selftest.py [base_url]   (default http://127.0.0.1:8080)
"""
import json
import sys
import urllib.error
import urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8080"


def get(path):
    try:
        with urllib.request.urlopen(BASE + path, timeout=10) as resp:
            return resp.status, resp.headers.get("Content-Type", ""), resp.read()
    except urllib.error.HTTPError as err:
        return err.code, err.headers.get("Content-Type", ""), err.read()


CHECKS = [
    ("/", 200, "text/html", b"Tic-Tac-Toe", "game page served"),
    ("/index.html", 200, "text/html", b"app-title", "index.html served"),
    ("/style.css", 200, "text/css", b".board", "stylesheet served"),
    ("/tictactoe.js", 200, "application/javascript", b"bestMove", "logic script served"),
    ("/game.js", 200, "application/javascript", b"addEventListener", "ui script served"),
    ("/missing-xyz", 404, "application/json", None, "404 for unknown asset"),
]

failed = 0
for path, want_status, want_ct, marker, label in CHECKS:
    status, ctype, body = get(path)
    ok = (
        status == want_status
        and ctype.startswith(want_ct)
        and (marker is None or marker in body)
    )
    print(("PASS" if ok else "FAIL") + ": " + label + "  [" + path + "] "
          + str(status) + " " + ctype.split(";")[0])
    if not ok:
        failed += 1

status, ctype, body = get("/api/status")
api = json.loads(body)
ok = (status == 200 and api.get("app") == "tic-tac-toe"
      and api.get("status") == "ok" and api.get("version") == "1.0.0")
print(("PASS" if ok else "FAIL") + ": /api/status -> " + body.decode())
if not ok:
    failed += 1

sys.exit(1 if failed else 0)
