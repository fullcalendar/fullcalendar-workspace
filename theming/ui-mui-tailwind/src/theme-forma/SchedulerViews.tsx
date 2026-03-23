import React from 'react';
import { CalendarOptions } from "@fullcalendar/react";
import { mergeViewOptionsMap } from '@fullcalendar/react/protected-api'
import EventCalendarViews from './EventCalendarViews.js'
import { schedulerOnlyIconOptions } from '../lib/scheduler-icons.js'
import { createSchedulerOnlyOptions } from '@fullcalendar/theme-forma-tailwind/options-scheduler'
import { params } from '../lib/option-params.js'

export const baseSchedulerOnlyOptions = createSchedulerOnlyOptions(params)

export default function SchedulerViews({
  views: userViews,
  ...restOptions
}: CalendarOptions) {
  return (
    <EventCalendarViews

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
