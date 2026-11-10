# `ResourceApi.toPlainObject()` never outputs `eventColor`

**Status:** confirmed
**Release:** next
**Test:** `premium/.../src/resource-data/crud.ts`
**Issues:** none found

Found during the test revamp. Pre-existing.

`toPlainObject()` writes `eventContrastColor` twice and never writes `eventColor` (`premium/packages/preact-scheduler/src/resource/api/ResourceApi.ts`), so a resource's color is lost when round-tripping through it.

More detail: `../archive/agent-notes/scheduler-misc.md`.
