import { CalendarOptions } from '@fullcalendar/core'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions, EventCalendarOptionParams } from '@fullcalendar/theme-pulse/options-event-calendar'
import { createSlots } from '@fullcalendar/theme-pulse/slots'
import { useTheme } from '@mui/material'
import React from 'react'
import { eventCalendarIconOptions } from '../lib/event-calendar-icons.js'

export const optionParams: EventCalendarOptionParams = {
  // TODO
}

const baseEventCalendarOptions = createEventCalendarOptions(optionParams)

export function EventCalendarView(options: CalendarOptions) {
  const theme = useTheme()

  if (!theme.cssVariables) {
    throw new Error('@mui/material-ui theme cssVariables must be enabled')
  }

  return (
    <FullCalendar
      {...baseEventCalendarOptions.optionDefaults}
      {...eventCalendarIconOptions}

      {...createSlots({
        createElement: React.createElement as any, // HACK
        Fragment: React.Fragment as any, // HACK
      }, optionParams)}

      {...options}

      views={{
        ...baseEventCalendarOptions.views,
        ...options.views,
      }}
    />
  )
}
