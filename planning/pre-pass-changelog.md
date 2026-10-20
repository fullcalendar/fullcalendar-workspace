# Pre-pass changelog (internal)

Small, surgical fixes made before the hooks / data-architecture refactor, so the refactor starts
from a baseline where the existing tests describe correct behavior. Nothing here changes public API.

Branch: `t3/component-data-architecture-review`, one commit per fix. Reviewed in three rounds by
GPT-6.1-Sol (high effort) via the T3 orchestrator; round 3 had no findings.

---

## 1. Resource timeline crashes when print mode starts on first mount

**File:** `premium/packages/preact-scheduler/src/resource-timeline/components/ResourceTimelineView.tsx`

`ResourceTimelineView` passes `timeCanvasClipStart={this.scrollRef.current.x}` to the print layout.
`scrollRef` is only populated by the screen layout. If the view's first render is already in print
mode (e.g. `_beforeprint` fired, then `changeView('resourceTimelineDay')`), `scrollRef.current` is
undefined and render throws.

**Fix:** `this.scrollRef.current?.x ?? 0`.

**Test:** new `premium/packages/vanilla-scheduler-tests/src/timeline/timeline-print.ts`. For both
`resourceTimelineDay` and `timelineDay`: init in `dayGridMonth`, trigger `_beforeprint`, switch to the
timeline view, wait, assert the event renders. `_afterprint` fires in `finally`.

## 2. Now-timer leaks timers during server-side rendering

**File:** `standard/packages/preact/src/NowTimerRunner.ts`

`NowTimerRunner.update()` runs during render (called from `CalendarDataManager`). On first update it
armed a `setTimeout` (until the next day boundary) and registered a reset listener. On the server
nothing ever calls `destroy()`, so each `renderToString` left a timer of up to a day holding the
whole calendar in memory. Measured: 3 renders left 6 timers of ~411 minutes each.

**Fix:** a local `isLiveEnvironment()` (`typeof document !== 'undefined'`) now guards the timer and
reset listener, not just the `visibilitychange` listener as before. Same guard on the
re-arm path and in `destroy()`. After the fix: 0 timers.

**Known gap (declined in review):** SSR with a fake `document` (jsdom) still arms timers. Unusual
setup and no worse than before; the hooks refactor fixes it for real by starting timers in an effect.

**Test:** not a Karma spec (needs Node). Verified with an ad-hoc script that wraps `setTimeout`,
imports the built React package, calls `renderToString` three times and counts live handles.

## 3. `CalendarController` binding bugs

**Files:**
- `standard/packages/preact/src/CalendarController.ts`
- `standard/packages/preact/src/options-change-handlers.ts`
- `standard/packages/preact/src/reducers/CalendarDataManager.ts`
- `standard/packages/preact/src/CalendarInner.tsx`

A `CalendarController` is bound to a calendar's API via `_setApi()`. Problems before:

- **No date-change handler crashed.** `new CalendarController()` (handler is optional) called
  `calendarApi.on('datesSet', undefined)`.
- **Never unbound.** Destroying the calendar, replacing the `controller` option, or removing it left
  the old controller pointing at the old calendar. It kept reporting a stale view/date and kept
  receiving `datesSet`.
- **`setOption('controller', undefined)` threw**, because the change handler called
  `undefined._setApi()`.

What changed:

- `_setApi()` only calls `on`/`off` when a handler exists.
- New `_unsetApi(api)`: unbinds only if still bound to *that* calendar. Prevents one calendar's
  teardown from unbinding a controller another calendar has since taken over.
- New `_restoreApi(api)`: binds only if currently unbound. Prevents a destroyed calendar that renders
  again from stealing a controller another calendar now owns.
- The `controller` option-change handler unbinds the previous controller (read from
  `getCurrentData()`, which is still the previous data while change handlers run) and binds the new
  one. Doing this in the change handler, not in a component update, covers transitions with no
  render in between (A → B → C inside `batchRendering`) and calendars never rendered.
