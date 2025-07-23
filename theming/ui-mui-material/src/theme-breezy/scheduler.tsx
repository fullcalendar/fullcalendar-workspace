import React from 'react'
import { Box, useTheme, alpha } from '@mui/material' // TODO: better import for Box? elsewhere too
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import { SchedulerToolbar } from '../lib/scheduler-toolbar.js'
import { SchedulerView } from './scheduler-view.js'

export interface SchedulerProps extends CalendarOptions {
  availableViews: string[]
}

export function Scheduler({ availableViews, ...options }: SchedulerProps) {
  const controller = useCalendarController()
  const theme = useTheme()

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
      }}
    >
      <SchedulerToolbar
        className='p-4'
        style={{
          backgroundColor: alpha(theme.palette.divider, 0.025),
        }}
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
