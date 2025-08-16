import React, { useMemo } from 'react'
import Box from '@mui/material/Box'
import { useTheme, alpha } from '@mui/material/styles'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import EventCalendarToolbar from '../lib/EventCalendarToolbar.js'
import { eventCalendarAvailableViews, eventCalendarPlugins } from '../lib/event-calendar-presets.js'
import EventCalendarView from './EventCalendarView.js'

export interface EventCalendarProps extends CalendarOptions {
  availableViews?: string[]
  addButton?: {
    isPrimary?: boolean
    text?: string
    hint?: string
    click?: (ev: MouseEvent) => void
  }
}

export default function EventCalendar({
  availableViews = eventCalendarAvailableViews,
  addButton,
  ...calendarOptions
}: EventCalendarProps) {
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
        sx={{
          padding: 2,
          backgroundColor: mutedBackgroundColor,
        }}
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
      />
      <EventCalendarView
        initialView={availableViews[0]}
        borderlessX
        borderlessBottom
        controller={controller}
        {...calendarOptions}
        plugins={[
          ...eventCalendarPlugins,
          ...(calendarOptions.plugins || []),
        ]}
      />
    </Box>
  )
}
