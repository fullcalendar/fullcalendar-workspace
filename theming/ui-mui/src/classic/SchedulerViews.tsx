import React from 'react'
import { joinClassNames } from '@fullcalendar/react'
import EventCalendarViews, {
  EventCalendarViewsProps,
  mutedBgClass,
  outlineWidthFocusClass,
  primaryOutlineColorClass,
  rowPointerResizerClass,
  rowTouchResizerClass,
  strongSolidPressableClass,
} from './EventCalendarViews'
import { EventCalendarExpanderIcon } from './icons'

const xxsTextClass = 'text-[0.6875rem]/[1.090909]'
const continuationArrowClass = 'mx-1 border-y-[5px] border-y-transparent opacity-50'

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
      resourceDayHeaderClass={(info) => joinClassNames(
        'border',
        info.isMajor
          ? 'border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]'
          : 'border-(--mui-palette-divider)',
      )}
      resourceDayHeaderInnerClass={(info) => joinClassNames(
        'mx-1 my-0.5 flex flex-col',
        info.isNarrow ? xxsTextClass : 'text-sm',
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
      resourceIndentClass="ms-2 -me-1 justify-center"
      resourceExpanderClass={`group ${outlineWidthFocusClass} ${primaryOutlineColorClass}`}
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
      resourceLaneBottomClass={(info) => joinClassNames(info.options.eventOverlap && 'h-3')}
      timelineBottomClass="h-3"

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

      views={{
        ...userViews,
        timeline: {

          /* Timeline > Row Event
          --------------------------------------------------------------------------------------- */

          rowEventClass: (info) => joinClassNames(
            info.isEnd && 'me-px',
            'items-center',
          ),
          rowEventBeforeClass: (info) => joinClassNames(
            !info.isStartResizable ? (
              info.isSelected
                ? joinClassNames(rowTouchResizerClass, '-start-1')
                : joinClassNames(rowPointerResizerClass, '-start-1')
            ) : (
              !info.isStart && `${continuationArrowClass} border-e-[5px] border-e-black`
            )
          ),
          rowEventAfterClass: (info) => joinClassNames(
            !info.isEndResizable ? (
              info.isSelected
                ? joinClassNames(rowTouchResizerClass, '-end-1')
                : joinClassNames(rowPointerResizerClass, '-end-1')
            ) : (
              !info.isEnd && `${continuationArrowClass} border-s-[5px] border-s-black`
            )
          ),
          rowEventInnerClass: (info) => info.options.eventOverlap ? 'py-0.5' : 'py-1.5',
          rowEventTimeClass: 'px-0.5',
          rowEventTitleClass: 'px-0.5',

          /* Timeline > More-Link
          --------------------------------------------------------------------------------------- */

          rowMoreLinkClass: `me-px mb-px border border-transparent print:border-black ${strongSolidPressableClass} print:bg-white`,
          rowMoreLinkInnerClass: 'p-0.5 text-xs',

          /* Timeline > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderAlign: (info) => info.isTime ? 'start' : 'center',
          slotHeaderClass: (info) => joinClassNames(
            'justify-center',
            !info.level && 'overflow-hidden',
          ),
          slotHeaderInnerClass: (info) => joinClassNames(
            'mx-2 my-1 text-sm',
            info.hasNavLink && 'hover:underline',
          ),
          slotHeaderDividerClass: `border-b border-(--mui-palette-divider)`,

          /* Timeline > Now-Indicator
          --------------------------------------------------------------------------------------- */

          nowIndicatorHeaderClass: 'top-0 -mx-[5px] border-x-[5px] border-x-transparent border-t-[6px] border-t-(--mui-palette-error-main)',
          nowIndicatorLineClass: `border-s border-(--mui-palette-error-main)`,

          ...userViews?.timeline,
        },
      }}
      {...restOptions}
    />
  )
}

