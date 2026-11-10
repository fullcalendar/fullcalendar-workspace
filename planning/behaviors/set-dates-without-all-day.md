# `event.setDates()` without the `allDay` option clears the event's `allDay`

**Status:** arguable
**Release:** v8
**Test:** `standard/.../src/event-api/set-dates.ts` (`it.fails` for the v8 behavior, and a plain test pinning today's all-day-to-timed conversion)
**Issues:** none found

Pre-existing since at least v4: `EventImpl.setDates` builds its mutation as `{ allDay: options.allDay }`, so without the option the event's `allDay` becomes `undefined`.

```js
const event = calendar.addEvent({ start: '2018-09-03', end: '2018-09-05' }) // all-day

event.setDates('2018-09-02', '2018-09-06')
// becomes a timed event at midnight, allDay undefined (the surprise)

event.setDates('2018-09-03T10:00', '2018-09-03T12:00')
// becomes a timed event, 10:00 to 12:00 (apps may rely on this)
```

A timed event keeps its times, but its `allDay` is `undefined` rather than `false`.

The v6 docs say the option "will modify this event's `allDay` property", which suggests leaving it out keeps it. But simply keeping `allDay` (tried in `0c6f6a343`, reverted) breaks the second case: an all-day event given timed dates would stay all-day and drop the times.

## Options considered

- **Keep `allDay` when the option is omitted.** Matches the docs. Breaks apps that turn an all-day event timed by passing timed dates.
- **Infer it from the inputs when omitted:** keep the event's `allDay` if both inputs are date-only, otherwise make it timed. Changes only the surprising case, but Adam (2026-11-10) found the extra rule hairy.

Adam (2026-11-10): postpone to v8, as a behavior change. Decide then how `setDates` treats an omitted `allDay`, document it, and make `allDay` always a boolean.
