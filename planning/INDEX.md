# Event Positioning Rewrite — Planning Index

Read this file first, then `pseudocode.js` (the algorithmic source of truth),
then the phase brief you are implementing. The phase briefs reference
contracts in `pseudocode.js` by function name rather than restating them —
when a brief and the pseudocode disagree, the pseudocode wins.

## Motivation

Fixes https://github.com/fullcalendar/fullcalendar/issues/7447 as a class,
not an instance. The repro (see `fit(...)` in
`standard/packages/vanilla-tests/src/event-render/dayGrid-events.ts`, search
"7447"): with `white-space: normal` event content, event heights become
width-dependent, and the current system lets slices borrow their source's
whole-width measurement — a narrower slice wraps taller than its borrowed
height and overlaps. The bug manifests with numeric `dayMaxEvents` and can
equally manifest with `dayMaxEvents: true`.

The deeper fix: separate topology from measurement. Every rendered slice
measures itself, and topology can never oscillate in response to
measurements — dimensionless by construction in level-number mode, tamed by
monotone ratchets in pixel mode.

## Core invariants

1. `props.segs` arrives in event-order. Source segs retain that orderIndex,
   and `buildSegLevels` preserves received order when returning rejected
   segs.

2. `sliceLevels` is the authoritative topology, and it drives the process
   (unlike the current implementation, where level structure is a discarded
   intermediate artifact). How dimensionless it stays depends on the mode.
   In level-number mode it is fully dimensionless: build/merge may change
   its membership or boundaries, and coordinate resolution may only inflate
   it with pixels. In pixel-bounded mode the dimensionless levels define
   only the DOM frontier; the placement partition is dimension-aware, since
   bounded resolution excludes wholes and `mergeExtraIntoLevelCoords` may
   reslice and re-level within the pixel budget. In both modes,
   `resolveLevelCoords` itself never re-levels or reslices.

3. Render and measure each exact slice, so its own width-dependent height
   replaces the provisional planning height as soon as it is available
   instead of permanently borrowing a whole/source seg's height.

4. `eventOrderStrict` affects topology in build/merge only. Once topology is
   fixed, coordinate resolution has no ordering decision to make.

5. More links are first-class placed occupants, not reserved bounds. Hidden
   geometry accumulates into laterally-merged glob groups; there is no
   per-column accounting anywhere in the engine, even for DayGrid, whose
   per-cell counts and popovers are downstream projections of the groups.
   Each group owns one occupant spanning its range, materialized on the
   group's first hidden witness and thereafter only widening or merging.
   Occupants are merge-internal collision geometry carried on their groups,
   never inserted into the slice levels, and always sit below every visible
   slice they laterally intersect (range footers); coordinate resolution
   and render compilation stay link-blind.
   An occupant must place: when limits leave it no valid position, it
   consumes intersecting frontier placements, which join the glob and may
   recursively widen or merge groups. Consumption replaces both the legacy
   zombie concept and per-column bound-lowering tax repair.

## Accepted tradeoffs (deliberate behavior changes, not regressions)

- Choosing dimensionless topology before resolving exact pixel heights may
  produce taller layouts or hide different events than dimension-aware
  topology would. Accepted because width-dependent event heights expose a
  broader class of bugs that requires topology and measurement to be
  separate.
- Coordinate exclusion is final for a whole slice: dimensionless levels give
  a rejected whole nowhere else to go, so the current system's
  whole-position retry disappears. Some layouts will show a slice or a more
  link where the old system re-fit a whole.
- Fragments emerge from collision footprints, not from the current
  slice-plan scoring search. No `maxSlices` cap, no scoring; fragment shapes
  may differ from the current optimizer's.
- Rows render immediately with provisional coordinates and reflow as
  measurements arrive, replacing blank-until-settled.
- The more-link pixel thickness proxy is the *smallest* measured slice
  height (current code uses the largest). Slices measure at their own
  widths, so wrapping can make one slice an outlier; reserving that outlier
  would hide ordinary events. More links are reliably shorter than the
  shortest styled event in practice. Occupancy makes measuring real link
  heights a natural future upgrade, not a prerequisite.
