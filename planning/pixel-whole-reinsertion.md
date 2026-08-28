# Pixel-Limited Whole Reinsertion and Render-Set Ownership

Status: resolved 2026-08 — whole reinsertion stays forbidden. See the
Resolution section at the end. The body below records the original
investigation: current behavior, why it likely developed, and the policy
decision that was isolated.

## The question

Pixel-limited layout sends two kinds of rejected whole slices through
`mergeExtraIntoLevelCoords`. That merge may mutate planning topology by hiding,
consuming, slicing, and re-firing geometry. Nevertheless, its initial calls to
`fireSlice` are forbidden from placing an extra as a whole:

```ts
allowExtraWholePlacement: false
```

At the other end of the pipeline,
`compilePixelLimitedRenderSlices` starts with the initially admitted DOM-frontier
wholes and imports only partial slices from the mutated planning topology:

```ts
const renderSlices = domWholeSliceLevels.flat()

for (const slices of planningSliceLevels) {
  for (const slice of slices) {
    const key = getSliceKey(slice)
    if (isPartialSlice(slice) && !renderKeys.has(key)) {
      renderSlices.push(slice)
      renderKeys.add(key)
    }
  }
}
```

The immediate conundrum is circular:

- The merge cannot add a new whole because render compilation would omit it.
- Render compilation omits planning wholes because the merge promises not to
  add new ones.

There is no independent DOM mechanism that makes a newly planned whole
unrenderable. A key-deduplicated render union could render it. The real question
is a placement-policy question:

> Should a whole event rejected only by the estimated DOM frontier be allowed
> to enter pixel placement after merge topology changes?

That question must be answered separately from the rule that a measured whole
already rejected by the pixel ceiling stays rejected.

## Relevant code and terminology

Primary implementation:

- `standard/packages/preact/src/seg-placement/kernel.ts`
  - `resolveLevelCoords`
  - `mergeExtraIntoLevelCoords`
  - `compilePixelLimitedRenderSlices`
  - `buildPixelLimitedLayout`
  - `mergeExtraIntoStructure` / `fireSlice`
- `standard/packages/preact/src/daygrid/seg-placement-adapter.ts`
  - planning-thickness calculation
  - render-list federation
  - exact measurement and settlement projections

Useful tests:

- `standard/packages/preact/tests/seg-placement/kernel-correctness.test.ts`
- `standard/packages/preact/tests/seg-placement/daygrid-adapter.test.ts`

Earlier design records:

- `planning/INDEX.md`
- `planning/pseudocode.js`
- `planning/phase-3-daygrid-pixels.md`
- `planning/daygrid-ratchet-renovation.md`

Terms used in this note:

- **Whole slice**: covers the full lateral span of its source seg.
- **Partial slice**: a narrower fragment created during collision peeling.
- **DOM frontier**: the dimensionless number of whole logical levels selected
  as worth initially mounting and measuring (`neededLevelCount`).
- **DOM-frontier whole**: a whole in `domWholeSliceLevels`, whether it ends up
  visibly placed or hidden as a measurement donor.
- **Planning topology**: `planningSliceLevels`, mutated by the pixel merge
  using stable planning thicknesses.
- **Exact placement**: `placementSliceLevels` and `sliceCoords` after exact
  measured-coordinate resolution.
- **Donor**: a rendered but unplaced slice retained to report its dimensions.

“Render owner” has appeared in comments and discussion, but it is not a
separate program entity. In practice it merely means that a slice is included
in `renderSlices` and therefore receives a mounted DOM element. Prefer
“rendered slice” or “measurement donor” when those are the actual meanings.

## Current pixel-limited pipeline

### 1. Build the dimensionless DOM frontier

`buildSegLevels` places source segs into whole logical levels, capped by
`neededLevelCount`:

```ts
const { segLevels, excludedSegs } = buildSegLevels(
  segs,
  eventOrderStrict,
  neededLevelCount,
)
```

The admitted levels become `domWholeSliceLevels`. Their wholes are initial DOM
candidates. The rejected sources become `domExcludedSlices`; their wholes are
not initially rendered or measured.

