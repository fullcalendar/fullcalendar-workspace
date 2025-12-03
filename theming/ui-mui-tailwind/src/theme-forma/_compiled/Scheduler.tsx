import React from 'react'
import Box from '@mui/material/Box'
import { CalendarOptions } from '@fullcalendar/core'
import { useCalendarController } from "@fullcalendar/react"
import adaptivePlugin from '@fullcalendar/adaptive'
import scrollGridPlugin from '@fullcalendar/scrollgrid'
import timelinePlugin from '@fullcalendar/timeline'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'
import resourceDayGridPlugin from '@fullcalendar/resource-daygrid'
import { eventCalendarPlugins } from './EventCalendar.js'
import EventCalendarToolbar from './EventCalendarToolbar.js'
import SchedulerView from './SchedulerView.js'

const schedulerOnlyPlugins = [
  adaptivePlugin,
  scrollGridPlugin,
  timelinePlugin,
  resourceTimelinePlugin,
  resourceTimeGridPlugin,
  resourceDayGridPlugin,
]

const schedulerAvailableViews = [
  'resourceTimelineDay',
  'resourceTimelineWeek',
]

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
  direction,
  plugins: userPlugins,
  ...restOptions
}: SchedulerProps) {
  const controller = useCalendarController()
  const borderlessX = restOptions.borderlessX ?? restOptions.borderless
  const borderlessTop = restOptions.borderlessTop ?? restOptions.borderless
  const borderlessBottom = restOptions.borderlessBottom ?? restOptions.borderless

  return (
    <Box
      className={className}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height,
        bgcolor: 'background.paper',
        borderStyle: 'solid',
        borderColor: 'divider',
        borderLeftWidth: borderlessX ? 0 : 1,
        borderRightWidth: borderlessX ? 0 : 1,
        borderTopWidth: borderlessTop ? 0 : 1,
        borderBottomWidth: borderlessBottom ? 0 : 1,
        ...(borderlessX || borderlessTop || borderlessBottom ? {} : {
          borderRadius: 1,
          overflow: 'hidden',
        })
      }}
      dir={direction === 'rtl' ? 'rtl' : undefined}
    >
      <EventCalendarToolbar
        sx={{
          padding: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
      />
      <Box
        sx={{
          flexGrow: 1,
          minHeight: 0,
        }}
      >
        <SchedulerView
          height={height !== undefined ? '100%' : contentHeight}
          initialView={availableViews[0]}
          controller={controller}
          plugins={[
            ...eventCalendarPlugins,
            ...schedulerOnlyPlugins,
            ...(userPlugins || []),
          ]}
          {...restOptions}
        />
      </Box>
    </Box>
  )
}