- `CalendarDataManager.destroy()` unbinds. Covers destroy before first `render()`.
- `CalendarInner.componentDidMount` calls `_restoreApi()`, because `destroy()` unbinds and must be
  undone on remount: React StrictMode's unmount/remount, and vanilla `render()` after `destroy()`.
  It reads the controller from `getCurrentData()` (not props, which may be stale) and runs
  *before* `propSetHandlers`/`contextInit`. Otherwise a `datesSet` callback that swaps the
  controller during mount would get the old one rebound.

**Review history:**
- Round 1 found the no-render-between transitions, destroy-before-render, and the `undefined`
  throw. The first version unbound in `componentDidUpdate`/`componentWillUnmount`, which missed
  these; moved to the change handler and `destroy()`.
- Round 2 found the stale-props rebind and the destroyed-calendar steal; added `_restoreApi()` and
  moved the mount rebind before callbacks.

**Test:** new `standard/packages/vanilla-tests/src/toolbar/calendar-controller.ts` (10 specs): bound
while rendered; works without handler; unbound on destroy; unbound on destroy before render;
replaced via `setOption`; A → B → C in `batchRendering`; option removed; swap inside initial
`datesSet`; not reclaimed by a destroyed calendar that re-renders; rebindable after destroy.

## 4. `TimeGridLayoutPannable`: equality check on the wrong thing, scrollers never destroyed

**File:** `standard/packages/preact/src/timegrid/components/TimeGridLayoutPannable.tsx`

- `headerTierHeights` is **state**, but its `isArraysEqual` check was registered with
  `addPropsEquality`, so it never ran. Every header re-measure set a new array and forced a
  re-render even when the heights were unchanged. Now `addStateEquality`.
- `destroyScrollers()` only nulled the refs. The two `ScrollerSyncer` instances were never
  `destroy()`ed, leaving their scroll listeners attached to the old scrollers. Now destroyed first.

## 5. Dead `addPropsEquality` entries

**Files:** `standard/packages/preact/src/common/StandardEvent.tsx`, `standard/packages/preact/src/timegrid/components/TimeGridCols.tsx`

`StandardEvent` registered equality for a `seg` prop and `TimeGridCols` for a `style` prop. Neither
component has that prop any more, so the entries did nothing. Removed, along with the now-unused
`isPropsEqualShallow` imports. No behavior change; they would have misled the hook conversion.

## 6. `SingleMonth` sets state after unmount

**File:** `standard/packages/preact/src/multimonth/components/SingleMonth.tsx`

The two `watchHeight` callbacks (title height, table header height) could fire after unmount and
call `setState`. Added the `_isUnmounting` early return that the component's other callbacks
already use.

## 7. No-op block in `DateProfileGenerator.buildRangeFromDuration`

**File:** `standard/packages/preact/src/DateProfileGenerator.ts`

A block "if the view displays a single day or smaller, skip hidden days" ran `isHiddenDay(start)`
before `start` was ever assigned, so it never did anything. Removed. Worth checking during the
date-profile refactor whether that skipping was meant to happen here.

---

## Verification

- New specs: controller 10/10, timeline print 4/4.
- Regression: 585 standard specs and 992 scheduler specs passed (both before the final controller
  rework). After it, a 237-spec controller-adjacent subset (toolbar, options, destroy,
  navigation) passed. Multimonth 13/13.
- Reviewer's own probes in round 3: React 18.3.1 and 19.2.4 StrictMode, vanilla destroy/render,
  controller handoff between calendars, destroy before first render.

## Deliberately not fixed here

Left for the hooks conversion, which removes their causes:

- Mount-time watchers that close over stale props.
- `ResourceTimelineLayoutNormal` removing only some of its listeners on unmount.
- Now-timer dead window under StrictMode remount.
- Dispatching during render (`CalendarDataManager.update()` / option change handlers).
