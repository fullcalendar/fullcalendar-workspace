import React from 'react'
import { joinClassNames, type CalendarOptions } from '@fullcalendar/react'
import { EventCalendar, outlineWidthFocusClass, primaryOutlineColorClass, mutedHoverPressableClass, strongSolidPressableClass, mutedFgPressableGroupClass, chevronDown } from './event-calendar'

export interface SchedulerProps extends CalendarOptions {
  availableViews: string[]
  addButton?: {
    isPrimary?: boolean
    text?: string
    hint?: string
    click?: (ev: MouseEvent) => void
  }
}

export function Scheduler({
  availableViews,
  addButton,
  views: userViews,
  ...restOptions
}: SchedulerProps) {
  return (
    <EventCalendar
      availableViews={availableViews}
      addButton={addButton}

      /* Resource Day Header
      ------------------------------------------------------------------------------------------- */

      resourceDayHeaderAlign="center"
      resourceDayHeaderClass="border"
      resourceDayHeaderInnerClass={(info) => joinClassNames(
        'm-2 text-(--fc-breezy-foreground) font-semibold',
        info.isNarrow ? 'text-xs' : 'text-sm',
      )}

      /* Resource Data Grid
      ------------------------------------------------------------------------------------------- */

      resourceColumnHeaderClass="border border-(--fc-breezy-muted-border) justify-center"
      resourceColumnHeaderInnerClass="m-2 text-(--fc-breezy-foreground) text-sm"
      resourceColumnResizerClass="absolute inset-y-0 w-[5px] end-[-3px]"
      resourceGroupHeaderClass="border border-(--fc-breezy-border) bg-(--fc-breezy-muted)"
      resourceGroupHeaderInnerClass="m-2 text-(--fc-breezy-foreground) text-sm"
      resourceCellClass="border border-(--fc-breezy-muted-border)"
      resourceCellInnerClass="m-2 text-(--fc-breezy-foreground) text-sm"
      resourceIndentClass="ms-1 -me-1.5 justify-center"
      resourceExpanderClass={`group p-0.5 rounded-full ${mutedHoverPressableClass} ${outlineWidthFocusClass} ${primaryOutlineColorClass}`}
      resourceExpanderContent={(info) => chevronDown(
        joinClassNames(
          `size-5 ${mutedFgPressableGroupClass}`,
          !info.isExpanded && '-rotate-90 [[dir=rtl]_&]:rotate-90',
        )
      )}
      resourceHeaderRowClass="border border-(--fc-breezy-border)"
      resourceRowClass="border border-(--fc-breezy-border)"
      resourceColumnDividerClass="border-e border-(--fc-breezy-strong-border)"

      /* Timeline Lane
      ------------------------------------------------------------------------------------------- */

      resourceGroupLaneClass="border border-(--fc-breezy-border) bg-(--fc-breezy-muted)"
      resourceLaneClass="border border-(--fc-breezy-border)"
      resourceLaneBottomClass={(info) => joinClassNames(info.options.eventOverlap && 'h-2')}
      timelineBottomClass="h-2"

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

      views={{
        ...userViews,
        resourceDayGrid: {
          resourceDayHeaderClass: (info) => (
            info.isMajor
              ? 'border-(--fc-breezy-strong-border)'
              : 'border-(--fc-breezy-border)'
          ),
          ...userViews?.resourceDayGrid,
        },
        resourceTimeGrid: {
          resourceDayHeaderClass: (info) => (
            info.isMajor
              ? 'border-(--fc-breezy-strong-border)'
              : 'border-(--fc-breezy-muted-border)'
          ),
          ...userViews?.resourceTimeGrid,
        },
        timeline: {

          /* Timeline > Row Event
          --------------------------------------------------------------------------------------- */

          rowEventClass: (info) => joinClassNames(info.isEnd && 'me-px'),
          rowEventInnerClass: (info) => info.options.eventOverlap ? 'py-1' : 'py-2',

          /* Timeline > More-Link
          --------------------------------------------------------------------------------------- */

          rowMoreLinkClass: `me-px mb-px border border-transparent print:border-black rounded-md ${strongSolidPressableClass} print:bg-white`,
          rowMoreLinkInnerClass: 'p-1 text-(--fc-breezy-foreground) text-xs',

          /* Timeline > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderAlign: (info) => info.isTime ? 'start' : 'center',
          slotHeaderClass: (info) => joinClassNames(
            info.level > 0 && 'border border-(--fc-breezy-muted-border)',
            'justify-end',
          ),
          slotHeaderInnerClass: (info) => joinClassNames(
            'mx-3 my-2 text-xs',
            info.isTime && joinClassNames(
              'relative -start-4',
              info.isFirst && 'hidden',
            ),
            info.hasNavLink && 'hover:underline',
          ),
          slotHeaderDividerClass: 'border-b border-(--fc-breezy-strong-border) shadow-sm',

          ...userViews?.timeline,
        },
      }}

      {...restOptions}
    />
  )
}
