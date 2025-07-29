import React from 'react'
import { Box } from '@mui/material'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import EventCalendarToolbar from '../lib/EventCalendarToolbar.js'
import { SchedulerView } from './scheduler-view.js'

export interface SchedulerProps extends CalendarOptions {
  availableViews: string[]
}

export function Scheduler({ availableViews, ...options }: SchedulerProps) {
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
        className='p-3'
        controller={controller}
        availableViews={availableViews}
      />
      <SchedulerView
        borderlessX
        borderlessBottom
        controller={controller}
        {...options}
      />
    </Box>
  )
}
