# Phase 5: render-hook rollout and leaf conversions

Status: planned.

## Goal

- Move every `ContentContainer` user onto the phase-3 primitives (`hook-toolkit-spec.md` §6), then
  delete `ContentContainer` and `ContentInjector`. `<CustomContent>` already has its own copy of
  the result handling.
- Convert the leaf components on the way, including the measure-and-report leaves, which fixes the
  seven mount-time watchers that close over stale props.
- Apply phase 4's shell-plus-variants lesson where a component switches on a mode.

## Scope rule for big classes

Some `ContentContainer` users are big classes with layout logic that phase 7 rewrites (`DayGridRow`,
`DayGridCell`, `ResourcePrintRow`). Converting them now would mean converting twice. Instead, the
render-hook area they own moves into a small function component, and the class renders that.
The spec rules out a polymorphic `tag` component (§6.4), so each area gets its own component.

## Batches

Each batch: targeted specs, `dom-snapshot compare` in both runtimes (DOM plus call counts, which must
never go up), the React suite, then a commit. Sol reviews after 5b, 5c and 5e.

### 5a. Primitives

- `useRenderHookEl({ classGenerator, didMount, willUnmount, renderProps })`, returning
  `{ className, ref }` (§6.4). It's `generateClassName` plus `useMountHooks`.
- `generateClassName` and `renderText` move out of `ContentContainer.ts`.
- `useElementSize` (§4.1) and `useReportedSize` (§4.2), over the existing `watchSize`.
  They include the persistent cache across detach, the hidden-element rule, and publishing through
  `afterSize`.
- No hook gets added before its first user. 5a lands together with 5b's and 5c's first conversions.

### 5b. Pure leaves (no lifecycle, no measurement)

`ButtonIcon`, `ToolbarSection`, `Toolbar`, `ViewContainer`, `NowIndicatorHeaderContainer`,
`NowIndicatorLineContainer`, `TimeGridSlatLane`, `ListDayHeaderInner`, `ListDayHeader`, `ListDay`,
`BgEvent`, `TimelineSlatCell`, `ResourceExpander`, `TimeGridCol`, and `view-config`'s
`createViewHookComponent`.

### 5c. Measure-and-report leaves

- The seven stale watchers: `TimeGridAllDayHeader`, `TimeGridSlatHeader`, `TimeGridWeekNumber`,
  `TimelineHeaderCell`, `Ruler`, `FooterScrollbar`, `MeasuredHeightHarness`.
- The resource spreadsheet cells (`HeaderCell`, `ResourceCell`, `ResourceGroupCell`,
  `ResourceGroupHeaderCell`, `SuperHeaderCell`) and lanes (`GroupLane`, `ResourceLane`). They
  measure and report, and switch between `<td>` and `<div>` on `forPrint`.
  - Check whether one instance actually switches. If it does, use a shell plus variants.
- Each fix of a stale watcher gets a spec that fails on the old code, where one is reachable
  through the public API.

### 5d. Mode switches and areas inside big classes

- `MoreLinkTrigger` (`display` row/column) and `MoreLinkContainer`.
- `DayGridHeaderCell`, shared by DayGrid, TimeGrid and the resource views.
- The areas in `DayGridCell`, `DayGridRow` (inline week number) and `ResourcePrintRow`.
- `MorePopover` and `ListView`, which also switch to `useHitTarget`.

### 5e. Delete

- `ContentContainer` and `ContentInjector`, along with their `protected-api` exports, which may
  break.
- Record any leftover `didMountMisfire`-style workaround removals.

## Watch for

- **Unstable render props.** Phase 4's call-count win came mostly from one unstable object. Check
  each area's render props for one before converting.
- **Ref callbacks:** keep one per instance (phase 4 lesson).
- **Mixed trees in Preact.** A hook parent's layout effect runs before its class children's
  `componentDidMount`. Convert bottom-up (spec §1, consequence 3).
- **Cleanups** read the latest committed values.
