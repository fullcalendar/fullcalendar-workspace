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

  eventColor: 'var(--mui-palette-primary-main)',
  eventContrastColor: 'var(--mui-palette-primary-contrastText)',
  backgroundEventColor: 'var(--mui-palette-secondary-main)',
  backgroundEventColorClass: 'brightness-115 opacity-15',

  bgColorOutlineClass: 'outline-(--mui-palette-background-paper)',
  bgColorClass: 'bg-(--mui-palette-background-paper)',

  highlightClass: 'bg-(--mui-palette-primary-main) opacity-10',
  ghostButtonClass: 'hover:bg-(--mui-palette-action-hover) focus-visible:bg-(--mui-palette-action-focus)',

  popoverClass: 'text-(--mui-palette-text-primary) bg-(--mui-palette-background-paper) rounded-(--mui-shape-borderRadius) overflow-hidden shadow-(--mui-shadows-8) m-2',

  mutedTransparentBgClass: 'bg-(--mui-palette-action-hover)',
  mutedBgClass: 'bg-(--mui-palette-action-hover)',
  neutralBgClass: 'bg-(--mui-palette-divider)',

  strongTextColorClass: 'text-(--mui-palette-text-primary)',
  textColorClass: 'text-(--mui-palette-text-secondary)',
  mutedTextColorClass: 'text-(--mui-palette-text-secondary)',

  nowBorderColorClass: 'border-(--mui-palette-error-main)',
  strongBorderColorClass: 'border-(--mui-palette-action-active)',
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
