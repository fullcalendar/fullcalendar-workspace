# Pixel-Limited Monotonic Pruning

This is a possible successor to the whole-plan fallback demonstrated in
`level-limit-cheesecloth-toy.ts`. It deliberately builds on the same logical
proposal and exact pixel validation rather than changing logical placement.

It is not implemented yet. The purpose of this note is to preserve the design
while the simpler fallback implementation is reviewed and refined.

## Motivation

Whole-plan fallback discards a sliced proposal when any measured slice or more
link does not fit. That gives the simplest safety proof, but one unusually tall
partial can discard unrelated partials that fit perfectly.

Monotonic pruning keeps the valid parts of the proposal. Once logical planning
is complete, the algorithm may only remove visible slices. It never inserts a
new slice, widens a slice, changes a slice's level, or reclaims newly empty
space.

This sacrifices repacking opportunities in exchange for a simple convergence
rule: every repair iteration strictly reduces the visible proposal.

## Shared Setup

The setup is identical to whole-plan fallback:

1. Build unrestricted whole-slice levels.
2. Resolve the whole slices with measured pixel heights.
3. Construct the conservative, whole-only safe plan.
4. Fire rejected whole slices through the logical placement engine.
5. Measure any partial slices from the resulting logical proposal invisibly.

The safe plan stays visible until pruning reaches a valid fixed point. Pending
measurements do not cause removal because the algorithm has no pixel fact on
which to base that decision.

## One Repair Loop

Event overflow and more-link overflow can become two sources of removal work in
the same loop:

```text
validate exact coordinates
        |
        +-- event exceeds canvas ------------------+
        |                                           |
        +-- event intrudes into a more-link strip --+--> select removals
                                                    |
                                                    v
                                         remove visible slices
                                                    |
                                                    v
                                       grow hidden coverage union
                                                    |
                                                    v
                                      repair higher-level coordinates
                                                    |
                                                    +--> validate again
```

The validator already reports the facts required by this loop:

- `pendingSlices`
- `overflowingSlices`
- `moreLinkViolationSpans`
- exact coordinates for all measured slices

An event overflow directly identifies a removal candidate. A more-link
violation identifies lateral territory; the remover selects the intersecting
visible slice with the greatest measured bottom, just as the safe-plan builder
selects its whole-slice frontier victim.

Both cases therefore feed the same removal operation. Removing a slice adds it
to flat hidden membership, expands the normalized more-link coverage, and can
create additional link-strip violations elsewhere. Those consequences are
discovered by the next validation pass instead of being handled by a separate
recursive more-link phase.

## Initial Removal Granularity

The simplest first policy should be source-atomic:

- If any visible slice from one source event is selected for removal, remove
  every visible slice from that source.
- Add the source's removed visible spans to hidden membership.
- Do not refire its surviving space or try an alternate slice plan.

This avoids displaying a seemingly arbitrary remnant after the source's chosen
plan failed. It also gives one stable unit for comparing fallback and pruning.

A later experiment could remove only the offending partial. That may retain
more exposed area, but it produces more fragmented event representations and
more detailed hidden membership.

## Coordinate Repair

Removing a slice from logical level `i` cannot change coordinates in levels
below `i`. Other slices in level `i` do not laterally intersect it, so their
coordinates also remain valid.

Only levels greater than `i` may have lost support. For a batch of removals,
coordinate repair can begin at:

```text
min(removed level indexes) + 1
```

The next validation pass then uses the repaired coordinate map. Surviving
slices can only move toward the top after removals; ordinary event overflow
cannot become worse. New failures can still appear where expanded hidden
coverage creates a new more-link strip.

## Termination and Safety

Each non-pending invalid iteration must remove at least one visible source.
There are finitely many visible sources, and none can re-enter the proposal.
The loop therefore ends in one of two states:

- A pixel-valid pruned proposal, which can be committed.
- No useful sliced proposal remains, in which case the existing safe plan is
  committed.

The candidate remains invisible throughout measurement and pruning. A plan is
made visible only after exact validation reports no pending slices, event
overflow, or more-link violations. Consequently, pruning does not weaken the
whole-plan fallback's no-visible-overflow guarantee.

## Relationship to the Logical More-Link Tax

The logical proposal may continue using a one-level more-link tax as a cheap
packing heuristic. Monotonic pruning does not treat that tax as authoritative.
The actual bottom strip is always determined from `moreLinkHeight` during pixel
validation.

If the level tax was too conservative, the proposal is underpacked but valid.
If it was too optimistic, exact more-link violations simply generate removal
work. No pixel-aware callback needs to enter the logical placement engine.

## Expected Implementation Shape

The fallback and pruning implementations should share these operations:

- Whole-slice pixel-frontier resolution
- Logical sliced-proposal construction
- Exact proposal validation
- Frontier-victim selection for more-link violations
- Coordinate repair above removed levels
- Flat hidden-slice and normalized-coverage maintenance

Pruning would add one new orchestrator resembling:

```ts
function prunePixelPlan(
  logicalProposal: LimitedLayout,
  maxPixels: number,
  moreLinkHeight: number,
  sliceHeights: SliceHeightMap,
): PixelPlan | null
```

It should consume validation results and invoke existing lower-level
operations. It should not introduce another generalized merge algorithm.

## Comparison Questions

When both versions exist, useful comparisons include:

- Additional code required by pruning
- Number of exact coordinate repairs
- Amount of visible lateral event coverage retained
- Number of sources represented by fragmented slices
- Frequency with which whole-plan fallback discards an otherwise useful plan
- Whether source-atomic pruning is visually predictable enough

The whole-plan fallback remains the reference implementation: if pruning makes
the lifecycle or safety argument difficult to follow, its additional packing
is not worth keeping.
