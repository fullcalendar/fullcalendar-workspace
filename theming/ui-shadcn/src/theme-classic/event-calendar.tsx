import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { createEventCalendarOptions, EventCalendarOptionParams } from '@fullcalendar/theme-classic-dev/options-event-calendar'
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

  return (
    <div className={cn(className, 'flex flex-col gap-5')}>
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
  borderColorClass: '', // border-color is set globally
  majorBorderColorClass: 'border-muted-foreground/60',
  nowIndicatorBorderColorClass: 'border-destructive',
  nowIndicatorBorderStartColorClass: 'border-s-destructive',
  nowIndicatorBorderTopColorClass: 'border-t-destructive',
  compactMoreLinkBorderColorClass: 'border-primary',
  todayBgClass: 'bg-yellow-400/15 dark:bg-yellow-200/10',
  highlightClass: 'bg-sky-500/10',
  transparentMutedBgClass: 'bg-muted-foreground/10',
  opaqueMutedBgClass: 'bg-muted',
  mutedBgClass: 'bg-muted',
  mutedTextColorClass: 'text-muted-foreground',
  eventColor: 'var(--primary)',
  eventContrastColor: 'var(--primary-foreground)',
  backgroundEventColor: 'var(--primary)',
  backgroundEventColorClass: 'opacity-15',
  hoverRowClass: 'hover:bg-muted/50 focus-visible:bg-muted',
  hoverButtonClass: 'hover:bg-muted-foreground/15 focus-visible:bg-muted-foreground/30',
  selectedButtonClass: 'bg-muted-foreground/45',
  popoverClass: 'border bg-background text-foreground shadow-lg',
  bgColorClass: 'bg-background',
  bgColorOutlineClass: 'outline-background',
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
