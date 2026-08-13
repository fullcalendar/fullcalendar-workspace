/**
 * Day Grid limiting policy
 * ========================
 *
 * This module is the view-specific layer above `layout.ts`. It owns
 * integer-column more counts, per-column pixel/depth taxes, and the localized
 * recursive repair triggered when a column first owes a more link.
 *
 * It deliberately does not own collision geometry or slice scoring. Those
 * operations remain in the common module and are consumed below through the
 * shared bounded slice-plan search.
 */

import {
  type LateralSpan,
  type LayoutLimitResult,
  type Placement,
  type PlacementLayout,
  type PlacementLevel,
  type Slice,
  type SliceCandidateOptions,
  type SliceOptions,
  commitToLevel,
  createBoundedSlicePlan,
  createNarrowerSlice,
  createWholeSlice,
  findBetterPositionWithinLimits,
  findWholePositionWithinLimits,
  findHiddenComplement,
  findLevelIntersections,
  fitsCoordLimits,
  fitsLevelLimits,
  getLateralCellRange,
  partitionPlacements,
  removeFromLevel,
  resolveSliceCandidateOptions,
} from './layout'

/**
 * A limited Day Grid layout plus the more-link counts created by hiding.
 *
 * A nonzero count means that column's more link is active and its configured
 * tax was permanently charged during this pass; there is no separate
 * activation flag.
 */
export interface DayGridLimitResult<EventMeta = unknown>
  extends LayoutLimitResult<EventMeta> {
  /** Number of hidden spans intersecting each Day Grid column. */
  moreLinkCounts: number[]
}

/**
 * The untaxed bounds and per-link taxes for one Day Grid limiting pass.
 *
 * Omitting `maxLevels` limits by pixels only; omitting `levelCoordLimit`
 * limits by logical depth only. An active more link charges `levelTax`
 * logical levels (zero for dayMaxEvents, one for dayMaxEventRows) and
 * `coordTax` pixels (the measured link wrapper height) in its column.
 */
export interface DayGridLimits {
  maxLevels?: number
  levelCoordLimit?: number
  columnCount: number
  /** Segs omitted before measurement; each span contributes one count. */
  initialHiddenSpans: readonly LateralSpan[]
  /** Logical levels an active more link consumes. Default: zero. */
  levelTax?: number
  /** Pixel height an active more link consumes. Default: zero. */
  coordTax?: number
}

/* ------------------------------------------------------------------------
 * Public entry point
 * --------------------------------------------------------------------- */

/**
 * Applies Day Grid's configured level cap and/or measured pixel ceiling with
 * the per-column more-link tax in one pass.
 *
 * Whole placements that fit the initial bounds are pre-admitted exactly as in
 * the corresponding common limiter. Overflowed sources then run in event
 * order through the same one/two/three-slice planner. Any resulting hide is
 * committed before the next overflowed source's turn. A zero-to-one
 * more-count transition immediately and recursively lowers that column's
 * bound and repairs only live placements crossing it.
 */
export function limitDayGridLayout<EventMeta>(
  unrestricted: PlacementLayout<EventMeta>,
  limits: DayGridLimits,
  sliceOptions: SliceOptions,
): DayGridLimitResult<EventMeta> {
  const { maxLevels = Infinity } = limits
  const moreLinkCounts = countHiddenSpansByColumn(
    limits.initialHiddenSpans,
    limits.columnCount,
  )
  const bounds = createColumnBounds(limits, moreLinkCounts)
  const partition = partitionPlacements(unrestricted, (placement) =>
    isPositionWithinLimits(
      bounds,
      placement,
      placement.levelIndex,
      placement.levelEndCoord,
    ))

  return limitOverflowedWithMoreLinkTax({
    levels: partition.levels,
    visiblePlacements: partition.visiblePlacements,
    livePlacements: new Set(partition.visiblePlacements),
    hiddenSlices: [],
    moreLinkCounts,
    bounds,
    // A finite level cap bounds the slice search directly; a pixel-only pass
    // searches the levels the unrestricted layout actually produced.
    levelIndexSearchLimit: Number.isFinite(maxLevels)
      ? maxLevels
      : unrestricted.levels.length,
    candidateOptions: resolveSliceCandidateOptions(sliceOptions),
    eventSlicing: sliceOptions.eventSlicing,
    orderStrict: sliceOptions.orderStrict,
  }, partition.overflowedPlacements)
}

