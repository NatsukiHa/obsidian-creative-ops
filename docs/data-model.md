# Data model

Each creative work is an ordinary Markdown note identified by this Property:

```yaml
type: creative-project
```

Recommended Properties:

```yaml
status: idea
category: article
priority: medium
created: 2026-08-03
target-date: 2026-08-17
published-date:
published-url:
progress: 0
```

`status` uses an ordered, user-configurable set. The initial values are
`idea`, `research`, `draft`, `editing`, `ready`, `published`, `paused`, and
`archived`.

The filename is the canonical title. An optional `title` Property can override
the displayed title, but it is not required and is not written by default.
Dates must use `YYYY-MM-DD`; progress must be an integer from 0 through 100.
Missing optional fields remain visible as an em dash and never stop scanning.
