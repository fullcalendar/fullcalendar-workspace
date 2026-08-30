/**
 * Pure event-positioning kernel implementing "safe repack".
 *
 * Source segs own identity and event order. Slices own only lateral geometry,
 * while their outer array index is their dimensionless level. Limiting stays
 * primarily in logical slice-level space; the pixel path builds a conservative
 * whole-slice baseline and accepts a speculatively repacked candidate only
 * after exact measurements validate it against the pixel boundary.
 */

import {
  type LateralSpan,
  addToUnion,
  doSpansIntersect,
  findIntersections,
  getSpanLength,
  insertLaterally,
  intersectSpans,
  subtractCoveredSpans,
} from './span-math'

/** Permissive epsilon for level-axis coordinate and budget comparisons. */
export const GEOMETRY_TOLERANCE = 0.000_001

/** Shared estimate for an event wrapper that has not reported a thickness. */
export const DEFAULT_UNMEASURED_EVENT_THICKNESS = 20

/** Shared estimate for a more-link wrapper that has not reported a thickness. */
export const DEFAULT_UNMEASURED_MORE_LINK_THICKNESS = 20

/**
 * What the kernel requires of a seg. Adapters satisfy it with the production
 * seg itself (DayGrid) or a projected copy of it carrying pixel geometry
 * (Timeline, TimeGrid) — never a wrapper around one.
 */
export interface SourceSeg extends LateralSpan {
  /** Stable whole-source key. Partial-slice keys derive from it (getSliceKey). */
  key: string
  isStart: boolean
  isEnd: boolean
  orderIndex: number
}

export interface Slice<S extends SourceSeg = SourceSeg> extends LateralSpan {
  sourceSeg: S
  isStart: boolean
  isEnd: boolean
}

/**
 * One independently rendered more link and the hidden slices it represents.
 * Members are in event order, one entry per hidden source, each spanning the
 * lateral hull of that source's hidden fragments so components can derive
 * start/end continuity from its coordinates.
 */
export interface HiddenSliceGroup<S extends SourceSeg = SourceSeg> extends LateralSpan {
  /** `getSliceKey(hiddenSlices[0])`; changes if the group's first slice changes. */
  key: string
  hiddenSlices: Slice<S>[]
}

/**
 * Identifies a whole or partial slice derived from a source seg. Partial keys
 * deliberately omit the lateral end so a fragment re-cut at the same start
 * keeps its DOM wrapper. The re-cut fragment transiently reuses the previous
 * cut's measurement, which can mis-validate one candidate; the structure still
 * settles, because the safe plan and every fragment cut depend only on whole
 * measurements — the same wrapper just re-reports at its new width and the
 * next pass corrects the accept/reject decision.
 */
export function getSliceKey<S extends SourceSeg>(slice: Slice<S>): string {
  if (!isPartialSlice(slice)) {
    return slice.sourceSeg.key
  }
  return `${slice.sourceSeg.key}:${slice.start}:slice`
}

export function isPartialSlice<S extends SourceSeg>(slice: Slice<S>): boolean {
  return slice.start !== slice.sourceSeg.start ||
    slice.end !== slice.sourceSeg.end
}

/* ========================================================================
 * Top-level layout entry points
 * ===================================================================== */

/** What every layout entry point returns, level-limited or pixel-limited. */
export interface SliceLayout<S extends SourceSeg = SourceSeg> {
  /** Every slice the component must mount, invisible measurement donors included. */
  renderSlices: Slice<S>[]
  hiddenGroups: HiddenSliceGroup<S>[]
  /** A mounted slice is visible exactly when its key has a coordinate here. */
  sliceCoords: Map<string, number>
  /**
   * Whether every render slice has a measurement, making this layout a fixed
   * point of the current heights: rerunning with the same inputs reproduces
   * it. Measurements themselves may still be re-reported later.
   */
  isSettled: boolean
}

/**
 * Streams at most `maxLevels` into the initial structure and fires every
 * rejected slice back at those levels in event order.
 *
 * With slicing disabled, a failed slice hides whole. With slicing enabled,
 * every level independently offers its maximal free runs and the winning plan
 * balances exposed length against fragmentation. Every hidden slice grows a
 * coverage accumulator; with a level tax, only newly covered runs reserve the
 * bottom event level for a more link, evicting any slice already there.
 */
