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
        'flex flex-col',
        'bg-background',
        !borderlessX && !borderlessTop && !borderlessBottom && 'rounded-lg overflow-hidden',
        !borderlessX && 'border-x',
        !borderlessTop && 'border-t',
        !borderlessBottom && 'border-b',
      )}
      style={{ height }}
      dir={direction === 'rtl' ? 'rtl' : undefined}
    >
      <EventCalendarToolbar
        className='p-4'
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

// TODO: use transition, like Shadn
// However, when we do transition-all like the buttons have,
// drag & drop gets really distorted. How to blacklist position? Or whitelist what we want?
const focusOutlineClass = 'outline-none focus-visible:ring-3 ring-ring/50'
const selectedOutlineClass = 'ring-3 ring-ring/50'

// secondary
const secondaryClass = 'bg-foreground/10'
const secondaryPressableClass = `${secondaryClass} hover:bg-foreground/20 ${focusOutlineClass}`

// tertiary (based on primary, but with low contrast)
const tertiaryClass = 'bg-primary/20 dark:bg-primary/30'
const tertiaryPressableClass = `${tertiaryClass} hover:bg-primary/40 ${focusOutlineClass}`

// ghost
const ghostHoverClass = 'hover:bg-foreground/10'
const ghostPressableClass = `${ghostHoverClass} ${focusOutlineClass}`

export const optionParams: EventCalendarOptionParams = {
  secondaryClass,
  secondaryPressableClass,

  tertiaryClass,
  tertiaryPressableClass,

  ghostHoverClass,
  ghostPressableClass,

  focusOutlineClass,
  selectedOutlineClass,

  mutedBgClass: 'bg-muted',
  mutedWashClass: 'bg-foreground/5',
  strongBgClass: 'bg-foreground/20',
  highlightClass: 'bg-primary opacity-10',

  borderColorClass: '', // border-color is set globally
  primaryBorderColorClass: 'border-primary',
  strongBorderColorClass: 'border-foreground/60',
  nowBorderColorClass: 'border-destructive',

  eventColor: 'var(--primary)',
  eventContrastColor: 'var(--primary-foreground)',
  bgEventColor: 'var(--primary)',
  bgEventColorClass: 'opacity-15',

  popoverClass: 'border rounded-lg bg-popover text-popover-foreground shadow-lg',

  bgClass: 'bg-background',
  bgOutlineClass: 'outline-background',
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
