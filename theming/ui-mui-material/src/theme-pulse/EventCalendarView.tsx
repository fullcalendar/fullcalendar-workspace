import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions, EventCalendarOptionParams } from '@fullcalendar/theme-pulse-dev/options-event-calendar'
import { createSlots } from '@fullcalendar/theme-pulse-dev/slots'
import { eventCalendarIconOptions } from '../lib/event-calendar-icons.js'

export const optionParams: EventCalendarOptionParams = {
  todayCircleBgColorClass: 'bg-(--mui-palette-secondary-main)',
  todayCircleTextColorClass: 'text-(--mui-palette-secondary-contrastText)',

  borderColorClass: 'border-(--mui-palette-divider)',

  mutedBgClass: 'bg-(--mui-palette-action-hover)',
  mutedTextClass: 'text-(--mui-palette-text-secondary)',
  mutedExtraTextClass: 'text-(--mui-palette-text-secondary)',

  eventColor: 'var(--mui-palette-primary-main)',
  eventContrastColor: 'var(--mui-palette-primary-contrastText)',
  backgroundEventColor: 'var(--mui-palette-secondary-main)',
  backgroundEventColorClass: 'brightness-115 opacity-15',

  bgColorClass: 'bg-(--mui-palette-background-paper)',
  bgColorOutlineClass: 'outline-(--mui-palette-background-paper)',
}

const baseEventCalendarOptions = createEventCalendarOptions(optionParams)

const slots = createSlots({
  createElement: React.createElement as any, // HACK
  Fragment: React.Fragment as any, // HACK
}, optionParams)

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
