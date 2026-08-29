# Safe Repack: Algorithm Overview

This document accompanies [`safe-repack-toy.ts`](./safe-repack-toy.ts). It
describes the design at a high level; the TypeScript remains the source of
truth for mechanics and data structures.

## Goal

Safe repack keeps event limiting primarily in logical slice-level space while
still guaranteeing that an accepted pixel-limited event layout fits its pixel
boundary.

Both limiting modes start with bounded whole-event placement and reuse one
logical repacking algorithm. They differ mainly in how they reserve space for
more links and decide whether the resulting layout is acceptable.

## Shared logical model

Events occupy half-open lateral spans in logical levels. A visible slice must
not intersect another slice in the same level. When a whole event cannot be
placed, the repacker may expose selected portions of it in existing level gaps
and represent the remainder with a more link.

Hidden coverage is grouped by strict intersection. Exactly adjacent groups
remain separate so the component can render separate more links. Each returned
group identifies both its lateral span and the hidden source events it
represents.

Initial level construction is bounded rather than unlimited: events that
cannot enter the requested frontier are set aside immediately. Repacking may
reuse gaps in those existing levels but never creates additional levels.

## Level-limited path

The level-limited path builds at most the requested number of levels and then
logically repacks the excluded events into gaps.

If a more link consumes one logical level, hidden coverage reserves the bottom
level only where that coverage exists. Occupants displaced from the reserved
area are hidden or sliced and sent back through the same repacking process.
The resulting topology is then converted to pixel coordinates for rendering;
there is no speculative fallback.

## Pixel-limited path

The pixel-limited path uses a conservative plan and a speculative plan:

1. Build a bounded frontier of whole events and resolve the measured ones
   against the pixel limit. Frontier events awaiting measurement remain
   invisible measurement donors; they are not yet considered hidden.
2. Build a safe whole-only plan. Known hidden events create more-link
   coverage, and measured whole events that intrude into the link's reserved
   pixel band are also hidden. This closure is monotonic.
3. Repack the safe plan's hidden events into its existing logical levels,
   allowing slicing when enabled. This produces one speculative candidate.
4. Resolve the candidate using exact slice measurements. Accept it wholesale
   only if every slice is measured, every event fits the overall pixel limit,
   and events under more links respect the reserved link band. Otherwise,
   return the safe plan.

Candidate-only slices remain mounted invisibly when the safe plan is selected.
This lets the component retain their measurements and prevents a repeated
mount-measure-reject-unmount cycle. Unmeasured frontier wholes likewise remain
mounted until their fate can be determined on a later call.

## Component-facing result

Both paths return the same flat rendering contract:

- slices that must be mounted, including invisible measurement donors;
- coordinates only for slices that should be visible;
- hidden event footprints;
- independently rendered more-link groups and the hidden events represented by
  each group.

Logical levels are internal and are not exposed to components.

## Safety argument

The whole-only plan is safe because it begins with measured events that fit and
only removes events. Its eviction decisions use the original coordinates;
removing support can move survivors upward but not downward, so stale
coordinates may overreserve link space but cannot cause event overflow.

The speculative plan is safe only after exact resolution and validation. Any
unknown height or failed boundary check selects the whole-only plan instead.
More-link overflow itself is allowed by the UI contract; event overflow is
not.

## Deliberate tradeoffs

- Pixel rejection is wholesale rather than an iterative repair process.
- Conservative more-link reservation can hide more events than strictly
  necessary.
- Logical repacking is limited to existing levels and favors continuity over
  maximal packing.
- A frontier event with no measurement is temporarily neither visible nor
  represented by a more link.
- The toy assumes valid finite spans, unique event IDs, nonnegative finite
  measurements and pixel limits, and stable measurement keys for exact slices.
