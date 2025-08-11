import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions, EventCalendarOptionParams } from '@fullcalendar/theme-breezy-dev/options-event-calendar'
import { createSlots } from '@fullcalendar/theme-breezy-dev/slots'
import { EventCalendarToolbar } from '../lib/event-calendar-toolbar.js'
import { eventCalendarIconOptions } from '../lib/event-calendar-icons.js'

export interface EventCalendarProps extends CalendarOptions {
  availableViews: string[]
}

export function EventCalendar({ availableViews, ...options }: EventCalendarProps) {
  const controller = useCalendarController()

  return (
    <div className='border rounded-lg overflow-hidden'>{/* keep in sync with default-ui */}
      <EventCalendarToolbar
        className='p-4 bg-sidebar text-sidebar-foreground'
        controller={controller}
        availableViews={availableViews}
      />
      <EventCalendarView
        borderlessX
        borderlessBottom
        controller={controller}
        {...options}
      />
    </div>
  )
}

export const optionParams: EventCalendarOptionParams = {
  primaryBgColorClass: 'bg-(--primary)',
  primaryTextColorClass: 'text-(--primary-foreground)',
  primaryBorderColorClass: 'border-(--primary)',

  eventColor: 'var(--primary)',
  backgroundEventColor: 'var(--primary)',
  backgroundEventColorClass: 'opacity-15',

  popoverClass: 'border bg-background text-foreground rounded-lg shadow-md',

  canvasBgColorClass: 'bg-background',
  canvasOutlineColorClass: 'outline-background',
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
