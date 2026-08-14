/**
 * Common level + coordinate placement utilities
 * =============================================
 *
 * This is the view-independent placement layer. It contains the geometry,
 * level indexing, unrestricted placement, and generic limiting primitives
 * shared by Day Grid, TimeGrid, and Timeline.
 *
 * Current scope
 * -------------
 *
 * Included here:
 *
 * - An unrestricted placement pass that builds both representations at once:
 *   dimensionless level indices and measured pixel level coordinates.
 * - Per-level lateral ordering and level-coordinate extent summaries.
 * - Optional strict event ordering.
 * - A level-only limiting/slicing pass used to decide which original seg
 *   elements are plausible DOM candidates before their real thicknesses exist.
 * - Up to three slices at one shared `(levelIndex, levelCoord)` position,
 *   scored with the agreed 0% / 15% / 30% slice penalty.
 * - Explicit hidden-span output.
 *
 * Deferred on purpose:
 *
 * - Unknown-thickness guesses inside real measured placement.
 * - ResizeObserver / React lifecycle integration.
 *
 * Day Grid's more-link policy lives in `daygrid.ts`; Timeline's post-limit
 * group projection lives in `timeline.ts`; TimeGrid's pressure expansion lives
 * in `timegrid.ts`. Production-specific DOM ownership and measurement remain
 * the responsibility of later view adapters.
 *
 * Naming convention
 * -----------------
 *
 * Four words carry fixed meanings throughout this layer, and every derived
 * name follows from them:
 *
 * - A `SourceSeg` is one whole seg exactly as the view supplied it. It
 *   is the unit of measured thickness, of DOM identity, and of event rank, and
 *   every slice names the one it was cut from as `sourceSeg`. Anything a
 *   slice needs to know about its event — its thickness, its identity, its
 *   place in the caller's order — is read from there rather than copied, so a
 *   later pass holding a subset of the segs cannot restate any of it
 *   differently.
 * - A `Slice` is lateral geometry only: a whole source seg or one lateral
 *   piece of one, with no level-axis coordinates at all.
 * - A `Placement` is a slice that has been committed to a level-axis position.
 *   Whether it is whole or partial is a separate question, answered by
 *   `doesSliceCoverWholeSource`.
 * - A *position* is the bare `(levelIndex, levelCoord)` pair a placement
 *   occupies, never the thing occupying it. `LevelPosition`, `PositionBounds`,
 *   and `isPositionWithinLimits` all use the word this way.
 *
 * A collection is therefore named for which of these it holds:
 * `visiblePlacements` carry coordinates, `hiddenSlices` do not. Where a
 * function needs only source-seg identity or lateral geometry, its
 * parameters are typed `Slice` even though callers usually hand it placements.
 *
 * Thickness convention
 * -----------------
 *
 * A reported seg thickness is already its complete occupied block size. A
 * DOM wrapper is responsible for measuring the event plus any margin/spacing
 * that follows it. Placement therefore has no separate `gap` constant and no
 * gap arithmetic: the next event may begin directly at `levelCoord + thickness`.
 *
 * Lateral precision convention
 * ----------------------------
 *
 * Overlap is decided by a strict `<` comparison with no tolerance, and callers
 * pass their projected coordinates in untouched. No rounding or quantization
 * happens on either side of this boundary, matching how production behaved
 * before this engine existed.
 *
 * Placement therefore reacts to exactly what a caller projects, down to the
 * last bit: an overlap of any width costs a whole level. Callers wanting
 * adjacent events to share a level must produce coordinates that are actually
 * equal — this engine will not round them together.
 *
 * This is unrelated to `getLateralCellRange`, which snaps a span outward to
 * every whole lateral cell it touches so per-cell limits and counts can be
 * attributed to cells. That rounding serves accounting after placement.
 */

export interface LateralSpan {
  /** Inclusive coordinate on the view's lateral axis. */
  start: number
  /** Exclusive coordinate on the view's lateral axis. */
  end: number
}

/**
 * One whole seg supplied by a view, carrying its resolved event rank.
 *
 * Day Grid will normally use integer lateral coordinates. Timeline may use a
 * continuous lateral coordinate system. Placement does not distinguish them,
 * so a continuous-axis view must satisfy the lateral precision convention in
 * this module's header before building these coordinates.
 */
export interface SourceSeg<EventMeta = unknown> extends LateralSpan {
  /** Stable identity used by the thickness map and DOM-candidate output. */
  key: string
  /** Opaque view/application data that placement never examines. */
  meta: EventMeta
  /** Whether `start` is the event's real start rather than a view cut. */
  isStart: boolean
  /** Whether `end` is the event's real end rather than a view cut. */
  isEnd: boolean
  /**
   * Rank in the caller's resolved event order, minted once by whichever
   * producer resolved that order — normally as the loop index that emits the
   * seg array.
   *
   * It lives on the source rather than being derived from a seg array's
   * position because later passes see filtered subsets: a measured pass
   * positions only the segs that mounted, while lists it is merged with
   * still describe the ones that did not. Ranks derived from those two arrays
   * would silently disagree about who is first. Carrying the rank makes every
   * pass speak one order, and leaves no second base for a consumer to compare
   * against.
   */
  orderIndex: number
}

/**
 * A whole seg or one of its slices.
 *
 * Every slice retains `sourceSeg`, which is where both its event rank and
 * its measured thickness are read from: `sourceSeg.orderIndex` orders it
 * against every other slice, and `sourceSeg.key` looks up the whole
 * seg's thickness. A slice never receives either of its own.
 */
export interface Slice<EventMeta = unknown> extends LateralSpan {
  /** The whole unsliced seg this slice was derived from. */
  sourceSeg: SourceSeg<EventMeta>
  /** True only when this slice still contains the event's real start. */
  isStart: boolean
  /** True only when this slice still contains the event's real end. */
  isEnd: boolean
}

