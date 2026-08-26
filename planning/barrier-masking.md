# Barrier Masking — Refactor B Peel/Consume Defect

Status: fix implemented in `kernel.ts` (minimal-footprint feasibility sweep
in `mergeExtraIntoStructure`; barrier-derived footprints removed), with the
failure catalog encoded headlessly in
`standard/packages/preact/tests/seg-placement/minimal-footprint.test.ts`.
Browser re-verification pending. Note: the kernel-level 7573 fixture already
behaved correctly before the fix, so the multiMonth browser failure likely
involves runtime geometry or settle timing — re-test it in the browser and
diagnose separately if it still fails.

Originally written after the first post-Refactor-B browser verification pass
surfaced three failing tests and one visible quality gap, all reducible to
one defect in the merge engine.

## Refactor vocabulary

Three code generations matter here. Use these names everywhere:

- **Pre-refactor baseline** — the code immediately before either refactor:
  `ec36941a1~1`. Its insertion model is frozen at
  `planning/reference/seg-hierarchy.pre-refactor.ts` (the
  fire/collide/peel/consume `SegHierarchy` with zombies).
- **Refactor A** — the first rewrite: commits `ec36941a1` ("Phase 1: shared
  geometry kernel") through `d8004ec1c` ("Phase 13: cleanup and deferred
  geometry epochs"). Its engine lived in
  `standard/packages/preact/src/seg-placement/layout.ts` (readable at
  `git show 'e554ca8c7^:standard/packages/preact/src/seg-placement/layout.ts'`).
- **Refactor B** — the current rewrite: planning commit `924894c61`
  ("PLANNING", which authored `planning/INDEX.md` and `pseudocode.js`), then
  `e554ca8c7` ("Phase 1: pure seg-placement engine kernel") through
  `cf406ed33` ("Phase 6"), plus the manual-review-round commits after it.
  Its engine is `standard/packages/preact/src/seg-placement/kernel.ts`.

Between A and B sit a few test-alignment commits, including `73191433d`
"Simple test adjustments", which is load-bearing below.

## Failure catalog

Aside from these, the full standard + premium browser suites pass.

### 1. dayGrid 5790 — "positions more-links correctly in columns that have empty space"

`standard/packages/vanilla-tests/src/event-render/dayGrid-events.ts`,
https://github.com/fullcalendar/fullcalendar/issues/5790.
Level currency with more-link tax (`dayMaxEventRows: 4`), month view,
one row Aug 30 – Sep 5 2020, events a–e.

- Expected: all five titles visible somewhere; exactly one `+more` on
  Sep 2 (`d`/`e` hide only their Sep 2 slice, their Sep 3–4 remainders
  place on the free level).
- Observed: `d`/`e` fully hidden across Sep 2–3; `+more` links on two days.

### 2. dayGrid 5883 — "renders without gaps when ordered by title"

Same file, https://github.com/fullcalendar/fullcalendar/issues/5883.
Level currency with tax (`dayMaxEventRows: 3`), `eventOrder: 'title'`,
events b1–b4 around Oct 20–22 2020.

- Expected: all four titles visible somewhere; one `+more` on Oct 21 only
  (the one day where b1+b2+link leave no room, with b3/b4 peeled around it).
- Observed: only `b1`/`b2` visible; `b3` *and* `b4` fully hidden across
  Oct 20–22; `+more` links on three days. (`b3` is lost to the consume
  path, not the fire path — see root cause.)

### 3. multiMonth 7573 — "will not incorrectly put events under +more link"

`standard/packages/vanilla-tests/src/event-render/multiMonth-events.ts`,
https://github.com/fullcalendar/fullcalendar/issues/7573.
Pixel currency (small multi-month cells), Jan 15–20 2024: two 5-day events
plus one single-day event on the 15th.

- Expected: 2 visible event els (event 1 whole; event 2's peeled
  Jan 16–20 slice) and exactly `['+2 more']` on the 15th.
- Observed: 1 visible el; `+2 more` on the 15th plus four `+1 more` links
  on the 16th–19th (event 2 fully hidden across its span).

### 4. dayGrid 7447 fixture — visible quality gap (no assertion fails)

Same dayGrid test file, the `dayMaxEvents: 4` case of the issue-7447 test,
week of Apr 9–15 2023. Level currency, **no** tax. Sat 15 shows `+2 more`
even though levels 1–2 are free in that column (events `c`/`h` end Friday);
events `b`/`f` should peel Sat-only slices into the gap, leaving Saturday
with no link at all. Traced against `findInsertion`: Sat-only slices for
`b` (level 1) and `f` (level 2) are admissible; they are never generated.

## Root cause: hidden footprints borrow a barrier's span

All four symptoms are one defect in Refactor B's merge engine
(`mergeExtraIntoStructure` in `kernel.ts`), in both of its hiding paths:

- **Fire path.** When `fireSlice` cannot place a slice, the hidden
  footprint is `intersectSlice(slice, barrier)`, where `barrier` is the
  insertion search's `touchingSlice` — the placement the candidate last
  stacked on. That barrier's span routinely overshoots the region that is
  actually infeasible. In 7573, event 2's barrier is event 1, which spans
  event 2's entire range: footprint = everything, `peelSlice` returns
  nothing, five days hide when only one is full. In the 7447 fixture, the
  Fri–Sat remainder of `b` hits barrier `e` (spanning Fri–Sat), so
  Saturday hides along with the genuinely-full Friday.
- **Consume path.** When an occupant cannot place,
  `consumeInvalidOccupants` hides frontier placements by
  `intersectSlice(placement, group)` — the glob *group's* span. In 5883
  the group already spans Oct 20–22, so consumed `b3` loses its whole
  span even though only Oct 21 is over-full.

An aggravating interaction in the pixel route: extras re-fire with
`allowExtraWholePlacement: false` (a coordinate-excluded whole must not
reappear), so peeling is a wide extra's *only* road back to visibility —
which the wide-barrier footprint then closes completely.

The correct footprint in every case is the **minimal infeasible span**:
the lateral range where occupied depth (levels) or occupied coordinate
(pixels) plus the incoming thickness genuinely exceeds the ceiling. Hide
only that; peel and re-fire the rest. Hand-tracing all four fixtures with
that rule produces exactly the expected outcomes, including the 5883
consume (`b3` loses only `[Oct 21]`, its flanks re-place) and the 7447
Saturday gap (no link at all).

## Why Refactor B has this and Refactor A did not

Agreed with the review observation that the code prior to Refactor B was
structurally better positioned here — with one refinement: "prior" must
mean Refactor A specifically, not the pre-refactor baseline.

- **Refactor A** never subtracted a barrier. Its limiter
  (`limitOverflowedPlacements`) took each overflowed placement and ran a
  *positive* search: first try re-fitting the whole within limits, then
  `createBoundedSlicePlan`, which enumerates every meaningful
  `(levelIndex, levelCoord)` position within the limit, computes the free
  lateral runs at each (`findFreeRunsAtPosition`, honoring per-cell
  `levelLimits`/`coordLimits`), and picks the best-scoring plan. Hidden
  geometry was the *complement* of what visibly fit
  (`findHiddenComplement`). A search over feasible space cannot be masked
  by any single collider — barrier masking is impossible by construction.
- **The pre-refactor baseline** had the same subtractive shape as B
  (`intersectCoordRanges(seg, touchingPlacement)`), so it shared the
  defect. It merely got lucky in the common case: its zombie
  `hiddenConsumes` sliced the consumed placement by the *incoming* seg's
  span, and the incoming troublemaker is often narrow (7573's single-day
  event 3). The luck runs out exactly when the incoming seg is wide —
  which is the 5883 shape.
- **Refactor B** deliberately revived the baseline's
  fire/collide/peel/consume model (see the frozen-reference header and
  `planning/INDEX.md` invariant 5), replacing zombies with more-link
  occupants — and inherited the barrier-footprint weakness along with it,
  in both hiding paths.

Timeline evidence: `73191433d` "Simple test adjustments" — the commit that
tightened 5790/5883 to their current ideal expectations — lands *after*
Refactor A's Phase 13 and *before* Refactor B's planning commit. If those
expectations were verified green when committed (believed but worth
confirming), then all three failing tests are hard regressions of B
against A, not aspirations. 7573's expectations predate both refactors, so
that one is a hard regression regardless.

## Fix direction

Keep Refactor B's architecture (glob groups, occupants, no per-column
accounting in the engine) and fix the footprint computation inside
`mergeExtraIntoStructure`: replace both `intersectSlice(_, barrierSpan)`
call sites with a computed minimal infeasible span, derived from the same
collider geometry `findInsertion` already gathers. This is pure
lateral-interval math and works in both currencies (occupied level count
vs. occupied coordinate against the ceiling).

