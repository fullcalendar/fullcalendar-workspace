# Needed Test Coverage

Library bugs found during the test revamp that no test covers yet: there is no `it.fails` test or other marker in the suites. Each one needs a test, either along with its fix or as an `it.fails` until it's fixed.

## Bottom strip of a timeGrid all-day cell isn't an all-day drop target

Found while dragging a timed event up into the all-day row of `timeGridWeek`. The day cell spans 122–158px. Results by drop point:

| Drop point | Result |
|---|---|
| 1–5px above the bottom | dropped into the timed slot below (`2014-06-10T01:00`) |
| 8–10px above the bottom | no drop |
| 12px or more above the bottom | correct all-day drop |

`elementFromPoint` reports `dayCellBottom` for all of these, so the pointer is visibly inside the cell. The test models aim at the cell's center, so the suite doesn't depend on this.

Adam's hypothesis: it comes from extending hit dimensions to cover the all-day divider, so the mirror doesn't blink out while it passes over the divider (where the pointer technically isn't over any drop target). That extension may be mishandled. A better design might give leeway as the pointer leaves one drop target and enters another, instead of stretching rects.

**Diagnosis (Sol, verified against the code):** there's no divider extension in v7; the all-day lane's hit area is exactly its box. The cause is the subject-center adjustment: `HitDragging.processFirstCoord()` sets `coordAdjust` so the press acts as if it were at the center of the grabbed slot, and every later hit query runs at `pointer + coordAdjust`. With `coordAdjust.top = 10.5`, a pointer 2px above the cell's bottom queries 8.5px below it, in the timed area, and a pointer 9px above the bottom queries the 4px divider, which has no hit. The same happens in `timeGridDay`, in RTL, and in resource timeGrid.

**Proposed fix:** `postponed-fixes/all-day-drop-gap.md` (diagnosis, full patch and an open design decision), postponed until the test revamp is merged. When centering is on, `handleMove` also queries the raw pointer, and uses that hit when the centered query misses, or when the two disagree about `allDay`. It comes with sweep tests that fail before the fix (12 of 24 standard, 6 of 16 resource) and pass after. Over the divider itself, both queries still miss, so the free-drag clone still shows for those ~4px.

## `startStr` of an event at a nonexistent (spring-forward) time disagrees with `start`

```js
initCalendar({ timeZone: 'America/New_York', initialView: 'timelineDay', initialDate: '2024-03-10',
  events: [{ id: '1', start: '2024-03-10T02:30:00', end: '2024-03-10T04:00:00' }] })
e.start.toISOString() // '2024-03-10T07:30:00.000Z' (03:30 EDT, where it renders)
e.startStr            // '2024-03-10T02:30:00-04:00' (= 06:30Z: a different instant, and a nonexistent wall-clock time)
```

The port asserts only `start` (`premium/.../src/event-render/timeline.ts`).

- **Pre-existing:** yes. The code is in `buildRangeEdgeOutput` (`standard/packages/preact/src/structs/event-instance.ts`), added in `470ab2adb` ("More iteration on event tz-aware changes") and shipped since v7.1.0. When the event has no known instant (it was parsed from a string without an offset), `date` comes from `dateEnv.toDate(marker)`, which resolves the gap forward, but `dateStr` formats the unresolved marker with `offsetForMarker(marker)`.
- **GitHub issue:** none found. The closest is #3887 (closed), about events during a DST change getting shorter or longer.
- **Breaking?** No, it's effectively a bug fix. It changes output only for start or end times that don't exist on the wall clock, and today's string is self-contradictory: an offset time that is neither the input's wall time nor the instant of `start`. Round-tripping it is lossy: feeding `startStr` back into `addEvent` places the event at 06:30Z (01:30 EST), an hour before where it rendered. After the fix it would be `'2024-03-10T03:30:00-04:00'`, matching `start` and the rendering.
- **Likely fix:** in the no-instant, non-`omitTime` branch, derive the canonical marker and offset from `dateEnv.toDate(marker).valueOf()`, the way the instant branch does. Check `endStr` and `toPlainObject` too, and the fall-back (repeated hour) case for symmetry.

## `EventApi.getResources()` returns `null` entries

The scheduler's `EventApi.getResources()` maps `resourceIds` through `getResourceById` without filtering. An event whose resources haven't loaded yet (async `resources`), or don't exist, returns `[null]`, though the type is `ResourceApi[]`. Tests avoid it.

GitHub issue #7300 (open), "The described return type of `EventApi::getResources` is incorrect", looks like the same problem.
