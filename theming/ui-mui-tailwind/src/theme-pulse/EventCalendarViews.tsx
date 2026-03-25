import React from 'react'
import FullCalendar, { type CalendarOptions } from '@fullcalendar/react'
import { mergeViewOptionsMap } from '@fullcalendar/react/protected-api'
import { createEventCalendarOptions } from '@fullcalendar/theme-pulse-tailwind/options-event-calendar'
import { createSlots } from '@fullcalendar/theme-pulse-tailwind/slots'
import { eventCalendarIconOptions } from '../lib/event-calendar-icons'
import { params } from '../lib/option-params'

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
