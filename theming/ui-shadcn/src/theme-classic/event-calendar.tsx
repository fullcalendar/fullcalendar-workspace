import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions, EventCalendarOptionParams } from '@fullcalendar/theme-classic-dev/options-event-calendar'
import { EventCalendarToolbar } from '../lib/event-calendar-toolbar.js'
import { eventCalendarIconOptions } from '../lib/event-calendar-icons.js'
import { eventCalendarAvailableViews, eventCalendarPlugins } from '../lib/event-calendar-presets.js'

export interface EventCalendarProps extends CalendarOptions {
  availableViews?: string[]
  addButton?: {
    isPrimary?: boolean
    text?: string
    hint?: string
    click?: (ev: MouseEvent) => void
  }
}

export function EventCalendar({
  availableViews = eventCalendarAvailableViews,
  addButton,
  ...calendarOptions
}: EventCalendarProps) {
  const controller = useCalendarController()

  return (
    <div className='flex flex-col gap-5'>
      <EventCalendarToolbar
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
      />
      <div className='border rounded-sm overflow-hidden'>
        <EventCalendarView
          initialView={availableViews[0]}
          borderless
          controller={controller}
          {...calendarOptions}
          plugins={[
            ...eventCalendarPlugins,
            ...(calendarOptions.plugins || []),
          ]}
        />
      </div>
    </div>
  )
}

export const optionParams: EventCalendarOptionParams = {
  borderColorClass: '', // border-color is set globally
  majorBorderColorClass: 'border-ring', // if atomic var ... majorBorderColor: 'var(--ring)'
  nowIndicatorBorderColorClass: 'border-destructive',
  nowIndicatorBorderStartColorClass: 'border-s-destructive',

  todayBgColorClass: 'bg-yellow-400/15 dark:bg-yellow-200/10', // keep hardcoded?
  highlightBgColorClass: 'bg-cyan-100/40 bg-blue-500/20', // TODO: move to primary-color + opacity
  compactMoreLinkBorderColorClass: 'border-primary',

  eventColor: 'var(--primary)',
  eventContrastColor: 'var(--primary-foreground)',
  backgroundEventColor: 'var(--primary)',
  backgroundEventColorClass: 'opacity-15',

  // TODO: better integration with actual Shadcn Popover component
  popoverClass: 'border bg-background text-foreground shadow-lg',

  pageBgColorClass: 'bg-background',
  pageBgColorOutlineClass: 'outline-background',
}

const baseEventCalendarOptions = createEventCalendarOptions(optionParams)

export function EventCalendarView(calendarOptions: CalendarOptions) {
  return (
    <FullCalendar
      {...baseEventCalendarOptions.optionDefaults}
      {...eventCalendarIconOptions}
      {...calendarOptions}
      views={mergeViewOptionsMap(
        baseEventCalendarOptions.views || {},
        calendarOptions.views || {},
      )}
    />
  )
}
