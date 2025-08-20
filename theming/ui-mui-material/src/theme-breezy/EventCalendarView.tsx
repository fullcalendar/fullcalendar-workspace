import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions, EventCalendarOptionParams } from '@fullcalendar/theme-breezy-dev/options-event-calendar'
import { createSlots } from '@fullcalendar/theme-breezy-dev/slots'
import { eventCalendarIconOptions } from '../lib/event-calendar-icons.js'

const borderColorClass = 'border-(--mui-palette-divider)'
const borderStartColorClass = 'border-s-(--mui-palette-divider)'
const borderBottomColorClass = 'border-b-(--mui-palette-divider)'

export const optionParams: EventCalendarOptionParams = {
  // ENSURE the muted by colors are warm, like the toolbar bg color
  primaryBgColorClass: 'bg-(--mui-palette-primary-main)',
  primaryTextColorClass: 'text-(--mui-palette-primary-contrastText)',
  primaryBorderColorClass: 'border-(--mui-palette-primary-main)',

  eventColor: 'var(--mui-palette-primary-main)',
  backgroundEventColor: 'var(--mui-palette-secondary-main)',
  backgroundEventColorClass: 'brightness-115 opacity-15',

  popoverClass: 'text-(--mui-palette-text-primary) bg-(--mui-palette-background-paper) rounded-(--mui-shape-borderRadius) shadow-(--mui-shadows-8)',

  bgColorClass: 'bg-(--mui-palette-background-paper)',
  bgColorOutlineClass: 'outline-(--mui-palette-background-paper)',

  borderLowColorClass: borderColorClass,
  borderMedColorClass: borderColorClass,
  borderStartMedColorClass: borderStartColorClass,
  borderHighColorClass: borderColorClass,
  borderBottomHighColorClass: borderBottomColorClass,
}

const baseEventCalendarOptions = createEventCalendarOptions(optionParams)

const slots = createSlots({
  createElement: React.createElement as any,
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
        calendarOptions.views || {}
      )}
    />
  )
}
