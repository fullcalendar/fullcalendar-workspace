# DayGrid Ratchet and Measurement Renovation

## Purpose

This document records a proposed renovation of DayGrid's boolean-auto,
pixel-limited event placement. The goal is to supersede the four current
owner-lifetime ratchets with measurements and state whose lifetimes more closely
match the layout decisions they support.

The current ratchets are:

- `smallestSliceHeight`
- `largestSliceHeight`
- `largestCanvasHeight`
- `neededLevelCount`

This proposal removes the first and third, moves and narrows the lifetime of the
fourth, and replaces the second with a row-local, dimensionless growth-rate
ratchet. The growth-rate formula is decided: Candidate B, the direct
compression-growth multiplier. Candidate A remains documented below as a
rejected alternative, together with the selection rationale and the sampling
protocol that protects the ratchet from measurement noise and from pairing
measurements taken in different layout passes.

This direction is related to, but more structural than, the measurement-epoch
approach in `planning/multimonth-ratchet-reset.md`. Instead of finding every CSS
or geometry transition that should clear pixel extrema, it attempts to stop
retaining most historical pixel extrema in the first place.

## Current responsibilities

### `smallestSliceHeight`

This is the smallest positive height ever reported by a whole or partial slice
across a `DayGridRows` owner's lifetime. It currently has two responsibilities:

1. Along with `largestCanvasHeight`, it expands `neededLevelCount` by estimating
   how many event levels might fit.
2. It is supplied to `mergeExtraIntoLevelCoords` as the pixel thickness of a
   hidden group's more-link occupant. It therefore participates directly in
   final fit, collision, peeling, and hidden-group decisions.

The second responsibility is conceptually mismatched. An event slice is only a
proxy for the element whose space is actually being budgeted: the more-link
trigger.

### `largestSliceHeight`

This is the largest positive height ever reported by a whole or partial slice
across the owner lifetime. It is passed to `mergeExtraIntoLevelCoords` as one
uniform planning thickness for every slice.

The monotone maximum prevents a topology feedback loop. A partial slice exists
only if the merge creates it. If its live measurement directly determined the
next merge, removing the partial would remove that measurement and could cause
the merge to recreate it indefinitely. Retaining a maximum makes topology
changes one-way: a newly discovered taller slice can increase reservations and
rerun the layout, but removal of that slice cannot decrease reservations.

The problem is that the retained value is a literal pixel height. When CSS,
available width, narrow/micro mode, or event markup changes, an obsolete height
can remain in control of later topology. This is the mechanism implicated in
the multi-month regression described in `planning/multimonth-ratchet-reset.md`.

### `largestCanvasHeight`

This is the largest settled event-area height ever reported by any row in a
`DayGridRows` owner. It excludes the day-number header and is used only to
expand the shared `neededLevelCount`. The actual pixel ceiling for a row is not
this ratchet; each row already passes its current measured canvas height into
the kernel.

### `neededLevelCount`

This is the monotone number of logical levels worth mounting as whole-slice DOM
candidates before pixel placement. It starts with the fallback capacity
`ceil(150 / 20)`, or eight levels, and currently grows from the shared
`largestCanvasHeight / smallestSliceHeight` estimate.

It is a measurement frontier, not the final visible-event limit. A wider
frontier permits more whole slices to mount and report dimensions; the
pixel-limited solve still decides which measured slices actually fit.

## Proposed target ownership

| Owner | Proposed measurement or state |
| --- | --- |
| `DayGridRows` | One live, offscreen measurement of a real row-style more-link trigger. |
| Each `DayGridRow` | A row-local monotone `neededLevelCount`. |
| Each `DayGridRow` | A row-local monotone slice-height growth rate, using one of the two candidate formulas below. |
| Each `DayGridRow` | Its existing live slice-height map and current canvas dimensions. |

There would no longer be a shared `smallestSliceHeight`,
`largestCanvasHeight`, `neededLevelCount`, or literal `largestSliceHeight`.

## 1. Replace `smallestSliceHeight` with a more-link probe

### Existing precedent

