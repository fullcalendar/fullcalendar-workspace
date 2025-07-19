import React from 'react'
import { Box } from '@mui/material'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import { EventCalendarToolbar } from '../EventCalendarToolbar.js'
import { EventCalendarView } from './EventCalendarView.js'

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
      <EventCalendarToolbar
        controller={controller}
        availableViews={availableViews}
      />
      <EventCalendarView
        borderless
        controller={controller}
        {...options}
      />
    </Box>
  )
}