```text
all source segs
  |
  +-- within neededLevelCount --> domWholeSliceLevels
  |
  `-- beyond frontier ---------> domExcludedSlices
```

The frontier is about initial whole mounting, not the final visible set.

### 2. Resolve admitted wholes against the pixel ceiling

`resolveLevelCoords` processes the DOM-frontier wholes using exact measured
heights when available:

```ts
const wholeResolution = resolveLevelCoords(
  domWholeSliceLevels,
  sliceHeights,
  canvasHeight,
)
```

This creates three relevant cohorts:

1. `wholeResolution.placementSliceLevels`: measured wholes that fit.
2. `wholeResolution.excludedSlices`: measured wholes that exceed the pixel
   ceiling.
3. `wholeResolution.pendingSlices`: unmeasured wholes that remain rendered for
   measurement but do not yet enter placement.

Importantly, coordinate-excluded and pending wholes remain in
`domWholeSliceLevels`. Render compilation later retains them as invisible
donors even though they have no coordinate.

### 3. Merge rejected extras into planning topology

Once the canvas, more-link height, and planning-thickness function are
available, two different rejection cohorts are concatenated and restored to
global event order:

```ts
const extraSlices = sortByEventOrder(
  wholeResolution.excludedSlices.concat(domExcludedSlices),
)
```

These cohorts have materially different histories:

| Extra cohort | Was its whole initially rendered? | Is its whole measured? | Why was it rejected? |
| --- | --- | --- | --- |
| Coordinate-excluded | Yes | Yes | Its exact resolved bottom exceeded the pixel ceiling |
| DOM-excluded | No | Usually no | Its logical level fell beyond `neededLevelCount` |

Despite the distinction, both flow through one `extraSlices` array and receive
the same initial whole-placement policy:

```ts
allowExtraWholePlacement: false
```

`fireSlice` still computes an insertion for the whole. Its behavior is subtle:

- If the whole has a valid insertion and whole placement is allowed, insert it.
- If the candidate is partial and has a valid insertion, insert it.
- If the whole has a valid insertion but whole placement is disallowed, hide
  it. Do not slice it merely because policy denied the whole.
- Only a genuine geometric failure (`!insertion`) earns a feasibility
  partition and partial-slice salvage.

The last two rules mean that `allowExtraWholePlacement: false` is not simply a
render filter. It changes visible/hidden geometry. A now-placeable rejected
whole is hidden rather than reinserted or arbitrarily fragmented.

### 4. Resolve exact coordinates inside selected planning topology

The merge owns stable planning topology. A subsequent unbounded exact pass
uses current measurements to compact coordinates without reconsidering the
pixel admission decision:

```ts
const exactResolution = resolveLevelCoords(
  planningSliceLevels,
  sliceHeights,
)
```

Unmeasured newly created partials remain pending until their DOM nodes report
heights.

### 5. Compile the render set

`compilePixelLimitedRenderSlices` currently renders:

1. Every initial DOM-frontier whole, including unplaced donors.
2. Every partial found in planning topology, deduplicated by slice key.
3. No whole that exists only in planning topology.

Consequently:

```text
renderSlices
  = initial DOM-frontier wholes
  + planned partials
```

It is not currently:

```text
renderSlices
  = measurement donors
  union planned slices
