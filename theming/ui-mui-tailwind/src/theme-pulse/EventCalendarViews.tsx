import React from 'react'
import FullCalendar, { CalendarOptions } from '@fullcalendar/react'
import { mergeViewOptionsMap } from '@fullcalendar/react/protected-api'
import { createEventCalendarOptions } from '@fullcalendar/theme-pulse-tailwind/options-event-calendar'
import { createSlots } from '@fullcalendar/theme-pulse-tailwind/slots'
import { eventCalendarIconOptions } from '../lib/event-calendar-icons.js'
import { params } from '../lib/option-params.js'

const baseEventCalendarOptions = createEventCalendarOptions(params)

const slots = createSlots(params)

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
      {...slots}
    />
  )
}
