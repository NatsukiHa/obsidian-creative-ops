# Architecture

`main.ts` wires Obsidian integration to pure project logic.

1. `ProjectIndex` scans Markdown files in the configured vault folder through
   `Vault.getMarkdownFiles()` and receives Properties through `MetadataCache`.
2. `parser/project.ts` normalizes metadata into `CreativeProject` records.
3. `validation/rules.ts` produces data-quality, stalled, overdue, publishing,
   duplicate-title, template, and unresolved-link findings.
4. `CreativeOpsView` renders list, board, and summary modes from the index.
5. `project-writer.ts` creates or explicitly updates notes with
   `FileManager.processFrontMatter()`.

The index reacts to public Vault and MetadataCache events after layout is
ready. It reads metadata rather than note bodies and uses paths only as
in-session identities, so renamed and deleted notes are refreshed safely.
