import {
  type DomCandidatePlan,
  type SegThicknessMap,
  type Slice,
  type SourceSeg,
  createWholeSlice,
} from '../seg-placement/layout'
import {
  buildPrintEventBands,
  planPrintDomCandidates,
} from '../seg-placement/print'
import {
  type DayGridEventSeg,
  DAYGRID_SLICE_OPTIONS,
  buildDayGridPopoverSegs,
  buildDayGridSegSources,
} from './seg-placement-adapter'
import { type DayRowEventRangePart } from './TableSeg'

export interface DayGridPrintPlan extends DomCandidatePlan<DayGridEventSeg> {
  eventOrderedSegs: DayGridEventSeg[]
  sourceSegs: SourceSeg<DayGridEventSeg>[]
  columnCount: number
}

export interface DayGridPrintBandSlot {
  levelIndex: number
  thickness: number
  slice: Slice<DayGridEventSeg> | null
}

export interface DayGridPrintColumn {
  column: number
  bandSlots: DayGridPrintBandSlot[]
}

/** Stable identity for one print wrapper when a source is split laterally. */
export function getDayGridPrintSliceKey(slice: Slice<DayGridEventSeg>): string {
  return `${slice.sourceSeg.key}:${slice.start}:${slice.end}`
}

/** Reduces live slice-wrapper measurements to each source's current maximum. */
export function buildDayGridPrintSegHeights(
  slices: readonly Slice<DayGridEventSeg>[],
  printSliceHeights: SegThicknessMap,
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
    orderStrict,
    eventSlicing,
    ...DAYGRID_SLICE_OPTIONS,
  })
  const mountedKeys = new Set(candidatePlan.mountedSegs.map((source) => source.key))
  const candidateHiddenByKey = new Map<string, Slice<DayGridEventSeg>[]>()

  for (const slice of candidatePlan.hiddenSlices) {
    const key = slice.sourceSeg.key
    const siblings = candidateHiddenByKey.get(key)
    if (siblings) {
      siblings.push(slice)
    } else {
      candidateHiddenByKey.set(key, [slice])
    }
  }

  // A mounted source keeps the candidate planner's final hidden fragments.
  // A never-mounted source is rebuilt as one complete hidden span so print's
  // final hidden set never depends on provisional candidate slicing.
  const hiddenSlices = sourceSegs.flatMap((source) =>
    mountedKeys.has(source.key)
      ? candidateHiddenByKey.get(source.key) ?? []
      : [createWholeSlice(source)]
  )

  return {
    ...candidatePlan,
    eventOrderedSegs,
    sourceSegs,
    hiddenSlices,
    columnCount,
  }
}

/** Transposes row-wide print bands into one aligned slot sequence per cell. */
export function buildDayGridPrintColumns(
  plan: DayGridPrintPlan,
  printSegHeights: SegThicknessMap,
): DayGridPrintColumn[] {
  const columns = Array.from({ length: plan.columnCount }, (_, column) => ({
    column,
    bandSlots: [] as DayGridPrintBandSlot[],
  }))

  for (const band of buildPrintEventBands(plan.levels, printSegHeights)) {
    const slicesByColumn = Array<Slice<DayGridEventSeg> | null>(plan.columnCount).fill(null)

    for (const slice of band.slices) {
      slicesByColumn[slice.start] = slice
    }

    for (let column = 0; column < plan.columnCount; column++) {
      columns[column].bandSlots.push({
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
    {
      sourceSegs: plan.sourceSegs,
      unmountedSlices: plan.hiddenSlices,
    },
    [],
    column,
    plan.columnCount,
  )
}
