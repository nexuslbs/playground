#!/usr/bin/env bash
#
# demo-wiki seed import: every seed/*.wiki file becomes a wiki page.
#
# The file name is the page title:
#   * a leading "NNNN-" ordering prefix is dropped,
#   * underscores become spaces (MediaWiki does that itself),
#   * a namespace prefix becomes a namespace ("Template_X" -> "Template:X").
#
# We import with --overwrite, which makes the run idempotent: a page whose
# current revision already matches its file is skipped and no new revision is
# created. Run ./start.sh first (it installs the wiki); this script only imports.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

log() { printf '[demo-wiki:seed] %s\n' "$*"; }

shopt -s nullglob
seed_files=(seed/*.wiki)
shopt -u nullglob

if [ "${#seed_files[@]}" -eq 0 ]; then
  log "no seed/*.wiki files found, nothing to import"
  exit 0
fi

log "importing ${#seed_files[@]} file(s) from seed/"

docker compose -f docker-compose.yml exec -T wiki bash -s <<'EOS'
set -euo pipefail

work=/tmp/demo-wiki-seed
rm -rf "$work"
mkdir -p "$work"

count=0
for file in /seed/*.wiki; do
  [ -e "$file" ] || continue
  base="$(basename "$file" .wiki)"
  # Drop the "NNNN-" ordering prefix; it only orders the files.
  title="${base#[0-9][0-9][0-9][0-9]-}"
  cp "$file" "$work/$title.wiki"
  count=$((count + 1))
done

if [ "$count" -eq 0 ]; then
  echo "no seed/*.wiki files found in /seed"
  exit 0
fi

php maintenance/importTextFiles.php \
  --user WikiAdmin \
  --overwrite \
  --summary "Seeded from demo-wiki/seed" \
  "$work"/*.wiki
EOS
