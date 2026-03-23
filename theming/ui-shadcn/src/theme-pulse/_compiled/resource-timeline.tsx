import React from 'react'
import { type CalendarOptions, useCalendarController } from '@fullcalendar/react'
import adaptivePlugin from '@fullcalendar/react-scheduler/adaptive'
import interactionPlugin from '@fullcalendar/react/interaction'
import scrollGridPlugin from '@fullcalendar/react-scheduler/scrollgrid'
import resourceTimelinePlugin from '@fullcalendar/react-scheduler/resource-timeline'
import { EventCalendarToolbar } from './event-calendar-toolbar.js'
import { SchedulerViews } from './scheduler-views.js'
import { EventCalendarCloseIcon, EventCalendarExpanderIcon } from './event-calendar-icons.js'
import { EventCalendarContainer } from './event-calendar-container.js'

const plugins = [
  adaptivePlugin,
  interactionPlugin,
  scrollGridPlugin,
  resourceTimelinePlugin,
]
const defaultAvailableViews = [
  'resourceTimelineDay',
  'resourceTimelineWeek',
]
const navLinkDayClick = 'resourceTimelineDay'
const navLinkWeekClick = 'resourceTimelineWeek'

export interface ResourceTimelineProps extends Omit<CalendarOptions, 'class' | 'className'> {
  className?: string
  availableViews?: string[]
  addButton?: {
    isPrimary?: boolean
    text?: string
    hint?: string
    click?: (ev: MouseEvent) => void
  }
}

export function ResourceTimeline({
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
  const autoHeight = height === 'auto' || contentHeight === 'auto'

  return (
    <EventCalendarContainer direction={direction} className={className} height={height}>
      <EventCalendarToolbar
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
        borderlessX={restOptions.borderlessX ?? restOptions.borderless}
      />
      <div className='grow min-h-0'>
        <SchedulerViews
          height={autoHeight ? 'auto' : height !== undefined ? '100%' : contentHeight}
          initialView={availableViews[0]}
          navLinkDayClick={navLinkDayClick}
          navLinkWeekClick={navLinkWeekClick}
          controller={controller}
          plugins={[...plugins, ...userPlugins]}
          popoverCloseContent={() => (
            <EventCalendarCloseIcon />
          )}
          resourceExpanderContent={(data) => (
            <EventCalendarExpanderIcon isExpanded={data.isExpanded} />
          )}
          {...restOptions}
        />
      </div>
    </EventCalendarContainer>
  )
}
