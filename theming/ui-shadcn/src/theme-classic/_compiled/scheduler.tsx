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
import { EventCalendarView, eventCalendarPlugins, EventCalendarToolbar, mutedFgPressableGroupClass, xxsTextClass } from './event-calendar.js'

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

const continuationArrowClass = 'mx-1 border-y-[5px] border-y-transparent opacity-50'

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
  const borderlessBottom = restOptions.borderlessBottom ?? restOptions.borderless

  return (
    <div
      className={cn(className, 'flex flex-col gap-5')}
      style={{ height }}
      dir={direction === 'rtl' ? 'rtl' : undefined}
    >
      <EventCalendarToolbar
        className={borderlessX ? 'px-3' : ''}
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
      />
      <div className='grow min-h-0'>
        <SchedulerView
          className={cn(
            'bg-background border-t',
            !borderlessX && !borderlessBottom && 'rounded-sm overflow-hidden',
            !borderlessX && 'border-x',
            !borderlessBottom && 'border-b',
          )}
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
        'px-1 py-0.5 flex flex-col',
        data.isNarrow ? xxsTextClass : 'text-sm',
      ]}

      /* Resource Data Grid
      ------------------------------------------------------------------------------------------- */

      resourceColumnHeaderClass='border justify-center'
      resourceColumnHeaderInnerClass='p-2 text-sm'
      resourceColumnResizerClass='absolute inset-y-0 w-[5px] end-[-3px]'
      resourceGroupHeaderClass='border bg-foreground/5'
      resourceGroupHeaderInnerClass='p-2 text-sm'
      resourceCellClass='border'
      resourceCellInnerClass='p-2 text-sm'
      resourceIndentClass='ms-2 -me-1 justify-center'
      resourceExpanderClass={[
        'group',
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
      resourceColumnDividerClass='border-x ps-0.5 bg-foreground/5'

      /* Timeline Lane
      ------------------------------------------------------------------------------------------- */

      resourceGroupLaneClass='border bg-foreground/5'
      resourceLaneClass='border'
      resourceLaneBottomClass={(data) => data.options.eventOverlap && 'h-3'}
      timelineBottomClass='h-3'

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

      views={{
        ...userViews,
        timeline: {

          /* Timeline > Row Event
          --------------------------------------------------------------------------------------- */

          rowEventClass: (data) => [
            data.isEnd && 'me-px',
            'items-center',
          ],
          rowEventBeforeClass: (data) => (
            !data.isStartResizable && `${continuationArrowClass} border-e-[5px] border-e-black`
          ),
          rowEventAfterClass: (data) => (
            !data.isEndResizable && `${continuationArrowClass} border-s-[5px] border-s-black`
          ),
          rowEventInnerClass: (data) => (
            data.options.eventOverlap
              ? 'py-0.5'
              : 'py-1.5'
          ),
          rowEventTimeClass: 'px-0.5',
          rowEventTitleClass: 'px-0.5',

          /* Timeline > More-Link
          --------------------------------------------------------------------------------------- */

          rowMoreLinkClass: [
            'me-px mb-px border border-transparent print:border-black',
            'bg-[color-mix(in_oklab,var(--foreground)_10%,var(--background))] hover:bg-[color-mix(in_oklab,var(--foreground)_13%,var(--background))] print:bg-white',
          ],
          rowMoreLinkInnerClass: 'p-0.5 text-xs',

          /* Timeline > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderAlign: (data) => data.isTime ? 'start' : 'center',
          slotHeaderClass: 'justify-center',
          slotHeaderInnerClass: (data) => [
            'p-2 text-sm',
            data.hasNavLink && 'hover:underline',
          ],
          slotHeaderDividerClass: 'border-b',

          /* Timeline > Now-Indicator
          --------------------------------------------------------------------------------------- */

          nowIndicatorHeaderClass: [
            'top-0 -mx-[5px]',
            'border-x-[5px] border-x-transparent',
            'border-t-[6px] border-destructive',
          ],
          nowIndicatorLineClass: 'border-s border-destructive',

          ...userViews?.timeline,
        },
      }}

      {...restOptions}
    />
  )
}

