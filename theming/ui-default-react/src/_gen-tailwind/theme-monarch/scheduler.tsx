import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { SchedulerView } from './scheduler-view.js'

export interface SchedulerProps extends CalendarOptions {
  addButton?: boolean
  addButtonText?: string
  addButtonHint?: string
  addButtonClick?: (ev: MouseEvent) => void
  availableViews: string[]
}

export function Scheduler({
  addButton,
  addButtonText,
  addButtonHint,
  addButtonClick,
  availableViews,
  ...calendarOptions
}: SchedulerProps) {
  return (
    <SchedulerView
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
