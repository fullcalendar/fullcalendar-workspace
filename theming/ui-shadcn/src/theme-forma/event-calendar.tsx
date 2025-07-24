import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import { EventCalendarToolbar } from '../lib/event-calendar-toolbar.js'
import { EventCalendarView } from './event-calendar-view.js'

export interface EventCalendarProps extends CalendarOptions {
  availableViews: string[]
}

export function EventCalendar({ availableViews, ...options }: EventCalendarProps) {
  const controller = useCalendarController()

  return (
    <div className='border rounded-sm shadow-xs overflow-hidden'>{/* TODO: keep in sync with default styles */}
      <EventCalendarToolbar
        className='p-3'
        controller={controller}
        availableViews={availableViews}
      />
      <EventCalendarView
        borderlessX
        borderlessBottom
        controller={controller}
        {...options}
      />
    </div>
  )
}
