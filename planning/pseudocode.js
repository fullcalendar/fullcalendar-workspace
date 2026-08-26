/*
Pseudocode referenced by INDEX.md, which owns the governing invariants,
accepted tradeoffs, and glossary; the phase-*.md briefs assign this file's
functions to implementation phases. This is intentionally incomplete: the
empty algorithm bodies and unresolved production helpers are implementation
work, but the orchestration and contracts are valid JavaScript-shaped code.
When a brief and this file disagree, this file wins.
*/

/** DayGrid via level number, or Resource Timeline with eventMaxStack. */
export function buildLevelLimitedLayout(
  props,
  options,
  sliceHeightMap,
  getRatchet,
) {
  // dimensionless whole-segs
  const { segLevels, excludedSegs } = buildSegLevels(
    props.segs,
    options.eventOrderStrict,
    options.maxLevels,
  )

  // dimensionless slicing; more-link occupants materialize in here
  const sliceLevels = convertSegLevelsToWholeSlices(segLevels)
  const hiddenGroups = mergeExtraIntoLevels(
    sliceLevels, // mutated; may gain slices (occupants live on hiddenGroups)
    convertSegsToWholeSlices(excludedSegs), // extras
    options.eventOrderStrict,
    options.eventSlicing,
    options.maxLevels, // numeric dayMaxEvents or dayMaxEventRows
    options.moreLinkLevelTax, // occupant thickness: 0 events-mode, 1 rows-mode
  )

  // Use the same owner-lifetime slice-height ratchet as max-pixel DayGrid.
  // The numeric level limit does not need neededLevelCount, but provisional
  // coordinate resolution still uses the ratcheted largest measured slice.
  const { largestSliceHeight } = getRatchet()
  const provisionalSliceHeight = largestSliceHeight ?? 20
  const getPlanningSliceHeight = (slice) =>
    sliceHeightMap.get(getEventPartKey(slice)) ?? provisionalSliceHeight

  // Resolve immediately from a complete mixture of exact and provisional
  // heights. ResizeObserver reports replace provisional values and naturally
  // reflow the coordinates without blanking the whole row.
  const { sliceCoords } = resolveLevelCoords(
    sliceLevels,
    getPlanningSliceHeight,
  )

  // Timeline departs here. It consumes the shared sliceLevels, hiddenGroups,
  // and sliceCoords above, but projects them onto its continuous horizontal
  // axis and preserves its own time-axis DOM order. The DayGrid-only code below
  // instead federates slices into integer start-column buckets and builds
  // DayGrid event render items.

  // sliceLevels is dimension-independent, thus DOM-stable. It never contains
  // link occupants: those live on hiddenGroups, and views render links from
  // the groups plus visible content bottoms.
  const renderSlices = sliceLevels.flat()
  const slicesByStart = federateSlicesByStart(
    renderSlices,
    props.cells.length,
  )

  return {
    sliceLevels,
    hiddenGroups,
    sliceCoords,
    slicesByStart,
    renderItems: buildSliceRenderItems(
      slicesByStart,
      sliceCoords,
      sliceHeightMap,
    ),
  }
}

