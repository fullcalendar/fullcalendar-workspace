import React from 'react'
import { CalendarOptions, joinClassNames } from '@fullcalendar/core'
import adaptivePlugin from '@fullcalendar/adaptive'
import scrollGridPlugin from '@fullcalendar/scrollgrid'
import timelinePlugin from '@fullcalendar/timeline'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'
import resourceDayGridPlugin from '@fullcalendar/resource-daygrid'
import { EventCalendar, mutedFgPressableGroupClass } from './event-calendar.js'
import { ChevronDownIcon } from 'lucide-react'

export const schedulerOnlyPlugins = [
  adaptivePlugin,
  scrollGridPlugin,
  timelinePlugin,
  resourceTimelinePlugin,
  resourceTimeGridPlugin,
  resourceDayGridPlugin,
]

export const schedulerAvailableViews = [
  'resourceTimelineDay',
  'resourceTimelineWeek',
]

export interface SchedulerProps extends CalendarOptions {
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
  plugins: userPlugins,
  views: userViews,
  ...restOptions
}: SchedulerProps) {
  return (
    <EventCalendar
      availableViews={availableViews}
      addButton={addButton}
      plugins={[
        ...schedulerOnlyPlugins,
        ...(userPlugins || []),
      ]}

      /* Resource Day Header
      ------------------------------------------------------------------------------------------- */

      resourceDayHeaderAlign='center'
      resourceDayHeaderClass='border'
      resourceDayHeaderInnerClass={(data) => [
        'p-2',
        'font-semibold',
        data.isNarrow ? 'text-xs' : 'text-sm',
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
      resourceIndentClass='ms-1 -me-1.5 justify-center'
      resourceExpanderClass={[
        'group p-0.5 rounded-full',
        'hover:bg-foreground/5 focus-visible:bg-foreground/5',
        'focus-visible:outline-3',
        'outline-ring/50',
      ]}
      resourceExpanderContent={(data) => (
        <ChevronDownIcon
          className={joinClassNames(
            `size-4 ${mutedFgPressableGroupClass}`,
            !data.isExpanded && '-rotate-90 [[dir=rtl]_&]:rotate-90'
          )}
        />
      )}
      resourceHeaderRowClass='border'
      resourceRowClass='border'
      resourceColumnDividerClass='border-e border-foreground/20'

      /* Timeline Lane
      ------------------------------------------------------------------------------------------- */

      resourceGroupLaneClass='border bg-foreground/5'
      resourceLaneClass='border'
      resourceLaneBottomClass={(data) => data.options.eventOverlap && 'h-2'}
      timelineBottomClass='h-2'

      /* View-Specific
      ------------------------------------------------------------------------------------------- */

      views={{
        ...userViews,
        resourceDayGrid: {
          resourceDayHeaderClass: (data) => (
            data.isMajor && 'border-foreground/20'
          ),
          ...userViews?.resourceDayGrid,
        },
        resourceTimeGrid: {
          resourceDayHeaderClass: (data) => (
            data.isMajor && 'border-foreground/20'
          ),
          ...userViews?.resourceTimeGrid,
        },
        timeline: {

          /* Timeline > Row Event
          --------------------------------------------------------------------------------------- */

          rowEventClass: (data) => data.isEnd && 'me-px',
          rowEventInnerClass: (data) => data.options.eventOverlap ? 'py-1' : 'py-2',

          /* Timeline > More-Link
          --------------------------------------------------------------------------------------- */

          rowMoreLinkClass: [
            'me-px mb-px border border-transparent print:border-black rounded-md',
            'bg-[color-mix(in_oklab,var(--foreground)_10%,var(--background))] hover:bg-[color-mix(in_oklab,var(--foreground)_13%,var(--background))] print:bg-white',
          ],
          rowMoreLinkInnerClass: 'p-1 text-xs',

          /* Timeline > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderAlign: (data) => data.isTime ? 'start' : 'center',
          slotHeaderClass: (data) => [
            data.level > 0 && 'border',
            'justify-end',
          ],
          slotHeaderInnerClass: (data) => [
            'px-3 py-2 text-xs',
            data.isTime && joinClassNames(
              'relative -start-4',
              data.isFirst && 'hidden',
            ),
            data.hasNavLink && 'hover:underline',
          ],
          slotHeaderDividerClass: 'border-b border-foreground/20 shadow-sm',
          ...userViews?.timeline,
        },
      }}
      {...restOptions}
    />
  )
}

