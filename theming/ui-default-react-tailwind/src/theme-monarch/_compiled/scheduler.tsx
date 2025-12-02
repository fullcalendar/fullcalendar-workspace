import React from 'react'
import { joinClassNames } from '@fullcalendar/core/internal'
import type { CalendarOptions } from '@fullcalendar/core'
import adaptivePlugin from '@fullcalendar/adaptive'
import scrollGridPlugin from '@fullcalendar/scrollgrid'
import timelinePlugin from '@fullcalendar/timeline'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'
import resourceDayGridPlugin from '@fullcalendar/resource-daygrid'
import { EventCalendar, outlineWidthFocusClass, outlineColorClass, mutedHoverPressableClass, strongSolidPressableClass, secondaryClass, secondaryPressableClass, mutedFgPressableGroupClass, chevronDown } from './event-calendar.js'

export interface SchedulerProps extends CalendarOptions {
  availableViews?: string[]
  addButton?: {
    isPrimary?: boolean
    text?: string
    hint?: string
    click?: (ev: MouseEvent) => void
  }
}

const schedulerOnlyPlugins = [
  adaptivePlugin,
  scrollGridPlugin,
  timelinePlugin,
  resourceTimelinePlugin,
  resourceTimeGridPlugin,
  resourceDayGridPlugin,
]

const schedulerAvailableViews = [
  'resourceTimelineDay',
  'resourceTimelineWeek',
]

const resourceDayHeaderClasses = {
  dayHeaderInnerClass: 'mb-1',
  dayHeaderDividerClass: 'border-b border-(--fc-monarch-border)',
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

      resourceDayHeaderAlign="center"
      resourceDayHeaderClass={(data) => [
        'border',
        data.isMajor ? 'border-(--fc-monarch-strong-border)' : 'border-(--fc-monarch-border)',
      ]}
      resourceDayHeaderInnerClass={(data) => [
        'p-2 flex flex-col',
        data.isNarrow ? 'text-xs' : 'text-sm',
      ]}

      /* Resource Data Grid
      ------------------------------------------------------------------------------------------- */

      resourceColumnHeaderClass="border border-(--fc-monarch-border) justify-center"
      resourceColumnHeaderInnerClass="p-2 text-sm"
      resourceColumnResizerClass="absolute inset-y-0 w-[5px] end-[-3px]"
      resourceGroupHeaderClass="border border-(--fc-monarch-border) bg-(--fc-monarch-faint)"
      resourceGroupHeaderInnerClass="p-2 text-sm"
      resourceCellClass="border border-(--fc-monarch-border)"
      resourceCellInnerClass="p-2 text-sm"
      resourceIndentClass="ms-1 -me-1.5 justify-center"
      resourceExpanderClass={[
        'group p-1 rounded-full',
        mutedHoverPressableClass,
        outlineWidthFocusClass,
        outlineColorClass,
      ]}
      resourceExpanderContent={(data) => chevronDown(
        joinClassNames(
          `size-4 ${mutedFgPressableGroupClass}`,
          !data.isExpanded && '-rotate-90 [[dir=rtl]_&]:rotate-90'
        ),
      )}
      resourceHeaderRowClass="border border-(--fc-monarch-border)"
      resourceRowClass="border border-(--fc-monarch-border)"
      resourceColumnDividerClass="border-e border-(--fc-monarch-strong-border)"

      /* Timeline Lane
      ------------------------------------------------------------------------------------------- */

      resourceGroupLaneClass="border border-(--fc-monarch-border) bg-(--fc-monarch-faint)"
      resourceLaneClass="border border-(--fc-monarch-border)"
      resourceLaneBottomClass={(data) => data.options.eventOverlap && 'h-2'}
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

          rowEventClass: (data) => data.isEnd && 'me-px',
          rowEventInnerClass: (data) => data.options.eventOverlap ? 'py-1' : 'py-2',

          /* Timeline > More-Link
          --------------------------------------------------------------------------------------- */

          rowMoreLinkClass: [
            'me-px mb-px rounded-sm',
            'border border-transparent print:border-black',
            `${strongSolidPressableClass} print:bg-white`,
          ],
          rowMoreLinkInnerClass: 'p-1 text-xs',

          /* Timeline > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderSticky: '0.5rem',
          slotHeaderAlign: (data) => (
            (data.level || data.isTime)
              ? 'start'
              : 'center'
          ),
          slotHeaderClass: (data) => [
            'border',
            data.level
              ? 'border-transparent justify-start'
              : joinClassNames(
                  'border-(--fc-monarch-border)',
                  data.isTime
                    ? 'h-2 self-end justify-end'
                    : 'justify-center',
                ),
          ],
          slotHeaderInnerClass: (data) => [
            'text-sm',
            data.level
              ? joinClassNames(
                  'my-0.5 px-2 py-1 rounded-full',
                  data.hasNavLink
                    ? secondaryPressableClass
                    : secondaryClass,
                )
              : joinClassNames(
                  'px-2',
                  data.isTime
                    ? joinClassNames(
                        'pb-3 relative -start-3',
                        data.isFirst && 'hidden',
                      )
                    : 'py-2',
                  data.hasNavLink && 'hover:underline',
                )
          ],
          slotHeaderDividerClass: 'border-b border-(--fc-monarch-border)',

          ...userViews?.timeline,
        },
      }}

      {...restOptions}
    />
  )
}

