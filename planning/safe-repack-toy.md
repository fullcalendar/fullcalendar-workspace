# Safe Repack Toy: Algorithm Overview

This document accompanies
[`safe-repack-toy.ts`](./safe-repack-toy.ts). The pair
is intended to be reviewed together for correctness, invariant violations, and
edge cases. The TypeScript file is a standalone design toy, not production
code.

## Goal

The toy explores how much of event limiting can remain in logical slice-level
space, even when a pixel limit ultimately determines what fits.

It has two component-facing entrypoints:

- `buildLevelLimitedLayout` limits events by a fixed number of logical levels.
- `buildPixelLimitedLayout` limits events by measured pixel height, but reuses
  the same logical insertion and slicing machinery for its speculative plan.

Both functions return the same lean result:

- `renderSlices`: every slice the component must mount, including invisible
  measurement donors.
- `hiddenSlices`: the event footprints represented by more links rather than
  visible events.
- `moreLinkGroups`: independently rendered more-link spans, together with the
  hidden slices represented by each span.
- `sliceCoords`: top coordinates for visibly placed slices. A rendered slice
  without an entry is a measurement donor and should be visibility-hidden.

Logical levels are intentionally not exposed to components.

## Core model

A `Seg` is one source event with a half-open lateral span. It is converted once
to an immutable whole `Slice` carrying stable source order. Slicing creates
narrower objects with the same source identity and order.

A slice-level structure is an array of levels. Each level is sorted laterally
and contains no intersecting slices. Lower array indexes are visually above
higher indexes.

The initial level builder is bounded. It streams whole slices into at most the
requested number of levels and immediately sets aside anything that cannot be
admitted. It never constructs a large unlimited hierarchy merely to truncate
it afterward.

## Shared logical placement

`placeExtraSlicesInLevels` receives a fixed set of existing logical levels and
a flat stream of extra slices. It never creates another level.

The placement engine also reports `addedSlices`: the slices present in its
final topology that were not part of the received levels. It updates this set
at the same insertion and eviction points that mutate the topology, so callers
do not need to reconstruct the delta afterward.

For each extra slice it:

1. Attempts to place the whole slice into the shallowest vacant level.
2. If whole placement fails and event slicing is enabled, finds the best
   partial plan confined to one level.
3. Scores plans by visible lateral length, with a penalty for fragmentation.
4. Inserts the winning visible runs and records the remainder as hidden.
5. If no plan is available, records the entire slice as hidden.

The current scoring limit considers at most three visible runs from a given
level. This is a packing policy, not a correctness requirement.

Hidden slices remain available as one flat array. At the same time, each newly
hidden slice is added to the more-link groups.

## More-link groups and logical tax

A more-link group is a strict-intersection connected component of hidden
slices. It contains its total lateral span and the ordered hidden slices that
formed it.

Exactly adjacent spans do not merge. For example, `[0, 1]` and `[1, 2]` remain
two groups and therefore produce two independently rendered more links. A
later hidden slice that strictly intersects both groups connects and merges
them.

The group array also serves as the coverage accumulator. When a hidden slice
is added, the algorithm computes only the newly covered lateral runs. This
prevents the same more-link tax from being fired repeatedly over old coverage.

The level-limited path supports a more-link tax of zero or one logical level.
When the tax is one, newly covered runs evict intersecting slices from the
bottom event level. With event slicing enabled, only the intersecting portion
of a victim becomes hidden and its surviving remainders are fired back through
the normal placement process. With slicing disabled, the whole victim becomes
hidden. If there are zero event levels, there is simply no level to evict from.

## Coordinate resolution

`resolveSliceLevelCoords` inflates a fixed logical hierarchy using a map of
measured slice heights.

For each slice, its top is the maximum bottom of all intersecting slices in
lower admitted levels. The resolver then classifies it as:

- admitted, when its measured bottom is within the optional pixel boundary;
- pending, when its height has not been measured;
- excluded, when its measured bottom exceeds the boundary.

Only admitted slices influence later coordinates. Empty output levels are not
created, so later slices naturally move upward when earlier levels contribute
nothing.

Pending slices still need DOM nodes. The top-level compiler includes them in
`renderSlices`, but they have no coordinate until measured.

## Level-limited path

The level-limited path is the simpler route:

1. Build whole-slice levels while enforcing `maxLevels`.
2. Send initially excluded slices through shared logical placement.
3. Apply the optional one-level more-link tax during that placement.
4. Resolve coordinates without a pixel ceiling.
5. Flatten admitted and pending slices into the component render set.

There is one selected plan. It is not speculative and has no fallback cycle.

## Pixel-limited path

The pixel route separates guaranteed whole-slice safety from speculative
logical repacking.

### 1. Build and measure the bounded DOM frontier

Whole slices are streamed into at most `neededLevelCount` logical levels. This
is the initial set worth mounting and measuring. Wholes outside that frontier
start hidden and unmeasured.

