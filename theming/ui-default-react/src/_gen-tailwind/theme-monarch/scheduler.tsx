import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { SchedulerView } from './scheduler-view.js'

export interface SchedulerProps extends CalendarOptions {
  availableViews: string[]
}

export function Scheduler({ availableViews, ...options }: SchedulerProps) {
  return (
    <SchedulerView
      headerToolbar={{
        left: 'addEvent today,prev,next',
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
