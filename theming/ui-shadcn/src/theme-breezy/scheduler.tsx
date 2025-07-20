import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import { SchedulerToolbar } from '../lib/scheduler-toolbar.js'
import { SchedulerView } from './scheduler-view.js'

export interface EventCalendarProps extends CalendarOptions {
  availableViews: string[]
}

export function EventCalendar({ availableViews, ...options }: EventCalendarProps) {
  const controller = useCalendarController()

  return (
    <div className='border rounded-xl'>
      <SchedulerToolbar
        controller={controller}
        availableViews={availableViews}
      />
      <SchedulerView
        borderless
        controller={controller}
        {...options}
      />
    </div>
  )
}
