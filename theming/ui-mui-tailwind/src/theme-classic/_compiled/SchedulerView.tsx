import React from 'react'
import { CalendarOptions } from '@fullcalendar/core'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import EventCalendarView, {
  mutedBgClass,
  outlineWidthFocusClass,
  primaryOutlineColorClass,
  rowPointerResizerClass,
  rowTouchResizerClass,
  strongSolidPressableClass,
} from './EventCalendarView.js'

const xxsTextClass = 'text-[0.6875rem]/[1.090909]'
const continuationArrowClass = 'mx-1 border-y-[5px] border-y-transparent opacity-50'

export default function SchedulerView({
  views: userViews,
  ...restOptions
}: CalendarOptions) {
  return (
    <EventCalendarView

      /* Resource Day Header
      ------------------------------------------------------------------------------------------- */

      resourceDayHeaderAlign="center"
      resourceDayHeaderClass={(data) => [
        'border',
        data.isMajor ? 'border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]' : 'border-(--mui-palette-divider)',
      ]}
      resourceDayHeaderInnerClass={(data) => [
        'px-1 py-0.5 flex flex-col',
        data.isNarrow ? xxsTextClass : 'text-sm',
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
      resourceIndentClass="ms-2 -me-1 justify-center"
      resourceExpanderClass={[
        'group',
        outlineWidthFocusClass,
        primaryOutlineColorClass,
      ]}
      resourceExpanderContent={(data) => (
        <ExpandMoreIcon
          sx={{ fontSize: 18, margin: '1px' }}
          className={!data.isExpanded ? '-rotate-90 [[dir=rtl]_&]:rotate-90' : ''}
        />
      )}
      resourceHeaderRowClass="border border-(--mui-palette-divider)"
      resourceRowClass="border border-(--mui-palette-divider)"
      resourceColumnDividerClass={`border-x border-(--mui-palette-divider) ps-0.5 ${mutedBgClass}`}

      /* Timeline Lane
      ------------------------------------------------------------------------------------------- */

      resourceGroupLaneClass={`border border-(--mui-palette-divider) ${mutedBgClass}`}
      resourceLaneClass="border border-(--mui-palette-divider)"
      resourceLaneBottomClass={(data) => data.options.eventOverlap && 'h-3'}
      timelineBottomClass="h-3"

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

      views={{
        ...userViews,
        timeline: {

          /* Timeline > Row Event
          --------------------------------------------------------------------------------------- */

          rowEventClass: (data) => [
            data.isEnd && 'me-px',
            'items-center',
          ],
          rowEventBeforeClass: (data) => (
            !data.isStartResizable ? (
              data.isSelected
                ? [rowTouchResizerClass, '-start-1']
                : [rowPointerResizerClass, '-start-1']
            ) : (
              !data.isStart && `${continuationArrowClass} border-e-[5px] border-e-black`
            )
          ),
          rowEventAfterClass: (data) => (
            !data.isEndResizable ? (
              data.isSelected
                ? [rowTouchResizerClass, '-end-1']
                : [rowPointerResizerClass, '-end-1']
            ) : (
              !data.isEnd && `${continuationArrowClass} border-s-[5px] border-s-black`
            )
          ),
          rowEventInnerClass: (data) => (
            data.options.eventOverlap
              ? 'py-0.5'
              : 'py-1.5'
          ),
          rowEventTimeClass: 'px-0.5',
          rowEventTitleClass: 'px-0.5',

          /* Timeline > More-Link
          --------------------------------------------------------------------------------------- */

          rowMoreLinkClass: [
            'me-px mb-px border border-transparent print:border-black',
            `${strongSolidPressableClass} print:bg-white`,
          ],
          rowMoreLinkInnerClass: 'p-0.5 text-xs',

          /* Timeline > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderAlign: (data) => data.isTime ? 'start' : 'center',
          slotHeaderClass: 'justify-center',
          slotHeaderInnerClass: (data) => [
            'p-2 text-sm',
            data.hasNavLink && 'hover:underline',
          ],
          slotHeaderDividerClass: `border-b border-(--mui-palette-divider)`,

          /* Timeline > Now-Indicator
          --------------------------------------------------------------------------------------- */

          nowIndicatorHeaderClass: [
            'top-0 -mx-[5px]',
            'border-x-[5px] border-x-transparent',
            `border-t-[6px] border-t-(--mui-palette-error-main)`,
          ],
          nowIndicatorLineClass: `border-s border-(--mui-palette-error-main)`,

          ...userViews?.timeline,
        },
      }}
      {...restOptions}
    />
  )
}

