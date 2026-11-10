# Timeline `next()` moves backwards when `dateIncrement` is smaller than the duration

**Status:** confirmed
**Test:** `premium/.../src/visible-range/scheduler-views.ts`
**Issues:** [#4678](https://github.com/fullcalendar/fullcalendar/issues/4678) (closed), [#5319](https://github.com/fullcalendar/fullcalendar/issues/5319) (closed)

Found during the test revamp. Pre-existing.

With a one-month duration starting Apr 12 and `dateIncrement: { days: 7 }`, `next()` should go to Apr 19, but goes from the start of the duration's unit (Apr 1) plus 7 days, to Apr 8: before where it started. `prev()` by the same increment works (fullcalendar-scheduler#525, tested next to it).

Both issues were closed as fixed in v5.8.0 (2021), but it isn't fixed for this case. After the release, two users reported on #4678 that a 4-week timeline with a 1-week `dateIncrement` "goes back instead" on a second Next (2021-09, still in v5.9.0; again in 2022-02, with a 2-week view). No one replied. Reply on #4678 when this is fixed, or reopen it.

More detail: `../archive/agent-notes/scheduler-misc.md`.
