import {
  type Placement,
  type Slice,
  type SliceOptions,
  type SourceSeg,
  DEFAULT_UNMEASURED_EVENT_THICKNESS,
  createWholeSlice,
  doesSliceCoverWholeSource,
  getLateralCellRange,
  planDomCandidatesByMaxLevel,
  positionSegs,
} from '../seg-placement/layout'
import {
  type DayGridLimitResult,
  type DayGridLimits,
  limitDayGridLayout,
} from '../seg-placement/daygrid'
import {
  type DayRowEventRange,
  type DayRowEventRangePart,
  getEventPartKey,
  sliceSegForCol,
} from './TableSeg'

export type DayGridEventSeg = DayRowEventRange

const DAYGRID_SLICE_OPTIONS = {
  maxSlices: 3,
  minSliceLength: 1,
} as const

export interface DayGridSegPlacementPlan {
  /** The sorted production input retained for the eventual component cutover. */
  eventOrderedSegs: DayGridEventSeg[]
  /** Every source in resolved event order, including sources that will not mount. */
  sourceSegs: SourceSeg<DayGridEventSeg>[]
  /** Complete source wrappers admitted for measurement. */
  mountedSegs: SourceSeg<DayGridEventSeg>[]
  /** One whole slice for every source rejected before measurement. */
  unmountedSlices: Slice<DayGridEventSeg>[]
  maxLevels: number
  orderStrict: boolean
  eventSlicing: boolean
}

export interface DayGridSegPlacement {
  sourceKey: string
  seg: DayRowEventRangePart
  top: number
  thickness: number
  isWhole: boolean
}

export interface DayGridSegPlacementColumn {
  column: number
  /** Visible wrappers owned by this start column, in resolved event order. */
  placements: DayGridSegPlacement[]
  /** Every source intersecting this column, cut to the column for more-link APIs. */
  segs: DayRowEventRangePart[]
  /** Candidate-unmounted and measured-hidden sources intersecting this column. */
  hiddenSegs: DayRowEventRangePart[]
}

export interface DayGridSegPlacementResult {
  limited: DayGridLimitResult<DayGridEventSeg>
  columns: DayGridSegPlacementColumn[]
}

export interface DayGridPlacementOwnerState {
  smallestEventHeight: number | null
  /**
   * Largest observed height of the space foreground events actually compete
   * for, which excludes the day-number header above it. A row's complete
   * height would overstate capacity by that header.
   */
  largestEventAreaHeight: number | null
  maxDomLevels: number
  largestMoreLinkHeight: number
}

const DEFAULT_UNMEASURED_EVENT_AREA_HEIGHT = 150

/** Converts sorted production ranges into the shared source vocabulary. */
export function buildDayGridSegSources(
  eventOrderedSegs: readonly DayGridEventSeg[],
): SourceSeg<DayGridEventSeg>[] {
  return eventOrderedSegs.map((seg, orderIndex) => ({
    key: getEventPartKey(seg),
    start: seg.start,
    end: seg.end,
    isStart: seg.isStart,
    isEnd: seg.isEnd,
    meta: seg,
    orderIndex,
  }))
}

/**
 * Chooses complete event wrappers for the DOM using dimensionless geometry.
 *
 * Provisional slices are deliberately discarded. If any piece of a source is
 * visible, its complete source wrapper mounts so the measured pass can
 * reconsider it with its real occupied height.
 */
export function buildDayGridSegPlacementPlan(
  eventOrderedSegs: DayGridEventSeg[],
  maxLevels: number,
  orderStrict: boolean,
  eventSlicing: boolean,
): DayGridSegPlacementPlan {
  const sourceSegs = buildDayGridSegSources(eventOrderedSegs)
  const candidatePlan = planDomCandidatesByMaxLevel(
    sourceSegs,
    maxLevels,
    buildSliceOptions(orderStrict, eventSlicing),
  )
  const mountedKeys = new Set(candidatePlan.mountedSegs.map((source) => source.key))

  return {
    eventOrderedSegs,
    sourceSegs,
    mountedSegs: candidatePlan.mountedSegs,
    // The candidate plan's hidden geometry can contain only one provisional
    // piece of a source that did mount. Rebuild from complete sources so this
    // collection means exactly "never mounted".
    unmountedSlices: sourceSegs
      .filter((source) => !mountedKeys.has(source.key))
      .map((source) => createWholeSlice(source)),
    maxLevels,
    orderStrict,
    eventSlicing,
  }
}

