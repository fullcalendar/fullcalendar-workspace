# Phase 2 — DayGrid Unlimited + Numeric-Limit Cutover

## Goal

Cut DayGrid's `unlimited`, `maxEvents` (numeric), and `maxEventRows`
(numeric) modes over to `buildLevelLimitedLayout`. This phase alone fixes
the #7447 repro (numeric `dayMaxEvents`), because partial slices now mount
their own measured nodes instead of borrowing the source's whole-width
height (invariant 3).

Boolean (`auto`) mode keeps its existing route until phase 3.

## Behavior changes shipping here (see INDEX tradeoffs)

- Rows render immediately with provisional coordinates and reflow, instead
  of staying blank until all heights settle.
- Fragment shapes come from collision footprints, not the scoring search.
- Per-cell "+N more" data derives from glob groups.

## Files

- `standard/packages/preact/src/daygrid/seg-placement-adapter.ts` — replace
  the plan/placement pipeline for these modes with `buildLevelLimitedLayout`
  consumption. `resolveDayGridPlacementMode` and the option-precedence rules
  stay the single source of mode truth. `computeDayGridMoreLinkLevelTax`
  becomes the occupant level thickness (0 events-mode, 1 rows-mode).
- `standard/packages/preact/src/daygrid/components/DayGridRow.tsx` —
  `renderFgSegs` consumes `renderItems` (each item carries `heightRef` —
  partials measure themselves now; the `isMeasurable` distinction
  disappears for this route). Mirror alignment keeps working from slice
  tops (`buildMirrorItems` / `segTops`).
- `standard/packages/preact/src/daygrid/components/DayGridRows.tsx` — no
  structural change expected this phase; boolean-mode owner state stays.

## Downstream projections (from glob groups — no per-column accounting
upstream, invariant 5)

- per-cell all/hidden segs for more links + popovers: rebuild
  `buildDayGridPopoverSegs`-equivalent as a projection of `hiddenGroups`
  cut to columns via `cutSegToColumn` semantics (only real event boundaries
  survive the cut).
- per-column `contentHeight`: deepest visible bottom, plus the occupant's
  footer space in rows-mode.
- link rendering: below visible content in each intersecting cell
  (occupants are range footers; they never appear in render items).

## Tests

- Un-focus the #7447 test: `fit(` → `it(` in
  `standard/packages/vanilla-tests/src/event-render/dayGrid-events.ts`.
- Sweep vanilla-tests for blank-until-settled timing assumptions in the
  affected modes; apply the established `waitTimeout()` conversion patterns
  (see repo memory/history: done→async, .then→await, double-wait for
  more-popover).

## Manual verification (ask Adam)

- #7447 repro: no error, no overlap, numeric `dayMaxEvents`
- dayGridMonth + dayGridWeek: unlimited, `dayMaxEvents: N`,
  `dayMaxEventRows: N`, each with `eventSlicing` on/off and
  `eventOrderStrict` on/off
- "+N more" counts and popover contents match visible/hidden reality
- drag/resize mirrors align with their events
- initial-render reflow is acceptable (no lasting jump)
