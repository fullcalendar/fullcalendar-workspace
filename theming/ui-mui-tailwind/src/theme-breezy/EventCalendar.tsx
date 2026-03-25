import React from 'react'
import Box from '@mui/material/Box'
import { useCalendarController } from "@fullcalendar/react"
import { eventCalendarAvailableViews, eventCalendarPlugins } from '@fullcalendar/theme-common/event-calendar'
import EventCalendarViews from './EventCalendarViews'
import EventCalendarToolbar from '../lib/EventCalendarToolbar'
import { EventCalendarProps } from '../lib/event-calendar-props'

export default function EventCalendar({
  availableViews = eventCalendarAvailableViews,
  addButton,
  className,
  height,
  contentHeight,
  direction,
  plugins: userPlugins = [],
  ...restOptions
}: EventCalendarProps) {
  const controller = useCalendarController()

  const hasBorderX = !(restOptions.borderlessX ?? restOptions.borderless)
  const hasBorderTop = !(restOptions.borderlessTop ?? restOptions.borderless)
  const hasBorderBottom = !(restOptions.borderlessBottom ?? restOptions.borderless)
  const isHeightAuto = height === 'auto' || contentHeight === 'auto'

  return (
    <Box
      dir={direction === 'rtl' ? 'rtl' : undefined}
      className={className}
      sx={(theme) => ({
        display: 'flex',
        flexDirection: 'column',
        height,
        bgcolor: 'background.paper',
        borderStyle: 'solid',
        borderColor: 'divider',
        borderLeftWidth: hasBorderX ? 1 : 0,
        borderRightWidth: hasBorderX ? 1 : 0,
        borderTopWidth: hasBorderTop ? 1 : 0,
        borderBottomWidth: hasBorderBottom ? 1 : 0,
        ...(hasBorderTop && hasBorderX && {
          borderTopLeftRadius: theme.shape.borderRadius,
          borderTopRightRadius: theme.shape.borderRadius,
        }),
        ...(hasBorderBottom && hasBorderX && {
          borderBottomLeftRadius: theme.shape.borderRadius,
          borderBottomRightRadius: theme.shape.borderRadius,
        }),
        overflow: !isHeightAuto ? 'hidden' : undefined,
      })}
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
      <Box
        sx={{
          flexGrow: 1,
          minHeight: 0,
        }}
      >
        <EventCalendarViews
          height={isHeightAuto ? 'auto' : height !== undefined ? '100%' : contentHeight}
          initialView={availableViews[0]}
          controller={controller}
          plugins={[...eventCalendarPlugins, ...userPlugins]}
          {...restOptions}
        />
      </Box>
    </Box>
  )
}
