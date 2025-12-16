import React from 'react'
import { CalendarOptions } from '@fullcalendar/core'
import { useCalendarController } from "@fullcalendar/react"
import adaptivePlugin from '@fullcalendar/adaptive'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import interactionPlugin from '@fullcalendar/interaction'
import EventCalendarToolbar from './EventCalendarToolbar.js'
import SchedulerViews from './SchedulerViews.js'
import EventCalendarContainer from './EventCalendarContainer.js'

const plugins = [
  adaptivePlugin,
  interactionPlugin,
  resourceTimelinePlugin,
]
const defaultAvailableViews = [
  'resourceTimelineDay',
  'resourceTimelineWeek',
]
const navLinkDayClick = 'resourceTimelineDay'
const navLinkWeekClick = 'resourceTimelineWeek'

export interface ResourceTimelineProps extends Omit<CalendarOptions, 'class'> {
  availableViews?: string[]
  addButton?: {
    isPrimary?: boolean
    text?: string
    hint?: string
    click?: (ev: MouseEvent) => void
  }
}

export default function ResourceTimeline({
  availableViews = defaultAvailableViews,
  addButton,
  className,
  height,
  contentHeight,
  direction,
  plugins: userPlugins = [],
  ...restOptions
}: ResourceTimelineProps) {
  const controller = useCalendarController()

  return (
    <EventCalendarContainer direction={direction} className={className} height={height}>
      <EventCalendarToolbar
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
        borderlessX={restOptions.borderlessX ?? restOptions.borderless}
      />
      <SchedulerViews
        liquidHeight={height !== undefined}
        height={contentHeight}
        initialView={availableViews[0]}
        navLinkDayClick={navLinkDayClick}
        navLinkWeekClick={navLinkWeekClick}
        controller={controller}
        plugins={[...plugins, ...userPlugins]}
        {...restOptions}
      />
    </EventCalendarContainer>
  )
}

