import React from 'react'
import Box from '@mui/material/Box'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions, EventCalendarOptionParams } from '@fullcalendar/theme-classic/options-event-calendar'
import EventCalendarToolbar from '../lib/EventCalendarToolbar.js'
import { eventCalendarIconOptions } from '../lib/icons-event-calendar.js'

export interface EventCalendarProps extends CalendarOptions {
  availableViews: string[]
}

export default function EventCalendar({ availableViews, ...options }: EventCalendarProps) {
  const controller = useCalendarController()

  return (
    <div className='flex flex-col gap-5'>
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
  borderColorClass: 'border-(--mui-palette-divider)',
  majorBorderColorClass: 'border-(--mui-palette-primary-main)', // will have color. might be cool
  alertBorderColorClass: 'border-(--mui-palette-error-main)',
  alertBorderStartColorClass: 'border-s-(--mui-palette-error-main)',

  eventColor: 'var(--mui-palette-primary-main)',
  eventContrastColor: 'var(--mui-palette-primary-contrastText)',
  backgroundEventColor: 'var(--mui-palette-secondary-main)',
  backgroundEventColorClass: 'brightness-115 opacity-15',

  popoverClass: 'text-(--mui-palette-text-primary) bg-(--mui-palette-background-paper) rounded-(--mui-shape-borderRadius) shadow-(--mui-shadows-8) m-2',

  canvasBgColorClass: 'bg-(--mui-palette-background-paper)',
  canvasOutlineColorClass: 'outline-(--mui-palette-background-paper)',
}

const baseEventCalendarOptions = createEventCalendarOptions(optionParams)

export function EventCalendarView(options: any) {
  return (
    <FullCalendar
      {...baseEventCalendarOptions.optionDefaults}
      {...eventCalendarIconOptions}
      {...options}
      views={mergeViewOptionsMap(
        baseEventCalendarOptions.views || {},
        options.views || {},
      )}
    />
  )
}
