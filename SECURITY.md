# Security policy

## Scope

Creative Ops is designed to process Markdown notes and Properties inside the
currently open Obsidian vault. It does not make network requests, use external
APIs, collect telemetry, or access paths outside the vault through filesystem
or Electron APIs.

## Reporting a vulnerability

Do not include private vault content, access tokens, personal data, or full
note bodies in a report. After a GitHub repository is created, use GitHub's
private security-advisory flow. Before publication, report findings directly
to the project owner through an agreed private channel.

## Release safeguards

- Source policy checks reject network, Node filesystem, Electron, process, and
  child-process APIs under `src/`.
- The package is marked `private` to prevent accidental npm publication.
- The build has no runtime package dependencies other than Obsidian's provided
  API.
- Markdown changes occur only after an explicit command or status selection.
