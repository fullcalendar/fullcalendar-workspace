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

      resourceDayHeaderClass={(info) => joinClassNames(
        'border',
        info.isMajor ? 'border-(--fc-forma-strong-border)' : 'border-(--fc-forma-border)',
      )}
      resourceDayHeaderInnerClass={(info) => joinClassNames(
        'p-2 flex flex-col',
        info.isNarrow ? 'text-xs' : 'text-sm',
      )}

      /* Resource Data Grid
      ------------------------------------------------------------------------------------------- */

      resourceColumnHeaderClass="border border-(--fc-forma-border) justify-center"
      resourceColumnHeaderInnerClass="p-2 text-sm"
      resourceColumnResizerClass="absolute inset-y-0 w-[5px] end-[-3px]"
      resourceGroupHeaderClass="border border-(--fc-forma-border) bg-(--fc-forma-muted)"
      resourceGroupHeaderInnerClass="p-2 text-sm"
      resourceCellClass="border border-(--fc-forma-border)"
      resourceCellInnerClass="p-2 text-sm"
      resourceIndentClass="ms-1 -me-1.5 justify-center"
      resourceExpanderClass={`group p-0.5 rounded-sm ${mutedHoverPressableClass} ${outlineWidthFocusClass} ${primaryOutlineColorClass}`}
      resourceExpanderContent={(info) => chevronDown(
        joinClassNames(
          `size-4 ${mutedFgPressableGroupClass}`,
          !info.isExpanded && '-rotate-90 [[dir=rtl]_&]:rotate-90',
        )
      )}
      resourceHeaderRowClass="border border-(--fc-forma-border)"
      resourceRowClass="border border-(--fc-forma-border)"
      resourceColumnDividerClass="border-x border-(--fc-forma-border) ps-0.5 bg-(--fc-forma-muted)"

      /* Timeline Lane
      ------------------------------------------------------------------------------------------- */

      resourceGroupLaneClass="border border-(--fc-forma-border) bg-(--fc-forma-muted)"
      resourceLaneClass="border border-(--fc-forma-border)"
      resourceLaneBottomClass={(info) => joinClassNames(info.options.eventOverlap && 'h-2.5')}
      timelineBottomClass="h-2.5"

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

      views={{
        ...userViews,
        timeline: {

          /* Timeline > Row Event
          --------------------------------------------------------------------------------------- */

          rowEventClass: (info) => joinClassNames(info.isEnd && 'me-px'),
          rowEventInnerClass: (info) => (
            info.options.eventOverlap
              ? 'py-[0.1875rem]'
              : 'py-2'
          ),

          /* Timeline > More-Link
          --------------------------------------------------------------------------------------- */

          rowMoreLinkClass: `me-px mb-px rounded-sm border border-transparent print:border-black ${strongSolidPressableClass} print:bg-white`,
          rowMoreLinkInnerClass: 'px-1 py-[0.1875rem] text-xs',

          /* Timeline > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderAlign: (info) => info.isTime ? 'start' : 'center',
          slotHeaderClass: 'justify-center',
          slotHeaderInnerClass: (info) => joinClassNames(
            'p-2 text-sm',
            info.hasNavLink && 'hover:underline',
          ),
          slotHeaderDividerClass: 'border-b border-(--fc-forma-border)',

          ...userViews?.timeline,
        },
      }}

      {...restOptions}
    />
  )
}

