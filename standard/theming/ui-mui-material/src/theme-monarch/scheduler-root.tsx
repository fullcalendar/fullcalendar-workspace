import React from 'react'
import { Box } from '@mui/material'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import { SchedulerToolbar } from '../scheduler-toolbar.js'
import { SchedulerView } from './scheduler-view.js'

export interface EventCalendarProps extends CalendarOptions {
  availableViews: string[]
}

export function EventCalendar({ availableViews, ...options }: EventCalendarProps) {
  const controller = useCalendarController()

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
      }}
    >
      <SchedulerToolbar
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
