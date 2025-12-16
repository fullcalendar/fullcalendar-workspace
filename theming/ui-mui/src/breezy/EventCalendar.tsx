import React from 'react'
import Box from '@mui/material/Box'
import { CalendarOptions, PluginDef } from '@fullcalendar/core'
import { useCalendarController } from "@fullcalendar/react"
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import multiMonthPlugin from '@fullcalendar/multimonth'
import EventCalendarToolbar from './EventCalendarToolbar.js'
import EventCalendarViews from './EventCalendarViews.js'

export const eventCalendarPlugins: PluginDef[] = [
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  interactionPlugin,
  multiMonthPlugin,
]

const eventCalendarAvailableViews = [
  'dayGridMonth',
  'timeGridWeek',
  'timeGridDay',
  'listWeek',
  'multiMonthYear',
]

export interface EventCalendarProps extends Omit<CalendarOptions, 'class' | 'className'> {
  className?: string
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
  className,
  height,
  contentHeight,
  direction,
  plugins: userPlugins,
  ...restOptions
}: EventCalendarProps) {
  const controller = useCalendarController()
  const borderlessX = restOptions.borderlessX ?? restOptions.borderless
  const borderlessTop = restOptions.borderlessTop ?? restOptions.borderless
  const borderlessBottom = restOptions.borderlessBottom ?? restOptions.borderless

  return (
    <Box
      dir={direction === 'rtl' ? 'rtl' : undefined}
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
    >
      <EventCalendarToolbar
        sx={{
          padding: 2,
          bgcolor: 'action.hover', // low-contrast grey
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
      />
      <EventCalendarViews
        liquidHeight={height !== undefined}
        height={contentHeight}
        initialView={availableViews[0]}
        controller={controller}
        plugins={[
          ...eventCalendarPlugins,
          ...(userPlugins || []),
        ]}
        {...restOptions}
      />
    </Box>
  )
}
