import { DayHeaderContentArg } from '@fullcalendar/core'
import { DateFormatter, DateProfile, DateProfileGenerator, DaySeriesModel, DayTableModel, computeFallbackHeaderFormat } from '@fullcalendar/core/internal'
import { ComponentChild } from '@fullcalendar/core/preact'

export const CLASS_NAME = 'fc-col-header-cell' // do the cushion too? no

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
