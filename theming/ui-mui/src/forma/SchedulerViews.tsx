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

      resourceDayHeaderClass={(data) => joinClassNames(
        'border',
        data.isMajor
          ? 'border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]'
          : 'border-(--mui-palette-divider)',
      )}
      resourceDayHeaderInnerClass={(data) => joinClassNames(
        'p-2 flex flex-col',
        data.isNarrow ? 'text-xs' : 'text-sm',
      )}

      /* Resource Data Grid
      ------------------------------------------------------------------------------------------- */

      resourceColumnHeaderClass="border border-(--mui-palette-divider) justify-center"
      resourceColumnHeaderInnerClass="p-2 text-sm"
      resourceColumnResizerClass="absolute inset-y-0 w-[5px] end-[-3px]"
      resourceGroupHeaderClass={`border border-(--mui-palette-divider) ${mutedBgClass}`}
      resourceGroupHeaderInnerClass="p-2 text-sm"
      resourceCellClass="border border-(--mui-palette-divider)"
      resourceCellInnerClass="p-2 text-sm"
      resourceIndentClass="ms-1 -me-1.5 justify-center"
      resourceExpanderClass={`group p-0.5 rounded-sm ${mutedHoverPressableClass} ${outlineWidthFocusClass} ${primaryOutlineColorClass}`}
      resourceExpanderContent={(data) => (
        <EventCalendarExpanderIcon isExpanded={data.isExpanded} />
      )}
      resourceHeaderRowClass="border border-(--mui-palette-divider)"
      resourceRowClass="border border-(--mui-palette-divider)"
      resourceColumnDividerClass={`border-x border-(--mui-palette-divider) ps-0.5 ${mutedBgClass}`}

      /* Timeline Lane
      ------------------------------------------------------------------------------------------- */

      resourceGroupLaneClass={`border border-(--mui-palette-divider) ${mutedBgClass}`}
      resourceLaneClass="border border-(--mui-palette-divider)"
      resourceLaneBottomClass={(data) => joinClassNames(data.options.eventOverlap && 'h-2.5')}
      timelineBottomClass="h-2.5"

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

      views={{
        ...userViews,
        timeline: {

          /* Timeline > Row Event
          --------------------------------------------------------------------------------------- */

          rowEventClass: (data) => joinClassNames(data.isEnd && 'me-px'),
          rowEventInnerClass: (data) => (
            data.options.eventOverlap
              ? 'py-[0.1875rem]'
              : 'py-2'
          ),

          /* Timeline > More-Link
          --------------------------------------------------------------------------------------- */

          rowMoreLinkClass: `me-px mb-px rounded-sm border border-transparent print:border-black ${strongSolidPressableClass} print:bg-white`,
          rowMoreLinkInnerClass: 'px-1 py-[0.1875rem] text-xs',

          /* Timeline > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderAlign: (data) => data.isTime ? 'start' : 'center',
          slotHeaderClass: 'justify-center',
          slotHeaderInnerClass: (data) => joinClassNames(
            'p-2 text-sm',
            data.hasNavLink && 'hover:underline',
          ),
          slotHeaderDividerClass: `border-b border-(--mui-palette-divider)`,

          ...userViews?.timeline,
        },
      }}
      {...restOptions}
    />
  )
}

