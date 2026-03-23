import React from 'react'
import { type CalendarOptions, useCalendarController } from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/react/daygrid'
import interactionPlugin from '@fullcalendar/react/interaction'
import listPlugin from '@fullcalendar/react/list'
import multiMonthPlugin from '@fullcalendar/react/multimonth'
import timeGridPlugin from '@fullcalendar/react/timegrid'
import { EventCalendarToolbar } from './event-calendar-toolbar.js'
import { EventCalendarViews } from './event-calendar-views.js'
import { EventCalendarCloseIcon } from './event-calendar-icons.js'
import { EventCalendarContainer } from './event-calendar-container.js'

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
  direction,
  className,
  height,
  contentHeight,
  plugins: userPlugins = [],
  ...restOptions
}: EventCalendarProps) {
  const controller = useCalendarController()
  const autoHeight = height === 'auto' || contentHeight === 'auto'

  return (
    <EventCalendarContainer
      direction={direction}
      className={className}
      height={height}
      autoHeight={autoHeight}
      borderless={restOptions.borderless}
      borderlessX={restOptions.borderlessX}
      borderlessTop={restOptions.borderlessTop}
      borderlessBottom={restOptions.borderlessBottom}
    >
      <EventCalendarToolbar
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
      />
      <div className='grow min-h-0'>
        <EventCalendarViews
          controller={controller}
          height={autoHeight ? 'auto' : height !== undefined ? '100%' : contentHeight}
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
    </EventCalendarContainer>
  )
}
