import React from 'react'
import Box from '@mui/material/Box'
import { useCalendarController } from "@fullcalendar/react"
import { eventCalendarAvailableViews, eventCalendarPlugins } from '@fullcalendar/theme-common/event-calendar'
import EventCalendarView from './EventCalendarView.js'
import EventCalendarToolbar from '../lib/EventCalendarToolbar.js'
import { EventCalendarProps } from '../lib/event-calendar-props.js'

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
  const borderlessBottom = restOptions.borderlessBottom ?? restOptions.borderless

  return (
    <Box
      className={className}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        height,
      }}
      dir={direction === 'rtl' ? 'rtl' : undefined}
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
        <EventCalendarView
          height={height !== undefined ? '100%' : contentHeight}
          initialView={availableViews[0]}
          controller={controller}
          plugins={[
            ...eventCalendarPlugins,
            ...(userPlugins || []),
          ]}
          {...restOptions}
        />
      </Box>
    </Box>
  )
}