/** DayGrid via max pixels: dayMaxEvents or dayMaxEventRows === true. */
export function buildPixelLimitedLayout(
  props,
  options,
  sliceHeightMap,
  canvasHeight,
  getRatchet,
) {
  /*
  Preserve the existing DayGrid startup/ratchet shape. Before measurements,
  estimate the DOM frontier from a 150px event area and 20px event height (eight
  levels). Thereafter, the smallest measured whole-or-partial slice height
  ratchets downward, the largest measured event-area height ratchets upward, and
  neededLevelCount only grows, using the current formula:

    max(previousNeededLevelCount, max(
      1,
      ceil((largestCanvasHeight ?? 150) / (smallestSliceHeight ?? 20)),
    ))

  Keep this ratchet shared across the owner's rows, as it is today.
  largestSliceHeight independently ratchets upward across every positive finite
  whole-or-partial slice report. The sliceHeightMap producer is the single
  write path and updates both slice-height extrema as a side effect of
  insertion, so this invariant holds for every exact height currently in
  sliceHeightMap by construction rather than by call-site ordering:

    exactSliceHeight <= provisionalSliceHeight

  These fallback values estimate how much DOM to mount and provide temporary
  dimensions; they are not recorded as real measurements. Until the row reports
  a real canvasHeight, pixel limiting has no ceiling. Until a rendered slice
  reports its real height, it receives a provisional coordinate and may reflow
  when ResizeObserver supplies the exact value. We accept that an event taller
  than the current provisional maximum may briefly overlap or move neighboring
  events before that report.

  For now these extrema live for the placement owner's full lifetime. A future
  geometry/style epoch will reset them when applicable inputs change. Until that
  exists, we accept that a stale largestSliceHeight can conservatively under-mount
  otherwise valid candidate slices.
  */
  const {
    neededLevelCount,
    smallestSliceHeight,
    largestSliceHeight,
  } = getRatchet(canvasHeight)
  const provisionalSliceHeight = largestSliceHeight ?? 20

  // dimensionless whole-segs
  const { segLevels, excludedSegs } = buildSegLevels(
    props.segs,
    options.eventOrderStrict,
    neededLevelCount,
  )
  const domWholeSliceLevels = convertSegLevelsToWholeSlices(segLevels)

  // buildSegLevels visits props.segs in received event-order and appends rejected
  // segs to excludedSegs as it encounters them. This conversion is also
  // order-preserving, so domExcludedSlices is already in the desired event-order.
  const domExcludedSlices = convertSegsToWholeSlices(excludedSegs)

  // sliceHeightMap is trusted. Its single producer rejects non-positive and
  // non-finite reports, deletes a node's entry when the node unmounts (never
  // ignoreDeletes — that was a resource-timeline virtualization hack), and
  // ratchets the owner extrema at insertion. A present entry is therefore
  // always a valid numeric occupied height; undefined is the only
  // missing-value representation. Consumers intentionally do not revalidate
  // or clamp values supplied by this map.
  const getPlanningSliceHeight = (slice) =>
    sliceHeightMap.get(getEventPartKey(slice)) ?? provisionalSliceHeight

  // Resolve the DOM-frontier wholes exactly once. resolveLevelCoords defaults an
  // undefined canvasHeight to Infinity, so this is unbounded before the canvas
  // reports and bounded afterward.
  const wholeResolution = resolveLevelCoords(
    domWholeSliceLevels,
    getPlanningSliceHeight,
    canvasHeight,
  )
  const placementSliceLevels = wholeResolution.placementSliceLevels
  let sliceCoords = wholeResolution.sliceCoords

  // Before the canvas reports there is no merge pass, but DOM-excluded
  // geometry still globs so more links can materialize from it.
  let hiddenGroups = groupLaterallyIntersecting(domExcludedSlices)

  if (canvasHeight != null) {
    // placementSliceLevels is a filtered copy that preserves original level
    // indexes and slice boundaries, but omits coordinate-excluded wholes.
    const coordExcludedSlices = wholeResolution.excludedSlices

    // Coordinate-excluded and DOM-excluded slices can be interleaved in event
    // order and can overlap laterally. An earlier seg may miss the dimensionless
    // level frontier while a later, narrower seg fits around the existing levels;
    // that later seg can then fail coordinate resolution. Sorting each cohort
    // separately or concatenating them would let the later seg's slicing/tax
    // decisions affect the earlier one first, so restore one global event order.
    const extraSlices = sortByEventOrder(
      coordExcludedSlices.concat(domExcludedSlices),
    )

    // dimension-aware slicing; more-link occupants materialize in here
    hiddenGroups = mergeExtraIntoLevelCoords(
      placementSliceLevels, // mutated; may gain slices (occupants live on hiddenGroups)
      sliceCoords, // mutated alongside topology
      extraSlices, // what to fire
      options.eventOrderStrict,
      options.eventSlicing,
      canvasHeight,

      // occupant PIXEL thickness: the shortest measured slice height. Slices
      // now measure at their own widths, so wrapped text can make one slice
      // unusually tall, and reserving that outlier height (the largest-height
      // proxy the current code uses) would hide ordinary events. More links
      // are reliably shorter than the shortest styled event in practice, so
      // this reserves enough. Occupancy makes measuring real link heights a
      // natural future upgrade, not a prerequisite.
      smallestSliceHeight ?? 20,

      // Deliberately use the ratcheted maximum for EVERY candidate partial,
      // including one with a cached exact measurement. See the function contract:
      // admission must not feed back from an individual slice's mount state.
      provisionalSliceHeight,
    )

    // Newly appended partials also receive provisional heights immediately.
    // Re-resolve the selected topology so every coordinate reflects the same mix
    // of exact and provisional dimensions.
    ;({ sliceCoords } = resolveLevelCoords(
      placementSliceLevels,
      getPlanningSliceHeight,
    ))
  }

  // placementSliceLevels converges through monotonic planning inputs. Its
  // membership need not itself be monotonic: a growing DOM frontier can add
  // wholes, while a growing provisionalSliceHeight can remove partials. The
  // append/repair work depends only on ratcheted extrema, not directly on the
  // current measurement of one slice, so it cannot enter a per-slice
  // measurement/mount feedback loop.
  const renderSlices = compilePixelLimitedRenderSlices(
    domWholeSliceLevels,
    placementSliceLevels,
  )
  const slicesByStart = federateSlicesByStart(
    renderSlices,
    props.cells.length,
  )

  return {
    domWholeSliceLevels,
    placementSliceLevels,
    hiddenGroups,
    sliceCoords,
    slicesByStart,
    renderItems: buildSliceRenderItems(
      slicesByStart,
      sliceCoords,
      sliceHeightMap,
    ),
  }
}

