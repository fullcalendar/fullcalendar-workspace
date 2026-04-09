import React from 'react'
import { joinClassNames, type CalendarOptions } from '@fullcalendar/react'
import { EventCalendar, outlineWidthFocusClass, outlineColorClass, mutedHoverPressableClass, strongSolidPressableClass, secondaryClass, secondaryPressableClass, mutedFgPressableGroupClass, chevronDown } from './event-calendar'

const resourceDayHeaderClasses = {
  dayHeaderInnerClass: 'mb-1',
  dayHeaderDividerClass: 'border-b border-(--fc-monarch-border)',
}

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
      resourceDayHeaderClass={(info) => joinClassNames(
        'border',
        info.isMajor ? 'border-(--fc-monarch-strong-border)' : 'border-(--fc-monarch-border)',
      )}
      resourceDayHeaderInnerClass={(info) => joinClassNames(
        'm-2 flex flex-col',
        info.isNarrow ? 'text-xs' : 'text-sm',
      )}

      /* Resource Data Grid
      ------------------------------------------------------------------------------------------- */

      resourceColumnHeaderClass="border border-(--fc-monarch-border) justify-center"
      resourceColumnHeaderInnerClass="m-2 text-sm"
      resourceColumnResizerClass="absolute inset-y-0 w-[5px] end-[-3px]"
      resourceGroupHeaderClass="border border-(--fc-monarch-border) bg-(--fc-monarch-faint)"
      resourceGroupHeaderInnerClass="m-2 text-sm"
      resourceCellClass="border border-(--fc-monarch-border)"
      resourceCellInnerClass="m-2 text-sm"
      resourceIndentClass="ms-1 -me-1.5 justify-center"
      resourceExpanderClass={`group p-1 rounded-full ${mutedHoverPressableClass} ${outlineWidthFocusClass} ${outlineColorClass}`}
      resourceExpanderContent={(info) => chevronDown(
        joinClassNames(
          `size-4 ${mutedFgPressableGroupClass}`,
          !info.isExpanded && '-rotate-90 [[dir=rtl]_&]:rotate-90'
        ),
      )}
      resourceHeaderRowClass="border border-(--fc-monarch-border)"
      resourceRowClass="border border-(--fc-monarch-border)"
      resourceColumnDividerClass="border-e border-(--fc-monarch-strong-border)"

      /* Timeline Lane
      ------------------------------------------------------------------------------------------- */

      resourceGroupLaneClass="border border-(--fc-monarch-border) bg-(--fc-monarch-faint)"
      resourceLaneClass="border border-(--fc-monarch-border)"
      resourceLaneBottomClass={(info) => joinClassNames(info.options.eventOverlap && 'h-2')}
      timelineBottomClass="h-2"

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

          rowEventClass: (info) => joinClassNames(info.isEnd && 'me-px'),
          rowEventInnerClass: (info) => info.options.eventOverlap ? 'py-1' : 'py-2',

          /* Timeline > More-Link
          --------------------------------------------------------------------------------------- */

          rowMoreLinkClass: `me-px mb-px rounded-sm border border-transparent print:border-black ${strongSolidPressableClass} print:bg-white`,
          rowMoreLinkInnerClass: 'p-1 text-xs',

          /* Timeline > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderSticky: '0.5rem',
          slotHeaderAlign: (info) => (
            (info.level || info.isTime)
              ? 'start'
              : 'center'
          ),
          slotHeaderClass: (info) => joinClassNames(
            'border',
            info.level
              ? 'border-transparent justify-start'
              : joinClassNames(
                  'border-(--fc-monarch-border)',
                  info.isTime
                    ? 'h-2 self-end justify-end'
                    : 'justify-center',
                ),
          ),
          slotHeaderInnerClass: (info) => joinClassNames(
            'text-sm',
            info.level
              ? joinClassNames(
                  'my-0.5 px-2 py-1 rounded-full',
                  info.hasNavLink
                    ? secondaryPressableClass
                    : secondaryClass,
                )
              : joinClassNames(
                  'px-2',
                  info.isTime
                    ? joinClassNames(
                        'pb-3 relative -start-3',
                        info.isFirst && 'hidden',
                      )
                    : 'py-2',
                  info.hasNavLink && 'hover:underline',
                )
          ),
          slotHeaderDividerClass: 'border-b border-(--fc-monarch-border)',

          ...userViews?.timeline,
        },
      }}

      {...restOptions}
    />
  )
}

