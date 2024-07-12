import { DayHeaderContentArg } from '@fullcalendar/core'
import { DateFormatter, computeFallbackHeaderFormat } from '@fullcalendar/core/internal'
import { ComponentChild } from '@fullcalendar/core/preact'

export const CLASS_NAME = 'fc-col-header-cell' // do the cushion too? no

export function renderInner(renderProps: DayHeaderContentArg): ComponentChild {
  return renderProps.text
}

export function createDayHeaderFormatter(explicitFormat: DateFormatter, datesRepDistinctDays, dateCnt) {
  return explicitFormat || computeFallbackHeaderFormat(datesRepDistinctDays, dateCnt)
}
