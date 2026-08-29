/**
 * Standalone placement toy. Its top-level layouts orchestrate the logical and
 * coordinate-aware sections that follow them.
 *
 * Component-facing entry points:
 * - `buildPixelLimitedLayout`
 * - `buildLevelLimitedLayout`
 */

/** Half-open lateral interval. The axis can be discrete or continuous. */
export interface Span {
  start: number
  end: number
}

export interface Seg extends Span {
  id: string
}

export interface Slice extends Seg {
  /** Stable source order shared by every partial cut from this slice. */
  orderIndex: number
}

export type SliceHeightMap = ReadonlyMap<string, number>

/** Stable measurement key shared by planning and the rendering component. */
export function getSliceKey(slice: Seg): string {
  return `${slice.id}:${slice.start}:${slice.end}`
}

/* ========================================================================
 * Pixel-limited layout
 * ===================================================================== */

const PIXEL_TOLERANCE = 0.000_001

export interface PixelLimitedLayout {
  /** Valid visible plan, pruned from either the liberal or whole topology. */
  plan: PixelPlan
  /** Liberal candidate slices that still need invisible measurement. */
  pendingSlices: Slice[]
  /** Whether `plan` was pruned directly from the liberal topology. */
  isSettled: boolean
}

/**
 * Builds a liberal logical topology, then monotonically removes sources until
 * every event and bottom-fixed more link fits. While liberal partials await
 * measurement, the same pruner supplies a valid whole-only topology.
 */
export function buildPixelLimitedLayout(
  segs: readonly Seg[],
  eventSlicing: boolean,
  sliceHeights: SliceHeightMap,
  maxPixels: number,
  moreLinkHeight: number,
): PixelLimitedLayout {
  const unlimitedLevels = buildUnlimitedSliceLevels(segs)
  const wholeResolution = resolveSliceLevelCoords(
    unlimitedLevels,
    sliceHeights,
    maxPixels,
  )
  const wholeExtras = wholeResolution.excludedSlices
    .concat(wholeResolution.pendingSlices)
    .sort(compareSlices)

  // The one-level tax is only a packing heuristic. Monotonic pruning enforces
  // the real link height after the liberal topology has been measured.
  const placementHooks = createPixelPlacementHooks(
    segs,
    wholeResolution.sliceCoords,
    sliceHeights,
    maxPixels,
    moreLinkHeight,
  )
  const candidateTopology = placeExtraSlicesInLevels(
    wholeResolution.placementSliceLevels,
    wholeExtras,
    eventSlicing,
    1,
    placementHooks,
  )
  const plan = prunePixelPlan(
    candidateTopology.sliceLevels,
    candidateTopology.hiddenSlices,
    sliceHeights,
    maxPixels,
    moreLinkHeight,
  )

  if (plan) {
    return {
      plan,
      pendingSlices: [],
      isSettled: true,
    }
  }

  const pendingSlices = candidateTopology.sliceLevels
    .flat()
    .filter((slice) =>
      sliceHeights.get(getSliceKey(slice)) === undefined,
    )
  const wholePlan = prunePixelPlan(
    wholeResolution.placementSliceLevels,
    wholeExtras,
    sliceHeights,
    maxPixels,
    moreLinkHeight,
  )!

  return {
    plan: wholePlan,
    pendingSlices,
    isSettled: false,
  }
}

/* ========================================================================
 * Slice levels
 * ===================================================================== */

/** Live logical state consulted when placing a whole slice or slice plan. */
interface SlicePlacementState {
  levels: readonly (readonly Slice[])[]
  bottomReservedSpans: readonly Span[]
  canPlaceSlice?: (slice: Slice, levelIndex: number) => boolean
}

/** Builds unrestricted whole-slice levels in received event order. */
export function buildUnlimitedSliceLevels(
  segs: readonly Seg[],
): Slice[][] {
  const levels: Slice[][] = []
  const placementState: SlicePlacementState = {
    levels,
    bottomReservedSpans: [],
  }

  segs.forEach((seg, orderIndex) => {
    const slice = { ...seg, orderIndex }
    const levelIndex = findInsertionLevel(slice, placementState)

    if (levelIndex === null) {
      levels.push([slice])
    } else {
      insertLaterally(levels[levelIndex], slice)
    }
  })

  return levels
}

