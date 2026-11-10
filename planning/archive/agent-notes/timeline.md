# Timeline port notes

Area: premium `src/timeline/*` -> premium `tests/` (event-render, more-link, time-slots, visible-range,
navigation, now-indicator, business-hours, resource-render, resource-data, calendar-lifecycle).

New shared helper (premium only, additive): `tests/lib/models/timeline-layout.ts` (slot lanes/headers,
time-boundary x positions, span assertions, background events, resource-area rows/cells, expander clicks).

## Possible library quirks

### `startStr` of an event starting at a nonexistent (spring-forward) time disagrees with `start`

```js
initCalendar({ timeZone: 'America/New_York', initialView: 'timelineDay', initialDate: '2024-03-10',
  events: [{ id: '1', start: '2024-03-10T02:30:00', end: '2024-03-10T04:00:00' }] })
const e = calendar.getEventById('1')
e.start.toISOString() // '2024-03-10T07:30:00.000Z' (03:30 EDT, where it renders)
e.startStr            // '2024-03-10T02:30:00-04:00' (= 06:30Z, a different instant, and a wall-clock time that doesn't exist)
```

The event renders at 03:30 EDT, consistent with `start`. `startStr` keeps the nonexistent wall-clock
time with the post-transition offset. The legacy spec only checked rendering; the port checks `start`.

### Virtualized resource timeline with `scrollTime: '00:00'` re-renders every frame, forever

```js
initCalendar({ initialView: 'resourceTimelineDay', initialDate: '2015-08-07', virtualization: true,
  scrollTime: '00:00', resources: [] /* or 1 resource, or resources fetched later */ })
```

A MutationObserver on the calendar counts ~2,700 mutations per 500ms, indefinitely, so
`waitForSettle()` never resolves. With `scrollTime: '01:00'`, the default scrollTime, or 26 static
resources (vertically overflowing) it goes quiet. When resources are fetched late (26 of them),
the loop that started while empty keeps going. Karma never noticed because it slept a fixed time.
`resource-data/timeline.ts` "keeps the scroll position when virtualized" uses `scrollTime: '01:00'`
to sidestep it (the test is about scroll retention, not scrollTime).

### `slotHeaderInterval` doesn't align to `firstDay` (legacy test was vacuous)

The legacy "respects firstDay with auto-detected alignment with 7-days" used an initialDate that is
already a Monday, so it passed without any alignment. From a Wednesday, a `duration: { days: 183 }`
timeline with `slotHeaderInterval: { days: 7 }` and `firstDay: 1` starts on the Wednesday (range and
headers). The port asserts that current behavior (`visible-range/timeline.ts`). If firstDay alignment
was intended, that's a bug.

### #4937 still reproduces

`slotDuration: { days: 1 }` + `slotHeaderInterval: { months: 1 }` in timelineYear warns
"Invalid option `slotHeaderInterval`: must be a multiple of `slotDuration`" and renders 12 month
slots instead of 365 days. Ported as `it.fails` in `visible-range/timeline.ts` (turns red once fixed).

### Resource order of an added resource

Not a bug, just a note: with ids `r0..r49`, `addResource({ id: 'last' }, true)` sorts first (default
order by id), so the legacy "scrolls to the added resource" spec needed an id that sorts last.

## Legacy specs dropped or changed

- `timeline-duration.ts`: entirely commented out.
- `timeline-event-rendering.ts` #5549 (`xit`): marked dead by its own v7 note (and the plan).
- `timeline-event-rendering.ts` matrix: 487 specs (tz x direction x resources x eventDisplay x
  snapDuration) collapsed to the subject dimension (clipping/cropping per slot scale) with explicit
  RTL, no-resources, local-tz, background and inverse-background cases. snapDuration doesn't affect
  rendering, so it was dropped as a dimension.
- `timeline-days.ts`: checked legacy day-state classnames; rewritten to check the state reported to
  `slotHeaderClass`/`slotLaneClass` (dow, today, past, future) and applied to the parts.
- `timeline-dst-instant-fidelity.ts` "round-trips an emitted startStr back to the same rendering
  position": covered by composition (event-drag "drops onto the second copy" asserts the emitted
  startStr, and event-render renders that string at the second copy). Its overlap and eventAllow
  specs went to `event-drag/timeline.ts` "across DST" (event-drag owner's file, additive).
- `timeline-nowIndicator.ts`: "refreshes at intervals" uses fake setTimeout/Date timers instead of
  2s of real waiting. The 30px tolerance was tightened to 2px (3px for DST).
- `timeline-addResource.ts` virtualized replace-all specs depend on the 500ms scroll-end debounce,
  which the library doesn't make configurable. They fake setTimeout while it runs out (see
  `passTime`/`scrollAndEnd` in `resource-data/timeline.ts`) instead of sleeping 700ms.

## Open questions

- The scroll-end debounce (500ms, `ScrollListener`) isn't configurable. Faking timeouts works but
  is fiddly; a test-settable config value (like `touchMouseIgnoreWait`) would be simpler.
- Legacy `src/lib/wrappers/Timeline*Wrapper.ts` remain because other legacy specs still import them.
  `src/lib/dst-timeline-utils.ts` was deleted (no users left).