```

The difference matters only if planning is ever allowed to gain a whole that
was not in the initial DOM frontier. Current merge policy prevents that state.

## Why the partial-only compiler probably exists

### Confirmed original contract: wholes were already supplied

The initial planning contract in `planning/pseudocode.js` says:

> Every DOM-frontier whole is emitted exactly once as its source's permanent
> measurable node. Whole entries in placementSliceLevels are therefore not
> emitted again. Only partial placement entries are appended as supplemental,
> independently measured nodes.

Under that model, the partial test was primarily a role/deduplication boundary:

- All placeable wholes were already represented by permanent DOM-frontier
  nodes.
- Placement topology contained a subset of those same whole objects.
- Appending placement wholes would duplicate their DOM elements.
- Partials were the only topology entries without existing DOM nodes.

Thus “append only partials” did not originally discard a meaningful class of
new whole placements. The merge separately guaranteed that such placements
could not exist.

The compiler later gained key deduplication. Mechanically, that makes it
possible to union all planning slices without duplicating initial wholes, but
the older slice-kind condition remains.

### Confirmed later expansion: salvage beyond the frontier

Commit `1f049811a` (“Allow slicing beyond DayGrid DOM frontier”) stopped
force-hiding all `domExcludedSlices`. It allowed the pixel merge to evaluate
their geometry using fallback planning thickness and mount feasible partials
selectively. The commit explicitly retained both policies:

- whole reinsertion remains disabled;
- feasible partial donors beyond the frontier may mount.

This expanded the meaning of planning topology without expanding the meaning
of the whole render set. From that point onward, partialness served as a proxy
for two facts:

1. The slice was newly synthesized by the merge.
2. It was permitted to cross the initial DOM frontier.

Those facts happen to coincide today, but neither is inherently a property of
being partial.

### Likely reason: preserve a simple DOM-frontier invariant

The current design maintains:

```text
mounted whole slices = wholes admitted by neededLevelCount
```

Allowing a `domExcludedSlice` to re-enter whole would selectively mount a whole
beyond that initial frontier. This would weaken the frontier from a strict
whole-mount boundary into an initial estimate that later planning can pierce.

The planning notes reject simply widening the frontier because doing so mounts
every intervening logical level merely to reach one deep candidate. Selective
whole mounting would not incur that exact cost, so the prior argument does not
fully settle the current question. It would, however, introduce a second path
by which wholes enter the DOM and would require explicit convergence rules.

### Likely reason: avoid provisional whole-placement feedback

A DOM-excluded whole normally has no direct measurement. Its admission would
use a fallback derived from the largest currently measured whole. Once mounted,
its exact height could be larger and could invalidate the placement that caused
it to mount.

The system already handles an analogous bootstrap for partials through the
slice-height growth-rate ratchet:

- a partial is admitted using a stable prediction;
- the partial mounts and measures itself;
- an underprediction raises a monotone rate;
- the next solve becomes more conservative;
- removal of the partial cannot erase the retained rate.

It is not yet established whether newly admitted wholes have an equally safe
correction path. Whole measurements feed the current fallback base rather than
the partial growth-rate calculation. A new whole could enlarge that base, but
the monotonicity and mount/unmount behavior need to be traced before relying on
it as a convergence proof.

### Likely reason: preserve rejection and event-order semantics

Earlier planning documents explicitly accept this behavior change:

> Coordinate exclusion is final for a whole slice.

That policy is strong and well motivated for a measured coordinate-excluded
whole. It is less clearly applicable to a whole rejected only by the estimated
dimensionless DOM frontier.

A later event beyond the frontier could become whole-placeable after earlier
extras cause occupants to consume visible events or cause slices to be peeled.
Showing that later event whole may be desirable compaction. It may also be a
surprising violation of the intended frontier/event-priority rule: a deep
event becomes visible only after earlier events were hidden to make room for
links.

This is a product and topology policy, not a render-system limitation. It
needs an explicit expected fixture.

## What is definitely justified versus still unresolved

### Coordinate-excluded wholes

A whole in `wholeResolution.excludedSlices`:

- is already in `domWholeSliceLevels`;
- already has a rendered donor;
- has an exact measured height;
- was rejected by the real pixel ceiling.

Preventing its whole reinsertion preserves a clear invariant: bounded exact
whole rejection is final during the solve. Partial salvage remains permitted
only where the unchanged whole genuinely has no admissible position.

The render compiler's partial-only rule does not keep this whole mounted; the
initial `domWholeSliceLevels.flat()` does.

### DOM-excluded wholes

A whole in `domExcludedSlices`:

- is not in `domWholeSliceLevels`;
- usually has no measurement;
- was rejected by an estimated logical mounting frontier rather than a pixel
  calculation;
- may currently produce partials using fallback thickness;
- cannot currently re-enter whole even if merge topology admits it.

The justification here is unresolved. The existing behavior may be the right
frontier policy, but it is not forced by DOM ownership or by the compiler. A
key-deduplicated union could render such a whole.

## The structural problem

The code represents several independent concepts indirectly:

| Concept | Current proxy |
| --- | --- |
| Initial measurement candidacy | Membership in `domWholeSliceLevels` |
| Whole rejection reason | Membership in one of two arrays before concatenation |
| Permission to cross the frontier | `isPartialSlice(slice)` |
| Need for a supplemental DOM node | `isPartialSlice(slice)` |
| Final render eligibility | Initial whole membership or partial planning membership |

After `extraSlices` is constructed, rejection provenance is discarded. The
single `allowExtraWholePlacement` boolean must then express policy for both
coordinate-excluded and DOM-excluded wholes even though their cases differ.

Render compilation reconstructs lifecycle state from slice shape rather than
receiving an explicit set of measurement donors and an explicit placed
topology. This is why the pipeline is hard to explain: “whole” simultaneously
means geometry, initial DOM candidacy, donor identity, and rejection finality.

## Design directions

### Direction A: make provenance and render sets explicit

This is the clearest conceptual target.

Retain the rejection reason when firing extras:

```ts
interface ExtraSlice<S extends SourceSeg> {
  slice: Slice<S>
  rejection: 'coordinate' | 'dom-frontier'
}
```

Decide whole retry from provenance rather than one global boolean:

```ts
function mayRetryWhole(extra: ExtraSlice<S>): boolean {
  return extra.rejection === 'dom-frontier' // if that policy is selected
}
```

Compile rendering from explicit responsibilities:

```ts
renderSlices = unionByKey(
  measurementDonorSlices,
  planningSliceLevels.flat(),
)
```

Under this model:

- Donors render because measurement policy selected them.
- Planned slices render because placement topology selected them.
- Slice geometry no longer stands in for render eligibility.
- Coordinate rejection can remain final without constraining frontier
  rejection.

This direction does not predetermine whether frontier-excluded wholes may
retry. It makes the decision local and visible.

### Direction B: keep whole retry forbidden, but express the invariant directly

If the intended answer is that no pixel extra may ever re-enter whole, retain
that behavior but remove the misleading dependency on render compilation:

1. Document that `domWholeSliceLevels` is the complete and permanent whole
   render set for the solve.
2. Rename `allowExtraWholePlacement` to express rejection finality, such as
   `mayReinstateWholeExtra`.
3. State why DOM-frontier rejection is final, not only why coordinate
   rejection is final.
4. Consider making `compilePixelLimitedRenderSlices` a key-deduplicated union
   anyway, with an assertion or test that no planning-only whole exists. That
   makes rendering robust without silently changing placement policy.

This is the smallest behavioral change, but it requires a real product reason
for permanently rejecting frontier wholes.

### Direction C: split the two extra passes

Instead of tagging extras, process the cohorts through explicit entry points:

```text
merge coordinate-excluded extras with whole retry forbidden
merge DOM-excluded extras with the selected frontier policy
```

This makes the distinction obvious but risks changing global event-order
semantics. The current code deliberately sorts both cohorts together because
their collision, slicing, hiding, and occupant decisions must occur in one
event order. A two-pass implementation is therefore unsafe unless the shared
merge can still consume a globally ordered stream carrying per-entry policy.

Tagging entries is preferable.

### Direction D: remove the initial-whole/supplemental-partial compiler model

Another possibility is to have the layout return explicit render records:

```ts
interface RenderSlice<S extends SourceSeg> {
  slice: Slice<S>
  role: 'placed' | 'measurement-donor'
}
```

The merge/resolve orchestration would produce the final records directly.
Adapters would no longer infer invisibility from absence in `sliceCoords` or
infer donor status from initial whole membership.

This is broader but would make the lifecycle auditable. It should be weighed
against keeping the kernel DOM-free and avoiding UI concepts in core geometry.
An orchestration-layer compiler could own these records without putting them
inside the merge kernel.

## Questions that must be answered before implementation

1. Is `neededLevelCount` a strict whole-DOM boundary, or only an initial
   candidate estimate?
2. If a DOM-excluded whole becomes placeable after topology mutation, should
   it appear whole, remain hidden, or be eligible only for genuine collision
   peeling?
3. Is it acceptable for a later beyond-frontier event to appear after an
   earlier event is consumed into a more-link group?
4. Does mounting a newly admitted whole using fallback thickness converge
   monotonically after its actual measurement arrives?
5. Should a newly admitted whole become a permanent donor for the remainder of
   the row owner's lifetime, or unmount when it later loses placement?
6. Is the DOM-cost goal “never mount wholes beyond the frontier,” or “avoid
   mounting all intervening levels”? Selective whole admission satisfies only
   the latter.
7. Should render compilation be robust to every slice in planning topology,
   even if current placement policy makes planning-only wholes impossible?

## Fixtures needed to decide safely

Before changing behavior, create small headless fixtures for both rejection
origins.

### Coordinate-excluded whole becomes geometrically placeable later

Construct a case where:

- a measured DOM-frontier whole exceeds the pixel bound during initial exact
  resolution;
- processing an earlier hidden group consumes or reslices its former blockers;
- the rejected whole would fit if retried.

Expected current behavior: it remains hidden as a whole. Verify that partial
salvage occurs only when the unchanged whole still has no admissible insertion.

Expected proposed invariant: likely unchanged; exact bounded rejection remains
final.

### DOM-excluded whole becomes placeable later

Construct a case where:

- a source is excluded only because its logical level exceeds
  `neededLevelCount`;
- preceding merge operations mutate topology so the whole now has a valid
  pixel insertion;
- its planning thickness uses the beyond-frontier fallback.

Compare the product outcomes:

- current: whole stays hidden;
- possible: whole enters planning and render sets;
- possible fallback: whole stays hidden unless a genuine geometric failure
  produces feasible partials.

This fixture should decide whether selective whole compaction is desirable.

### Measurement correction for a newly admitted whole

If frontier whole retry is considered, run at least two conceptual renders:

1. The unmeasured whole fits using fallback thickness and mounts.
2. Its reported height is larger than the fallback.

Verify that the next topology does not oscillate after the whole is removed or
repositioned. Trace both the largest-whole fallback and row-local ratchets.

### Render-union behavior

Independently test that a key-deduplicated union:

- emits every initial whole exactly once;
- retains coordinate-excluded and pending whole donors;
- emits planned partials exactly once;
- emits a synthetic planning-only whole exactly once;
- does not alter order within the adapter's later federation/sort step.

This can be tested even if whole retry remains forbidden, making the compiler's
contract explicit and future-proof.

## Recommended investigation sequence

1. Add the two provenance-sensitive kernel fixtures without changing
   expectations. Confirm that the second scenario is reachable under the
   current consume/peel algorithm.
2. Trace the newly admitted whole measurement lifecycle in DayGrid and
   Timeline. In particular, determine whether fallback-base updates form a
   monotone correction channel comparable to the partial growth-rate ratchet.
3. Decide and document the semantics of `neededLevelCount`: strict whole-mount
   boundary versus initial estimate.
4. Preserve rejection provenance through the globally event-ordered extra
   stream.
5. Separate render-set compilation from whole-retry policy, preferably by
   compiling a key-deduplicated union of explicit donors and planned slices.
6. Only then enable or permanently reject whole retry for DOM-frontier extras.
7. Ask for browser verification of DayGrid boolean-auto behavior, especially
   wrapped content, more-link counts, resizing, flicker, and DOM-node churn.

Per repository guidance, do not rely on running the automated suite locally;
request user verification after implementation.

## Working thesis

The partial-only check in `compilePixelLimitedRenderSlices` is best understood
as an artifact of the original permanent-whole-donor model. At that time it
was a concise way to append only genuinely new DOM nodes. Later support for
slicing beyond the DOM frontier turned the same check into an implicit
frontier policy.

The code should stop using slice shape to encode that policy. Coordinate
rejection and DOM-frontier rejection should retain distinct provenance;
rendering should be the explicit union of required measurement donors and
selected planning slices; and the decision to retry a frontier-excluded whole
should be made on its product, ordering, DOM-cost, and convergence merits.

## Resolution (2026-08)

Decision: keep whole reinsertion forbidden and keep the single boolean —
Direction B in its minimal form. `allowExtraWholePlacement` was renamed to
`mayReinstateWholeExtras` and hoisted to a positional parameter of both merge
wrappers, so the layout callers — which own the render model that justifies
the value — now state the policy at their call sites (`buildLevelLimitedLayout`
and `planPrintDomCandidates` render topology directly and pass true;
`buildPixelLimitedLayout` compiles frontier wholes plus partials and passes
false, beside the cohort concatenation that discards rejection provenance).
Rationale comments live at those call sites and on
`compilePixelLimitedRenderSlices`; the render compiler retains its
partial-only rule.

The open questions above were settled by tracing the DayGrid adapter:

### Frontier (DOM-excluded) whole retry is affirmatively unsafe today

Question 4 is answered no — there is no monotone correction channel for a
newly admitted whole, and the failure is structural, not just unproven:

- `ratchetDayGridSliceHeightGrowthRate` skips whole slices outright.
- Even if it sampled them, the rate has no lever on a whole: planning
  thickness is `sourceHeight * (1 + rate * compressionGrowth)` and
  `compressionGrowth` is zero for a whole (and the observed-rate formula
  would divide by zero). The rate corrects multiplicative compression error;
  a fallback-admitted whole's error is additive base error in `sourceHeight`
  itself.
- The only stores of that base correction are `sliceHeights` (a plain
  `RefMap` without `ignoreDeletes` — entries are deleted on unmount) and
  `largestWholeHeight` (recomputed from that live map each snapshot, so it
  reverts with it).

The resulting loop: admit at fallback `B` → mount, measure `h > B` → next
solve rejects on `h` → unmount deletes `h` → next solve is bit-for-bit the
first solve → re-admit at `B`. It bites exactly in the regime (`B` fits, `h`
does not) that the partial ratchet was built to make impossible.

`neededLevelCount` is therefore a strict whole-mount boundary (question 1).

### Coordinate-excluded whole retry is mechanically free, deferred on product

For a whole, planning thickness equals its measured height (compression
growth is zero), so the merge's `isValid` replays the same arithmetic that
excluded it and can only re-admit when consumption genuinely opened space.
The donor is already mounted and measured, already in the render set via
`domWholeSliceLevels`, and deterministic across passes — the compiler would
not even need to change. Forbidding it is purely the product policy of
bounded-rejection finality. Enabling it would align `dayMaxEvents: true`
with `dayMaxEventRows`, which already reinstates wholes freed by occupant
consumption (`mayReinstateWholeExtras: true` in levels mode). Deferred, not
rejected.

### If frontier retry is ever wanted: the whole-fallback ratchet

The missing convergence machinery is a second monotone channel that ratchets
the fallback base, not the compression rate: on measuring a fallback-admitted
whole at `h`, retain `h / B_planning - 1` in a rate that survives unmount, so
the next unmeasured reservation is `B * (1 + rate) = h`. Two sharp edges:

1. Sample against the base actually used at planning time. By sampling time
   `largestWholeHeight` has already absorbed `h` (self-contamination reads
   `h / B = 1` and never ratchets).
2. Sample only wholes that were actually reserved via the fallback branch of
   `resolveDayGridSourceHeight`. Sampling every whole against
   base-excluding-self ratchets `h_max / h_2nd - 1` from the largest frontier
   whole and over-reserves beyond any evidence. The adapter must record the
   fallback-reserved keys and base per snapshot; the row already retains
   cross-snapshot state.

Keep it separate from the compression-growth rate — folding them together
breaks that channel's exact one-pass fixed point. With this machinery plus
the key-deduplicated union compiler, `mayReinstateWholeExtras` could be
removed entirely; what remains is the product question above.
