import React from 'react'
import { useCalendarController } from '@fullcalendar/react'
import { type CalendarOptions } from '@fullcalendar/core'
import adaptivePlugin from '@fullcalendar/adaptive'
import interactionPlugin from '@fullcalendar/interaction'
import scrollGridPlugin from '@fullcalendar/scrollgrid'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'
import { EventCalendarContainer } from './event-calendar-container.js'
import { EventCalendarToolbar } from './event-calendar-toolbar.js'
import { SchedulerViews } from './scheduler-views.js'
import { EventCalendarCloseIcon, EventCalendarExpanderIcon } from './event-calendar-icons.js'

const plugins = [
  adaptivePlugin,
  interactionPlugin,
  scrollGridPlugin,
  resourceTimeGridPlugin,
]
const defaultAvailableViews = [
  'resourceTimeGridDay',
  'resourceTimeGridWeek',
]
const navLinkDayClick = 'resourceTimeGridDay'
const navLinkWeekClick = 'resourceTimeGridWeek'

export interface ResourceTimeGridProps extends Omit<CalendarOptions, 'class'> {
  availableViews?: string[]
  addButton?: {
    isPrimary?: boolean
    text?: string
    hint?: string
    click?: (ev: MouseEvent) => void
  }
}

export function ResourceTimeGrid({
  availableViews = defaultAvailableViews,
  addButton,
  direction,
  className,
  height,
  contentHeight,
  plugins: userPlugins = [],
  ...restOptions
}: ResourceTimeGridProps) {
  const controller = useCalendarController()
  const autoHeight = height === 'auto' || contentHeight === 'auto'

  return (
    <EventCalendarContainer
      direction={direction}
      className={className}
      height={height}
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
      <SchedulerViews
        controller={controller}
        liquidHeight={!autoHeight && height !== undefined}
        height={autoHeight ? 'auto' : contentHeight}
        initialView={availableViews[0]}
        navLinkDayClick={navLinkDayClick}
        navLinkWeekClick={navLinkWeekClick}
        plugins={[...plugins, ...userPlugins]}
        popoverCloseContent={() => (
          <EventCalendarCloseIcon />
        )}
        resourceExpanderContent={(data) => (
          <EventCalendarExpanderIcon isExpanded={data.isExpanded} />
        )}
        {...restOptions}
      />
    </EventCalendarContainer>
  )
}
