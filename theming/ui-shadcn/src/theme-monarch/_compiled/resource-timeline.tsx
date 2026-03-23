import React from 'react'
import { type CalendarOptions, useCalendarController } from '@fullcalendar/react'
import adaptivePlugin from '@fullcalendar/react-scheduler/adaptive'
import resourceTimelinePlugin from '@fullcalendar/react-scheduler/resource-timeline'
import interactionPlugin from '@fullcalendar/react/interaction'
import { cn } from '../../lib/utils.js'
import { EventCalendarCloseIcon, EventCalendarExpanderIcon } from './event-calendar-icons.js'
import { EventCalendarToolbar } from './event-calendar-toolbar.js'
import { SchedulerViews } from './scheduler-views.js'

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
        (hasBorderTop && hasBorderX) && 'rounded-t-lg',
        (hasBorderBottom && hasBorderX) && 'rounded-b-lg',
        !isHeightAuto && 'overflow-hidden',
      )}
      style={{ height }}
      dir={direction === 'rtl' ? 'rtl' : undefined}
    >
      <EventCalendarToolbar
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
      />
      <div className='grow min-h-0'>
        <SchedulerViews
          controller={controller}
          height={isHeightAuto ? 'auto' : height !== undefined ? '100%' : contentHeight}
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
      </div>
    </div>
  )
}
