import React, { useMemo } from 'react'
import { Box, useTheme, alpha } from '@mui/material' // TODO: better import for Box? elsewhere too
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import EventCalendarToolbar from '../lib/EventCalendarToolbar.js'
import { EventCalendarView } from './event-calendar-view.js'

export interface EventCalendarProps extends CalendarOptions {
  availableViews: string[]
}

export function EventCalendar({ availableViews, ...options }: EventCalendarProps) {
  const controller = useCalendarController()
  const theme = useTheme()
  const mutedBackgroundColor = useMemo(
    () => alpha(theme.palette.divider, 0.025),
    [theme.palette.divider],
  )

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
        style={{ backgroundColor: mutedBackgroundColor }}
        controller={controller}
        availableViews={availableViews}
      />
      <EventCalendarView
        borderlessX
        borderlessBottom
        controller={controller}
        {...options}
      />
    </Box>
  )
}
