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
    <div className='flex flex-col gap-6'>
      <SchedulerToolbar
        controller={controller}
        availableViews={availableViews}
      />
      <SchedulerView
        controller={controller}
        {...options}
      />
    </div>
  )
}
