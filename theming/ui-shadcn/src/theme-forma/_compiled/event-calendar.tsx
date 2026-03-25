import React from 'react'
import { type CalendarOptions, useCalendarController } from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/react/daygrid'
import interactionPlugin from '@fullcalendar/react/interaction'
import listPlugin from '@fullcalendar/react/list'
import multiMonthPlugin from '@fullcalendar/react/multimonth'
import timeGridPlugin from '@fullcalendar/react/timegrid'
import { EventCalendarToolbar } from './event-calendar-toolbar'
import { EventCalendarViews } from './event-calendar-views'
import { EventCalendarCloseIcon } from './event-calendar-icons'
import { cn } from '../../lib/utils'

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

export interface EventCalendarProps extends Omit<CalendarOptions, 'class' | 'className' | 'headerToolbar' | 'footerToolbar'> {
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
  direction,
  className,
  height,
  contentHeight,
  plugins: userPlugins = [],
  ...restOptions
}: EventCalendarProps) {
  const controller = useCalendarController()

  const hasBorderX = !(restOptions.borderlessX ?? restOptions.borderless)
  const hasBorderTop = !(restOptions.borderlessTop ?? restOptions.borderless)
  const hasBorderBottom = !(restOptions.borderlessBottom ?? restOptions.borderless)
  const isHeightAuto = height === 'auto' || contentHeight === 'auto'

  return (
    <div
      className={cn(
        className,
        'flex flex-col bg-background',
        hasBorderX && 'border-x',
        hasBorderTop && 'border-t',
        hasBorderBottom && 'border-b',
        (hasBorderTop && hasBorderX) && 'rounded-t-sm',
        (hasBorderBottom && hasBorderX) && 'rounded-b-sm',
        (hasBorderX && hasBorderTop && hasBorderBottom) && 'shadow-xs',
        !isHeightAuto && 'overflow-hidden',
      )}
      style={{ height }}
      dir={direction === 'rtl' ? 'rtl' : undefined}
    >
      <EventCalendarToolbar
        className='border-b p-3'
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
      />
      <div className='grow min-h-0'>
        <EventCalendarViews
          controller={controller}
          height={isHeightAuto ? 'auto' : height !== undefined ? '100%' : contentHeight}
          initialView={availableViews[0]}
          navLinkDayClick={navLinkDayClick}
          navLinkWeekClick={navLinkWeekClick}
          plugins={[...plugins, ...userPlugins]}
          popoverCloseContent={() => (
            <EventCalendarCloseIcon />
          )}
          {...restOptions}
        />
      </div>
    </div>
  )
}