/**
 * Repositions every mounted source from complete occupied wrapper heights.
 * Returns null while any admitted wrapper is still awaiting measurement.
 */
export function buildDayGridSegPlacements(
  plan: DayGridSegPlacementPlan,
  segHeights: ReadonlyMap<string, number>,
  limits: Omit<DayGridLimits, 'initialHiddenSpans'>,
): DayGridSegPlacementResult | null {
  if (plan.mountedSegs.some((source) => segHeights.get(source.key) == null)) {
    return null
  }

  const unrestricted = positionSegs(
    plan.mountedSegs,
    segHeights,
    { orderStrict: plan.orderStrict },
  )
  const limited = limitDayGridLayout(
    unrestricted,
    {
      ...limits,
      initialHiddenSpans: plan.unmountedSlices,
    },
    buildSliceOptions(plan.orderStrict, plan.eventSlicing),
  )

  return {
    limited,
    columns: buildPlacementColumns(plan, limited, limits.columnCount),
  }
}

/**
 * Projects one column's all/hidden more-link inputs from shared geometry.
 *
 * Hidden membership comes from the candidate and measured fragments. The
 * returned production seg always comes from the complete source and is cut to
 * the requested column, so limiter-created boundaries never masquerade as
 * real event boundaries.
 */
export function buildDayGridPopoverSegs(
  plan: DayGridSegPlacementPlan,
  measuredHiddenSlices: readonly Slice<DayGridEventSeg>[],
  column: number,
  columnCount: number,
): {
  segs: DayRowEventRangePart[]
  hiddenSegs: DayRowEventRangePart[]
} {
  const hiddenKeys = new Set<string>()

  // make a hiddenSegs whitelist, for later
  // the later loop is driven by plan.sourceSegs, so correctly ordered for popover
  for (const slice of [...plan.unmountedSlices, ...measuredHiddenSlices]) {
    if (intersectsColumn(slice, column, columnCount)) {
      hiddenKeys.add(slice.sourceSeg.key)
    }
  }

  // for (all)segs. already ordered for popover
  const columnSources = plan.sourceSegs.filter((source) =>
    intersectsColumn(source, column, columnCount))

  return {
    segs: columnSources.map((source) => sliceSegForCol(source.meta, column)),
    hiddenSegs: columnSources
      .filter((source) => hiddenKeys.has(source.key))
      .map((source) => sliceSegForCol(source.meta, column)),
  }
}

/** Initial monotone owner state for one DayGridRows component lifetime. */
export function createDayGridPlacementOwnerState(): DayGridPlacementOwnerState {
  return {
    smallestEventHeight: null,
    largestEventAreaHeight: null,
    maxDomLevels: estimateLevelCapacity(
      DEFAULT_UNMEASURED_EVENT_AREA_HEIGHT,
      DEFAULT_UNMEASURED_EVENT_THICKNESS,
    ),
    largestMoreLinkHeight: 0,
  }
}

/** Records a positive event-wrapper height, returning the same object for a non-extremum. */
export function observeDayGridEventHeight(
  state: DayGridPlacementOwnerState,
  height: number,
): DayGridPlacementOwnerState {
  if (!isPositiveFinite(height) || (
    state.smallestEventHeight != null &&
    height >= state.smallestEventHeight
  )) {
    return state
  }

  return updateDayGridPlacementOwnerState(state, {
    smallestEventHeight: height,
  })
}

/** Records a positive event-area height, returning the same object for a non-extremum. */
export function observeDayGridEventAreaHeight(
  state: DayGridPlacementOwnerState,
  height: number,
): DayGridPlacementOwnerState {
  if (!isPositiveFinite(height) || (
    state.largestEventAreaHeight != null &&
    height <= state.largestEventAreaHeight
  )) {
    return state
  }

  return updateDayGridPlacementOwnerState(state, {
    largestEventAreaHeight: height,
  })
}

