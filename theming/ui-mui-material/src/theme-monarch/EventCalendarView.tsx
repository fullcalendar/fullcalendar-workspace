import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions, EventCalendarOptionParams } from '@fullcalendar/theme-monarch-dev/options-event-calendar'
import { createSlots } from '@fullcalendar/theme-monarch-dev/slots'
import { eventCalendarIconOptions } from '../lib/event-calendar-icons.js'

const focusOutlineClass = 'focus-visible:outline-3 outline-[rgba(var(--mui-palette-secondary-mainChannel)_/_0.5)] outline-offset-1'
const selectedOutlineClass = 'outline-3 outline-[rgba(var(--mui-palette-secondary-mainChannel)_/_0.5)] outline-offset-1'

// less-contrasty version of primary (like the selected tab)
const secondaryClass = 'bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.15)] brightness-110'
const secondaryPressableClass = `${secondaryClass} hover:bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.2)] active:bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.3)] focus-visible:bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.3)] ${focusOutlineClass}`

// tertiary is actually the secondary (like an accent color)
const tertiaryClass = 'bg-(--mui-palette-secondary-main) text-(--mui-palette-secondary-contrastText)'
const tertiaryPressableClass = `${tertiaryClass} hover:bg-[rgba(var(--mui-palette-secondary-mainChannel)_/_0.9)] active:bg-[rgba(var(--mui-palette-secondary-mainChannel)_/_0.8)] focus-visible:bg-[rgba(var(--mui-palette-secondary-mainChannel)_/_0.8)] ${focusOutlineClass}`

// ghost
const ghostHoverClass = 'hover:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.075)]'
const ghostPressableClass = `${ghostHoverClass} active:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.15)] focus-visible:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.15)] ${focusOutlineClass}`

export const optionParams: EventCalendarOptionParams = {
  secondaryClass,
  secondaryPressableClass,

  tertiaryClass,
  tertiaryPressableClass,

  ghostHoverClass,
  ghostPressableClass,

  focusOutlineClass,
  selectedOutlineClass,

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

  disabledFgClass: 'text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.4)]',
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
