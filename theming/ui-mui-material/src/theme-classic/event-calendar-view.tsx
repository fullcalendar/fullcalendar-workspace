import { CalendarOptions } from '@fullcalendar/core'
import { mergeCalendarOptions, mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions, EventCalendarOptionParams } from '@fullcalendar/theme-classic/options-event-calendar'
import React from 'react'
import { eventCalendarIconOptions } from '../lib/icons-event-calendar.js'

export const optionParams: EventCalendarOptionParams = {
  borderColorClass: 'border-(--mui-palette-divider)',
  majorBorderColorClass: 'border-(--mui-palette-primary-main)', // will have color. might be cool
  alertBorderColorClass: 'border-(--mui-palette-error-main)',
  alertBorderStartColorClass: 'border-s-(--mui-palette-error-main)',

  eventColor: 'var(--mui-palette-primary-main)',
  eventContrastColor: 'var(--mui-palette-primary-contrastText)',
  backgroundEventColor: 'var(--mui-palette-secondary-main)',
  backgroundEventColorClass: 'brightness-115 opacity-15',
}

const baseEventCalendarOptions = createEventCalendarOptions(optionParams)

export function EventCalendarView(options: CalendarOptions) {
  return (
    <FullCalendar
      {...mergeCalendarOptions(
        baseEventCalendarOptions.optionDefaults,
        eventCalendarIconOptions,
        options,
      )}
      views={mergeViewOptionsMap(
        baseEventCalendarOptions.views || {},
        options.views || {},
      )}
    />
  )
}
