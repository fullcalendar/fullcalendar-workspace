import React from 'react'
import Box from '@mui/material/Box'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import EventCalendarToolbar from '../lib/EventCalendarToolbar.js'
import { eventCalendarPlugins } from '../lib/event-calendar-presets.js'
import { schedulerAvailableViews, schedulerOnlyPlugins } from '../lib/scheduler-presets.js'
import SchedulerView from './SchedulerView.js'

export interface SchedulerProps extends Omit<CalendarOptions, 'class' | 'className'> {
  className?: string
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
  className,
  height,
  contentHeight,
  ...calendarOptions
}: SchedulerProps) {
  const controller = useCalendarController()
  const borderlessX = calendarOptions.borderlessX ?? calendarOptions.borderless
  const borderlessBottom = calendarOptions.borderlessBottom ?? calendarOptions.borderless

  return (
    <Box
      className={className}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        height,
      }}
    >
      <EventCalendarToolbar
        className={borderlessX ? 'px-3' : ''}
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
      />
      <Box
        sx={{
          flexGrow: 1,
          minHeight: 0,
          bgcolor: 'background.paper',
          borderStyle: 'solid',
          borderColor: 'divider',
          borderLeftWidth: borderlessX ? 0 : 1,
          borderRightWidth: borderlessX ? 0 : 1,
          borderTopWidth: 1,
          borderBottomWidth: borderlessBottom ? 0 : 1,
          ...((borderlessX || borderlessBottom) ? {} : {
            borderRadius: 1,
            overflow: 'hidden',
          })
        }}
      >
        <SchedulerView
          height={height !== undefined ? '100%' : contentHeight}
          initialView={availableViews[0]}
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