export function buildLevelLimitedLayout<S extends SourceSeg>(
  segs: readonly S[],
  eventOrderStrict: boolean,
  eventSlicing: boolean,
  maxLevels: number,
  moreLinkLevelTax: number,
  sliceHeights: ReadonlyMap<string, number>,
): SliceLayout<S> {
  const { segLevels, excludedSegs } = buildSegLevels(
    segs,
    eventOrderStrict,
    maxLevels,
  )
  const placement = placeExtraSlicesInLevels(
    convertSegLevelsToWholeSlices(segLevels),
    convertSegsToWholeSlices(excludedSegs),
    eventOrderStrict,
    eventSlicing,
    moreLinkLevelTax,
  )
  const resolution = resolveLevelCoords(
    placement.sliceLevels,
    sliceHeights,
  )

  return {
    renderSlices: placement.sliceLevels.flat(),
    hiddenGroups: placement.hiddenGroups,
    sliceCoords: resolution.sliceCoords,
    isSettled: !resolution.pendingSlices.length,
  }
}

/**
 * Builds and resolves a safe whole-only layout, then attempts and resolves its
 * extras with the logical slicing algorithm. While candidate measurements are
 * pending, the safe topology remains selected. Candidate-only slices remain
 * mounted in the measurement layer even after rejection, preventing repeated
 * mount-measure-reject cycles. A fully measured candidate replaces the safe
 * layout only when valid.
 *
 * `neededLevelCount` bounds the initial DOM whole-slice candidates; later
 * slices begin hidden and unmeasured.
 */
export function buildPixelLimitedLayout<S extends SourceSeg>(
  segs: readonly S[],
  eventOrderStrict: boolean,
  eventSlicing: boolean,
  sliceHeights: ReadonlyMap<string, number>,
  canvasHeight: number | undefined,
  neededLevelCount: number,
  moreLinkHeight: number | undefined,
): SliceLayout<S> {
  const { segLevels, excludedSegs } = buildSegLevels(
    segs,
    eventOrderStrict,
    neededLevelCount,
  )
  const domWholeSliceLevels = convertSegLevelsToWholeSlices(segLevels)
  const domExcludedSlices = convertSegsToWholeSlices(excludedSegs)
  const wholeResolution = resolveLevelCoords(
    domWholeSliceLevels,
    sliceHeights,
    canvasHeight,
  )

  // Until the canvas and the link probe report a size, mount only the bounded
  // whole-slice frontier so its measurements can arrive.
  if (canvasHeight == null || moreLinkHeight == null) {
    return {
      renderSlices: domWholeSliceLevels.flat(),
      hiddenGroups: groupLaterallyIntersecting(domExcludedSlices),
      sliceCoords: wholeResolution.sliceCoords,
      isSettled: !wholeResolution.pendingSlices.length,
    }
  }

  // Frontier wholes awaiting measurement are deliberately not hidden: their
  // fate is undetermined, so they must not count toward any more link. They
  // mount as invisible donors and join the layout once measured. Wholes
  // beyond the frontier are different: they failed logical whole placement
  // regardless of height, so they belong in the hidden stream unmeasured.
  const initialHiddenSlices = domExcludedSlices.concat(
    wholeResolution.excludedSlices,
  )

  // More links always render. When one consumes the full budget or more, zero
  // is the deepest coordinate an intersecting event may reach.
  const moreLinkEventMax = Math.max(0, canvasHeight - moreLinkHeight)

  const safeLayout = buildWholePixelSafeLayout(
    wholeResolution.placementSliceLevels,
    initialHiddenSlices,
    wholeResolution.sliceCoords,
    sliceHeights,
    moreLinkEventMax,
  )
  const safeResolution = resolveLevelCoords(
    safeLayout.sliceLevels,
    sliceHeights,
  )

  const candidate = placeExtraSlicesInLevels(
    safeLayout.sliceLevels,
    safeLayout.hiddenSlices,
    eventOrderStrict,
    eventSlicing,
    0,
  )
  const candidateResolution = resolveLevelCoords(
    candidate.sliceLevels,
    sliceHeights,
    canvasHeight,
  )

  // Every DOM-frontier whole stays mounted no matter its fate, alongside
  // every candidate-added slice. A production measurement lives only while
  // its wrapper is mounted, so unmounting a measured-but-rejected slice would
  // delete the very measurement that rejected it and start a
  // mount-measure-reject oscillation. Slices without a coordinate render
  // invisible.
  const renderSlices = compilePixelRenderSlices(
    domWholeSliceLevels,
    candidate.addedSlices,
  )

  // Frontier wholes resolve in the whole pass and every candidate-added slice
  // resolves in the candidate pass, so together the two cover the render set.
  const isSettled = !wholeResolution.pendingSlices.length &&
    !candidateResolution.pendingSlices.length

  if (
    !candidateResolution.pendingSlices.length &&
    !candidateResolution.excludedSlices.length &&
    isPixelCandidateValid(
      candidateResolution.placementSliceLevels,
      candidate.hiddenGroups,
      candidateResolution.sliceCoords,
      sliceHeights,
      moreLinkEventMax,
    )
  ) {
    return {
      renderSlices,
      hiddenGroups: candidate.hiddenGroups,
      sliceCoords: candidateResolution.sliceCoords,
      isSettled,
    }
  }

  // The safe topology stays visibly selected until a candidate is accepted.
  return {
    renderSlices,
    hiddenGroups: finalizeHiddenGroups(safeLayout.moreLinkGroups),
    sliceCoords: safeResolution.sliceCoords,
    isSettled,
  }
}

