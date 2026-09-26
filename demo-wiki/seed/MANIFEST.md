# `seed/` manifest

One line per seeded page. The **title** column is the wiki page title; the file
name is that title with spaces replaced by `_`. The **source** column is the
omniagent wiki path the page was derived from; the **category** column is the
`[[Category:...]]` the page belongs to.

| Title | File | Source (omniagent wiki) | Category |
| --- | --- | --- | --- |
| Main Page | `0000-Main_Page.wiki` | pre-existing demo index (not derived) | none |
| Workstation Standard Config | `Workstation_Standard_Config.wiki` | `Projects/Omniagent/Workstation-Standard-Config.md` | `Category:Workstation` |
| Models Yml | `Models_Yml.wiki` | `Projects/Omniagent/Models-Yml.md` | `Category:Omniagent` |
| Trinity Deploy | `Trinity_Deploy.wiki` | `Projects/Omniagent/Trinity-Deploy.md` | `Category:Workstation` |
| Secrets Store | `Secrets_Store.wiki` | `Reference/Omniagent/Secrets-Store.md` | `Category:Omniagent` |
| Workstation Compat Layer | `Workstation_Compat_Layer.wiki` | `Projects/Omniagent/Workstation-Compat-Layer.md` | `Category:Workstation` |
| Omniagent API | `Omniagent_API.wiki` | `Reference/Omniagent/Omniagent-API.md` | `Category:Omniagent` |
| Redaction | `Redaction.wiki` | `Reference/Omniagent/Redaction.md` | `Category:Omniagent` |
| Container Mount Map | `Container_Mount_Map.wiki` | `Projects/Omniagent/Container-Mount-Map.md` | `Category:Workstation` |
| Deployment Checklist | `Deployment_Checklist.wiki` | `Projects/Omniagent/Deployment-Checklist.md` | `Category:Workstation` |
| Plugin Tool Awareness | `Plugin_Tool_Awareness.wiki` | `Reference/Omniagent/Plugin-Tool-Awareness.md` | `Category:Omniagent` |
| Backup and Restore | `Backup_and_Restore.wiki` | `Projects/Omniagent/Backup-and-Restore.md` | `Category:Workstation` |
| Workstation Task Post Mortem | `Workstation_Task_Post_Mortem.wiki` | `Projects/Omniagent/Workstation-Task-Post-Mortem.md` | `Category:Omniagent` |
| Template:OmniFact | `Template_OmniFact.wiki` | reusable template; documentation box derived from `Projects/Omniagent/Workstation-Standard-Config.md` | `Category:Templates` |
| Category:Omniagent | `Category_Omniagent.wiki` | category page over the six Omniagent articles above | none |
| Category:Workstation | `Category_Workstation.wiki` | category page over the six Workstation articles above | none |
| Category:Templates | `Category_Templates.wiki` | category page over the template namespace | none |
| Talk:Workstation Standard Config | `Talk_Workstation_Standard_Config.wiki` | discussion of `Projects/Omniagent/Workstation-Standard-Config.md` | none |

## Category counts

* `Category:Omniagent` - 6 article pages: Models Yml, Secrets Store, Omniagent
  API, Redaction, Plugin Tool Awareness, Workstation Task Post Mortem.
* `Category:Workstation` - 6 article pages: Workstation Standard Config, Trinity
  Deploy, Workstation Compat Layer, Container Mount Map, Deployment Checklist,
  Backup and Restore.
* `Category:Templates` - 1 template page: Template:OmniFact, used by all 12
  articles.

## Notes

* Every article links to at least two other articles, and every article has at
  least one incoming link; the talk page and the category pages link back into
  the article set.
* The reusable template is rendered with `{{OmniFact|...}}` and uses
  `{{{what|{{{1|unspecified}}}}}}`-style parameters.
* No page contains a credential value; credential NAMES appear only as names, and
  the source pages' secret-looking values were written as `<redacted>`.
* Each page ends with an italic `Source:` line naming the omniagent wiki path it
  was derived from.