- An event taller than the current provisional maximum may briefly overlap
  or move neighbors before its ResizeObserver report arrives.
- Ratchet extrema live for the placement owner's lifetime (a future
  geometry/style epoch will reset them); a stale `largestSliceHeight` can
  conservatively under-mount candidate slices until then.

## Glossary

- **source seg** — one event's whole lateral range within a row, with
  `orderIndex` from resolved event order.
- **whole slice / partial slice** — a slice covering its source's full range
  vs. a narrower fragment (`isPartialSlice` in pseudocode.js). Partial keys
  append `:slice` (see `getEventPartKey` in `daygrid/TableSeg.ts`).
- **slice levels** — the ordered level arrays that are the authoritative
  topology (invariant 2).
- **DOM frontier** — the dimensionless level count worth mounting for
  measurement (`neededLevelCount` from the ratchet in pixel mode; the
  numeric option in level mode).
- **glob group** — laterally-merged accumulation of hidden geometry; the
  only hidden-seg accounting in the engine.
- **more-link occupant** — a group's merge-internal collision geometry; a
  range footer (invariant 5).
- **donor** — a mounted whole that lost placement but keeps rendering
  (visibility:hidden) purely to report its height.
- **ratchet** — owner-lifetime monotone extrema: `smallestSliceHeight`,
  `largestSliceHeight`, `largestCanvasHeight`, `neededLevelCount`.
- **provisional height** — `largestSliceHeight ?? 20`, used for any slice
  not yet in `sliceHeightMap`.
- **settle gate** — the "every visible slice height is exact" condition
  required before reporting compiled totals to the component owner
  (phase 3).

## Phases

| Phase | Brief | Scope |
| --- | --- | --- |
| 1 | `phase-1-kernel.md` | Pure engine kernel + vitest; no production wiring |
| 2 | `phase-2-daygrid-levels.md` | DayGrid unlimited + numeric-limit cutover (fixes #7447 repro) |
| 3 | `phase-3-daygrid-pixels.md` | DayGrid boolean mode: ratchets, donors, settle gate; DayGrid print |
| 4 | `phase-4-timeline.md` | Timeline screen + print on shared glob groups; protected API |
| 5 | `phase-5-timegrid.md` | TimeGrid input simplification |
| 6 | `phase-6-cleanup.md` | Delete superseded machinery; API + test sweep |

Each phase ends with a manual verification matrix. Per repo policy
(CLAUDE.md), the implementor does not run browser tests — ask Adam to
verify. Vitest is fine:
`cd standard/packages/preact && pnpm test -- tests/seg-placement`
(pnpm binary: `/Users/adam/Library/pnpm/pnpm`; homebrew pnpm is too old).
Per-package `pnpm build` (standard/preact first, then
premium/preact-scheduler) proves compilation.

## Provenance / escape hatch

The pre-rewrite insertion model (fire/collide/peel/consume, with zombies) is
frozen at `reference/seg-hierarchy.pre-refactor.ts`. All other pre-refactor
code is at commit `ec36941a1~1` (the parent of "Phase 1: shared geometry
kernel"):

    git show 'ec36941a1~1:standard/packages/preact/src/daygrid/event-placement.ts'
    git show 'ec36941a1~1:standard/packages/preact/src/timegrid/event-placement.ts'

Optionally `git tag pre-eventpos-rewrite 'ec36941a1~1'` to make the address
durable.

## Coexistence strategy (decided)

This is a **complete rewrite**, not an incremental evolution. By the end of
phase 6, nothing of the current engine survives: the old implementation is
fully removed, and a thorough cleanup pass eliminates unused functions and
makes the surviving code DRY.

During interim phases, **dueling implementations are acceptable**: the new
kernel lands in new files alongside `seg-placement/layout.ts` (phase 1),
consumers migrate per phase, and the old code shrinks as its primitives
lose callers. Do not contort interim code to avoid temporary duplication —
correctness of each cutover matters more than transient redundancy. The
debt is collected in phase 6, which is a hard gate: it does not close with
superseded code still present.
