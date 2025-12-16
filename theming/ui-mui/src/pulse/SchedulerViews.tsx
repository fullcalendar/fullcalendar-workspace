import React from 'react'
import { joinClassNames } from '@fullcalendar/core'
import type {} from '@fullcalendar/timeline'
import type {} from '@fullcalendar/resource-timeline'
import type {} from '@fullcalendar/resource-daygrid'
import type {} from '@fullcalendar/resource-timegrid'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import EventCalendarViews, {
  EventCalendarViewsProps,
  mutedBgClass,
  mutedHoverPressableClass,
  outlineWidthFocusClass,
  pressableIconClass,
  strongSolidPressableClass,
  tertiaryOutlineColorClass,
} from './EventCalendarViews.js'

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
      resourceDayHeaderClass={(data) => joinClassNames(data.isMajor && 'border border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]')}
      resourceDayHeaderInnerClass={(data) => joinClassNames(
        'p-2 flex flex-row items-center text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]',
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
      resourceExpanderClass={`group p-0.5 rounded-sm ${mutedHoverPressableClass} ${outlineWidthFocusClass} ${tertiaryOutlineColorClass}`}
      resourceExpanderContent={(data) => (
        <ExpandMoreIcon
          sx={{ fontSize: 18, margin: '1px' }}
          className={joinClassNames(
            pressableIconClass,
            !data.isExpanded && '-rotate-90 [[dir=rtl]_&]:rotate-90'
          )}
        />
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
        timeline: {

          /* Timeline > Row Event
          --------------------------------------------------------------------------------------- */

          rowEventClass: (data) => joinClassNames(data.isEnd && 'me-px'),
          rowEventInnerClass: (data) => data.options.eventOverlap ? 'py-1' : 'py-2',

          /* Timeline > More-Link
          --------------------------------------------------------------------------------------- */

          rowMoreLinkClass: `me-px mb-px border border-transparent print:border-black rounded-sm ${strongSolidPressableClass} print:bg-white`,
          rowMoreLinkInnerClass: `p-1 text-(--mui-palette-text-primary) text-xs`,

          /* Timeline > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderAlign: (data) => data.isTime ? 'start' : 'center',
          slotHeaderClass: (data) => joinClassNames(
            data.level > 0 && 'border border-(--mui-palette-divider)',
            'justify-center',
          ),
          slotHeaderInnerClass: (data) => joinClassNames(
            'p-2 text-sm',
            data.isTime && joinClassNames(
              'relative -start-3',
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

