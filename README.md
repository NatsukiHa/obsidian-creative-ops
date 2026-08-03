# Creative Ops

Creative Ops is a local-first Obsidian plugin for people who manage articles,
novels, songs, videos, illustrations, doujin works, and other creative output
as Markdown notes. It turns existing note Properties into one production view
without creating an external database or sending vault data anywhere.

> Status: initial public release. It is not listed in the Obsidian Community
> directory; install it manually from the GitHub release asset.

## Problem

Creative work often spreads across idea notes, reference material, drafts,
tasks, and publication records. Creative Ops treats one ordinary Markdown note
as the project record and shows its production state, quality gaps, deadlines,
and note relationships in one place.

## Who it is for

- Writers and content creators
- Songwriters and music producers
- Video creators
- Illustrators and doujin creators
- Individuals running several creative projects in one vault

It is deliberately not a team project-management suite or a task/dependency
tracker.

## Data model

Creative Ops recognizes a note when it has `type: creative-project`.

```yaml
---
type: creative-project
status: draft
category: article
priority: medium
created: 2026-08-03
target-date: 2026-08-17
published-date:
published-url:
progress: 25
---

# My article
```

The filename is the normal title. Missing optional Properties render as `—`
instead of breaking the view. Dates use `YYYY-MM-DD` and progress must be an
integer from `0` to `100`. The initial workflow is `idea`, `research`, `draft`,
`editing`, `ready`, `published`, `paused`, and `archived`; it can be changed in
settings.

## Getting started

### 1. Install the release

1. Download and unzip `creative-ops-0.1.0.zip` from the GitHub release.
2. Copy the extracted `creative-ops` folder into
   `<your-vault>/.obsidian/plugins/`.
3. In Obsidian, open **Settings → Community plugins**. Turn off Restricted
   mode if necessary, then enable **Creative Ops**.

The installed folder must contain `main.js`, `manifest.json`, and `styles.css`.
Use a small test vault first if you are new to Community plugins.

### 2. Create your first project

1. Open the command palette and select **Create new creative project**.
2. Enter a title, then choose a status, priority, optional due date, folder,
   and template.
3. Select **Create**. The new Markdown note opens with the project Properties
   already filled in.
4. Open **Creative Ops** from the ribbon to see it in the List and Board views.

### 3. Add an existing note

Open the note, run **Register current note as a creative project**, then fill
in any remaining project Properties. This never replaces a different existing
`type` value and only fills missing Properties.

## Everyday workflow

| Goal | What to do | What changes |
| --- | --- | --- |
| See all work | Open **Creative Ops** and choose List, Board, or Summary. | Nothing |
| Change progress state | Select a configured status in the List or Board. | Only that note's `status` Property |
| Open the source note | Select a project title or board card. | Nothing |
| Find gaps | Run **Quality inspection** and open the Summary view. | Nothing |
| Create work from a pattern | Use **Create new creative project** and select a vault-local template. | One new Markdown note |

Changes are always explicit. Refreshing, scanning, and quality inspection are
read-only; they never delete, rename, move, or repair notes automatically.

## Features

- List view: title, status, category, priority, due date, progress, modified date
- Board view grouped by status; a card opens its source note
- Summary: status counts, overdue items, stalled items, this week's updates,
  and published items
- Create a project from a vault-local Markdown template
- Explicitly register the current note as a project
- Explicit status changes through Obsidian's public frontmatter API
- Quality inspection for missing required Properties, unknown statuses, invalid
  dates/progress, stale or overdue work, publication gaps, duplicate titles,
  broken related links, and template drift
- Related note counts based on native links and backlinks

## Commands

- `Create new creative project`
- `Open creative management view`
- `Register current note as a creative project`
- `Reload creative data`
- `Run quality inspection`

## Settings

| Setting | Use it for |
| --- | --- |
| Project folder | Limit scans to one vault-relative folder. Leave blank to scan the whole vault. |
| Default destination | Choose where newly created project notes go. |
| Template path | Reuse a vault-local Markdown template. The required Properties are checked in the Summary. |
| Stalled after days | Set how long an active project may go without an update before it is reported. |
| Statuses | Define the ordered workflow, for example `idea, draft, editing, published`. Existing unknown values are reported, not changed. |
| Default status | Pick the initial status for created or explicitly registered notes. |
| Required properties | Choose which project fields the quality inspection must require. |

All folder and template paths are vault-relative. Paths that try to leave the
vault are rejected.

## Quality inspection

The Summary view reports problems without editing anything. Treat it as a
review list, not an automatic repair tool.

| Report | Typical response |
| --- | --- |
| Missing Property | Add the requested Property to the note. |
| Unknown status | Correct the note or add that status in settings. |
| Invalid date or progress | Use `YYYY-MM-DD` or a whole number from `0` to `100`. |
| Overdue or stalled | Update the due date, progress, status, or note content. |
| Publication gap | For `published`, add both `published-date` and `published-url`. |
| Unresolved link | Fix the native Obsidian link or remove it. |

## Privacy and safety

- No network requests, telemetry, accounts, cloud sync, or external APIs
- No Node.js, Electron, or direct filesystem access from production source
- No automatic delete, rename, move, overwrite, or status mutation
- Properties change only through an explicit create, register, or status action
- Disabling the plugin leaves ordinary, portable Markdown notes behind

See [the privacy details](docs/privacy.md) and [security policy](SECURITY.md).

## Development installation

Use a dedicated development vault, not a real vault with important notes.
Node.js 22.13 or later and pnpm 11.9 are required for the development tools.

1. Install dependencies with `pnpm install --ignore-scripts`.
2. Build with `pnpm run build`.
3. Copy `main.js`, `manifest.json`, and `styles.css` into
   `<Vault>/.obsidian/plugins/creative-ops/`.
4. Enable **Creative Ops** in Obsidian's Community Plugins settings.

For watch mode, run `pnpm run dev`. Reload the plugin after changes.

## Validation

```text
pnpm run lint
pnpm run test
pnpm run build
pnpm run check:security
pnpm run check:release
```

## Mobile

The plugin uses no desktop-only API and sets `isDesktopOnly: false`. It has no
separate mobile-specific layout and still requires manual mobile verification
before release.

## Limits

- No drag-and-drop board updates in the MVP
- No Gantt, calendar, task dependency, bulk-edit, sync, account, or AI features
- Related notes are explicit native links/backlinks; there is no automatic
  semantic classification
- The plugin scans metadata, not note bodies, so text-only conventions cannot
  define a project
- No Community Plugin listing exists; install manually from GitHub releases

## Roadmap

After validating demand: status-label customization, template packs, calendar
views, publication history, project checklists, and optional integrations may
be considered. They are not part of this MVP.

## Reporting issues

After publication, use the repository issue tracker for bugs and feature
requests. Do not attach real vaults, secret values, or private note bodies.
Use the private security-advisory route described in [SECURITY.md](SECURITY.md)
for vulnerabilities.

## License

This project is licensed under the [MIT License](LICENSE).

日本語版: [README.ja.md](README.ja.md)
