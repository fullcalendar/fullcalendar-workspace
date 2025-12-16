import React from 'react'
import { useCalendarController } from '@fullcalendar/react'
import { type CalendarOptions } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import multiMonthPlugin from '@fullcalendar/multimonth'
import timeGridPlugin from '@fullcalendar/timegrid'
import { EventCalendarViews } from './event-calendar-views.js'
import { EventCalendarToolbar } from './event-calendar-toolbar.js'
import { EventCalendarCloseIcon } from './event-calendar-icons.js'
import { cn } from '../../lib/utils.js'

const plugins = [
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  interactionPlugin,
  multiMonthPlugin,
]
const defaultAvailableViews = [
  'dayGridMonth',
  'timeGridWeek',
  'timeGridDay',
  'listWeek',
  'multiMonthYear',
]
const navLinkDayClick = 'timeGridDay'
const navLinkWeekClick = 'timeGridWeek'

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
  availableViews = defaultAvailableViews,
  addButton,
  className,
  height,
  contentHeight,
  direction,
  plugins: userPlugins = [],
  ...restOptions
}: EventCalendarProps) {
  const controller = useCalendarController()
  const borderlessX = restOptions.borderlessX ?? restOptions.borderless
  const borderlessBottom = restOptions.borderlessBottom ?? restOptions.borderless

  return (
    <div
      dir={direction === 'rtl' ? 'rtl' : undefined}
      className={cn('flex flex-col gap-5', className)}
      style={{ height }}
    >
      <EventCalendarToolbar
        className={borderlessX ? 'px-3' : ''}
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
      />
      <EventCalendarViews
        className={cn(
          'bg-background border-t',
          !borderlessX && !borderlessBottom && 'rounded-sm overflow-hidden',
          !borderlessX && 'border-x',
          !borderlessBottom && 'border-b',
        )}
        liquidHeight={height !== undefined}
        height={contentHeight}
        initialView={availableViews[0]}
        navLinkDayClick={navLinkDayClick}
        navLinkWeekClick={navLinkWeekClick}
        controller={controller}
        plugins={[...plugins, ...userPlugins]}
        popoverCloseContent={() => (
          <EventCalendarCloseIcon />
        )}
        {...restOptions}
      />
    </div>
  )
}
