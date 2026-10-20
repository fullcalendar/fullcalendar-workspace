# The day-table pipeline (future phase)

Status: not planned in detail yet. A starting point for a later phase, from a discussion during
phase 7 (2026-10-20). Phase 7 only re-hosts this pipeline in hooks; it doesn't change it.

## What it is today

About 1,700 lines across standard and premium, plus the resource table-model subclasses. It turns a
view's props (event store, selection, drag, resize, business hours) into per-row and per-column
segments for DayGrid, TimeGrid and their resource variants.

1. **Split by all-day vs timed** (TimeGrid only): `AllDaySplitter`
   (`standard/packages/preact/src/timegrid/AllDaySplitter.ts`), on `Splitter`
   (`component-util/event-splitting.ts`).
2. **Split by resource:** `VResourceSplitter`
   (`premium/packages/preact-scheduler/src/resource/common/VResourceSplitter.ts`) breaks the props
   into one set per resource.
3. **Slice into coordinates, per resource:** `DayTableSlicer`, `DaySeriesSlicer`
   (`daygrid/DayTableSlicer.ts`) and `DayTimeColsSlicer` (`timegrid/DayTimeColsSlicer.ts`), on
   `Slicer` (`common/slicing-utils.ts`). They turn date ranges into row/column segments.
   - Each is a stateful instance with hidden `memoize` caches, so the resource views keep a map of
     slicers per resource (now a `useRef`).
4. **Join back into one column space:** `ResourceDayTableJoiner` (resource-daygrid) and
   `ResourceDayTimeColsJoiner` (resource-timegrid), on `VResourceJoiner`
   (`resource/common/VResourceJoiner.ts`), map each resource's segments into the combined column
   index.
   - That index comes from `ResourceDayTableModel` or `DayResourceTableModel`, the two
     `datesAboveResources` orderings, under `AbstractResourceDayTableModel`, built by
     `buildResourceTableModel` (`resource/common/resource-table-model.ts`).
     `ResourcelessDayTableModel` covers no resources.
   - Standard's own model is `DayTableModel` (`daygrid/DayTableModel.ts`).
5. **Regroup by row or column:** `splitSegsByRow` / `splitInteractionByRow` (`daygrid/TableSeg.ts`),
   `organizeSegsByCol` / `splitInteractionByCol` (`timegrid/TimeColsSeg.ts`).
6. **Headers:** `daygrid/header-tier.ts` and `resource-daygrid/resource-header-tier.ts` build the
   header tier configs, again in both orderings.

Who uses it: `DayGridView`, `ResourceDayGridView`, `TimeGridView`, `ResourceTimeGridView`.
ResourceTimeline uses its own `ResourceSplitter`, so it's mostly separate.

## What's gross about it

- Split, slice per resource, then rejoin: the resource dimension is taken apart and put back
  together around the slicing.
- A class hierarchy for the two `datesAboveResources` orderings.
- Stateful slicer, splitter and joiner instances whose memoization is hidden inside them, so the
  views must keep instances alive (and a map of them per resource).

## A possible redesign

- **One pure column model:** a list of `{ date, resource }` columns, ordered by
  `datesAboveResources`.
- **One slicing pass** that maps each event range straight to its columns, with no split and rejoin.
- **Plain functions memoized with `useMemo`** (or the phase 9 derived-data functions), and header
  tiers derived from the same column model.

## Risks

- **Render-hook counts depend on segment identity staying stable across renders**, which the
  per-instance slicer caches provide today. A pure pipeline has to preserve that, or `eventContent`
  and friends get called more (counts must never go up).
- **DOM must not change.** The DOM snapshots (phase 1) already include `datesAboveResources` and
  grouped-resource fixtures.

## Size

Rough guess: a medium-to-large phase on its own, 1,500 to 2,500 lines changed, with its own plan doc
and review rounds. Best after phase 7, or as part of phase 9.
