# `seed/` contract

Every file here whose name ends in `.wiki` becomes one wiki page when
`./seed.sh` (or `./start.sh`) runs. Use MediaWiki **wikitext**, not Markdown.

## File name -> page title

| File name | Page title |
| --- | --- |
| `0000-Main_Page.wiki` | `Main Page` |
| `Omniagent-Setup.wiki` | `Omniagent-Setup` |
| `Workstation_Standard_Config.wiki` | `Workstation Standard Config` |
| `Template_OmniFact.wiki` | `Template:OmniFact` |
| `Category_Omniagent.wiki` | `Category:Omniagent` |
| `Talk_Workstation.wiki` | `Talk:Workstation` |

* One page per file; the file name is the page title.
* A leading four-digit ordering prefix (`0000-`, `0001-`, ...) is dropped: it
  only orders the files, it is not part of the title. `0000-Main_Page.wiki`
  therefore creates the wiki's `Main Page`.
* `_` becomes a space (MediaWiki normalizes it).
* A title prefix that names a namespace creates a page in that namespace:
  `Template_`, `Category_`, `Talk_`, `Help_`, `Project_`, `User_`, ...
* `README.md` (this file) and any other non-`.wiki` file is ignored.

## Import rules

`seed.sh` imports with `importTextFiles.php --overwrite` and attributes the
edits to `WikiAdmin`. A page whose current revision already equals its file is
skipped, so re-running the import is a no-op.

## Content rules

* Wikitext only: `== Heading ==`, `'''bold'''`, `[[Internal link]]`,
  `[https://example.org label]`, `*`/`#` lists, `{| class="wikitable" ... |}`
  tables. Markdown syntax (`## heading`, `[text](url)`) is wrong.
* End every source-derived page with a `Source:` line naming where it came from.
* Never put a real secret, key, token or credential value in a page.
