# Timeline `next()` moves backwards when `dateIncrement` is smaller than the duration

**Status:** confirmed
**Release:** next
**Test:** `premium/.../src/visible-range/scheduler-views.ts`
**Issues:** [#5319](https://github.com/fullcalendar/fullcalendar/issues/5319) (closed, related), [#4678](https://github.com/fullcalendar/fullcalendar/issues/4678) (closed, related): navigation with a `dateIncrement` shorter than the duration, in dayGrid

Found during the test revamp. Pre-existing.

With a one-month duration starting Apr 12 and `dateIncrement: { days: 7 }`, `next()` should go to Apr 19, but goes from the start of the duration's unit (Apr 1) plus 7 days, to Apr 8: before where it started. `prev()` by the same increment works (fullcalendar-scheduler#525, tested next to it).

More detail: `../archive/agent-notes/scheduler-misc.md`.
