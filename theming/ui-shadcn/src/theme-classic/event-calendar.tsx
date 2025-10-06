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
  height,
  contentHeight,
  direction,
  ...calendarOptions
}: EventCalendarProps) {
  const controller = useCalendarController()
  const borderlessX = calendarOptions.borderlessX ?? calendarOptions.borderless
  const borderlessBottom = calendarOptions.borderlessBottom ?? calendarOptions.borderless

  return (
    <div
      className={cn(className, 'flex flex-col gap-5')}
      style={{ height }}
      dir={direction === 'rtl' ? 'rtl' : undefined}
    >
      <EventCalendarToolbar
        className={borderlessX ? 'px-3' : ''}
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
      />
      <div className='grow min-h-0'>
        <EventCalendarView
          className={cn(
            'bg-background border-t',
            !borderlessX && !borderlessBottom && 'rounded-sm overflow-hidden',
            !borderlessX && 'border-x',
            !borderlessBottom && 'border-b',
          )}
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

const focusConfigClass = 'ring-ring/50 outline-none'
const focusOutlineClass = `focus-visible:ring-3 ${focusConfigClass}`

// secondary
const secondaryClass = 'bg-foreground/10'
const secondaryPressableClass = `${secondaryClass} hover:bg-foreground/20 ${focusOutlineClass}`

// ghost
const ghostHoverClass = 'hover:bg-foreground/10'
const ghostPressableClass = `${ghostHoverClass} ${focusOutlineClass}`

const faintHoverClass = 'hover:bg-muted/50'
const faintPressableClass = `${faintHoverClass} focus-visible:bg-muted` // weird effect?

export const optionParams: EventCalendarOptionParams = {
  secondaryClass,
  secondaryPressableClass,

  ghostHoverClass,
  ghostPressableClass,

  faintHoverClass,
  faintPressableClass,

  strongBgClass: 'bg-muted-foreground/20',
  mutedBgClass: 'bg-muted',
  mutedWashClass: 'bg-muted-foreground/10',
  highlightClass: 'bg-sky-500/10',
  todayBgNotPrintClass: 'not-print:bg-yellow-400/15 dark:bg-yellow-200/10',

  borderColorClass: '', // border-color is set globally
  primaryBorderColorClass: 'border-primary',
  strongBorderColorClass: 'border-muted-foreground/45',
  nowBorderColorClass: 'border-destructive',
  nowBorderStartColorClass: 'border-s-destructive',
  nowBorderTopColorClass: 'border-t-destructive',

  eventColor: 'var(--primary)',
  eventContrastColor: 'var(--primary-foreground)',
  bgEventColor: 'var(--primary)',
  bgEventColorClass: 'opacity-15',

  popoverClass: 'border bg-background text-foreground shadow-lg',

  bgClass: 'bg-background',
  bgOutlineColorClass: 'outline-background',

  mutedFgClass: 'text-muted-foreground',
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
