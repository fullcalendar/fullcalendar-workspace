# Multi-Month Event-Height Ratchet Reset

## Purpose

This is a handoff for a future investigation. The immediate browser regression
is real, but the attempted working-tree fix is narrower than desired. The
preferred direction is to invalidate DayGrid's measurement ratchets when the
rendering geometry/style regime changes, while preserving monotonicity within
one regime.

The relevant Karma test is:

`standard/packages/vanilla-tests/src/event-render/multiMonth-events.ts`

Test name:

`multi-month-view event rendering will not incorrectly put events under +more link`

The test creates a 1000px-wide `multiMonthYear` view with two month columns and
three January events. Expected output is two visible event elements and one
`+2 more` link. The regression produces one visible event and five separate
`+1 more` links.

## Current diagnosis

`MultiMonthView` renders once before its ruler has supplied `innerWidth`.
During that render, the number and width of month columns are not final. After
measurement it computes `cols`, supplies a fractional month width, and reuses
the existing keyed `SingleMonth` components.

`SingleMonth` then observes a different `gridWidth` and recomputes:

- `colWidth`
- `cellIsNarrow`
- `cellIsMicro`
- the multi-month column/layout styling context

Those inputs affect event markup and styling. In particular, DayGrid event
rendering receives `cellIsNarrow`, and `cellIsMicro` suppresses time text.
Theme classes can also vary with the multi-month column count. Consequently,
the same event can have a different occupied height before and after the
month becomes compact.

`DayGridRows`, however, survives this transition with the same placement-owner
state. Its `largestSliceHeight` is an owner-lifetime maximum. A tall value
observed in the initial wide/unsettled rendering remains after the compact
rendering produces shorter slices.

Pixel-limited placement uses that historical maximum as the stable planning
thickness passed to `mergeExtraIntoLevelCoords`. In the compact row, the merge
therefore treats current slices as taller than they really are. More-link
occupancy appears not to fit below the expected frontier, so the merge consumes
too many visible placements and fragments a multi-day event across its days.
That is why the failure has five `+1 more` links rather than the expected single
`+2 more` link.

The wide-to-compact lifecycle is the leading diagnosis and should be confirmed
with instrumentation before implementing the reset. Log the multi-month column
count, grid/cell width, narrow/micro flags, slice-height reports, owner extrema,
and merge planning thickness for the failing January row.

## Why the ratchet exists

The maximum is monotone to keep DOM topology from depending on measurements
owned by that topology. Partial slices exist only when the merge creates them.
If mounting and unmounting a partial alternately adds and deletes the exact
measurement used by the next merge, placement can feed back into its own
inputs.

The ratchet is therefore valid within a stable measurement environment. The
problem is its lifetime: it currently crosses an external rendering-regime
change that invalidates its samples.

The useful distinction is:

- Placement-driven changes must not reset the ratchet.
- Exogenous geometry/style changes should start a new ratchet epoch.

## Why the discarded experimental fix was not the desired solution

An experimental fix made
`mergeExtraIntoLevelCoords` use exact map heights for whole slices while still
using `largestSliceHeight` for partial slices. This fixes the Karma reproduction
because its important placed slices are whole slices with persistent
measurements.

It does not solve the general problem. A partial slice whose real height is
smaller than the stale global maximum can still be conservatively rejected or
cause another placement to be hidden. A later coordinate pass cannot repair an
admission decision already made by the merge.

The experiment also removes the second `resolveLevelCoords` pass. That is a
separate design question and should not be bundled with the ratchet-reset work.
Without an exact coordinate pass, partials positioned with the maximum planning
thickness never vertically compress to their measured coordinates. The likely
two-phase model remains:

1. Stable planning geometry decides topology.
2. Exact measurements resolve coordinates within that fixed topology, using
   planning thickness temporarily for unmeasured partials.

The rejected experiment modified these files after a clean `HEAD` at
`24026efc8`:

