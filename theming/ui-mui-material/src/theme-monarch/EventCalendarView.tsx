import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions, EventCalendarOptionParams } from '@fullcalendar/theme-monarch-dev/options-event-calendar'
import { createSlots } from '@fullcalendar/theme-monarch-dev/slots'
import { eventCalendarIconOptions } from '../lib/event-calendar-icons.js'

export const optionParams: EventCalendarOptionParams = {
  // TODO: better hasNavLink
  // TODO: use --mui-palette-secondary-mainChannel to choose opacity
  todayPillClass: () => 'bg-(--mui-palette-secondary-main) text-(--mui-palette-secondary-contrastText)',
  miscPillClass: () => 'brightness-115 bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.15)]',

  highlightClass: 'bg-(--mui-palette-primary-main) opacity-10',
  disabledBgClass: 'bg-(--mui-palette-action-disabledBackground)',

  borderColorClass: 'border-(--mui-palette-divider)',
  majorBorderColorClass: 'border-(--mui-palette-action-active)',
  nowIndicatorBorderColorClass: 'border-(--mui-palette-error-main)',

  compactMoreLinkBorderColorClass: 'border-(--mui-palette-primary-main)',

  eventColor: 'var(--mui-palette-primary-main)',
  eventContrastColor: 'var(--mui-palette-primary-contrastText)',
  backgroundEventColor: 'var(--mui-palette-secondary-main)',
  backgroundEventColorClass: 'brightness-115 opacity-15',

  popoverClass: 'text-(--mui-palette-text-primary) bg-(--mui-palette-background-paper) bg-(image:--mui-overlays-8) rounded-(--mui-shape-borderRadius) shadow-(--mui-shadows-8)',

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
