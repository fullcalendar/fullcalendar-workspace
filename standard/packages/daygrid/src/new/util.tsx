import { DayHeaderContentArg } from '@fullcalendar/core'
import { DateFormatter, DateMarker, DateProfile, DateProfileGenerator, DaySeriesModel, DayTableModel, computeFallbackHeaderFormat } from '@fullcalendar/core/internal'
import { ComponentChild } from '@fullcalendar/core/preact'

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
