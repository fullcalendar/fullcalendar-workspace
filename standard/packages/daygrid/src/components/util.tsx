import { CssDimValue, DayHeaderData } from '@fullcalendar/core'
import { computeMajorUnit, createFormatter, DateEnv, DateFormatter, DateMarker, DateProfile, DateProfileGenerator, DaySeriesModel, DayTableCell, DayTableModel, fracToCssDim, SlicedCoordRange } from '@fullcalendar/core/internal'
import { ComponentChild } from '@fullcalendar/core/preact'

export function renderInner(renderProps: DayHeaderData): ComponentChild {
  return renderProps.text
}

export function buildDayTableModel(
  dateProfile: DateProfile,
  dateProfileGenerator: DateProfileGenerator,
  dateEnv: DateEnv,
) {
  const daySeries = new DaySeriesModel(dateProfile.renderRange, dateProfileGenerator)
  const breakOnWeeks = /year|month|week/.test(dateProfile.currentRangeUnit)
  const majorUnit = !breakOnWeeks && computeMajorUnit(dateProfile, dateEnv)

  return new DayTableModel(daySeries, breakOnWeeks, dateEnv, majorUnit)
}

export function computeColWidth(colCount: number, colMinWidth: number, viewportWidth: number | undefined): [
  canvasWidth: number | undefined, // does NOT include scrollbar gutter
  colWidth: number | undefined,
] {
  if (viewportWidth == null) {
    return [undefined, undefined]
  }

  const colTempWidth = viewportWidth / colCount

  if (colTempWidth < colMinWidth) {
    return [colMinWidth * colCount, colMinWidth]
  }

  return [viewportWidth, undefined]
}

// Positioning
// -------------------------------------------------------------------------------------------------

export function computeTopFromDate(
  date: DateMarker,
  cellRows: DayTableCell[][],
  rowHeightMap: Map<string, number>,
  adjust = 0
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

    top += rowHeight + adjust
  }

  return top
}

/*
FYI, `width` is not dependable for aligning completely to farside
*/
export function computeHorizontalsFromSeg(
  seg: SlicedCoordRange,
  colWidth: number | undefined,
  colCount: number,
): {
  insetInlineStart: CssDimValue | undefined,
  insetInlineEnd: CssDimValue | undefined,
} {
  let fromStart: CssDimValue
  let fromEnd: CssDimValue

  if (colWidth != null) {
    fromStart = seg.start * colWidth
    fromEnd = (colCount - seg.end) * colWidth
  } else {
    const colWidthFrac = 1 / colCount
    fromStart = fracToCssDim(seg.start * colWidthFrac)
    fromEnd = fracToCssDim(1 - seg.end * colWidthFrac)
  }

  return { insetInlineStart: fromStart, insetInlineEnd: fromEnd }
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

// Hit Element
// -------------------------------------------------------------------------------------------------

export function getRowEl(rootEl: HTMLElement, row: number): HTMLElement {
  return rootEl.querySelectorAll('[role=row]')[row] as HTMLElement
}

export function getCellEl(rowEl: HTMLElement, col: number): HTMLElement {
  return rowEl.querySelectorAll('[role=gridcell]')[col] as HTMLElement
}

// Header Formatting
// -------------------------------------------------------------------------------------------------

export const dayMicroWidth = 50

export const dayHeaderMicroFormat = createFormatter({
  weekday: 'narrow'
})

export function createDayHeaderFormatter(
  explicitFormat: DateFormatter,
  datesRepDistinctDays: boolean,
  dateCnt: number,
): DateFormatter {
  return explicitFormat || computeFallbackHeaderFormat(datesRepDistinctDays, dateCnt)
}

// Computes a default column header formatting string if `colFormat` is not explicitly defined
function computeFallbackHeaderFormat(datesRepDistinctDays: boolean, dayCnt: number): DateFormatter {
  // if more than one week row, or if there are a lot of columns with not much space,
  // put just the day numbers will be in each cell
  if (!datesRepDistinctDays) {
    return createFormatter({ weekday: 'short' }) // "Sat"
  }

  if (dayCnt > 1) {
    return createFormatter({ // "Sat 11"
      weekday: 'short',
      weekdayJustify: 'start',
      day: 'numeric',
      omitCommas: true,
    })
  }

  return createFormatter({ // "Saturday 11"
    weekday: 'long',
    weekdayJustify: 'start',
    day: 'numeric',
    omitCommas: true,
  })
}
