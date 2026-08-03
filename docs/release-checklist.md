# Release checklist

## Automated gates

- `pnpm run lint`
- `pnpm run test`
- `pnpm run build`
- `pnpm run check:security`
- `pnpm run check:release`
- production dependency audit

## Manual gates

- Test in a dedicated development vault, never a real user vault.
- Verify create, register, status update, refresh, quality inspection, rename,
  deletion, and a large-note fixture.
- Check desktop and mobile behavior. The plugin has no desktop-only APIs, but
  it does not provide a separate mobile layout.
- Review the diff and generated `main.js`; do not commit `main.js`.
- Confirm README, manifest version, versions.json, privacy statement, and
  release assets are consistent.
- Verify that `LICENSE` and `package.json` both declare MIT.

## Human approval required

- GitHub repository creation and remote configuration
- Initial commit push and GitHub release
- Community Plugin submission