Resource Timeline already implements the desired probe pattern. Its view
renders a real `ResourceExpander` with `classNames.offscreen`, observes its
width, stores that width on the parent, and passes it to the row layout as
`indentWidth`.

The DayGrid equivalent should render the actual presentational more-link
component offscreen in `DayGridRows`, observe it with `watchHeight`, and pass
the resulting height into every `DayGridRow`.

The probe should:

- use `classNames.offscreen`, which places the element absolutely at a remote
  inline coordinate and therefore keeps it out of normal layout;
- use `watchHeight` rather than `MeasuredAbsoluteHarness`;
- have `colWidth` as its width, because custom more-link content can wrap and
  its height can therefore depend on the width of one DayGrid column;
- render as a row-style more link with count `1`, avoiding the current
  zero-hidden-count suppression;
- receive the same narrow/micro inputs and the same content and class-name
  generators as a real row more link;
- be noninteractive, excluded from accessibility, and not invoke the public
  `moreLinkDidMount` or `moreLinkWillUnmount` hooks.

Not every route currently supplies `colWidth`, but every route already
computes it: the `DayGridRows` prop exists and `DayGridLayoutPannable` passes
it; `SingleMonth` computes `colWidth = gridWidth / cellColCnt` for its
narrow/micro decisions and simply does not pass it; `DayGridLayoutNormal`
computes the same quantity as `cellWidth = clientWidth / colCount`. The fix is
to drill each parent's already-computed value down as the existing `colWidth`
prop — do not re-derive it as `visibleWidth / columnCount` inside
`DayGridRows`. That division is subtly wrong in two routes: in
`DayGridLayoutNormal`, `visibleWidth` is `totalWidth` (scrollbar included)
while the cell width governing narrow/micro styling derives from `clientWidth`
(scrollbar excluded); in `DayGridLayoutPannable`, `colWidth` comes from
`computeColWidth` with `dayMinWidth` in play and need not equal
`visibleWidth / colCount` at all. Drilling keeps a single source of truth per
route. While `colWidth` is still `undefined` (pre-measurement render), the
probe has no meaningful width and the merge simply remains gated, which also
keeps pre-measurement renders from planning partials.

The measured value should be passed as a prop such as `moreLinkHeight`. Until
both `moreLinkHeight` and the row's canvas height are known, the pixel merge
should remain gated. Whole-slice DOM candidates can still mount for
measurement, but partial slicing should not begin.

Count `1` is a canonical planning form, not a guarantee that arbitrary custom
content has the same height for every count. A custom generator can render
count-dependent markup. Nevertheless, a probe of the real link presentation
is a much more direct budget than the shortest event slice.

### Extract `MoreLinkTrigger`

`MoreLinkContainer` currently combines several concerns:

1. The themed and customizable trigger presentation.
2. Click behavior and accessibility wiring.
3. Date-range calculation, popover state, alignment, and popover content.

A separate `MoreLinkTrigger` component should own only the actual trigger
presentation. Its small interface should include the count, row/column display
mode, narrow/micro inputs, optional element ref, and optional DOM attributes,
classes, style, and handler. It should construct `MoreLinkInfo` and apply:

- `moreLinkText`
- `moreLinkContent`
- `moreLinkClass`
- `moreLinkInnerClass`
- `rowMoreLinkClass` / `rowMoreLinkInnerClass`
- `columnMoreLinkClass` / `columnMoreLinkInnerClass`

It should not require date profiles, event segments, popover content, popover
alignment, or interaction state.

`MoreLinkContainer` should retain real-link behavior and render
`MoreLinkTrigger`. The DayGrid probe should render `MoreLinkTrigger` directly,
with `num={1}`, without constructing fake popover inputs or triggering public
mount lifecycle callbacks.

### Result

Once the kernel receives the measured more-link height directly,
`smallestSliceHeight` is no longer needed for more-link occupancy.

## 2. Make `neededLevelCount` a row-local ratchet

Each `DayGridRow` should start with `DEFAULT_NEEDED_LEVEL_COUNT` and retain only
its own monotone frontier. A short event or tall canvas in one row should not
inflate the number of DOM candidates mounted by every other current and future
row.

