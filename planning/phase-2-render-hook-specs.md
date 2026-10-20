# Phase 2: render-hook contract specs

## Purpose

Phases 4 and 5 replace `ContentContainer`, the component behind every `*Class`, `*Content`,
`*DidMount` and `*WillUnmount` option. These specs pin down what users rely on before that happens,
so the rewrite can be checked against them.

They test only the user-visible contract. Timing and ordering details that the roadmap says may change
are deliberately left out.

## Status

Built. Files:

- `standard/packages/vanilla-tests/src/lib/render-hook-contract.ts`: the table-driven harness,
  `describeRenderHookContract(area)`. In `lib/` so the scheduler tests can import it.
- `standard/packages/vanilla-tests/src/render-hooks/render-hook-contract.ts`: 23 standard areas.
- `premium/packages/vanilla-scheduler-tests/src/misc/render-hook-contract-resource.ts`: 9 resource
  areas.
- `standard/packages/vanilla-tests/src/lib/event-class-cascade.ts`, plus
  `render-hooks/event-class-cascade.ts` (5 cases) and
  `vanilla-scheduler-tests/src/misc/event-class-cascade-timeline.ts` (1 case).
- `premium/packages/vanilla-scheduler-tests/src/dom-snapshot/counts.ts`: the call-count scenarios,
  recorded by the phase-1 tool.
- `standard/packages/react/tests/lifecycle.tsx`: the React-component cases.

**Results:**

- Standard: 160 specs pass, 3 pending known bugs.
- Scheduler: 62 specs pass.
- Same results under Preact and under React (`FORCE_REACT=1`).
- React vitest suite: 32 pass, 3 of them `it.fails` for known bugs.

Run them with:

```sh
node scripts/bin/karma-test.js standard/packages/vanilla-tests "/^(render hooks: |event class cascade)/"
node scripts/bin/karma-test.js premium/packages/vanilla-scheduler-tests "/^(render hooks: |event class cascade)/"
pnpm --filter @fullcalendar/react test
```

**Departures from the plan below:**

- **Every area, every check.** Rather than writing only the missing checks, the harness runs every
  check for every area. That's uniform and cheap (about 20s), and the existing specs stay as they
  are.
- **Toolbar buttons.** There is no top-level `buttonDidMount`/`buttonWillUnmount`, and no
  `icon*Content`. Button hooks are per-button (`buttons.<name>.class`/`didMount`/`willUnmount`/
  `iconContent`), and the harness builds them through a per-area `buildOption`.
- **Calibration flags.** `listDayHeader` renders its content twice per header (`contentSlotsPerEl: 2`).
  `slotHeader` has no content in minor slots (`isContentInSomeEls`). Default-content comparison uses
  markup rather than text, because some defaults are icons.
- **Known bugs** are pending specs (`xit` in Jasmine, `it.fails` in vitest), with the reason in the
  title. Phase 4/5 or a pre-pass should fix them and switch them on (see Findings).
- **Title sticky options** aren't checked: they apply internal hashed classes, which the cascade spec
  can't name. The DOM snapshots cover them instead.