Cautions, learned from Refactor A's slice-plan machinery:

- **Slivers.** A minimal footprint can leave arbitrarily short visible
  remainders. Refactor A guarded with `minSliceLength` and a per-slice
  score penalty (`- 0.15 * (sliceCount - 1)`, `maxSlices` 1–3). B's peel
  currently has no such governor; decide whether one is needed before
  shipping, or accept slivers initially and evaluate visually.
- **Fragmentation of the infeasible span itself.** The infeasible region
  may be disjoint (full on Mon and Thu, free between). The hidden
  footprint then contributes multiple glob-group witnesses; the grouping
  code already handles disjoint groups, but the peel must emit all
  interior remainders, not just the two flanks.
- **Convergence.** Re-fired remainders must strictly shrink (the hidden
  footprint is non-empty whenever placement failed), preserving the
  engine's termination argument.
- **Occupant feedback.** Hiding less means occupants appear in fewer
  places, which can itself relieve tax pressure; positioning already
  re-runs after each merge step, so no extra pass is expected, but the
  5883 fixture (consume + tax) is the regression test for this loop.

Repro harness: the failures reproduce headlessly through
`buildDayGridLevelPlacements` / `buildDayGridPixelPlacements` with small
integer fixtures (no browser needed), so kernel tests in
`standard/packages/preact/tests/seg-placement/` should encode all four
fixtures before the fix and assert the ideal outcomes after it.

## Open decisions

1. Accept the behavior change for 5790/5883 (the tightened `73191433d`
   expectations) as the target, or relax the tests? The 7573 regression
   must be fixed either way, and the fix that restores 7573 delivers the
   tightened 5790/5883 behavior for free — so relaxing the tests buys
   nothing unless the fix itself is rejected.
2. Whether to add a `minSliceLength`-style governor to B's peel (see
   Slivers above).
