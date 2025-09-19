import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions, EventCalendarOptionParams } from '@fullcalendar/theme-pulse-dev/options-event-calendar'
import { cn } from '../lib/utils.js'
import { createSlots } from '@fullcalendar/theme-pulse-dev/slots'
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

  return (
    <div className={cn(className, 'flex flex-col gap-6')}>
      <EventCalendarToolbar
        className={borderlessX ? 'px-3' : ''}
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
      />
      <EventCalendarView
        className='border rounded-sm overflow-hidden bg-background'
        initialView={availableViews[0]}
        controller={controller}
        {...calendarOptions}
        borderlessTop={false}
        plugins={[
          ...eventCalendarPlugins,
          ...(calendarOptions.plugins || []),
        ]}
      />
    </div>
  )
}

export const optionParams: EventCalendarOptionParams = {
  todayCircleBgColorClass: 'bg-primary/20 dark:bg-primary/30',
  todayCircleTextColorClass: '', // default inherited text

  borderColorClass: '', // border-color is set globally
  // nowIndicatorBorderColorClass: 'border-destructive',

  eventColor: 'var(--primary)',
  eventContrastColor: 'var(--primary-foreground)',
  backgroundEventColor: 'var(--primary)',
  backgroundEventColorClass: 'opacity-15',

  bgColorOutlineClass: 'outline-background',
  bgColorClass: 'bg-background',

  highlightClass: 'bg-sky-500/10',
  ghostButtonClass: 'hover:bg-muted focus-visible:bg-muted',

  popoverClass: 'border bg-background text-foreground shadow-lg rounded-md shadow-md m-1',

  mutedOpaqueBgClass: 'bg-muted',
  mutedTransparentBgClass: 'bg-muted-foreground/10',

  nonMutedTextClass: 'text-foreground',
  mutedTextClass: 'text-muted-foreground',
  mutedExtraTextClass: 'text-muted-foreground',
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