/**
 * The pixel render set: every DOM-frontier whole (visible, pending, excluded,
 * or hidden) plus every slice the candidate placement added. Extras re-placed
 * whole by the candidate reuse their frontier slice object, so identity
 * deduplication suffices.
 */
function compilePixelRenderSlices<S extends SourceSeg>(
  domWholeSliceLevels: readonly (readonly Slice<S>[])[],
  addedSlices: readonly Slice<S>[],
): Slice<S>[] {
  const renderSlices = domWholeSliceLevels.flat()
  const renderSet = new Set(renderSlices)

  for (const slice of addedSlices) {
    if (!renderSet.has(slice)) {
      renderSlices.push(slice)
    }
  }
  return renderSlices
}

/* ========================================================================
 * Whole-source level construction
 * ===================================================================== */

/** Builds whole-source logical levels without consulting any dimensions. */
export function buildSegLevels<S extends SourceSeg>(
  segs: readonly S[],
  eventOrderStrict: boolean,
  maxLevels: number = Infinity,
): {
  segLevels: S[][]
  excludedSegs: S[]
} {
  const segLevels: S[][] = []
  const excludedSegs: S[] = []

  for (const seg of segs) {
    let levelIndex = 0

    if (eventOrderStrict) {
      for (let i = 0; i < segLevels.length; i++) {
        if (findIntersections(segLevels[i], seg).length) {
          levelIndex = i + 1
        }
      }
    } else {
      while (
        levelIndex < segLevels.length &&
        findIntersections(segLevels[levelIndex], seg).length
      ) {
        levelIndex++
      }
    }

    if (levelIndex >= maxLevels) {
      excludedSegs.push(seg)
    } else {
      while (segLevels.length <= levelIndex) {
        segLevels.push([])
      }
      insertLaterally(segLevels[levelIndex], seg)
    }
  }

  return { segLevels, excludedSegs }
}

export function convertSegLevelsToWholeSlices<S extends SourceSeg>(
  segLevels: readonly (readonly S[])[],
): Slice<S>[][] {
  return segLevels.map((level) => convertSegsToWholeSlices(level))
}

export function convertSegsToWholeSlices<S extends SourceSeg>(
  segs: readonly S[],
): Slice<S>[] {
  return segs.map(createWholeSlice)
}

/* ========================================================================
 * Slice-level coordinate resolution
 * ===================================================================== */

/**
 * Resolves fixed logical levels without changing level membership or slices.
 * An unmeasured slice stays pending; a measured bounded rejection is final.
 * Neither blocks later traversal entries, so excluding a lower slice can let
 * a later slice move upward.
 */
