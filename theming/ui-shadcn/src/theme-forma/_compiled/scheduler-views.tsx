import React from 'react'
import { type CalendarOptions } from '@fullcalendar/react'
import { type EventCalendarViewProps, EventCalendarViews } from './event-calendar-views'
import { cn } from '../../lib/utils'

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

      resourceDayHeaderClass={(info) => cn(
        'border',
        info.isMajor && 'border-foreground/20',
      )}
      resourceDayHeaderInnerClass={(info) => cn(
        'm-2 flex flex-col',
        info.isNarrow ? 'text-xs' : 'text-sm',
      )}

      /* Resource Data Grid
      ------------------------------------------------------------------------------------------- */

      resourceColumnHeaderClass="border justify-center"
      resourceColumnHeaderInnerClass="m-2 text-sm"
      resourceColumnResizerClass="absolute inset-y-0 w-[5px] end-[-3px]"
      resourceGroupHeaderClass="border bg-foreground/5"
      resourceGroupHeaderInnerClass="m-2 text-sm"
      resourceCellClass="border"
      resourceCellInnerClass="m-2 text-sm"
      resourceIndentClass="ms-1 -me-1.5 justify-center"
      resourceExpanderClass="group p-0.5 rounded-sm hover:bg-foreground/5 focus-visible:outline-3 outline-ring/50"
      resourceHeaderRowClass="border"
      resourceRowClass="border"
      resourceColumnDividerClass="border-x ps-0.5 bg-foreground/5"

      /* Timeline Lane
      ------------------------------------------------------------------------------------------- */

      resourceGroupLaneClass="border bg-foreground/5"
      resourceLaneClass="border"
      resourceLaneBottomClass={(info) => cn(info.options.eventOverlap && 'h-2.5')}
      timelineBottomClass="h-2.5"

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

      views={{
        ...userViews,
        timeline: {

          /* Timeline > Row Event
          ----------------------------------------------------------------------------------------- */

          rowEventClass: (info) => cn(info.isEnd && 'me-px'),
          rowEventInnerClass: (info) => (
            info.options.eventOverlap
              ? 'py-[0.1875rem]'
              : 'py-2'
          ),

          /* Timeline > More-Link
          ----------------------------------------------------------------------------------------- */

          rowMoreLinkClass: "me-px mb-px rounded-sm border border-transparent print:border-black bg-[color-mix(in_oklab,var(--foreground)_10%,var(--background))] hover:bg-[color-mix(in_oklab,var(--foreground)_13%,var(--background))] print:bg-white",
          rowMoreLinkInnerClass: 'px-1 py-[0.1875rem] text-xs',

          /* Timeline > Slot Header
          ----------------------------------------------------------------------------------------- */

          slotHeaderAlign: (info) => info.isTime ? 'start' : 'center',
          slotHeaderClass: 'justify-center',
          slotHeaderInnerClass: (info) => cn(
            'm-2 text-sm',
            info.hasNavLink && 'hover:underline',
          ),
          slotHeaderDividerClass: 'border-b',

          ...userViews?.timeline,
        },
      }}

      {...restOptions}
    />
  )
}

