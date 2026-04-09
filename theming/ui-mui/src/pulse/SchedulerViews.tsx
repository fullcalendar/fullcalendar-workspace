import React from 'react'
import { joinClassNames } from '@fullcalendar/react'
import EventCalendarViews, {
  EventCalendarViewsProps,
  mutedBgClass,
  mutedHoverPressableClass,
  outlineWidthFocusClass,
  strongSolidPressableClass,
  tertiaryOutlineColorClass,
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

      resourceDayHeaderAlign="center"
      resourceDayHeaderClass={(info) => joinClassNames(info.isMajor && 'border border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]')}
      resourceDayHeaderInnerClass={(info) => joinClassNames(
        'm-2 flex flex-row items-center text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]',
        info.isNarrow ? 'text-xs' : 'text-sm',
      )}

      /* Resource Data Grid
      ------------------------------------------------------------------------------------------- */

      resourceColumnHeaderClass="border border-(--mui-palette-divider) justify-center"
      resourceColumnHeaderInnerClass="m-2 text-(--mui-palette-text-primary) text-sm"
      resourceColumnResizerClass="absolute inset-y-0 w-[5px] end-[-3px]"
      resourceGroupHeaderClass={`border border-(--mui-palette-divider) ${mutedBgClass}`}
      resourceGroupHeaderInnerClass="m-2 text-(--mui-palette-text-primary) text-sm"
      resourceCellClass="border border-(--mui-palette-divider)"
      resourceCellInnerClass="m-2 text-(--mui-palette-text-primary) text-sm"
      resourceIndentClass="ms-1 -me-1.5 justify-center"
      resourceExpanderClass={`group p-0.5 rounded-sm ${mutedHoverPressableClass} ${outlineWidthFocusClass} ${tertiaryOutlineColorClass}`}
      resourceExpanderContent={(info) => (
        <EventCalendarExpanderIcon isExpanded={info.isExpanded} />
      )}
      resourceHeaderRowClass="border border-(--mui-palette-divider)"
      resourceRowClass="border border-(--mui-palette-divider)"
      resourceColumnDividerClass="border-e border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]"

      /* Timeline Lane
      ------------------------------------------------------------------------------------------- */

      resourceGroupLaneClass={`border border-(--mui-palette-divider) ${mutedBgClass}`}
      resourceLaneClass="border border-(--mui-palette-divider)"
      resourceLaneBottomClass={(info) => joinClassNames(info.options.eventOverlap && 'h-2')}
      timelineBottomClass="h-2"

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

      views={{
        ...userViews,
        timeline: {
          tableHeaderClass: 'bg-(--mui-palette-background-paper)',

          /* Timeline > Row Event
          --------------------------------------------------------------------------------------- */

          rowEventClass: (info) => joinClassNames(info.isEnd && 'me-px'),
          rowEventInnerClass: (info) => info.options.eventOverlap ? 'py-1' : 'py-2',

          /* Timeline > More-Link
          --------------------------------------------------------------------------------------- */

          rowMoreLinkClass: `me-px mb-px border border-transparent print:border-black rounded-sm ${strongSolidPressableClass} print:bg-white`,
          rowMoreLinkInnerClass: `p-1 text-(--mui-palette-text-primary) text-xs`,

          /* Timeline > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderAlign: (info) => info.isTime ? 'start' : 'center',
          slotHeaderClass: (info) => joinClassNames(
            info.level > 0 && 'border border-(--mui-palette-divider)',
            'justify-center',
          ),
          slotHeaderInnerClass: (info) => joinClassNames(
            'm-2 text-sm',
            info.isTime && joinClassNames(
              'relative -start-3',
              info.isFirst && 'hidden',
            ),
            info.hasNavLink && 'hover:underline',
          ),
          slotHeaderDividerClass: `border-b border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)] shadow-sm`,

          ...userViews?.timeline,
        },
      }}
      {...restOptions}
    />
  )
}

