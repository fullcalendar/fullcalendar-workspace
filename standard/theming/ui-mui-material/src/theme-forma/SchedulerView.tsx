import React from 'react'
import { CalendarOptions } from '@fullcalendar/core'
import { createSchedulerOnlyOptions } from '@fullcalendar/theme-forma/options-scheduler'
import { optionParams, EventCalendarView } from './EventCalendarView.js'
import { schedulerOnlyIconOptions } from '../scheduler-icon-options.js'

const baseSchedulerOnlyOptions = createSchedulerOnlyOptions(optionParams)

export function SchedulerView(options: CalendarOptions) {
  return (
    <EventCalendarView
      {...baseSchedulerOnlyOptions.optionDefaults}
      {...schedulerOnlyIconOptions}
      {...options}

      views={{
        ...baseSchedulerOnlyOptions.views,
        ...options.views,
      }}
    />
  )
}
