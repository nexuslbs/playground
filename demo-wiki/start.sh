#!/usr/bin/env bash
#
# demo-wiki: the ONE command that brings the demo wiki up.
#
# It starts the database, installs MediaWiki on the first run (idempotent),
# starts the wiki, creates the demo accounts, imports every seed/*.wiki page
# and wires the Main Page. Running it again is safe.
#
# The account credentials are read from the "## DEMO-ONLY credentials" table in
# README.md, which is the single place in this repository where they are stored.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

COMPOSE_FILE=docker-compose.yml
ADMIN_ACCOUNT=WikiAdmin

compose() { docker compose -f "$COMPOSE_FILE" "$@"; }
log() { printf '[demo-wiki] %s\n' "$*"; }
die() { printf '[demo-wiki] ERROR: %s\n' "$*" >&2; exit 1; }

# Print the README credentials table as "account<TAB>password<TAB>groups" rows.
demo_accounts() {
  awk -F'|' '
    /^## DEMO-ONLY credentials/ { inside = 1; next }
    inside && /^## / { exit }
    inside && NF >= 4 {
      user = $2; pass = $3; groups = $4;
      gsub(/`/, "", user);   gsub(/^[ \t]+|[ \t]+$/, "", user);
      gsub(/`/, "", pass);   gsub(/^[ \t]+|[ \t]+$/, "", pass);
      gsub(/`/, "", groups); gsub(/^[ \t]+|[ \t]+$/, "", groups);
      if (user == "" || user == "Account" || user ~ /^-+$/) next;
      printf "%s\t%s\t%s\n", user, pass, groups;
    }
  ' README.md
}

demo_password() {
  local want="$1" user pass
  while IFS=$'\t' read -r user pass _; do
    if [ "$user" = "$want" ]; then printf '%s' "$pass"; return 0; fi
  done < <(demo_accounts)
  return 1
}

# The stock MediaWiki password policy rejects the short, well-known passwords of
# the demo accounts; this throwaway wiki deliberately relaxes it.
relax_password_policy() {
  compose run --rm --no-deps --entrypoint sh wiki -c '
    settings=/var/www/html/LocalSettings.php
    if ! grep -q "demo-wiki password policy" "$settings"; then
      cat >> "$settings" <<"PHP"

// demo-wiki password policy: DEMO ONLY. The demo accounts use short,
// well-known passwords that the stock policy would refuse.
$wgPasswordPolicy["policies"]["default"]["MinimalPasswordLength"] = 1;
$wgPasswordPolicy["policies"]["default"]["PasswordNotInCommonList"] = false;
$wgPasswordPolicy["policies"]["default"]["PasswordCannotMatchDefaults"] = false;
$wgPasswordPolicy["policies"]["default"]["PasswordCannotBeSubstringInUsername"] = false;
$wgPasswordPolicy["policies"]["sysop"]["MinimalPasswordLength"] = 1;
$wgPasswordPolicy["policies"]["bureaucrat"]["MinimalPasswordLength"] = 1;
PHP
    fi
  '
}

wait_for_wiki() {
  local i
  for i in $(seq 1 60); do
    if compose exec -T wiki true >/dev/null 2>&1; then return 0; fi
    sleep 1
  done
  die "the wiki container did not become ready"
}

main() {
  local admin_password

  command -v docker >/dev/null 2>&1 || die "docker is required"
  [ -f README.md ] || die "README.md not found next to start.sh"
  admin_password="$(demo_password "$ADMIN_ACCOUNT")" \
    || die "account '$ADMIN_ACCOUNT' is missing from the README credentials table"

  log "starting the database"
  compose up -d --wait db

  if compose run --rm --no-deps --entrypoint sh wiki \
       -c 'test -f /var/www/html/LocalSettings.php' >/dev/null 2>&1; then
    log "MediaWiki is already installed, skipping the installer"
  else
    log "installing MediaWiki (first run)"
    compose run --rm --no-deps wiki php maintenance/install.php \
      --dbname=wiki \
      --dbserver=db \
      --dbuser=root \
      --dbpass= \
      --installdbuser=root \
      --installdbpass= \
      --server=http://localhost:12349 \
      --scriptpath= \
      --lang=en \
      --pass="$admin_password" \
      "Demo Wiki" "$ADMIN_ACCOUNT"
  fi

  log "applying the demo password policy"
  relax_password_policy

  log "starting the wiki on http://localhost:12349/"
  compose up -d wiki
  wait_for_wiki

  log "creating the demo accounts"
  local row user pass groups flags
  local -a rows=()
  mapfile -t rows < <(demo_accounts)
  for row in "${rows[@]}"; do
    IFS=$'\t' read -r user pass groups <<< "$row"
    [ -n "$user" ] || continue
    flags=()
    case ",$groups," in *,sysop,*) flags+=(--sysop) ;; esac
    case ",$groups," in *,bureaucrat,*) flags+=(--bureaucrat) ;; esac
    # </dev/null: the exec must not consume the loop's own input.
    compose exec -T wiki php maintenance/createAndPromote.php \
      --force "${flags[@]}" "$user" "$pass" </dev/null >/dev/null
    log "account ready: $user [${groups:-user}]"
  done

  log "importing the seed pages"
  ./seed.sh

  log "done: http://localhost:12349/"
}

main "$@"
