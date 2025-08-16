import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import { createSchedulerOnlyOptions } from '@fullcalendar/theme-monarch-dev/options-scheduler'
import { EventCalendarToolbar } from '../lib/event-calendar-toolbar.js'
import { optionParams, EventCalendarView } from './event-calendar.js'
import { eventCalendarPlugins } from '../lib/event-calendar-presets.js'
import { schedulerAvailableViews, schedulerOnlyPlugins } from '../lib/scheduler-presets.js'
import { schedulerOnlyIconOptions } from '../lib/scheduler-icons.js'

const baseSchedulerOnlyOptions = createSchedulerOnlyOptions(optionParams)

export interface SchedulerProps extends CalendarOptions {
  availableViews?: string[]
  addButton?: {
    isPrimary?: boolean
    text?: string
    hint?: string
    click?: (ev: MouseEvent) => void
  }
}

export function Scheduler({
  availableViews = schedulerAvailableViews,
  addButton,
  ...calendarOptions
}: SchedulerProps) {
  const controller = useCalendarController()

  return (
    <div className='border rounded-xl overflow-hidden'>
      <EventCalendarToolbar
        className='p-4'
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
      />
      <SchedulerView
        initialView={availableViews[0]}
        borderless
        controller={controller}
        {...calendarOptions}
        plugins={[
          ...eventCalendarPlugins,
          ...schedulerOnlyPlugins,
          ...(calendarOptions.plugins || []),
        ]}
      />
    </div>
  )
}

export function SchedulerView(calendarOptions: any) {
  return (
    <EventCalendarView
      {...baseSchedulerOnlyOptions.optionDefaults}
      {...schedulerOnlyIconOptions}
      {...calendarOptions}
      views={mergeViewOptionsMap(
        baseSchedulerOnlyOptions.views || {},
        calendarOptions.views || {},
      )}
    />
  )
}