/** Counts each hidden Day Grid span once in every column it intersects. */
export function countHiddenSpansByColumn(
  hiddenSpans: readonly LateralSpan[],
  columnCount: number,
): number[] {
  const counts = Array<number>(columnCount).fill(0)
  for (const span of hiddenSpans) {
    const range = getLateralCellRange(span, columnCount)
    for (let column = range.start; column < range.end; column++) {
      counts[column]++
    }
  }
  return counts
}

/* ------------------------------------------------------------------------
 * Recursive tax-repair implementation
 * --------------------------------------------------------------------- */

/**
 * The per-column display bounds in force at one moment of the pass.
 *
 * Each column ratchets permanently from its untaxed bound to the taxed one
 * when it first owes a more link.
 */
interface ColumnBounds {
  maxLevels: number[]
  coordLimits: number[]
  taxedMaxLevels: number
  taxedCoordLimit: number
}

interface MoreLinkLimitState<EventMeta> {
  levels: PlacementLevel<EventMeta>[]
  /** Current live placements in event insertion order. */
  visiblePlacements: Placement<EventMeta>[]
  /** Membership index for stale-snapshot rechecks during recursive repair. */
  livePlacements: Set<Placement<EventMeta>>
  /** Permanent hides produced by ordinary admission and by tax repair. */
  hiddenSlices: Slice<EventMeta>[]
  moreLinkCounts: number[]
  bounds: ColumnBounds
  levelIndexSearchLimit: number
  candidateOptions: SliceCandidateOptions
  eventSlicing: boolean
  orderStrict: boolean
}

/**
 * Completes one taxed limited layout from its initially overflowed sources.
 *
 * Nothing is rerun: a trigger hide cannot become visible later, every active
 * link retains a hidden witness, and every later overflow plan naturally sees
 * all taxes activated by earlier hides.
 */
function limitOverflowedWithMoreLinkTax<EventMeta>(
  state: MoreLinkLimitState<EventMeta>,
  overflowedPlacements: readonly Placement<EventMeta>[],
): DayGridLimitResult<EventMeta> {
  for (const placement of overflowedPlacements) {
    const source = createWholeSlice(placement.sourceSeg)

    const admitted = admitWholeWithinLimits(state, source, placement.thickness)
    if (admitted) {
      state.visiblePlacements.push(admitted)
      continue
    }

    const slicePlan = state.eventSlicing
      ? createColumnSlicePlan(state, source, placement.thickness)
      : null
    if (!slicePlan) {
      recordHiddenForMoreLink(state, source)
      continue
    }

    for (const slice of slicePlan.slices) {
      const slicePlacement = commitToLevel(
        state.levels,
        slice,
        slicePlan.levelIndex,
        slicePlan.levelCoord,
        placement.thickness,
      )
      state.visiblePlacements.push(slicePlacement)
      state.livePlacements.add(slicePlacement)
    }

    // The plan's visible pieces commit first. Day Grid's column-aligned cuts
    // keep them disjoint from their hidden complement, whose tax can now
    // repair earlier overflows before the next source begins.
    for (const hiddenSlice of findHiddenComplement(source, slicePlan.slices)) {
      recordHiddenForMoreLink(state, hiddenSlice)
    }
  }

  return {
    levels: state.levels,
    visiblePlacements: state.visiblePlacements,
    hiddenSlices: state.hiddenSlices,
    moreLinkCounts: state.moreLinkCounts,
  }
}

/**
 * Permanently records one hidden slice, then lowers and repairs every column
 * whose count changes from zero to one.
 *
 * Counts for the complete span are updated before any repair begins. Thus a
 * wide whole-event hide has one coherent count state even though its newly
 * owing columns are repaired depth-first from left to right. That ordering is
 * also what bounds the recursion: counts only ever rise, so each column
 * crosses zero exactly once and is therefore activated at most once.
 */