/**
 * A slice committed to both a logical level and a level-axis coordinate.
 *
 * A placement is whole or partial exactly as its underlying slice is; the two
 * words describe different axes and this type says nothing about that one.
 *
 * The coordinate fields carry whichever currency the layout they belong to was
 * built in; only `levelIndex` is unconditionally dimensionless. Measured Day
 * Grid and Timeline layouts are in pixels. Layouts from
 * `positionSegsWithUnitThickness` are in dimensionless units, where every
 * `thickness` is `1` and `levelCoord === levelIndex`. TimeGrid's final
 * projection is in fractions of a normalized 0...1 canvas. A consumer must
 * therefore take its currency from the producing layout, never from these
 * field names.
 */
export interface Placement<EventMeta = unknown> extends Slice<EventMeta> {
  /** Zero-based dimensionless level. */
  levelIndex: number
  /** Level-axis coordinate at which the slice begins, in the layout's currency. */
  levelCoord: number
  /**
   * Complete occupied thickness of `sourceSeg` in the layout's currency,
   * including wrapper-managed margins/spacing where those were measured, and
   * including when this placement covers only part of its source seg.
   */
  thickness: number
  /** `levelCoord + thickness`: the complete occupied level-axis end. */
  levelEndCoord: number
}

/**
 * A logical level is laterally searchable because its entries are sorted by
 * `start` and are pairwise non-overlapping.
 */
export type PlacementLevel<EventMeta = unknown> = Placement<EventMeta>[]

export interface PlacementLayout<EventMeta = unknown> {
  levels: PlacementLevel<EventMeta>[]
  /**
   * The same placements the levels hold, flattened. `positionSegs` emits
   * exactly one whole placement per input here, in the caller-resolved event
   * order of the input array; a layout assembled from an already-limited
   * result may hold partial slices instead.
   */
  placements: Placement<EventMeta>[]
}

/**
 * The only measurement input to unrestricted placement. Each value is the
 * source wrapper's complete occupied thickness, not merely its visible border.
 */
export type SegThicknessMap = ReadonlyMap<string, number>

/** Shared estimate for an event wrapper that has not reported a thickness. */
export const DEFAULT_UNMEASURED_EVENT_THICKNESS = 20

/** Shared estimate for a more-link wrapper that has not reported a thickness. */
export const DEFAULT_UNMEASURED_MORE_LINK_THICKNESS = 20

export const GEOMETRY_TOLERANCE = 0.000_001

/* ========================================================================
 * Unrestricted placement
 * ===================================================================== */

/**
 * Whether every source has reported a thickness, and measured placement may
 * therefore run.
 *
 * This is `positionSegs`'s precondition, stated where that function states its
 * measurement contract. A measured view's wrappers report asynchronously, so
 * every such view renders at least once with an incomplete map and needs to
 * ask this before positioning anything.
 */
export function areSegThicknessesSettled<EventMeta>(
  sourceSegs: readonly SourceSeg<EventMeta>[],
  thicknesses: SegThicknessMap,
): boolean {
  return sourceSegs.every((source) => thicknesses.get(source.key) != null)
}

/**
 * Builds the unrestricted cornerstone structure.
 *
 * The caller owns `eventOrder`: the array is already sorted exactly as the
 * view wants, and every seg already carries that resolved rank as its own
 * `orderIndex`. This function reads that rank without re-deriving one, and
 * returns `placements` in the input array's order. `orderStrict` decides
 * whether the rank is merely an insertion preference or a geometric invariant.
 */
export function positionSegs<EventMeta>(
  eventOrderedSegs: readonly SourceSeg<EventMeta>[],
  thicknesses: SegThicknessMap,
  orderStrict: boolean,
): PlacementLayout<EventMeta> {
  const levels: PlacementLevel<EventMeta>[] = []
  const placements: Placement<EventMeta>[] = []

  for (const source of eventOrderedSegs) {
    // Guaranteed by `areSegThicknessesSettled`, which every measured caller
    // asks before reaching this point.
    const thickness = thicknesses.get(source.key)!

    const slice = createWholeSlice(source)
    // The forward pass only ever collides with earlier-order placements, so
    // the maximum fence never binds and a position always exists.
    const candidate = findGeometricPosition(
      levels,
      slice,
      thickness,
      orderStrict,
    )!
    placements.push(commitToLevel(
      levels,
      slice,
      candidate.levelIndex,
      candidate.levelCoord,
      thickness,
    ))
  }

  return {
    levels,
    placements,
  }
}

/**
 * Builds the same unrestricted structure with dimensionless unit thicknesses.
 *
 * DOM admission probes and TimeGrid both need this representation. Keeping
 * the synthetic thickness-map construction here prevents those consumers from
 * independently encoding what a "unit" placement means.
 */
export function positionSegsWithUnitThickness<EventMeta>(
  eventOrderedSegs: readonly SourceSeg<EventMeta>[],
  orderStrict: boolean,
): PlacementLayout<EventMeta> {
  return positionSegs(
    eventOrderedSegs,
    new Map(eventOrderedSegs.map((seg) => [seg.key, 1])),
    orderStrict,
  )
}

/** The bare level-axis position a placement occupies, without the slice. */
export interface LevelPosition {
  levelIndex: number
  levelCoord: number
}

/**
 * Runs the ordinary whole-slice placement search, returning its result only
 * when the caller's display limits admit it. There is nothing to fall back to:
 * the search returns the smallest position admissible under strict-order
 * fencing, or none at all, so a rejection means no whole position exists
 * within those limits.
 */