export function resolveLevelCoords<S extends SourceSeg>(
  sliceLevels: readonly (readonly Slice<S>[])[],
  sliceHeights: ReadonlyMap<string, number>,
  maxPixels: number = Infinity,
): {
  placementSliceLevels: Slice<S>[][]
  sliceCoords: Map<string, number>
  pendingSlices: Slice<S>[]
  excludedSlices: Slice<S>[]
} {
  const placementSliceLevels = sliceLevels.map(() => [] as Slice<S>[])
  const placedSlices: Slice<S>[] = []
  const sliceCoords = new Map<string, number>()
  const pendingSlices: Slice<S>[] = []
  const excludedSlices: Slice<S>[] = []

  for (let levelIndex = 0; levelIndex < sliceLevels.length; levelIndex++) {
    for (const slice of sliceLevels[levelIndex]) {
      const sliceHeight = sliceHeights.get(getSliceKey(slice))
      if (sliceHeight === undefined) {
        pendingSlices.push(slice)
        continue
      }
      // The flat placed list may include same-level slices, which never
      // laterally intersect the incoming slice, so only prior levels weigh in.
      const levelCoord = computeLateralSpanBottom(
        placedSlices,
        slice,
        sliceCoords,
        sliceHeights,
      )

      if (
        levelCoord + sliceHeight <=
          maxPixels + GEOMETRY_TOLERANCE
      ) {
        placementSliceLevels[levelIndex].push(slice)
        placedSlices.push(slice)
        sliceCoords.set(getSliceKey(slice), levelCoord)
      } else {
        excludedSlices.push(slice)
      }
    }
  }

  return { placementSliceLevels, sliceCoords, pendingSlices, excludedSlices }
}

/** Deepest measured, coordinated bottom among slices touching the span. */
export function computeLateralSpanBottom<S extends SourceSeg>(
  slices: readonly Slice<S>[],
  span: LateralSpan,
  sliceCoords: ReadonlyMap<string, number>,
  sliceHeights: ReadonlyMap<string, number>,
): number {
  let bottom = 0

  for (const slice of slices) {
    if (doSpansIntersect(slice, span)) {
      const key = getSliceKey(slice)
      const sliceTop = sliceCoords.get(key)
      const sliceHeight = sliceHeights.get(key)
      if (sliceTop !== undefined && sliceHeight !== undefined) {
        bottom = Math.max(bottom, sliceTop + sliceHeight)
      }
    }
  }

  return bottom
}

/** Returns a measured slice's bottom, or `undefined` while it is pending. */
function getSliceBottom<S extends SourceSeg>(
  slice: Slice<S>,
  sliceCoords: ReadonlyMap<string, number>,
  sliceHeights: ReadonlyMap<string, number>,
): number | undefined {
  const key = getSliceKey(slice)
  const coord = sliceCoords.get(key)
  const height = sliceHeights.get(key)

  return coord === undefined || height === undefined
    ? undefined
    : coord + height
}

/* ========================================================================
 * Whole-slice pixel safety
 * ===================================================================== */

interface LogicalLayout<S extends SourceSeg> {
  sliceLevels: Slice<S>[][]
  /** Deliberately flat for event-order and whole-layout operations. */
  hiddenSlices: Slice<S>[]
  /** Strictly intersecting hidden slices grouped for individual more links. */
  moreLinkGroups: RawHiddenGroup<S>[]
}

/**
 * Builds a conservative safe plan from bounded, measured, pixel-admitted
 * whole slices and the slices omitted by earlier construction or resolution.
 *
 * Builder exclusions and ordinary pixel exclusions seed an append-only
 * hidden-slice worklist. Each hidden slice grows the more-link reservation,
 * and only its newly covered spans are inspected for admitted slices that
 * intrude into the reserved bottom band. Those victims are hidden whole and
 * later grow the reservation themselves.
 *
 * Coordinates deliberately remain those of the initial admitted structure
 * during the closure. Rebuilding only the survivors can move them upward, so
 * those stale bottoms may overreserve but cannot make the result unsafe.
 */
