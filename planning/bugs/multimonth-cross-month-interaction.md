# multiMonth selection and resizing can't cross months

**Status:** confirmed
**Test:** `standard/.../src/date-select/multimonth.ts`, `standard/.../src/event-resize/multimonth.ts`
**Issues:** [#7183](https://github.com/fullcalendar/fullcalendar/issues/7183) (open), [#7201](https://github.com/fullcalendar/fullcalendar/issues/7201) (closed)

Known since v6.1 (2023); the test revamp added the tests.

Each month in a multiMonth view is its own component, and `DateSelecting` and `EventResizing` only hit-test their own component, so a selection or resize can't go from one month's grid into another's (including moving the start back into the previous month with `eventResizableFromStart`).

A bug: Adam filed #7183 in 2023 with his own pen and labeled it Confirmed, and users ask for it (#7201). The tests are `it.fails`, expecting a selection or resize to cross months.