export function findWholePositionWithinLimits<EventMeta>(
  levels: readonly PlacementLevel<EventMeta>[],
  slice: Slice<EventMeta>,
  thickness: number,
  orderStrict: boolean,
  isPositionWithinLimits: (candidate: LevelPosition) => boolean,
): LevelPosition | null {
  const candidate = findGeometricPosition(
    levels,
    slice,
    thickness,
    orderStrict,
  )
  return candidate && isPositionWithinLimits(candidate) ? candidate : null
}

/**
 * Reuses the ordinary whole-slice placement search for optional tax-repair
 * compaction. A candidate must satisfy the caller's display limits and reduce
 * the slice's proven-safe former position. Otherwise repair leaves the
 * narrowed slice exactly where it was.
 */
export function findBetterPositionWithinLimits<EventMeta>(
  levels: readonly PlacementLevel<EventMeta>[],
  slice: Slice<EventMeta>,
  previous: Placement<EventMeta>,
  orderStrict: boolean,
  isPositionWithinLimits: (candidate: LevelPosition) => boolean,
): LevelPosition | null {
  const candidate = findWholePositionWithinLimits(
    levels,
    slice,
    previous.thickness,
    orderStrict,
    isPositionWithinLimits,
  )
  if (!candidate) return null

  const doesNotIncreasePosition =
    candidate.levelIndex <= previous.levelIndex &&
    candidate.levelCoord <= previous.levelCoord + GEOMETRY_TOLERANCE
  const reducesPosition = doesNotIncreasePosition && (
    candidate.levelCoord < previous.levelCoord - GEOMETRY_TOLERANCE ||
    candidate.levelIndex < previous.levelIndex
  )
  return reducesPosition ? candidate : null
}

/**
 * Finds the first admissible level index and its smallest level coordinate.
 *
 * Lateral colliders and strict-order fences do not depend on the target
 * level, so they are gathered once up front. For target level `i`:
 *
 * - The slice may not overlap anything already at level index `i`.
 * - Its `levelCoord` is the largest `levelEndCoord` among colliders at
 *   smaller level indices (a running maximum as `i` ascends).
 * - Its `levelEndCoord` must not pass the smallest `levelCoord` among
 *   colliders at larger level indices (a precomputed suffix minimum).
 * - Strict ordering adds minimum and maximum order-index fences.
 *
 * Level indices are tried in ascending order. The minimum level coordinate can
 * only stay equal or increase as indices are added, so the first admitted
 * index also has the smallest admitted coordinate under these invariants.
 *
 * Returns null when no admissible position exists: appending a new deepest
 * level is always geometrically free, but under strict ordering it sits below
 * every existing level, so a maximum fence from a later-order collider rules
 * it out along with every fenced existing index.
 */
function findGeometricPosition<EventMeta>(
  levels: readonly PlacementLevel<EventMeta>[],
  slice: Slice<EventMeta>,
  thickness: number,
  orderStrict: boolean,
): LevelPosition | null {
  const collidersByLevel = levels.map((level) =>
    findLevelIntersections(level, slice),
  )

  // The forward unrestricted pass only ever sees earlier-order colliders, so
  // only the minimum fence binds there. Reinsertion after per-cell limiting
  // also sees later-order ones: a wide source can overflow on one restrictive
  // cell while a deeper, later collider survives in a more generous cell
  // further along that span. The minimum fence keeps this slice below every
  // earlier collider; the maximum keeps it above every later one.
  const orderIndex = slice.sourceSeg.orderIndex
  let strictMinLevelIndex = 0
  let strictMaxLevelIndexExclusive = Infinity
  if (orderStrict) {
    for (const colliders of collidersByLevel) {
      for (const other of colliders) {
        if (other.sourceSeg.orderIndex < orderIndex) {
          strictMinLevelIndex = Math.max(
            strictMinLevelIndex,
            other.levelIndex + 1,
          )
        } else if (other.sourceSeg.orderIndex > orderIndex) {
          strictMaxLevelIndexExclusive = Math.min(
            strictMaxLevelIndexExclusive,
            other.levelIndex,
          )
        }
      }
    }
  }

  // ceilings[i]: the smallest collider levelCoord at any level deeper than i.
  const ceilings: number[] = []
  let ceiling = Infinity
  for (let levelIndex = levels.length - 1; levelIndex >= 0; levelIndex--) {
    ceilings[levelIndex] = ceiling
    for (const other of collidersByLevel[levelIndex]) {
      ceiling = Math.min(ceiling, other.levelCoord)
    }
  }

  let minLevelCoord = 0
  for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
    if (
      !collidersByLevel[levelIndex].length &&
      levelIndex >= strictMinLevelIndex &&
      levelIndex < strictMaxLevelIndexExclusive &&
      minLevelCoord + thickness <= ceilings[levelIndex] + GEOMETRY_TOLERANCE
    ) {
      return { levelIndex, levelCoord: minLevelCoord }
    }
    for (const other of collidersByLevel[levelIndex]) {
      minLevelCoord = Math.max(minLevelCoord, other.levelEndCoord)
    }
  }

  // A newly appended largest index violates a maximum fence when reinsertion
  // after per-cell limiting left the fence window empty: a later-order
  // collider already sits at or above every remaining index, and placing this
  // slice below it would invert the strict order.
  if (levels.length >= strictMaxLevelIndexExclusive) return null

  // A forward unrestricted pass always admits a newly appended largest index. By
  // now minLevelCoord is the largest levelEndCoord among all lateral colliders.
  return { levelIndex: levels.length, levelCoord: minLevelCoord }
}

export function createWholeSlice<EventMeta>(
  sourceSeg: SourceSeg<EventMeta>,
): Slice<EventMeta> {
  return {
    sourceSeg,
    start: sourceSeg.start,
    end: sourceSeg.end,
    isStart: sourceSeg.isStart,
    isEnd: sourceSeg.isEnd,
  }
}

/**
 * Cuts a slice while preserving only real event boundaries. A child keeps
 * `isStart` or `isEnd` when it still reaches the corresponding parent edge;
 * every newly introduced cut edge clears the flag on that side.
 */
