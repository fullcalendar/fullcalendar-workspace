import React from 'react'
import Box from '@mui/material/Box'
import { CalendarOptions } from "@fullcalendar/core"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import { useCalendarController } from "@fullcalendar/react"
import EventCalendarToolbar from '../lib/EventCalendarToolbar.js'
import { EventCalendarView, optionParams } from './EventCalendar.js'
import { schedulerOnlyIconOptions } from '../lib/icons-scheduler.js'
import { createSchedulerOnlyOptions } from '@fullcalendar/theme-monarch-dev/options-scheduler'

export interface SchedulerProps extends CalendarOptions {
  availableViews: string[]
}

export default function Scheduler({ availableViews, ...options }: SchedulerProps) {
  const controller = useCalendarController()

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <EventCalendarToolbar
        className='p-4'
        controller={controller}
        availableViews={availableViews}
      />
      <SchedulerView
        borderless
        controller={controller}
        {...options}
      />
    </Box>
  )
}

const baseSchedulerOnlyOptions = createSchedulerOnlyOptions(optionParams)

export function SchedulerView(options: CalendarOptions) {
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