function buildWholePixelSafeLayout<S extends SourceSeg>(
  initialSliceLevels: readonly (readonly Slice<S>[])[],
  initialHiddenSlices: readonly Slice<S>[],
  sliceCoords: ReadonlyMap<string, number>,
  sliceHeights: ReadonlyMap<string, number>,
  moreLinkEventMax: number,
): LogicalLayout<S> {
  const wholeSlices = sortByEventOrder(initialSliceLevels.flat())
  const hiddenSlices = [...initialHiddenSlices]
  const hiddenSet = new Set(initialHiddenSlices)
  const moreLinkGroups: RawHiddenGroup<S>[] = []

  // Appending victims to this same array forms a monotonic worklist. Every
  // iteration either grows covered territory or merely records membership.
  for (
    let hiddenIndex = 0;
    hiddenIndex < hiddenSlices.length;
    hiddenIndex++
  ) {
    const newMoreLinkSpans = addHiddenSliceToGroups(
      moreLinkGroups,
      hiddenSlices[hiddenIndex],
    )

    for (const newMoreLinkSpan of newMoreLinkSpans) {
      for (const slice of wholeSlices) {
        if (
          !hiddenSet.has(slice) &&
          intersectSpans(slice, newMoreLinkSpan) &&
          getSliceBottom(slice, sliceCoords, sliceHeights)! >
            moreLinkEventMax + GEOMETRY_TOLERANCE
        ) {
          hiddenSlices.push(slice)
          hiddenSet.add(slice)
        }
      }
    }
  }

  hiddenSlices.sort(compareByEventOrder)

  return {
    sliceLevels: excludeSlicesFromLevels(initialSliceLevels, hiddenSet),
    hiddenSlices,
    moreLinkGroups,
  }
}

/** Tests exact candidate bottoms against the bottom-fixed more-link boundary. */
function isPixelCandidateValid<S extends SourceSeg>(
  sliceLevels: readonly (readonly Slice<S>[])[],
  moreLinkGroups: readonly RawHiddenGroup<S>[],
  sliceCoords: ReadonlyMap<string, number>,
  sliceHeights: ReadonlyMap<string, number>,
  moreLinkEventMax: number,
): boolean {
  for (const level of sliceLevels) {
    for (const slice of level) {
      if (
        findIntersections(moreLinkGroups, slice).length &&
        getSliceBottom(slice, sliceCoords, sliceHeights)! >
          moreLinkEventMax + GEOMETRY_TOLERANCE
      ) {
        return false
      }
    }
  }

  return true
}

/** Removes selected slices while preserving surviving levels' relative order. */
function excludeSlicesFromLevels<S extends SourceSeg>(
  inputSliceLevels: readonly (readonly Slice<S>[])[],
  excludedSlices: ReadonlySet<Slice<S>>,
): Slice<S>[][] {
  const sliceLevels: Slice<S>[][] = []

  for (const inputLevel of inputSliceLevels) {
    const level = inputLevel.filter((slice) => !excludedSlices.has(slice))

    if (level.length) {
      sliceLevels.push(level)
    }
  }
  return sliceLevels
}

/* ========================================================================
 * Logical slice placement
 * ===================================================================== */

/** Live logical state consulted when placing a whole slice or slice plan. */
interface SlicePlacementState<S extends SourceSeg> {
  levels: readonly (readonly Slice<S>[])[]
  bottomReservedSpans: readonly LateralSpan[]
  eventOrderStrict: boolean
}

export interface ExtraSlicePlacement<S extends SourceSeg> {
  /** Final logical topology, hidden slices excluded. */
  sliceLevels: Slice<S>[][]
  /** Flat hidden membership, in event order of hiding. */
  hiddenSlices: Slice<S>[]
  hiddenGroups: HiddenSliceGroup<S>[]
  /** Slices in the final topology that were not in the received levels. */
  addedSlices: Slice<S>[]
}

/** Work alternates between attempting slices and reserving bottom link space. */
type PlacementWork<S extends SourceSeg> =
  | { type: 'fire', slice: Slice<S> }
  | { type: 'moreLink', span: LateralSpan }

/**
 * Fires extras into a fixed set of logical levels in event order. Repacking
 * may reuse gaps in the received levels but never creates additional levels.
 * Pixel candidates use no level tax because their safe plan already reserved
 * link space conservatively; level-limited layouts can reserve the bottom
 * level.
 */
