import {
  type Placement,
  type Slice as LegacySlice,
  type SliceOptions,
  type SourceSeg as LegacySourceSeg,
  type SegThicknessMap,
  DEFAULT_UNMEASURED_EVENT_THICKNESS,
  areSegThicknessesSettled,
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
  type GetRatchet,
  type HiddenSliceGroup,
  type SliceHeightMap,
  type SliceRenderItem,
  type SourceSeg as KernelSourceSeg,
  buildLevelLimitedLayout,
  getSliceKey,
} from '../seg-placement/kernel'
import { getEventKey } from '../component-util/event-rendering'
import {
  type DayRowEventRange,
  type DayRowEventRangePart,
  getEventPartKey,
} from './TableSeg'

export type DayGridEventSeg = DayRowEventRange

export const DAYGRID_SLICE_OPTIONS = {
  maxSlices: 3,
  minSliceLength: 1,
} as const

export interface DayGridSegPlacementPlan {
  /** Every source in resolved event order, including sources that will not mount. */
  sourceSegs: LegacySourceSeg<DayGridEventSeg>[]
  /** Complete source wrappers admitted for measurement. */
  mountedSegs: LegacySourceSeg<DayGridEventSeg>[]
  /** One whole slice for every source rejected before measurement. */
  unmountedSlices: LegacySlice<DayGridEventSeg>[]
  maxLevels: number
  orderStrict: boolean
  eventSlicing: boolean
}

export interface DayGridPopoverPlan {
  sourceSegs: LegacySourceSeg<DayGridEventSeg>[]
  unmountedSlices: LegacySlice<DayGridEventSeg>[]
}

export interface DayGridLevelPlacementColumn<HeightRef> {
  /** Exact kernel slices whose DOM wrappers start in this column. */
  renderItems: SliceRenderItem<DayGridEventSeg, HeightRef>[]
  /** Deepest visible slice bottom crossing this column. */
  contentHeight: number
  /** Every source crossing this column, cut for more-link APIs. */
  segs: DayRowEventRangePart[]
  /** Hidden source membership projected from kernel glob groups. */
  hiddenSegs: DayRowEventRangePart[]
}

export interface DayGridLevelPlacementLayout<HeightRef> {
  columns: DayGridLevelPlacementColumn<HeightRef>[]
  /** Positioned slice tops keyed by DayGrid's event-part convention. */
  sliceCoords: ReadonlyMap<string, number>
}

/**
 * One event node owned by a start column.
 *
 * Every mounted source keeps exactly one permanent node for the whole span it
 * was measured at. That node is either the source's visible whole placement or
 * an inert donor that exists only to keep reporting a height. Visible slices
 * render through additional supplemental nodes that borrow the source's
 * measurement instead of taking one of their own.
 */
export interface DayGridSegDomItem {
  /** React key, and the measurement key when this is the permanent node. */
  key: string
  seg: DayRowEventRangePart
  /** Offset within the row's event area. Undefined while the node is inert. */
  top?: number
  /**
   * Whether this node is the one responsible for reporting its source's
   * height. It says nothing about whether a height has arrived yet; a node
   * mounts measurable and stays so while its measurement is outstanding.
   */
  isMeasurable: boolean
}

export interface DayGridSegPlacementColumn {
  /** Nodes whose whole or sliced span starts here, in resolved event order. */
  domItems: DayGridSegDomItem[]
  /** Deepest visible event bottom across every placement crossing this column. */
  contentHeight: number
  /** Every source intersecting this column, cut to the column for more-link APIs. */
  segs: DayRowEventRangePart[]
  /** Candidate-unmounted and measured-hidden sources intersecting this column. */
  hiddenSegs: DayRowEventRangePart[]
}

/**
 * Which measured route a row takes, resolved from the two max options.
 *
 * `auto` reproduces production's precedence exactly: a boolean `true` on
 * either option wins over a number on the other one.
 */