function recordHiddenForMoreLink<EventMeta>(
  state: MoreLinkLimitState<EventMeta>,
  hiddenSlice: Slice<EventMeta>,
): void {
  state.hiddenSlices.push(hiddenSlice)
  const newlyOwingColumns: number[] = []
  const columnRange = getLateralCellRange(
    hiddenSlice,
    state.moreLinkCounts.length,
  )

  for (let column = columnRange.start; column < columnRange.end; column++) {
    if (state.moreLinkCounts[column] === 0) {
      newlyOwingColumns.push(column)
    }
    state.moreLinkCounts[column]++
  }

  for (const column of newlyOwingColumns) {
    state.bounds.maxLevels[column] = state.bounds.taxedMaxLevels
    state.bounds.coordLimits[column] = state.bounds.taxedCoordLimit
    repairTaxedColumn(state, column)
  }
}

/**
 * Finds newly overflowed placements through each level's binary-searchable
 * lateral index.
 *
 * The list is a snapshot because repairing one entry can recursively hide an
 * entry scheduled later. The live/bounds recheck makes such stale snapshot
 * entries harmless while keeping the recursive control flow straightforward.
 */
function repairTaxedColumn<EventMeta>(
  state: MoreLinkLimitState<EventMeta>,
  column: number,
): void {
  const columnSpan = { start: column, end: column + 1 }
  const newlyOverflowed: Placement<EventMeta>[] = []

  for (const level of state.levels) {
    for (const placement of findLevelIntersections(level, columnSpan)) {
      if (doesPlacementOverflowColumn(state, placement, column)) {
        newlyOverflowed.push(placement)
      }
    }
  }
  for (const placement of newlyOverflowed) {
    if (
      !state.livePlacements.has(placement) ||
      !doesPlacementOverflowColumn(state, placement, column)
    ) continue
    repairPlacementForTax(state, placement, column)
  }
}

/**
 * Removes one overflowed placement and applies the agreed slicing policy.
 *
 * With slicing disabled, the complete source gets one whole-position retry;
 * only a source that still cannot satisfy the lowered bounds becomes hidden
 * and recursively activates every column it spans. With slicing enabled, only
 * the taxed-column intersection is hidden. Outside remainders first try to
 * compact through the shared whole-placement search; their old coordinates
 * are a guaranteed fallback because narrowing cannot introduce a collision
 * and those columns' bounds did not change in this repair.
 *
 * Tax-created remainders are mandatory repair geometry. They are deliberately
 * exempt from the ordinary three-slice maximum and may compact independently
 * to different `(levelIndex, levelCoord)` positions.
 */
function repairPlacementForTax<EventMeta>(
  state: MoreLinkLimitState<EventMeta>,
  placement: Placement<EventMeta>,
  column: number,
): void {
  const visibleIndex = state.visiblePlacements.indexOf(placement)
  removeFromLevel(state.levels, placement)
  state.livePlacements.delete(placement)
  state.visiblePlacements.splice(visibleIndex, 1)

  if (!state.eventSlicing) {
    const source = createWholeSlice(placement.sourceSeg)
    const retained = admitWholeWithinLimits(state, source, placement.thickness)
    if (retained) {
      state.visiblePlacements.splice(visibleIndex, 0, retained)
    } else {
      recordHiddenForMoreLink(state, source)
    }
    return
  }

  const hiddenStart = Math.max(placement.start, column)
  const hiddenEnd = Math.min(placement.end, column + 1)
  const remainders: Slice<EventMeta>[] = []
  if (placement.start < hiddenStart) {
    remainders.push(createNarrowerSlice(
      placement,
      placement.start,
      hiddenStart,
    ))
  }
  if (hiddenEnd < placement.end) {
    remainders.push(createNarrowerSlice(
      placement,
      hiddenEnd,
      placement.end,
    ))
  }

  const retainedRemainders = remainders.map((remainder) => {
    const better = findBetterPositionWithinLimits(
      state.levels,
      remainder,
      placement,
      state.orderStrict,
      (candidate) => isPositionWithinLimits(
        state.bounds,
        remainder,
        candidate.levelIndex,
        candidate.levelCoord + placement.thickness,
      ),
    )
    const retained = commitToLevel(
      state.levels,
      remainder,
      better?.levelIndex ?? placement.levelIndex,
      better?.levelCoord ?? placement.levelCoord,
      placement.thickness,
    )
    state.livePlacements.add(retained)
    return retained
  })
  state.visiblePlacements.splice(visibleIndex, 0, ...retainedRemainders)

  recordHiddenForMoreLink(
    state,
    createNarrowerSlice(placement, hiddenStart, hiddenEnd),
  )
}

