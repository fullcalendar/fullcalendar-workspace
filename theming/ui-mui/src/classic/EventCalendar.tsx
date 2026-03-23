import React from 'react'
import Box from '@mui/material/Box'
import { CalendarOptions, PluginDefInput, useCalendarController } from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/react/daygrid'
import timeGridPlugin from '@fullcalendar/react/timegrid'
import listPlugin from '@fullcalendar/react/list'
import interactionPlugin from '@fullcalendar/react/interaction'
import multiMonthPlugin from '@fullcalendar/react/multimonth'
import EventCalendarToolbar from './EventCalendarToolbar.js'
import EventCalendarViews from './EventCalendarViews.js'

const plugins: PluginDefInput[] = [
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  interactionPlugin,
  multiMonthPlugin,
]
const defaultAvailableViews = [
  'dayGridMonth',
  'timeGridWeek',
  'timeGridDay',
  'listWeek',
  'multiMonthYear',
]
const navLinkDayClick = 'timeGridDay'
const navLinkWeekClick = 'timeGridWeek'

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
  availableViews = defaultAvailableViews,
  addButton,
  className,
  height,
  contentHeight,
  direction,
  plugins: userPlugins = [],
  ...restOptions
}: EventCalendarProps) {
  const controller = useCalendarController()

  const isHeightAuto = height === 'auto' || contentHeight === 'auto'
  const borderlessX = restOptions.borderlessX ?? restOptions.borderless
  const borderlessBottom = restOptions.borderlessBottom ?? restOptions.borderless

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
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
        borderlessX={borderlessX}
      />
      <Box
        sx={(theme) => ({
          flexGrow: 1,
          minHeight: 0,
          bgcolor: 'background.paper',
          borderStyle: 'solid',
          borderColor: 'divider',
          borderLeftWidth: borderlessX ? 0 : 1,
          borderRightWidth: borderlessX ? 0 : 1,
          borderTopWidth: 1,
          borderBottomWidth: borderlessBottom ? 0 : 1,
          ...(!borderlessX && !isHeightAuto && {
            borderTopLeftRadius: theme.shape.borderRadius,
            borderTopRightRadius: theme.shape.borderRadius,
          }),
          ...(!borderlessBottom && !borderlessX && !isHeightAuto && {
            borderBottomLeftRadius: theme.shape.borderRadius,
            borderBottomRightRadius: theme.shape.borderRadius,
          }),
          overflow: !isHeightAuto ? 'hidden' : undefined,
        })}
      >
        <EventCalendarViews
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

