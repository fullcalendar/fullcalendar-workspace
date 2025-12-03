import React from 'react'
import { CalendarOptions } from '@fullcalendar/core'
import { useCalendarController } from '@fullcalendar/react'
import adaptivePlugin from '@fullcalendar/adaptive'
import scrollGridPlugin from '@fullcalendar/scrollgrid'
import timelinePlugin from '@fullcalendar/timeline'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'
import resourceDayGridPlugin from '@fullcalendar/resource-daygrid'
import { ChevronDownIcon } from 'lucide-react'
import { cn } from '../../lib/utils.js'
import { EventCalendarView, eventCalendarPlugins, EventCalendarToolbar } from './event-calendar.js'

export interface SchedulerProps extends Omit<CalendarOptions, 'class' | 'className'> {
  className?: string
  availableViews?: string[]
  addButton?: {
    isPrimary?: boolean
    text?: string
    hint?: string
    click?: (ev: MouseEvent) => void
  }
}

const schedulerAvailableViews = [
  'resourceTimelineDay',
  'resourceTimelineWeek',
]

const schedulerOnlyPlugins = [
  adaptivePlugin,
  scrollGridPlugin,
  timelinePlugin,
  resourceTimelinePlugin,
  resourceTimeGridPlugin,
  resourceDayGridPlugin,
]

const mutedFgPressableGroupClass = 'text-muted-foreground group-hover:text-foreground group-focus-visible:text-foreground'

export function Scheduler({
  availableViews = schedulerAvailableViews,
  addButton,
  className,
  height,
  contentHeight,
  direction,
  plugins: userPlugins,
  ...restOptions
}: SchedulerProps) {
  const controller = useCalendarController()
  const borderlessX = restOptions.borderlessX ?? restOptions.borderless
  const borderlessTop = restOptions.borderlessTop ?? restOptions.borderless
  const borderlessBottom = restOptions.borderlessBottom ?? restOptions.borderless

  return (
    <div
      className={cn(
        className,
        'flex flex-col bg-background',
        !borderlessX && !borderlessTop && !borderlessBottom && 'rounded-sm overflow-hidden shadow-xs',
        !borderlessX && 'border-x',
        !borderlessTop && 'border-t',
        !borderlessBottom && 'border-b',
      )}
      style={{ height }}
      dir={direction === 'rtl' ? 'rtl' : undefined}
    >
      <EventCalendarToolbar
        className="border-b p-3"
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
      />
      <div className="grow min-h-0">
        <SchedulerView
          height={height !== undefined ? '100%' : contentHeight}
          initialView={availableViews[0]}
          controller={controller}
          plugins={[
            ...eventCalendarPlugins,
            ...schedulerOnlyPlugins,
            ...(userPlugins || []),
          ]}
          {...restOptions}
        />
      </div>
    </div>
  )
}

export function SchedulerView({
  views: userViews,
  ...restOptions
}: CalendarOptions) {
  return (
    <EventCalendarView

      /* Resource Day Header
      ------------------------------------------------------------------------------------------- */

      resourceDayHeaderClass={(data) => [
        'border',
        data.isMajor ? 'border-foreground/20' : '',
      ]}
      resourceDayHeaderInnerClass={(data) => [
        'p-2 flex flex-col',
        data.isNarrow ? 'text-xs' : 'text-sm',
      ]}

      /* Resource Data Grid
      ------------------------------------------------------------------------------------------- */

      resourceColumnHeaderClass="border justify-center"
      resourceColumnHeaderInnerClass="p-2 text-sm"
      resourceColumnResizerClass="absolute inset-y-0 w-[5px] end-[-3px]"
      resourceGroupHeaderClass="border bg-foreground/5"
      resourceGroupHeaderInnerClass="p-2 text-sm"
      resourceCellClass="border"
      resourceCellInnerClass="p-2 text-sm"
      resourceIndentClass="ms-1 -me-1.5 justify-center"
      resourceExpanderClass={[
        'group p-0.5 rounded-sm',
        'hover:bg-foreground/5',
        'focus-visible:outline-3',
        'outline-ring/50',
      ]}
      resourceExpanderContent={(data) => (
        <ChevronDownIcon
          className={cn(
            `size-4 m-px ${mutedFgPressableGroupClass}`,
            !data.isExpanded && '-rotate-90 [[dir=rtl]_&]:rotate-90'
          )}
        />
      )}
      resourceHeaderRowClass="border"
      resourceRowClass="border"
      resourceColumnDividerClass="border-x ps-0.5 bg-foreground/5"

      /* Timeline Lane
      ------------------------------------------------------------------------------------------- */

      resourceGroupLaneClass="border bg-foreground/5"
      resourceLaneClass="border"
      resourceLaneBottomClass={(data) => data.options.eventOverlap && 'h-2.5'}
      timelineBottomClass="h-2.5"

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

      views={{
        ...userViews,
        timeline: {

          /* Timeline > Row Event
          ----------------------------------------------------------------------------------------- */

          rowEventClass: (data) => data.isEnd && 'me-px',
          rowEventInnerClass: (data) => (
            data.options.eventOverlap
              ? 'py-[0.1875rem]'
              : 'py-2'
          ),

          /* Timeline > More-Link
          ----------------------------------------------------------------------------------------- */

          rowMoreLinkClass: [
            'me-px mb-px rounded-sm border border-transparent print:border-black',
            'bg-[color-mix(in_oklab,var(--foreground)_10%,var(--background))] hover:bg-[color-mix(in_oklab,var(--foreground)_13%,var(--background))] print:bg-white',
          ],
          rowMoreLinkInnerClass: 'px-1 py-[0.1875rem] text-xs',

          /* Timeline > Slot Header
          ----------------------------------------------------------------------------------------- */

          slotHeaderAlign: (data) => data.isTime ? 'start' : 'center',
          slotHeaderClass: 'justify-center',
          slotHeaderInnerClass: (data) => [
            'p-2 text-sm',
            data.hasNavLink && 'hover:underline',
          ],
          slotHeaderDividerClass: 'border-b',

          ...userViews?.timeline,
        },
      }}

      {...restOptions}
    />
  )
}

