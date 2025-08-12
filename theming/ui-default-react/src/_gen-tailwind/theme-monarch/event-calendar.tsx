import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { EventCalendarView } from './event-calendar-view.js'

export interface EventCalendarProps extends CalendarOptions {
  addButton?: boolean
  addButtonText?: string
  addButtonHint?: string
  addButtonClick?: (ev: MouseEvent) => void
  availableViews: string[]
}

// TODO: combine with EventCalendarView
export function EventCalendar({
  addButton,
  addButtonText,
  addButtonHint,
  addButtonClick,
  availableViews,
  ...calendarOptions
}: EventCalendarProps) {
  return (
    <EventCalendarView
      headerToolbar={{
        start: (addButton ? 'add ' : '') + 'today,prev,next',
        center: 'title',
        end: availableViews.join(','),
      }}
      buttons={{
        add: {
          isPrimary: true,
          text: addButtonText,
          hint: addButtonHint,
          click: addButtonClick,
        }
      }}
      {...calendarOptions}
    />
  )
}
