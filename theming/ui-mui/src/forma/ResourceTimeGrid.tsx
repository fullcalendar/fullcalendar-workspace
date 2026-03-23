import React from 'react'
import Box from '@mui/material/Box'
import { CalendarOptions, useCalendarController } from '@fullcalendar/react'
import adaptivePlugin from '@fullcalendar/react-scheduler/adaptive'
import interactionPlugin from '@fullcalendar/react/interaction'
import scrollGridPlugin from '@fullcalendar/react-scheduler/scrollgrid'
import resourceTimeGridPlugin from '@fullcalendar/react-scheduler/resource-timegrid'
import EventCalendarToolbar from './EventCalendarToolbar.js'
import SchedulerViews from './SchedulerViews.js'

const plugins = [
  adaptivePlugin,
  interactionPlugin,
  scrollGridPlugin,
  resourceTimeGridPlugin,
]
const defaultAvailableViews = [
  'resourceTimeGridDay',
  'resourceTimeGridWeek',
]
const navLinkDayClick = 'resourceTimeGridDay'
const navLinkWeekClick = 'resourceTimeGridWeek'

export interface ResourceTimeGridProps extends Omit<CalendarOptions, 'class' | 'className'> {
  className?: string
  availableViews?: string[]
  addButton?: {
    isPrimary?: boolean
    text?: string
    hint?: string
    click?: (ev: MouseEvent) => void
  }
}

export default function ResourceTimeGrid({
  availableViews = defaultAvailableViews,
  addButton,
  className,
  height,
  contentHeight,
  direction,
  plugins: userPlugins = [],
  ...restOptions
}: ResourceTimeGridProps) {
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
          controller={controller}
          plugins={[...plugins, ...userPlugins]}
          {...restOptions}
        />
      </Box>
    </Box>
  )
}

