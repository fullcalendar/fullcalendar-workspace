import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions, EventCalendarOptionParams } from '@fullcalendar/theme-forma-dev/options-event-calendar'
import { createSlots } from '@fullcalendar/theme-forma-dev/slots'
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
      !borderlessX && !borderlessTop && !borderlessBottom && 'rounded-sm overflow-hidden shadow-xs',
      !borderlessX && 'border-x',
      !borderlessTop && 'border-t',
      !borderlessBottom && 'border-b',
    )}>
      <EventCalendarToolbar
        className='border-b p-3'
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

export const optionParams: EventCalendarOptionParams = {
  primaryBgColorClass: 'bg-primary',
  primaryTextColorClass: 'text-primary-foreground',
  primaryBorderColorClass: 'border-primary',

  solidMoreLinkBgClass: 'bg-muted',
  ghostButtonClass: 'hover:bg-muted focus-visible:bg-muted',
  selectedBgClass: 'bg-muted',

  highlightClass: 'bg-sky-500/10',

  majorBorderColorClass: 'border-muted-foreground/60',

  borderColorClass: '', // border-color is set globally
  nowIndicatorBorderColorClass: 'border-destructive',

  transparentMutedBgClass: 'bg-muted/50', // TODO: use foreground like other theme?
  mutedBgClass: 'bg-muted/50',

  eventColor: 'var(--primary)',
  backgroundEventColor: 'var(--primary)',
  backgroundEventColorClass: 'opacity-15',

  // TODO: better integration with actual Shadcn Popover component
  popoverClass: 'border bg-background text-foreground shadow-md',

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