/** Returns the shallowest vacant level under the span's local event cap. */
function findInsertionLevel(
  slice: Slice,
  state: SlicePlacementState,
): number | null {
  const levelCount = state.levels.length - Number(
    intersectsAny(state.bottomReservedSpans, slice),
  )

  for (let levelIndex = 0; levelIndex < levelCount; levelIndex++) {
    if (
      !intersectsAny(state.levels[levelIndex], slice) &&
      (!state.canPlaceSlice || state.canPlaceSlice(slice, levelIndex))
    ) {
      return levelIndex
    }
  }
  return null
}

/* ========================================================================
 * Limited slice levels
 * ===================================================================== */

export interface LimitedLayout {
  sliceLevels: Slice[][]
  /** Deliberately flat. Final product-specific grouping is a later concern. */
  hiddenSlices: Slice[]
  /** Normalized lateral territory where a bottom-fixed more link exists. */
  moreLinkSpans: Span[]
}

export interface LevelLimitedLayout extends LimitedLayout {
  placementSliceLevels: Slice[][]
  sliceCoords: Map<Slice, number>
  pendingSlices: Slice[]
}

/** Builds, limits, and resolves levels directly from component-owned inputs. */
export function buildLevelLimitedLayout(
  segs: readonly Seg[],
  eventSlicing: boolean,
  sliceHeights: SliceHeightMap,
  maxLevels: number,
  moreLinkLevelTax: 0 | 1,
): LevelLimitedLayout {
  const logicalLayout = limitSliceLevels(
    buildUnlimitedSliceLevels(segs),
    maxLevels,
    eventSlicing,
    moreLinkLevelTax,
  )
  const resolution = resolveSliceLevelCoords(
    logicalLayout.sliceLevels,
    sliceHeights,
  )

  return {
    ...logicalLayout,
    placementSliceLevels: resolution.placementSliceLevels,
    sliceCoords: resolution.sliceCoords,
    pendingSlices: resolution.pendingSlices,
  }
}

/**
 * Retains `maxLevels` from an unrestricted structure and fires every later
 * slice back at those levels in source order.
 */
export function limitSliceLevels(
  unlimitedLevels: readonly (readonly Slice[])[],
  maxLevels: number,
  eventSlicing: boolean,
  moreLinkLevelTax: 0 | 1,
): LimitedLayout {
  const initialSliceLevels = Array.from(
    { length: maxLevels },
    (_, levelIndex) => unlimitedLevels[levelIndex] ?? [],
  )
  // Truncating levels loses source order, so restore it before firing extras.
  const extras = unlimitedLevels
    .slice(maxLevels)
    .flat()
    .sort(compareSlices)

  return placeExtraSlicesInLevels(
    initialSliceLevels,
    extras,
    eventSlicing,
    moreLinkLevelTax,
  )
}

/* ========================================================================
 * Mutable slice layouts
 * ===================================================================== */

/** Clones visible levels and accumulates any existing hidden coverage. */
function createMutableSliceLayout(
  initialSliceLevels: readonly (readonly Slice[])[],
  initialHiddenSlices: readonly Slice[] = [],
): LimitedLayout {
  const layout: LimitedLayout = {
    sliceLevels: initialSliceLevels.map((level) => [...level]),
    hiddenSlices: [],
    moreLinkSpans: [],
  }

  for (const slice of initialHiddenSlices) {
    addHiddenSliceToLayout(layout, slice)
  }

  return layout
}

/** Adds flat hidden membership and grows normalized more-link coverage. */
function addHiddenSliceToLayout(
  layout: LimitedLayout,
  slice: Slice,
): void {
  layout.hiddenSlices.push(slice)
  addToUnion(layout.moreLinkSpans, slice)
}

/* ========================================================================
 * Logical slice placement
 * ===================================================================== */

/** Work alternates between attempting slices and reserving bottom link space. */
type Work =
  | { type: 'fire'; slice: Slice }
  | { type: 'moreLink'; span: Span }

interface SlicePlacementHooks {
  canPlaceSlice: (
    slice: Slice,
    levelIndex: number,
    sliceLevels: readonly (readonly Slice[])[],
  ) => boolean
  levelsChanged: (
    startLevelIndex: number,
    sliceLevels: readonly (readonly Slice[])[],
  ) => void
}