export function placeExtraSlicesInLevels<S extends SourceSeg>(
  initialSliceLevels: readonly (readonly Slice<S>[])[],
  extraSlices: readonly Slice<S>[],
  eventOrderStrict: boolean,
  eventSlicing: boolean,
  moreLinkLevelTax: number,
): ExtraSlicePlacement<S> {
  const sliceLevels = initialSliceLevels.map((level) => [...level])
  const extras = sortByEventOrder(extraSlices)
  const addedSliceSet = new Set<Slice<S>>()

  // Hidden membership remains flat for whole-layout operations. More-link
  // groups duplicate that membership locally while also recording which
  // lateral territory has already fired its link tax.
  const hiddenSlices: Slice<S>[] = []
  const moreLinkGroups: RawHiddenGroup<S>[] = []
  const placementState: SlicePlacementState<S> = {
    levels: sliceLevels,
    bottomReservedSpans: moreLinkLevelTax ? moreLinkGroups : [],
    eventOrderStrict,
  }

  const work: PlacementWork<S>[] = []

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
    hiddenGroups: finalizeHiddenGroups(moreLinkGroups),
    addedSlices: [...addedSliceSet],
  }

  /** Tries a whole insertion before considering scored same-level slices. */
  function fire(slice: Slice<S>): void {
    const levelIndex = findInsertionLevel(slice, placementState)

    if (levelIndex !== null) {
      insertLaterally(sliceLevels[levelIndex], slice)
      addedSliceSet.add(slice)
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
      addedSliceSet.add(visibleSlice)
    }
    for (const hiddenSlice of subtractSpansFromSlice(slice, plan.slices)) {
      hide(hiddenSlice)
    }
  }

  /** Adds hidden membership and fires links only over new accumulator coverage. */
  function hide(slice: Slice<S>): void {
    hiddenSlices.push(slice)

    // Only the set difference is fresh more-link territory; it can consist of
    // several disjoint runs.
    const newMoreLinkSpans = addHiddenSliceToGroups(moreLinkGroups, slice)

    if (moreLinkLevelTax) {
      for (let i = newMoreLinkSpans.length - 1; i >= 0; i--) {
        work.push({ type: 'moreLink', span: newMoreLinkSpans[i] })
      }
    }
  }

  /**
   * Reserves the bottom logical level over fresh accumulator coverage. Because
   * the tax is exactly one level, only slices in the final level can be
   * displaced.
   */
  function fireMoreLink(span: LateralSpan): void {
    if (!sliceLevels.length) {
      return
    }

    const taxedLevel = sliceLevels[sliceLevels.length - 1]
    const victims = findIntersections(taxedLevel, span)

    for (const victim of victims) {
      taxedLevel.splice(taxedLevel.indexOf(victim), 1)
      addedSliceSet.delete(victim)

      if (eventSlicing) {
        hide(intersectSlice(victim, span)!)
        pushFire(subtractSpansFromSlice(victim, [span]))
      } else {
        hide(victim)
      }
    }
  }

  /** Reversing preserves received order on the LIFO work stack. */
  function pushFire(slices: readonly Slice<S>[]): void {
    for (let i = slices.length - 1; i >= 0; i--) {
      work.push({ type: 'fire', slice: slices[i] })
    }
  }
}

/** Returns the shallowest vacant level within the slice's fence, if any. */
function findInsertionLevel<S extends SourceSeg>(
  slice: Slice<S>,
  state: SlicePlacementState<S>,
): number | null {
  const fence = computeLevelFence(slice, state)

  for (
    let levelIndex = fence.min;
    levelIndex < fence.maxExclusive;
    levelIndex++
  ) {
    if (!findIntersections(state.levels[levelIndex], slice).length) {
      return levelIndex
    }
  }
  return null
}

/**
 * The level range where a slice may legally sit. The bottom reservation
 * closes the final level over link coverage; strict event order additionally
 * fences against intersecting neighbors' order.
 *
 * The pre-kernel SegHierarchy needed no upper fence: it inserted everything
 * in event order, so "stay below anything you touch" sufficed. Repacking
 * fires rejected extras after later-ordered slices are already committed,
 * which is what makes strict order two-sided here.
 */
