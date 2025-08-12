import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import { createSchedulerOnlyOptions } from '@fullcalendar/theme-monarch-dev/options-scheduler'
import { EventCalendarToolbar } from '../lib/event-calendar-toolbar.js'
import { optionParams, EventCalendarView } from './event-calendar.js'
import { schedulerOnlyIconOptions } from '../lib/scheduler-icons.js'
import { schedulerAvailableViews, schedulerOnlyPlugins } from '../lib/scheduler-presets.js'

const baseSchedulerOnlyOptions = createSchedulerOnlyOptions(optionParams)

export interface SchedulerProps extends CalendarOptions {
  availableViews?: string[]
  addButton?: boolean
  addButtonText?: string
  addButtonHint?: string
  addButtonClick?: (ev: MouseEvent) => void
}

export function Scheduler({
  availableViews = schedulerAvailableViews,
  addButton,
  addButtonText,
  addButtonHint,
  addButtonClick,
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
        addButtonText={addButtonText}
        addButtonHint={addButtonHint}
        addButtonClick={addButtonClick}
      />
      <SchedulerView
        borderless
        controller={controller}
        {...calendarOptions}
        plugins={[
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
