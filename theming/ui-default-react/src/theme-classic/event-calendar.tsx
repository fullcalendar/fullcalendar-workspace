import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { EventCalendarView } from './event-calendar-view.js'

export interface EventCalendarProps extends CalendarOptions {
  availableViews: string[]
}

// TODO: combine with EventCalendarView
export function EventCalendar({ availableViews, ...options }: EventCalendarProps) {
  return (
    <EventCalendarView
      headerToolbar={{
        left: 'addEvent today prev,next',
        center: 'title',
        right: availableViews.join(','),
      }}
      buttons={{
        addEvent: {
          text: 'Add event',
          isPrimary: true,
          click() {
            alert('add event...')
          }
        }
      }}
      {...options}
    />
  )
}
