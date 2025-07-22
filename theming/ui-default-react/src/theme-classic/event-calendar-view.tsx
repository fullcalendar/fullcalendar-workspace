import { CalendarOptions } from '@fullcalendar/core'
import FullCalendar from '@fullcalendar/react'
import { defaultUiEventCalendarOptions } from '@fullcalendar/theme-classic/ui-default/options-event-calendar'
import React from 'react'

export function EventCalendarView(options: CalendarOptions) {
  return (
    <FullCalendar
      {...defaultUiEventCalendarOptions.optionDefaults}
      {...options}

      views={{
        ...defaultUiEventCalendarOptions.views,
        ...options.views,
      }}
    />
  )
}
