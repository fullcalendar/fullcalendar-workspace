# Phase 6 — Cleanup, API Reconciliation, Test Sweep

## Goal

Complete the rewrite: this phase is a **hard gate** and does not close
while any of the old engine survives (see "Coexistence strategy" in
INDEX.md). Delete everything superseded, then run a thorough DRY pass over
what remains, reconcile the protected API, and finish the cross-cutting
test debt. No behavior changes in this phase — anything behavioral
discovered here goes back to its owning phase.

## Deletions — the old engine goes away entirely

The dueling-implementation allowance ends here. By now callerless (verify
with grep before each delete):

- `standard/packages/preact/src/seg-placement/daygrid.ts` — the
  `limitDayGridLayout` limiter, `ColumnBounds`, `repairTaxedColumn`,
  `recordHiddenForMoreLink` (per-column bound-lowering tax repair; replaced
  by occupant consumption)
- `seg-placement/layout.ts` in full: `createBoundedSlicePlan` and its
  candidate/scoring machinery, `findBetterPositionWithinLimits`,
  `findWholePositionWithinLimits`, `partitionPlacements`, and the rest. Any
  primitive phase 1 chose to reuse (e.g. `binarySearch`-style search) moves
  into the new kernel's files under the new vocabulary; the old file itself
  is deleted, not shrunk.
- any orphaned types/exports in `seg-placement/print.ts` and adapters

## DRY pass

After the deletions, sweep the surviving placement code (kernel, adapters,
print adapters, components touched in phases 2–5) for:

- functions/types/exports with no remaining callers (interim cutovers leave
  these behind)
- near-duplicate logic that existed only to bridge old and new shapes
  during coexistence — collapse to one implementation
- vocabulary drift: one name per concept, per the INDEX glossary and the
  Segment→Seg convention

## Protected API

Final pass over `standard/packages/preact/src/protected-api.ts`: the shared
seg-placement block exports exactly what premium consumes after phase 4 —
nothing superseded, nothing speculative. Prove with `pnpm build` in
standard/preact then premium/preact-scheduler.

## Test sweep

- Confirm no `fit(`/`fdescribe(` left anywhere in vanilla-tests /
  vanilla-scheduler-tests.
- Finish the blank-until-settled timing sweep across both test packages
  (any suite not already converted in phases 2–5).
- Vitest suites green:
  `cd standard/packages/preact && pnpm test -- tests/seg-placement`.
- Delete or rewrite any vitest tests that only exercised deleted machinery.

## Docs

- Update `planning/INDEX.md` open decisions with what was actually done.
- Note the two deliberately deferred upgrades so they aren't lost:
  geometry/style epoch to reset owner-lifetime ratchets; measuring real
  more-link heights (replacing the smallest-slice occupant proxy).

## Manual verification (ask Adam)

- Smoke pass across dayGridMonth, timeGridWeek, timeline,
  resource-timeline, each with a limiting option active, plus one print
  preview each (screen + print routes both exercised after the deletions).
