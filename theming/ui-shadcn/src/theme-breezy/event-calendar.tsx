import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions, EventCalendarOptionParams } from '@fullcalendar/theme-breezy-dev/options-event-calendar'
import { createSlots } from '@fullcalendar/theme-breezy-dev/slots'
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
        className='border-b p-4 bg-sidebar text-sidebar-foreground'
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
      />
      <EventCalendarView
        initialView={availableViews[0]}
        borderlessX
        borderlessBottom
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
  primaryBgColorClass: 'bg-(--primary)',
  primaryTextColorClass: 'text-(--primary-foreground)',
  primaryBorderColorClass: 'border-(--primary)',

  eventColor: 'var(--primary)',
  backgroundEventColor: 'var(--primary)',
  backgroundEventColorClass: 'opacity-15',

  popoverClass: 'border rounded-lg bg-popover text-popover-foreground shadow-lg',

  bgColorClass: 'bg-background',
  bgColorOutlineClass: 'outline-background',

  // all get shadcn inherited border
  borderLowColorClass: '',
  borderMidColorClass: '',
  borderStartMedColorClass: '',
  borderHighColorClass: '',
  borderBottomHighColorClass: '',

  mutedBgClass: 'bg-muted/50',
  neutralBgClass: 'bg-muted-foreground/20',
  highlightClass: 'bg-sky-500/10',
  ghostButtonClass: 'hover:bg-muted focus-visible:bg-muted',

  textLowColorClass: 'text-muted-foreground',
  textMidColorClass: 'text-muted-foreground',
  textHighColorClass: '',
  textHeaderColorClass: '',

  nowIndicatorBorderColorClass: 'border-destructive',
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
