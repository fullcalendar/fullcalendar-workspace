import { CssDimValue, DayHeaderContentArg } from '@fullcalendar/core'
import { DateFormatter, DateMarker, DateProfile, DateProfileGenerator, DaySeriesModel, DayTableCell, DayTableModel, computeFallbackHeaderFormat } from '@fullcalendar/core/internal'
import { ComponentChild } from '@fullcalendar/core/preact'
import { TableSeg } from '../TableSeg.js'

export const HEADER_CELL_CLASS_NAME = 'fc-new-col-header-cell'

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
  rowHeights: { [key: string]: number },
): number | undefined {
  let top = 0

  for (const cells of cellRows) {
    const start = cells[0].date
    const end = cells[cells.length - 1].date
    const key = start.toISOString()

    if (date >= start && date <= end) {
      return top
    }

    top += rowHeights[key]
  }
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
    width = fracToCssDim(colWidthFrac)

    if (isRtl) {
      right = fracToCssDim((colCnt - seg.lastCol - 1) * colWidthFrac)
    } else {
      left = fracToCssDim(seg.firstCol * colWidthFrac)
    }
  }

  return { left, right, width }
}

function fracToCssDim(frac: number): string {
  return frac * 100 + '%'
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
  const col = isRtl ? (colCnt - colFromLeft - 1) : colCnt
  const left = colFromLeft * realColWidth
  const right = left + realColWidth

  return { col, left, right }
}

export function computeRowFromPosition(
  positionTop: number,
  cellRows: DayTableCell[][],
  rowHeights: { [key: string]: number },
): {
  row: number,
  top: number,
  bottom: number,
} {
  let row = 0
  let top = 0
  let bottom = 0

  for (const cells of cellRows) {
    const start = cells[0].date
    const key = start.toISOString()

    top = bottom
    bottom = top + rowHeights[key]

    if (positionTop < bottom) {
      break
    }

    row++
  }

  return { row, top, bottom }
}
