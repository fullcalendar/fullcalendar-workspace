import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions, EventCalendarOptionParams } from '@fullcalendar/theme-monarch-dev/options-event-calendar'
import { createSlots } from '@fullcalendar/theme-monarch-dev/slots'
import { cn } from '../lib/utils.js'
import { EventCalendarToolbar } from '../lib/event-calendar-toolbar.js'
import { eventCalendarIconOptions } from '../lib/event-calendar-icons.js'
import { eventCalendarAvailableViews, eventCalendarPlugins } from '../lib/event-calendar-presets.js'

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

export function EventCalendar({
  availableViews = eventCalendarAvailableViews,
  addButton,
  className,
  ...calendarOptions
}: EventCalendarProps) {
  const controller = useCalendarController()
  const borderlessX = calendarOptions.borderlessX ?? calendarOptions.borderless
  const borderlessTop = calendarOptions.borderlessTop ?? calendarOptions.borderless
  const borderlessBottom = calendarOptions.borderlessBottom ?? calendarOptions.borderless

  return (
    <div className={cn(
      className,
      'bg-background',
      !borderlessX && !borderlessTop && !borderlessBottom && 'rounded-lg overflow-hidden',
      !borderlessX && 'border-x',
      !borderlessTop && 'border-t',
      !borderlessBottom && 'border-b',
    )}>
      <EventCalendarToolbar
        className='p-4'
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
      />
      <EventCalendarView
        initialView={availableViews[0]}
        controller={controller}
        {...calendarOptions}
        plugins={[
          ...eventCalendarPlugins,
          ...(calendarOptions.plugins || []),
        ]}
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
  miscPillClass: (data) => data.hasNavLink ? accentButtonClass : accentClass,

  highlightClass: 'bg-primary opacity-10',
  disabledBgClass: 'bg-muted',

  borderColorClass: '', // border-color is set globally
  nowIndicatorBorderColorClass: 'border-destructive',
  compactMoreLinkBorderColorClass: 'border-primary',

  eventColor: 'var(--primary)',
  eventContrastColor: 'var(--primary-foreground)',
  backgroundEventColor: 'var(--primary)',
  backgroundEventColorClass: 'opacity-15',

  popoverClass: 'border rounded-lg bg-popover text-popover-foreground shadow-lg',

  bgColorClass: 'bg-background',
  bgColorOutlineClass: 'outline-background',
}

const baseEventCalendarOptions = createEventCalendarOptions(optionParams)

const slots = createSlots({
  createElement: React.createElement as any, // HACK
  Fragment: React.Fragment as any, // HACK
}, optionParams)

export function EventCalendarView(calendarOptions: CalendarOptions) {
  return (
    <FullCalendar
      {...baseEventCalendarOptions.optionDefaults}
      {...eventCalendarIconOptions}
      {...slots}
      {...calendarOptions}
      views={mergeViewOptionsMap(
        baseEventCalendarOptions.views || {},
        calendarOptions.views || {},
      )}
    />
  )
}