This ownership also provides a useful makeshift lifetime for virtualization.
If a row is unmounted while scrolling through a very large or virtualized
DayGrid, its historical frontier disappears naturally. A later row begins from
the default instead of inheriting the most extreme measurement ever seen by
the parent.

The row should recompute the candidate estimate whenever either side of the
capacity relationship changes:

- any header/main measurement is inserted, updated, or removed, changing the
  row's complete canvas-height snapshot; or
- any whole or partial slice height is inserted, updated, or removed.

Both measurement paths already schedule row positioning work. That shared work
can read the latest complete canvas height and scan the current live
`sliceHeightMap`:

```ts
nextNeededLevelCount = Math.max(
  currentNeededLevelCount,
  ...sliceHeights.map((height) =>
    estimateLevelCapacity(canvasHeight, height)
  ),
)
```

Equivalently, the scan could first find the current minimum live slice height.
That minimum must not be retained as separate state. Only the resulting level
count survives later measurement deletion.

Recomputing on both input paths handles all ordering combinations:

- canvas measured after slices;
- slices measured after canvas;
- canvas resized without a slice resize callback;
- slice resized without a canvas resize;
- newly mounted candidates expanding the frontier and contributing new
  measurements.

## 3. Remove `largestCanvasHeight`

Once `neededLevelCount` is row-local and recomputed from the row's current
canvas height, there is no need to reduce an array of row canvas heights to one
shared historical maximum.

Removing `largestCanvasHeight` should also remove the now-unused reporting
path from `DayGridRow` to `DayGridRows`, including `onEventAreaHeight` and the
settled event-area report scheduling whose sole consumer was the parent
ratchet. The row still needs its current canvas measurement for its own pixel
ceiling and candidate-capacity recomputation.

## 4. Supersede `largestSliceHeight` with a dimensionless growth rate

### Core idea

For each measured partial slice, compare it with the currently measured whole
source segment:

- source span in column units: `sourceWidth`
- partial span in column units: `sliceWidth`
- current whole-source pixel height: `sourceHeight`
- current partial pixel height: `sliceHeight`

The stored row-local value should express how much height tends to grow as
width is compressed. It should never decrease. A partial that reveals a larger
growth relationship raises the ratchet and causes a complete topology rerun
with more generous reservations. If that rerun removes the partial, its
measurement disappears but its learned rate remains, preventing a reverse
transition and feedback loop.

The whole source donor already remains in the DOM. Pixel-limited rendering
starts with every admitted whole slice and adds partial donors; a whole that
loses placement remains hidden but measured. This existing invariant must be
preserved because it supplies each partial's live `sourceHeight`.

Planning must change from one uniform scalar thickness to a per-slice derived
thickness. Conceptually:

```ts
getPlanningSliceThickness(slice)
```

- A whole slice uses its current measured whole-source height.
- A partial uses its current whole-source height plus an expansion predicted
  from its column compression and the row's retained growth rate.
- A slice whose whole-source measurement is unavailable substitutes the
  largest point-in-time measured whole height in the row as its
  `sourceHeight`, then runs through the same growth model.

The fallback keeps events beyond the `neededLevelCount` frontier
merge-eligible, matching today's behavior for `domExcludedSlices`. Rejected
alternatives: widening the frontier to mount their donors would flood-mount
every level between the old frontier and one deep event; whitelisting specific
whole segments would require a mount-and-hope second orchestration pass. The
point-in-time fallback is a strict improvement over the status quo, which uses
the stale `largestSliceHeight` ratchet for the same purpose.

The fallback must be the largest current whole measurement, not the smallest.
If the fallback is too large, the cost is conservative and familiar: a deep
event sits under the more-link when it might have fit. If it were too small,
the merge could admit an event that does not fit — and if that event lands as
a partial whose whole donor is still beyond the frontier, the correcting
measurement never arrives, leaving a persistent overlap with no self-heal
path. Errors from the large side are harmless; errors from the small side can
be permanent.