/** Converts slice geometry into the props consumed by each EventSeg wrapper. */
export function buildSliceRenderItems(
  slicesByStart,
  sliceCoords,
  sliceHeightMap,
) {
  return slicesByStart.map((slices) => slices.map((slice) => {
    // Use DayGrid's existing getEventPartKey convention for both the React key
    // and sliceHeightMap key.
    const key = getEventPartKey(slice)
    const levelCoord = sliceCoords.get(key)

    return {
      key,
      slice,
      style: {
        visibility: levelCoord == null ? 'hidden' : '',
        top: levelCoord,
      },
      heightRef: sliceHeightMap.createRef(key),
    }
  }))
}

/** TimeGrid retains dimensionless levels for its pressure-web projection. */
export function buildTimeGridLevelInputs(props, options) {
  const { segLevels, excludedSegs } = buildSegLevels(
    props.segs,
    options.eventOrderStrict,
    options.maxLevels,
  )

  return {
    pressureWebSegLevels: segLevels,
    globbedMoreLinkSegs: excludedSegs,
  }
}

/* Non-obvious utilities. */

/*
Resolves an already-final logical topology into pixel coordinates without
changing any slice's level or boundaries. Each slice receives its earliest
valid coordinate against accepted, intersecting slices in shallower levels.
With a finite maxPixels, a slice that exceeds the bound is excluded immediately
and does not block slices resolved afterward. placementSliceLevels is a filtered
copy of the input: it retains the original outer level indexes (including empty
levels) and contains only accepted slices. With maxPixels=Infinity, it has the
same topology as the input.

getPlanningSliceHeight must return a numeric occupied height for every slice.
This function is link-blind: more-link occupants never appear in its input,
so it needs no occupant handling. The sliceHeightMap producer contract
guarantees that every present value is a valid number and that only undefined
means missing; coordinate consumers do no defensive validation or clamping. Callers supply the exact measured height when
available and a provisional height otherwise, allowing every render to publish
a complete coordinate set. An absent real canvas measurement uses
maxPixels=Infinity; the ratchet's 150px startup estimate must not become a
display ceiling.

Coordinate exclusion is final by policy for the WHOLE slice during this solve.
mergeExtraIntoLevelCoords may append narrower partial slices when eventSlicing
is enabled, but must never retry or append the excluded whole slice. The whole
is absent from placementSliceLevels. The caller retains it as a hidden
measurement donor so it can continue supplying measurements without
participating in later resolution.

Return excludedSlices in traversal order. The caller globally restores event
order across this coordinate-excluded cohort and the DOM-excluded cohort.
*/
export function resolveLevelCoords(
  sliceLevels,
  getPlanningSliceHeight,
  maxPixels = Infinity,
) {
  // implementation pending
}

