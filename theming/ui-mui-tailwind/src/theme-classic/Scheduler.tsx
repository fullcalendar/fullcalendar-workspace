import React from 'react'
import Box from '@mui/material/Box'
import { useCalendarController } from "@fullcalendar/react"
import EventCalendarToolbar from '../lib/EventCalendarToolbar.js'
import { eventCalendarPlugins } from '@fullcalendar/theme-common/event-calendar'
import { schedulerAvailableViews, schedulerOnlyPlugins } from '@fullcalendar/theme-common/scheduler'
import SchedulerView from './SchedulerView.js'
import { SchedulerProps } from '../lib/scheduler-props.js'

export default function Scheduler({
  availableViews = schedulerAvailableViews,
  addButton,
  className,
  height,
  contentHeight,
  direction,
  plugins: userPlugins = [],
  ...restOptions
}: SchedulerProps) {
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
        className={!hasBorderX ? 'px-3' : ''}
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
        <SchedulerView
          height={isHeightAuto ? 'auto' : height !== undefined ? '100%' : contentHeight}
          initialView={availableViews[0]}
          controller={controller}
          plugins={[...eventCalendarPlugins, ...schedulerOnlyPlugins, ...userPlugins]}
          {...restOptions}
        />
      </Box>
    </Box>
  )
}
