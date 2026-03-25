import React from 'react'
import FullCalendar, { type CalendarOptions } from '@fullcalendar/react'
import { mergeViewOptionsMap } from '@fullcalendar/react/protected-api'
import { createEventCalendarOptions } from '@fullcalendar/theme-classic-tailwind/options-event-calendar'
import { eventCalendarIconOptions } from '../lib/event-calendar-icons.js'
import { params } from '../lib/option-params.js'

const baseEventCalendarOptions = createEventCalendarOptions(params)

export default function EventCalendarViews({
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
