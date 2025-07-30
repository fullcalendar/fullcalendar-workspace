import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions, EventCalendarOptionParams } from '@fullcalendar/theme-pulse/options-event-calendar'
import { createSlots } from '@fullcalendar/theme-pulse/slots'
import { EventCalendarToolbar } from '../lib/event-calendar-toolbar.js'
import { eventCalendarIconOptions } from '../lib/event-calendar-icons.js'

export interface EventCalendarProps extends CalendarOptions {
  availableViews: string[]
}

export function EventCalendar({ availableViews, ...options }: EventCalendarProps) {
  const controller = useCalendarController()

  return (
    <div className='flex flex-col gap-6'>
      <EventCalendarToolbar
        controller={controller}
        availableViews={availableViews}
      />
      <EventCalendarView
        controller={controller}
        {...options}
      />
    </div>
  )
}

export const optionParams: EventCalendarOptionParams = {
  todayCircleBgColorClass: 'bg-primary/20 dark:bg-primary/30',
  todayCircleTextColorClass: '', // default inherited text

  borderColorClass: '', // border-color is set globally
  // majorBorderColorClass: 'border-ring', // if atomic var ... majorBorderColor: 'var(--ring)'
  // alertBorderColorClass: 'border-destructive',

  eventColor: 'var(--primary)',
  eventContrastColor: 'var(--primary-foreground)',
  backgroundEventColor: 'var(--primary)',
  backgroundEventColorClass: 'opacity-15',

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
