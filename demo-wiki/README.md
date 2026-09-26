# 🧩 Demo Wiki

A throwaway [MediaWiki](https://www.mediawiki.org/wiki/MediaWiki) demo, the
engine behind Wikipedia: **MediaWiki 1.43 + MariaDB 11** as its own Docker
Compose project, publishing host port **12349**.

- **URL:** <http://localhost:12349/>
- **Engine:** MediaWiki 1.43 served by Apache/PHP in the `wiki` container,
  backed by MariaDB 11 in the `db` container.
- **Content:** every `seed/*.wiki` file is imported as a wiki page; the file
  naming contract is in [`seed/README.md`](seed/README.md).

## Run

```bash
cd demo-wiki
./start.sh
```

That is the one command. It starts the database, installs MediaWiki on the first
run, applies the demo settings, starts the wiki, creates or refreshes the demo
accounts, imports every `seed/*.wiki` page and wires the Main Page. It is
idempotent, so running it again is safe.

Then open <http://localhost:12349/>.

## Inspect

```bash
./check.sh   # docker compose ps, the HTTP status, the page count
./seed.sh    # (re)import seed/*.wiki only, idempotent
```

## Layout

```
demo-wiki/
├── docker-compose.yml   # project "demo-wiki": services wiki + db, 12349:8080
├── start.sh             # the ONE command (install, accounts, seed, Main Page)
├── seed.sh              # seed/*.wiki -> wiki pages, idempotent
├── check.sh             # raw state: compose ps, HTTP code, page count
├── apache/              # Apache listens on container port 8080
├── seed/                # wikitext pages + the seed contract
└── README.md
```

## Pages and accounts

`./start.sh` imports every `seed/*.wiki` file and the Main Page links them.
`WikiAdmin` is the installer and seed-import account, `test` is the editing
account used by the demo checks, and `WikiModerator` is a `sysop` (moderator).

## DEMO-ONLY credentials

> **DEMO-ONLY.** These accounts exist only in this throwaway demo wiki. Never
> reuse these passwords for anything real, and never copy them into another
> system.

| Account | Password | Groups | Purpose |
| --- | --- | --- | --- |
| `WikiAdmin` | `AdminDemo123` | `bureaucrat`, `sysop` | installer and seed-import account |
| `test` | `123456` | | editing account used by the demo checks |
| `WikiModerator` | `ModDemo123` | `sysop` | moderation (delete/block) account |

`./start.sh` reads this table and creates or refreshes the accounts, so this
block is the single source of truth for the demo credentials. The `db`
container is internal to the compose project and stores no user-facing
credential.

## Notes

- Generated state (`LocalSettings.php`, `.env`, keys, logs) is gitignored; the
  web root lives in the `demo-wiki_webroot` named volume, so the installer's
  `LocalSettings.php` is never committed.
- `docker compose down` stops the demo; `docker compose down -v` also deletes
  the wiki content and the database.
