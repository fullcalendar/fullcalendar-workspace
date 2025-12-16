import React from 'react'
import { CalendarOptions, PluginDef } from '@fullcalendar/core'
import { useCalendarController } from "@fullcalendar/react"
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import multiMonthPlugin from '@fullcalendar/multimonth'
import EventCalendarToolbar from './EventCalendarToolbar.js'
import EventCalendarViews from './EventCalendarViews.js'
import EventCalendarContainer from './EventCalendarContainer.js'

export const eventCalendarPlugins: PluginDef[] = [
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  interactionPlugin,
  multiMonthPlugin,
]

const eventCalendarAvailableViews = [
  'dayGridMonth',
  'timeGridWeek',
  'timeGridDay',
  'listWeek',
  'multiMonthYear',
]

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

export default function EventCalendar({
  availableViews = eventCalendarAvailableViews,
  addButton,
  className,
  height,
  contentHeight,
  direction,
  plugins: userPlugins = [],
  ...restOptions
}: EventCalendarProps) {
  const controller = useCalendarController()

  return (
    <EventCalendarContainer direction={direction} className={className} height={height}>
      <EventCalendarToolbar
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
        borderlessX={restOptions.borderlessX ?? restOptions.borderless}
      />
      <EventCalendarViews
        liquidHeight={height !== undefined}
        height={contentHeight}
        initialView={availableViews[0]}
        controller={controller}
        plugins={[...eventCalendarPlugins, ...userPlugins]}
        {...restOptions}
      />
    </EventCalendarContainer>
  )
}

