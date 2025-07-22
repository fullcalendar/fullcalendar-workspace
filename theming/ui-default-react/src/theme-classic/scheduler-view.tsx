import React from 'react'
import { CalendarOptions } from '@fullcalendar/core'
import { defaultUiSchedulerOnlyOptions } from '@fullcalendar/theme-classic/ui-default/options-scheduler'
import { EventCalendarView } from './event-calendar-view.js'

export function SchedulerView(options: CalendarOptions) {
  return (
    <EventCalendarView
      {...defaultUiSchedulerOnlyOptions.optionDefaults}
      {...options}

      views={{
        ...defaultUiSchedulerOnlyOptions.views,
        ...options.views,
      }}
    />
  )
}
