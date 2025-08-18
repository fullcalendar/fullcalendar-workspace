import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions, EventCalendarOptionParams } from '@fullcalendar/theme-classic-dev/options-event-calendar'
import { eventCalendarIconOptions } from '../lib/event-calendar-icons.js'

export const optionParams: EventCalendarOptionParams = {
  borderColorClass: 'border-(--mui-palette-divider)',
  nowIndicatorBorderColorClass: 'border-(--mui-palette-error-main)',
  nowIndicatorBorderStartColorClass: 'border-s-(--mui-palette-error-main)',
  nowIndicatorBorderTopColorClass: 'border-t-(--mui-palette-error-main)',
  compactMoreLinkBorderColorClass: 'border-(--mui-palette-primary-main)',
  todayBgClass: 'bg-[rgba(var(--mui-palette-warning-mainChannel)_/_0.1)]',
  disabledBgClass: 'bg-(--mui-palette-action-disabledBackground)',
  highlightClass: 'bg-(--mui-palette-primary-main) opacity-10',
  eventColor: 'var(--mui-palette-primary-main)',
  eventContrastColor: 'var(--mui-palette-primary-contrastText)',
  backgroundEventColor: 'var(--mui-palette-secondary-main)',
  backgroundEventColorClass: 'brightness-115 opacity-10',
  popoverClass: 'text-(--mui-palette-text-primary) bg-(--mui-palette-background-paper) rounded-(--mui-shape-borderRadius) overflow-hidden shadow-(--mui-shadows-8) m-2',
  pageBgColorClass: 'bg-(--mui-palette-background-paper)',
  pageBgColorOutlineClass: 'outline-(--mui-palette-background-paper)',
}

const baseEventCalendarOptions = createEventCalendarOptions(optionParams)

export default function EventCalendarView(calendarOptions: CalendarOptions) {
  return (
    <FullCalendar
      {...baseEventCalendarOptions.optionDefaults}
      {...eventCalendarIconOptions}
      {...calendarOptions}
      views={mergeViewOptionsMap(
        baseEventCalendarOptions.views || {},
        calendarOptions.views || {},
      )}
    />
  )
}
