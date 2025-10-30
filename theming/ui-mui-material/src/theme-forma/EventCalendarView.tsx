import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions } from '@fullcalendar/theme-forma-dev/options-event-calendar'
import { createSlots } from '@fullcalendar/theme-forma-dev/slots'
import { eventCalendarIconOptions } from '../lib/event-calendar-icons.js'
import { params } from '../lib/params.js'

const baseEventCalendarOptions = createEventCalendarOptions(params)

const slots = createSlots({
  createElement: React.createElement as any, // HACK
  Fragment: React.Fragment as any, // HACK
}, params)

export default function EventCalendarView(calendarOptions: CalendarOptions) {
  return (
    <FullCalendar
      {...baseEventCalendarOptions.optionDefaults}
      {...eventCalendarIconOptions}
      {...slots}
      {...calendarOptions}
      views={mergeViewOptionsMap(
        baseEventCalendarOptions.views || {},
        calendarOptions.views || {},
      )}
    />
  )
}