The bounded levels are resolved against `maxPixels`. Pending wholes and wholes
whose measured bottoms exceed the limit join the initial hidden stream.

### 2. Build the conservative safe plan

The maximum event bottom beneath a more link is computed once:

```ts
Math.max(0, maxPixels - moreLinkHeight)
```

The UI contract says more links always render, even when their own height is
larger than the pixel budget. Clamping to zero means that no positive-height
event may coexist beneath such a link; overflow by the link itself is accepted
product behavior.

Every initially hidden whole grows the more-link groups. An admitted whole
that intersects newly covered territory and extends below the more-link event
boundary is evicted whole. That victim becomes hidden, can widen a group, and
may cause further whole evictions.

This closure deliberately consults coordinates from the original admitted
whole structure. Removing events can only allow survivors to move upward, so
the stale bottoms can overreserve but should not make the safe plan visually
unsafe. Coordinates are recomputed after the closure.

### 3. Build one speculative logical candidate

The safe plan's hidden slices are fired back at its fixed logical levels using
the shared logical placement function. Pixel mode supplies no logical-level
more-link tax: the safe plan already performed conservative pixel reservation,
and the candidate receives exact pixel validation afterward.

This candidate can contain retained safe wholes, reinserted wholes, and newly
created partial slices.

### 4. Measure and validate the candidate

The candidate is resolved against `maxPixels` using exact heights.

If any candidate slice is pending or ordinarily pixel-excluded, the safe plan
remains visibly selected. The logical placement engine's `addedSlices` are
nevertheless included in the safe result's `renderSlices` without coordinates.
Keeping both measured and unmeasured candidate donors mounted prevents a repeated
mount-measure-reject-unmount cycle.

Once fully measured and ordinarily in bounds, the candidate receives one final
check: every visible event intersecting a more-link group must end at or above
the precomputed more-link event boundary.

The candidate is accepted wholesale only when that check passes. Otherwise,
the safe plan remains selected, together with the invisible candidate-only
measurement donors.

## Intended invariants

Reviewers should verify that every mutation preserves these properties:

1. Slices within one logical level are laterally sorted and nonintersecting.
2. A visible slice is inserted only into a vacant lateral span.
3. Visible and hidden fragments preserve the source slice's lateral geometry
   without accidental overlap or loss.
4. More-link groups equal the strict-intersection grouping of all hidden
   slices, and adjacent components remain separate.
5. With a one-level logical tax, no visible slice in the bottom level intersects
   active more-link coverage after the work queue settles.
6. Coordinate resolution prevents vertical overlap between intersecting slices
   in different admitted levels.
7. Every visibly accepted pixel-limited event ends within `maxPixels`.
8. Every event under a pixel more link respects `moreLinkEventMax`.
9. Safe-plan eviction is monotonic and terminates.
10. Logical slicing and more-link eviction terminate because refired slices are
    strict subspans drawn from a finite set of boundaries.
11. Every slice that needs measurement is returned in `renderSlices`, even when
    it is not visibly placed.

## Deliberate simplifications and tradeoffs

- The toy has no strict event-order mode or product-specific rendering types.
- Pixel candidate failure rejects the entire speculative plan rather than
  incrementally repairing it.
- Safe whole-slice eviction can overreserve because it uses stale conservative
  coordinates.
- Logical partial placement may underpack because it stays within the existing
  level count, confines each plan to one level, and caps fragmentation.
- More-link groups duplicate references already present in `hiddenSlices` in
  exchange for a directly consumable component contract.
- More-link overflow itself is explicitly allowed; event overflow is not.
- The algorithm favors clarity over asymptotic optimization in group rebuilding
  and repeated intersection searches.

## Input assumptions

The toy assumes:

- every span has finite coordinates with `start < end`;
- segment IDs uniquely identify source events;
- measured heights are finite and nonnegative;
- level counts are nonnegative integers;
- `maxPixels` and `moreLinkHeight` are nonnegative;
- a height-map key uniquely identifies one exact lateral slice.

These assumptions are not all defended at runtime.

## Suggested adversarial review cases

- Zero levels with both logical-tax modes and both slicing modes.
- One level with a hidden span that partially intersects several occupants.
- Two exactly adjacent hidden spans, followed by a third span that bridges
  them.
- A hidden slice that adds coverage on both its left and right sides.
- Variable-height events where removing one whole allows several higher-level
  events to move upward.
- A candidate partial whose narrower width makes it much taller than its whole.
- A candidate with a mixture of measured, pending, and pixel-excluded slices.
- A candidate rejected only by the more-link event boundary.
- A candidate that eliminates all hidden slices.
- A more link equal to or taller than the entire pixel budget.
- Duplicate or overlapping fragments from the same source.
- Multiple candidates across renders, checking that rejected measurement donors
  remain mounted but invisible.
