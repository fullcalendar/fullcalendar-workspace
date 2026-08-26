# Phase 5 — TimeGrid Input Simplification

## Goal

Feed TimeGrid's pressure-web projection directly from dimensionless levels
via `buildTimeGridLevelInputs` (see pseudocode.js): `segLevels` in,
`pressureWebSegLevels` + `globbedMoreLinkSegs` out. TimeGrid keeps its own
downstream coordinate system; only its *inputs* change.

## What gets deleted

The current planning-phase scaffolding that exists only because planning ran
mock unit heights through a coord-shaped structure:

- mock unit-height planning in `seg-placement/timegrid.ts` /
  `timegrid/seg-placement-adapter.ts`
- any throwaway slicing performed during that formal planning pass

Dimensionless levels make levelIndex ≡ depth, so the depth/touching-chain
bookkeeping the old model needed (see
`reference/seg-hierarchy.pre-refactor.ts`, `findInsertion`'s depth
accumulation) has no successor here.

## Files

- `standard/packages/preact/src/seg-placement/timegrid.ts`
- `standard/packages/preact/src/timegrid/seg-placement-adapter.ts`
- `standard/packages/preact/src/timegrid/components/TimeGridCol.tsx`
  (consumer wiring only)

`eventMaxStack` maps to `maxLevels`; hidden segs glob into
`globbedMoreLinkSegs` for TimeGrid's existing more-link rendering.

## Tests

- Vitest: `timegrid-adapter.test.ts` — update for the simplified inputs;
  the pressure-web tests themselves should not need behavioral changes.
- vanilla-tests: timeGrid event-render suites; watch for ordering/stack
  expectation drift (`eventOrderStrict` interaction with the new leveling
  is topology-only, invariant 4).

## Manual verification (ask Adam)

- timeGridWeek/Day with overlapping events: pressure layout unchanged in
  ordinary cases
- `eventMaxStack`: hidden events and "+more" links correct
- recent regression area (see commit `b70959d11` "Fixes to timegrid event
  positioning"): re-verify those scenarios specifically
- timegrid print route unaffected (`timegrid/print-mode.ts`)
