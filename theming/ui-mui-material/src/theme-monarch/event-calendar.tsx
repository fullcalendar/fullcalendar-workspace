import React from 'react'
import { Box } from '@mui/material'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import { EventCalendarToolbar } from '../lib/event-calendar-toolbar.js'
import { EventCalendarView } from './event-calendar-view.js'

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
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <EventCalendarToolbar
        className='p-4'
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
