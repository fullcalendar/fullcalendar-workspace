import React from 'react'
import { joinClassNames } from '@fullcalendar/core/internal'
import type { CalendarOptions } from '@fullcalendar/core'
import adaptivePlugin from '@fullcalendar/adaptive'
import scrollGridPlugin from '@fullcalendar/scrollgrid'
import timelinePlugin from '@fullcalendar/timeline'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'
import resourceDayGridPlugin from '@fullcalendar/resource-daygrid'
import { EventCalendar, outlineWidthFocusClass, primaryOutlineColorClass, mutedHoverPressableClass, strongSolidPressableClass, mutedFgPressableGroupClass, chevronDown } from './event-calendar.js'

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

      resourceDayHeaderClass={(data) => [
        'border',
        data.isMajor ? 'border-(--fc-forma-strong-border)' : 'border-(--fc-forma-border)',
      ]}
      resourceDayHeaderInnerClass={(data) => [
        'p-2 flex flex-col',
        data.isNarrow ? 'text-xs' : 'text-sm',
      ]}

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
      resourceExpanderClass={[
        'group p-0.5 rounded-sm',
        mutedHoverPressableClass,
        outlineWidthFocusClass,
        primaryOutlineColorClass,
      ]}
      resourceExpanderContent={(data) => chevronDown(
        joinClassNames(
          `size-4 ${mutedFgPressableGroupClass}`,
          !data.isExpanded && '-rotate-90 [[dir=rtl]_&]:rotate-90',
        )
      )}
      resourceHeaderRowClass="border border-(--fc-forma-border)"
      resourceRowClass="border border-(--fc-forma-border)"
      resourceColumnDividerClass="border-x border-(--fc-forma-border) ps-0.5 bg-(--fc-forma-muted)"

      /* Timeline Lane
      ------------------------------------------------------------------------------------------- */

      resourceGroupLaneClass="border border-(--fc-forma-border) bg-(--fc-forma-muted)"
      resourceLaneClass="border border-(--fc-forma-border)"
      resourceLaneBottomClass={(data) => data.options.eventOverlap && 'h-2.5'}
      timelineBottomClass="h-2.5"

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

      views={{
        ...userViews,
        timeline: {

          /* Timeline > Row Event
          --------------------------------------------------------------------------------------- */

          rowEventClass: (data) => data.isEnd && 'me-px',
          rowEventInnerClass: (data) => (
            data.options.eventOverlap
              ? 'py-[0.1875rem]'
              : 'py-2'
          ),

          /* Timeline > More-Link
          --------------------------------------------------------------------------------------- */

          rowMoreLinkClass: [
            'me-px mb-px rounded-sm border border-transparent print:border-black',
            `${strongSolidPressableClass} print:bg-white`,
          ],
          rowMoreLinkInnerClass: 'px-1 py-[0.1875rem] text-xs',

          /* Timeline > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderAlign: (data) => data.isTime ? 'start' : 'center',
          slotHeaderClass: 'justify-center',
          slotHeaderInnerClass: (data) => [
            'p-2 text-sm',
            data.hasNavLink && 'hover:underline',
          ],
          slotHeaderDividerClass: 'border-b border-(--fc-forma-border)',

          ...userViews?.timeline,
        },
      }}

      {...restOptions}
    />
  )
}

