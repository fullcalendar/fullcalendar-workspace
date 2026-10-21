# Phase 7: layout families

Status: done.

One family at a time, in the roadmap's order: DayGrid, TimeGrid, MultiMonth and List, Timeline,
ResourceTimeline. Each family is split into steps, committed and reviewed separately.

## DayGrid

Steps:

1. The layout shell: `DayGridLayout`, `DayGridLayoutNormal`, `DayGridLayoutPannable`,
   `DayGridLayoutPrint`, plus `useInitialScroll` and `useScrollerSyncer`. (done)
2. `DayGridRows` (onto `useHitTarget`) and the header: `DayGridHeader`, `DayGridHeaderRows`,
   `DayGridHeaderRow`, `DayGridMoreLink`. (done)
3. `DayGridRow` and `DayGridCell`, which TimeGrid's all-day lane and the resource views share. (done)
4. View data: `DayGridView` and `ResourceDayGridView` share a `useDayGridViewData`. (done)

### Step 1: the layout shell

- **`DayGridLayout` is the shell.**
  - It renders the `ViewContainer`. Inside it, a `DayGridLayoutBody` chooses print, pannable
    (`dayMinWidth`) or normal, and owns what they share: the `totalWidth` and `clientWidth`
    measurements, the row-height map, and the initial scroll.
  - The print branch that Normal and Pannable both had is now in one place.
  - The measurements live in the body, not the shell. Otherwise a measurement would re-render
    `ViewContainer`, whose `children` are a new element each time, and call `viewClass` and the
    other view class hooks more often than before.
- **Print reuses the screen's `totalWidth`** (for the row min-heights; the roadmap's catch). The
  body ignores the `null` the `Ruler` reports when it unmounts on entering print.
  - **But not the screen's `clientWidth`.** Before, the `Scroller` unmounting on entering print
    reported `null`, so print cells were never narrow. Keeping it changed the print DOM (narrow
    classes in `resourceDayGridMonth/print`), so print still computes density without it.
- **Normal and Pannable** are function components that take their measurements as plain props,
  so their `memo` holds. Pannable syncs its header, body and footer scrollers with
  `useScrollerSyncer`, which also clears `scrollerRef` on unmount. The class never did (spec §9).
- **`computeCellDensity`** and **`computeDayGridColumns`** in `daygrid/components/util.tsx`
  (spec §4.5). TimeGrid's copies switch over when it converts.

### `useInitialScroll` (#8112 bug 2)

`standard/packages/preact/src/hooks/useInitialScroll.ts`, spec §5.3.

- **One scroll target per instance**, in a ref. It's either logical (DayGrid: a date, projected
  through the row heights) or the pixel position the user scrolled to.
