# Phase 1 — Pure Engine Kernel

## Goal

Implement every "implementation pending" body in `pseudocode.js` as pure,
DOM-free code with vitest coverage. No production component touches the new
kernel in this phase.

## Deliverables

New module(s) under `standard/packages/preact/src/seg-placement/` (new files
alongside `layout.ts` — dueling implementations are expected until phase 6;
see "Coexistence strategy" in INDEX.md), implementing, in `pseudocode.js`
terms:

- `buildSegLevels` — dimensionless leveling of whole segs, order-preserving
  rejection (invariant 1)
- `convertSegLevelsToWholeSlices` / `convertSegsToWholeSlices`
- `resolveLevelCoords` — per its contract: never re-levels or reslices,
  bounded exclusion is final and non-blocking, link-blind
- the shared **fire-and-collide merge engine**, exposed as its two
  parameterizations `mergeExtraIntoLevels` (unit thickness, level validity)
  and `mergeExtraIntoLevelCoords` (provisional thickness, pixel validity) —
  the full spec lives in the `mergeExtraIntoLevels` contract
- glob groups + more-link occupants (range footers, merge-internal;
  invariant 5), `groupLaterallyIntersecting`
- `sortByEventOrder`, `federateSlicesByStart`, `compareSlicesByEventOrder`,
  `isPartialSlice`, `compilePixelLimitedRenderSlices`,
  `buildSliceRenderItems`
- orchestration: `buildLevelLimitedLayout`, `buildPixelLimitedLayout`,
  `buildTimeGridLevelInputs` (thin; mostly as written in pseudocode.js)

`sliceHeightMap` and `getRatchet` are injected interfaces here; their
producer contract (single write path, validates positive-finite, deletes on
unmount, ratchets extrema at insertion) is implemented in phase 3 — this
phase only *consumes* the interface and trusts it per the contract.

## Anchor code

- **Imitate** `reference/seg-hierarchy.pre-refactor.ts`: the
  `insertSeg`/`findInsertion` insertion walk, `splitSeg` peeling, and
  `groupIntersectingSegs` grouping are the reference shapes for the merge
  engine and glob grouping. Differences from the reference: no zombies
  (occupants replace them), no `hiddenConsumes` flag (occupant consumption
  replaces it), no depth-chain traversal (dimensionless levels make
  levelIndex ≡ depth).
- **Reuse** from `seg-placement/layout.ts`: `binarySearch`-style lateral
  search and any level-intersection helpers that carry over cleanly.
- **Do not copy** from `layout.ts`: `createBoundedSlicePlan` and its
  scoring/candidate machinery, `findBetterPositionWithinLimits`,
  `partitionPlacements`-era repair. Superseded by design (see INDEX
  tradeoffs).
- Key convention: `getEventPartKey` in `daygrid/TableSeg.ts`, used exactly
  as-is. While in there, improve its comment: the unconditional start index
  is essential *source-seg* identity, not merely slice identity — the same
  event instance can produce multiple whole view-coordinate segs with
  different starts, especially in Resource DayGrid. The slice end is
  deliberately excluded so a narrowed/widened slice keeps its DOM node and
  ResizeObserver; a stale height during that intermediate commit is
  corrected by the existing pre-paint size flush.

## Tests (vitest, `standard/packages/preact/tests/seg-placement/`)

Extend the existing suites' style (`layout-correctness.test.ts`,
`fuzz-correctness.test.ts`, `test-utils.ts`):

- level-mode: order preservation, strict-order topology, slicing on/off,
  rows-mode occupant charging one level, events-mode occupant charging zero
- pixel-mode: bounded exclusion finality, partial salvage at provisional
  thickness, occupant consumption recursion, compaction-only re-resolve
  (assert: substituting exact ≤ provisional heights never grows any
  coordinate and never breaks the budget fit)
- glob grouping: lateral merge, order within groups, group widening via
  consumption
- coverage invariant: visible fragments + hidden glob fragments are
  non-overlapping and cover exactly the original sources (good fuzz target)
- fuzz: random segs/heights/limits; assert invariants 1, 2, 5 and coverage

## Manual verification

None — pure code. `pnpm test -- tests/seg-placement` and `pnpm build` in
`standard/packages/preact` must pass.
