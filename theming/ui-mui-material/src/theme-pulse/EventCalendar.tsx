import React from 'react'
import Box from '@mui/material/Box'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions, EventCalendarOptionParams } from '@fullcalendar/theme-pulse-dev/options-event-calendar'
import { createSlots } from '@fullcalendar/theme-pulse-dev/slots'
import EventCalendarToolbar from '../lib/EventCalendarToolbar.js'
import { eventCalendarIconOptions } from '../lib/icons-event-calendar.js'

export interface EventCalendarProps extends CalendarOptions {
  availableViews: string[]
}

export default function EventCalendar({ availableViews, ...options }: EventCalendarProps) {
  const controller = useCalendarController()

  return (
    <div className='flex flex-col gap-6'>
      <EventCalendarToolbar
        controller={controller}
        availableViews={availableViews}
      />
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <EventCalendarView
          borderless
          controller={controller}
          {...options}
        />
      </Box>
    </div>
  )
}

export const optionParams: EventCalendarOptionParams = {
  todayCircleBgColorClass: 'bg-(--mui-palette-secondary-main)',
  todayCircleTextColorClass: 'text-(--mui-palette-secondary-contrastText)',

  borderColorClass: 'border-(--mui-palette-divider)',

  eventColor: 'var(--mui-palette-primary-main)',
  eventContrastColor: 'var(--mui-palette-primary-contrastText)',
  backgroundEventColor: 'var(--mui-palette-secondary-main)',
  backgroundEventColorClass: 'brightness-115 opacity-15',

  canvasBgColorClass: 'bg-(--mui-palette-background-paper)',
  canvasOutlineColorClass: 'outline-(--mui-palette-background-paper)',
}

const baseEventCalendarOptions = createEventCalendarOptions(optionParams)

const slots = createSlots({
  createElement: React.createElement as any, // HACK
  Fragment: React.Fragment as any, // HACK
}, optionParams)

export function EventCalendarView(options: any) {
  return (
    <FullCalendar
      {...baseEventCalendarOptions.optionDefaults}
      {...eventCalendarIconOptions}
      {...slots}
      {...options}
      views={mergeViewOptionsMap(
        baseEventCalendarOptions.views || {},
        options.views || {},
      )}
    />
  )
}
