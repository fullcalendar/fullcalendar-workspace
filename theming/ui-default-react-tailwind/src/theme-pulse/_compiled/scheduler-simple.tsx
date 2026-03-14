import React from 'react'
import { joinClassNames, type CalendarOptions } from '@fullcalendar/react'
import { EventCalendar, outlineWidthFocusClass, tertiaryOutlineColorClass, mutedHoverPressableClass, strongSolidPressableClass, mutedFgPressableGroupClass, chevronDown } from './event-calendar'

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
      resourceDayHeaderClass={(data) => joinClassNames(data.isMajor && 'border border-(--fc-pulse-strong-border)')}
      resourceDayHeaderInnerClass={(data) => joinClassNames(
        'p-2 flex flex-row items-center text-(--fc-pulse-muted-foreground)',
        data.isNarrow ? 'text-xs' : 'text-sm',
      )}

      /* Resource Data Grid
      ------------------------------------------------------------------------------------------- */

      resourceColumnHeaderClass="border border-(--fc-pulse-border) justify-center"
      resourceColumnHeaderInnerClass="p-2 text-(--fc-pulse-foreground) text-sm"
      resourceColumnResizerClass="absolute inset-y-0 w-[5px] end-[-3px]"
      resourceGroupHeaderClass="border border-(--fc-pulse-border) bg-(--fc-pulse-muted)"
      resourceGroupHeaderInnerClass="p-2 text-(--fc-pulse-foreground) text-sm"
      resourceCellClass="border border-(--fc-pulse-border)"
      resourceCellInnerClass="p-2 text-(--fc-pulse-foreground) text-sm"
      resourceIndentClass="ms-1 -me-1.5 justify-center"
      resourceExpanderClass={`group p-0.5 rounded-sm ${mutedHoverPressableClass} ${outlineWidthFocusClass} ${tertiaryOutlineColorClass}`}
      resourceExpanderContent={(data) => chevronDown(
        joinClassNames(
          `size-5 ${mutedFgPressableGroupClass}`,
          !data.isExpanded && '-rotate-90 [[dir=rtl]_&]:rotate-90'
        )
      )}
      resourceHeaderRowClass="border border-(--fc-pulse-border)"
      resourceRowClass="border border-(--fc-pulse-border)"
      resourceColumnDividerClass="border-e border-(--fc-pulse-strong-border)"

      /* Timeline Lane
      ------------------------------------------------------------------------------------------- */

      resourceGroupLaneClass="border border-(--fc-pulse-border) bg-(--fc-pulse-muted)"
      resourceLaneClass="border border-(--fc-pulse-border)"
      resourceLaneBottomClass={(data) => joinClassNames(data.options.eventOverlap && 'h-2')}
      timelineBottomClass="h-2"

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

      views={{
        ...userViews,
        timeline: {

          /* Timeline > Row Event
          --------------------------------------------------------------------------------------- */

          rowEventClass: (data) => joinClassNames(data.isEnd && 'me-px'),
          rowEventInnerClass: (data) => data.options.eventOverlap ? 'py-1' : 'py-2',

          /* Timeline > More-Link
          --------------------------------------------------------------------------------------- */

          rowMoreLinkClass: `me-px mb-px border border-transparent print:border-black rounded-sm ${strongSolidPressableClass} print:bg-white`,
          rowMoreLinkInnerClass: 'p-1 text-(--fc-pulse-foreground) text-xs',

          /* Timeline > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderAlign: (data) => data.isTime ? 'start' : 'center',
          slotHeaderClass: (data) => joinClassNames(
            data.level > 0 && 'border border-(--fc-pulse-border)',
            'justify-center',
          ),
          slotHeaderInnerClass: (data) => joinClassNames(
            'p-2 text-sm',
            data.isTime && joinClassNames(
              'relative -start-3',
              data.isFirst && 'hidden',
            ),
            data.hasNavLink && 'hover:underline',
          ),
          slotHeaderDividerClass: 'border-b border-(--fc-pulse-strong-border) shadow-sm',

          ...userViews?.timeline,
        },
      }}

      {...restOptions}
    />
  )
}

