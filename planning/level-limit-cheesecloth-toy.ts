/**
 * Standalone placement toy. Pixel measurements build a conservative
 * whole-slice plan and validate its candidate; slicing remains logical.
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

/* ========================================================================
 * Pixel-limited layout
 * ===================================================================== */

/**
 * Builds and resolves a safe whole-only layout, then attempts and resolves its
 * extras with the logical slicing algorithm. While candidate measurements are
 * pending, the safe topology remains selected and those candidate slices are
 * returned separately for the component to mount in its measurement layer.
 * A fully measured candidate replaces the safe layout only when valid.
 * `neededLevelCount` bounds the initial DOM whole-slice candidates; later
 * slices begin hidden and unmeasured.
 */
export function buildPixelLimitedLayout(
  segs: readonly Seg[],
  eventSlicing: boolean,
  sliceHeights: SliceHeightMap,
  maxPixels: number,
  neededLevelCount: number,
  moreLinkHeight: number,
): ResolvedLimitedLayout {
  const wholeSlices = convertSegsToWholeSlices(segs)
  const {
    sliceLevels: domSliceLevels,
    excludedSlices: domExcludedSlices,
  } = buildSliceLevels(wholeSlices, neededLevelCount)
  const wholeResolution = resolveSliceLevelCoords(
    domSliceLevels,
    sliceHeights,
    maxPixels,
  )
  const initialHiddenSlices = domExcludedSlices.concat(
    wholeResolution.pendingSlices,
    wholeResolution.excludedSlices,
  )
  const safeLogicalLayout = buildWholePixelSafeLayout(
    wholeResolution.sliceLevels,
    initialHiddenSlices,
    wholeResolution.sliceCoords,
    sliceHeights,
    maxPixels,
    moreLinkHeight,
  )
  const safeResolution = resolveSliceLevelCoords(
    safeLogicalLayout.sliceLevels,
    sliceHeights,
  )
  const safeLayout: ResolvedLimitedLayout = {
    ...safeLogicalLayout,
    ...safeResolution,
  }
  const candidateLogicalLayout = placeExtraSlicesInLevels(
    safeLogicalLayout.sliceLevels,
    safeLogicalLayout.hiddenSlices,
    eventSlicing,
    0,
  )
  const candidateResolution = resolveSliceLevelCoords(
    candidateLogicalLayout.sliceLevels,
    sliceHeights,
    maxPixels,
  )

  if (candidateResolution.pendingSlices.length) {
    return {
      ...safeLayout,
      pendingSlices: candidateResolution.pendingSlices,
    }
  }
  if (candidateResolution.excludedSlices.length) {
    return safeLayout
  }

  const candidateLayout: ResolvedLimitedLayout = {
    ...candidateLogicalLayout,
    ...candidateResolution,
  }

  return isPixelCandidateValid(
    candidateLayout,
    sliceHeights,
    maxPixels,
    moreLinkHeight,
  )
    ? candidateLayout
    : safeLayout
}

/* ========================================================================
 * Level-limited layout
 * ===================================================================== */

/**
 * Streams at most `maxLevels` into the initial structure and fires every
 * rejected slice back at those levels in source order.
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
export function buildLevelLimitedLayout(
  segs: readonly Seg[],
  eventSlicing: boolean,
  sliceHeights: SliceHeightMap,
  maxLevels: number,
  moreLinkLevelTax: 0 | 1,
): ResolvedLimitedLayout {
  const wholeSlices = convertSegsToWholeSlices(segs)
  const {
    sliceLevels: initialSliceLevels,
    excludedSlices: extraSlices,
  } = buildSliceLevels(wholeSlices, maxLevels)
  const logicalLayout = placeExtraSlicesInLevels(
    initialSliceLevels,
    extraSlices,
    eventSlicing,
    moreLinkLevelTax,
  )
  const resolution = resolveSliceLevelCoords(
    logicalLayout.sliceLevels,
    sliceHeights,
  )

  return {
    ...logicalLayout,
    ...resolution,
  }
}

/* ========================================================================
 * Slice levels
 * ===================================================================== */

