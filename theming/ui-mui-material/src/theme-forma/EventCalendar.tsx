import React from 'react'
import Box from '@mui/material/Box'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions, EventCalendarOptionParams } from '@fullcalendar/theme-forma/options-event-calendar'
import { createSlots } from '@fullcalendar/theme-forma/slots'
import EventCalendarToolbar from '../lib/EventCalendarToolbar.js'
import { eventCalendarIconOptions } from '../lib/icons-event-calendar.js'

export interface EventCalendarProps extends CalendarOptions {
  availableViews: string[]
}

export default function EventCalendar({ availableViews, ...options }: EventCalendarProps) {
  const controller = useCalendarController()

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        // boxShadow: 1, // too harsh -- not meant to have border too
        overflow: 'hidden',
      }}
    >
      <EventCalendarToolbar
        className='p-3'
        controller={controller}
        availableViews={availableViews}
      />
      <EventCalendarView
        borderlessX
        borderlessBottom
        controller={controller}
        {...options}
      />
    </Box>
  )
}

export const optionParams: EventCalendarOptionParams = {
  primaryBgColorClass: 'bg-(--mui-palette-primary-main)',
  primaryTextColorClass: 'text-(--mui-palette-primary-contrastText)',
  primaryBorderColorClass: 'border-(--mui-palette-primary-main)',

  borderColorClass: 'border-(--mui-palette-divider)',
  majorBorderColorClass: 'border-(--mui-palette-primary-main)', // will have color. might be cool
  alertBorderColorClass: 'border-(--mui-palette-error-main)',

  eventColor: 'var(--mui-palette-primary-main)',
  backgroundEventColor: 'var(--mui-palette-secondary-main)',
  backgroundEventColorClass: 'brightness-115 opacity-15',

  popoverClass: 'text-(--mui-palette-text-primary) bg-(--mui-palette-background-paper) rounded-(--mui-shape-borderRadius) shadow-(--mui-shadows-8) m-1',

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
