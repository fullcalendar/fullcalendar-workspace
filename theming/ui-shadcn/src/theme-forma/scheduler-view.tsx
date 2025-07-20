import React from 'react'
import { CalendarOptions } from '@fullcalendar/core'
import { createSchedulerOnlyOptions } from '@fullcalendar/theme-forma/options-scheduler'
import { optionParams, EventCalendarView } from './event-calendar-view.js'
// import { schedulerOnlyIconOptions } from '../lib/scheduler-icons.js' // TODO

const baseSchedulerOnlyOptions = createSchedulerOnlyOptions(optionParams)

export function SchedulerView(options: CalendarOptions) {
  return (
    <EventCalendarView
      {...baseSchedulerOnlyOptions.optionDefaults}
      // {...schedulerOnlyIconOptions}
      {...options}

      views={{
        ...baseSchedulerOnlyOptions.views,
        ...options.views,
      }}
    />
  )
}