/**
 * Fires extras at an existing fixed set of logical levels.
 *
 * With slicing disabled, a failed slice hides whole. With slicing enabled,
 * every level independently offers its maximal free runs. The winning plan
 * balances exposed length against fragmentation and commits all its slices to
 * one level.
 *
 * Every hidden slice contributes to a coverage accumulator. Only newly covered
 * runs reserve the bottom event level for a more link. A slice already using
 * that level is evicted; partial eviction hides only the violating footprint
 * and refires the victim's remainders.
 */
function placeExtraSlicesInLevels(
  initialSliceLevels: readonly (readonly Slice[])[],
  extraSlices: readonly Slice[],
  eventSlicing: boolean,
  moreLinkLevelTax: 0 | 1,
  hooks?: SlicePlacementHooks,
): LimitedLayout {
  const layout = createMutableSliceLayout(initialSliceLevels)
  const { sliceLevels, moreLinkSpans } = layout
  const placementState: SlicePlacementState = {
    levels: sliceLevels,
    bottomReservedSpans: moreLinkLevelTax ? moreLinkSpans : [],
    canPlaceSlice: hooks
      ? (slice, levelIndex) => hooks.canPlaceSlice(
        slice,
        levelIndex,
        sliceLevels,
      )
      : undefined,
  }

  const work: Work[] = []

  pushFire(extraSlices)

  // Depth-first work lets fresh accumulator coverage reserve the bottom level
  // before the next unrelated extra gets a chance to insert.
  while (work.length) {
    const item = work.pop()!
    if (item.type === 'fire') {
      fire(item.slice)
    } else {
      fireMoreLink(item.span)
    }
  }

  return layout

  /** Tries a whole insertion before considering scored same-level slices. */
  function fire(slice: Slice): void {
    const levelIndex = findInsertionLevel(slice, placementState)

    if (levelIndex !== null) {
      insertLaterally(sliceLevels[levelIndex], slice)
      hooks?.levelsChanged(levelIndex, sliceLevels)
      return
    }
    if (!eventSlicing) {
      hide(slice)
      return
    }

    const plan = findBestSlicePlan(slice, placementState)
    if (!plan) {
      hide(slice)
      return
    }

    for (const visibleSlice of plan.slices) {
      insertLaterally(sliceLevels[plan.levelIndex], visibleSlice)
    }
    hooks?.levelsChanged(plan.levelIndex, sliceLevels)
    for (const hiddenSlice of subtractCoveredFromSlice(slice, plan.slices)) {
      hide(hiddenSlice)
    }
  }

  /** Adds hidden membership and fires links only over new accumulator coverage. */
  function hide(slice: Slice): void {
    // Only the set difference is fresh more-link territory; it can consist of
    // several disjoint runs.
    const newMoreLinkSpans = subtractCovered(slice, moreLinkSpans)

    addHiddenSliceToLayout(layout, slice)

    if (moreLinkLevelTax) {
      for (let i = newMoreLinkSpans.length - 1; i >= 0; i--) {
        work.push({ type: 'moreLink', span: newMoreLinkSpans[i] })
      }
    }
  }

  /**
   * Reserves the bottom logical level over fresh accumulator coverage. Because
   * the tax is exactly one, only slices in the last level can be displaced.
   */
  function fireMoreLink(span: Span): void {
    const taxedLevel = sliceLevels[sliceLevels.length - 1]
    const victims = findIntersectingSlicesInLevel(taxedLevel, span)

    // Removing right-to-left preserves every recorded index.
    for (let i = victims.length - 1; i >= 0; i--) {
      removeSliceFromLevel(taxedLevel, victims[i].index)
    }
    if (victims.length) {
      hooks?.levelsChanged(sliceLevels.length - 1, sliceLevels)
    }

    for (const { slice: victim } of victims) {
      if (eventSlicing) {
        hide(intersectSlice(victim, span)!)
        pushFire(subtractCoveredFromSlice(victim, [span]))
      } else {
        hide(victim)
      }
    }
  }

  /** Reversing preserves received order on the LIFO work stack. */
  function pushFire(slices: readonly Slice[]): void {
    for (let i = slices.length - 1; i >= 0; i--) {
      work.push({ type: 'fire', slice: slices[i] })
    }
  }
}

/* ========================================================================
 * SlicePlan functionality
 * ===================================================================== */

const MAX_SLICES_PER_PLAN = 3
const EXTRA_SLICE_PENALTY = 0.15

