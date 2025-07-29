import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions, EventCalendarOptionParams } from '@fullcalendar/theme-monarch/options-event-calendar'
import { createSlots } from '@fullcalendar/theme-monarch/slots'
import { EventCalendarToolbar } from '../lib/event-calendar-toolbar.js'
// import { eventCalendarIconOptions } from '../lib/event-calendar-icons.js' // TODO

export interface EventCalendarProps extends CalendarOptions {
  availableViews: string[]
}

export function EventCalendar({ availableViews, ...options }: EventCalendarProps) {
  const controller = useCalendarController()

  return (
    <div className='border rounded-lg overflow-hidden'>
      <EventCalendarToolbar
        className='p-4'
        controller={controller}
        availableViews={availableViews}
      />
      <EventCalendarView
        borderless
        controller={controller}
        {...options}
      />
    </div>
  )
}

/*
Try making EVENTS semitransparent, and make today-circle opaque?
*/

// rename
const primaryClass = 'bg-primary/20 dark:bg-primary/30' // doesn't need text contrast
const primaryButtonClass = `${primaryClass} hover:bg-primary/90 active:bg-primary/80`

// better than "accent" because sits well on top of nonBusinessHours gray
const accentClass = 'bg-black/10 dark:bg-white/10 text-accent-foreground'
const accentButtonClass = `${accentClass} hover:bg-gray-500/20 active:bg-gray-500/30` // TODO: better dary mode

export const optionParams: EventCalendarOptionParams = {
  todayPillClass: (data) => data.hasNavLink ? primaryButtonClass : primaryClass,
  pillClass: (data) => data.hasNavLink ? accentButtonClass : accentClass,

  highlightClass: 'bg-primary opacity-10',
  disabledBgClass: 'bg-muted',

  borderColorClass: '', // border-color is set globally
  majorBorderColorClass: 'border-ring', // if atomic var ... majorBorderColor: 'var(--ring)'
  alertBorderColorClass: 'border-destructive',

  eventColor: 'var(--primary)',
  eventContrastColor: 'var(--primary-foreground)',
  backgroundEventColor: 'var(--primary)',
  backgroundEventColorClass: 'opacity-15',
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
      // {...eventCalendarIconOptions}
      {...slots}
      {...options}
      views={mergeViewOptionsMap(
        baseEventCalendarOptions.views || {},
        options.views || {},
      )}
    />
  )
}