/** Live logical state consulted when placing a whole slice or slice plan. */
interface SlicePlacementState {
  levels: readonly (readonly Slice[])[]
  bottomReservedSpans: readonly Span[]
}

interface SliceLevelBuild {
  sliceLevels: Slice[][]
  excludedSlices: Slice[]
}

/** Converts received segments to immutable whole slices in source order. */
function convertSegsToWholeSlices(
  segs: readonly Seg[],
): Slice[] {
  return segs.map((seg, orderIndex) => ({
    ...seg,
    orderIndex,
  }))
}

/** Builds at most `maxLevels`; rejected slices never enter level intersections. */
function buildSliceLevels(
  slices: readonly Slice[],
  maxLevels: number,
): SliceLevelBuild {
  const levels: Slice[][] = []
  const excludedSlices: Slice[] = []
  const placementState: SlicePlacementState = {
    levels,
    bottomReservedSpans: [],
  }

  for (const slice of slices) {
    const levelIndex = findInsertionLevel(slice, placementState)

    if (levelIndex === null) {
      if (levels.length < maxLevels) {
        levels.push([slice])
      } else {
        excludedSlices.push(slice)
      }
    } else {
      insertLaterally(levels[levelIndex], slice)
    }
  }

  return {
    sliceLevels: levels,
    excludedSlices,
  }
}

/** Removes selected slices while preserving surviving levels' relative order. */
function excludeSlicesFromLevels(
  inputSliceLevels: readonly (readonly Slice[])[],
  excludedSlices: ReadonlySet<Slice>,
): Slice[][] {
  const sliceLevels: Slice[][] = []

  for (const inputLevel of inputSliceLevels) {
    const level = inputLevel.filter((slice) => !excludedSlices.has(slice))

    if (level.length) {
      sliceLevels.push(level)
    }
  }
  return sliceLevels
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
    if (!intersectsAny(state.levels[levelIndex], slice)) {
      return levelIndex
    }
  }
  return null
}

/* ========================================================================
 * Whole-slice pixel safety
 * ===================================================================== */

/**
 * Builds a conservative safe plan from bounded, measured, pixel-admitted
 * whole slices and the slices omitted by earlier construction or resolution.
 *
 * Builder exclusions, pending slices, and ordinary pixel exclusions seed an
 * append-only hidden-slice worklist. Each hidden slice grows the more-link
 * reservation, and only its newly covered spans are inspected for admitted
 * slices that intrude into the reserved bottom band. Those victims are hidden
 * whole and later grow the reservation themselves.
 *
 * Coordinates deliberately remain those of the initial admitted structure
 * during the closure. Rebuilding only the survivors can move them upward, so
 * those stale bottoms may overreserve but cannot make the result unsafe.
 */
function buildWholePixelSafeLayout(
  initialSliceLevels: readonly (readonly Slice[])[],
  initialHiddenSlices: readonly Slice[],
  sliceCoords: SliceCoordMap,
  sliceHeights: SliceHeightMap,
  maxPixels: number,
  moreLinkHeight: number,
): LimitedLayout {
  const wholeSlices = initialSliceLevels.flat().sort(compareSlices)
  const hiddenSlices = [...initialHiddenSlices]
  const hiddenSet = new Set(initialHiddenSlices)
  const moreLinkSpans: Span[] = []
  const moreLinkEventMax = maxPixels - moreLinkHeight

  // Appending victims to this same array forms a monotonic worklist. Every
  // iteration either grows normalized coverage or merely records membership.
  for (
    let hiddenIndex = 0;
    hiddenIndex < hiddenSlices.length;
    hiddenIndex++
  ) {
    const hiddenSlice = hiddenSlices[hiddenIndex]
    const newMoreLinkSpans = growCoverage(moreLinkSpans, hiddenSlice)

    for (const newMoreLinkSpan of newMoreLinkSpans) {
      for (const slice of wholeSlices) {
        if (
          !hiddenSet.has(slice) &&
          intersectSpans(slice, newMoreLinkSpan) &&
          getSliceBottom(slice, sliceCoords, sliceHeights)! > moreLinkEventMax
        ) {
          hiddenSlices.push(slice)
          hiddenSet.add(slice)
        }
      }
    }
  }

  hiddenSlices.sort(compareSlices)

  return {
    sliceLevels: excludeSlicesFromLevels(initialSliceLevels, hiddenSet),
    hiddenSlices,
    moreLinkSpans,
  }
}

