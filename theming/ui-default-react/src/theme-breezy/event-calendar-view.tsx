import { CalendarOptions } from '@fullcalendar/core'
import { mergeCalendarOptions, mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { defaultUiEventCalendarOptions, optionParams } from '@fullcalendar/theme-breezy/ui-default/options-event-calendar'
import { createSlots } from '@fullcalendar/theme-breezy/slots'
import React from 'react'

const slots = createSlots({
  createElement: React.createElement as any, // HACK
  Fragment: React.Fragment as any, // HACK
}, optionParams)

export function EventCalendarView(options: CalendarOptions) {
  return (
    <FullCalendar
      {...mergeCalendarOptions(
        defaultUiEventCalendarOptions.optionDefaults,
        slots,
        options,
      )}
      views={mergeViewOptionsMap(
        defaultUiEventCalendarOptions.views || {},
        options.views || {},
      )}
    />
  )
}
