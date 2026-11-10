# `ResourceApi.setProp()` drops event-styling props

**Status:** confirmed
**Release:** next
**Test:** `premium/.../src/resource-data/crud.ts`
**Issues:** [#6468](https://github.com/fullcalendar/fullcalendar/issues/6468) (open, related: per-resource `businessHours` disappear after `setProp`)

Found during the test revamp. Pre-existing.

`setProp` writes the raw prop name onto the internal resource, but a resource's event-styling props live in its `ui` (`eventColor` becomes `ui.color`), so `resource.setProp('eventColor', ...)` and the like change nothing.

More detail: `../archive/agent-notes/scheduler-misc.md`.
