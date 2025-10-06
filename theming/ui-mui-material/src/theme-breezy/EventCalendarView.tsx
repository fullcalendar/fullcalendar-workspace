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

const outlineConfigClass = 'outline-[rgba(var(--mui-palette-secondary-mainChannel)_/_0.5)]'
const focusOutlineClass = `focus-visible:outline-3 ${outlineConfigClass}`

const primaryClass = 'bg-(--mui-palette-primary-main) text-(--mui-palette-primary-contrastText)'
const primaryPressableClass = primaryClass // TODO: hover effect!

// ghost
const ghostHoverClass = 'hover:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.075)]'
const ghostPressableClass = `${ghostHoverClass} active:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.15)] focus-visible:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.15)] ${focusOutlineClass}`

export const optionParams: EventCalendarOptionParams = {
  primaryClass,
  primaryPressableClass,

  ghostHoverClass,
  ghostPressableClass,

  strongBgClass: 'bg-(--mui-palette-divider)',
  mutedBgClass: 'bg-(--mui-palette-action-hover)',
  mutedWashClass: 'bg-(--mui-palette-action-hover)',
  highlightClass: 'bg-(--mui-palette-primary-main) opacity-10',

  borderColorClass,
  borderStartColorClass,
  primaryBorderColorClass: 'border-(--mui-palette-primary-main)',
  strongBorderColorClass: borderColorClass,
  strongBorderBottomColorClass: borderBottomColorClass,
  mutedBorderColorClass: borderColorClass,
  nowBorderColorClass: 'border-(--mui-palette-error-main)',

  eventColor: 'var(--mui-palette-primary-main)',
  bgEventColor: 'var(--mui-palette-secondary-main)',
  bgEventColorClass: 'brightness-115 opacity-15',

  popoverClass: 'text-(--mui-palette-text-primary) bg-(--mui-palette-background-paper) bg-(image:--mui-overlays-8) rounded-(--mui-shape-borderRadius) shadow-(--mui-shadows-8)',

  bgClass: 'bg-(--mui-palette-background-paper)',
  bgOutlineColorClass: 'outline-(--mui-palette-background-paper)',

  textLowColorClass: 'text-(--mui-palette-text-secondary)',
  textMidColorClass: 'text-(--mui-palette-text-secondary)',
  textHighColorClass: 'text-(--mui-palette-text-primary)',
  textHeaderColorClass: 'text-(--mui-palette-text-primary)',
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
