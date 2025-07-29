import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { defaultUiEventCalendarOptions, optionParams } from '@fullcalendar/theme-pulse/ui-default/options-event-calendar'
import { createSlots } from '@fullcalendar/theme-pulse/slots'

const slots = createSlots({
  createElement: React.createElement as any, // HACK
  Fragment: React.Fragment as any, // HACK
}, optionParams)

export interface EventCalendarProps extends CalendarOptions {
  availableViews?: string[]
}

export function EventCalendar({ availableViews, ...options }: EventCalendarProps) {
  return (
    <FullCalendar
      headerToolbar={{
        left: 'addEvent prev,today,next',
        center: 'title',
        right: availableViews?.join(','),
      }}
      {...defaultUiEventCalendarOptions.optionDefaults}
      {...slots}
      {...options}
      buttons={{
        addEvent: {
          text: 'Add event',
          isPrimary: true,
          click() {
            alert('add event...')
          }
        },
        ...defaultUiEventCalendarOptions.optionDefaults.buttons,
        ...options.buttons,
      }}
      views={mergeViewOptionsMap(
        defaultUiEventCalendarOptions.views || {},
        options.views || {},
      )}
    />
  )
}
