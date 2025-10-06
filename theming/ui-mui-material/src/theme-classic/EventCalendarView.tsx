import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions, EventCalendarOptionParams } from '@fullcalendar/theme-classic-dev/options-event-calendar'
import { eventCalendarIconOptions } from '../lib/event-calendar-icons.js'

const outlineConfigClass = 'outline-[rgba(var(--mui-palette-secondary-mainChannel)_/_0.5)]'
const focusOutlineClass = `focus-visible:outline-3 ${outlineConfigClass}`

// less-contrasty version of primary (like the selected tab)
// TODO: if it looks bad in Classic, make a new mutedPressableClass!
const secondaryClass = 'bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.15)] brightness-110'
const secondaryPressableClass = `${secondaryClass} hover:bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.2)] active:bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.3)] focus-visible:bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.3)] ${focusOutlineClass}`

// ghost
const ghostHoverClass = 'hover:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.075)]'
const ghostPressableClass = `${ghostHoverClass} active:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.15)] focus-visible:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.15)] ${focusOutlineClass}`

const faintHoverClass = 'hover:bg-(--mui-palette-action-hover)'
const faintPressableClass = `${faintHoverClass} focus-visible:bg-(--mui-palette-action-focus)`

/*
these classnames will need to be converted to static css file...
  either find a way to gneerate this css using style-whatever lib under the hood that MUI uses
  [or] somehow use sx={} with variables
  [or] include the static .css file and pray webpack/vite are okay with that
*/
export const optionParams: EventCalendarOptionParams = {
  ghostHoverClass,
  ghostPressableClass,

  secondaryClass,
  secondaryPressableClass,

  faintHoverClass,
  faintPressableClass,

  strongBgClass: 'bg-(--mui-palette-divider)', // or bg-(--mui-palette-action-selected) ?
  mutedBgClass: 'bg-(--mui-palette-action-hover)',
  mutedWashClass: 'bg-(--mui-palette-action-hover)',
  highlightClass: 'bg-(--mui-palette-primary-main) opacity-10',
  todayBgNotPrintClass: 'not-print:bg-[rgba(var(--mui-palette-warning-mainChannel)_/_0.1)]',

  borderColorClass: 'border-(--mui-palette-divider)',
  primaryBorderColorClass: 'border-(--mui-palette-primary-main)',
  strongBorderColorClass: 'border-(--mui-palette-action-active)',
  nowBorderColorClass: 'border-(--mui-palette-error-main)',
  nowBorderStartColorClass: 'border-s-(--mui-palette-error-main)',
  nowBorderTopColorClass: 'border-t-(--mui-palette-error-main)',

  eventColor: 'var(--mui-palette-primary-main)',
  eventContrastColor: 'var(--mui-palette-primary-contrastText)',
  bgEventColor: 'var(--mui-palette-secondary-main)',
  bgEventColorClass: 'brightness-115 opacity-10',

  popoverClass: 'text-(--mui-palette-text-primary) bg-(--mui-palette-background-paper) rounded-(--mui-shape-borderRadius) overflow-hidden shadow-(--mui-shadows-8) m-2',

  bgClass: 'bg-(--mui-palette-background-paper)',
  bgOutlineColorClass: 'outline-(--mui-palette-background-paper)',

  mutedFgClass: 'text-(--mui-palette-text-secondary)',
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
