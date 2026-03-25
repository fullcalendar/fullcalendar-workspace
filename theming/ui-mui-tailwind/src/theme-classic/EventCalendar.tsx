import React from 'react'
import Box from '@mui/material/Box'
import { useCalendarController } from "@fullcalendar/react"
import { eventCalendarAvailableViews, eventCalendarPlugins } from '@fullcalendar/theme-common/event-calendar'
import EventCalendarViews from './EventCalendarViews.js'
import EventCalendarToolbar from '../lib/EventCalendarToolbar.js'
import { EventCalendarProps } from '../lib/event-calendar-props.js'

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
  const hasBorderBottom = !(restOptions.borderlessBottom ?? restOptions.borderless)
  const isHeightAuto = height === 'auto' || contentHeight === 'auto'

  return (
    <Box
      dir={direction === 'rtl' ? 'rtl' : undefined}
      className={className}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5,
        height,
      }}
    >
      <EventCalendarToolbar
        sx={!hasBorderX ? { px: 1.5 } : undefined}
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
      />
      <Box
        sx={(theme) => ({
          flexGrow: 1,
          minHeight: 0,
          bgcolor: 'background.paper',
          borderStyle: 'solid',
          borderColor: 'divider',
          borderLeftWidth: hasBorderX ? 1 : 0,
          borderRightWidth: hasBorderX ? 1 : 0,
          borderTopWidth: 1,
          borderBottomWidth: hasBorderBottom ? 1 : 0,
          ...(hasBorderX && !isHeightAuto && {
            borderTopLeftRadius: theme.shape.borderRadius,
            borderTopRightRadius: theme.shape.borderRadius,
          }),
          ...(hasBorderBottom && hasBorderX && !isHeightAuto && {
            borderBottomLeftRadius: theme.shape.borderRadius,
            borderBottomRightRadius: theme.shape.borderRadius,
          }),
          overflow: !isHeightAuto ? 'hidden' : undefined,
        })}
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
