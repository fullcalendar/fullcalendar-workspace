import {
  type HiddenSliceGroup,
  type Slice,
  groupLaterallyIntersecting,
} from '../seg-placement/kernel'
import {
  buildPrintEventBands,
  planPrintDomCandidates,
} from '../seg-placement/print'
import {
  type DayGridEventSeg,
  type DayGridSourceSeg,
  buildDayGridPopoverSegs,
  buildDayGridSegSources,
} from './seg-placement-adapter'
import { type DayRowEventRangePart } from './TableSeg'

export interface DayGridPrintPlan {
  sourceSegs: DayGridSourceSeg[]
  sliceLevels: Slice<DayGridSourceSeg>[][]
  visibleSlices: Slice<DayGridSourceSeg>[]
  hiddenSlices: Slice<DayGridSourceSeg>[]
  hiddenGroups: HiddenSliceGroup<DayGridSourceSeg>[]
  columnCount: number
}

export interface DayGridPrintBandSlot {
  levelIndex: number
  thickness: number
  slice: Slice<DayGridSourceSeg> | null
}

/** Stable identity for one print wrapper when a source is split laterally. */
export function getDayGridPrintSliceKey(slice: Slice<DayGridSourceSeg>): string {
  return `${slice.sourceSeg.key}:${slice.start}:${slice.end}`
}

/** Reduces live slice-wrapper measurements to each source's current maximum. */
export function buildDayGridPrintSegHeights(
  slices: readonly Slice<DayGridSourceSeg>[],
  printSliceHeights: ReadonlyMap<string, number>,
): Map<string, number> {
  const sourceHeights = new Map<string, number>()

  for (const slice of slices) {
    const height = printSliceHeights.get(getDayGridPrintSliceKey(slice))
    if (height != null) {
      sourceHeights.set(
        slice.sourceSeg.key,
        Math.max(sourceHeights.get(slice.sourceSeg.key) ?? 0, height),
      )
    }
  }

  return sourceHeights
}

/** Plans one print row from its complete, resolved-order source list. */
export function buildDayGridPrintPlan(
  eventOrderedSegs: DayGridEventSeg[],
  orderStrict: boolean,
  eventSlicing: boolean,
  columnCount: number,
): DayGridPrintPlan {
  const sourceSegs = buildDayGridSegSources(eventOrderedSegs)
  const candidatePlan = planPrintDomCandidates(sourceSegs, {
    eventOrderStrict: orderStrict,
    eventSlicing,
  })

  return {
    ...candidatePlan,
    sourceSegs,
    hiddenGroups: groupLaterallyIntersecting(candidatePlan.hiddenSlices),
    columnCount,
  }
}

/** Transposes row-wide print bands into one aligned slot sequence per cell. */
export function buildDayGridPrintColumns(
  plan: DayGridPrintPlan,
  printSegHeights: ReadonlyMap<string, number>,
): DayGridPrintBandSlot[][] {
  const columns = Array.from(
    { length: plan.columnCount },
    () => [] as DayGridPrintBandSlot[],
  )

  for (const band of buildPrintEventBands(plan.sliceLevels, printSegHeights)) {
    const slicesByColumn = Array<Slice<DayGridSourceSeg> | null>(plan.columnCount).fill(null)

    for (const slice of band.slices) {
      slicesByColumn[slice.start] = slice
    }

    for (let column = 0; column < plan.columnCount; column++) {
      columns[column].push({
        levelIndex: band.levelIndex,
        thickness: band.thickness,
        slice: slicesByColumn[column],
      })
    }
  }

  return columns
}

/*
Builds the ordinary per-cell more-link inputs from print's final hidden set.
What print actually consumes is `hiddenSegs`, whose per-column count renders
the "+N more" link text on the page. `segs` only feeds the popover/click
paths, unreachable in printed output, but is kept so the shared more-link
component receives an honest contract.
*/
export function buildDayGridPrintPopoverSegs(
  plan: DayGridPrintPlan,
  column: number,
): {
  segs: DayRowEventRangePart[]
  hiddenSegs: DayRowEventRangePart[]
} {
  return buildDayGridPopoverSegs(
    plan.sourceSegs,
    plan.hiddenGroups,
    column,
    plan.columnCount,
  )
}
