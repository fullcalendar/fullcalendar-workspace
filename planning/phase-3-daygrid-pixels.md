# Phase 3 — DayGrid Boolean (Pixel) Mode

## Goal

Cut `dayMaxEvents: true` / `dayMaxEventRows: true` over to
`buildPixelLimitedLayout`: owner-lifetime ratchets, hidden measurement
donors, occupant pixel thickness, and the settle gate on upward height
reporting. Also adapt DayGrid print to whatever shared types changed.

## The ratchet + height map (producer contract)

Implement the `sliceHeightMap` producer as the **single write path**:

- rejects non-positive / non-finite reports
- deletes a node's entry when the node unmounts (never `ignoreDeletes` —
  that was a resource-timeline virtualization hack)
- updates the owner ratchet extrema as a side effect of insertion, so
  `exactSliceHeight <= provisionalSliceHeight` holds by construction, not
  by call-site ordering (see the ratchet comment in
  `buildPixelLimitedLayout`)

Owner state lives where `DayGridPlacementOwnerState` lives today
(`daygrid/seg-placement-adapter.ts`, fed by `DayGridRows`): keep the
startup estimates (150px area / 20px slice → frontier), the
`neededLevelCount` formula, and monotonicity. `observeDayGridEventHeight` /
`observeDayGridEventAreaHeight` are the shape to fold into the producer.

## Donors and render items

- `compilePixelLimitedRenderSlices`: every DOM-frontier whole renders
  exactly once (visible or `visibility:hidden` donor); placed partials are
  supplemental self-measuring nodes. See its contract.
- Coordinate-excluded wholes are never retried whole; salvage is partial
  geometry only (see `resolveLevelCoords` /
  `mergeExtraIntoLevelCoords` contracts).
- Occupant pixel thickness: `smallestSliceHeight ?? 20` (the proxy note at
  the `mergeExtraIntoLevelCoords` call site).

## Settle gate (the one place settle-detection survives)

Report a row's compiled event-area/total height upward — the
`heightRef` → `DayGridRows.rowHeightRefMap` path (hit testing + layout
owner) and the monotone `onEventAreaHeight` ratchet — only once every
visible slice height is exact. This extends the complete-snapshot gate the
current `reportEventAreaHeight` (DayGridRow.tsx) already applies. The
monotone ratchet is the dangerous consumer: a provisional-inflated report
latches permanently.

## Print

Adapt `standard/packages/preact/src/daygrid/print-adapter.ts` and
`DayGridRow`'s print route (`renderPrintBandSlots`, `printSegHeightRefMap`)
to the new plan/slice types. Print semantics themselves don't change in
this phase; slice-keyed measurement reduction to per-source maxima stays.

## Tests

- Add the `dayMaxEvents: true` variant of the #7447 white-space test next
  to the numeric one in
  `standard/packages/vanilla-tests/src/event-render/dayGrid-events.ts`.
- Continue the timing sweep for boolean-mode tests (waitTimeout patterns).
- Vitest: extend `daygrid-adapter.test.ts` / `daygrid-print-adapter.test.ts`
  for the new adapter surface; ratchet/producer unit tests (insertion
  updates extrema; unmount deletes; rejects invalid).

## Manual verification (ask Adam)

- #7447 content under `dayMaxEvents: true` and `dayMaxEventRows: true`:
  no overlap, no oscillation, links not clipped
- month view resize: frontier grows, no remount churn, no feedback loop
  (watch for flicker/oscillation with wrapped event content)
- "+N more" placement sits below visible content; popovers correct
- print preview of a limited month view: bands intact, no dark-mode/height
  artifacts, per-source maxima respected
- liquid-height rows: initial provisional layout settles without lasting
  row-height inflation (settle gate working: row heights reported to the
  owner only after exact heights)
