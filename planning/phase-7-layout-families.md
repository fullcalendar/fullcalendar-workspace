# Phase 7: layout families

Status: in progress. DayGrid steps 1 and 2 done.

One family at a time, in the roadmap's order: DayGrid, TimeGrid, MultiMonth and List, Timeline,
ResourceTimeline. Each family is split into steps, committed and reviewed separately.

## DayGrid

Steps:

1. The layout shell: `DayGridLayout`, `DayGridLayoutNormal`, `DayGridLayoutPannable`,
   `DayGridLayoutPrint`, plus `useInitialScroll` and `useScrollerSyncer`. (done)
2. `DayGridRows` (onto `useHitTarget`) and the header: `DayGridHeader`, `DayGridHeaderRows`,
   `DayGridHeaderRow`, `DayGridMoreLink`. (done)
3. `DayGridRow` and `DayGridCell`, which TimeGrid's all-day lane and the resource views share.
4. View data: `DayGridView` and `ResourceDayGridView` share a `useDayGridViewData`.

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
