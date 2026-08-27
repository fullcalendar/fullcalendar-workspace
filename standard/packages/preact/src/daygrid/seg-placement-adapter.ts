import {
  DEFAULT_UNMEASURED_EVENT_THICKNESS,
  type HiddenSliceGroup,
  type Slice,
  buildLevelLimitedLayout,
  buildPixelLimitedLayout,
  getLateralCellRange,
  getSliceKey,
} from '../seg-placement/kernel'
import {
  type DayRowEventRange,
  type DayRowEventRangePart,
  getDayGridSegKey,
} from './TableSeg'

export type DayGridEventSeg = DayRowEventRange

/**
 * A production seg satisfying the kernel's seg requirements directly: its
 * column-unit lateral geometry already matches, so only identity is added.
 */
export type DayGridSourceSeg = DayGridEventSeg & {
  key: string
  orderIndex: number
}

export interface DayGridPlacementColumn {
  /** Exact kernel slices whose DOM wrappers start in this column. */
  renderSlices: Slice<DayGridSourceSeg>[]
  /** Deepest visible slice bottom crossing this column. */
  contentHeight: number
  /** Every source crossing this column, cut for more-link APIs. */
  segs: DayRowEventRangePart[]
  /** Hidden source membership projected from kernel glob groups. */
  hiddenSegs: DayRowEventRangePart[]
}

interface DayGridPlacementLayout {
  columns: DayGridPlacementColumn[]
  renderSlices: readonly Slice<DayGridSourceSeg>[]
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

const DEFAULT_UNMEASURED_EVENT_AREA_HEIGHT = 150
const SLICE_HEIGHT_GROWTH_NOISE_FLOOR_PX = 2

/** Initial DOM candidate frontier, before any measurement can widen it. */
export const DEFAULT_NEEDED_LEVEL_COUNT = estimateLevelCapacity(
  DEFAULT_UNMEASURED_EVENT_AREA_HEIGHT,
  DEFAULT_UNMEASURED_EVENT_THICKNESS,
)

/** Converts sorted production ranges into the shared source vocabulary. */
export function buildDayGridSegSources(
  eventOrderedSegs: readonly DayGridEventSeg[],
): DayGridSourceSeg[] {
  return eventOrderedSegs.map((seg, orderIndex) => ({
    ...seg,
    key: getDayGridSegKey(seg),
    orderIndex,
  }))
}

/**
 * Builds an immediately renderable kernel layout for unlimited and numeric
 * DayGrid modes. Boolean-auto uses the pixel-limited adapter below.
 */
export function buildDayGridLevelPlacements(
  eventOrderedSegs: readonly DayGridEventSeg[],
  maxLevels: number,
  moreLinkLevelTax: number,
  orderStrict: boolean,
  eventSlicing: boolean,
  columnCount: number,
  sliceHeights: ReadonlyMap<string, number>,
): DayGridPlacementLayout {
  const sourceSegs = buildDayGridSegSources(eventOrderedSegs)
  const layout = buildLevelLimitedLayout(
    {
      segs: sourceSegs,
      cells: Array.from({ length: columnCount }),
    },
    {
      eventOrderStrict: orderStrict,
      eventSlicing,
      maxLevels,
      moreLinkLevelTax,
    },
    sliceHeights,
  )
  return buildDayGridPlacementLayout(
    sourceSegs,
    layout,
    sliceHeights,
    columnCount,
  )
}

/** Builds the boolean-auto DayGrid route with a real pixel ceiling. */
export function buildDayGridPixelPlacements(
  eventOrderedSegs: readonly DayGridEventSeg[],
  orderStrict: boolean,
  eventSlicing: boolean,
  columnCount: number,
  canvasHeight: number | undefined,
  moreLinkHeight: number | undefined,
  neededLevelCount: number,
  sliceHeightGrowthRate: number,
  sliceHeights: ReadonlyMap<string, number>,
  largestWholeHeight: number | undefined,
): DayGridPlacementLayout {
  const sourceSegs = buildDayGridSegSources(eventOrderedSegs)
  const getPlanningSliceThickness = largestWholeHeight == null
    ? undefined
    : (slice: Slice<DayGridSourceSeg>) =>
      computeDayGridPlanningSliceThickness(
        slice,
        resolveDayGridSourceHeight(
          sliceHeights,
          slice.sourceSeg.key,
          largestWholeHeight,
        ),
        sliceHeightGrowthRate,
      )
  const layout = buildPixelLimitedLayout(
    {
      segs: sourceSegs,
      cells: Array.from({ length: columnCount }),
    },
    {
      eventOrderStrict: orderStrict,
      eventSlicing,
    },
    sliceHeights,
    canvasHeight,
    neededLevelCount,
    moreLinkHeight,
    getPlanningSliceThickness,
  )

  return buildDayGridPlacementLayout(
    sourceSegs,
    layout,
    sliceHeights,
    columnCount,
  )
}

/** Projects kernel glob groups into one cell's ordered more-link inputs. */
export function buildDayGridPopoverSegs(
  sourceSegs: readonly DayGridSourceSeg[],
  hiddenGroups: readonly HiddenSliceGroup<DayGridSourceSeg>[],
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
    segs: columnSources.map((source) => cutSegToColumn(source, column)),
    hiddenSegs: columnSources
      .filter((source) => hiddenKeys.has(source.key))
      .map((source) => cutSegToColumn(source, column)),
  }
}

/**
 * Projects one complete source onto a single column for the more-link APIs.
 *
 * Only real event boundaries survive the cut, so a popover entry reports
 * "continues" exactly when the event truly extends past this column.
 */