/** One hypothetical sliced insertion, confined to a single logical level. */
interface SlicePlan {
  levelIndex: number
  slices: Slice[]
  score: number
}

/**
 * Scores the best one-, two-, or three-run insertion offered by each level.
 * Runs from different levels are deliberately never mixed into one plan.
 */
function findBestSlicePlan(
  slice: Slice,
  state: SlicePlacementState,
): SlicePlan | null {
  let selected: SlicePlan | null = null
  const sourceLength = getSpanLength(slice)

  for (let levelIndex = 0; levelIndex < state.levels.length; levelIndex++) {
    // A level is already a sorted, collision-free set. Copy its geometry so
    // bottom-link coverage can be folded into the blockers without mutating
    // the actual level.
    const blockers: Span[] = findIntersectingSlicesInLevel(
      state.levels[levelIndex],
      slice,
    ).map(({ slice: blocker }) => ({
      start: blocker.start,
      end: blocker.end,
    }))
    if (levelIndex === state.levels.length - 1) {
      for (const span of state.bottomReservedSpans) {
        addToUnion(blockers, span)
      }
    }

    const runs = subtractCoveredFromSlice(slice, blockers)
      .filter((run) =>
        !state.canPlaceSlice || state.canPlaceSlice(run, levelIndex),
      )
      .sort((a, b) => getSpanLength(b) - getSpanLength(a) || a.start - b.start)
    let visibleLength = 0

    for (
      let sliceCount = 1;
      sliceCount <= Math.min(MAX_SLICES_PER_PLAN, runs.length);
      sliceCount++
    ) {
      visibleLength += getSpanLength(runs[sliceCount - 1])
      const candidate: SlicePlan = {
        levelIndex,
        slices: runs.slice(0, sliceCount).sort(compareSlices),
        score: visibleLength / sourceLength -
          EXTRA_SLICE_PENALTY * (sliceCount - 1),
      }
      if (isBetterSlicePlan(candidate, selected)) {
        selected = candidate
      }
    }
  }

  return selected
}

/** Comparison: score, then less fragmentation, then the shallower level. */
function isBetterSlicePlan(
  candidate: SlicePlan,
  current: SlicePlan | null,
): boolean {
  if (!current || candidate.score > current.score) {
    return true
  }
  if (candidate.score < current.score) {
    return false
  }
  if (candidate.slices.length !== current.slices.length) {
    return candidate.slices.length < current.slices.length
  }
  return candidate.levelIndex < current.levelIndex
}

/* ========================================================================
 * Slice-level coordinate resolution
 * ===================================================================== */

interface SliceLevelCoordResolution {
  placementSliceLevels: Slice[][]
  sliceCoords: Map<Slice, number>
  pendingSlices: Slice[]
  excludedSlices: Slice[]
}

type SliceHeightLookup = (slice: Slice) => number | undefined

/**
 * Inflates fixed logical levels with measured heights. A finite pixel limit
 * excludes slices as they are encountered; the default preserves all measured
 * slices and only reports missing measurements as pending.
 */
function resolveSliceLevelCoords(
  sliceLevels: readonly (readonly Slice[])[],
  sliceHeights: SliceHeightMap,
  maxPixels: number = Infinity,
): SliceLevelCoordResolution {
  const placementSliceLevels = sliceLevels.map(() => [] as Slice[])
  const sliceCoords = new Map<Slice, number>()
  const pendingSlices: Slice[] = []
  const excludedSlices: Slice[] = []
  const getSliceHeight: SliceHeightLookup = (slice) =>
    sliceHeights.get(getSliceKey(slice))

  for (let levelIndex = 0; levelIndex < sliceLevels.length; levelIndex++) {
    for (const slice of sliceLevels[levelIndex]) {
      const height = getSliceHeight(slice)

      if (height === undefined) {
        pendingSlices.push(slice)
        continue
      }
      const coord = computeSliceCoord(
        placementSliceLevels,
        sliceCoords,
        getSliceHeight,
        slice,
        levelIndex,
      )
      if (coord + height <= maxPixels + PIXEL_TOLERANCE) {
        placementSliceLevels[levelIndex].push(slice)
        sliceCoords.set(slice, coord)
      } else {
        excludedSlices.push(slice)
      }
    }
  }

  return {
    placementSliceLevels,
    sliceCoords,
    pendingSlices,
    excludedSlices,
  }
}