/*
Dimensionless parameterization of the shared fire-and-collide merge engine.
mergeExtraIntoLevelCoords is the pixel parameterization of the SAME routine;
the two differ only in thickness currency and validity predicate. The engine
revives the pre-refactor SegHierarchy insertion model (fire, collide, peel,
consume) minus zombies, and without the current codebase's slice-plan scoring
search: fragments emerge from collision footprints, not from a searched
optimum, so there is no maxSlices cap and no slice scoring. This can produce
different fragment shapes than the current optimizer; accepted tradeoff.

Extras fire one at a time, in received global event order, at the existing
structure. A fired seg with no valid position within maxLevels has collided
with the placed geometry that blocked it. With eventSlicing enabled, only the
collision footprint hides while the remainders peel away and recursively
re-fire as narrower slices; with it disabled, the whole seg hides and nothing
peels.

Hidden geometry accumulates into glob groups, merged on lateral intersection.
There is no per-column accounting at this layer, for DayGrid or any view;
per-cell counts and popover membership are downstream projections of the
groups.

Each group owns one more-link occupant: collision geometry spanning the
group's lateral range, materialized on the group's first hidden witness and
thereafter only widening or merging as its group grows. Occupants are
engine-internal: they are carried on their groups and act as barriers when
extras fire, but they are never inserted into sliceLevels, so coordinate
resolution and render compilation stay link-blind. An occupant always sits
below every visible slice it laterally intersects (a range footer, which is
what a more link visually is); that placement rule is what makes link-blind
resolution safe, since compaction can only move visible slices away from
occupant space. Occupant thickness is this pass's currency: moreLinkLevelTax
levels (zero for dayMaxEvents, one for dayMaxEventRows). A zero-thickness
occupant charges no level and blocks nothing; it exists to carry the group's
placement site.

An occupant must place. When the limits leave it no valid position, it
consumes the intersecting frontier placements instead of hiding: consumed
placements join the glob, which may widen or merge groups, recursively. With
eventSlicing, a consumed placement may be narrowed to the collision footprint
and its remainders re-fired. Termination: groups and occupant spans grow
monotonically, and consumption strictly removes visible placements.

Preserve complete source coverage: final visible fragments plus hidden glob
fragments are non-overlapping and cover exactly the original sources.
Returns the glob groups, each carrying its occupant.
*/
export function mergeExtraIntoLevels(
  sliceLevels,
  extraSegSlices,
  eventOrderStrict,
  eventSlicing,
  maxLevels,
  moreLinkLevelTax,
) {
  if (!eventSlicing && !moreLinkLevelTax) {
    // Membership cannot change, but hidden geometry still globs.
    return groupLaterallyIntersecting(extraSegSlices)
  }

  // implementation pending
}