/**
 * Commits one whole slice at its ordinary best position, but only when that
 * position satisfies the column bounds in force right now.
 *
 * Both the initial overflow loop and tax repair reach for this before falling
 * back to slicing or hiding: a source that still fits whole should stay whole.
 * The caller owns where the result lands in `visiblePlacements`, since
 * admission appends while repair reinserts at the removed placement's index.
 */
function admitWholeWithinLimits<EventMeta>(
  state: MoreLinkLimitState<EventMeta>,
  source: Slice<EventMeta>,
  thickness: number,
): Placement<EventMeta> | null {
  const candidate = findWholePositionWithinLimits(
    state.levels,
    source,
    thickness,
    state.orderStrict,
    (candidate) => isPositionWithinLimits(
      state.bounds,
      source,
      candidate.levelIndex,
      candidate.levelCoord + thickness,
    ),
  )
  if (!candidate) return null

  const placement = commitToLevel(
    state.levels,
    source,
    candidate.levelIndex,
    candidate.levelCoord,
    thickness,
  )
  state.livePlacements.add(placement)
  return placement
}

/** Plans ordinary one/two/three-slice salvage for a rejected whole slice. */
function createColumnSlicePlan<EventMeta>(
  state: MoreLinkLimitState<EventMeta>,
  wholeSlice: Slice<EventMeta>,
  thickness: number,
) {
  return createBoundedSlicePlan(
    wholeSlice,
    thickness,
    state.levels,
    state.levelIndexSearchLimit,
    {
      levelLimits: state.bounds.maxLevels,
      coordLimits: state.bounds.coordLimits,
    },
    state.candidateOptions,
  )
}

/**
 * Seeds each column at its untaxed bound, or at its taxed one when the column
 * already owes a link for geometry hidden before this pass began.
 */
function createColumnBounds(
  limits: DayGridLimits,
  moreLinkCounts: readonly number[],
): ColumnBounds {
  const {
    maxLevels = Infinity,
    levelCoordLimit = Infinity,
    levelTax = 0,
    coordTax = 0,
  } = limits
  const taxedMaxLevels = Math.max(0, maxLevels - levelTax)
  const taxedCoordLimit = Math.max(0, levelCoordLimit - coordTax)

  return {
    maxLevels: moreLinkCounts.map((count) =>
      count > 0 ? taxedMaxLevels : Math.max(0, maxLevels),
    ),
    coordLimits: moreLinkCounts.map((count) =>
      count > 0 ? taxedCoordLimit : Math.max(0, levelCoordLimit),
    ),
    taxedMaxLevels,
    taxedCoordLimit,
  }
}

/**
 * Tests one proposed position against the column bounds in force right now, by
 * its level index and its far edge rather than its origin.
 */
function isPositionWithinLimits(
  bounds: ColumnBounds,
  span: LateralSpan,
  levelIndex: number,
  levelEndCoord: number,
): boolean {
  return fitsLevelLimits(span, levelIndex, bounds.maxLevels) &&
    fitsCoordLimits(span, levelEndCoord, bounds.coordLimits)
}

/** Narrows the same bound test to one intersecting live placement's column. */
function doesPlacementOverflowColumn<EventMeta>(
  state: MoreLinkLimitState<EventMeta>,
  placement: Placement<EventMeta>,
  column: number,
): boolean {
  return !isPositionWithinLimits(
    state.bounds,
    { start: column, end: column + 1 },
    placement.levelIndex,
    placement.levelEndCoord,
  )
}
