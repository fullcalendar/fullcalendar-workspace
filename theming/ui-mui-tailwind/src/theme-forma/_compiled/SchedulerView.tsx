import React from 'react'
import { CalendarOptions, joinClassNames } from '@fullcalendar/core'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import EventCalendarView, {
  mutedBgClass,
  mutedHoverPressableClass,
  outlineWidthFocusClass,
  primaryOutlineColorClass,
  pressableIconClass,
  strongSolidPressableClass,
} from './EventCalendarView.js'

export interface SchedulerProps extends Omit<CalendarOptions, 'class' | 'className'> {
  className?: string
}

export default function SchedulerView({
  views: userViews,
  ...restOptions
}: SchedulerProps) {
  return (
    <EventCalendarView

      /* Resource Day Header
      ------------------------------------------------------------------------------------------- */

      resourceDayHeaderClass={(data) => [
        'border',
        data.isMajor ? 'border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]' : 'border-(--mui-palette-divider)',
      ]}
      resourceDayHeaderInnerClass={(data) => [
        'p-2 flex flex-col',
        data.isNarrow ? 'text-xs' : 'text-sm',
      ]}

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
      resourceExpanderClass={[
        'group p-0.5 rounded-sm',
        mutedHoverPressableClass,
        outlineWidthFocusClass,
        primaryOutlineColorClass,
      ]}
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
      resourceColumnDividerClass={`border-x border-(--mui-palette-divider) ps-0.5 ${mutedBgClass}`}

      /* Timeline Lane
      ------------------------------------------------------------------------------------------- */

      resourceGroupLaneClass={`border border-(--mui-palette-divider) ${mutedBgClass}`}
      resourceLaneClass="border border-(--mui-palette-divider)"
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
          slotHeaderDividerClass: `border-b border-(--mui-palette-divider)`,

          ...userViews?.timeline,
        },
      }}
      {...restOptions}
    />
  )
}