/** Tests exact candidate bottoms against the bottom-fixed more-link boundary. */
function isPixelCandidateValid(
  layout: ResolvedLimitedLayout,
  sliceHeights: SliceHeightMap,
  maxPixels: number,
  moreLinkHeight: number,
): boolean {
  if (layout.moreLinkSpans.length && moreLinkHeight > maxPixels) {
    return false
  }

  for (const level of layout.sliceLevels) {
    for (const slice of level) {
      if (
        intersectsAny(layout.moreLinkSpans, slice) &&
        getSliceBottom(slice, layout.sliceCoords, sliceHeights)! >
          maxPixels - moreLinkHeight
      ) {
        return false
      }
    }
  }

  return true
}

/* ========================================================================
 * Logical slice placement
 * ===================================================================== */

export interface LimitedLayout {
  sliceLevels: Slice[][]
  /** Deliberately flat. Final product-specific grouping is a later concern. */
  hiddenSlices: Slice[]
  /** Normalized lateral territory where a bottom-fixed more link exists. */
  moreLinkSpans: Span[]
}

/** Work alternates between attempting slices and reserving bottom link space. */
type Work =
  | { type: 'fire'; slice: Slice }
  | { type: 'moreLink'; span: Span }

/**
 * Fires extras into a fixed set of logical levels in source order. Pixel
 * candidates use no level tax because their safe plan already reserved link
 * space conservatively; level-limited layouts can reserve the bottom level.
 */