/*
Pixel parameterization of the same fire-and-collide engine as
mergeExtraIntoLevels: extras fire with provisional planning thickness and
validate against maxPixels. extraSegSlices arrives in one global event order
across coordinate exclusions and DOM exclusions; preserve that order.

IMPORTANT: use provisionalSliceHeight for EVERY candidate partial during
admission, even when sliceHeightMap already contains that partial's exact
height. Do not replace this scalar with getPlanningSliceHeight. If admission
used an individual partial's measurement, mounting could change its width and
height, which could exclude and unmount it, discard the measurement, readmit it
provisionally, and repeat.

The owner-wide largestSliceHeight ratchets only upward, so candidate membership
cannot enter that measurement/mount feedback loop. This intentionally may
under-admit a short partial because an unrelated slice established a larger
maximum; that is the accepted conservative tradeoff. A new exact report taller
than the current assumption enlarges the ratchet at insertion, before any
later solve reads the map.

Occupant thickness in this currency is moreLinkPixelHeight (see the caller's
proxy note). Occupants consume frontier placements exactly as in the
dimensionless pass; consumed wholes leave placement while the caller retains
every DOM whole as a hidden measurement donor, including wholes consumed here.

The final unrestricted resolveLevelCoords pass may substitute exact heights for
coordinates because the ratchet contract guarantees each exact height is no
larger than the provisional height used for admission. That pass is link-blind,
safely: occupants are range footers, so nothing visible ever sits below one
inside its lateral range, and compaction only moves slices toward shallower
coordinates, away from occupant space. The pass can therefore only compact an
admitted topology; it cannot invalidate its pixel-budget fit or intrude on a
reserved link.

Coordinate-excluded whole slices are absent from placementSliceLevels. Never
fire those wholes again; fire only genuine partial geometry. Preserve exact
visible/hidden source coverage. Returns the glob groups, each carrying its
occupant.
*/
export function mergeExtraIntoLevelCoords(
  sliceLevels,
  sliceCoords,
  extraSegSlices,
  eventOrderStrict,
  eventSlicing,
  maxPixels,
  moreLinkPixelHeight,
  provisionalSliceHeight,
) {
  // implementation pending
}

/*
Builds the flat pixel-limited DayGrid render list without changing placement
topology. Every DOM-frontier whole is emitted exactly once as its source's
permanent measurable node; sliceCoords determines whether that node is visible
or an inert donor. Whole entries in placementSliceLevels are therefore not
emitted again. Only partial placement entries are appended as supplemental,
independently measured nodes.
*/
export function compilePixelLimitedRenderSlices(
  domWholeSliceLevels,
  placementSliceLevels,
) {
  // Render every DOM whole exactly once. placementSliceLevels determines
  // whether its stable key receives a coordinate, but never owns a second DOM
  // node for that whole.
  const renderSlices = domWholeSliceLevels.flat()

  // Partials are not represented by the permanent whole nodes above, so add
  // only placed partials as supplemental, independently measured nodes.
  // placementSliceLevels never contains link occupants; those live on
  // hiddenGroups and are rendered by the view's link layer.
  for (const placementLevel of placementSliceLevels) {
    for (const slice of placementLevel) {
      if (isPartialSlice(slice)) {
        renderSlices.push(slice)
      }
    }
  }

  return renderSlices
}

export function federateSlicesByStart(renderSlices, colCount) {
  const slicesByStart = Array.from({ length: colCount }, () => [])

  for (const slice of renderSlices) {
    slicesByStart[slice.start].push(slice)
  }

  // DayGrid renders each slice in the cell where it starts. Preserve the
  // existing DOM/tab order by restoring event-order within each cell bucket.
  // The comparator also keeps a source's whole measurement seg immediately
  // before its partial slice when both start in the same cell.
  for (const slices of slicesByStart) {
    slices.sort(compareSlicesByEventOrder)
  }

  return slicesByStart
}

export function compareSlicesByEventOrder(a, b) {
  return a.sourceSeg.orderIndex - b.sourceSeg.orderIndex ||
    Number(isPartialSlice(a)) - Number(isPartialSlice(b))
}

export function isPartialSlice(slice) {
  return slice.start !== slice.sourceSeg.start ||
    slice.end !== slice.sourceSeg.end
}

/*
Merges laterally-intersecting hidden slices into glob groups, preserving
received order within each group. Production helper: revive
groupIntersectingSegs from the pre-refactor seg-hierarchy.ts (ec36941a1~1).
*/
export function groupLaterallyIntersecting(hiddenSlices) {
  // implementation pending
}