export function createNarrowerSlice<EventMeta>(
  parent: Slice<EventMeta>,
  start: number,
  end: number,
): Slice<EventMeta> {
  return {
    sourceSeg: parent.sourceSeg,
    start,
    end,
    isStart: parent.isStart && start === parent.start,
    isEnd: parent.isEnd && end === parent.end,
  }
}

/**
 * Reports all lateral intersections in one level.
 *
 * Binary search reaches the first possible match. Because entries inside a
 * level never overlap one another, only one predecessor can reach across the
 * query's start. The forward scan stops as soon as starts reach `span.end`.
 */
export function findLevelIntersections<EventMeta>(
  level: PlacementLevel<EventMeta>,
  span: LateralSpan,
): Placement<EventMeta>[] {
  let index = findLowerBoundByStart(level, span.start)
  if (index > 0) index--

  const matches: Placement<EventMeta>[] = []
  for (; index < level.length; index++) {
    const entry = level[index]
    if (entry.start >= span.end) break
    if (doSpansOverlap(entry, span)) matches.push(entry)
  }
  return matches
}

/**
 * Commits an already-admitted slice while preserving the level invariant.
 * Mutation is kept in this small primitive so a later implementation can
 * replace array insertion without changing the placement policy.
 */
export function commitToLevel<EventMeta>(
  levels: PlacementLevel<EventMeta>[],
  slice: Slice<EventMeta>,
  levelIndex: number,
  levelCoord: number,
  thickness: number,
): Placement<EventMeta> {
  while (levels.length <= levelIndex) levels.push([])
  const level = levels[levelIndex]

  const placement: Placement<EventMeta> = {
    ...slice,
    levelIndex,
    levelCoord,
    thickness,
    levelEndCoord: levelCoord + thickness,
  }

  level.splice(findLowerBoundByStart(level, slice.start), 0, placement)
  return placement
}

/**
 * Removes one exact placement from its sorted level.
 *
 * The binary search reaches entries sharing its start coordinate, after which
 * identity selects the exact object.
 */
export function removeFromLevel<EventMeta>(
  levels: PlacementLevel<EventMeta>[],
  placement: Placement<EventMeta>,
): void {
  const level = levels[placement.levelIndex]
  let index = findLowerBoundByStart(level, placement.start)
  while (index < level.length && level[index].start === placement.start) {
    if (level[index] === placement) {
      level.splice(index, 1)
      return
    }
    index++
  }
}

/**
 * Binary-searches for the first entry whose `start` is not less than the
 * requested coordinate.
 */
function findLowerBoundByStart<EventMeta>(
  entries: readonly Placement<EventMeta>[],
  start: number,
): number {
  let low = 0
  let high = entries.length
  while (low < high) {
    const middle = (low + high) >>> 1
    if (entries[middle].start < start) low = middle + 1
    else high = middle
  }
  return low
}

/* ========================================================================
 * Level limiting and DOM-candidate projection
 * ===================================================================== */

/** The selected way to display slices for one source seg. */
export interface SlicePlan<EventMeta = unknown> {
  /** Every selected slice shares this dimensionless position. */
  levelIndex: number
  /** Unit-thickness planning uses `levelCoord === levelIndex`. */
  levelCoord: number
  slices: Slice<EventMeta>[]
  /** Total lateral length selected for visibility. */
  visibleLength: number
  /** `visibleLength / sourceLength - 0.15 * (sliceCount - 1)`. */
  score: number
}

/** View-neutral result of restricting a layout by logical level count. */
export interface LayoutLimitResult<EventMeta = unknown> {
  /** The surviving level structure after whole placements and slices commit. */
  levels: PlacementLevel<EventMeta>[]
  /** Visible placements, whole or partial. */
  visiblePlacements: Placement<EventMeta>[]
  /**
   * Includes infeasible and deliberately suppressed feasible ranges. Hidden
   * geometry never reaches a level, so these carry no coordinates.
   */
  hiddenSlices: Slice<EventMeta>[]
}

/** One maximal intersecting region formed from hidden source geometry. */
export interface HiddenSliceGroup<EventMeta = unknown> extends LateralSpan {
  /** Stable identity anchored to one of the group's source segs. */
  key: string
  /** Distinct original sources represented by the hidden geometry. */
  count: number
  /** Hidden slices restored to caller/event order. */
  hiddenSlices: Slice<EventMeta>[]
}

/** A max-level probe plus the original source wrappers it admits to the DOM. */
export interface DomCandidatePlan<EventMeta = unknown>
  extends LayoutLimitResult<EventMeta> {
  /**
   * The admitted whole sources, in resolved event order. This records which
   * sources mount, not the order their nodes appear in: a view that owns a
   * continuous axis re-emits the same set in its own DOM order.
   */
  mountedSegs: SourceSeg<EventMeta>[]
}

export interface SliceOptions {
  orderStrict: boolean
  eventSlicing: boolean
  maxSlices: 1 | 2 | 3
  /** Agreed cost per additional visible slice. Default: 15%. */
  slicePenalty?: number
  /** Lateral slivers below this length are not plausible visible slices. */
  minSliceLength?: number
}

/** Fully resolved inputs needed by the fixed-position slice scorer. */
export type SliceCandidateOptions = Required<Omit<SliceOptions, 'eventSlicing'>>

/* ------------------------------------------------------------------------
 * Public entry points
 *
 * These common limiters know nothing about DOM ownership or more links. The
 * View adapters consume the max-level result, while the Day Grid module reuses
 * the exported retain/fit/plan primitives below.
 * --------------------------------------------------------------------- */

/**
 * Makes an initial DOM decision before real event thicknesses are available.
 *
 * Giving every source thickness 1 produces an initial layout without needing
 * real dimensions. Sources with any visible whole or sliced placement are
 * admitted to the DOM so a later component phase can measure them.
 */
