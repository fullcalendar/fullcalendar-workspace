import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions, EventCalendarOptionParams } from '@fullcalendar/theme-classic-dev/options-event-calendar'
import { eventCalendarIconOptions } from '../lib/event-calendar-icons.js'

const hoverButtonClass = 'hover:bg-(--mui-palette-action-hover) focus-visible:bg-(--mui-palette-action-focus)'
const selectedButtonClass = 'bg-(--mui-palette-action-selected)'

/*
these classnames will need to be converted to static css file...
  either find a way to gneerate this css using style-whatever lib under the hood that MUI uses
  [or] somehow use sx={} with variables
  [or] include the static .css file and pray webpack/vite are okay with that
*/
export const optionParams: EventCalendarOptionParams = {
  borderColorClass: 'border-(--mui-palette-divider)',
  majorBorderColorClass: 'border-(--mui-palette-action-active)',
  nowIndicatorBorderColorClass: 'border-(--mui-palette-error-main)',
  nowIndicatorBorderStartColorClass: 'border-s-(--mui-palette-error-main)',
  nowIndicatorBorderTopColorClass: 'border-t-(--mui-palette-error-main)',
  compactMoreLinkBorderColorClass: 'border-(--mui-palette-primary-main)',
  todayBgClass: 'bg-[rgba(var(--mui-palette-warning-mainChannel)_/_0.1)]',
  highlightClass: 'bg-(--mui-palette-primary-main) opacity-10',
  transparentMutedBgClass: 'bg-(--mui-palette-action-hover)',
  // HACK to remove transparency from muted color
  opaqueMutedBgClass: 'bg-(--mui-palette-background-paper) relative before:absolute before:inset-0 before:bg-(--mui-palette-action-hover) before:pointer-events-none',
  mutedBgClass: 'bg-(--mui-palette-action-hover)',
  mutedTextColorClass: 'text-(--mui-palette-text-secondary)',
  eventColor: 'var(--mui-palette-primary-main)',
  eventContrastColor: 'var(--mui-palette-primary-contrastText)',
  backgroundEventColor: 'var(--mui-palette-secondary-main)',
  backgroundEventColorClass: 'brightness-115 opacity-10',
  hoverRowClass: hoverButtonClass, // same
  hoverButtonClass,
  selectedButtonClass: selectedButtonClass,
  popoverClass: 'text-(--mui-palette-text-primary) bg-(--mui-palette-background-paper) rounded-(--mui-shape-borderRadius) overflow-hidden shadow-(--mui-shadows-8) m-2',
  bgColorClass: 'bg-(--mui-palette-background-paper)',
  bgColorOutlineClass: 'outline-(--mui-palette-background-paper)',
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