/** Resolves coordinates from the first level that may have changed support. */
function resolveSliceCoordsFromLevel(
  sliceLevels: readonly (readonly Slice[])[],
  sliceCoords: Map<Slice, number>,
  getSliceHeight: SliceHeightLookup,
  startLevelIndex: number,
): void {
  for (
    let levelIndex = startLevelIndex;
    levelIndex < sliceLevels.length;
    levelIndex++
  ) {
    for (const slice of sliceLevels[levelIndex]) {
      sliceCoords.set(slice, computeSliceCoord(
        sliceLevels,
        sliceCoords,
        getSliceHeight,
        slice,
        levelIndex,
      ))
    }
  }
}

/** Computes one slice's top from intersecting slices in lower logical levels. */
function computeSliceCoord(
  sliceLevels: readonly (readonly Slice[])[],
  sliceCoords: ReadonlyMap<Slice, number>,
  getSliceHeight: SliceHeightLookup,
  slice: Slice,
  levelIndex: number,
): number {
  let coord = 0

  for (let lowerLevelIndex = 0; lowerLevelIndex < levelIndex; lowerLevelIndex++) {
    for (const lowerSlice of sliceLevels[lowerLevelIndex]) {
      const lowerHeight = getSliceHeight(lowerSlice)

      if (lowerHeight !== undefined && intersectSpans(lowerSlice, slice)) {
        coord = Math.max(
          coord,
          sliceCoords.get(lowerSlice)! + lowerHeight,
        )
      }
    }
  }

  return coord
}

/* ========================================================================
 * Pixel-informed candidate placement
 * ===================================================================== */

interface PlanningSource {
  start: number
  end: number
  height: number | undefined
}

/**
 * Rejects logically vacant placements that are already known to exceed the
 * pixel boundary. Whole slices use their measured height. Partials use their
 * measured height when available, with source and more-link height as a stable
 * temporary floor. Exact resolution remains the final authority.
 */
function createPixelPlacementHooks(
  segs: readonly Seg[],
  initialSliceCoords: ReadonlyMap<Slice, number>,
  sliceHeights: SliceHeightMap,
  maxPixels: number,
  moreLinkHeight: number,
): SlicePlacementHooks {
  const sliceCoords = new Map(initialSliceCoords)
  const sources = new Map<string, PlanningSource>()

  for (const seg of segs) {
    sources.set(seg.id, {
      start: seg.start,
      end: seg.end,
      height: sliceHeights.get(getSliceKey(seg)),
    })
  }

  return {
    canPlaceSlice(slice, levelIndex, sliceLevels) {
      const coord = computeSliceCoord(
        sliceLevels,
        sliceCoords,
        getPlanningHeight,
        slice,
        levelIndex,
      )

      return coord + getPlanningHeight(slice) <=
        maxPixels + PIXEL_TOLERANCE
    },

    levelsChanged(startLevelIndex, sliceLevels) {
      resolveSliceCoordsFromLevel(
        sliceLevels,
        sliceCoords,
        getPlanningHeight,
        startLevelIndex,
      )
    },
  }

  function getPlanningHeight(slice: Slice): number {
    const source = sources.get(slice.id)!
    const isWhole = slice.start === source.start && slice.end === source.end
    const measuredHeight = sliceHeights.get(getSliceKey(slice))

    if (isWhole) {
      return measuredHeight ?? moreLinkHeight
    }
    return Math.max(
      measuredHeight ?? 0,
      source.height ?? 0,
      moreLinkHeight,
    )
  }
}

/* ========================================================================
 * Monotonic pixel pruning
 * ===================================================================== */

export interface PixelPlan extends LimitedLayout {
  sliceCoords: Map<Slice, number>
}

interface IndexedLevelSlice {
  slice: Slice
  levelIndex: number
  sliceIndex: number
}

interface PixelMoreLinkVictim extends IndexedLevelSlice {
  bottom: number
}

/**
 * Removes slices until all measured events and bottom-fixed more links fit.
 * Null means a visible slice is still awaiting measurement. Nothing is
 * inserted or moved between levels, so each iteration strictly reduces the
 * topology and surviving coordinates can only move upward.
 */
