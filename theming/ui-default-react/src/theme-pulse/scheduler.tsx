import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import { defaultUiSchedulerOnlyOptions } from '@fullcalendar/theme-pulse-dev/ui-default/options-scheduler'
import { EventCalendar } from './event-calendar.js'

export interface SchedulerProps extends CalendarOptions {
  availableViews?: string[]
}

export function Scheduler({ availableViews, ...options }: SchedulerProps) {
  return (
    <EventCalendar
      {...defaultUiSchedulerOnlyOptions.optionDefaults}
      {...options}
      views={mergeViewOptionsMap(
        defaultUiSchedulerOnlyOptions.views || {},
        options.views || {},
      )}
    />
  )
}