- **Each mount** re-applies it, including a shown `<Activity>` and a Strict Mode replay. Before, the
  layout reset to the initial date in `componentDidMount`, which `<Activity>` re-runs on every show,
  so the grid jumped back (#8112 bug 2, for DayGrid).
- **A date-profile change** resets the target when `scrollTimeReset` is on, as before.
- **A user scroll** (`isDevice`) replaces the target with the position. Before, it only cleared the
  date.
- **Geometry changes** (row heights) re-project a logical target, as before.
- **Behavior change: leaving print** re-applies the current target. Before, it reset to the current
  date, so the grid now stays where the user had scrolled. This is spec §5.3's rule.
- **Spec:** `vanilla-tests/src/view-render/activity-scroll.ts`, React runtime only, pending in
  Preact. It mounts the React component in `<Activity>`, scrolls, hides and shows. It fails on the
  old behavior (0 instead of 80).
  - It needs `fullcalendar-w-react/react` (the test-only React build that `fullcalendar/preact` maps
    to) to also export `Activity`, `createRoot`, `flushSync` and the React `FullCalendar` component.

### Step 2: rows and header

- **`DayGridRows`** is a memo function component. It registers its hit target with `useHitTarget`,
  measures the more-link probe with `useReportedSize`, and keeps its own row-height `RefMap`, which
  forwards to the layout's map (through `useLatest`, so the map is stable).
- **`DayGridHeader`**, **`DayGridHeaderRows`** and **`DayGridMoreLink`** are memo functions.
- **`DayGridHeaderRow`** keeps its inner-height `RefMap` in state and reports the max after size. On
  unmount it reports `null`, as the class did.
- **React test (#8119):** `tests/index.tsx` read `moreLinkHeight` off `DayGridRow`'s fiber. jsdom
  has no layout, so the test stubs `getClientRects` (the hidden-element guard in `useReportedSize`),
  and reads the props through the class instance, since the DOM node's fiber can be a stale
  alternate.

### Step 3: row and cell

- **`DayGridRow`** is a memo function component.
  - Its row-height, cell-header, cell-main and slice-height `RefMap`s are created once, with stable
    handlers, so `afterSize` still dedupes one re-render per batch. The handlers read the latest
    props through `useLatest`, and re-render with a counter in state (the class's `forceUpdate`).
  - `levelCapacity`, the auto-placement ratchet, is a ref.
  - The print-height map starts over on leaving print (a layout effect on `forPrint`, the class's
    `componentDidUpdate`).
  - The root goes to `rootElRef` through `useForwardedElRef` (TimeGrid's all-day lane attaches its
    hit target there), and its height to `heightRef` through `useReportedSize`. So a row inside a
    `display:none` subtree no longer reports 0 heights.
  - The render helpers are module functions taking the props.
- **`DayGridCell`** is a memo function component. A local `useBodyHeights` measures the body (header
  height and main height) in a layout effect, re-registering when the body element or whether it's
  measured changes, and reporting `null` on cleanup, as the class's ref callback did.
- **React test (#8119):** with no class instance left, `findComponentProps` walks the root's current
  fiber tree (from `FiberRoot.current`) instead of up from the element.

### Step 4: view data and `useNow`

- **`useNow(unit, unitValue?)`** (`hooks/useNow.ts`, spec §5.2) wraps `NowTimerRunner`: computes now
  during render, starts the runner in a layout effect and stops it on cleanup. Phase 8 already made
  the runner pure until started, so this is the same lifecycle as `NowTimer`'s
  `componentDidMount`/`componentWillUnmount`.
  - **Deviation from the spec:** a layout effect, not a passive one, to keep the class's timing.
    In Preact a passive effect arms after paint, through `requestAnimationFrame` and a timeout, which
    specs that mock the clock would also have to step through.
  - `NowTimer` is now a render-prop wrapper around it, for the views not yet converted.
- **`useDayGridViewData(dateProfile)`** builds the day table and reads today (`useNow('day')`), and
  **`useDayHeaderFormatter`** memoizes the header format. Both DayGrid views use them.
- **`DayGridView`** and **`ResourceDayGridView`** stay classes (`parseViewConfig` treats any other
  view component as a content generator), each rendering a function body. The body's memoizers are
  `useMemo`s, the slicers, splitter and joiner live in state or a ref, and `ResourceDayGridView`'s
  `isHitComboAllowed` is a `useStableCallback` reading the latest table models.

### DayGrid review (Sol, high effort)

Two P2s, both reproduced by the reviewer in Chrome and fixed:

1. **Pannable recorded the header's y.** The initial scroll's scroller was the horizontal syncer, whose
   `y` reads the first scroller (the header, always 0) once the scroll ends and the master is cleared.
   Even with the master, a later horizontal scroll of the footer would make it the master. Now the
   hook scrolls and listens to the body scroller, the only one that scrolls vertically, and a reset
   scrolls x to 0 through the syncer (`resetXScrollerRef`).
2. **A restored position could be clamped for good.** Leaving print remounts the screen rows before
   their events are measured, so the saved position wasn't reachable yet, and geometry changes
   skipped pixel targets. Now a position that wasn't reached stays pending, and geometry changes
   re-apply it until it is (or a user scroll replaces it).

Specs: `vanilla-tests/src/view-render/print-scroll.ts` and
`vanilla-scheduler-tests/src/misc/print-scroll-pannable.ts` (`dayMinWidth` needs the scrollgrid
plugin). Both fail with the old hook (0 instead of 80).

## TimeGrid

Steps:

1. Bottom-up: `TimeGridCols` (onto `useHitTarget`), `TimeGridCol`, `TimeGridEvent`,
   `TimeGridMoreLink`, `TimeGridAllDayLane` (onto `useHitTarget`). (done)
2. The layout shell: `TimeGridLayout`, `TimeGridLayoutNormal`, `TimeGridLayoutPannable`, sharing
   `useTimeGridAxis`, with the time scroll on `useInitialScroll` (#8112 bug 2). (done)
3. View data: `TimeGridView` and `ResourceTimeGridView` share a `useTimeGridViewData`. (done)

### Step 1: columns, events, all-day lane

- **`TimeGridCols`** registers with `useHitTarget`. Like the class adapter, it passes only
  `eventSelection` and `isHitComboAllowed` (it has per-column drag and resize, not `eventDrag`).
- **`TimeGridAllDayLane`** registers with `useHitTarget` and measures its more-link probe with
  `useReportedSize`. Its row's root and height come back through plain ref objects (`DayGridRow`'s
  `useForwardedElRef` and `useReportedSize`).
- **`TimeGridCol`**, **`TimeGridEvent`**, **`TimeGridMoreLink`**: pure renders, now memo functions,
  their helpers module functions.

### Step 2: the layout shell

- **`TimeGridLayout`** is a memo shell with no state, so it re-renders `ViewContainer` exactly as the
  class did. It owns the time scroll:
  - **`useInitialScroll`** with a logical `Duration` target, projected through the slat height
    (reported by the layouts, kept in a ref, re-projected after size).
  - **`_timeScrollRequest`** (`scrollToTime`) replaces the target through `scrollToLogical`.
  - **A user scroll records only y.** Pannable's time scroller syncs the axis too, which never
    scrolls in x. A reset scrolls x to 0 through the day syncer (`resetXScrollerRef`), as the class
    did. Normal has no day syncer, so it skips it, as before.
  - **Behavior change:** the class projected the time once and kept the pixels, so a later slat
    height change (resizing with `expandRows`) left the scroll at the old offset. A logical target
    now re-projects until the user scrolls (changelog).
  - Leaving print already re-applied the user's position before; now through the hook.
- **`useTimeGridAxis`** (`timegrid/components/useTimeGridAxis.ts`): what Normal and Pannable share,
  the axis width (from the all-day, header and slat labels) and the tallest slat label. Normal's
  single week-number width callback became the per-tier `RefMap` Pannable already had.
  **`useSlatHeightReport`** reports the slat height after each commit that changes it, and `null`
  on unmount.
- **`TimeGridLayoutNormal`** keeps its `requestAnimationFrame` before setting the total width (it
  avoids a ResizeObserver loop with the all-day row). **`TimeGridLayoutPannable`** syncs its scrollers
  with two `useScrollerSyncer`s and keeps the header-tier heights with an array-equality guard (the
  class's `addStateEquality`). Both size their cells with `computeDayGridColumns`.
- **Specs:** `activity-scroll.ts` gained a timeGrid case (React runtime). `print-scroll.ts` and the
  premium `print-scroll-pannable.ts` gained timeGrid cases, regression guards for leaving print.
  - Leaving print gives timeGrid a "ResizeObserver loop" error in Karma, with or without this change,
    so the standard spec wraps the print toggle in `ignoreResizeObserverLoops`. Follow-up: find the
    loop.

### Step 3: view data

- **`useTimeGridViewData(props)`** (`timegrid/components/useTimeGridViewData.ts`): the day series,
  day columns and ranges, the props split into all-day and timed, and now (`useNow`, by the minute
  with the now indicator). **`useTimedSegsByCol`** splits the timed segs by column.
- **`TimeGridView`** and **`ResourceTimeGridView`** stay classes rendering a function body, like the
  DayGrid views. Their slicers, splitters and joiners live in state or refs, unchanged (see
  `day-table-pipeline.md` for redesigning them).
- **The day columns are now stable across renders.** The class passed a new config object to its
  memoized `buildDayColsFromSeries` on every render, so the columns, and everything derived from them,
  were rebuilt each time. `useMemo` keys on the date profile instead. Fewer re-renders, never more:
  the snapshot counts dropped in `timeGridWeek/drag` (event class hooks 111 to 27) and
  `timeGridWeek/add-event`, with the DOM unchanged (changelog PERF).
- The now-indicator segs are still rebuilt on every render (`sliceNowDate` doesn't memoize), as before.

## MultiMonth and List

One step: `MultiMonthView`, `SingleMonth`, `ListView`, `ListEvent`.

- **`MultiMonthView`** stays a class rendering a function body. It reads today with `useNow('day')`,
  and its scroll is on `useInitialScroll` with a logical date target (the month's top, projected from
  the DOM once the inner width is known). It re-projects when the inner width or the date range
  changes, and once more in a `setTimeout(0)` after each mount (the class's workaround for an
  off-by-a-few-pixels first scroll). A user scroll records y.
  - **No #8112 bug 2 here before either:** the class kept the user's pixel position in the
    instance, and it took precedence over the date on remount. The new `<Activity>` case in
    `activity-scroll.ts` passes on the old code too, so it's a regression guard. So is the new
    multiMonth case in `print-scroll.ts`.
- **`SingleMonth`** is a memo function component. Its title and table-header heights come from
  `useReportedSize`, its width from the `Ruler`.
  - **Bug fixed: `singleMonthDidMount` was never called, and `singleMonthWillUnmount` got no `el` and
    no info** (found by phase 2's render-hook contract specs, pending until now). The class's
    `handleEl` was never attached and its `renderProps` never set. The month element now uses
    `useRenderHookEl`, like every other render-hook area, so the class name is generated the same way
    and the DOM is unchanged. The contract specs' `knownBugs` entry is removed, so they run. This is
    the one place counts go up on purpose: `singleMonthDidMount`/`WillUnmount` from 0 to once per
    month (changelog).
  - Dropped `heightsRef` (and `SingleMonthHeights`): nothing passed it.
- **`ListView`** stays a class rendering a function body, registering with `useHitTarget`
  (`disableHits`, as before). The day list is its own `ListDays` component holding `useNow('day')`,
  so the day changing re-renders only the list, as when `NowTimer` wrapped it, not the
  `ViewContainer`. The event segs' memo now also keys on the active range and `nextDayThreshold`,
  which the class read but didn't key on.
- **`ListEvent`**: a memo function.

### TimeGrid review (Sol, high effort)

One P2, reproduced by the reviewer in Chrome and fixed:

- **Toggling `dayMinWidth` lost the scroll position.** The layout swap replaces the scroller, and
  `useInitialScroll` attached to the new one without applying the target, while geometry changes
  only retry a position that's pending. The class restored it, through its slat-height callback.
  Now a new scroller gets the current target (and a clamped position stays pending, as after print).
  - **Also: Pannable's time syncer lists the main scroller first.** Once a scroll ends, the syncer's
    `y` reads its first scroller. The axis came first and could reach a position the main scroller,
    not laid out yet, was clamped from, so the pending check passed too early.
  - Spec: "scroll position across a dayMinWidth change" in the premium
    `misc/print-scroll-pannable.ts`, timeGrid both ways and dayGrid. Fails with the old hook.

## Timeline

Steps:

1. Leaves: `TimelineEvent`, `TimelineNowIndicatorArrow`/`Line`, `TimelineLaneMoreLink`,
   `TimelineSlats`, `TimelineBg`, `TimelineHeaderRow`, `TimelineFg`, `TimelinePrintFg` (on a new
   `useTimelinePrintBands`, the hook form of `TimelinePrintRenderer`, which stays for
   `ResourcePrintRow` until ResourceTimeline converts). (done)
2. `TimelineLayoutNormal`, `TimelineLayoutPrint`, `TimelineView`. (done)

### Step 1: leaves

- Pure renders became memo functions. **`TimelineHeaderRow`** keeps its inner width and height
  `RefMap`s with stable handlers, reporting the max up and `null` on unmount.
- **`TimelineFg`** keeps its slice and more-link height maps (a new `rev` in state re-renders), and
  reports its settled height after each commit that changes it, and `null` on unmount. A Strict Mode
  replay now reports the height again (the class lost it).

### Step 2: layouts and view

- **The scroll stays the timeline's own,** not `useInitialScroll` (a deviation from spec §5.3). The
  view holds the `{ time, x }` target in `scrollRef`, because print replaces the layout: print clips
  its canvas to `x`, and the layout restores the target from `initialScroll` when it mounts again. So
  the timelines never had #8112 bug 2. Moving the target into `useInitialScroll` would mean
  recomputing print's clip from a time, with the #8093 cap duplicated.
  - **`TimelineLayoutNormal`** ports the class's scroll logic as is: a stable object holding the
    target (the one `scrollRef` points to), the syncer and the handlers, reading the latest props,
    context and `maxHScroll` through `useLatest`. Each mount (including `<Activity>` and Strict Mode)
    creates the syncer, restores `initialScroll` or resets to `scrollTime`, and adds the listeners;
    cleanup undoes them. Later commits re-apply on a date-range, slot-width or client-width change,
    as `componentDidUpdate` did.
  - It registers its body with `useHitTarget`, passing only `queryHit`, as the class adapter
    effectively did (its props have no `eventSelection`, drag or resize; they're inside
    `slicedProps`).
- **`TimelineLayoutPrint`** measures its header with `useReportedSize`.
- **`TimelineView`** stays a class rendering a function body, with `useNow` for the slot unit.
- **Spec:** `vanilla-scheduler-tests/src/misc/activity-scroll-timeline.ts`, timeline and resource
  timeline (React runtime), guards: they pass on the old code too.
- **Known React-runtime failure, not phase 7:** "CalendarController is not taken back by a destroyed
  calendar that renders again" fails with "Cannot update an unmounted root". The test-only
  `vanilla-w-react` `Calendar` creates its React root once, in the constructor, so `render()` after
  `destroy()` renders into the unmounted root. The spec dates from before phase 6 (`f8b75241f`), and the
  React-runtime filters hadn't covered it until now. Follow-up: create the root again on render.
- One React-runtime run of the scheduler suite hung (41 minutes, 317 failures, disconnected). The
  same filter re-run took 2.5 minutes with only the known destroy failures, so it was the
  environment, not the change.

## ResourceTimeline

Plan: `phase-7-resource-timeline-plan.md` (the layout's decomposition).

### Step 1: everything but the layout

- **Spreadsheet:** `BodySection`, `ResourceIndent`, `ResourceGroupSubrow` (pure memo functions),
  `ResourceSubrow` (`memoWithEquality` with array equality for `colWidths`, as its
  `addPropsEquality` did; reports its tallest cell after size), `HeaderCells` (one `ElementDragging`
  per column resizer, from the resizer's ref callback as before).
- **`ResizableTwoCol`**: the divider's dragging is created in a mount effect and destroyed on cleanup.
- **Fixed in passing:** both registered a new `dragmove` (and `dragend`) listener on every
  `dragstart` and never removed them, so each drag added another set. Now each dragging registers
  its listeners once, and `dragstart` only captures the starting widths.
- **`ResourceLane`**: its top and bottom content heights come from `useReportedSize`, the events'
  from `TimelineFg`, summed and reported after size.
- **`ResourceTimelineLayoutPrint`** and **`ResourcePrintRow`** (on `useTimelinePrintBands`, so
  `TimelinePrintRenderer` is gone).
- **`ResourceTimelineView`** stays a class rendering a function body, with `useNow` (the expander
  probe beside the layout is memo with constant props, so a tick doesn't re-render it).
- **Lesson: a parent's "mounted" flag set in its layout effect is too late for its children.**
  Children run their layout effects first, and `TimelineFg` reports its height synchronously from
  its own. `ResourceLane`'s guard dropped that report, so a re-added resource kept its old row height
  (caught by "removing and readding all resource/events should not retain old resource height").
  The class only guarded after unmount (`_isUnmounting` was undefined before mount). Guards that
  children can reach synchronously now start `true`, only turning false on unmount
  (`ResourceLane`, `ResourceTimelineLayoutPrint`'s header rows). Guards reached through
  `afterSize` are fine either way, since it drains after the whole commit.


### Timeline review (Sol, high effort)

One P2, reproduced by the reviewer with React 19, and fixed across the families:

- **An `<Activity>` hide and show re-rendered layouts, calling `tableClass` and other render hooks
  again.** Two causes:
  1. Measurements went to plain state setters, and children report `null` on cleanup (an
     `<Activity>` hide, a Strict Mode replay), so the state was cleared, then measured again. The
     classes ignored it, because `_isUnmounting` was set.
  2. On show they report the same value again. React can't always skip a same-value update before
     rendering (not while the component has pending work, as on reveal), so it called the component,
     and its render hooks, then bailed out. The classes' `shouldComponentUpdate` stopped that.
- **`useMeasuredState`** (`hooks/useMeasuredState.ts`): a stable setter that ignores `null` and
  repeats. Now used by every layout measurement that went to a setter (TimeGrid Normal and Pannable,
  MultiMonth and its months, Timeline, the DayGrid body, the Timeline and ResourceTimeline views).
- **Specs:** `vanilla-tests/src/view-render/activity-rerender.ts` (dayGridMonth, timeGridWeek,
  multiMonthYear, listWeek) and the timeline case in the premium `activity-scroll-timeline.ts`, React
  runtime: hiding and showing may cost no more `tableClass` calls than a plain re-render with the same
  props does. Not zero, because the calendar's data currently re-renders the standard views once on a
  plain re-render (new event segs from upstream of the layouts). Follow-up: find why.

### Step 2: the layout (`ResourceTimelineLayoutNormal`)

The decomposition in `phase-7-resource-timeline-plan.md`, in one commit: the hooks only make sense
together, with the layout.

- **`useResourceTimelineScroll`** (`resource-timeline/useResourceTimelineScroll.ts`): the class's time
  and entity scroll, one `{ time, x, entityId, fromBottom }` target updated in place and reported to
  the view's `scrollRef`, the scroll slack, the queued resource scroll, the debounced virtualizer
  scroll updates (now cancelled on unmount; the class let them fire), `prepareHits`. Its mount effect
  restores `initialScroll` or resets to `scrollTime`, then adds the syncer and emitter listeners. A
  later commit re-applies the time scroll when the date range, slot width, canvas width or client
  width changes, then runs a queued entity scroll. The class's `forceUpdate(callback)` for the slack
  became `rerender()` plus an `afterRender` scroll that the every-commit effect runs.
- **`useWindowScrollTracking`** (`resource-timeline/useWindowScrollTracking.ts`): window scroll and
  debounced resize while height is auto, following the option after every commit, stopped on
  unmount.
- **Virtualizers:** the `Virtualizer` class is unchanged. The row and slot ones are created once;
  the group-column and header-row lists follow their counts through `syncVirtualizerList`.
- **The three syncers** are created by the layout's first layout effect, attached after every commit,
  and destroyed on cleanup, before the scroll hook's effects run.
- **One deliberate render-phase write:** the latest render's geometry (`geometryRef`: row layouts,
  tops, heights, max scrolls, and the props the slot virtualizer reads) is written during render, as
  the class kept it on the instance. The virtualizers are render-time caches that read it while
  rendering, and the row-height handlers read it while children commit, before any layout effect of
  the layout could update a ref. A render that never commits could leave it ahead of the DOM until
  the next render, as in the class.
- **Hits:** `useHitTarget` with `eventSelection` (as the class adapter read it), `prepareHits` and a
  `queryHit` reading `geometryRef`.
- **Header heights re-render only on a change.** A header row reporting its height again (after an
  `<Activity>` hide and show, which reports `null` first and deletes its entry) re-adds it with the
  same height. The class re-rendered for it anyway. Now the handler computes the header height and
  re-renders only if it differs from the one last rendered. With the Timeline review fix, an
  `<Activity>` hide and show re-renders `resourceTimelineDay` 0 times (the class: 4). Spec: the
  resourceTimelineDay case in the premium `activity-scroll-timeline.ts`.

### ResourceTimeline review (Sol, high effort)

Two P2s, both reproduced by the reviewer and fixed:

1. **A height change from auto to a number left blank space under virtualized rows.** A stable
   handler read the first render's `context.options`, so it kept treating the height as auto and
   never sized the row virtualizer to the body. It now reads the context through a ref assigned
   during render (children report sizes from their commits, before any of the layout's effects).
   Spec: `vanilla-scheduler-tests/src/timeline/timeline-virtualization-height.ts`.
2. **Showing an `<Activity>` dropped a re-render the window size needed** (height auto). Window
   tracking restarts on show and updates the virtualizers, which ask for a re-render, but the
   layout's "active" flag was reset by a later effect, so the request was dropped. The flag's effect
   now comes first, as the class's `componentDidMount` reset `_isUnmounting` before anything else.
   Spec: "timeline virtualization across a hidden <Activity>" in the premium
   `activity-scroll-timeline.ts` (React runtime; it grows `window.innerHeight` while hidden).

Both specs fail on the unfixed hooks. The first wraps its calendar in `ignoreResizeObserverLoops`:
a height:auto timeline with many rows gives a ResizeObserver loop, with the old class layout too.