export function prunePixelPlan(
  topology: readonly (readonly Slice[])[],
  initialHiddenSlices: readonly Slice[],
  sliceHeights: SliceHeightMap,
  maxPixels: number,
  moreLinkHeight: number,
): PixelPlan | null {
  const layout = createMutableSliceLayout(topology, initialHiddenSlices)
  const { sliceLevels, moreLinkSpans } = layout
  const getSliceHeight: SliceHeightLookup = (slice) =>
    sliceHeights.get(getSliceKey(slice))
  const resolution = resolveSliceLevelCoords(sliceLevels, sliceHeights)

  if (resolution.pendingSlices.length) {
    return null
  }

  const sliceCoords = resolution.sliceCoords

  while (true) {
    const removals = findOverflowingSlices(
      sliceLevels,
      sliceCoords,
      getSliceHeight,
      maxPixels,
    )

    if (!removals.length) {
      const victim = findPixelMoreLinkVictim(
        sliceLevels,
        sliceCoords,
        getSliceHeight,
        moreLinkSpans,
        maxPixels - moreLinkHeight,
      )

      if (!victim) {
        break
      }
      removals.push(victim)
    }

    const firstChangedLevel = removeSlicesFromPixelPlan(
      removals,
      layout,
      sliceCoords,
    )

    resolveSliceCoordsFromLevel(
      sliceLevels,
      sliceCoords,
      getSliceHeight,
      firstChangedLevel + 1,
    )
  }

  return {
    ...layout,
    sliceCoords,
  }
}

/** Identifies every visible slice beyond the pixel boundary. */
function findOverflowingSlices(
  sliceLevels: readonly (readonly Slice[])[],
  sliceCoords: ReadonlyMap<Slice, number>,
  getSliceHeight: SliceHeightLookup,
  maxPixels: number,
): IndexedLevelSlice[] {
  const slices: IndexedLevelSlice[] = []

  for (let levelIndex = 0; levelIndex < sliceLevels.length; levelIndex++) {
    const level = sliceLevels[levelIndex]

    // Right-to-left order lets removal reuse these indexes without adjustment.
    for (let sliceIndex = level.length - 1; sliceIndex >= 0; sliceIndex--) {
      const slice = level[sliceIndex]

      if (
        sliceCoords.get(slice)! + getSliceHeight(slice)! >
          maxPixels + PIXEL_TOLERANCE
      ) {
        slices.push({ slice, levelIndex, sliceIndex })
      }
    }
  }

  return slices
}

/**
 * Removes already-indexed slices and adds their spans to hidden coverage.
 * Multiple removals from one level must arrive right-to-left.
 */
function removeSlicesFromPixelPlan(
  removals: readonly IndexedLevelSlice[],
  layout: LimitedLayout,
  sliceCoords: Map<Slice, number>,
): number {
  const { sliceLevels } = layout
  let firstChangedLevel = sliceLevels.length

  for (const { levelIndex, sliceIndex } of removals) {
    const removedSlice = removeSliceFromLevel(
      sliceLevels[levelIndex],
      sliceIndex,
    )

    sliceCoords.delete(removedSlice)
    addHiddenSliceToLayout(layout, removedSlice)
    firstChangedLevel = Math.min(firstChangedLevel, levelIndex)
  }

  return firstChangedLevel
}

/** Finds the deepest measured event currently intruding into the link strip. */
function findPixelMoreLinkVictim(
  sliceLevels: readonly (readonly Slice[])[],
  sliceCoords: ReadonlyMap<Slice, number>,
  getSliceHeight: SliceHeightLookup,
  moreLinkSpans: readonly Span[],
  moreLinkTop: number,
): PixelMoreLinkVictim | null {
  let selected: PixelMoreLinkVictim | null = null

  for (let levelIndex = 0; levelIndex < sliceLevels.length; levelIndex++) {
    const level = sliceLevels[levelIndex]

    for (let sliceIndex = 0; sliceIndex < level.length; sliceIndex++) {
      const slice = level[sliceIndex]
      const bottom = sliceCoords.get(slice)! +
        getSliceHeight(slice)!

      if (
        intersectsAny(moreLinkSpans, slice) &&
        bottom > moreLinkTop + PIXEL_TOLERANCE &&
        (!selected || bottom > selected.bottom)
      ) {
        selected = { slice, levelIndex, sliceIndex, bottom }
      }
    }
  }

  return selected
}

/* ========================================================================
 * Slice utilities
 * ===================================================================== */

