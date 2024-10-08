import { EventSegUiInteractionState, Seg } from '@fullcalendar/core/internal'

// this is a DATA STRUCTURE, not a component

export interface TableSeg extends Seg {
  row: number
  firstCol: number
  lastCol: number
  isStandin?: boolean
}

export function splitSegsByRow(segs: TableSeg[], rowCnt: number) {
  const byRow: TableSeg[][] = []

  for (let row = 0; row < rowCnt; row++) {
    byRow[row] = []
  }

  for (const seg of segs) {
    byRow[seg.row].push(seg)
  }

  return byRow
}

export function splitInteractionByRow(
  ui: EventSegUiInteractionState<Seg & { row: number }> | null,
  rowCnt: number,
): EventSegUiInteractionState[] {
  const byRow: EventSegUiInteractionState[] = []

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

export function splitSegsByCol(segs: TableSeg[], colCnt: number) {
  let byCol: TableSeg[][] = []

  for (let col = 0; col < colCnt; col++) {
    byCol.push([])
  }

  for (let seg of segs) {
    for (let col = seg.firstCol; col <= seg.lastCol; col++) {
      if (seg.firstCol !== col) {
        seg = {
          ...seg,
          firstCol: col,
          lastCol: col,
          isStart: false,
          isEnd: seg.isEnd && seg.lastCol === col,
          isStandin: true,
        }
      }
      byCol[col].push(seg)
    }
  }

  return byCol
}
