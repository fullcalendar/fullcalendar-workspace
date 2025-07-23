import { CalendarOptions } from '@fullcalendar/core'
import { mergeCalendarOptions, mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { defaultUiEventCalendarOptions } from '@fullcalendar/theme-classic/ui-default/options-event-calendar'
import React from 'react'

export function EventCalendarView(options: CalendarOptions) {
  return (
    <FullCalendar
      {...mergeCalendarOptions(
        defaultUiEventCalendarOptions.optionDefaults,
        options,
      )}
      views={mergeViewOptionsMap(
        defaultUiEventCalendarOptions.views || {},
        options.views || {},
      )}
    />
  )
}
