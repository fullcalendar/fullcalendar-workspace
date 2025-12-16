import React from 'react'
import { type CalendarOptions } from '@fullcalendar/core'
import type {} from '@fullcalendar/timeline'
import type {} from '@fullcalendar/resource-timeline'
import type {} from '@fullcalendar/resource-daygrid'
import type {} from '@fullcalendar/resource-timegrid'
import { type EventCalendarViewProps, EventCalendarViews } from './event-calendar-views.js'
import { cn } from '../../lib/utils.js'

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
      resourceDayHeaderClass={(data) => cn(data.isMajor && 'border border-foreground/20')}
      resourceDayHeaderInnerClass={(data) => cn(
        'p-2 flex flex-row items-center text-muted-foreground',
        data.isNarrow ? 'text-xs' : 'text-sm',
      )}

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
      resourceExpanderClass="group p-0.5 rounded-sm hover:bg-foreground/5 focus-visible:outline-3 outline-ring/50"
      resourceHeaderRowClass='border'
      resourceRowClass='border'
      resourceColumnDividerClass='border-e border-foreground/20'

      /* Timeline Lane
      ------------------------------------------------------------------------------------------- */

      resourceGroupLaneClass='border bg-foreground/5'
      resourceLaneClass='border'
      resourceLaneBottomClass={(data) => cn(data.options.eventOverlap && 'h-2')}
      timelineBottomClass='h-2'

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

      views={{
        ...userViews,
        timeline: {

          /* Timeline > Row Event
          --------------------------------------------------------------------------------------- */

          rowEventClass: (data) => cn(data.isEnd && 'me-px'),
          rowEventInnerClass: (data) => data.options.eventOverlap ? 'py-1' : 'py-2',

          /* Timeline > More-Link
          --------------------------------------------------------------------------------------- */

          rowMoreLinkClass: "me-px mb-px border border-transparent print:border-black rounded-sm bg-[color-mix(in_oklab,var(--foreground)_10%,var(--background))] hover:bg-[color-mix(in_oklab,var(--foreground)_13%,var(--background))] print:bg-white",
          rowMoreLinkInnerClass: 'p-1 text-xs',

          /* Timeline > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderAlign: (data) => data.isTime ? 'start' : 'center',
          slotHeaderClass: (data) => cn(
            data.level > 0 && 'border',
            'justify-center',
          ),
          slotHeaderInnerClass: (data) => cn(
            'p-2 text-sm',
            data.isTime && [
              'relative -start-3',
              data.isFirst && 'hidden',
            ],
            data.hasNavLink && 'hover:underline',
          ),
          slotHeaderDividerClass: 'border-b border-foreground/20 shadow-sm',

          ...userViews?.timeline,
        },
      }}

      {...restOptions}
    />
  )
}