The fallback is feedback-safe: it samples only whole-slice measurements, and
the set of mounted whole donors is driven by the frontier, not by merge
output, so partial mount/unmount churn cannot move it. It changes only when
the frontier widens (new samples) or an existing donor remeasures (regime
change) — the latter being exactly the responsiveness the retired ratchet
lacked. The degenerate case of zero measured wholes needs no special handling:
the merge stays gated until the probe and canvas are measured, and the first
levels always sit within the default frontier.

A callback is justified here rather than being a middleman around a map:
partial slices are created dynamically inside the merge, so the value must be
derived from newly created geometry, a source measurement, and the retained
rate.

The growth rate is recomputed by scanning currently measured whole/partial
pairs, then ratcheting the maximum surviving sample into the row-local value.
No historical collection of individual measurements is required. The scan is
governed by the two sampling rules below.

### Sampling rule 1: scan only complete `afterSize` snapshots

A sample divides two live measurements that arrive from two different
`ResizeObserver` wrappers. The division is only meaningful when both values
describe the same layout pass. If sampling ran inside an individual report
callback, it could observe a half-updated map: during a wide-to-compact
transition, the whole source may already have re-reported its short compact
height while the partial still holds its tall wide-mode value. The resulting
ratio compares two different rendering worlds, can be enormous, and would be
ratcheted for the row's lifetime — the original stale-pixel disease reborn in
rate space.

Rate samples must therefore only ever be taken from a whole map snapshot at
`afterSize` time, never inside an individual measurement callback. The
`afterSize` flush runs after the entire `ResizeObserver` delivery loop, which
supplies the required consistency:

- the scan never runs between two reports of the same delivery batch;
- entries that did not report in a batch still equal their wrapper's current
  size, so the post-flush map is a coherent snapshot; and
- a snapshot that is uniformly stale relative to a just-committed re-render is
  still internally consistent, and a consistent pair from the previous
  rendering world is a legitimate sample of that world. Consistency, not
  freshness, is the requirement.

`afterSize` stores callbacks in a `Set`, so registering the same bound
recompute method from every measurement path is idempotent, matching the
existing `afterSize(this.handleSegPositioning)` idiom. A dirty flag that skips
the scan when no relevant height changed is an optional implementer
optimization; the scan is one pass over a small live map, so recomputing
unconditionally is acceptable. The scan does not need to know which
measurements changed: every currently measured pair is evaluated statelessly
from its own two snapshot values.

### Sampling rule 2: a pixel noise floor on height growth

Inside the scan, a pair is skipped when:

```ts
sliceHeight <= sourceHeight + 2 // pixels; indistinguishable from no growth
```

Skipping is identical to snapping the sample's growth to zero: the stored rate
is born at zero and changes only through `Math.max`, so a skipped pair and a
zero-growth sample are the same operation, and no code ever writes a zero. The
guard clamps samples, never the stored ratchet: a legitimately learned rate is
never snapped back down.

The floor exists because spans are integer column counts, so long events
produce compressions barely above one, and the rate formula divides by a
near-zero compression term there. A source spanning ten columns at 20px whose
nine-column partial reports 21px from border or subpixel rounding yields:

```text
observedRate = (21/20 - 1) / (10/9 - 1) ~= 0.45
```

One pixel of noise becomes a permanently ratcheted rate that roughly triples
reservations for future narrow partials of that row. Two alternative guard
shapes were considered and rejected:

- A near-zero epsilon in rate space does not work, because the amplification
  means pixel noise does not appear near zero in rate space: the sample above
  reads 0.45, and any epsilon large enough to catch it would also discard
  substantial real growth observed at higher compressions. No single
  rate-space number covers both.
- A percentage-of-source-height threshold does not work, because the noise
  being suppressed is additive pixel rounding that does not scale with element
  height. Ten percent of a tall custom event could swallow a genuine wrapped
  line and permanently block a real sample from ever being learned.

The absolute floor is the upward completion of the existing
`Math.max(1, expansion)` clamp, which already treats a partial measuring
shorter than its source as no growth. Together they form one dead zone around
"no growth."

