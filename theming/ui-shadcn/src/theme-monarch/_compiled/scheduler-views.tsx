import React from 'react'
import { type CalendarOptions } from '@fullcalendar/core'
import type {} from '@fullcalendar/timeline'
import type {} from '@fullcalendar/resource-timeline'
import type {} from '@fullcalendar/resource-daygrid'
import type {} from '@fullcalendar/resource-timegrid'
import { EventCalendarViewProps, EventCalendarViews } from './event-calendar-views.js'
import { cn } from '../../lib/utils.js'

const resourceDayHeaderClasses = {
  dayHeaderInnerClass: 'mb-1',
  dayHeaderDividerClass: 'border-b',
}

export type SchedulerViewsProps =
  EventCalendarViewProps &
  Required<Pick<CalendarOptions, 'resourceExpanderContent'>> // ensure callers define icons

export function SchedulerViews({
  views: userViews,
  ...restOptions
}: SchedulerViewsProps) {
  return (
    <EventCalendarViews

      /* Resource Day Header
      ------------------------------------------------------------------------------------------- */

      resourceDayHeaderAlign='center'
      resourceDayHeaderClass={(data) => cn(
        'border',
        data.isMajor && 'border-foreground/20',
      )}
      resourceDayHeaderInnerClass={(data) => cn(
        'p-2 flex flex-col',
        data.isNarrow ? 'text-xs' : 'text-sm',
      )}

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
      resourceExpanderClass="group p-1 rounded-full hover:bg-foreground/5 focus-visible:outline-3 outline-ring/50"
      resourceHeaderRowClass='border'
      resourceRowClass='border'
      resourceColumnDividerClass='border-e border-foreground/20'

      /* Timeline Lane
      ------------------------------------------------------------------------------------------- */

      resourceGroupLaneClass='border bg-foreground/3'
      resourceLaneClass='border'
      resourceLaneBottomClass={(data) => cn(data.options.eventOverlap && 'h-2')}
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

          rowEventClass: (data) => cn(data.isEnd && 'me-px'),
          rowEventInnerClass: (data) => data.options.eventOverlap ? 'py-1' : 'py-2',

          /* Timeline > More-Link
          --------------------------------------------------------------------------------------- */

          rowMoreLinkClass: "me-px mb-px rounded-sm border border-transparent print:border-black bg-[color-mix(in_oklab,var(--foreground)_10%,var(--background))] hover:bg-[color-mix(in_oklab,var(--foreground)_13%,var(--background))] print:bg-white",
          rowMoreLinkInnerClass: 'p-1 text-xs',

          /* Timeline > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderSticky: '0.5rem',
          slotHeaderAlign: (data) => (
            (data.level || data.isTime)
              ? 'start'
              : 'center'
          ),
          slotHeaderClass: (data) => cn(
            'border',
            data.level
              ? 'border-transparent justify-start'
              : (data.isTime ? 'h-2 self-end justify-end' : 'justify-center'),
          ),
          slotHeaderInnerClass: (data) => cn(
            'text-sm',
            data.level
              ? [
                  'my-0.5 px-2 py-1 rounded-full bg-foreground/10',
                  data.hasNavLink && 'hover:bg-foreground/20 focus-visible:outline-3 outline-ring/50',
                ]
              : [
                  'px-2',
                  data.isTime
                    ? [
                        'pb-3 relative -start-3',
                        data.isFirst && 'hidden',
                      ]
                    : 'py-2',
                  data.hasNavLink && 'hover:underline',
                ],
          ),
          slotHeaderDividerClass: 'border-b',

          ...userViews?.timeline,
        },
      }}

      {...restOptions}
    />
  )
}

