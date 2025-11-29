import React from 'react'
import { CalendarOptions } from '@fullcalendar/core'
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions } from '@fullcalendar/theme-classic-tailwind/options-event-calendar'
import { eventCalendarIconOptions } from '../lib/event-calendar-icons.js'
import { params } from '../lib/option-params.js'

const baseEventCalendarOptions = createEventCalendarOptions(params)

export default function EventCalendarView({
  views: userViews,
  ...restOptions
}: CalendarOptions) {
  return (
    <FullCalendar

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

      views={mergeViewOptionsMap(
        baseEventCalendarOptions.views || {},
        userViews || {}
      )}

      // spreads
      {...baseEventCalendarOptions.optionDefaults}
      {...restOptions}
      {...eventCalendarIconOptions}
    />
  )
}
