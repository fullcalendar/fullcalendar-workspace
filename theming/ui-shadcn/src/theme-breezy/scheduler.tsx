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
    <div className='border rounded-lg overflow-hidden'>
      <SchedulerToolbar
        className='p-4 bg-sidebar text-sidebar-foreground'
        controller={controller}
        availableViews={availableViews}
      />
      <SchedulerView
        borderlessX
        borderlessBottom
        controller={controller}
        {...options}
      />
    </div>
  )
}