export function planDomCandidatesByMaxLevel<EventMeta>(
  eventOrderedSegs: readonly SourceSeg<EventMeta>[],
  maxLevels: number,
  sliceOptions: SliceOptions,
): DomCandidatePlan<EventMeta> {
  const unrestricted = positionSegsWithUnitThickness(
    eventOrderedSegs,
    sliceOptions.orderStrict,
  )
  const limited = limitLayoutByMaxLevel(
    unrestricted,
    maxLevels,
    sliceOptions,
  )
  return {
    ...limited,
    // Admit the original segs that must be measured. Dimension-aware
    // slicing happens later, so these provisional slices are not DOM candidates.
    mountedSegs: selectVisibleSourceSegs(
      unrestricted.placements,
      limited.visiblePlacements,
    ),
  }
}

/**
 * Restricts an already-positioned layout by logical level count.
 *
 * This function has no DOM concepts. It applies no pixel budget and no
 * more-link tax. Whole placements below the level cap remain. Each placement
 * above the cap is considered in original order and first tries to compact as
 * a whole into the retained structure. Only a source that cannot fit whole is
 * governed by `eventSlicing`: it either contributes the selected partial
 * one-position slice plan or remains wholly hidden.
 *
 * DOM planning calls this with a unit-thickness layout; measured Timeline rows
 * call it with their real geometry. Both use the same candidate-position search.
 */
export function limitLayoutByMaxLevel<EventMeta>(
  unrestricted: PlacementLayout<EventMeta>,
  maxLevels: number,
  options: SliceOptions,
): LayoutLimitResult<EventMeta> {
  const candidateOptions = resolveSliceCandidateOptions(options)
  return limitOverflowedPlacements(
    unrestricted,
    options,
    (_span, levelIndex) => levelIndex < maxLevels,
    // The uniform level cap is the slice search's own limit, so no further
    // per-cell bound is needed.
    (wholeSlice, thickness, levels) => createBoundedSlicePlan(
      wholeSlice,
      thickness,
      levels,
      maxLevels,
      {},
      candidateOptions,
    ),
  )
}

/**
 * Forms maximal unions of genuinely intersecting hidden slices.
 *
 * Exact adjacency does not merge: `[0, 1]` and `[1, 2]` remain separate
 * groups. Both Timeline and TimeGrid use this behavior. The lateral sort
 * discovers transitive interval unions; each result's slices are then
 * restored to event order because a more link's popover renders its hidden
 * event DOM directly from that list.
 */
export function groupHiddenSlices<EventMeta>(
  hiddenSlices: readonly Slice<EventMeta>[],
): HiddenSliceGroup<EventMeta>[] {
  interface WorkingGroup extends LateralSpan {
    sourceKeys: Set<string>
    hiddenSlices: Slice<EventMeta>[]
  }

  const sorted = [...hiddenSlices].sort((a, b) =>
    a.start - b.start ||
    a.end - b.end ||
    a.sourceSeg.orderIndex - b.sourceSeg.orderIndex,
  )
  const groups: WorkingGroup[] = []

  for (const hiddenSlice of sorted) {
    const last = groups[groups.length - 1]
    if (last && hiddenSlice.start < last.end) {
      last.end = Math.max(last.end, hiddenSlice.end)
      last.sourceKeys.add(hiddenSlice.sourceSeg.key)
      last.hiddenSlices.push(hiddenSlice)
    } else {
      groups.push({
        start: hiddenSlice.start,
        end: hiddenSlice.end,
        sourceKeys: new Set([hiddenSlice.sourceSeg.key]),
        hiddenSlices: [hiddenSlice],
      })
    }
  }

  return groups.map((group) => {
    return {
      // Timeline and TimeGrid disable event slicing, so one source cannot
      // belong to multiple sibling groups. The lowest source key is therefore
      // a compact, coordinate-independent identity even for very large groups.
      key: [...group.sourceKeys].sort()[0],
      start: group.start,
      end: group.end,
      count: group.sourceKeys.size,
      hiddenSlices: orderResolvedEventItems(group.hiddenSlices),
    }
  })
}

/**
 * Reorders slices or placements for a view whose DOM follows a continuous
 * axis, without changing their membership.
 *
 * Temporal start is primary, so a reader traversing the DOM advances along the
 * axis instead of jumping backward and forward. Items that begin together keep
 * the caller's resolved event order, read from the one place it is ever minted:
 * `sourceSeg.orderIndex`. That tie-break is written out rather than left to
 * sort stability, matching the totally ordered comparators used everywhere else
 * in this module.
 *
 * Any iterable is accepted because callers commonly hold their results in a
 * keyed map.
 */
export function orderTimeAxisItems<Item extends OrderableSlice>(
  items: Iterable<Item>,
): Item[] {
  return [...items].sort((a, b) =>
    a.start - b.start ||
    a.sourceSeg.orderIndex - b.sourceSeg.orderIndex,
  )
}

/** The two fields both shared orderings read; every slice satisfies it. */
interface OrderableSlice {
  start: number
  sourceSeg: { orderIndex: number }
}

/**
 * Restores items to the caller's resolved event order, which is the order a
 * more link's event list renders in.
 *
 * The exact counterpart to `orderTimeAxisItems`: same inputs, same two keys,
 * opposite priority. That function leads with `start` so a reader traversing
 * the DOM advances along the axis; this one leads with `orderIndex` so a list
 * reads in the priority the caller already resolved. Naming both keeps an
 * inline sort from quietly choosing the wrong one.
 *
 * The `start` tie-break carries real geometry rather than merely making the
 * comparator total: slicing can leave one source several disjoint hidden
 * fragments that share their source's single `orderIndex`, and their distinct
 * starts are what order those fragments against each other.
 */
