#!/usr/bin/env bash
#
# demo-wiki seed import: every seed/*.wiki file becomes one wiki page.
#
# The file name is the page title:
#   * a leading "NNNN-" ordering prefix is dropped,
#   * "_" becomes a space (MediaWiki normalizes that itself),
#   * a leading namespace name becomes a namespace:
#     Template_OmniFact.wiki -> Template:OmniFact.
#
# The import uses --overwrite, which makes the run idempotent: a page whose
# current revision already equals its file is skipped and no new revision is
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

# MediaWiki recognizes a namespace only from a ":" in the title, so the
# "Namespace_page" file name has to become the "Namespace:page" title form.
# Longest namespace name first so "User talk" wins over "User".
to_title() {
  local base="$1" ns prefix offset
  for ns in \
    "MediaWiki talk" "Project talk" "Template talk" "Category talk" \
    "User talk" "File talk" "Help talk" "Module talk" \
    "MediaWiki" "Template" "Category" "Project" "Special" \
    "Talk" "User" "File" "Help" "Module" "Media"; do
    prefix="${ns// /_}"
    if [[ "${base,,}" == "${prefix,,}"_* ]]; then
      offset=$(( ${#prefix} + 1 ))
      printf '%s:%s' "$ns" "${base:$offset}"
      return 0
    fi
  done
  printf '%s' "$base"
}

count=0
for file in /seed/*.wiki; do
  [ -e "$file" ] || continue
  base="$(basename "$file" .wiki)"
  # Drop the "NNNN-" ordering prefix; it only orders the files.
  title="$(to_title "${base#[0-9][0-9][0-9][0-9]-}")"
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
