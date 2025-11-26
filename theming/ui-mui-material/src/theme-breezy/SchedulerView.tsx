import React from 'react';
import { CalendarOptions } from "@fullcalendar/core";
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import EventCalendarView from './EventCalendarView.js'
import { schedulerOnlyIconOptions } from '../lib/scheduler-icons.js'
import { createSchedulerOnlyOptions } from '@fullcalendar/theme-breezy-dev/options-scheduler'
import { params } from '../lib/option-params.js'

export const baseSchedulerOnlyOptions = createSchedulerOnlyOptions(params)

export default function SchedulerView({
  views: userViews,
  ...restOptions
}: CalendarOptions) {
  return (
    <EventCalendarView

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

      views={mergeViewOptionsMap(
        baseSchedulerOnlyOptions.views || {},
        userViews || {}
      )}

      // spreads
      {...baseSchedulerOnlyOptions.optionDefaults}
      {...restOptions}
      {...schedulerOnlyIconOptions}
    />
  )
}
