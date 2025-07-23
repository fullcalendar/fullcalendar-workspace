import { CalendarOptions } from '@fullcalendar/core'
import { mergeCalendarOptions, mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions, EventCalendarOptionParams } from '@fullcalendar/theme-classic/options-event-calendar'
import React from 'react'
// import { eventCalendarIconOptions } from '../lib/event-calendar-icons.js' // TODO

export const optionParams: EventCalendarOptionParams = {
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
