import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/react'
import { EventCalendarOptionParams } from './options-event-calendar'

// ambient types (tsc strips during build because of {})
import {} from '@fullcalendar/react-scheduler/timeline'
import {} from '@fullcalendar/react-scheduler/resource-daygrid'
import {} from '@fullcalendar/react-scheduler/resource-timegrid'
import {} from '@fullcalendar/react-scheduler/resource-timeline'
import {} from '@fullcalendar/react-scheduler/adaptive'
import {} from '@fullcalendar/react-scheduler/scrollgrid'

export function createSchedulerOnlyOptions(params: EventCalendarOptionParams): {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} {

  /* Common
  ----------------------------------------------------------------------------------------------- */

  const resourceDayHeaderClasses = {
    dayHeaderInnerClass: 'mb-1',
    dayHeaderDividerClass: `border-b ${params.borderColorClass}`,
  }

  return {
    optionDefaults: {

      /* Resource Day Header
      ------------------------------------------------------------------------------------------- */

      resourceDayHeaderAlign: 'center',

      resourceDayHeaderClass: (info) => joinClassNames(
        'border',
        info.isMajor ? params.strongBorderColorClass : params.borderColorClass,
      ),
      resourceDayHeaderInnerClass: (info) => joinClassNames(
        'm-2 flex flex-col',
        info.isNarrow ? 'text-xs' : 'text-sm',
      ),

      /* Resource Data Grid
      ------------------------------------------------------------------------------------------- */

      // column header
      resourceColumnHeaderClass: `border ${params.borderColorClass} justify-center`, // v-align
      resourceColumnHeaderInnerClass: 'm-2 text-sm',
      resourceColumnResizerClass: 'absolute inset-y-0 w-[5px] end-[-3px]',

      // group header
      resourceGroupHeaderClass: `border ${params.borderColorClass} ${params.faintBgClass}`,
      resourceGroupHeaderInnerClass: 'm-2 text-sm',

      // cell
      resourceCellClass: `border ${params.borderColorClass}`,
      resourceCellInnerClass: 'm-2 text-sm',

      // row expander
      resourceIndentClass: 'ms-1 -me-1.5 justify-center', // v-align
      resourceExpanderClass: joinClassNames(
        'group p-1 rounded-full',
        params.mutedHoverPressableClass,
        params.outlineWidthFocusClass,
        params.tertiaryOutlineColorClass,
      ),

      // row
      resourceHeaderRowClass: `border ${params.borderColorClass}`,
      resourceRowClass: `border ${params.borderColorClass}`,

      // divider between data grid & timeline
      resourceColumnDividerClass: `border-e ${params.strongBorderColorClass}`,

      /* Timeline Lane
      ------------------------------------------------------------------------------------------- */

      resourceGroupLaneClass: `border ${params.borderColorClass} ${params.faintBgClass}`,
      resourceLaneClass: `border ${params.borderColorClass}`,
      resourceLaneBottomClass: (info) => joinClassNames(info.options.eventOverlap && 'h-2'),
      timelineBottomClass: 'h-2',
    },
    views: {
      resourceTimeGrid: resourceDayHeaderClasses,
      resourceDayGrid: resourceDayHeaderClasses,
      timeline: {

        /* Timeline > Row Event
        ----------------------------------------------------------------------------------------- */

        rowEventClass: (info) => joinClassNames(info.isEnd && 'me-px'),
        rowEventInnerClass: (info) => info.options.eventOverlap ? 'py-1' : 'py-2',

        /* Timeline > More-Link
        ----------------------------------------------------------------------------------------- */

        rowMoreLinkClass: joinClassNames(
          'me-px mb-px rounded-sm',
          'border border-transparent print:border-black',
          `${params.strongSolidPressableClass} print:bg-white`,
        ),
        rowMoreLinkInnerClass: 'p-1 text-xs',

        /* Timeline > Slot Header
        ----------------------------------------------------------------------------------------- */

        slotHeaderSticky: '0.5rem', // for pill

        slotHeaderAlign: (info) => ( // h-align
          (info.level || info.isTime)
            // pill OR time
            ? 'start'
            // other
            : 'center'
        ),

        slotHeaderClass: (info) => joinClassNames(
          'border',
          info.level
            // housing for pill
            ? 'border-transparent justify-start' // v-align
            // cell-like
            : joinClassNames(
                params.borderColorClass,
                info.isTime
                  // time-tick
                  ? 'h-2 self-end justify-end' // self-v-align, v-align
                  // day-header
                  : 'justify-center', // v-align
              ),
        ),

        slotHeaderInnerClass: (info) => joinClassNames(
          'text-sm',
          info.level
            // pill
            ? joinClassNames(
                'my-0.5 px-2 py-1 rounded-full',
                info.hasNavLink
                  ? params.secondaryPressableClass
                  : params.secondaryClass,
              )
            // cell-like inner
            : joinClassNames(
                'px-2',
                info.isTime
                  // time-tick inner
                  ? joinClassNames(
                      'pb-3 relative -start-3',
                      info.isFirst && 'hidden',
                    )
                  // day-header inner
                  : 'py-2',
                info.hasNavLink && 'hover:underline',
              )
        ),

        // divider between label and lane
        slotHeaderDividerClass: `border-b ${params.borderColorClass}`,
      },
    },
  }
}
