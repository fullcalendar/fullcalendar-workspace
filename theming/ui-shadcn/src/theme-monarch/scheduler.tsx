import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import { SchedulerToolbar } from '../lib/scheduler-toolbar.js'
import { SchedulerView } from './scheduler-view.js'

export interface SchedulerProps extends CalendarOptions {
  availableViews: string[]
}

export function Scheduler({ availableViews, ...options }: SchedulerProps) {
  const controller = useCalendarController()

  return (
    <div className='border rounded-xl'>
      <SchedulerToolbar
        className='p-3'
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
