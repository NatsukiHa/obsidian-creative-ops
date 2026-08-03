# Privacy

Creative Ops is local-first.

- It reads Markdown file metadata through Obsidian's public Vault and
  MetadataCache APIs.
- It does not make network requests, use external APIs, or send telemetry.
- It does not collect or transmit note bodies.
- It does not use Node.js, Electron, Adapter, or filesystem APIs to reach
  outside the open vault.
- It writes a note only after an explicit create, register, or status-change
  action. It never deletes, overwrites, moves, or renames notes automatically.
- Disabling the plugin leaves notes as ordinary Markdown with Properties.

Plugin preferences are stored by Obsidian in the plugin's own data file. They
contain only configuration such as folder paths, status labels, and a template
path; they do not cache note content.
