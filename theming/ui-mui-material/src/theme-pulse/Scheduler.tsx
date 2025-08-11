import React from 'react'
import Box from '@mui/material/Box'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import { createSchedulerOnlyOptions } from '@fullcalendar/theme-pulse-dev/options-scheduler'
import EventCalendarToolbar from '../lib/EventCalendarToolbar.js'
import { optionParams, EventCalendarView } from './EventCalendar.js'
import { schedulerOnlyIconOptions } from '../lib/icons-scheduler.js'

const baseSchedulerOnlyOptions = createSchedulerOnlyOptions(optionParams)

export interface SchedulerProps extends CalendarOptions {
  availableViews: string[]
}

export default function Scheduler({ availableViews, ...options }: SchedulerProps) {
  const controller = useCalendarController()

  return (
    <div className='flex flex-col gap-6'>
      <EventCalendarToolbar
        controller={controller}
        availableViews={availableViews}
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
          borderless
          controller={controller}
          {...options}
        />
      </Box>
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
