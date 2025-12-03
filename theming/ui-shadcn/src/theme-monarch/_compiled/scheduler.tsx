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
import { EventCalendarView, eventCalendarPlugins, EventCalendarToolbar, mutedFgPressableGroupClass } from './event-calendar.js'

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

const resourceDayHeaderClasses = {
  dayHeaderInnerClass: 'mb-1',
  dayHeaderDividerClass: 'border-b',
}

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
        'flex flex-col',
        'bg-background',
        !borderlessX && !borderlessTop && !borderlessBottom && 'rounded-lg overflow-hidden',
        !borderlessX && 'border-x',
        !borderlessTop && 'border-t',
        !borderlessBottom && 'border-b',
      )}
      style={{ height }}
      dir={direction === 'rtl' ? 'rtl' : undefined}
    >
      <EventCalendarToolbar
        className='p-4'
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
      />
      <div className='grow min-h-0'>
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

      resourceDayHeaderAlign='center'
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

      resourceColumnHeaderClass='border justify-center'
      resourceColumnHeaderInnerClass='p-2 text-sm'
      resourceColumnResizerClass='absolute inset-y-0 w-[5px] end-[-3px]'
      resourceGroupHeaderClass='border bg-foreground/3'
      resourceGroupHeaderInnerClass='p-2 text-sm'
      resourceCellClass='border'
      resourceCellInnerClass='p-2 text-sm'
      resourceIndentClass='ms-1 -me-1.5 justify-center'
      resourceExpanderClass={[
        'group p-1 rounded-full',
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
      resourceHeaderRowClass='border'
      resourceRowClass='border'
      resourceColumnDividerClass='border-e border-foreground/20'

      /* Timeline Lane
      ------------------------------------------------------------------------------------------- */

      resourceGroupLaneClass='border bg-foreground/3'
      resourceLaneClass='border'
      resourceLaneBottomClass={(data) => data.options.eventOverlap && 'h-2'}
      timelineBottomClass='h-2'

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

      views={{
        ...userViews,
        resourceTimeGrid: {
          ...resourceDayHeaderClasses,
          ...userViews?.resourceTimeGrid,
        },
        resourceDayGrid: {
          ...resourceDayHeaderClasses,
          ...userViews?.resourceDayGrid,
        },
        timeline: {

          /* Timeline > Row Event
          --------------------------------------------------------------------------------------- */

          rowEventClass: (data) => data.isEnd && 'me-px',
          rowEventInnerClass: (data) => data.options.eventOverlap ? 'py-1' : 'py-2',

          /* Timeline > More-Link
          --------------------------------------------------------------------------------------- */

          rowMoreLinkClass: [
            'me-px mb-px rounded-sm',
            'border border-transparent print:border-black',
            'bg-[color-mix(in_oklab,var(--foreground)_10%,var(--background))] hover:bg-[color-mix(in_oklab,var(--foreground)_13%,var(--background))] print:bg-white',
          ],
          rowMoreLinkInnerClass: 'p-1 text-xs',

          /* Timeline > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderSticky: '0.5rem',
          slotHeaderAlign: (data) => (
            (data.level || data.isTime)
              ? 'start'
              : 'center'
          ),
          slotHeaderClass: (data) => [
            'border',
            data.level
              ? 'border-transparent justify-start'
              : cn(
                  '',
                  data.isTime
                    ? 'h-2 self-end justify-end'
                    : 'justify-center',
                ),
          ],
          slotHeaderInnerClass: (data) => [
            'text-sm',
            data.level
              ? cn(
                  'my-0.5 px-2 py-1 rounded-full',
                  data.hasNavLink
                    ? 'bg-foreground/10 hover:bg-foreground/20 focus-visible:outline-3 outline-ring/50'
                    : 'bg-foreground/10',
                )
              : cn(
                  'px-2',
                  data.isTime
                    ? cn(
                        'pb-3 relative -start-3',
                        data.isFirst && 'hidden',
                      )
                    : 'py-2',
                  data.hasNavLink && 'hover:underline',
                ),
          ],
          slotHeaderDividerClass: 'border-b',

          ...userViews?.timeline,
        },
      }}

      {...restOptions}
    />
  )
}

