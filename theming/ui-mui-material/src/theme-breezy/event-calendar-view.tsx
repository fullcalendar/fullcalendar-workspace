import { CalendarOptions } from '@fullcalendar/core'
import { mergeCalendarOptions, mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions, EventCalendarOptionParams } from '@fullcalendar/theme-breezy/options-event-calendar'
import { createSlots } from '@fullcalendar/theme-breezy/slots'
import React from 'react'
import { eventCalendarIconOptions } from '../lib/icons-event-calendar.js'

export const optionParams: EventCalendarOptionParams = {
  // ENSURE the muted by colors are warm, like the toolbar bg color

  primaryBgColorClass: 'bg-(--mui-palette-primary-main)',
  primaryTextColorClass: 'text-(--mui-palette-primary-contrastText)',
  primaryBorderColorClass: 'border-(--mui-palette-primary-main)',

  eventColor: 'var(--mui-palette-primary-main)',
  backgroundEventColor: 'var(--mui-palette-secondary-main)',
  backgroundEventColorClass: 'brightness-115 opacity-15',
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
        eventCalendarIconOptions,
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