function computeLevelFence<S extends SourceSeg>(
  slice: Slice<S>,
  state: SlicePlacementState<S>,
): { min: number, maxExclusive: number } {
  const { levels } = state
  let min = 0
  let maxExclusive = levels.length - Number(
    findIntersections(state.bottomReservedSpans, slice).length > 0,
  )

  if (state.eventOrderStrict) {
    for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
      for (const other of findIntersections(levels[levelIndex], slice)) {
        if (other.sourceSeg.orderIndex < slice.sourceSeg.orderIndex) {
          min = Math.max(min, levelIndex + 1)
        } else if (other.sourceSeg.orderIndex > slice.sourceSeg.orderIndex) {
          maxExclusive = Math.min(maxExclusive, levelIndex)
        }
      }
    }
  }

  return { min, maxExclusive }
}

/* ========================================================================
 * Slice plans
 * ===================================================================== */

const MAX_SLICES_PER_PLAN = 3
const EXTRA_SLICE_PENALTY = 0.15

/** One hypothetical sliced insertion, confined to a single logical level. */
interface SlicePlan<S extends SourceSeg> {
  levelIndex: number
  slices: Slice<S>[]
  score: number
}

/**
 * Scores the best one-, two-, or three-run insertion offered by each level.
 * Runs from different levels are deliberately never mixed into one plan.
 */