function orderResolvedEventItems<Item extends OrderableSlice>(
  items: Iterable<Item>,
): Item[] {
  return [...items].sort((a, b) =>
    a.sourceSeg.orderIndex - b.sourceSeg.orderIndex ||
    a.start - b.start,
  )
}

/* ------------------------------------------------------------------------
 * Lower-level helpers used by the public limiting functions above
 * --------------------------------------------------------------------- */

/**
 * Restores admitted source segs in their original unrestricted order.
 *
 * A source may have several visible slices, so this first reduces visible
 * geometry to a key set. Reading the one-whole-slice unrestricted array
 * then emits every admitted source exactly once and in event order.
 *
 * Only source identity is read, so both parameters accept plain slices. A
 * caller normally holds placements, which satisfy that narrower requirement.
 */
function selectVisibleSourceSegs<EventMeta>(
  unrestrictedWholeSlices: readonly Slice<EventMeta>[],
  limitedSlices: readonly Slice<EventMeta>[],
): SourceSeg<EventMeta>[] {
  const admittedSourceKeys = new Set(
    limitedSlices.map((slice) => slice.sourceSeg.key),
  )
  return unrestrictedWholeSlices
    .filter((slice) => admittedSourceKeys.has(slice.sourceSeg.key))
    .map((slice) => slice.sourceSeg)
}

/** Applies the shared defaults used by every ordinary slice search. */
export function resolveSliceCandidateOptions(
  options: SliceOptions,
): SliceCandidateOptions {
  return {
    orderStrict: options.orderStrict,
    maxSlices: options.maxSlices,
    slicePenalty: options.slicePenalty ?? 0.15,
    minSliceLength: options.minSliceLength ?? 0,
  }
}

/**
 * Runs the shared overflow admission loop after a fixed bound is established.
 *
 * The caller expresses its bound once, as `isPositionWithinLimits`. That single
 * predicate both partitions the unrestricted placements and vets whole-event
 * compaction, so the two can never disagree about what fits. The caller also
 * supplies the replacement slice-plan search for sources that fit no whole
 * position. Placements remain in event order, so no sort is needed. Regrouping
 * them by old level would be wrong because candidates from different overflow
 * levels can compete for the same retained opening.
 */
function limitOverflowedPlacements<EventMeta>(
  unrestricted: PlacementLayout<EventMeta>,
  options: SliceOptions,
  /** Tests a position by its level index and its far edge, not its origin. */
  isPositionWithinLimits: (
    span: LateralSpan,
    levelIndex: number,
    levelEndCoord: number,
  ) => boolean,
  createSlicePlan: (
    wholeSlice: Slice<EventMeta>,
    thickness: number,
    levels: readonly PlacementLevel<EventMeta>[],
  ) => SlicePlan<EventMeta> | null,
): LayoutLimitResult<EventMeta> {
  const partition = partitionPlacements(unrestricted, (placement) =>
    isPositionWithinLimits(
      placement,
      placement.levelIndex,
      placement.levelEndCoord,
    ))

  // `visiblePlacements` starts with all initially fitting placements. Rejected
  // events do not necessarily come later in event order: with per-cell limits,
  // an earlier wide event can overflow in one restrictive cell while a later
  // event remains visible over a more generous part of its span. Salvaged
  // rejects are appended below, so the final array can be out of event order
  // even though both partition arrays individually preserve event order.
  const { levels, visiblePlacements } = partition
  const hiddenSlices: Slice<EventMeta>[] = []

  for (const placement of partition.overflowedPlacements) {
    const wholeSlice = createWholeSlice(placement.sourceSeg)
    const wholeCandidate = findWholePositionWithinLimits(
      levels,
      wholeSlice,
      placement.thickness,
      options.orderStrict,
      (candidate) => isPositionWithinLimits(
        wholeSlice,
        candidate.levelIndex,
        candidate.levelCoord + placement.thickness,
      ),
    )
    if (wholeCandidate) {
      visiblePlacements.push(commitToLevel(
        levels,
        wholeSlice,
        wholeCandidate.levelIndex,
        wholeCandidate.levelCoord,
        placement.thickness,
      ))
      continue
    }

    if (!options.eventSlicing) {
      hiddenSlices.push(wholeSlice)
      continue
    }

    const slicePlan = createSlicePlan(
      wholeSlice,
      placement.thickness,
      levels,
    )
    if (!slicePlan) {
      hiddenSlices.push(wholeSlice)
      continue
    }

    for (const slice of slicePlan.slices) {
      visiblePlacements.push(commitToLevel(
        levels,
        slice,
        slicePlan.levelIndex,
        slicePlan.levelCoord,
        placement.thickness,
      ))
    }
    hiddenSlices.push(...findHiddenComplement(wholeSlice, slicePlan.slices))
  }

  return { levels, visiblePlacements, hiddenSlices }
}

/** Everything not selected for visibility becomes one of the hidden spans. */
export function findHiddenComplement<EventMeta>(
  source: Slice<EventMeta>,
  visibleSlices: readonly Slice<EventMeta>[],
): Slice<EventMeta>[] {
  return subtractBlockedSpans(source, visibleSlices, 0)
}

/**
 * Splits unrestricted placements by the caller's bound, committing the
 * fitting ones into a fresh mutable level structure at their existing
 * measured positions. Unit-thickness DOM probes naturally remain
 * unit-thickness without special handling.
 */
export function partitionPlacements<EventMeta>(
  unrestricted: PlacementLayout<EventMeta>,
  fits: (placement: Placement<EventMeta>) => boolean,
): PlacementPartition<EventMeta> {
  const levels: PlacementLevel<EventMeta>[] = []
  const visiblePlacements: Placement<EventMeta>[] = []
  const overflowedPlacements: Placement<EventMeta>[] = []

  for (const placement of unrestricted.placements) {
    if (fits(placement)) {
      visiblePlacements.push(commitToLevel(
        levels,
        placement,
        placement.levelIndex,
        placement.levelCoord,
        placement.thickness,
      ))
    } else {
      overflowedPlacements.push(placement)
    }
  }
  return { levels, visiblePlacements, overflowedPlacements }
}

