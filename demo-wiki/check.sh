#!/usr/bin/env bash
#
# demo-wiki: print the raw state of the running demo.
#
# Note: host port 12349 is published by the compose project on the HOST. When
# this script runs inside a container that cannot reach host ports, the first
# HTTP line prints "unreachable" and the in-container check below is the
# authoritative one (it talks to Apache on 127.0.0.1:8080 directly).
set -uo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

echo "== docker compose ps =="
docker compose -f docker-compose.yml ps

echo
echo "== HTTP status of http://localhost:12349/ =="
code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 5 http://localhost:12349/ 2>/dev/null || true)"
echo "http://localhost:12349/ -> ${code:-unreachable}"

echo
echo "== HTTP status inside the wiki container =="
docker compose -f docker-compose.yml exec -T wiki php -r \
  '$h = @file_get_contents("http://127.0.0.1:8080/"); echo $h === false ? "FAIL\n" : "200 (".strlen($h)." bytes)\n";' \
  2>/dev/null || echo "wiki container not running"

echo
echo "== page count (action=query&list=allpages) =="
docker compose -f docker-compose.yml exec -T wiki php -r \
  '$j = json_decode(@file_get_contents("http://127.0.0.1:8080/api.php?action=query&list=allpages&aplimit=500&format=json"), true);
   $pages = $j["query"]["allpages"] ?? [];
   echo count($pages)." page(s)\n";
   foreach ($pages as $p) { echo "  ".$p["title"]."\n"; }' \
  2>/dev/null || echo "wiki container not running"
