import React from 'react'
import { type CalendarOptions, useCalendarController } from '@fullcalendar/react'
import adaptivePlugin from '@fullcalendar/react-scheduler/adaptive'
import interactionPlugin from '@fullcalendar/react/interaction'
import scrollGridPlugin from '@fullcalendar/react-scheduler/scrollgrid'
import resourceTimelinePlugin from '@fullcalendar/react-scheduler/resource-timeline'
import { EventCalendarToolbar } from './event-calendar-toolbar'
import { SchedulerViews } from './scheduler-views'
import { EventCalendarCloseIcon, EventCalendarExpanderIcon } from './event-calendar-icons'
import { cn } from '../../lib/utils'

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

export interface ResourceTimelineProps extends Omit<CalendarOptions, 'class' | 'className' | 'headerToolbar' | 'footerToolbar'> {
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
  const hasBorderBottom = !(restOptions.borderlessBottom ?? restOptions.borderless)
  const isHeightAuto = height === 'auto' || contentHeight === 'auto'

  return (
    <div
      className={cn(className, 'flex flex-col gap-6')}
      style={{ height }}
      dir={direction === 'rtl' ? 'rtl' : undefined}
    >
      <EventCalendarToolbar
        className={!hasBorderX ? 'px-3' : undefined}
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
      />
      <div className='grow min-h-0'>
        <SchedulerViews
          className={cn(
            'bg-background border-t',
            hasBorderX && 'border-x',
            hasBorderBottom && 'border-b',
            (hasBorderX && !isHeightAuto) && 'rounded-t-sm',
            (hasBorderX && hasBorderBottom && !isHeightAuto) && 'rounded-b-sm',
            (hasBorderX && hasBorderBottom) && 'shadow-xs',
            !isHeightAuto && 'overflow-hidden',
          )}
          height={isHeightAuto ? 'auto' : height !== undefined ? '100%' : contentHeight}
          initialView={availableViews[0]}
          navLinkDayClick={navLinkDayClick}
          navLinkWeekClick={navLinkWeekClick}
          controller={controller}
          plugins={[...plugins, ...userPlugins]}
          popoverCloseContent={() => (
            <EventCalendarCloseIcon />
          )}
          resourceExpanderContent={(info) => (
            <EventCalendarExpanderIcon isExpanded={info.isExpanded} />
          )}
          {...restOptions}
        />
      </div>
    </div>
  )
}
