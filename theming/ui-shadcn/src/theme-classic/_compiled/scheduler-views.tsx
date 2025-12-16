import React from 'react'
import { type CalendarOptions } from '@fullcalendar/core'
import type {} from '@fullcalendar/timeline'
import type {} from '@fullcalendar/resource-timeline'
import type {} from '@fullcalendar/resource-daygrid'
import type {} from '@fullcalendar/resource-timegrid'
import { type EventCalendarViewProps, EventCalendarViews, xxsTextClass } from './event-calendar-views.js'
import { cn } from '../../lib/utils.js'

const continuationArrowClass = 'mx-1 border-y-[5px] border-y-transparent opacity-50'

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
        'px-1 py-0.5 flex flex-col',
        data.isNarrow ? xxsTextClass : 'text-sm',
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
      resourceIndentClass='ms-2 -me-1 justify-center'
      resourceExpanderClass="group focus-visible:outline-3 outline-ring/50"
      resourceHeaderRowClass='border'
      resourceRowClass='border'
      resourceColumnDividerClass='border-x ps-0.5 bg-foreground/5'

      /* Timeline Lane
      ------------------------------------------------------------------------------------------- */

      resourceGroupLaneClass='border bg-foreground/5'
      resourceLaneClass='border'
      resourceLaneBottomClass={(data) => cn(data.options.eventOverlap && 'h-3')}
      timelineBottomClass='h-3'

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

      views={{
        ...userViews,
        timeline: {

          /* Timeline > Row Event
          --------------------------------------------------------------------------------------- */

          rowEventClass: (data) => cn(
            data.isEnd && 'me-px',
            'items-center',
          ),
          rowEventBeforeClass: (data) => cn(
            !data.isStartResizable && `${continuationArrowClass} border-e-[5px] border-e-black`
          ),
          rowEventAfterClass: (data) => cn(
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

          rowMoreLinkClass: "me-px mb-px border border-transparent print:border-black bg-[color-mix(in_oklab,var(--foreground)_10%,var(--background))] hover:bg-[color-mix(in_oklab,var(--foreground)_13%,var(--background))] print:bg-white",
          rowMoreLinkInnerClass: 'p-0.5 text-xs',

          /* Timeline > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderAlign: (data) => data.isTime ? 'start' : 'center',
          slotHeaderClass: 'justify-center',
          slotHeaderInnerClass: (data) => cn(
            'p-2 text-sm',
            data.hasNavLink && 'hover:underline',
          ),
          slotHeaderDividerClass: 'border-b',

          /* Timeline > Now-Indicator
          --------------------------------------------------------------------------------------- */

          nowIndicatorHeaderClass: "top-0 -mx-[5px] border-x-[5px] border-x-transparent border-t-[6px] border-destructive",
          nowIndicatorLineClass: 'border-s border-destructive',

          ...userViews?.timeline,
        },
      }}

      {...restOptions}
    />
  )
}