function cutSegToColumn(
  source: DayGridSourceSeg,
  column: number,
): DayRowEventRangePart {
  const { key, orderIndex, ...seg } = source
  return {
    ...seg,
    start: column,
    end: column + 1,
    isStart: seg.isStart && source.start === column,
    isEnd: seg.isEnd && source.end - 1 === column,
  }
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
 * Computes the dimensionless DOM frontier from an already-resolved mode,
 * without applying more-link tax. Numeric limits own their explicit cap;
 * unlimited rows mount all sources; boolean-auto rows consume their row-local
 * observed frontier.
 */
export function computeDayGridDomCandidateMaxLevels(
  mode: DayGridPlacementMode,
  dayMaxEvents: boolean | number | undefined,
  dayMaxEventRows: boolean | number | undefined,
  maxDomLevels: number,
): number {
  switch (mode) {
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

function buildDayGridPlacementLayout(
  sourceSegs: readonly DayGridSourceSeg[],
  layout: {
    hiddenGroups: readonly HiddenSliceGroup<DayGridSourceSeg>[]
    renderSlices: readonly Slice<DayGridSourceSeg>[]
    slicesByStart: readonly (readonly Slice<DayGridSourceSeg>[])[]
    placementSliceLevels: readonly (readonly Slice<DayGridSourceSeg>[])[]
    sliceCoords: ReadonlyMap<string, number>
    pendingSlices: readonly Slice<DayGridSourceSeg>[]
  },
  sliceHeights: ReadonlyMap<string, number>,
  columnCount: number,
): DayGridPlacementLayout {
  const {
    hiddenGroups,
    renderSlices,
    slicesByStart,
    placementSliceLevels,
    sliceCoords,
    pendingSlices,
  } = layout
  const columns = Array.from(
    { length: columnCount },
    (_, column): DayGridPlacementColumn => ({
      renderSlices: [...slicesByStart[column]],
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
      const sliceHeight = sliceHeights.get(key)!
      const sliceBottom = sliceCoords.get(key)! + sliceHeight
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
    renderSlices,
    sliceCoords,
    isSettled: pendingSlices.length === 0,
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

export function estimateLevelCapacity(eventAreaHeight: number, eventHeight: number): number {
  return Math.max(1, Math.ceil(eventAreaHeight / eventHeight))
}

/**
 * Ratchets the largest partial-to-source growth sample in one live snapshot.
 *
 * A partial without a measured whole source samples against the same fallback
 * base the planner reserves with. Sharing the base makes under-reservation
 * self-correcting in one pass: a sample of measured height `h` against base
 * `B` at compression growth `g` stores rate `(h/B - 1)/g`, so the next plan
 * reserves `B * (1 + rate * g) = h` exactly. The correction lives in this
 * monotone rate, not in the partial's deletable measurement, so hiding the
 * slice cannot erase the evidence that hid it.
 */
export function ratchetDayGridSliceHeightGrowthRate(
  currentRate: number,
  slices: readonly Slice<DayGridSourceSeg>[],
  sliceHeights: ReadonlyMap<string, number>,
  largestWholeHeight: number | undefined,
): number {
  if (largestWholeHeight == null) return currentRate
  let nextRate = currentRate

  for (const slice of slices) {
    const { sourceSeg } = slice
    if (slice.start === sourceSeg.start && slice.end === sourceSeg.end) continue

    const sourceHeight = resolveDayGridSourceHeight(
      sliceHeights,
      sourceSeg.key,
      largestWholeHeight,
    )
    const sliceHeight = sliceHeights.get(getSliceKey(slice))
    if (
      sliceHeight == null ||
      sliceHeight <= sourceHeight + SLICE_HEIGHT_GROWTH_NOISE_FLOOR_PX
    ) continue

    const sourceWidth = sourceSeg.end - sourceSeg.start
    const sliceWidth = slice.end - slice.start
    const compressionGrowth = sourceWidth / sliceWidth - 1
    const observedRate = (sliceHeight / sourceHeight - 1) / compressionGrowth
    if (observedRate > nextRate) {
      nextRate = observedRate
    }
  }

  return nextRate
}

/** Predicts one slice's topology thickness from its source height and row rate. */
export function computeDayGridPlanningSliceThickness(
  slice: Slice<DayGridSourceSeg>,
  sourceHeight: number,
  growthRate: number,
): number {
  const sourceWidth = slice.sourceSeg.end - slice.sourceSeg.start
  const sliceWidth = slice.end - slice.start
  const compressionGrowth = sourceWidth / sliceWidth - 1
  return sourceHeight * (1 + growthRate * compressionGrowth)
}

/**
 * The fallback base for slices whose whole source is unmeasured. Undefined
 * until any whole is measured, which gates the pixel merge.
 *
 * The owning row computes this once per measurement snapshot and hands the
 * same value to the planner and the growth-rate sampler — the one-pass
 * correction fixed point depends on them sharing this base.
 */
export function computeDayGridLargestWholeHeight(
  sourceSegs: readonly DayGridSourceSeg[],
  sliceHeights: ReadonlyMap<string, number>,
): number | undefined {
  let largestWholeHeight: number | undefined

  for (const sourceSeg of sourceSegs) {
    const height = sliceHeights.get(sourceSeg.key)
    if (height != null && (
      largestWholeHeight == null || height > largestWholeHeight
    )) {
      largestWholeHeight = height
    }
  }

  return largestWholeHeight
}

/** The one definition of planning's source-height expression. */
function resolveDayGridSourceHeight(
  sliceHeights: ReadonlyMap<string, number>,
  sourceKey: string,
  largestWholeHeight: number,
): number {
  return sliceHeights.get(sourceKey) ?? largestWholeHeight
}
