# `ResourceApi.toPlainObject()` never outputs `eventColor`

**Status:** fixed
**Test:** `premium/.../src/resource-data/crud.ts`
**Issues:** none found
**Fixed:** `5ff213f76`, in the v7.1.5 changelog. Its test is a plain `it` now.

Found during the test revamp. Pre-existing.

`toPlainObject()` writes `eventContrastColor` twice and never writes `eventColor` (`premium/packages/preact-scheduler/src/resource/api/ResourceApi.ts`), so a resource's color is lost when round-tripping through it.

More detail: `../archive/agent-notes/scheduler-misc.md`.
