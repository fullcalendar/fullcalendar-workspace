import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import { createSchedulerOnlyOptions } from '@fullcalendar/theme-classic-dev/options-scheduler'
import { cn } from '../lib/utils.js'
import { EventCalendarToolbar } from '../lib/event-calendar-toolbar.js'
import { optionParams, EventCalendarView } from './event-calendar.js'
import { eventCalendarPlugins } from '../lib/event-calendar-presets.js'
import { schedulerAvailableViews, schedulerOnlyPlugins } from '../lib/scheduler-presets.js'
import { schedulerOnlyIconOptions } from '../lib/scheduler-icons.js'

const baseSchedulerOnlyOptions = createSchedulerOnlyOptions(optionParams)

export interface SchedulerProps extends Omit<CalendarOptions, 'class' | 'className'> {
  className?: string
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
  className,
  ...calendarOptions
}: SchedulerProps) {
  const controller = useCalendarController()
  const borderlessX = calendarOptions.borderlessX ?? calendarOptions.borderless

  return (
    <div className={cn(className, 'flex flex-col gap-5')}>
      <EventCalendarToolbar
        className={borderlessX ? 'px-3' : ''}
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
      />
      <SchedulerView
        className='border rounded-sm overflow-hidden bg-background'
        initialView={availableViews[0]}
        controller={controller}
        {...calendarOptions}
        borderlessTop={false}
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
