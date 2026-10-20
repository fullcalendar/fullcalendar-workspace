# Phase 2: render-hook contract specs

## Purpose

Phases 4 and 5 replace `ContentContainer`, the component behind every `*Class`, `*Content`,
`*DidMount` and `*WillUnmount` option. These specs pin down what users rely on before that happens,
so the rewrite can be checked against them.

They test only the user-visible contract. Timing and ordering details that the roadmap says may change
are deliberately left out.

## Existing coverage (2026-10-19)

- `event-render/event-render-hooks.ts` covers events, including `eventContent` returning `true`.
- Across both test packages:
  - `*DidMount` appears in 25 files;
  - `*WillUnmount` in 6;
  - `{ domNodes }` in 2;
  - `{ html }` in 6;
  - function-form `*Class` in 3, and those are `lib/theme-for-tests*.ts` and
    `resource-render-props.ts`. In practice no spec checks the function form of class options.
- Most areas have some content test, but mount/unmount and the function form of class options are
  thin outside events.
- First step: read the existing specs and list, for each area, which of the checks below already
  exist. Write only the missing ones.

## Areas

**Areas with content and mount hooks:**

- standard: `allDayHeader`, `backgroundEvent`, `dayCell` (content via `dayCellTopContent`),
  `dayHeader`, `event`, `inlineWeekNumber`, `listDayHeader`, `moreLink`, `noEvents`,
  `nowIndicatorHeader`, `nowIndicatorLine`, `slotHeader`, `weekNumberHeader`;
- scheduler: `resourceCell`, `resourceColumnHeader`, `resourceDayHeader`, `resourceGroupHeader`,
  `resourceGroupLane`.

**Mount hooks without content:** `button` (`buttonDidMount`/`buttonWillUnmount`), `dayLane`,
`slotLane`, `resourceLane`, `singleMonth`, `view`.

**Content without mount hooks:** `buttonIcon`, `icon`, `popoverClose`, `resourceExpander`,
`rowEventBefore`, `rowEventAfter`.

**Sub-slots with their own class options**, each tested as its own row:

- `dayCellTopContent`, with `dayCellTopClass` and `dayCellTopInnerClass`;
- `resourceLaneTopContent` and `resourceLaneBottomContent`, each with its own `*Class`.

## Checks per area

Use one table-driven spec file per package. Each row gives:

- the option prefix;
- a view and options that render the area;
- a selector for the area's element;
- how to remove it (change view, remove the event or resource, close the popover).

| Check | Contract |
|---|---|
| `*Class` string | Applied to the area's element. |
| `*Class` function | Called with the area's info object (spot-check the documented keys). Its return value is applied. A falsy return adds nothing. |
| `*Content` string | Rendered as text in the area's content slot. |
| `*Content` `{ html }` | Rendered as HTML in the slot. |
| `*Content` `{ domNodes }` | The nodes are in the slot. When the content function returns different nodes, the old ones are removed. |
| `*Content` returning `true` | The default content renders (only for areas that have default content). |
| `*DidMount` | Called with `el` (the area's element) and the info object. `el` is in the document, and **custom content is already inside it**, including `{ domNodes }`. |
| `*WillUnmount` | Called with `el` and the info object when the area is removed. |

"Custom content is already inside it" covers the built-in forms only (string, `{ html }`,
`{ domNodes }`, React nodes). Vue and Angular render their content asynchronously after
`handleCustomRendering` (`ContentInjector.ts`, `vue3/src/FullCalendar.ts`), so the new code must not
try to wait for it.

**Not pinned, because the roadmap allows these to change:**

- the order of `*DidMount` calls across areas;
- exact timing relative to `datesSet`/`eventsSet`.

## Call-count baseline

Counts may go down but never up (roadmap ground rules), so they need a recorded baseline rather than
exact assertions.

- **Callback counts:** wrap every `*Class`/`*Content`/`*DidMount`/`*WillUnmount` option in a
  counter, in the test harness only.
- **Render counts:** not gated; see "What counts as a render" below.
- **Scenarios:** initial render, `next()`, an unrelated `setOption`, adding an event, a drag, and a
  resize of the container. Run on a busy month view, a busy timeGridWeek and a resource timeline.
- **Noise:** ResizeObserver passes vary run to run in headless Chrome. Run each scenario N times and
  record the max. Compare max against max.
- **Storage:** record under both runtimes, in the same git-ignored folder as the DOM snapshots, and
  share the phase-1 fixtures and runner. Baseline at the phase-1 commit, like the DOM snapshots.
  Comparing later phases against it, any count that goes up fails.
- **Known inflation:** `StandardEvent` builds `renderProps.options` as a new object every render, so
  `ContentInjector`'s shallow `renderProps` check never passes for events and `eventContent` runs on
  every event render. Phase 4 should bring that count down. Record the drop as a win, not noise.

## React-component suite

The vanilla specs run the `Calendar` class, so they can't exercise `<Activity>`, Strict Mode,
Suspense or React 17. The requirements from #8112 and the phase-8 fixes need a suite that renders
`<FullCalendar>` from `@fullcalendar/react` directly.

- **Where:** Karma in headless Chrome, like the other suites. Layout and print need a real browser,
  which rules out jsdom.
- **Version:** React 19.2+ for `<Activity>`. A React 17 smoke run for the shim.
- **Cases, as specs that check current behavior:**
  - Strict Mode mount/remount: calendar works, controller bound;
  - unmount clears all now-timers.
- **Cases that are known bugs today**, written now as pending specs (`xit`, citing the issue) and
  enabled by the phase that fixes them:
  - `<Activity>` hide → re-render → unmount leaves no timers (#8112 bug 1, phase 8);
  - `<Activity>` hide → show keeps the grid's scroll position (#8112 bug 2, phase 7);
  - a suspending `<Suspense>` render arms no timers and dispatches nothing (#8092, phase 8).
- Reuse the reproduction from #8112, which counts timers by wrapping `setTimeout`.

## Event class cascade

Phase 4 removes `StandardEvent`'s `display` switch, so its option cascade needs one extra spec. It runs
for each display variant:

- `row`: DayGrid block events, the TimeGrid all-day row, Timeline;
- `column`: TimeGrid;
- `list-item`: List view, and DayGrid dot events.

It asserts which options reach which part:

- **Parts:** outer element, inner, before, after, time, title.
- **Options:** `event*Class`, `blockEvent*Class`, `rowEvent*Class`/`columnEvent*Class`/`listItemEvent*Class`.

It also checks:

- `rowEventBeforeContent`/`rowEventAfterContent` render only for row events;
- the title sticky options;
- `eventContent` receives `timeClass` and `titleClass` that combine the right layers.

## Done when

- All new specs pass on the current code (after phase 0), except the pending known-bug specs.
- The React-component suite runs under React 19 and React 17.
- The coverage table (area × check: existing spec, new spec, or not applicable) is filled in below.

## What counts as a "render" (decided)

The gate is render-hook callback counts, not component renders.

- Every area calls its `*Class` function on each render of the component that owns the area. With a
  class function supplied for every area, callback counts measure how often each event, cell or
  header rebuilt its JSX.
- Total component renders aren't gated. Composition adds components (`EventEl`, `EventResizer`, …)
  without adding work. Record them for information only if that's cheap.

## Coverage table

To fill in during the phase.
