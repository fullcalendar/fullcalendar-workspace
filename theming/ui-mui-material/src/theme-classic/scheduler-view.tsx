import React from 'react'
import { CalendarOptions } from '@fullcalendar/core'
import { mergeCalendarOptions, mergeViewOptionsMap } from '@fullcalendar/core/internal'
import { createSchedulerOnlyOptions } from '@fullcalendar/theme-classic/options-scheduler'
import { optionParams, EventCalendarView } from './event-calendar-view.js'
import { schedulerOnlyIconOptions } from '../lib/scheduler-icons.js'

const baseSchedulerOnlyOptions = createSchedulerOnlyOptions(optionParams)

export function SchedulerView(options: CalendarOptions) {
  return (
    <EventCalendarView
      {...mergeCalendarOptions(
        baseSchedulerOnlyOptions.optionDefaults,
        schedulerOnlyIconOptions,
        options,
      )}
      views={mergeViewOptionsMap(
        baseSchedulerOnlyOptions.views || {},
        options.views || {},
      )}
    />
  )
}