/** Subtracts normalized coverage while preserving the source slice's identity. */
function subtractCoveredFromSlice(
  slice: Slice,
  covered: readonly Span[],
): Slice[] {
  return subtractCovered(slice, covered)
    .map((span) => createNarrowerSlice(slice, span.start, span.end))
}

/** Finds the strict intersection while retaining source identity and order. */
function intersectSlice(slice: Slice, span: Span): Slice | null {
  const intersection = intersectSpans(slice, span)
  return intersection
    ? createNarrowerSlice(slice, intersection.start, intersection.end)
    : null
}

/** Produces a narrower view of the same source slice. */
function createNarrowerSlice(slice: Slice, start: number, end: number): Slice {
  return { ...slice, start, end }
}

interface IndexedSlice {
  slice: Slice
  index: number
}

/** Finds one level's intersections in `O(log n + matches)` time. */
function findIntersectingSlicesInLevel(
  level: readonly Slice[],
  span: Span,
): IndexedSlice[] {
  let index = findFirstSpanEndingAfter(level, span.start)
  const matches: IndexedSlice[] = []

  while (index < level.length) {
    if (!intersectSpans(level[index], span)) {
      break
    }
    matches.push({ slice: level[index], index })
    index++
  }
  return matches
}

/** Preserves increasing lateral-start order within a collision-free level. */
function insertLaterally(level: Slice[], slice: Slice): void {
  let low = 0
  let high = level.length

  while (low < high) {
    const middle = (low + high) >>> 1
    if (level[middle].start < slice.start) {
      low = middle + 1
    } else {
      high = middle
    }
  }
  level.splice(low, 0, slice)
}

function removeSliceFromLevel(level: Slice[], sliceIndex: number): Slice {
  return level.splice(sliceIndex, 1)[0]
}

function compareSlices(a: Slice, b: Slice): number {
  return a.orderIndex - b.orderIndex || a.start - b.start || a.end - b.end
}

/* ========================================================================
 * Span geometry utilities
 * ===================================================================== */

/** Computes the coverage set difference `span - covered`. */
function subtractCovered(span: Span, covered: readonly Span[]): Span[] {
  const result: Span[] = []
  let cursor = span.start

  for (const item of covered) {
    if (item.end <= cursor) {
      continue
    }
    if (item.start >= span.end) {
      break
    }
    if (item.start > cursor) {
      result.push({ start: cursor, end: Math.min(item.start, span.end) })
    }
    cursor = Math.max(cursor, item.end)
    if (cursor >= span.end) {
      break
    }
  }

  if (cursor < span.end) {
    result.push({ start: cursor, end: span.end })
  }
  return result
}

/** Maintains a sorted union. Adjacency is merged because only coverage matters. */
function addToUnion(spans: Span[], addition: Span): void {
  const result: Span[] = []
  let pending = { ...addition }
  let inserted = false

  for (const span of spans) {
    if (span.end < pending.start) {
      result.push(span)
    } else if (pending.end < span.start) {
      if (!inserted) {
        result.push(pending)
        inserted = true
      }
      result.push(span)
    } else {
      pending = {
        start: Math.min(pending.start, span.start),
        end: Math.max(pending.end, span.end),
      }
    }
  }

  if (!inserted) {
    result.push(pending)
  }
  spans.splice(0, spans.length, ...result)
}

/** Finds the first sorted, nonoverlapping span whose end exceeds `coord`. */
function findFirstSpanEndingAfter(
  spans: readonly Span[],
  coord: number,
): number {
  let low = 0
  let high = spans.length

  while (low < high) {
    const middle = (low + high) >>> 1
    if (spans[middle].end <= coord) {
      low = middle + 1
    } else {
      high = middle
    }
  }
  return low
}

/** Tests a sorted, nonoverlapping collection in logarithmic time. */
function intersectsAny(items: readonly Span[], span: Span): boolean {
  const index = findFirstSpanEndingAfter(items, span.start)
  return index < items.length && intersectSpans(items[index], span) !== null
}

/** Returns the strict intersection; adjacent spans do not intersect. */
function intersectSpans(a: Span, b: Span): Span | null {
  const start = Math.max(a.start, b.start)
  const end = Math.min(a.end, b.end)
  return start < end ? { start, end } : null
}

function getSpanLength(span: Span): number {
  return span.end - span.start
}