function placeExtraSlicesInLevels(
  initialSliceLevels: readonly (readonly Slice[])[],
  extraSlices: readonly Slice[],
  eventSlicing: boolean,
  moreLinkLevelTax: 0 | 1,
): LimitedLayout {
  const sliceLevels = initialSliceLevels.map((level) => [...level])
  const extras = [...extraSlices].sort(compareSlices)

  // Hidden membership remains flat and may overlap. The coverage accumulator
  // is its normalized union and records where a link has already been fired.
  const hiddenSlices: Slice[] = []
  const coverageAccumulator: Span[] = []
  const placementState: SlicePlacementState = {
    levels: sliceLevels,
    bottomReservedSpans: moreLinkLevelTax ? coverageAccumulator : [],
  }

  const work: Work[] = []

  pushFire(extras)

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

  return {
    sliceLevels,
    hiddenSlices,
    moreLinkSpans: coverageAccumulator,
  }

  /** Tries a whole insertion before considering scored same-level slices. */
  function fire(slice: Slice): void {
    const levelIndex = findInsertionLevel(slice, placementState)

    if (levelIndex !== null) {
      insertLaterally(sliceLevels[levelIndex], slice)
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
    for (const hiddenSlice of subtractCoveredFromSlice(slice, plan.slices)) {
      hide(hiddenSlice)
    }
  }

  /** Adds hidden membership and fires links only over new accumulator coverage. */
  function hide(slice: Slice): void {
    hiddenSlices.push(slice)

    // Only the set difference is fresh more-link territory; it can consist of
    // several disjoint runs.
    const newMoreLinkSpans = growCoverage(coverageAccumulator, slice)

    if (moreLinkLevelTax) {
      for (let i = newMoreLinkSpans.length - 1; i >= 0; i--) {
        work.push({ type: 'moreLink', span: newMoreLinkSpans[i] })
      }
    }
  }

  /**
   * Reserves the bottom logical level over fresh accumulator coverage. Because
   * the tax is exactly one, only slices in the final level can be displaced.
   */
  function fireMoreLink(span: Span): void {
    const taxedLevel = sliceLevels[sliceLevels.length - 1]
    const victims = findIntersectingSlicesInLevel(taxedLevel, span)

    // Removing right-to-left preserves every recorded index.
    for (let i = victims.length - 1; i >= 0; i--) {
      removeSliceFromLevel(taxedLevel, victims[i].index)
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
 * Slice-level coordinate resolution
 * ===================================================================== */

export type SliceHeightMap = ReadonlyMap<string, number>
export type SliceCoordMap = ReadonlyMap<string, number>

export interface ResolvedLimitedLayout extends LimitedLayout {
  sliceCoords: SliceCoordMap
  /** Slices the component must mount in its measurement layer. */
  pendingSlices: Slice[]
  /** Measured slices omitted because their bottoms exceeded the pixel limit. */
  excludedSlices: Slice[]
}

export interface SliceLevelCoordResolution {
  sliceLevels: Slice[][]
  sliceCoords: SliceCoordMap
  pendingSlices: Slice[]
  excludedSlices: Slice[]
}

/** Stable measurement and coordinate key for one exact lateral slice. */
export function getSliceKey(slice: Seg): string {
  return `${slice.id}:${slice.start}:${slice.end}`
}

/**
 * Inflates fixed logical levels while accumulating only measured slices that
 * fit within `maxPixels`. Later coordinates consult that admitted structure,
 * so excluding a lower slice can let a later slice move upward.
 */
export function resolveSliceLevelCoords(
  inputSliceLevels: readonly (readonly Slice[])[],
  sliceHeights: SliceHeightMap,
  maxPixels: number = Infinity,
): SliceLevelCoordResolution {
  const sliceLevels: Slice[][] = []
  const sliceCoords = new Map<string, number>()
  const pendingSlices: Slice[] = []
  const excludedSlices: Slice[] = []

  for (const inputLevel of inputSliceLevels) {
    const admittedLevel: Slice[] = []
    const admittedLevelIndex = sliceLevels.length

    for (const slice of inputLevel) {
      const sliceHeight = sliceHeights.get(getSliceKey(slice))

      if (sliceHeight === undefined) {
        pendingSlices.push(slice)
        continue
      }

      const sliceCoord = computeSliceCoord(
        sliceLevels,
        sliceCoords,
        sliceHeights,
        slice,
        admittedLevelIndex,
      )

      if (sliceCoord + sliceHeight <= maxPixels) {
        admittedLevel.push(slice)
        sliceCoords.set(getSliceKey(slice), sliceCoord)
      } else {
        excludedSlices.push(slice)
      }
    }

    if (admittedLevel.length) {
      sliceLevels.push(admittedLevel)
    }
  }

  return {
    sliceLevels,
    sliceCoords,
    pendingSlices,
    excludedSlices,
  }
}

/** Returns a measured slice's bottom, or `undefined` while it is pending. */
function getSliceBottom(
  slice: Slice,
  sliceCoords: SliceCoordMap,
  sliceHeights: SliceHeightMap,
): number | undefined {
  const key = getSliceKey(slice)
  const coord = sliceCoords.get(key)
  const height = sliceHeights.get(key)

  return coord === undefined || height === undefined
    ? undefined
    : coord + height
}

/** Computes one slice's top from intersecting slices in lower logical levels. */
function computeSliceCoord(
  sliceLevels: readonly (readonly Slice[])[],
  sliceCoords: SliceCoordMap,
  sliceHeights: SliceHeightMap,
  slice: Slice,
  levelIndex: number,
): number {
  let coord = 0

  for (let lowerLevelIndex = 0; lowerLevelIndex < levelIndex; lowerLevelIndex++) {
    for (const lowerSlice of sliceLevels[lowerLevelIndex]) {
      if (intersectSpans(lowerSlice, slice)) {
        const lowerBottom = getSliceBottom(
          lowerSlice,
          sliceCoords,
          sliceHeights,
        )

        if (lowerBottom !== undefined) {
          coord = Math.max(coord, lowerBottom)
        }
      }
    }
  }

  return coord
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

/** Grows normalized coverage and returns only the newly covered spans. */
function growCoverage(coverage: Span[], addition: Span): Span[] {
  const newSpans = subtractCovered(addition, coverage)

  addToUnion(coverage, addition)
  return newSpans
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
