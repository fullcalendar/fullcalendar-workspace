import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions, EventCalendarOptionParams } from '@fullcalendar/theme-monarch-dev/options-event-calendar'
import { createSlots } from '@fullcalendar/theme-monarch-dev/slots'
import { eventCalendarIconOptions } from '../lib/event-calendar-icons.js'

// less-contrasty version of primary (like the selected tab)
const secondaryClass = 'bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.15)] brightness-110'
const secondaryPressableClass = `${secondaryClass} hover:bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.2)] focus-visible:bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.3)]`

// tertiary is actually the secondary (like an accent color)
const tertiaryClass = 'bg-(--mui-palette-secondary-main) text-(--mui-palette-secondary-contrastText)'
const tertiaryPressableClass = `${tertiaryClass} hover:brightness-110 focus-visible:outline-3 outline-[rgba(var(--mui-palette-text-primaryChannel)_/_0.15)]`

export const optionParams: EventCalendarOptionParams = {
  secondaryClass,
  secondaryPressableClass,
  tertiaryClass,
  tertiaryPressableClass,

  ghostPressableClass: 'hover:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.075)] focus-visible:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.15)] outline-(--mui-palette-primary-main)',
  ghostSelectedClass: 'bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.15)]',

  blockFocusableClass: 'focus-visible:outline-3 outline-[rgba(var(--mui-palette-text-primaryChannel)_/_0.15)]',
  blockSelectedClass: 'outline-3 outline-[rgba(var(--mui-palette-text-primaryChannel)_/_0.15)]',

  mutedBgClass: 'bg-(--mui-palette-action-hover)',
  mutedWashClass: 'bg-(--mui-palette-action-hover)',
  strongBgClass: 'bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.15)]',
  highlightClass: 'bg-(--mui-palette-primary-main) opacity-10',

  borderColorClass: 'border-(--mui-palette-divider)',
  primaryBorderColorClass: 'border-(--mui-palette-primary-main)',
  strongBorderColorClass: 'border-(--mui-palette-action-active)',
  nowBorderColorClass: 'border-(--mui-palette-error-main)',

  eventColor: 'var(--mui-palette-primary-main)',
  eventContrastColor: 'var(--mui-palette-primary-contrastText)',
  bgEventColor: 'var(--mui-palette-secondary-main)',
  bgEventColorClass: 'brightness-115 opacity-15',

  popoverClass: 'text-(--mui-palette-text-primary) bg-(--mui-palette-background-paper) bg-(image:--mui-overlays-8) rounded-(--mui-shape-borderRadius) shadow-(--mui-shadows-8)',

  bgClass: 'bg-(--mui-palette-background-paper)',
  bgOutlineClass: 'outline-(--mui-palette-background-paper)',
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
