# `calendar.select()` checks nothing before firing `select`

**Status:** arguable
**Release:** v8
**Test:** `standard/.../src/date-select/select-method.ts` (asserts the current behavior)
**Issues:** [#4150](https://github.com/fullcalendar/fullcalendar/issues/4150) (open)

`CalendarApiImpl.select()` parses the span, stores it and calls `triggerDateSelect`, with no checks. So `select` fires for:

- dates outside the current view (nothing is highlighted, and the highlight doesn't appear after navigating there either);
- all-day dates in a timeGrid with `allDaySlot: false`;
- dates that `selectAllow` rejects, and dates outside `validRange` (constraints and overlap aren't checked either).

The Karma suite had commented-out "TODO: implement" specs expecting no `select` in the first two cases. Another test relies on `select` firing for a calendar that was never rendered.

Firing fewer callbacks would break apps that call `select()` to drive their own state. For v8, decide:

- whether `select()` should validate like a user's selection (`validRange`, `selectAllow`, `selectConstraint`, `selectOverlap`);
- whether a selection the view can't show should be dropped, or kept until it can be shown.
