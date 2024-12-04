
# FullCalendar Example Projects

A collection of simple example projects to show how to use FullCalendar with various build setups.

Please read the README in each project subdirectory.

## Monorepo Hack

We use [`dependenciesMeta.*.injected`](https://pnpm.io/package_json#dependenciesmetainjected) to inline our connector packages so peerDependencies don't get confused.

**GOTCHA:** Run `pnpm install` at root after building connectors to correctly sync the inlined version.