/** Records the parent-wide monotone more-link wrapper maximum. */
export function observeDayGridMoreLinkHeight(
  state: DayGridPlacementOwnerState,
  height: number,
): DayGridPlacementOwnerState {
  if (!isPositiveFinite(height) || height <= state.largestMoreLinkHeight) {
    return state
  }

  return {
    ...state,
    largestMoreLinkHeight: height,
  }
}

/**
 * Resolves the dimensionless DOM frontier without applying more-link tax.
 * Numeric limits own their explicit cap; unlimited rows mount all sources;
 * boolean-auto rows consume the cross-row observed frontier.
 */
export function computeDayGridDomCandidateMaxLevels(
  dayMaxEvents: boolean | number | undefined,
  dayMaxEventRows: boolean | number | undefined,
  maxDomLevels: number,
): number {
  if (dayMaxEvents === true || dayMaxEventRows === true) {
    return maxDomLevels
  }
  if (typeof dayMaxEvents === 'number') {
    return dayMaxEvents
  }
  if (typeof dayMaxEventRows === 'number') {
    return dayMaxEventRows
  }
  return Infinity
}

function buildPlacementColumns(
  plan: DayGridSegPlacementPlan,
  limited: DayGridLimitResult<DayGridEventSeg>,
  columnCount: number,
): DayGridSegPlacementColumn[] {
  const sourceOrderByKey = new Map(
    plan.sourceSegs.map((source) => [source.key, source.orderIndex]),
  )
  const columns = Array.from({ length: columnCount }, (_, column) => {
    const popoverSegs = buildDayGridPopoverSegs(
      plan,
      limited.hiddenSlices,
      column,
      columnCount,
    )
    return {
      column,
      placements: [] as DayGridSegPlacement[],
      ...popoverSegs,
    }
  })

  for (const placement of limited.visiblePlacements) {
    const source = placement.sourceSeg
    columns[placement.start].placements.push({
      sourceKey: source.key,
      seg: buildProductionSeg(placement),
      top: placement.levelCoord,
      thickness: placement.thickness,
      isWhole: doesSliceCoverWholeSource(placement),
    })
  }
  for (const column of columns) {
    column.placements.sort((a, b) =>
      sourceOrderByKey.get(a.sourceKey)! - sourceOrderByKey.get(b.sourceKey)!)
  }

  return columns
}

function buildProductionSeg(
  placement: Placement<DayGridEventSeg>,
): DayRowEventRangePart {
  const sourceSeg = placement.sourceSeg.meta
  if (doesSliceCoverWholeSource(placement)) {
    return sourceSeg
  }

  return {
    ...sourceSeg,
    start: placement.start,
    end: placement.end,
    isStart: placement.isStart,
    isEnd: placement.isEnd,
    isSlice: true,
  }
}

function buildSliceOptions(
  orderStrict: boolean,
  eventSlicing: boolean,
): SliceOptions {
  return {
    orderStrict,
    eventSlicing,
    ...DAYGRID_SLICE_OPTIONS,
  }
}

function intersectsColumn(
  span: { start: number, end: number },
  column: number,
  columnCount: number,
): boolean {
  const range = getLateralCellRange(span, columnCount)
  return column >= range.start && column < range.end
}

function updateDayGridPlacementOwnerState(
  state: DayGridPlacementOwnerState,
  extrema: Partial<Pick<
    DayGridPlacementOwnerState,
    'smallestEventHeight' | 'largestEventAreaHeight'
  >>,
): DayGridPlacementOwnerState {
  const next = { ...state, ...extrema }
  next.maxDomLevels = Math.max(
    state.maxDomLevels,
    estimateLevelCapacity(
      next.largestEventAreaHeight ?? DEFAULT_UNMEASURED_EVENT_AREA_HEIGHT,
      next.smallestEventHeight ?? DEFAULT_UNMEASURED_EVENT_THICKNESS,
    ),
  )
  return next
}

function estimateLevelCapacity(eventAreaHeight: number, eventHeight: number): number {
  return Math.max(1, Math.ceil(eventAreaHeight / eventHeight))
}

function isPositiveFinite(value: number): boolean {
  return value > 0 && Number.isFinite(value)
}
