import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import { createSchedulerOnlyOptions } from '@fullcalendar/theme-classic-dev/options-scheduler'
import { EventCalendarToolbar } from '../lib/event-calendar-toolbar.js'
import { optionParams, EventCalendarView } from './event-calendar.js'
import { schedulerOnlyIconOptions } from '../lib/scheduler-icons.js'

const baseSchedulerOnlyOptions = createSchedulerOnlyOptions(optionParams)

export interface SchedulerProps extends CalendarOptions {
  availableViews: string[]
}

export function Scheduler({ availableViews, ...options }: SchedulerProps) {
  const controller = useCalendarController()

  return (
    <div className='flex flex-col gap-5'>
      <EventCalendarToolbar
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

export function SchedulerView(options: any) {
  return (
    <EventCalendarView
      {...baseSchedulerOnlyOptions.optionDefaults}
      {...schedulerOnlyIconOptions}
      {...options}
      views={mergeViewOptionsMap(
        baseSchedulerOnlyOptions.views || {},
        options.views || {},
      )}
    />
  )
}
