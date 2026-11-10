# Tests couldn't load scripts from the root `node_modules` in a fresh checkout

**Status:** fixed
**Test:** `standard/.../src/event-drag/third-party.ts` (loads jQuery and jQuery UI as classic scripts)
**Issues:** none (test infrastructure)
**Fixed:** the commit "Let Vite serve the repo root's node_modules in tests", with `server.fs.allow` in `standard/packages/vanilla-tests/vitest.config.base.ts`

Found in the first CI run (2026-11-10): `third-party.ts` failed with "Couldn't load …/node_modules/.pnpm/jquery@4.0.0/…/jquery.min.js". It passed locally.

## Cause

Vite only serves files under the workspace root, the nearest folder up from the test package with a `pnpm-workspace.yaml` (or `lerna.json`, or a `package.json` with `workspaces`). `standard/pnpm-workspace.yaml` exists so `standard/` works as a standalone repo (the subrepo system), and `meta:hide` hides it locally. So locally Vite took the monorepo root, but in CI's fresh checkout it stopped at `standard/`, and refused files in the root's `node_modules/.pnpm`, where pnpm installs jQuery. FullCalendar's own builds live under `standard/`, so the other script-loading tests weren't affected.

## When the subrepo system goes

If `standard/` no longer has its own `pnpm-workspace.yaml`, Vite finds the monorepo root in every checkout: remove `REPO_ROOT` and `server.fs.allow` from `vitest.config.base.ts` (harmless to keep, but no longer needed). If `standard/` still has to work standalone, keep them.
