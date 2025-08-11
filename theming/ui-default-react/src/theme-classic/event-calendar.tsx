import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { defaultUiEventCalendarOptions } from '@fullcalendar/theme-classic-dev/ui-default/options-event-calendar'

export interface EventCalendarProps extends CalendarOptions {
  availableViews?: string[]
}

export function EventCalendar({ availableViews, ...options }: EventCalendarProps) {
  return (
    <FullCalendar
      headerToolbar={{
        left: 'addEvent today prev,next',
        center: 'title',
        right: availableViews?.join(','),
      }}
      {...defaultUiEventCalendarOptions.optionDefaults}
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
