import React from 'react'
import { useCalendarController } from '@fullcalendar/react'
import { type CalendarOptions } from '@fullcalendar/core'
import adaptivePlugin from '@fullcalendar/adaptive'
import interactionPlugin from '@fullcalendar/interaction'
import scrollGridPlugin from '@fullcalendar/scrollgrid'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'
import { EventCalendarToolbar } from './event-calendar-toolbar.js'
import { SchedulerViews } from './scheduler-views.js'
import { EventCalendarCloseIcon, EventCalendarExpanderIcon } from './event-calendar-icons.js'
import { cn } from '../../lib/utils.js'

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

export interface ResourceTimeGridProps extends Omit<CalendarOptions, 'class' | 'className'> {
  className?: string
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
  className,
  height,
  contentHeight,
  direction,
  plugins: userPlugins = [],
  ...restOptions
}: ResourceTimeGridProps) {
  const controller = useCalendarController()
  const borderlessX = restOptions.borderlessX ?? restOptions.borderless
  const borderlessBottom = restOptions.borderlessBottom ?? restOptions.borderless

  return (
    <div
      dir={direction === 'rtl' ? 'rtl' : undefined}
      className={cn('flex flex-col gap-6', className)}
      style={{ height }}
    >
      <EventCalendarToolbar
        className={borderlessX ? 'px-3' : ''}
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
      />
      <SchedulerViews
        className={cn(
          'bg-background border-t',
          !borderlessX && !borderlessBottom && 'rounded-sm overflow-hidden',
          !borderlessX && 'border-x',
          !borderlessBottom && 'border-b',
        )}
        liquidHeight={height !== undefined}
        height={contentHeight}
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
  )
}
