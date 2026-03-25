import React from 'react';
import { CalendarOptions } from "@fullcalendar/react";
import { mergeViewOptionsMap } from '@fullcalendar/react/protected-api'
import EventCalendarViews from './EventCalendarViews'
import { schedulerOnlyIconOptions } from '../lib/scheduler-icons'
import { createSchedulerOnlyOptions } from '@fullcalendar/theme-monarch-tailwind/options-scheduler'
import { params } from '../lib/option-params'

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