Aggressive discarding is safe because the two error directions are not
symmetric. A bogus sample that is too high ratchets permanently. A discarded
sample merely under-reserves its own pair by at most the floor itself, roughly
two pixels of slack, and any genuine wrap adds at least a line height and
passes the floor at every compression. The governing principle: every sampling
guard must bound the worst-case under-reservation it can cause, because
under-reservation is the only error direction with a bounded, self-correcting
cost.

### Bootstrap behavior

The growth rate should begin at zero, representing the common no-wrap case in
which width compression does not increase height.

Combined with the pixel noise floor, this zero is sticky in the strongest
sense: in a row whose events are all constant-height, every pair falls inside
the floor on every scan, no sample is ever admitted, and the rate provably
never leaves its bootstrap value. Rounding quirks alone can never prevent
slices from fitting into space they would visually fit into.

The first genuinely expanding partial will initially be under-reserved. It
serves as an unsettled measurement donor. Once it reports its height, the rate
increases and the complete topology reruns with a sufficient reservation. This
is monotone convergence rather than a feedback loop: the retained rate can
invalidate placements in the more-conservative direction, but removing the
measurement cannot lower the rate and recreate them.

No learned model can guarantee sufficient reservation before seeing its first
expanding example unless it begins with an arbitrarily conservative positive
default.

## Growth model: Candidate B selected

Both candidates below are dimensionless, start at zero, use the current
whole-source pixel height as their scale, and ratchet upward. Both guarantee
that, while the source measurement remains comparable, a retained rate at
least as large as an observed sample reserves at least that sample's height.

Candidate B, the direct compression-growth multiplier, is selected. Candidate
A remains documented as a rejected alternative. The deciding arguments:

- Noise sensitivity does not differentiate them. Near compression one,
  `log(1 + x)` approximates `x`, so both formulas degenerate to the same small
  ratio divided by the same small ratio; on the ten-column rounding example in
  the sampling rules, Candidate A learns 0.463 where B learns 0.45. Noise is
  handled entirely by the pixel floor, upstream of either formula, and is
  therefore orthogonal to this choice.
- Extrapolation risk is one-sided. For learned rates above one, Candidate A
  extrapolates as a power law and over-reserves without bound, and
  over-reservation is the permanent, non-self-correcting direction. Candidate
  B's worst case is a straight line. For learned rates below one the
  comparison mildly favors A, but there both are bounded.
- Candidate B's arithmetic is immediately legible, and its stored value has a
  direct reading: rate one is exactly ordinary inverse-width wrapping.

Use these common ratios:

```ts
const compression = sourceWidth / sliceWidth // greater than 1 for a partial
const expansion = Math.max(1, sliceHeight / sourceHeight)
```

Whole slices have `compression === 1` and provide the base height but no growth
observation. Both formulas require positive finite heights and a true partial
with `compression > 1`.

### Candidate A: constant-elasticity power model

#### Formula

The model assumes:

```text
expansion = compression ^ elasticity
```

An observed elasticity is therefore:

```ts
const observedElasticity =
  Math.log(expansion) / Math.log(compression)
```

The row ratchets the maximum observed elasticity and predicts:

```ts
const reservedHeight =
  sourceHeight * compression ** sliceHeightElasticity
```

#### Why logarithms appear

The measurement supplies `compression` and `expansion`, while the unknown is
the exponent:

```text
expansion = compression ^ elasticity
```

Taking logarithms brings the exponent down as a multiplier:

```text
log(expansion) = elasticity * log(compression)
```

Solving gives:

```text
elasticity = log(expansion) / log(compression)
```

The logarithm base does not matter because it cancels in the division. This is
equivalent to asking which exponent turns the observed compression ratio into
the observed expansion ratio.

#### Why exponentiation appears

The power model treats proportional compression as compositional. If width is
compressed first by factor `a` and then by factor `b`, the total compression is
`a * b`. Applying the same proportional response at both stages should produce
the same result as applying it once to the total:

```text
a^E * b^E = (a * b)^E
```

Under ordinary continuity assumptions, a power law is the natural family of
functions that converts multiplication of input ratios into multiplication of
output ratios. This is the original reason for choosing `log` to learn the
exponent and `pow`/`**` to make predictions.

