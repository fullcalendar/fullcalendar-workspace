import {
  DEFAULT_UNMEASURED_EVENT_THICKNESS,
  type HiddenSliceGroup,
  type Slice,
  type SliceHeightMap,
  type SliceRenderItem,
  type SourceSeg,
  buildLevelLimitedLayout,
  buildPixelLimitedLayout,
  getLateralCellRange,
  getSliceKey,
} from '../seg-placement/kernel'
import {
  type DayRowEventRange,
  type DayRowEventRangePart,
  getEventSliceKey,
} from './TableSeg'

export type DayGridEventSeg = DayRowEventRange

export interface DayGridPlacementColumn<HeightRef> {
  /** Exact kernel slices whose DOM wrappers start in this column. */
  renderItems: SliceRenderItem<DayGridEventSeg, HeightRef>[]
  /** Deepest visible slice bottom crossing this column. */
  contentHeight: number
  /** Every source crossing this column, cut for more-link APIs. */
  segs: DayRowEventRangePart[]
  /** Hidden source membership projected from kernel glob groups. */
  hiddenSegs: DayRowEventRangePart[]
}

interface DayGridPlacementLayout<HeightRef> {
  columns: DayGridPlacementColumn<HeightRef>[]
  /** Positioned slice tops keyed by DayGrid's event-part convention. */
  sliceCoords: ReadonlyMap<string, number>
  /** Whether every currently visible slice has an exact occupied height. */
  isSettled: boolean
}

/**
 * Which measured route a row takes, resolved from the two max options.
 *
 * `auto` reproduces production's precedence exactly: a boolean `true` on
 * either option wins over a number on the other one.
 */
type DayGridPlacementMode =
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
  smallestSliceHeight: number | null
  /** Largest whole-or-partial slice height observed during this owner lifetime. */
  largestSliceHeight: number | null
  /**
   * Largest observed height of the space foreground events actually compete
   * for, which excludes the day-number header above it. A row's complete
   * height would overstate capacity by that header.
   */
  largestCanvasHeight: number | null
  neededLevelCount: number
}

const DEFAULT_UNMEASURED_EVENT_AREA_HEIGHT = 150

/** Initial DOM candidate frontier, before any measurement can widen it. */
export const DEFAULT_NEEDED_LEVEL_COUNT = estimateLevelCapacity(
  DEFAULT_UNMEASURED_EVENT_AREA_HEIGHT,
  DEFAULT_UNMEASURED_EVENT_THICKNESS,
)

/** Converts sorted production ranges into the shared source vocabulary. */
export function buildDayGridSegSources(
  eventOrderedSegs: readonly DayGridEventSeg[],
): SourceSeg<DayGridEventSeg>[] {
  return eventOrderedSegs.map((seg, orderIndex) => ({
    key: getEventSliceKey(seg),
    start: seg.start,
    end: seg.end,
    isStart: seg.isStart,
    isEnd: seg.isEnd,
    meta: seg,
    orderIndex,
  }))
}

interface DayGridLevelPlacementInputs {
  dayMaxEvents: boolean | number | undefined
  dayMaxEventRows: boolean | number | undefined
  orderStrict: boolean
  eventSlicing: boolean
  columnCount: number
}

interface DayGridPixelPlacementInputs {
  orderStrict: boolean
  eventSlicing: boolean
  columnCount: number
  /** Real pixels foreground events compete for. Undefined until measured. */
  canvasHeight?: number
}

/**
 * Builds an immediately renderable kernel layout for unlimited and numeric
 * DayGrid modes. Boolean-auto uses the pixel-limited adapter below.
 */
export function buildDayGridLevelPlacements<HeightRef>(
  eventOrderedSegs: readonly DayGridEventSeg[],
  input: DayGridLevelPlacementInputs,
  sliceHeightMap: SliceHeightMap<HeightRef>,
  largestSliceHeight: number | undefined,
): DayGridPlacementLayout<HeightRef> {
  const mode = resolveDayGridPlacementMode(
    input.dayMaxEvents,
    input.dayMaxEventRows,
  )

  if (mode === 'auto') {
    throw new Error('Boolean-auto DayGrid placement is not a level-limited route')
  }

  const sourceSegs = buildDayGridSegSources(eventOrderedSegs)
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
    largestSliceHeight,
  )
  const provisionalSliceHeight = largestSliceHeight ??
    DEFAULT_UNMEASURED_EVENT_THICKNESS
  return buildDayGridPlacementLayout(
    sourceSegs,
    layout.hiddenGroups,
    layout.renderItems,
    layout.sliceLevels,
    layout.sliceCoords,
    sliceHeightMap,
    provisionalSliceHeight,
    input.columnCount,
  )
}

