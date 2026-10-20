# Phase 7: ResourceTimeline plan

Status: planned (2026-10-20). Adam chose the full decomposition of `ResourceTimelineLayoutNormal`
within phase 7, over keeping it a class or a faithful one-object port.

## What's there

`premium/packages/preact-scheduler/src/resource-timeline/components/ResourceTimelineLayoutNormal.tsx`,
1,511 lines, a `DateComponent` that works as an imperative controller:

- **Render mutates the instance.** It stores `bodyLayouts`, `bodyHeights`, `bodyTops`, `maxHScroll`
  and `maxVScroll` on `this`, grows or trims the arrays of group-column and time-header
  virtualizers, and calls `Virtualizer.computePositions`, which caches positions inside each
  virtualizer.
- **Row geometry:** two inner-height `RefMap`s per entity (data grid and time lane, deletes ignored),
  two header-row height maps, `computeHeights` / `computeTopsFromHeights` with a `scrollSlack`
  offset.
- **Three `ScrollerSyncer`s:** time (header, body, footer, horizontal), body (spreadsheet body and
  time body, vertical), spreadsheet (header, body, footer, horizontal).
- **Time scroll:** `{ time, x }`, reset from `scrollTime`, `_timeScrollRequest`, capped by
  `maxHScroll` (#8093). Every scroll (not just device scrolls) records x and, debounced, moves the
  slot and time-header virtualizers.
- **Entity scroll:** `{ entityId, fromBottom }`, from `_resourceScrollRequest` (queued if the
  resource isn't rendered yet), recorded at scroll end by `findEntityByCoord`, applied when row
  heights change while not scrolling (`queuedEntityScroll`).
- **Scroll slack:** while scrolling, row height changes above the viewport add slack so the content
  doesn't jump; consumed at scroll end or when scrolling into it, through
  `forceUpdate(() => scrollTo(...))`.
- **Window scrolling** (height auto): window `scroll` and debounced `resize` listeners drive the row
  virtualizers instead of the body scroller.
- **Measurements:** time total, client width and height, bottom scrollbar widths, spreadsheet
  client width (reported up), slot inner width (reported up).
- **Hits:** `prepareHits` clears the entity-scroll target. `queryHit` finds the row by coordinate.
- **View-held scroll:** like Timeline, the view keeps `scrollRef` (`initialScroll` on remount, print's
  `timeCanvasClipStart`), so it already survives print and `<Activity>`.

## Decomposition

Each piece is a hook in `resource-timeline/` (or `timeline/` when shared). The layout becomes a memo
function that composes them, and its render is pure: values computed during render are kept for
callbacks with `useLatest`, not written onto an instance.

1. **`useVirtualizer(getKey, getStart, getSize, overscan)`** and **`useVirtualizers(count, …)`**:
   the existing `Virtualizer` class held in state, its `requestRerender` a stable state bump. The
   array version grows and trims with the count, and seeds new ones from the first (the time-header
   "prepopulate" hack). The `Virtualizer` class itself stays.
2. **`useEntityGeometry`**: the four height `RefMap`s, header height, `computeHeights` and tops, and
   the slack. Re-renders after size. Returns the layouts' heights and tops, and a latest ref for
   callbacks.
3. **`useTimelineTimeScroll`**: the `{ time, x }` target reported to the view's `scrollRef`, reset
   and request, the `maxHScroll` cap, applying through the time syncer. Shared with
   `TimelineLayoutNormal` only if the two can keep their rules, which differ today: Timeline lets x
   win over time and clears the target on a device scroll start, recording x at a device scroll end.
   ResourceTimeline lets time win, records x on every scroll (programmatic too, for virtualization),
   and moves the slot and header virtualizers, debounced. Otherwise each keeps its own.
4. **`useEntityScroll`**: the `{ entityId, fromBottom }` target, `_resourceScrollRequest` with the
   queue, scroll start, scroll and end handlers, the slack consumption (a pending post-commit scroll
   in place of `forceUpdate(callback)`), and the clear for `prepareHits`.
5. **`useWindowScrollTracking(isEnabled, bodyElRef, onScroll, onViewportSize)`**: window `scroll` and
   debounced `resize` while height is auto, cleaned up on unmount.
6. **Syncers:** a premium `useScrollerSyncer` variant (or the standard one, if the scrollgrid plugin
   is guaranteed) for the three syncers, in a fixed order so the time and entity scroll hooks find
   them.
7. **Hits:** `useHitTarget` with `prepareHits` and `queryHit` reading the latest geometry.

### Steps

1. **The rest of ResourceTimeline first,** bottom-up: lanes (`ResourceLane`, `GroupLane` is done),
   spreadsheet (`BodySection`, `HeaderCells`, `ResourceSubrow`, `ResourceGroupSubrow`,
   `ResourceIndent`), `ResizableTwoCol`, the print layout and `ResourcePrintRow` (on
   `useTimelinePrintBands`, which retires `TimelinePrintRenderer`), and the view.
2. **The hooks, one commit each where they stand alone,** with React tests where they're testable in
   isolation (virtualizer re-render requests, window tracking cleanup).
3. **The layout itself,** composing them, in one commit. The DOM snapshots (grouped, nested,
   expanded and collapsed, virtualized) and the scheduler suites are the net. Mutation-check the
   entity scroll (`scrollToResource`, rows inserted above) and the slack.
4. **Sol review rounds** on steps 2 and 3, as many as it takes.

### Risks

- **Render-hook counts.** Today's `forceUpdate`s re-render the whole layout. The hooks must not add
  renders (a state bump per virtualizer per change would). Batch through `afterSize` as now.
- **Order of effects.** The class did, in `componentDidMount`: create syncers, attach them, start
  window tracking, apply the initial scroll, then add listeners. The hooks must keep that order,
  since applying the scroll before the syncers have children would be lost.
- **Strict Mode and `<Activity>`.** Each mount re-creates the syncers and listeners and restores
  `initialScroll` from the view, as the class did.
