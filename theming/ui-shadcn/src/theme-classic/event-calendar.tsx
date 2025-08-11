import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions, EventCalendarOptionParams } from '@fullcalendar/theme-classic-dev/options-event-calendar'
import { EventCalendarToolbar } from '../lib/event-calendar-toolbar.js'
import { eventCalendarIconOptions } from '../lib/event-calendar-icons.js'

export interface EventCalendarProps extends CalendarOptions {
  availableViews: string[]
}

export function EventCalendar({ availableViews, ...options }: EventCalendarProps) {
  const controller = useCalendarController()

  return (
    <div className='flex flex-col gap-5'>
      <EventCalendarToolbar
        controller={controller}
        availableViews={availableViews}
      />
      <div className='border rounded-sm overflow-hidden'>
        <EventCalendarView
          borderless
          controller={controller}
          {...options}
        />
      </div>
    </div>
  )
}

export const optionParams: EventCalendarOptionParams = {
  borderColorClass: '', // border-color is set globally
  majorBorderColorClass: 'border-ring', // if atomic var ... majorBorderColor: 'var(--ring)'
  alertBorderColorClass: 'border-destructive',
  alertBorderStartColorClass: 'border-s-destructive',

  eventColor: 'var(--primary)',
  eventContrastColor: 'var(--primary-foreground)',
  backgroundEventColor: 'var(--primary)',
  backgroundEventColorClass: 'opacity-15',

  // TODO: better integration with actual Shadcn Popover component
  popoverClass: 'border bg-background text-foreground shadow-lg',

  canvasBgColorClass: 'bg-background',
  canvasOutlineColorClass: 'outline-background',
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
