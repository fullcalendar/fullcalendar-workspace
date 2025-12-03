import React from 'react'
import { CalendarOptions, joinClassNames } from '@fullcalendar/core'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import EventCalendarView, {
  faintBgClass,
  mutedHoverPressableClass,
  outlineWidthFocusClass,
  pressableIconClass,
  secondaryClass,
  secondaryPressableClass,
  strongSolidPressableClass,
  tertiaryOutlineColorClass,
} from './EventCalendarView.js'

export interface SchedulerProps extends Omit<CalendarOptions, 'class' | 'className'> {
  className?: string
}

const resourceDayHeaderClasses = {
  dayHeaderInnerClass: 'mb-1',
  dayHeaderDividerClass: `border-b border-(--mui-palette-divider)`,
}

export default function SchedulerView({
  views: userViews,
  ...restOptions
}: SchedulerProps) {
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
        'p-2 flex flex-col',
        data.isNarrow ? 'text-xs' : 'text-sm',
      ]}

      /* Resource Data Grid
      ------------------------------------------------------------------------------------------- */

      resourceColumnHeaderClass="border border-(--mui-palette-divider) justify-center"
      resourceColumnHeaderInnerClass="p-2 text-sm"
      resourceColumnResizerClass="absolute inset-y-0 w-[5px] end-[-3px]"
      resourceGroupHeaderClass={`border border-(--mui-palette-divider) ${faintBgClass}`}
      resourceGroupHeaderInnerClass="p-2 text-sm"
      resourceCellClass="border border-(--mui-palette-divider)"
      resourceCellInnerClass="p-2 text-sm"
      resourceIndentClass="ms-1 -me-1.5 justify-center"
      resourceExpanderClass={[
        'group p-1 rounded-full',
        mutedHoverPressableClass,
        outlineWidthFocusClass,
        tertiaryOutlineColorClass,
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
      resourceColumnDividerClass="border-e border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]"

      /* Timeline Lane
      ------------------------------------------------------------------------------------------- */

      resourceGroupLaneClass={`border border-(--mui-palette-divider) ${faintBgClass}`}
      resourceLaneClass="border border-(--mui-palette-divider)"
      resourceLaneBottomClass={(data) => data.options.eventOverlap && 'h-2'}
      timelineBottomClass="h-2"

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

      views={{
        ...userViews,
        resourceTimeGrid: {
          ...resourceDayHeaderClasses,
          ...userViews?.resourceTimeGrid,
        },
        resourceDayGrid: {
          ...resourceDayHeaderClasses,
          ...userViews?.resourceDayGrid,
        },
        timeline: {

          /* Timeline > Row Event
          --------------------------------------------------------------------------------------- */

          rowEventClass: (data) => data.isEnd && 'me-px',
          rowEventInnerClass: (data) => data.options.eventOverlap ? 'py-1' : 'py-2',

          /* Timeline > More-Link
          --------------------------------------------------------------------------------------- */

          rowMoreLinkClass: [
            'me-px mb-px rounded-sm',
            'border border-transparent print:border-black',
            `${strongSolidPressableClass} print:bg-white`,
          ],
          rowMoreLinkInnerClass: 'p-1 text-xs',

          /* Timeline > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderSticky: '0.5rem',
          slotHeaderAlign: (data) => (
            (data.level || data.isTime)
              ? 'start'
              : 'center'
          ),
          slotHeaderClass: (data) => [
            'border',
            data.level
              ? 'border-transparent justify-start'
              : joinClassNames(
                  'border-(--mui-palette-divider)',
                  data.isTime
                    ? 'h-2 self-end justify-end'
                    : 'justify-center',
                ),
          ],
          slotHeaderInnerClass: (data) => [
            'text-sm',
            data.level
              ? joinClassNames(
                  'my-0.5 px-2 py-1 rounded-full',
                  data.hasNavLink
                    ? secondaryPressableClass
                    : secondaryClass,
                )
              : joinClassNames(
                  'px-2',
                  data.isTime
                    ? joinClassNames(
                        'pb-3 relative -start-3',
                        data.isFirst && 'hidden',
                      )
                    : 'py-2',
                  data.hasNavLink && 'hover:underline',
                )
          ],
          slotHeaderDividerClass: `border-b border-(--mui-palette-divider)`,

          ...userViews?.timeline,
        },
      }}
      {...restOptions}
    />
  )
}

