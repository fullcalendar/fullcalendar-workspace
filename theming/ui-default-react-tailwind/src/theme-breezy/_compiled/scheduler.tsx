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
      resourceDayHeaderClass="border"
      resourceDayHeaderInnerClass={(data) => [
        'p-2 text-(--fc-breezy-foreground) font-semibold',
        data.isNarrow ? 'text-xs' : 'text-sm',
      ]}

      /* Resource Data Grid
      ------------------------------------------------------------------------------------------- */

      resourceColumnHeaderClass="border border-(--fc-breezy-muted-border) justify-center"
      resourceColumnHeaderInnerClass="p-2 text-(--fc-breezy-foreground) text-sm"
      resourceColumnResizerClass="absolute inset-y-0 w-[5px] end-[-3px]"
      resourceGroupHeaderClass="border border-(--fc-breezy-border) bg-(--fc-breezy-muted)"
      resourceGroupHeaderInnerClass="p-2 text-(--fc-breezy-foreground) text-sm"
      resourceCellClass="border border-(--fc-breezy-muted-border)"
      resourceCellInnerClass="p-2 text-(--fc-breezy-foreground) text-sm"
      resourceIndentClass="ms-1 -me-1.5 justify-center"
      resourceExpanderClass={`group p-0.5 rounded-full ${mutedHoverPressableClass} ${outlineWidthFocusClass} ${primaryOutlineColorClass}`}
      resourceExpanderContent={(data) => chevronDown(
        joinClassNames(
          `size-5 ${mutedFgPressableGroupClass}`,
          !data.isExpanded && '-rotate-90 [[dir=rtl]_&]:rotate-90',
        )
      )}
      resourceHeaderRowClass="border border-(--fc-breezy-border)"
      resourceRowClass="border border-(--fc-breezy-border)"
      resourceColumnDividerClass="border-e border-(--fc-breezy-strong-border)"

      /* Timeline Lane
      ------------------------------------------------------------------------------------------- */

      resourceGroupLaneClass="border border-(--fc-breezy-border) bg-(--fc-breezy-muted)"
      resourceLaneClass="border border-(--fc-breezy-border)"
      resourceLaneBottomClass={(data) => data.options.eventOverlap && 'h-2'}
      timelineBottomClass="h-2"

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

      views={{
        ...userViews,
        resourceDayGrid: {
          resourceDayHeaderClass: (data) => (
            data.isMajor
              ? 'border-(--fc-breezy-strong-border)'
              : 'border-(--fc-breezy-border)'
          ),
          ...userViews?.resourceDayGrid,
        },
        resourceTimeGrid: {
          resourceDayHeaderClass: (data) => (
            data.isMajor
              ? 'border-(--fc-breezy-strong-border)'
              : 'border-(--fc-breezy-muted-border)'
          ),
          ...userViews?.resourceTimeGrid,
        },
        timeline: {

          /* Timeline > Row Event
          --------------------------------------------------------------------------------------- */

          rowEventClass: (data) => data.isEnd && 'me-px',
          rowEventInnerClass: (data) => data.options.eventOverlap ? 'py-1' : 'py-2',

          /* Timeline > More-Link
          --------------------------------------------------------------------------------------- */

          rowMoreLinkClass: `me-px mb-px border border-transparent print:border-black rounded-md ${strongSolidPressableClass} print:bg-white`,
          rowMoreLinkInnerClass: 'p-1 text-(--fc-breezy-foreground) text-xs',

          /* Timeline > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderAlign: (data) => data.isTime ? 'start' : 'center',
          slotHeaderClass: (data) => [
            data.level > 0 && 'border border-(--fc-breezy-muted-border)',
            'justify-end',
          ],
          slotHeaderInnerClass: (data) => [
            'px-3 py-2 text-xs',
            data.isTime && joinClassNames(
              'relative -start-4',
              data.isFirst && 'hidden',
            ),
            data.hasNavLink && 'hover:underline',
          ],
          slotHeaderDividerClass: 'border-b border-(--fc-breezy-strong-border) shadow-sm',

          ...userViews?.timeline,
        },
      }}

      {...restOptions}
    />
  )
}
