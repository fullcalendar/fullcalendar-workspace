# timelineYear with month header intervals and day slots renders month slots

**Status:** confirmed
**Test:** `premium/.../src/visible-range/timeline.ts`
**Issues:** [#4937](https://github.com/fullcalendar/fullcalendar/issues/4937) (open)

Pre-existing, reported upstream.

With `initialView: 'timelineYear'`, `slotHeaderInterval: { months: 1 }` and `slotDuration: { days: 1 }`, FullCalendar warns "slotHeaderInterval must be a multiple of slotDuration" and renders 12 month slots instead of day slots under month headers. A month is a whole number of days, so the combination should work.
