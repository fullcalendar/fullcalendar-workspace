import { CssDimValue, DayHeaderContentArg } from '@fullcalendar/core'
import { DateFormatter, DateMarker, DateProfile, DateProfileGenerator, DaySeriesModel, DayTableCell, DayTableModel, computeFallbackHeaderFormat, fracToCssDim } from '@fullcalendar/core/internal'
import { ComponentChild } from '@fullcalendar/core/preact'
import { TableSeg } from '../TableSeg.js'

export const HEADER_CELL_CLASS_NAME = 'fcnew-col-header-cell' // pointless abstraction?

export function renderInner(renderProps: DayHeaderContentArg): ComponentChild {
  return renderProps.text
}

export function createDayHeaderFormatter(explicitFormat: DateFormatter, datesRepDistinctDays, dateCnt) {
  return explicitFormat || computeFallbackHeaderFormat(datesRepDistinctDays, dateCnt)
}

export function buildDayTableModel(dateProfile: DateProfile, dateProfileGenerator: DateProfileGenerator) {
  let daySeries = new DaySeriesModel(dateProfile.renderRange, dateProfileGenerator)

  return new DayTableModel(
    daySeries,
    /year|month|week/.test(dateProfile.currentRangeUnit),
  )
}

export function computeColWidth(colCnt: number, colMinWidth: number, viewportWidth: number | undefined): [
  canvasWidth: number | undefined,
  colWidth: number | undefined,
] {
  if (viewportWidth == null) {
    return [undefined, undefined]
  }

  const colTempWidth = viewportWidth / colCnt

  if (colTempWidth < colMinWidth) {
    return [colMinWidth * colCnt, colMinWidth]
  }

  return [viewportWidth, undefined]
}

// Header Tier
// -------------------------------------------------------------------------------------------------

export type DateHeaderCellObj = { date: DateMarker, colSpan: number }
export type DayOfWeekHeaderCellObj = { dow: number, colSpan: number }
export type HeaderCellObj = DateHeaderCellObj | DayOfWeekHeaderCellObj

export function buildHeaderTiers(
  dates: DateMarker[],
  datesRepDistinctDays: boolean,
): HeaderCellObj[][] {
  return [
    datesRepDistinctDays
      ? dates.map((date) => ({ colSpan: 1, date }))
      : dates.map((date) => ({ colSpan: 1, dow: date.getUTCDay() }))
  ]
}

// Positioning
// -------------------------------------------------------------------------------------------------

export function computeTopFromDate(
  date: DateMarker,
  cellRows: DayTableCell[][],
  rowHeightMap: Map<string, number>,
): number | undefined {
  let top = 0

  for (const cells of cellRows) {
    const start = cells[0].date
    const end = cells[cells.length - 1].date
    const key = start.toISOString()

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

export function computeHorizontalsFromSeg(
  seg: TableSeg,
  colWidth: number | undefined,
  colCnt: number,
  isRtl: boolean,
): {
  left: CssDimValue | undefined,
  right: CssDimValue | undefined,
  width: CssDimValue | undefined,
} {
  let left: CssDimValue
  let right: CssDimValue
  let width: CssDimValue

  if (colWidth != null) {
    width = (seg.lastCol - seg.firstCol + 1) * colWidth

    if (isRtl) {
      right = (colCnt - seg.lastCol - 1) * colWidth
    } else {
      left = seg.firstCol * colWidth
    }
  } else {
    const colWidthFrac = 1 / colCnt
    width = fracToCssDim((seg.lastCol - seg.firstCol + 1) * colWidthFrac)

    if (isRtl) {
      right = fracToCssDim((colCnt - seg.lastCol - 1) * colWidthFrac)
    } else {
      left = fracToCssDim(seg.firstCol * colWidthFrac)
    }
  }

  return { left, right, width }
}

export function computeColFromPosition(
  positionLeft: number,
  elWidth: number,
  colWidth: number | undefined,
  colCnt: number,
  isRtl: boolean,
): {
  col: number,
  left: number,
  right: number,
} {
  const realColWidth = colWidth != null ? colWidth : elWidth / colCnt
  const colFromLeft = Math.floor(positionLeft / realColWidth)
  const col = isRtl ? (colCnt - colFromLeft - 1) : colFromLeft
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

// Hit Element
// -------------------------------------------------------------------------------------------------

export function getRowEl(rootEl: HTMLElement, row: number): HTMLElement {
  return rootEl.querySelectorAll(':scope > [role=row]')[row] as HTMLElement
}

export function getCellEl(rowEl: HTMLElement, col: number): HTMLElement {
  return rowEl.querySelectorAll(':scope > [role=gridcell]')[col] as HTMLElement
}
