import { CalendarOptions } from '@fullcalendar/core'
import FullCalendar from '@fullcalendar/react'
import { defaultUiEventCalendarOptions, optionParams } from '@fullcalendar/theme-breezy/ui-default/options-event-calendar'
import { createSlots } from '@fullcalendar/theme-breezy/slots'
import React from 'react'

export function EventCalendarView(options: CalendarOptions) {
  return (
    <FullCalendar
      {...defaultUiEventCalendarOptions.optionDefaults}

      {...createSlots({
        createElement: React.createElement as any, // HACK
        Fragment: React.Fragment as any, // HACK
      }, optionParams)}

      {...options}

      views={{
        ...defaultUiEventCalendarOptions.views,
        ...options.views,
      }}
    />
  )
}