- **React-component suite.** `@fullcalendar/react` already had a vitest + jsdom suite
  (`tests/index.tsx`, 27 tests), so the cases went there rather than into a new Karma package. jsdom
  is fine for timers, Strict Mode, `<Activity>` and Suspense.
  - The `<Activity>` scroll case (#8112 bug 2) needs real layout, so it waits for phase 7 and a
    browser suite.
  - The React 17 smoke run waits for phase 9, when the `useSyncExternalStore` shim arrives. Mounting
    differs across React 17/18/19 (`ReactDOM.render` vs `createRoot`), and nothing uses the shim yet.

## Findings

**Known bugs found by the new specs** (pending, not fixed):

- **(Fixed in phase 7.) `singleMonthDidMount` is never called, and `singleMonthWillUnmount` gets
  `el: undefined` and no info.** `SingleMonth.handleEl` is never attached as a ref, and `renderProps` is never set. It has
  been like this since the v7 import (`49dc588dc`).
- **Per-button options replace the theme's instead of merging.** `buttons` merges with
  `mergeMaybePropsDepth1`, which is shallow per button. A user's `buttons.prev.iconContent` returning
  `true` therefore renders no icon instead of the theme's. The same merge probably drops the theme's
  per-button `class`/`didMount` when a user sets their own.
- **Now-timers stall in Strict Mode (React, dev only).** The replayed unmount destroys them, and
  they're only armed during render. Already known from the pre-pass; phase 8 fixes it.
- **#8112 bug 1 and #8092** are reproduced as failing cases, with 2 and 4 leaked long timers
  respectively.

**Call counts:**

- 18 scenarios (3 views × 6 actions), each run 3 times.
- No count varied between runs, or between two separate recordings.
- Setting an unrelated option (`dragScroll`) re-runs `eventContent` for every visible event (103
  calls in a busy month view). That's the kind of waste the refactor can remove.
- Resizing the container calls no render hooks in any of the three views.

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
- A survey found:
  - `eventWillUnmount` was the only `*WillUnmount` with a spec;
  - `*Class` strings were almost untested;
  - several existing specs only counted calls.
- Areas with no spec at all:
  - `allDayHeader`, `inlineWeekNumber`, `nowIndicatorHeader`/`Line`, `weekNumberHeader`;
  - `resourceGroupLane`, `resourceLaneTop`/`Bottom`, `singleMonth`, `popoverClose`,
    `resourceExpander`, `rowEventBefore`/`After`;
  - the button hooks.

## Areas

**Areas with content and mount hooks:**

- standard: `allDayHeader`, `backgroundEvent`, `dayCell` (content via `dayCellTopContent`),
  `dayHeader`, `event`, `inlineWeekNumber`, `listDayHeader`, `moreLink`, `noEvents`,
  `nowIndicatorHeader`, `nowIndicatorLine`, `slotHeader`, `weekNumberHeader`;
- scheduler: `resourceCell`, `resourceColumnHeader`, `resourceDayHeader`, `resourceGroupHeader`,
  `resourceGroupLane`.

**Mount hooks without content:** `button` (per-button `didMount`/`willUnmount`), `dayLane`,
`slotLane`, `resourceLane`, `singleMonth`, `view`.

**Content without mount hooks:** `buttonIcon` (per-button `iconContent`), `popoverClose`,
`resourceExpander`, `rowEventBefore`, `rowEventAfter`.

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
  share the phase-1 fixtures and runner. Baseline at the phase-2 commit, where the counts first exist.
  Comparing later phases against it, any count that goes up fails.
- **Known inflation:** `StandardEvent` builds `renderProps.options` as a new object every render, so
  `ContentInjector`'s shallow `renderProps` check never passes for events and `eventContent` runs on
  every event render. Phase 4 should bring that count down. Record the drop as a win, not noise.

## React-component suite

The vanilla specs run the `Calendar` class, so they can't exercise `<Activity>`, Strict Mode,
Suspense or React 17. The requirements from #8112 and the phase-8 fixes need a suite that renders
`<FullCalendar>` from `@fullcalendar/react` directly.

- **Where (as built):** the existing vitest + jsdom suite in `@fullcalendar/react`. See Status for
  why, and for the two cases that wait for a real browser or React 17.
- **Version:** React 19.2+ for `<Activity>`.
- **Cases, as specs that check current behavior:**
  - Strict Mode mount/remount: calendar works, controller bound;
  - unmount clears all now-timers.
- **Cases that are known bugs today**, written now as `it.fails` specs citing the issue, and flipped
  to `it` by the phase that fixes them:
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
- `eventContent` receives `timeClass` and `titleClass` that combine the right layers.

## Done when

- [x] All new specs pass on the current code (after phase 0), except the pending known-bug specs.
- [x] The React-component suite runs under React 19. React 17 is deferred to phase 9 (see Status).
- [x] Coverage: every area × applicable check now has a spec from the harness. The survey of prior
  coverage is summarised above.
- [x] A baseline, DOM snapshots plus counts, under both runtimes at the phase-2 commit: label
  `baseline`, commit `ab24bd42a`. Its DOM matches `phase1` exactly (0 of 129 fixtures changed).
  Re-record from `ab24bd42a` if the folder is lost.

## What counts as a "render" (decided)

The gate is render-hook callback counts, not component renders.

- Every area calls its `*Class` function on each render of the component that owns the area. With a
  class function supplied for every area, callback counts measure how often each event, cell or
  header rebuilt its JSX.
- Total component renders aren't gated. Composition adds components (`EventEl`, `EventResizer`, …)
  without adding work. Record them for information only if that's cheap.
