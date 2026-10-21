# scheduler-misc agent notes

Area: premium `src/misc/` and `src/column/` -> premium `tests/` (Vitest).

## Potential library quirks / bugs

### `ResourceApi.toPlainObject()` never outputs `eventColor`
`premium/packages/preact-scheduler/src/resource/api/ResourceApi.ts`: the `if (ui.contrastColor)` block is
duplicated, and there's no `if (ui.color) res.eventColor = ui.color`. Repro:
`calendar.getResourceById('a').toPlainObject()` with `{ id: 'a', eventColor: 'red' }` gives `{ id: 'a' }`.
Test: `tests/resource-data/crud.ts` (`it.skip('includes eventColor')`).

### `ResourceApi.setProp()` silently drops event-styling props
`setProp('eventColor', 'blue')` dispatches SET_RESOURCE_PROP, whose reducer spreads `{ [name]: value }` onto the
internal resource. But the internal resource keeps styling in `ui` (`ui.color`, `ui.className`, ...), so
`resource.eventColor` stays the old value and events aren't restyled. Only raw struct fields (`title`) work.
Test: `tests/resource-data/crud.ts` (`it.skip('changes an event-styling prop')`).

## Notes for the maintainer

- `fetch-mock` isn't in the premium Vitest config's `optimizeDeps.include`, so the first run after a cache clear
  prints "Vite unexpectedly reloaded a test". Harmless, but adding it to `optimizeDeps.include` would avoid it.

### `EventApi.getResources()` returns `null` entries for unknown resource ids
`premium/packages/preact-scheduler/src/resource/api/EventApi.ts` maps `resourceIds` through `getResourceById`
without filtering, so an event whose resources haven't loaded yet (async `resources` function) or don't exist
returns `[null]`, though it's typed `ResourceApi[]`. Repro: `resources` function that answers later, event with
`resourceId: 'a'`; `calendar.getEvents()[0].getResources()` is `[null]` until it answers. Tests avoid it
(`tests/resource-data/event-association.ts`).

### A `resourceOrder` function gets plain objects, not ResourceApis
`resource-hierarchy.ts` compares `buildResourceFields(resource)` (extendedProps, ui and core fields flattened into
one object), though `orderSpecs` is typed `OrderSpec<ResourceApi>[]` (there's a "TODO: pass in ResourceApi?").
So `(a, b) => a.extendedProps.floor - ...` throws; `a.floor` works. Tested as is in
`tests/resource-data/resource-order.ts`. Worth confirming which the docs promise.

### dayGrid doesn't shade a Sunday that follows Saturday in the same row (non-business days)
Standard dayGrid, not scheduler-specific. A 2-day view starting on a Saturday, with `businessHours: true`:
`{ initialView: 'dayGridTwoDay', initialDate: '2015-11-21', businessHours: true, views: { dayGridTwoDay: { type: 'dayGrid', duration: { days: 2 } } } }`.
Sat Nov 21's cell gets a `nonBusinessHours` fill, Sun Nov 22's doesn't. Same for `resourceDayGrid` and for a
timeGrid's all-day row (its timed lanes are both shaded correctly). `dayGridWeek` (Sun..Sat) shades both
weekend days, so it seems tied to the range crossing a week boundary. Found while porting; not covered by a test.

### `next()` can move backwards when dateIncrement is smaller than the duration
`{ initialView: 'timeline', initialDate: '2017-04-12', duration: { months: 1 }, dateIncrement: { days: 7 } }`
starts at Apr 12–May 12 (aligned to the dateIncrement's unit), but `next()` gives Apr 8–May 8: it takes the start
of the duration's unit (Apr 1) and adds 7 days. With `dateIncrement: { week: 1 }`, Apr 9 → Apr 2. Moving
backwards on "next" looks wrong. Test: `tests/visible-range/scheduler-views.ts` (`it.skip`).

## Legacy specs dropped or changed

- `misc/license.ts` "is invalid when crap text when directly instantiating": only checked that `new Calendar(...)`
  with `schedulerLicenseKey` compiles. Not a runtime behavior; dropped.
- `misc/max-timeline-slots.ts` only checked `config.MAX_TIMELINE_SLOTS` exists. Replaced by behavior: a slotDuration
  over the limit is ignored with a warning, and lowering the config lowers the limit.
- `column/agenda-nowIndicator.ts` #3918 had no assertions ("plays nice"). The port asserts the now-indicator
  ends up in today's column of each resource after the same navigation sequence.
- `misc/dateIncrement.ts`: kept the initial-range checks; `next()` from those ranges is the quirk above.
- `misc/resourceOrder.ts`: titles sorted the same as ids, so "by title" didn't discriminate. Rewritten with data
  where id, title and a custom field all sort differently, plus `-title` and a compare function.
- `misc/refetchResourcesOnNavigate.ts` "refetches async resources on quick navigate" only counted calls. Now also
  checks the latest response wins, and that a stale response arriving last is ignored.
- `misc/rerenders.ts` simulated a window resize; the port resizes the calendar element.
- `misc/destroy.ts`: the legacy listener counter compared against a preact-root baseline. The port tracks the
  exact listeners left on window/document (must be none) and compares the element's leftovers with a plain
  `dayGridDay` calendar's.
- `column/column-businessHours.ts` and `column/column-event-render.ts` ran everything in LTR and RTL. Business
  hours are vertical (RTL doesn't matter), so RTL was dropped there; event rendering keeps one RTL row per view.
- `column/column-rerendering.ts` "maintains scroll" had `resources`/`events` functions returning each other's data
  (a legacy typo). The port uses the right data.
- `misc/visibleRange.ts` "in vertical resource view" used `initialView: 'timeGrid'`, which isn't a resource view;
  the port uses `resourceTimeGrid`.

## Helpers added (new files only)

- `tests/lib/models/resource-columns.ts`: `ResourceColumnsModel` (header rows/cells, resource headers, body
  columns as `{ date, resourceId }`, placeholder blank cells), `getTimelineResourceIds/Titles`.
- `tests/lib/fetching.ts`: `createHeldFetch` (a resources/events function answered when the test says),
  `whenLoaded`.
- `tests/lib/filter-resources-with-events.ts`: expected-layout builders for filterResourcesWithEvents.

## Notes for the shared models

- `TimeGridModel.getDayLane` (standard `tests/lib/models/time-grid.ts`) counts header cells that carry the
  `dayLane` part. With filterResourcesWithEvents placeholders, the header's blank cell is `dayLane` too, so a spot
  on a placeholder date matches two lanes and throws. I didn't change the shared model; the placeholder tests
  compute their own points. Restricting it to the table body would fix it.
