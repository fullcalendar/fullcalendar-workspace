import { CalendarOptions } from '@fullcalendar/core'
import { mergeCalendarOptions, mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions, EventCalendarOptionParams } from '@fullcalendar/theme-classic/options-event-calendar'
import React from 'react'
// import { eventCalendarIconOptions } from '../lib/event-calendar-icons.js' // TODO

export const optionParams: EventCalendarOptionParams = {
  borderColorClass: '', // border-color is set globally
  majorBorderColorClass: 'border-ring', // if atomic var ... majorBorderColor: 'var(--ring)'
  alertBorderColorClass: 'border-destructive',
  alertBorderStartColorClass: 'border-s-destructive',

  eventColor: 'var(--primary)',
  eventContrastColor: 'var(--primary-foreground)',
  backgroundEventColor: 'var(--primary)',
  backgroundEventColorClass: 'opacity-15',
}

const baseEventCalendarOptions = createEventCalendarOptions(optionParams)

export function EventCalendarView(options: CalendarOptions) {
  return (
    <FullCalendar
      {...mergeCalendarOptions(
        baseEventCalendarOptions.optionDefaults,
        // eventCalendarIconOptions,
        options,
      )}
      views={mergeViewOptionsMap(
        baseEventCalendarOptions.views || {},
        options.views || {},
      )}
    />
  )
}
