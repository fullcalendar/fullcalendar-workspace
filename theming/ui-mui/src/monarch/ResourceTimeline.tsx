import React from 'react'
import Box from '@mui/material/Box'
import { CalendarOptions, useCalendarController } from '@fullcalendar/react'
import adaptivePlugin from '@fullcalendar/react-scheduler/adaptive'
import resourceTimelinePlugin from '@fullcalendar/react-scheduler/resource-timeline'
import interactionPlugin from '@fullcalendar/react/interaction'
import EventCalendarToolbar from './EventCalendarToolbar.js'
import SchedulerViews from './SchedulerViews.js'

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

export interface ResourceTimelineProps extends Omit<CalendarOptions, 'class' | 'className'> {
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
  const borderlessX = restOptions.borderlessX ?? restOptions.borderless
  const borderlessTop = restOptions.borderlessTop ?? restOptions.borderless
  const borderlessBottom = restOptions.borderlessBottom ?? restOptions.borderless

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
        borderLeftWidth: borderlessX ? 0 : 1,
        borderRightWidth: borderlessX ? 0 : 1,
        borderTopWidth: borderlessTop ? 0 : 1,
        borderBottomWidth: borderlessBottom ? 0 : 1,
        ...(!borderlessTop && !borderlessX && {
          borderTopLeftRadius: theme.shape.borderRadius,
          borderTopRightRadius: theme.shape.borderRadius,
        }),
        ...(!borderlessBottom && !borderlessX && {
          borderBottomLeftRadius: theme.shape.borderRadius,
          borderBottomRightRadius: theme.shape.borderRadius,
        }),
        overflow: !isHeightAuto ? 'hidden' : undefined,
      })}
    >
      <EventCalendarToolbar
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
      />
      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        <SchedulerViews
          height={isHeightAuto ? 'auto' : height !== undefined ? '100%' : contentHeight}
          initialView={availableViews[0]}
          navLinkDayClick={navLinkDayClick}
          navLinkWeekClick={navLinkWeekClick}
          borderless
          controller={controller}
          plugins={[...plugins, ...userPlugins]}
          {...restOptions}
        />
      </Box>
    </Box>
  )
}

