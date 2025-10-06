import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions, EventCalendarOptionParams } from '@fullcalendar/theme-pulse-dev/options-event-calendar'
import { createSlots } from '@fullcalendar/theme-pulse-dev/slots'
import { eventCalendarIconOptions } from '../lib/event-calendar-icons.js'

const tertiaryClass = 'bg-(--mui-palette-secondary-main) text-(--mui-palette-secondary-contrastText)'
const tertiaryPressableClass = tertiaryClass // TODO: effects!

const ghostHoverClass = 'hover:bg-(--mui-palette-action-hover)'
const ghostPressableClass = `${ghostHoverClass} focus-visible:bg-(--mui-palette-action-focus)` // TODO: active effect!

export const optionParams: EventCalendarOptionParams = {
  tertiaryClass,
  tertiaryPressableClass,

  ghostHoverClass,
  ghostPressableClass,

  mutedBgClass: 'bg-(--mui-palette-action-hover)',
  mutedWashClass: 'bg-(--mui-palette-action-hover)',
  strongBgClass: 'bg-(--mui-palette-divider)',
  highlightClass: 'bg-(--mui-palette-primary-main) opacity-10',

  borderColorClass: 'border-(--mui-palette-divider)',
  strongBorderColorClass: 'border-(--mui-palette-action-active)',
  nowBorderColorClass: 'border-(--mui-palette-error-main)',

  eventColor: 'var(--mui-palette-primary-main)',
  eventContrastColor: 'var(--mui-palette-primary-contrastText)',
  bgEventColor: 'var(--mui-palette-secondary-main)',
  bgEventColorClass: 'brightness-115 opacity-15',

  popoverClass: 'text-(--mui-palette-text-primary) bg-(--mui-palette-background-paper) rounded-(--mui-shape-borderRadius) overflow-hidden shadow-(--mui-shadows-8) m-2',

  bgOutlineColorClass: 'outline-(--mui-palette-background-paper)',
  bgClass: 'bg-(--mui-palette-background-paper)',

  strongFgClass: 'text-(--mui-palette-text-primary)',
  fgClass: 'text-(--mui-palette-text-secondary)',
  mutedFgClass: 'text-(--mui-palette-text-secondary)',
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
