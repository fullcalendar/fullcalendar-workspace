# Pixel-Limited Monotonic Pruning

This is the sole pixel-limited planner in `level-limit-cheesecloth-toy.ts`. It
builds on the logical candidate and coordinate machinery, then repairs that
candidate by removal only.

## Motivation

Rejecting a complete sliced proposal when one measured slice or more link does
not fit gives a simple safety proof, but one unusually tall partial can discard
unrelated partials that fit perfectly.

Monotonic pruning keeps the valid parts of the proposal. Once logical planning
is complete, the algorithm may only remove visible slices. It never inserts a
new slice, widens a slice, changes a slice's level, or reclaims newly empty
space.

This sacrifices repacking opportunities in exchange for a simple convergence
rule: every repair iteration strictly reduces the visible proposal.

## Shared Setup

The planner has two invocations of the same pruning engine:

1. Build unrestricted whole-slice levels.
2. Resolve the whole slices with measured pixel heights.
3. Fire rejected whole slices through the logical placement engine.
4. Try to prune the resulting liberal topology.
5. If a liberal slice is unmeasured, invisibly measure it while showing a
   whole-only topology pruned by the same engine.

The whole-only invocation is a temporary visible state, not a second planning
algorithm. Pending measurements do not cause removal because the pruner has no
pixel fact on which to base that decision.

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

Each pass resolves exact coordinates and inspects two pixel facts: event
bottoms beyond the row boundary and event bottoms intruding into covered
more-link territory.

An event overflow directly identifies a removal candidate. A more-link
violation identifies lateral territory; the remover selects the intersecting
visible slice with the greatest measured bottom.

Both cases therefore feed the same removal operation. Removing a slice adds it
to flat hidden membership, expands the normalized more-link coverage, and can
create additional link-strip violations elsewhere. Those consequences are
discovered by the next validation pass instead of being handled by a separate
recursive more-link phase.

## Removal Granularity

Removal is slice-atomic. An overflowing slice or exact more-link victim is
removed independently, while other visible slices from the same source remain.
The removed span is added to hidden membership and is not refired or replaced
with an alternate slice plan.

This keeps all independently valid coverage and avoids introducing source-ID
grouping into pixel pruning.

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

Each non-pending invalid iteration removes at least one visible slice. There
are finitely many visible slices, and none can re-enter the proposal. Assuming
the more link itself fits within the row, the loop therefore reaches a
pixel-valid fixed point. An invocation with an unmeasured visible slice returns
`null` before pruning begins.

The liberal candidate remains invisible while measurements are pending. A
liberal plan is made visible only after it has no pending slices, event
overflow, or more-link violations. Consequently, no visible plan overflows.

## Relationship to the Logical More-Link Tax

The logical proposal may continue using a one-level more-link tax as a cheap
packing heuristic. Monotonic pruning does not treat that tax as authoritative.
The actual bottom strip is always determined from `moreLinkHeight` during pixel
validation.

If the level tax was too conservative, the proposal is underpacked but valid.
If it was too optimistic, exact more-link violations simply generate removal
work. Pixel-informed insertion hooks can improve the candidate before pruning,
but pruning itself only removes from the topology it receives.

## Implementation Shape

Both invocations of the pruner share these operations:

- Mutable level, hidden-membership, and coverage state
- Whole-slice pixel-frontier resolution
- Logical sliced-proposal construction
- Frontier-victim selection for more-link violations
- Coordinate repair above removed levels
- Flat hidden-slice and normalized-coverage maintenance

The reusable orchestrator is:

```ts
function prunePixelPlan(
  topology: readonly (readonly Slice[])[],
  initialHiddenSlices: readonly Slice[],
  sliceHeights: SliceHeightMap,
  maxPixels: number,
  moreLinkHeight: number,
): PixelPlan | null
```

It is attempted first on the liberal topology. If a visible slice lacks a
measurement, it is used on the whole-only topology to produce the temporary
visible plan. It invokes existing lower-level operations instead of
introducing another generalized merge algorithm.
