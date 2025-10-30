import React from 'react';
import { CalendarOptions } from "@fullcalendar/core";
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import EventCalendarView from './EventCalendarView.js'
import { schedulerOnlyIconOptions } from '../lib/scheduler-icons.js'
import { createSchedulerOnlyOptions } from '@fullcalendar/theme-forma-dev/options-scheduler'
import { params } from '../lib/option-params.js'

export const baseSchedulerOnlyOptions = createSchedulerOnlyOptions(params)

export default function SchedulerView(calendarOptions: CalendarOptions) {
  return (
    <EventCalendarView
      {...baseSchedulerOnlyOptions.optionDefaults}
      {...schedulerOnlyIconOptions}
      {...calendarOptions}
      views={mergeViewOptionsMap(
        baseSchedulerOnlyOptions.views || {},
        calendarOptions.views || {}
      )}
    />
  )
}
