# Sol review findings, round 2 (to apply)

Paths are now under each package's `src/` (formerly `tests/`). Line numbers refer to the reviewed commits and may have shifted.

## Event data (620278ed8), standard
1. event-api/set-prop.ts (~38): the title mutation test uses getRenderedEventTitles() (event metadata). Assert the visible text (leaf texts / textContent of the event element) after mutation.
2. event-api/add-remove.ts (~98) and event-sources/add-remove.ts (~129): restore numeric input IDs (incl. numeric `0` for #2082) for events and sources, asserting they're stored/looked up correctly.
3. event-sources/function.ts (~38): assert the exact `info.end` instant per time-zone row (local, UTC, named), not just `instanceof Date`.
4. event-api/set-dates.ts (~145): add an it.fails case for an initially TIMED event keeping `allDay === false` after setDates without the allDay option (same KNOWN BUG comment style).
5. event-sources/function.ts (~112): add a non-native thenable case (a small custom object with `.then(onFulfilled, onRejected)`), alongside the native Promise case.
6. event-sources/icalendar.ts (~261): refetch returns a changed feed the second time; assert the events are replaced with the new data.
7. event-sources/lazy-fetching.ts (~31): with lazyFetching:true, navigate beyond the fetched range and assert another fetch (positive control).
8. event-sources/google-calendar.ts (~45): add a timed item with offset `dateTime` and assert its start/end and allDay:false.
9. event-sources/function.ts (~118): a returned Promise that rejects: failure handler fires and loading goes [true, false].

## Calendar/navigation (37de9df2d), standard
1. toolbar/title.ts (~52): capture `view.title` INSIDE viewDidMount, assert the captured string.
2. visible-range/day-count.ts (~19, ~29): also compare rendered day cells (dayGrid) / day lanes (timeGrid) with the expected dates, incl. absent weekends.
3. navigation/goto-date.ts (~39) and navigation/prev-next.ts (prevYear/nextYear ~163, incrementDate ~181): also assert the toolbar title after each operation.
4. sizing/height.ts (~106): add one `setOption('height', '100%')` case on an existing calendar.
5. calendar-lifecycle/rerender-counts.ts (~80 and the timeGrid/list equivalents): resize while an event is still visible (assert it's present) before checking eventContent count 0.

## Event rendering (ad10d7409), standard
1. event-render/timegrid.ts (~19): placement check must also verify horizontal containment within the day lane. more-link/daygrid.ts (~58): more-link must be vertically inside its cell too (full containment).
2. event-render/coloring.ts (~80): background-color precedence: assert the expected resolved color (independent anchor) rather than only comparing to a reference exposed to the same source options.
3. event-render/daygrid.ts (~387): async navigation regression: let the empty view settle (waitForSettle) BEFORE invoking the saved success callback.
4. more-link/daygrid.ts (~359, #7447): assert the expected visible events exist (non-empty, specific ids/titles) so the test can't pass with all events hidden.
5. event-click-hover/event-mouse-enter.ts (~69): after the update-while-hovered check, move outside and require exactly one eventMouseLeave from the updated event.
6. event-render/timegrid.ts (~165, ~197): slotEventOverlap:false: assert no overlap at all between events (not just no complete obscuring).
7. event-render/multimonth.ts (~12): add an event spanning a month boundary (Jan 31 → Feb 2); check both segments' dates and start/end edges.
8. event-click-hover/event-click.ts: add eventClick in timeGrid, list rows, and a popover event; eventMouseEnter/Leave for a list event.

## Scheduler resources/columns (9ed38b371), premium
1. resource-data/crud.ts (~108): after each resource removal in column views, also check the timeGrid body lanes (columns), not just headers.
2. event-render/resource-columns.ts (~49): assert both horizontal edges stay within the expected column (allow normal margins), not just the center.
3. event-render/resource-columns.ts (~129): resourceDayGridTwoDay with datesAboveResources:true split all-day events: restore isStart/isEnd assertions per segment (e.g. via the rendered start/end markers or getElEventRange seg info).
4. sizing/horizontal-scrolling.ts (~27, #5674): also compare the date-header row heights across the fixed and scrolling header sections under expandRows:true.
5. resource-data/filter-resources-with-events.ts (~56): add the opposite arrival order: resources load first, events held then released; for timeline and resource columns.

## Scheduler timeline (8ca7dd7f9), premium
1. event-drag/timeline.ts (~272) / event-render/timeline.ts (~519): DST round-trip: after the drag across DST, assert the dropped event's end instant and endStr too; then re-add an event from the emitted startStr/endStr and check both rendered edges.
2. event-render/timeline.ts (~356, #5792): assert the canvas/slot background extends to cover the lower events (canvas height vs content), not just event span / scrollHeight.
3. resource-data/timeline.ts (~281): virtualization table: restore the case where the replacement data is `buildIds(3, 90)` (no new a000) and the existing `r003` ends up at the top; parameterize replacement data + expected first resource.
4. business-hours/timeline.ts (~119): with expandRows:true, assert the expected fill count/ranges before comparing heights (can't pass with zero fills).
5. business-hours/timeline.ts (~36): check each fill's top/bottom against its resource lane (vertical placement), not just count and horizontal edges.
