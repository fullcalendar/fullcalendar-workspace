import React from 'react'
import { CalendarOptions } from '@fullcalendar/core'
import { defaultUiSchedulerOnlyOptions } from '@fullcalendar/theme-breezy/ui-default/options-scheduler'
import { optionParams } from '@fullcalendar/theme-breezy/ui-default/options-event-calendar' // weird
import { EventCalendarView } from './event-calendar-view.js'
import { createSlots } from '@fullcalendar/theme-breezy/slots'

const slots = createSlots({
  createElement: React.createElement as any, // HACK
  Fragment: React.Fragment as any, // HACK
}, optionParams)

export function SchedulerView(options: CalendarOptions) {
  return (
    <EventCalendarView
      {...defaultUiSchedulerOnlyOptions.optionDefaults}
      {...slots}
      {...options}

      views={{
        ...defaultUiSchedulerOnlyOptions.views,
        ...options.views,
      }}
    />
  )
}
