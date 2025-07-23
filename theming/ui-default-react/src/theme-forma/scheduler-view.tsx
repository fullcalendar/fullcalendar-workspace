import React from 'react'
import { CalendarOptions } from '@fullcalendar/core'
import { mergeCalendarOptions, mergeViewOptionsMap } from '@fullcalendar/core/internal'
import { defaultUiSchedulerOnlyOptions } from '@fullcalendar/theme-forma/ui-default/options-scheduler'
import { EventCalendarView } from './event-calendar-view.js'

export function SchedulerView(options: CalendarOptions) {
  return (
    <EventCalendarView
      {...mergeCalendarOptions(
        defaultUiSchedulerOnlyOptions.optionDefaults,
        options,
      )}
      views={mergeViewOptionsMap(
        defaultUiSchedulerOnlyOptions.views || {},
        options.views || {},
      )}
    />
  )
}
