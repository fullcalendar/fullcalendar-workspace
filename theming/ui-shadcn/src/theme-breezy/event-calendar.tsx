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
  height,
  contentHeight,
  direction,
  ...calendarOptions
}: EventCalendarProps) {
  const controller = useCalendarController()
  const borderlessX = calendarOptions.borderlessX ?? calendarOptions.borderless
  const borderlessTop = calendarOptions.borderlessTop ?? calendarOptions.borderless
  const borderlessBottom = calendarOptions.borderlessBottom ?? calendarOptions.borderless

  return (
    <div
      className={cn(
        className,
        'flex flex-col bg-background',
        !borderlessX && !borderlessTop && !borderlessBottom && 'rounded-lg overflow-hidden',
        !borderlessX && 'border-x',
        !borderlessTop && 'border-t',
        !borderlessBottom && 'border-b',
      )}
      style={{ height }}
      dir={direction === 'rtl' ? 'rtl' : undefined}
    >
      <EventCalendarToolbar
        className='border-b p-4 bg-sidebar text-sidebar-foreground'
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
      />
      <div className='grow min-h-0'>
        <EventCalendarView
          height={height !== undefined ? '100%' : contentHeight}
          initialView={availableViews[0]}
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

const primaryClass = 'bg-(--primary) text-(--primary-foreground)'
const primaryPressableClass = primaryClass // TODO: effect!

const ghostHoverClass = 'hover:bg-muted' // shouldn't it be semitransparent!?
const ghostPressableClass = `${ghostHoverClass} focus-visible:bg-muted` // useless!?

export const optionParams: EventCalendarOptionParams = {
  primaryClass,
  primaryPressableClass,

  ghostHoverClass,
  ghostPressableClass,

  strongBgClass: 'bg-muted-foreground/20',
  mutedBgClass: 'bg-muted/50',
  mutedWashClass: 'bg-muted/50',
  highlightClass: 'bg-sky-500/10',

  // most borders are inherited
  borderColorClass: '',
  borderStartColorClass: '',
  primaryBorderColorClass: 'border-(--primary)',
  strongBorderColorClass: '',
  strongBorderBottomColorClass: '',
  mutedBorderColorClass: '',
  nowBorderColorClass: 'border-destructive',

  eventColor: 'var(--primary)',
  bgEventColor: 'var(--primary)',
  bgEventColorClass: 'opacity-15',

  popoverClass: 'border rounded-lg bg-popover text-popover-foreground shadow-lg',

  bgClass: 'bg-background',
  bgOutlineColorClass: 'outline-background',

  faintFgClass: 'text-muted-foreground',
  mutedFgClass: 'text-muted-foreground',
  fgClass: '',
  strongFgClass: '',
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
