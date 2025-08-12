import React from 'react'
import Box from '@mui/material/Box'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import { createSchedulerOnlyOptions } from '@fullcalendar/theme-classic-dev/options-scheduler'
import EventCalendarToolbar from '../lib/EventCalendarToolbar.js'
import { optionParams, EventCalendarView } from './EventCalendar.js'
import { schedulerOnlyIconOptions } from '../lib/scheduler-icons.js'
import { schedulerAvailableViews, schedulerOnlyPlugins } from '../lib/scheduler-presets.js'

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

export default function Scheduler({
  availableViews = schedulerAvailableViews,
  addButton,
  ...calendarOptions
}: SchedulerProps) {
  const controller = useCalendarController()

  return (
    <div className='flex flex-col gap-5'>
      <EventCalendarToolbar
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
      />
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <SchedulerView
          initialView={availableViews[0]}
          borderless
          controller={controller}
          {...calendarOptions}
          plugins={[
            ...schedulerOnlyPlugins,
            ...(calendarOptions.plugins || []),
          ]}
        />
      </Box>
    </div>
  )
}

export function SchedulerView(calendarOptions: CalendarOptions) {
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
