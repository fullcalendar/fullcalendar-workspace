import React, { useMemo } from 'react'
import Box from '@mui/material/Box'
import { useTheme, alpha } from '@mui/material/styles'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import { createSchedulerOnlyOptions } from '@fullcalendar/theme-breezy-dev/options-scheduler'
import EventCalendarToolbar from '../lib/EventCalendarToolbar.js'
import { optionParams, EventCalendarView } from './EventCalendar.js'
import { schedulerOnlyIconOptions } from '../lib/icons-scheduler.js'

const baseSchedulerOnlyOptions = createSchedulerOnlyOptions(optionParams)

export interface SchedulerProps extends CalendarOptions {
  availableViews: string[]
}

export default function Scheduler({ availableViews, ...options }: SchedulerProps) {
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
      <SchedulerView
        borderlessX
        borderlessBottom
        controller={controller}
        {...options}
      />
    </Box>
  )
}

export function SchedulerView(options: any) {
  return (
    <EventCalendarView
      {...baseSchedulerOnlyOptions.optionDefaults}
      {...schedulerOnlyIconOptions}
      {...options}
      views={mergeViewOptionsMap(
        baseSchedulerOnlyOptions.views || {},
        options.views || {},
      )}
    />
  )
}