export interface PlacementPartition<EventMeta = unknown> {
  levels: PlacementLevel<EventMeta>[]
  /** Placements admitted by the bound, still in event order. */
  visiblePlacements: Placement<EventMeta>[]
  /** Placements rejected by the bound, still in event order. */
  overflowedPlacements: Placement<EventMeta>[]
}

/** Reports whether one level index fits every lateral cell a slice spans. */
export function fitsLevelLimits(
  slice: LateralSpan,
  levelIndex: number,
  levelLimits: readonly number[],
): boolean {
  const range = getLateralCellRange(slice, levelLimits.length)
  for (let cell = range.start; cell < range.end; cell++) {
    if (levelIndex >= levelLimits[cell]) return false
  }
  return true
}

/** Reports whether a levelEndCoord fits every spanned lateral cell. */
export function fitsCoordLimits(
  slice: LateralSpan,
  levelEndCoord: number,
  coordLimits: readonly number[],
): boolean {
  const range = getLateralCellRange(slice, coordLimits.length)
  for (let cell = range.start; cell < range.end; cell++) {
    if (levelEndCoord > coordLimits[cell] + GEOMETRY_TOLERANCE) return false
  }
  return true
}

/** Returns the integer lateral cells intersected by one lateral span. */
export function getLateralCellRange(
  span: LateralSpan,
  cellCount: number,
): LateralSpan {
  return {
    start: Math.min(cellCount, Math.max(0, Math.floor(span.start))),
    end: Math.min(cellCount, Math.max(0, Math.ceil(span.end))),
  }
}

/**
 * Per-lateral-cell bounds a slice plan must respect. A caller that limits by a
 * single uniform level count expresses that through `levelIndexSearchLimit`
 * instead, which already keeps the search below it.
 */
export interface PositionBounds {
  levelLimits?: readonly number[]
  coordLimits?: readonly number[]
}

interface SlicePosition<EventMeta> {
  levelIndex: number
  levelCoord: number
  runs: Slice<EventMeta>[]
}

/**
 * Enumerates every meaningful `(levelIndex, levelCoord)` position within the
 * search limit and either kind of bounding currency, builds the best
 * one/two/three-slice candidates, and returns only the final winning plan.
 * Runs from different levels are never mixed: every slice in a plan has the
 * same `(levelIndex, levelCoord)`.
 */
export function createBoundedSlicePlan<EventMeta>(
  source: Slice<EventMeta>,
  thickness: number,
  levels: readonly PlacementLevel<EventMeta>[],
  levelIndexSearchLimit: number,
  bounds: PositionBounds,
  options: SliceCandidateOptions,
): SlicePlan<EventMeta> | null {
  // Which placements this source laterally intersects never depends on the
  // position under consideration, so every level is scanned once up front.
  const collidersByLevel = levels.map((level) =>
    findLevelIntersections(level, source),
  )

  const positions: SlicePosition<EventMeta>[] = []
  for (
    let levelIndex = 0;
    levelIndex < levelIndexSearchLimit;
    levelIndex++
  ) {
    for (
      const levelCoord of findCandidateLevelCoords(
        levelIndex,
        collidersByLevel,
      )
    ) {
      positions.push({
        levelIndex,
        levelCoord,
        runs: findFreeRunsAtPosition(
          source,
          thickness,
          levelIndex,
          levelCoord,
          collidersByLevel,
          bounds,
          options.orderStrict,
          options.minSliceLength,
        ),
      })
    }
  }
  return selectBestSlicePlan(source, positions, options)
}

/**
 * Finds every meaningful levelCoord for one logical level. Between these coordinates
 * no smaller-level-index collision changes, so scanning arbitrary pixels adds no new
 * slice possibilities.
 */
function findCandidateLevelCoords<EventMeta>(
  targetLevelIndex: number,
  collidersByLevel: readonly (readonly Placement<EventMeta>[])[],
): number[] {
  const levelCoords = new Set<number>([0])
  for (let levelIndex = 0; levelIndex < targetLevelIndex; levelIndex++) {
    for (const other of collidersByLevel[levelIndex] ?? []) {
      levelCoords.add(other.levelEndCoord)
    }
  }
  return [...levelCoords].sort((a, b) => a - b)
}

/** Finds lateral portions fitting one exact `(levelIndex, levelCoord)`. */
function findFreeRunsAtPosition<EventMeta>(
  source: Slice<EventMeta>,
  thickness: number,
  targetLevelIndex: number,
  levelCoord: number,
  collidersByLevel: readonly (readonly Placement<EventMeta>[])[],
  bounds: PositionBounds,
  orderStrict: boolean,
  minSliceLength: number,
): Slice<EventMeta>[] {
  const blockers: LateralSpan[] = []
  const levelEndCoord = levelCoord + thickness
  const orderIndex = source.sourceSeg.orderIndex

  collidersByLevel.forEach((colliders, levelIndex) => {
    for (const other of colliders) {
      // Same level always blocks. A shallower level blocks by reaching past
      // this coordinate, or by fencing a later-order event above it; a deeper
      // one blocks by starting before this coordinate ends, or by fencing an
      // earlier-order event below it.
      const blocks = levelIndex === targetLevelIndex ||
        (levelIndex < targetLevelIndex
          ? other.levelEndCoord > levelCoord + GEOMETRY_TOLERANCE ||
            (orderStrict && other.sourceSeg.orderIndex > orderIndex)
          : other.levelCoord < levelEndCoord - GEOMETRY_TOLERANCE ||
            (orderStrict && other.sourceSeg.orderIndex < orderIndex))
      if (blocks) blockers.push(other)
    }
  })

  if (bounds.levelLimits) {
    const cellRange = getLateralCellRange(source, bounds.levelLimits.length)
    for (let cell = cellRange.start; cell < cellRange.end; cell++) {
      if (targetLevelIndex >= bounds.levelLimits[cell]) {
        blockers.push({ start: cell, end: cell + 1 })
      }
    }
  }

  if (bounds.coordLimits) {
    const cellRange = getLateralCellRange(source, bounds.coordLimits.length)
    for (let cell = cellRange.start; cell < cellRange.end; cell++) {
      if (levelEndCoord > bounds.coordLimits[cell] + GEOMETRY_TOLERANCE) {
        blockers.push({ start: cell, end: cell + 1 })
      }
    }
  }

  return subtractBlockedSpans(source, blockers, minSliceLength)
}

