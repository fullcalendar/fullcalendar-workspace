import React from 'react'
import Box from '@mui/material/Box'
import { CalendarOptions, useCalendarController } from '@fullcalendar/react'
import adaptivePlugin from '@fullcalendar/react-scheduler/adaptive'
import resourceTimelinePlugin from '@fullcalendar/react-scheduler/resource-timeline'
import interactionPlugin from '@fullcalendar/react/interaction'
import EventCalendarToolbar from './EventCalendarToolbar'
import SchedulerViews from './SchedulerViews'

const plugins = [
  adaptivePlugin,
  interactionPlugin,
  resourceTimelinePlugin,
]
const defaultAvailableViews = [
  'resourceTimelineDay',
  'resourceTimelineWeek',
]
const navLinkDayClick = 'resourceTimelineDay'
const navLinkWeekClick = 'resourceTimelineWeek'

export interface ResourceTimelineProps extends Omit<CalendarOptions, 'class' | 'className' | 'headerToolbar' | 'footerToolbar'> {
  className?: string
  availableViews?: string[]
  addButton?: {
    isPrimary?: boolean
    text?: string
    hint?: string
    click?: (ev: MouseEvent) => void
  }
}

export default function ResourceTimeline({
  availableViews = defaultAvailableViews,
  addButton,
  className,
  height,
  contentHeight,
  direction,
  plugins: userPlugins = [],
  ...restOptions
}: ResourceTimelineProps) {
  const controller = useCalendarController()

  const isHeightAuto = height === 'auto' || contentHeight === 'auto'
  const hasBorderX = !(restOptions.borderlessX ?? restOptions.borderless)
  const hasBorderBottom = !(restOptions.borderlessBottom ?? restOptions.borderless)

  return (
    <Box
      dir={direction === 'rtl' ? 'rtl' : undefined}
      className={className}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
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
        <SchedulerViews
          height={isHeightAuto ? 'auto' : height !== undefined ? '100%' : contentHeight}
          initialView={availableViews[0]}
          navLinkDayClick={navLinkDayClick}
          navLinkWeekClick={navLinkWeekClick}
          controller={controller}
          plugins={[...plugins, ...userPlugins]}
          {...restOptions}
        />
      </Box>
    </Box>
  )
}
