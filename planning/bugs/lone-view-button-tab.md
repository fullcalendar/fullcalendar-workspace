# A view button alone in its group is `role=tab` with no `tablist`

**Status:** confirmed
**Test:** `standard/.../src/accessibility/aria.ts`
**Issues:** [#6522](https://github.com/fullcalendar/fullcalendar/issues/6522) (open, related: view-button groups as a tablist)

Found during the test revamp. Pre-existing.

A group of only view buttons is a `tablist` of `tab`s. A single view button in its own group (e.g. `headerToolbar: { left: 'prev,next', right: 'dayGridMonth' }`) still gets `role=tab`, with no `tablist` around it, which ARIA doesn't allow: a tab must be owned by a tablist.
