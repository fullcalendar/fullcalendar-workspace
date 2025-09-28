import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions, EventCalendarOptionParams } from '@fullcalendar/theme-forma-dev/options-event-calendar'
import { createSlots } from '@fullcalendar/theme-forma-dev/slots'
import { eventCalendarIconOptions } from '../lib/event-calendar-icons.js'

export const optionParams: EventCalendarOptionParams = {
  primaryBgColorClass: 'bg-(--mui-palette-primary-main)',
  primaryTextColorClass: 'text-(--mui-palette-primary-contrastText)',
  primaryBorderColorClass: 'border-(--mui-palette-primary-main)',

  ghostButtonClass: 'hover:bg-(--mui-palette-action-hover) focus-visible:bg-(--mui-palette-action-focus)',
  cloudyBgClass: 'bg-(--mui-palette-action-selected)',

  highlightClass: 'bg-(--mui-palette-primary-main) opacity-10',

  strongBorderColorClass: 'border-(--mui-palette-action-active)',

  borderColorClass: 'border-(--mui-palette-divider)',
  nowBorderColorClass: 'border-(--mui-palette-error-main)',

  glassyBgClass: 'bg-(--mui-palette-action-hover)',
  mutedBgClass: 'bg-(--mui-palette-action-hover)',
  strongBgClass: 'bg-(--mui-palette-action-selected)',

  eventColor: 'var(--mui-palette-primary-main)',
  bgEventColor: 'var(--mui-palette-secondary-main)',
  bgEventColorClass: 'brightness-115 opacity-15',

  popoverClass: 'text-(--mui-palette-text-primary) bg-(--mui-palette-background-paper) rounded-(--mui-shape-borderRadius) shadow-(--mui-shadows-8) m-1',

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