It also gives useful landmarks:

- elasticity `0`: height is constant;
- elasticity `1`: height grows inversely with width;
- elasticity between `0` and `1`: sub-inverse growth;
- elasticity above `1`: faster-than-inverse growth.

#### Example

A four-column source is 20px tall. A two-column partial is 30px tall:

```text
compression = 4 / 2 = 2
expansion = 30 / 20 = 1.5
elasticity = log(1.5) / log(2) ~= 0.585
```

For a future one-column partial:

```text
reservedHeight = 20 * 4^0.585 = 45
```

This is equivalent to two successive halvings, each multiplying height by
`1.5`: `20 * 1.5 * 1.5 = 45`.

#### Reasons to choose it

- It is explicitly scale-free and expresses constant percentage response to
  percentage compression.
- It composes consistently across repeated changes of scale.
- It supplies a smooth family between constant-height and inverse-width
  behavior.
- Ratcheting the exponent gives a direct mathematical over-reservation
  guarantee for every observed sample: for `compression > 1`, a larger
  exponent always produces a greater or equal reservation.

#### Reasons not to choose it

- Logarithms and exponents make the model less immediately legible to future
  maintainers.
- The algorithm always compares a partial directly with its whole source; it
  does not actually perform successive partial-to-partial compression. The
  compositional property may therefore be elegant but unnecessary.
- A small measured height difference at a compression ratio close to one can
  produce an unexpectedly large exponent and amplify predictions for much
  narrower slices.
- Real event height includes fixed padding, borders, icons, and discrete line
  wrapping, so it is not a pure power law.

### Candidate B: direct compression-growth multiplier

#### Formula

This model measures the additional compression and additional height relative
to their unchanged baselines:

```ts
const compressionGrowth = compression - 1
const heightGrowth = expansion - 1

const observedGrowthRate =
  heightGrowth / compressionGrowth
```

The row ratchets the maximum observed rate and predicts:

```ts
const reservedHeight = sourceHeight * (
  1 + sliceHeightGrowthRate * compressionGrowth
)
```

The subtractions anchor both quantities at zero when nothing changes. The
outer `1 +` restores the unchanged source height before adding predicted
growth. A plain `rate * compression` formula would incorrectly predict zero
height when the default rate is zero and would not necessarily reproduce the
source height at zero compression.

#### Why multiplication appears

This treats the retained value as a direct slope:

```text
fractional height growth
------------------------
additional compression
```

The prediction simply multiplies the amount of compression by that learned
slope. No claim is made that changes must compose identically when broken into
multiple intermediate stages. Every partial is evaluated directly against its
whole source, which matches how the placement data is actually structured.

It gives similarly useful landmarks:

- growth rate `0`: height is constant;
- growth rate `1`: height follows ordinary inverse-width behavior;
- growth rate between `0` and `1`: less growth than inverse width;
- growth rate above `1`: more growth than inverse width.

Using `compression - 1`, rather than the bounded fraction
`1 - sliceWidth / sourceWidth`, is important for two reasons.

First, the bounded fraction approaches one as a slice becomes extremely narrow
and would make predicted growth saturate. `sourceWidth / sliceWidth - 1`
continues growing and exactly models inverse-width wrapping when the rate is
one.

Second, and more decisive: with `compression - 1`, the learned rate is a
property of the content rather than of the particular sample. Run true
inverse-width content — a four-column, 20px source whose height doubles when
width halves — through both forms. With `compression - 1`, the two-column
sample (40px) and the one-column sample (80px) both teach rate one, and that
one rate predicts every other width exactly. With the bounded fraction, the
two-column sample teaches rate two while the one-column sample teaches rate
four: the same content teaches a different number depending on which partial
happened to exist. Under a monotone ratchet that is fatal, because the rate
then climbs every time a narrower partial of perfectly ordinary wrapping
content is observed, and each climb over-reserves all wider partials — a
systematic drift in the permanent, non-self-correcting direction.