function findBestSlicePlan<S extends SourceSeg>(
  slice: Slice<S>,
  state: SlicePlacementState<S>,
): SlicePlan<S> | null {
  let selected: SlicePlan<S> | null = null
  const sourceLength = getSpanLength(slice)

  for (let levelIndex = 0; levelIndex < state.levels.length; levelIndex++) {
    // findIntersections returns a fresh, start-sorted array, and addToUnion
    // replaces array contents without ever mutating a member, so bottom-link
    // coverage can be folded in without touching the actual level.
    const blockers: LateralSpan[] = findIntersections(
      state.levels[levelIndex],
      slice,
    )
    if (levelIndex === state.levels.length - 1) {
      for (const span of state.bottomReservedSpans) {
        addToUnion(blockers, span)
      }
    }

    const runs = subtractSpansFromSlice(slice, blockers)
      .filter((run) => isWithinLevelFence(run, levelIndex, state))
      .sort((a, b) => getSpanLength(b) - getSpanLength(a) || a.start - b.start)
    let visibleLength = 0

    for (
      let sliceCount = 1;
      sliceCount <= Math.min(MAX_SLICES_PER_PLAN, runs.length);
      sliceCount++
    ) {
      visibleLength += getSpanLength(runs[sliceCount - 1])
      const candidate: SlicePlan<S> = {
        levelIndex,
        slices: runs.slice(0, sliceCount).sort(compareByEventOrder),
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

/** Whether a slice may legally sit at this level, per its own fence. */
function isWithinLevelFence<S extends SourceSeg>(
  slice: Slice<S>,
  levelIndex: number,
  state: SlicePlacementState<S>,
): boolean {
  const fence = computeLevelFence(slice, state)

  return levelIndex >= fence.min && levelIndex < fence.maxExclusive
}

/** Comparison: score, then less fragmentation, then the shallower level. */
function isBetterSlicePlan<S extends SourceSeg>(
  candidate: SlicePlan<S>,
  current: SlicePlan<S> | null,
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
 * More-link groups
 * ===================================================================== */

/**
 * Internal accumulator group: a maximal strict-intersection component of
 * hidden slices, which can hold several fragments of one source. Sorted
 * group lists double as coverage sets for span geometry.
 */
interface RawHiddenGroup<S extends SourceSeg> extends LateralSpan {
  hiddenSlices: Slice<S>[]
}

/** Merges strict lateral intersections into component-facing groups. */
export function groupLaterallyIntersecting<S extends SourceSeg>(
  hiddenSlices: readonly Slice<S>[],
): HiddenSliceGroup<S>[] {
  const groups: RawHiddenGroup<S>[] = []

  for (const slice of hiddenSlices) {
    addHiddenSliceToGroups(groups, slice)
  }
  return finalizeHiddenGroups(groups)
}

/**
 * Adds one hidden slice to its strict-intersection component and returns only
 * the newly covered spans. Exactly adjacent groups deliberately stay separate
 * because each group corresponds to one independently rendered more link.
 * The group list remains sorted by lateral start.
 */
function addHiddenSliceToGroups<S extends SourceSeg>(
  groups: RawHiddenGroup<S>[],
  slice: Slice<S>,
): LateralSpan[] {
  const newSpans = subtractCoveredSpans(slice, groups)
  const untouchedGroups: RawHiddenGroup<S>[] = []
  const mergedSlices: Slice<S>[] = [slice]
  let start = slice.start
  let end = slice.end

  for (const group of groups) {
    if (intersectSpans(group, slice)) {
      mergedSlices.push(...group.hiddenSlices)
      start = Math.min(start, group.start)
      end = Math.max(end, group.end)
    } else {
      untouchedGroups.push(group)
    }
  }

  mergedSlices.sort(compareByEventOrder)
  untouchedGroups.push({ start, end, hiddenSlices: mergedSlices })
  untouchedGroups.sort((a, b) => a.start - b.start)
  groups.splice(0, groups.length, ...untouchedGroups)

  return newSpans
}

/**
 * Compiles internal accumulator groups for components: one entry per hidden
 * source event, in event order, spanning that source's fragment hull.
 */
function finalizeHiddenGroups<S extends SourceSeg>(
  groups: readonly RawHiddenGroup<S>[],
): HiddenSliceGroup<S>[] {
  return groups.map((group) => {
    const hiddenSlices = mergeAdjacentSlices(group.hiddenSlices)

    return {
      key: getSliceKey(hiddenSlices[0]),
      start: group.start,
      end: group.end,
      hiddenSlices,
    }
  })
}

/* ========================================================================
 * Slice utilities
 * ===================================================================== */

export function compareByEventOrder<S extends SourceSeg>(
  a: Slice<S>,
  b: Slice<S>,
): number {
  return a.sourceSeg.orderIndex - b.sourceSeg.orderIndex ||
    a.start - b.start ||
    a.end - b.end
}

export function sortByEventOrder<S extends SourceSeg>(
  slices: readonly Slice<S>[],
): Slice<S>[] {
  return [...slices].sort(compareByEventOrder)
}

/**
 * Collapses same-source runs of an event-ordered slice list into one slice
 * per run spanning the run's lateral hull. The hull can bridge territory
 * where the source is actually visible; consumers derive start/end
 * continuity from the outermost hidden edges, not exact hidden coverage.
 */
function mergeAdjacentSlices<S extends SourceSeg>(
  slices: readonly Slice<S>[],
): Slice<S>[] {
  const merged: Slice<S>[] = []

  for (const slice of slices) {
    const previous = merged[merged.length - 1]

    if (previous && previous.sourceSeg === slice.sourceSeg) {
      merged[merged.length - 1] = createNarrowerSlice(
        createWholeSlice(previous.sourceSeg),
        previous.start,
        Math.max(previous.end, slice.end),
      )
    } else {
      merged.push(slice)
    }
  }
  return merged
}

/**
 * Removes covered spans from a slice, returning identity-preserving
 * remainders. Like `subtractCoveredSpans`, the covered spans must be sorted
 * by start and pairwise non-overlapping — every caller already holds them
 * that way (plan slices, union blockers, a single span).
 */
function subtractSpansFromSlice<S extends SourceSeg>(
  slice: Slice<S>,
  covered: readonly LateralSpan[],
): Slice<S>[] {
  return subtractCoveredSpans(slice, covered).map((span) =>
    createNarrowerSlice(slice, span.start, span.end),
  )
}

/** Finds the strict intersection while retaining source identity. */
function intersectSlice<S extends SourceSeg>(
  slice: Slice<S>,
  barrier: LateralSpan,
): Slice<S> | null {
  const intersection = intersectSpans(slice, barrier)

  return intersection
    ? createNarrowerSlice(slice, intersection.start, intersection.end)
    : null
}

function createWholeSlice<S extends SourceSeg>(
  sourceSeg: S,
): Slice<S> {
  return {
    sourceSeg,
    start: sourceSeg.start,
    end: sourceSeg.end,
    isStart: sourceSeg.isStart,
    isEnd: sourceSeg.isEnd,
  }
}

function createNarrowerSlice<S extends SourceSeg>(
  parent: Slice<S>,
  start: number,
  end: number,
): Slice<S> {
  return {
    sourceSeg: parent.sourceSeg,
    start,
    end,
    isStart: parent.isStart && start === parent.start,
    isEnd: parent.isEnd && end === parent.end,
  }
}
