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
    <div className='flex flex-col gap-5'>
      <EventCalendarToolbar
        controller={controller}
        availableViews={availableViews}
      />
      <div className='border rounded-sm overflow-hidden'>
        <EventCalendarView
          borderless
          controller={controller}
          {...options}
        />
      </div>
    </div>
  )
}
