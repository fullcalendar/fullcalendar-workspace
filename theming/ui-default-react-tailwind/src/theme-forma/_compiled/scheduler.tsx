import React from 'react'
import { joinClassNames, type CalendarOptions } from '@fullcalendar/react'
import adaptivePlugin from '@fullcalendar/react-scheduler/adaptive'
import scrollGridPlugin from '@fullcalendar/react-scheduler/scrollgrid'
import timelinePlugin from '@fullcalendar/react-scheduler/timeline'
import resourceTimelinePlugin from '@fullcalendar/react-scheduler/resource-timeline'
import resourceTimeGridPlugin from '@fullcalendar/react-scheduler/resource-timegrid'
import resourceDayGridPlugin from '@fullcalendar/react-scheduler/resource-daygrid'
import { EventCalendar, outlineWidthFocusClass, primaryOutlineColorClass, mutedHoverPressableClass, strongSolidPressableClass, mutedFgPressableGroupClass, chevronDown } from './event-calendar'

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

export interface SchedulerProps extends CalendarOptions {
  availableViews?: string[]
  addButton?: {
    isPrimary?: boolean
    text?: string
    hint?: string
    click?: (ev: MouseEvent) => void
  }
}

export function Scheduler({
  availableViews = schedulerAvailableViews,
  addButton,
  plugins: userPlugins = [],
  views: userViews,
  ...restOptions
}: SchedulerProps) {
  return (
    <EventCalendar
      availableViews={availableViews}
      addButton={addButton}
      plugins={[...schedulerOnlyPlugins, ...userPlugins]}

      /* Resource Day Header
      ------------------------------------------------------------------------------------------- */

      resourceDayHeaderClass={(info) => joinClassNames(
        'border',
        info.isMajor ? 'border-(--fc-forma-strong-border)' : 'border-(--fc-forma-border)',
      )}
      resourceDayHeaderInnerClass={(info) => joinClassNames(
        'm-2 flex flex-col',
        info.isNarrow ? 'text-xs' : 'text-sm',
      )}

      /* Resource Data Grid
      ------------------------------------------------------------------------------------------- */

      resourceColumnHeaderClass="border border-(--fc-forma-border) justify-center"
      resourceColumnHeaderInnerClass="m-2 text-sm"
      resourceColumnResizerClass="absolute inset-y-0 w-[5px] end-[-3px]"
      resourceGroupHeaderClass="border border-(--fc-forma-border) bg-(--fc-forma-muted)"
      resourceGroupHeaderInnerClass="m-2 text-sm"
      resourceCellClass="border border-(--fc-forma-border)"
      resourceCellInnerClass="m-2 text-sm"
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
            'm-2 text-sm',
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

