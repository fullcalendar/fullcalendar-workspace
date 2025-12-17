import React from 'react'
import { joinClassNames } from '@fullcalendar/core'
import type {} from '@fullcalendar/timeline'
import type {} from '@fullcalendar/resource-timeline'
import type {} from '@fullcalendar/resource-daygrid'
import type {} from '@fullcalendar/resource-timegrid'
import EventCalendarViews, {
  mutedBgClass,
  mutedHoverPressableClass,
  outlineWidthFocusClass,
  primaryOutlineColorClass,
  strongSolidPressableClass,
  EventCalendarViewsProps,
} from './EventCalendarViews.js'
import { EventCalendarExpanderIcon } from './icons.js'

export interface SchedulerViewsProps extends EventCalendarViewsProps {}

export default function SchedulerViews({
  views: userViews,
  ...restOptions
}: SchedulerViewsProps) {
  return (
    <EventCalendarViews

      /* Resource Day Header
      ------------------------------------------------------------------------------------------- */

      resourceDayHeaderAlign="center"
      resourceDayHeaderClass="border"
      resourceDayHeaderInnerClass={(data) => joinClassNames(
        `p-2 text-(--mui-palette-text-primary) font-semibold`,
        data.isNarrow ? 'text-xs' : 'text-sm',
      )}

      /* Resource Data Grid
      ------------------------------------------------------------------------------------------- */

      resourceColumnHeaderClass="border border-(--mui-palette-divider) justify-center"
      resourceColumnHeaderInnerClass="p-2 text-(--mui-palette-text-primary) text-sm"
      resourceColumnResizerClass="absolute inset-y-0 w-[5px] end-[-3px]"
      resourceGroupHeaderClass={`border border-(--mui-palette-divider) ${mutedBgClass}`}
      resourceGroupHeaderInnerClass="p-2 text-(--mui-palette-text-primary) text-sm"
      resourceCellClass="border border-(--mui-palette-divider)"
      resourceCellInnerClass="p-2 text-(--mui-palette-text-primary) text-sm"
      resourceIndentClass="ms-1 -me-1.5 justify-center"
      resourceExpanderClass={`group p-0.5 rounded-full ${mutedHoverPressableClass} ${outlineWidthFocusClass} ${primaryOutlineColorClass}`}
      resourceExpanderContent={(data) => (
        <EventCalendarExpanderIcon isExpanded={data.isExpanded} />
      )}
      resourceHeaderRowClass="border border-(--mui-palette-divider)"
      resourceRowClass="border border-(--mui-palette-divider)"
      resourceColumnDividerClass="border-e border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]"

      /* Timeline Lane
      ------------------------------------------------------------------------------------------- */

      resourceGroupLaneClass={`border border-(--mui-palette-divider) ${mutedBgClass}`}
      resourceLaneClass="border border-(--mui-palette-divider)"
      resourceLaneBottomClass={(data) => joinClassNames(data.options.eventOverlap && 'h-2')}
      timelineBottomClass="h-2"

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

      views={{
        ...userViews,
        resourceDayGrid: {
          resourceDayHeaderClass: (data) => (
            data.isMajor
              ? 'border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]'
              : 'border-(--mui-palette-divider)'
          ),
          ...userViews?.resourceDayGrid,
        },
        resourceTimeGrid: {
          resourceDayHeaderClass: (data) => (
            data.isMajor
              ? 'border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]'
              : 'border-(--mui-palette-divider)'
          ),
          ...userViews?.resourceTimeGrid,
        },
        timeline: {

          /* Timeline > Row Event
          --------------------------------------------------------------------------------------- */

          rowEventClass: (data) => joinClassNames(data.isEnd && 'me-px'),
          rowEventInnerClass: (data) => data.options.eventOverlap ? 'py-1' : 'py-2',

          /* Timeline > More-Link
          --------------------------------------------------------------------------------------- */

          rowMoreLinkClass: `me-px mb-px border border-transparent print:border-black rounded-md ${strongSolidPressableClass} print:bg-white`,
          rowMoreLinkInnerClass: `p-1 text-(--mui-palette-text-primary) text-xs`,

          /* Timeline > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderAlign: (data) => data.isTime ? 'start' : 'center',
          slotHeaderClass: (data) => joinClassNames(
            data.level > 0 && `border border-(--mui-palette-divider)`,
            'justify-end',
          ),
          slotHeaderInnerClass: (data) => joinClassNames(
            'px-3 py-2 text-xs',
            data.isTime && joinClassNames(
              'relative -start-4',
              data.isFirst && 'hidden',
            ),
            data.hasNavLink && 'hover:underline',
          ),
          slotHeaderDividerClass: `border-b border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)] shadow-sm`,

          ...userViews?.timeline,
        },
      }}
      {...restOptions}
    />
  )
}