/** Builds the boolean-auto DayGrid route with a real pixel ceiling. */
export function buildDayGridPixelPlacements<HeightRef>(
  eventOrderedSegs: readonly DayGridEventSeg[],
  input: DayGridPixelPlacementInputs,
  sliceHeightMap: SliceHeightMap<HeightRef>,
  neededLevelCount: number,
  smallestSliceHeight: number | undefined,
  largestSliceHeight: number | undefined,
): DayGridPlacementLayout<HeightRef> {
  const sourceSegs = buildDayGridSegSources(eventOrderedSegs)
  const layout = buildPixelLimitedLayout(
    {
      segs: sourceSegs,
      cells: Array.from({ length: input.columnCount }),
    },
    {
      eventOrderStrict: input.orderStrict,
      eventSlicing: input.eventSlicing,
    },
    sliceHeightMap,
    input.canvasHeight,
    neededLevelCount,
    smallestSliceHeight,
    largestSliceHeight,
  )

  return buildDayGridPlacementLayout(
    sourceSegs,
    layout.hiddenGroups,
    layout.renderItems,
    layout.placementSliceLevels,
    layout.sliceCoords,
    sliceHeightMap,
    largestSliceHeight ?? DEFAULT_UNMEASURED_EVENT_THICKNESS,
    input.columnCount,
  )
}

/** Hidden donors are exempt; every coordinate-bearing render item must settle. */
function areDayGridRenderItemsSettled<HeightRef>(
  renderItems: readonly (readonly SliceRenderItem<DayGridEventSeg, HeightRef>[])[],
  sliceHeightMap: SliceHeightMap<HeightRef>,
): boolean {
  return renderItems.every((items) => items.every((item) =>
    item.style.visibility === 'hidden' || sliceHeightMap.current.get(item.key) !== undefined,
  ))
}

/** Projects kernel glob groups into one cell's ordered more-link inputs. */
export function buildDayGridPopoverSegs(
  sourceSegs: readonly SourceSeg<DayGridEventSeg>[],
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
    smallestSliceHeight: null,
    largestSliceHeight: null,
    largestCanvasHeight: null,
    neededLevelCount: DEFAULT_NEEDED_LEVEL_COUNT,
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
export function observeDayGridSliceHeight(
  state: DayGridPlacementOwnerState,
  height: number,
): DayGridPlacementOwnerState {
  if (!isPositiveFinite(height)) {
    return state
  }

  const smallestSliceHeight = state.smallestSliceHeight == null
    ? height
    : Math.min(state.smallestSliceHeight, height)
  const largestSliceHeight = state.largestSliceHeight == null
    ? height
    : Math.max(state.largestSliceHeight, height)

  return smallestSliceHeight === state.smallestSliceHeight &&
    largestSliceHeight === state.largestSliceHeight
    ? state
    : updateDayGridPlacementOwnerState(state, {
      smallestSliceHeight,
      largestSliceHeight,
    })
}

/** Records a positive event-area height, returning the same object for a non-extremum. */
export function observeDayGridCanvasHeight(
  state: DayGridPlacementOwnerState,
  height: number,
): DayGridPlacementOwnerState {
  if (!isPositiveFinite(height) || (
    state.largestCanvasHeight != null &&
    height <= state.largestCanvasHeight
  )) {
    return state
  }

  return updateDayGridPlacementOwnerState(state, {
    largestCanvasHeight: height,
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

function buildDayGridPlacementLayout<HeightRef>(
  sourceSegs: readonly SourceSeg<DayGridEventSeg>[],
  hiddenGroups: readonly HiddenSliceGroup<DayGridEventSeg>[],
  renderItems: readonly (readonly SliceRenderItem<DayGridEventSeg, HeightRef>[])[],
  placementSliceLevels: readonly (readonly Slice<DayGridEventSeg>[])[],
  sliceCoords: ReadonlyMap<string, number>,
  sliceHeightMap: SliceHeightMap<HeightRef>,
  provisionalSliceHeight: number,
  columnCount: number,
): DayGridPlacementLayout<HeightRef> {
  const columns = Array.from(
    { length: columnCount },
    (_, column): DayGridPlacementColumn<HeightRef> => ({
      renderItems: [...renderItems[column]],
      contentHeight: 0,
      ...buildDayGridPopoverSegs(
        sourceSegs,
        hiddenGroups,
        column,
        columnCount,
      ),
    }),
  )

  for (const level of placementSliceLevels) {
    for (const slice of level) {
      const key = getSliceKey(slice)
      const sliceBottom = sliceCoords.get(key)! + (
        sliceHeightMap.current.get(key) ?? provisionalSliceHeight
      )
      const range = getLateralCellRange(slice, columnCount)

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
    sliceCoords,
    isSettled: areDayGridRenderItemsSettled(renderItems, sliceHeightMap),
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
    'smallestSliceHeight' | 'largestSliceHeight' | 'largestCanvasHeight'
  >>,
): DayGridPlacementOwnerState {
  const next = { ...state, ...extrema }
  next.neededLevelCount = Math.max(
    state.neededLevelCount,
    estimateLevelCapacity(
      next.largestCanvasHeight ?? DEFAULT_UNMEASURED_EVENT_AREA_HEIGHT,
      next.smallestSliceHeight ?? DEFAULT_UNMEASURED_EVENT_THICKNESS,
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
