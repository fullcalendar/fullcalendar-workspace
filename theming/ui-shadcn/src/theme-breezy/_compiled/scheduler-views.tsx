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

      resourceDayHeaderAlign="center"
      resourceDayHeaderClass="border"
      resourceDayHeaderInnerClass={(info) => cn(
        'p-2 font-semibold',
        info.isNarrow ? 'text-xs' : 'text-sm',
      )}

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
      resourceExpanderClass="group p-0.5 rounded-full hover:bg-foreground/5 focus-visible:outline-3 outline-ring/50"

      resourceHeaderRowClass="border"
      resourceRowClass="border"
      resourceColumnDividerClass="border-e border-foreground/20"

      /* Timeline Lane
      ------------------------------------------------------------------------------------------- */

      resourceGroupLaneClass="border bg-foreground/5"
      resourceLaneClass="border"
      resourceLaneBottomClass={(info) => cn(info.options.eventOverlap && 'h-2')}
      timelineBottomClass="h-2"

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

      views={{
        ...userViews,
        resourceDayGrid: {
          resourceDayHeaderClass: (info) => cn(
            info.isMajor && 'border-foreground/20'
          ),
          ...userViews?.resourceDayGrid,
        },
        resourceTimeGrid: {
          resourceDayHeaderClass: (info) => cn(
            info.isMajor && 'border-foreground/20'
          ),
          ...userViews?.resourceTimeGrid,
        },
        timeline: {

          /* Timeline > Row Event
          --------------------------------------------------------------------------------------- */

          rowEventClass: (info) => cn(info.isEnd && 'me-px'),
          rowEventInnerClass: (info) => info.options.eventOverlap ? 'py-1' : 'py-2',

          /* Timeline > More-Link
          --------------------------------------------------------------------------------------- */

          rowMoreLinkClass: 'me-px mb-px border border-transparent print:border-black rounded-md bg-[color-mix(in_oklab,var(--foreground)_10%,var(--background))] hover:bg-[color-mix(in_oklab,var(--foreground)_13%,var(--background))] print:bg-white',
          rowMoreLinkInnerClass: 'p-1 text-xs',

          /* Timeline > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderAlign: (info) => info.isTime ? 'start' : 'center',
          slotHeaderClass: (info) => cn(
            info.level > 0 && 'border',
            'justify-end',
          ),
          slotHeaderInnerClass: (info) => cn(
            'px-3 py-2 text-xs',
            info.isTime && [
              'relative -start-4',
              info.isFirst && 'hidden',
            ],
            info.hasNavLink && 'hover:underline',
          ),
          slotHeaderDividerClass: 'border-b border-foreground/20 shadow-sm',

          ...userViews?.timeline,
        },
      }}

      {...restOptions}
    />
  )
}

