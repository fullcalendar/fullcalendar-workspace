# Phase 4 — Timeline on the Shared Engine

## Goal

Cut Timeline (premium) over to `buildLevelLimitedLayout` outputs:
`sliceLevels`, `hiddenGroups`, `sliceCoords`. Timeline projects them onto
its continuous horizontal axis and keeps its own time-axis DOM order (see
the "Timeline departs here" comment in `buildLevelLimitedLayout`). Timeline
never slices (`eventSlicing` off for this consumer) and uses
`eventMaxStack` as `maxLevels`.

## The structural change

Timeline's hidden-event grouping is no longer view-local: the engine's glob
groups ARE the hidden groups (the old view-side `groupIntersectingSegs`
usage collapses into consuming `hiddenGroups` directly — same grouping
semantics, per `groupLaterallyIntersecting`'s lineage). More-link occupants
are range footers here exactly as in DayGrid; timeline renders one link per
group positioned from the group's lateral (time) range and visible content
bottoms.

## Files

- `premium/packages/preact-scheduler/src/timeline/seg-placement-adapter.ts`
  — consume the new outputs; keep `computeSegHorizontals` and lane
  projection view-side.
- `premium/packages/preact-scheduler/src/timeline/print-adapter.ts` and the
  `TimelinePrintFg` band path — adapt to new types. Note the print seg map
  currently relies on `ignoreDeletes` because the plan depends on
  `slotWidth`; that virtualization workaround is print/view-local and may
  remain, but it must NOT leak into the screen `sliceHeightMap` producer
  (whose contract mandates delete-on-unmount).
- `standard/packages/preact/src/protected-api.ts` (the "Shared
  seg-placement engine" block, ~lines 99–126) — re-export only what premium
  Timeline now consumes; remove superseded exports.
- Resource Timeline lanes: `eventMaxStack` per lane; total content-height
  calculation must keep matching visible bottoms + link space.

## Tests

- Vitest: adapt/extend the placement-related suites for the timeline
  adapter surface if any pure logic moved.
- vanilla-scheduler-tests: sweep timeline event-render/stack tests for
  timing assumptions (same waitTimeout patterns as DayGrid phases).

## Manual verification (ask Adam)

- timeline + resource-timeline with `eventMaxStack`: stacking, "+N more"
  grouping and positioning, popovers
- variable event heights in timeline lanes (custom content): no overlap,
  links not misplaced
- resource-timeline virtualized scrolling: measurements survive
  scroll-in/out (the print-map workaround untouched)
- resource-timeline print: band markup, border continuations, per-band
  sections still correct
- premium build: `pnpm build` in standard/preact then
  premium/preact-scheduler