- `standard/packages/preact/src/daygrid/components/DayGridRow.tsx`
- `standard/packages/preact/src/daygrid/seg-placement-adapter.ts`
- `standard/packages/preact/src/seg-placement/kernel.ts`
- `standard/packages/preact/tests/seg-placement/daygrid-adapter.test.ts`
- `standard/packages/preact/tests/seg-placement/kernel-correctness.test.ts`
- `standard/packages/preact/tests/seg-placement/kernel-fuzz.test.ts`

Those tracked modifications have been discarded. At handoff, the only
working-tree addition should be this planning document.

## Recommended direction: measurement epochs

Give each placement owner an explicit measurement epoch. Ratchet values remain
monotone only while the epoch is unchanged. When an external input invalidates
the meaning of previously observed heights, start a new epoch and reset the
entire owner state:

- `smallestSliceHeight`
- `largestSliceHeight`
- `largestCanvasHeight`
- `neededLevelCount`

Resetting the state as one unit avoids mixing a canvas measurement from one
regime with a slice measurement from another. `neededLevelCount` should restart
as well; retaining it would be safe for correctness but would preserve an
obsolete, unnecessarily large DOM frontier.

Likely epoch inputs include at least:

- `cellIsNarrow`
- `cellIsMicro`
- multi-month column/layout mode

Effective event width also matters because custom event content can wrap at
arbitrary widths without crossing narrow or micro thresholds. Deciding whether
and how width participates in the epoch is the main open design question.
Resetting on every raw width report is simple, but width must be demonstrably
external to vertical placement; scrollbar-induced width changes could otherwise
form a new feedback path. A discrete rendering key may be safer but incomplete
for wrapping custom content.

Other inputs that can invalidate heights, such as theme or event-rendering
configuration changes, should be considered. Avoid constructing an enormous
ad-hoc dependency list if the component architecture already has a natural
rendering-generation identifier.

## Remeasurement requirement

Clearing owner state alone is insufficient. Existing `MeasuredAbsoluteHarness`
instances may retain the same dimensions across an epoch transition, in which
case `ResizeObserver` is not required to report again. The new owner could then
remain empty or contain only the subset of wrappers whose sizes changed.

An epoch reset must guarantee a complete fresh snapshot. Candidate approaches:

1. Key/remount the measurement subtree by epoch. This is mechanically reliable
   but causes event lifecycle and DOM churn.
2. Have each `DayGridRow` replay all live entries in its `sliceHeightMap` after
   the owner resets. Care is needed to prevent old-regime entries from being
   replayed before the new render has committed and been measured.
3. Move current, keyed slice measurements to the owner so it can distinguish
   current values from monotone epoch extrema. This is architecturally cleaner
   but a larger change.

Whichever approach is chosen, do not reset or delete the monotone planning
state in response to hidden groups, partial creation, placement membership, or
slice unmounts within the same epoch.

Standalone `DayGridRow` usage, such as the TimeGrid all-day lane, has local
smallest/largest ratchets and needs the same invalidation analysis even though
the reported Karma failure comes from `DayGridRows` in multi-month view.

## Suggested implementation sequence

1. Instrument the Karma reproduction and verify the exact wide-to-compact
   transition and stale maximum.
2. Define the smallest explicit measurement-epoch key that fixes the verified
   transition without depending on placement output.
3. Reset all owner ratchets atomically when that key changes.
4. Guarantee complete measurement reporting for the new epoch.
5. Keep uniform, monotone planning behavior within the epoch; do not special-case
   whole slices merely to satisfy the reproduction.
6. Add focused unit coverage for epoch reset and retain the browser regression.
7. Audit standalone DayGrid rows for the equivalent stale-ratchet behavior.

## Acceptance criteria

- The multi-month Karma reproduction consistently yields two visible events
  and one `+2 more` link.
- A wide-to-compact and compact-to-wide transition cannot reuse slice or canvas
  extrema from the previous rendering regime.
- Partial-slice mount/unmount churn within one epoch cannot reset or shrink the
  planning maximum.
- Custom wrapped event content does not overlap or cause placement oscillation.
- Resetting an epoch obtains a complete new measurement snapshot even when some
  wrappers retain exactly the same dimensions.
- No placement-derived height or visibility change can itself advance the
  measurement epoch.
