# `startStr`/`endStr` of a nonexistent (spring-forward) time name a different instant than `start`/`end`

**Status:** confirmed
**Release:** next
**Test:** `premium/.../src/event-render/timeline.ts`
**Issues:** none found; [#3887](https://github.com/fullcalendar/fullcalendar/issues/3887) (closed, related: events across a DST change get shorter or longer)

Found during the test revamp. Pre-existing, since v7.1.0.

```js
initCalendar({ timeZone: 'America/New_York', initialView: 'timelineDay', initialDate: '2024-03-10',
  events: [{ id: '1', start: '2024-03-10T02:30:00', end: '2024-03-10T04:00:00' }] })
e.start.toISOString() // '2024-03-10T07:30:00.000Z' (03:30 EDT, where it renders)
e.startStr            // '2024-03-10T02:30:00-04:00' (= 06:30Z: a different instant, and a nonexistent wall-clock time)
```

The same goes for `endStr` (an event ending at 02:30) and `toPlainObject()`. Fed back into `addEvent`, the string moves the event an hour earlier than where it rendered.

## Cause and fix

In `buildRangeEdgeOutput` (`standard/packages/preact/src/structs/event-instance.ts`, from `470ab2adb`), the branch for an event with no known instant (parsed from a string without an offset) takes `date` from `dateEnv.toDate(marker)`, which resolves the gap forward, but formats `dateStr` from the unresolved marker with `offsetForMarker(marker)`. Derive both from `dateEnv.toDate(marker).valueOf()`, as the instant branch does. Check the repeated-hour (fall-back) case for symmetry.

Not a breaking fix: it only changes output for wall-clock times that don't exist, and today's string contradicts `start`.