The verbal reading of the denominator follows: it is a compression factor
("the nine-column partial is 11.1% more compressed than its ten-column
source"), not a removed-width fraction ("10% narrower"). The numerator remains
anchored to the original height ("5% taller than the whole"); the two terms
are deliberately asymmetric because height growth is predicted relative to the
known source height while width compression compounds as slices narrow.

#### Example

Using the same four-column, 20px source and two-column, 30px partial:

```text
compressionGrowth = 4 / 2 - 1 = 1
heightGrowth = 30 / 20 - 1 = 0.5
growthRate = 0.5 / 1 = 0.5
```

For a future one-column partial:

```text
reservedHeight = 20 * (1 + 0.5 * (4 / 1 - 1))
               = 20 * 2.5
               = 50
```

The power model predicts 45px for this example; the direct model predicts
50px. Both exactly reproduce the observed two-column sample. They differ only
when extrapolating to other compression ratios.

If the observed two-column partial were instead 40px tall, both models would
learn a rate/exponent of one and predict 80px at one column, matching the
simple constant-content-area intuition that halving width doubles height.

#### Reasons to choose it

- Its stored value is an immediately understandable amount-of-growth slope.
- Its implementation uses only ratios, subtraction, multiplication, and
  division.
- It is anchored directly to the whole source, matching the actual placement
  operation rather than imposing a partial-to-partial composition property.
- A rate of one exactly represents ordinary inverse-width wrapping.
- Ratcheting the rate gives the same observed-sample over-reservation property:
  for positive `compressionGrowth`, a larger rate cannot reduce the predicted
  height.

#### Reasons not to choose it

- It is not compositionally consistent. Compressing in two conceptual stages
  can predict a different result from applying the total compression directly.
- It chooses a linear extrapolation in `sourceWidth / sliceWidth - 1`; real
  custom content is not guaranteed to follow that line.
- Like the power model, a global maximum across heterogeneous custom events
  could be conservative. Row-local ownership limits, but does not eliminate,
  that effect.

## Properties shared by both growth models

### Monotone topology

For either model, the learned sample rate is chosen so that the prediction
equals the observed partial height. Retaining the maximum sample rate means
the prediction for an already observed compression cannot become smaller just
because the partial donor unmounts. New measurements can only make topology
more conservative.

### Current pixels, historical proportions

The stored ratchet is dimensionless. The actual reservation still uses the
current whole-source pixel height. A proportional font-size or line-height
change therefore changes the reservation immediately without requiring the
historical ratchet to be reset.

This reduces rather than eliminates CSS sensitivity. A regime can change the
wrapping relationship itself, and custom event content can vary arbitrarily
with render props such as `isStart` or `isEnd`. A stale positive rate can still
over-reserve in a later no-wrap regime, but it no longer carries an obsolete
absolute pixel height, and row-local ownership bounds its lifetime and scope.

### Exact-coordinate phase

The growth model should decide stable planning topology, not replace exact
coordinate resolution. After topology has been selected, the existing exact
measurement pass should continue to vertically compress measured slices to
their real coordinates. Unmeasured partial donors remain pending until their
measurements arrive.

## Standalone DayGrid rows

`TimeGridAllDayLane` mounts `DayGridRow` directly rather than through
`DayGridRows`. Removing the local `smallestSliceHeight` means this route also
needs a real more-link-trigger probe. It can either own a probe or receive a
measurement from its TimeGrid parent.

The row-local `neededLevelCount` and growth-rate ratchet naturally work in this
standalone route without a cross-row owner. Because the growth ratchet, its
sampling rules, and the frontier are all row-local, the sampling logic has a
single implementation inside `DayGridRow`, and both mounting routes share it by
construction. The probe is the only per-route concern.

## Suggested implementation sequence

1. Extract `MoreLinkTrigger` from `MoreLinkContainer` without changing real
   more-link behavior.
2. Drill `colWidth` down from the parents that already compute it
   (`SingleMonth` and `DayGridLayoutNormal`; `DayGridLayoutPannable` already
   passes it). Add the `DayGridRows` offscreen count-one probe, sized to
   `colWidth`, and pass its live height to each row. Add equivalent coverage
   for the standalone TimeGrid all-day lane.
3. Replace the merge's `smallestSliceHeight` occupant proxy with the measured
   more-link-trigger height, gating the merge until it is available.
4. Move `neededLevelCount` into `DayGridRow` and recompute it from the current
   complete canvas height and live slice-height map whenever either changes.
5. Remove shared `smallestSliceHeight`, `largestCanvasHeight`, and their now-dead
   owner/reporting machinery.
6. Implement the Candidate B growth ratchet with both sampling rules: samples
   taken only from whole `afterSize` snapshots, and the two-pixel noise floor.
7. Replace uniform `largestSliceHeight` planning with per-slice reservations
   derived from the current whole-source measurement (or the largest-current-
   whole fallback) and the row-local growth ratchet. The mechanical change is
   small: `MergeOptions.sliceThickness` becomes a pure
   `getSliceThickness(slice)` callback, threaded at four sites, each with an
   unambiguous owner — the collider's bottom in `getSliceBottom` and
   `findInsertion`'s `getBottom`, and the candidate's own thickness in
   `findValidInsertion`'s budget check and `findInsertion`'s ceiling-fit
   check. The level-currency merge keeps a constant function returning `1`.
   Probe/place consistency is free: `partitionByFeasibility` probes each
   candidate run through the same `findValidInsertion` that later places it,
   so purity of the callback guarantees agreement. The genuinely new behavior
   is that thickness varies during the merge: a run carved from a parent
   spans fewer columns, is more compressed, and therefore plans thicker than
   the parent — a narrower-is-thicker monotonicity the kernel has never
   exercised. Termination should hold (breakpoints are finite, every refire
   is strictly narrower, determinism prevents inconsistent re-evaluation),
   but the verification burden is the real work: extend the fuzz generator to
   per-slice thickness, including thickness-grows-as-width-shrinks
   generators, and confirm the no-overlap and termination invariants.
8. Preserve whole-source donors, pending-slice settlement, and the later exact
   coordinate pass. Verify in code, and cover with a focused test, that a
   whole donor remains mounted and measured after losing placement, since
   every partial's reservation scale depends on that invariant.
9. Verify the existing multi-month Karma regression and add focused coverage
   for probe updates, row-local frontier lifetime, first partial discovery,
   donor removal, CSS-driven source-height changes, snapshot-consistent
   sampling, noise-floor rejection, and narrower-slice extrapolation.

## Acceptance criteria

- More-link pixel occupancy comes from one real, themed, customizable trigger
  probe rather than an event-height proxy.
- The probe uses count one, `colWidth`, the Resource Timeline offscreen pattern,
  and does not expose a fake link through interaction, accessibility, or public
  mount callbacks.
- Every route drills its own already-computed cell width down as the `colWidth`
  prop; the probe never re-derives it from `visibleWidth`.
- A slice without a whole-source measurement plans with the largest
  point-in-time measured whole height as its fallback `sourceHeight`, keeping
  beyond-frontier events merge-eligible without stale ratchet values.
- The merge accepts a pure per-slice thickness callback, and fuzz coverage
  includes generators where narrower slices plan thicker.
- Each row owns and retires its own `neededLevelCount` frontier.
- Either canvas-measurement changes or slice-measurement changes recompute that
  frontier from the latest complete row snapshot.
- No stored smallest event height or largest canvas height remains.
- No historical literal maximum slice height controls topology.
- A partial slice can raise a row-local dimensionless growth ratchet, and its
  later unmount cannot lower reservations or produce a topology feedback loop.
- Current whole-source heights determine the pixel scale of reservations, so a
  proportional CSS size change does not require clearing a pixel-height
  ratchet.
- Rate samples are taken only from whole `afterSize` map snapshots, never
  inside individual measurement callbacks, so no sample can pair measurements
  from two different layout passes.
- A pair whose height delta is within the two-pixel noise floor contributes no
  sample, and a row of constant-height, no-wrap events retains a zero growth
  rate for its entire lifetime.
- The learned rate is sample-invariant for inverse-width content: partials of
  different widths cut from the same content teach the same rate.
- The selected growth formula and its extrapolation behavior are covered by
  focused tests and documented next to its implementation.
