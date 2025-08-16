import React from 'react'
import Box from '@mui/material/Box'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import EventCalendarToolbar from '../lib/EventCalendarToolbar.js'
import { eventCalendarPlugins } from '../lib/event-calendar-presets.js'
import { schedulerAvailableViews, schedulerOnlyPlugins } from '../lib/scheduler-presets.js'
import SchedulerView from './SchedulerView.js'

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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5,
      }}
    >
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
            ...eventCalendarPlugins,
            ...schedulerOnlyPlugins,
            ...(calendarOptions.plugins || []),
          ]}
        />
      </Box>
    </Box>
  )
}