export type DayGridPlacementMode =
  | 'unlimited'
  | 'maxEvents'
  | 'maxEventRows'
  | 'auto'

/*
These owner-lifetime extrema only widen planning assumptions. Keeping them
monotone avoids remount churn; stale values after a style change can mount
extra donors or conservatively spread provisional coordinates.
*/
export interface DayGridPlacementOwnerState {
  smallestEventHeight: number | null
  /** Largest whole-or-partial slice height observed during this owner lifetime. */
  largestSliceHeight: number | null
  /**
   * Largest observed height of the space foreground events actually compete
   * for, which excludes the day-number header above it. A row's complete
   * height would overstate capacity by that header.
   */
  largestEventAreaHeight: number | null
  maxDomLevels: number
}

const DEFAULT_UNMEASURED_EVENT_AREA_HEIGHT = 150

/** Converts sorted production ranges into the shared source vocabulary. */
export function buildDayGridSegSources(
  eventOrderedSegs: readonly DayGridEventSeg[],
): LegacySourceSeg<DayGridEventSeg>[] {
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

/** Converts sorted production ranges into the kernel's source vocabulary. */
export function buildDayGridKernelSources(
  eventOrderedSegs: readonly DayGridEventSeg[],
): KernelSourceSeg<DayGridEventSeg>[] {
  return eventOrderedSegs.map((seg, orderIndex) => ({
    key: getEventPartKey(seg),
    eventKey: getEventKey(seg),
    start: seg.start,
    end: seg.end,
    isStart: seg.isStart,
    isEnd: seg.isEnd,
    meta: seg,
    orderIndex,
  }))
}

export interface DayGridLevelPlacementInputs {
  dayMaxEvents: boolean | number | undefined
  dayMaxEventRows: boolean | number | undefined
  orderStrict: boolean
  eventSlicing: boolean
  columnCount: number
}

/**
 * Builds an immediately renderable kernel layout for unlimited and numeric
 * DayGrid modes. Boolean-auto deliberately remains on the measured adapter.
 */
export function buildDayGridLevelPlacements<HeightRef>(
  eventOrderedSegs: readonly DayGridEventSeg[],
  input: DayGridLevelPlacementInputs,
  sliceHeightMap: SliceHeightMap<HeightRef>,
  getRatchet: GetRatchet,
): DayGridLevelPlacementLayout<HeightRef> {
  const mode = resolveDayGridPlacementMode(
    input.dayMaxEvents,
    input.dayMaxEventRows,
  )

  if (mode === 'auto') {
    throw new Error('Boolean-auto DayGrid placement is not a level-limited route')
  }

  const sourceSegs = buildDayGridKernelSources(eventOrderedSegs)
  const ratchet = getRatchet()
  const layout = buildLevelLimitedLayout(
    {
      segs: sourceSegs,
      cells: Array.from({ length: input.columnCount }),
    },
    {
      eventOrderStrict: input.orderStrict,
      eventSlicing: input.eventSlicing,
      maxLevels: computeDayGridDomCandidateMaxLevels(
        input.dayMaxEvents,
        input.dayMaxEventRows,
        Infinity,
      ),
      moreLinkLevelTax: computeDayGridMoreLinkLevelTax(mode),
    },
    sliceHeightMap,
    () => ratchet,
  )
  const provisionalSliceHeight = ratchet.largestSliceHeight ??
    DEFAULT_UNMEASURED_EVENT_THICKNESS
  const columns = Array.from(
    { length: input.columnCount },
    (_, column): DayGridLevelPlacementColumn<HeightRef> => ({
      renderItems: layout.renderItems[column],
      contentHeight: 0,
      ...buildDayGridLevelPopoverSegs(
        sourceSegs,
        layout.hiddenGroups,
        column,
        input.columnCount,
      ),
    }),
  )

  for (const level of layout.sliceLevels) {
    for (const slice of level) {
      const levelCoord = layout.sliceCoords.get(getSliceKey(slice))!
      const sliceBottom = levelCoord + (
        sliceHeightMap.get(getSliceKey(slice)) ?? provisionalSliceHeight
      )
      const range = getLateralCellRange(slice, input.columnCount)

      for (let column = range.start; column < range.end; column += 1) {
        columns[column].contentHeight = Math.max(
          columns[column].contentHeight,
          sliceBottom,
        )
      }
    }
  }

  return {
    columns,
    sliceCoords: layout.sliceCoords,
  }
}

/** Projects kernel glob groups into one cell's ordered more-link inputs. */
export function buildDayGridLevelPopoverSegs(
  sourceSegs: readonly KernelSourceSeg<DayGridEventSeg>[],
  hiddenGroups: readonly HiddenSliceGroup<DayGridEventSeg>[],
  column: number,
  columnCount: number,
): {
  segs: DayRowEventRangePart[]
  hiddenSegs: DayRowEventRangePart[]
} {
  const hiddenKeys = new Set<string>()

  for (const group of hiddenGroups) {
    for (const slice of group.hiddenSlices) {
      if (intersectsColumn(slice, column, columnCount)) {
        hiddenKeys.add(slice.sourceSeg.key)
      }
    }
  }

  const columnSources = sourceSegs.filter((source) =>
    intersectsColumn(source, column, columnCount),
  )

  return {
    segs: columnSources.map((source) => cutSegToColumn(source.meta, column)),
    hiddenSegs: columnSources
      .filter((source) => hiddenKeys.has(source.key))
      .map((source) => cutSegToColumn(source.meta, column)),
  }
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
 *
 * While any admitted wrapper still awaits measurement there is no geometry to
 * report, but the columns already carry every mounted source's permanent node
 * so those wrappers can measure at all. Such nodes receive no `top` and are
 * therefore inert rather than stacked at zero.
 */
export function buildDayGridSegPlacements(
  plan: DayGridSegPlacementPlan,
  segHeights: ReadonlyMap<string, number>,
  limits: Omit<DayGridLimits, 'initialHiddenSpans'>,
): DayGridSegPlacementColumn[] {
  let limited: DayGridLimitResult<DayGridEventSeg> | null = null

  if (areSegThicknessesSettled(plan.mountedSegs, segHeights)) {
    const unrestricted = positionSegs(
      plan.mountedSegs,
      segHeights,
      plan.orderStrict,
    )
    limited = limitDayGridLayout(
      unrestricted,
      {
        ...limits,
        initialHiddenSpans: plan.unmountedSlices,
      },
      buildSliceOptions(plan.orderStrict, plan.eventSlicing),
    )
  }

  return buildPlacementColumns(plan, limited, limits.columnCount)
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
  plan: DayGridPopoverPlan,
  measuredHiddenSlices: readonly LegacySlice<DayGridEventSeg>[],
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
    segs: columnSources.map((source) => cutSegToColumn(source.meta, column)),
    hiddenSegs: columnSources
      .filter((source) => hiddenKeys.has(source.key))
      .map((source) => cutSegToColumn(source.meta, column)),
  }
}

/**
 * Projects one complete source onto a single column for the more-link APIs.
 *
 * Only real event boundaries survive the cut, so a popover entry reports
 * "continues" exactly when the event truly extends past this column.
 */
function cutSegToColumn(
  seg: DayRowEventRange,
  column: number,
): DayRowEventRangePart {
  return {
    ...seg,
    start: column,
    end: column + 1,
    isStart: seg.isStart && seg.start === column,
    isEnd: seg.isEnd && seg.end - 1 === column,
  }
}

/** Initial monotone owner state for one DayGridRows component lifetime. */
export function createDayGridPlacementOwnerState(): DayGridPlacementOwnerState {
  return {
    smallestEventHeight: null,
    largestSliceHeight: null,
    largestEventAreaHeight: null,
    maxDomLevels: estimateLevelCapacity(
      DEFAULT_UNMEASURED_EVENT_AREA_HEIGHT,
      DEFAULT_UNMEASURED_EVENT_THICKNESS,
    ),
  }
}

/**
 * Records a positive whole-or-partial slice height, returning the same object
 * when neither owner extremum changes.
 *
 * Any positive report is admitted, including an implausibly small one from a
 * wrapper measured mid font or stylesheet load. No floor is applied, for two
 * reasons. Compact custom event content can legitimately be shorter than the
 * unmeasured fallback, so a fixed floor would silently discard valid heights.
 * And this extremum only sizes the *candidate* frontier: under-estimating it
 * mounts more event wrappers than a row needs, while the measured pass still
 * decides visibility from real pixels. The failure mode is therefore wasted
 * DOM, never a hidden event that fits.
 *
 * Non-positive and non-finite reports, including the `null` a wrapper sends
 * when it unmounts, leave the state untouched.
 */
export function observeDayGridEventHeight(
  state: DayGridPlacementOwnerState,
  height: number,
): DayGridPlacementOwnerState {
  if (!isPositiveFinite(height)) {
    return state
  }

  const smallestEventHeight = state.smallestEventHeight == null
    ? height
    : Math.min(state.smallestEventHeight, height)
  const largestSliceHeight = state.largestSliceHeight == null
    ? height
    : Math.max(state.largestSliceHeight, height)

  return smallestEventHeight === state.smallestEventHeight &&
    largestSliceHeight === state.largestSliceHeight
    ? state
    : updateDayGridPlacementOwnerState(state, {
      smallestEventHeight,
      largestSliceHeight,
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

/**
 * Resolves which measured route a row takes from the two max options.
 *
 * This is the single definition of production's option precedence: a boolean
 * `true` on either option means auto, and only then does a number on either
 * one apply, `dayMaxEvents` first.
 */
export function resolveDayGridPlacementMode(
  dayMaxEvents: boolean | number | undefined,
  dayMaxEventRows: boolean | number | undefined,
): DayGridPlacementMode {
  if (dayMaxEvents === true || dayMaxEventRows === true) {
    return 'auto'
  }
  if (typeof dayMaxEvents === 'number') {
    return 'maxEvents'
  }
  if (typeof dayMaxEventRows === 'number') {
    return 'maxEventRows'
  }
  return 'unlimited'
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
  switch (resolveDayGridPlacementMode(dayMaxEvents, dayMaxEventRows)) {
    case 'auto': return maxDomLevels
    case 'maxEvents': return dayMaxEvents as number
    case 'maxEventRows': return dayMaxEventRows as number
    default: return Infinity
  }
}

/**
 * Logical levels an active more link charges its column. Only `dayMaxEventRows`
 * counts the link as one of its rows.
 */
export function computeDayGridMoreLinkLevelTax(mode: DayGridPlacementMode): number {
  return mode === 'maxEventRows' ? 1 : 0
}

/**
 * Uses the row's largest current event as a makeshift more-link reservation.
 * It approximates the legacy zombie-event slot, but follows live event
 * measurements so style changes need no reset trigger or parent ratchet.
 */
export function computeDayGridMoreLinkHeight(
  segHeights: SegThicknessMap,
): number {
  let largestHeight = 0

  for (const height of segHeights.values()) {
    largestHeight = Math.max(largestHeight, height)
  }

  return largestHeight
}

/** What a row knows about its own measured bounds when it re-limits. */
export interface DayGridMeasuredLimitInputs {
  mode: DayGridPlacementMode
  /** The dimensionless cap this row's candidates were admitted under. */
  candidateMaxLevels: number
  columnCount: number
  /** Measured pixels foreground events compete for. Undefined until measured. */
  eventAreaHeight?: number
  /** Row-local event-height proxy reserved for an active more link. */
  moreLinkHeight?: number
}

/**
 * Resolves one row's untaxed bounds and per-link taxes from its mode.
 *
 * The two limiting currencies belong to different modes. Auto limits by
 * measured pixels alone: its candidate cap is the cross-row DOM frontier, an
 * estimate of how many events might fit rather than a display rule, so
 * charging it as one would hide events that do fit. Numeric modes are the
 * reverse, owning an explicit level cap and no pixel ceiling, which leaves
 * their pixel tax inert rather than absent.
 *
 * An unmeasured auto row carries no ceiling and therefore shows everything it
 * mounted, exactly as the legacy path did before its first measurement.
 */
export function computeDayGridMeasuredLimits(
  input: DayGridMeasuredLimitInputs,
): Omit<DayGridLimits, 'initialHiddenSpans'> {
  const isAuto = input.mode === 'auto'

  return {
    maxLevels: isAuto ? undefined : input.candidateMaxLevels,
    levelCoordLimit: isAuto ? input.eventAreaHeight : undefined,
    columnCount: input.columnCount,
    levelTax: computeDayGridMoreLinkLevelTax(input.mode),
    coordTax: input.moreLinkHeight,
  }
}

function buildPlacementColumns(
  plan: DayGridSegPlacementPlan,
  limited: DayGridLimitResult<DayGridEventSeg> | null,
  columnCount: number,
): DayGridSegPlacementColumn[] {
  const visiblePlacements = limited?.visiblePlacements ?? []
  const columns = Array.from({ length: columnCount }, (_, column) => ({
    domItems: [] as DayGridSegDomItem[],
    contentHeight: 0,
    ...buildDayGridPopoverSegs(
      plan,
      limited?.hiddenSlices ?? [],
      column,
      columnCount,
    ),
  }))
  const visibleBySourceKey = new Map<string, Placement<DayGridEventSeg>[]>()

  for (const placement of visiblePlacements) {
    const siblings = visibleBySourceKey.get(placement.sourceSeg.key)
    if (siblings) {
      siblings.push(placement)
    } else {
      visibleBySourceKey.set(placement.sourceSeg.key, [placement])
    }

    const range = getLateralCellRange(placement, columnCount)
    for (let column = range.start; column < range.end; column++) {
      columns[column].contentHeight = Math.max(
        columns[column].contentHeight,
        placement.levelEndCoord,
      )
    }
  }

  // The limiter's geometry array is not a DOM ordering: it appends each
  // overflowed source's result after the ones that fit outright. Walking
  // mounted sources instead gives every column resolved event order by
  // construction, since only appends happen below and `mountedSegs` filters
  // the array `positionSegs` emitted in that order.
  for (const source of plan.mountedSegs) {
    const placements = visibleBySourceKey.get(source.key) ?? []
    const wholePlacement = placements.find(doesSliceCoverWholeSource)

    // Every mounted source keeps one permanent wrapper for the whole span it
    // was measured at. Without a visible whole placement it becomes an inert
    // donor, so the source's occupied height keeps reaching the measured pass.
    columns[source.start].domItems.push({
      key: source.key,
      seg: source.meta,
      top: wholePlacement?.levelCoord,
      isMeasurable: true,
    })

    // Supplemental slices follow their source's permanent wrapper, each into
    // its own start column. They borrow that wrapper's measurement.
    for (const placement of placements) {
      if (placement === wholePlacement) continue

      const seg = buildSlicedSeg(placement)
      columns[placement.start].domItems.push({
        key: getEventPartKey(seg),
        seg,
        top: placement.levelCoord,
        isMeasurable: false,
      })
    }
  }

  return columns
}

function buildSlicedSeg(
  placement: Placement<DayGridEventSeg>,
): DayRowEventRangePart {
  return {
    ...placement.sourceSeg.meta,
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
    'smallestEventHeight' | 'largestSliceHeight' | 'largestEventAreaHeight'
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
