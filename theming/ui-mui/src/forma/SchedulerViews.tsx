import React from 'react'
import { joinClassNames } from '@fullcalendar/react'
import EventCalendarViews, {
  mutedBgClass,
  mutedHoverPressableClass,
  outlineWidthFocusClass,
  primaryOutlineColorClass,
  strongSolidPressableClass,
  EventCalendarViewsProps,
} from './EventCalendarViews'
import { EventCalendarExpanderIcon } from './icons'

export interface SchedulerViewsProps extends EventCalendarViewsProps {}

export default function SchedulerViews({
  views: userViews,
  ...restOptions
}: SchedulerViewsProps) {
  return (
    <EventCalendarViews

      /* Resource Day Header
      ------------------------------------------------------------------------------------------- */

      resourceDayHeaderClass={(info) => joinClassNames(
        'border',
        info.isMajor
          ? 'border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]'
          : 'border-(--mui-palette-divider)',
      )}
      resourceDayHeaderInnerClass={(info) => joinClassNames(
        'm-2 flex flex-col',
        info.isNarrow ? 'text-xs' : 'text-sm',
      )}

      /* Resource Data Grid
      ------------------------------------------------------------------------------------------- */

      resourceColumnHeaderClass="border border-(--mui-palette-divider) justify-center"
      resourceColumnHeaderInnerClass="m-2 text-sm"
      resourceColumnResizerClass="absolute inset-y-0 w-[5px] end-[-3px]"
      resourceGroupHeaderClass={`border border-(--mui-palette-divider) ${mutedBgClass}`}
      resourceGroupHeaderInnerClass="m-2 text-sm"
      resourceCellClass="border border-(--mui-palette-divider)"
      resourceCellInnerClass="m-2 text-sm"
      resourceIndentClass="ms-1 -me-1.5 justify-center"
      resourceExpanderClass={`group p-0.5 rounded-sm ${mutedHoverPressableClass} ${outlineWidthFocusClass} ${primaryOutlineColorClass}`}
      resourceExpanderContent={(info) => (
        <EventCalendarExpanderIcon isExpanded={info.isExpanded} />
      )}
      resourceHeaderRowClass="border border-(--mui-palette-divider)"
      resourceRowClass="border border-(--mui-palette-divider)"
      resourceColumnDividerClass={`border-x border-(--mui-palette-divider) ps-0.5 ${mutedBgClass}`}

      /* Timeline Lane
      ------------------------------------------------------------------------------------------- */

      resourceGroupLaneClass={`border border-(--mui-palette-divider) ${mutedBgClass}`}
      resourceLaneClass="border border-(--mui-palette-divider)"
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
          slotHeaderDividerClass: `border-b border-(--mui-palette-divider)`,

          ...userViews?.timeline,
        },
      }}
      {...restOptions}
    />
  )
}

