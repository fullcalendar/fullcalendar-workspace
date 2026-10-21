import { DateMarker } from '@full-ui/headless-calendar'
import { DayTableCell } from './day-grid-range'

/*
DayGrid's positions: a date's top, the column and row under a point, and the row and cell elements
*/

// TODO: handle hidden-days better. If current day is hidden day, scrolls to way bottom
export function computeTopFromDate(
  date: DateMarker,
  cellRows: DayTableCell[][],
  rowHeightMap: Map<string, number>,
): number | undefined {
  let top = 0

  for (const cells of cellRows) {
    const key = cells[0].key
    const start = cells[0].date
    const end = cells[cells.length - 1].date // inclusive end

    if (date >= start && date <= end) {
      return top
    }

    const rowHeight = rowHeightMap.get(key)

    if (rowHeight == null) {
      return // denote unknown
    }

    top += rowHeight
  }

  return top
}

export function computeColFromPosition(
  positionLeft: number,
  elWidth: number,
  colWidth: number | undefined,
  colCount: number,
  isRtl: boolean,
): {
  col: number,
  left: number,
  right: number,
} {
  const realColWidth = colWidth != null ? colWidth : elWidth / colCount
  const colFromLeft = Math.floor(positionLeft / realColWidth)
  const col = isRtl ? (colCount - colFromLeft - 1) : colFromLeft
  const left = colFromLeft * realColWidth
  const right = left + realColWidth

  return { col, left, right }
}

export function computeRowFromPosition(
  positionTop: number,
  cellRows: DayTableCell[][],
  rowHeightMap: Map<string, number>,
): {
  row: number,
  top: number,
  bottom: number,
} {
  let row = 0
  let top = 0
  let bottom = 0

  for (const cells of cellRows) {
    const key = cells[0].key

    top = bottom
    bottom = top + rowHeightMap.get(key)

    if (positionTop < bottom) {
      break
    }

    row++
  }

  return { row, top, bottom }
}

// Hit elements
// -------------------------------------------------------------------------------------------------

export function getRowEl(rootEl: HTMLElement, row: number): HTMLElement {
  return rootEl.querySelectorAll('[role=row]')[row] as HTMLElement
}

export function getCellEl(rowEl: HTMLElement, col: number): HTMLElement {
  return rowEl.querySelectorAll('[role=cell]')[col] as HTMLElement
}
