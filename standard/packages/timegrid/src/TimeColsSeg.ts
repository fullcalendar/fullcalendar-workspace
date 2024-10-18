import { CoordRange, DateMarker, EventSegUiInteractionState } from '@fullcalendar/core/internal'

// JUST A DATA STRUCTURE, not a component

export interface TimeGridRange {
  col: number
  startDate: DateMarker
  endDate: DateMarker
  isStart: boolean
  isEnd: boolean
}

export type TimeGridCoordRange = TimeGridRange & CoordRange

/*
TODO: more DRY with daygrid?
can be given null/undefined!
*/
export function splitSegsByCol<S extends TimeGridRange>(segs: S[] | null, colCnt: number) {
  let segsByCol: S[][] = []
  let i

  for (i = 0; i < colCnt; i += 1) {
    segsByCol.push([])
  }

  if (segs) {
    for (i = 0; i < segs.length; i += 1) {
      segsByCol[segs[i].col].push(segs[i])
    }
  }

  return segsByCol
}

/*
TODO: more DRY with daygrid?
can be given null/undefined!
*/
export function splitInteractionByCol(
  ui: EventSegUiInteractionState<TimeGridRange> | null,
  colCnt: number,
): EventSegUiInteractionState<TimeGridRange>[] {
  let byRow: EventSegUiInteractionState<TimeGridRange>[] = []

  if (!ui) {
    for (let i = 0; i < colCnt; i += 1) {
      byRow[i] = null
    }
  } else {
    for (let i = 0; i < colCnt; i += 1) {
      byRow[i] = {
        affectedInstances: ui.affectedInstances,
        isEvent: ui.isEvent,
        segs: [],
      }
    }

    for (let seg of ui.segs) {
      byRow[seg.col].segs.push(seg)
    }
  }

  return byRow
}
