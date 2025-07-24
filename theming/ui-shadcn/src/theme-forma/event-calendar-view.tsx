import { CalendarOptions } from '@fullcalendar/core'
import { mergeCalendarOptions, mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions, EventCalendarOptionParams } from '@fullcalendar/theme-forma/options-event-calendar'
import { createSlots } from '@fullcalendar/theme-forma/slots'
import React from 'react'
// import { eventCalendarIconOptions } from '../lib/event-calendar-icons.js' // TODO

export const optionParams: EventCalendarOptionParams = {
  primaryBgColorClass: 'bg-primary',
  primaryTextColorClass: 'text-primary-foreground',
  primaryBorderColorClass: 'border-primary',
  eventColor: 'var(--primary)',
}

const baseEventCalendarOptions = createEventCalendarOptions(optionParams)

const slots = createSlots({
  createElement: React.createElement as any, // HACK
  Fragment: React.Fragment as any, // HACK
}, optionParams)

export function EventCalendarView(options: CalendarOptions) {
  return (
    <FullCalendar
      {...mergeCalendarOptions(
        baseEventCalendarOptions.optionDefaults,
        // eventCalendarIconOptions,
        slots,
        options,
      )}
      views={mergeViewOptionsMap(
        baseEventCalendarOptions.views || {},
        options.views || {},
      )}
    />
  )
}
