import { DayGridRange, SlicedCoordRange } from '@fullcalendar/core/internal'
import { EventSegUiInteractionState } from '@fullcalendar/core/internal'

// DayGridRange utils (TODO: move)
// -------------------------------------------------------------------------------------------------

export function splitSegsByRow<S extends DayGridRange>(segs: S[], rowCnt: number): S[][] {
  const byRow: S[][] = []

  for (let row = 0; row < rowCnt; row++) {
    byRow[row] = []
  }

  for (const seg of segs) {
    byRow[seg.row].push(seg)
  }

  return byRow
}

export function splitInteractionByRow(
  ui: EventSegUiInteractionState<DayGridRange> | null,
  rowCnt: number,
): EventSegUiInteractionState<DayGridRange>[] {
  const byRow: EventSegUiInteractionState<DayGridRange>[] = []

  if (!ui) {
    for (let row = 0; row < rowCnt; row++) {
      byRow[row] = null
    }
  } else {
    for (let row = 0; row < rowCnt; row++) {
      byRow[row] = {
        affectedInstances: ui.affectedInstances,
        isEvent: ui.isEvent,
        segs: [],
      }
    }

    for (const seg of ui.segs) {
      byRow[seg.row].segs.push(seg)
    }
  }

  return byRow
}

export function splitSegsByCol<R extends SlicedCoordRange>(
  segs: R[],
  colCnt: number,
): (R & { isStandin?: boolean })[][] {
  let byCol: (R & { isStandin?: boolean })[][] = []

  for (let col = 0; col < colCnt; col++) {
    byCol.push([])
  }

  let seg: (R & { isStandin?: boolean })

  for (seg of segs) {
    for (let col = seg.start; col < seg.end; col++) {
      if (seg.start !== col) {
        seg = {
          ...seg,
          start: col,
          end: col + 1,
          isStart: false,
          isEnd: seg.isEnd && seg.end - 1 === col,
          isStandin: true,
        }
      }
      byCol[col].push(seg)
    }
  }

  return byCol
}