/**
 * Selects the winning slice plan from precomputed fixed-position runs.
 *
 * Within one position the longest runs are always the ones worth keeping, so
 * the only plans worth scoring are the prefixes of its length-ordered runs. The
 * penalty a plan pays depends solely on how many slices it actually selects,
 * which makes the score comparable across every position and slice count at
 * once: one running best needs no per-count bracket.
 */
function selectBestSlicePlan<EventMeta>(
  source: Slice<EventMeta>,
  positions: readonly SlicePosition<EventMeta>[],
  options: Pick<SliceCandidateOptions, 'maxSlices' | 'slicePenalty'>,
): SlicePlan<EventMeta> | null {
  const sourceLength = getSpanLength(source)
  let selected: SlicePlan<EventMeta> | null = null

  for (const position of positions) {
    const runs = [...position.runs].sort((a, b) =>
      getSpanLength(b) - getSpanLength(a) || a.start - b.start,
    )

    let visibleLength = 0
    const sliceCount = Math.min(options.maxSlices, runs.length)
    for (let count = 1; count <= sliceCount; count++) {
      visibleLength += getSpanLength(runs[count - 1])
      const plan: SlicePlan<EventMeta> = {
        levelIndex: position.levelIndex,
        levelCoord: position.levelCoord,
        slices: runs.slice(0, count).sort((a, b) => a.start - b.start),
        visibleLength,
        score: visibleLength / sourceLength -
          options.slicePenalty * (count - 1),
      }
      if (isBetterScoredPlan(plan, selected)) selected = plan
    }
  }

  return selected
}

/**
 * Reports whether one normalized slice retains its whole input seg.
 *
 * If this distinction becomes broadly important downstream, we may eventually
 * introduce an explicit `isSlice` or `isWhole` property instead of repeatedly
 * deriving it from source geometry. For now, keeping it derived avoids another
 * piece of state that every slicing operation would need to maintain.
 */
export function doesSliceCoverWholeSource<EventMeta>(
  slice: Slice<EventMeta>,
): boolean {
  return slice.start === slice.sourceSeg.start &&
    slice.end === slice.sourceSeg.end
}

/** Comparison: score, then fewer slices, then smaller levelCoord. */
function isBetterScoredPlan<EventMeta>(
  candidate: SlicePlan<EventMeta>,
  current: SlicePlan<EventMeta> | null,
): boolean {
  if (!current) return true
  if (candidate.score > current.score + GEOMETRY_TOLERANCE) return true
  if (candidate.score < current.score - GEOMETRY_TOLERANCE) return false
  if (candidate.slices.length !== current.slices.length) {
    return candidate.slices.length < current.slices.length
  }
  return candidate.levelCoord < current.levelCoord
}

/** Subtracts blocker union from one source span to form maximal free runs. */
function subtractBlockedSpans<EventMeta>(
  source: Slice<EventMeta>,
  blockers: readonly LateralSpan[],
  minSliceLength: number,
): Slice<EventMeta>[] {
  const runs: Slice<EventMeta>[] = []
  let cursor = source.start
  for (const blocker of mergeBlockedSpans(source, blockers)) {
    const length = blocker.start - cursor
    if (
      length > GEOMETRY_TOLERANCE &&
      length >= minSliceLength - GEOMETRY_TOLERANCE
    ) {
      runs.push(createNarrowerSlice(source, cursor, blocker.start))
    }
    cursor = Math.max(cursor, blocker.end)
  }
  const finalLength = source.end - cursor
  if (
    finalLength > GEOMETRY_TOLERANCE &&
    finalLength >= minSliceLength - GEOMETRY_TOLERANCE
  ) {
    runs.push(createNarrowerSlice(source, cursor, source.end))
  }
  return runs
}

/**
 * Clips blockers to `outer`, then consolidates them into disjoint, sorted
 * spans. Overlapping blockers and blockers that touch within floating-point
 * tolerance become one span. Only lateral geometry survives: a caller that
 * needs to explain a union's composition must preserve that separately.
 */
function mergeBlockedSpans(
  outer: LateralSpan,
  blockers: readonly LateralSpan[],
): LateralSpan[] {
  const clipped = blockers
    .map((blocker) => ({
      start: Math.max(outer.start, blocker.start),
      end: Math.min(outer.end, blocker.end),
    }))
    .filter((blocker) => blocker.start < blocker.end)
    .sort((a, b) => a.start - b.start || a.end - b.end)

  const merged: LateralSpan[] = []
  for (const span of clipped) {
    const last = merged[merged.length - 1]
    if (last && span.start <= last.end + GEOMETRY_TOLERANCE) {
      last.end = Math.max(last.end, span.end)
    } else {
      merged.push(span)
    }
  }

  return merged
}

function doSpansOverlap(a: LateralSpan, b: LateralSpan): boolean {
  return a.start < b.end && b.start < a.end
}

function getSpanLength(span: LateralSpan): number {
  return span.end - span.start
}
