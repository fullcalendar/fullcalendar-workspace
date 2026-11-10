# Options explicitly set to `undefined` aren't treated as unset

**Status:** arguable
**Release:** v8
**Issues:** [#3298](https://github.com/fullcalendar/fullcalendar/issues/3298) (closed, related: `slotDuration: undefined` looped forever; expected the default)

Found while porting the view-render specs (commit `eb57e948c`). Pre-existing.

- `new Calendar(el, { initialView: 'timeGridDay', slotDuration: undefined }).render()` throws `TypeError: Cannot read properties of undefined (reading 'years')`. `slotMinTime: undefined` and `slotMaxTime: undefined` throw the same way.
- `allDaySlot: undefined` renders no all-day row, though the default is `true`.
- `eventOrder: undefined` throws `TypeError: Cannot read properties of undefined (reading 'length')` during render (dayGridMonth, events with equal start times).

The legacy specs seemed to pass `undefined` through `describeOptions` tables, but that helper copied options with jQuery's `$.extend`, which drops `undefined` values, so the calendar never received them. The Vitest tests omit the key too, so nothing has ever tested this.

For v8: treat an `undefined` option as unset (the default). When it's fixed, add tests that pass `undefined` for these options and expect the defaults.
