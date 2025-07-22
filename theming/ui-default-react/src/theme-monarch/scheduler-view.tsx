import React from 'react'
import { CalendarOptions } from '@fullcalendar/core'
import { defaultUiSchedulerOnlyOptions } from '@fullcalendar/theme-monarch/ui-default/options-scheduler'
import { optionParams } from '@fullcalendar/theme-monarch/ui-default/options-event-calendar' // weird
import { EventCalendarView } from './event-calendar-view.js'
import { createSlots } from '@fullcalendar/theme-monarch/slots'

export function SchedulerView(options: CalendarOptions) {
  return (
    <EventCalendarView
      {...defaultUiSchedulerOnlyOptions.optionDefaults}

      {...createSlots({
        createElement: React.createElement as any, // HACK
        Fragment: React.Fragment as any, // HACK
      }, optionParams)}

      {...options}

      views={{
        ...defaultUiSchedulerOnlyOptions.views,
        ...options.views,
      }}
    />
  )
}
