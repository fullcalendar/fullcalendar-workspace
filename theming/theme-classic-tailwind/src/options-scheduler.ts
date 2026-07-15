import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/react'
import { EventCalendarOptionParams, xxsTextClass } from './options-event-calendar'

// ambient types (tsc strips during build because of {})
import {} from '@fullcalendar/react-scheduler/timeline'
import {} from '@fullcalendar/react-scheduler/resource-daygrid'
import {} from '@fullcalendar/react-scheduler/resource-timegrid'
import {} from '@fullcalendar/react-scheduler/resource-timeline'
import {} from '@fullcalendar/react-scheduler/adaptive'
import {} from '@fullcalendar/react-scheduler/scrollgrid'

const continuationArrowClass = 'mx-1 border-y-[5px] border-y-transparent opacity-50'

export function createSchedulerOnlyOptions(params: EventCalendarOptionParams): {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} {
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
        'mx-1 my-0.5 flex flex-col',
        info.isNarrow ? xxsTextClass : 'text-sm',
      ),

      /* Resource Data Grid
      ------------------------------------------------------------------------------------------- */

      // column header
      resourceColumnHeaderClass: `border ${params.borderColorClass} justify-center`, // v-align
      resourceColumnHeaderInnerClass: 'm-2 text-sm',
      resourceColumnResizerClass: 'absolute inset-y-0 w-[5px] end-[-3px]',

      // group header
      resourceGroupHeaderClass: `border ${params.borderColorClass} ${params.mutedBgClass}`,
      resourceGroupHeaderInnerClass: 'm-2 text-sm',

      // cell
      resourceCellClass: `border ${params.borderColorClass}`,
      resourceCellInnerClass: 'm-2 text-sm',

      // row expander
      resourceIndentClass: 'ms-2 -me-1 justify-center', // v-align
      resourceExpanderClass: joinClassNames(
        'group',
        params.outlineWidthFocusClass,
        params.primaryOutlineColorClass,
      ),

      // row
      resourceHeaderRowClass: `border ${params.borderColorClass}`,
      resourceRowClass: `border ${params.borderColorClass}`,

      // divider between data grid & timeline
      resourceColumnDividerClass: `border-x ${params.borderColorClass} ps-0.5 ${params.mutedBgClass}`,

      /* Timeline Lane
      ------------------------------------------------------------------------------------------- */

      resourceGroupLaneClass: `border ${params.borderColorClass} ${params.mutedBgClass}`,
      resourceLaneClass: `border ${params.borderColorClass}`,
      resourceLaneBottomClass: (info) => joinClassNames(info.options.eventOverlap && 'h-3'),
      timelineBottomClass: 'h-3',
    },
    views: {
      timeline: {

        /* Timeline > Row Event
        ----------------------------------------------------------------------------------------- */

        rowEventClass: (info) => joinClassNames(
          info.isEnd && 'me-px',
          'items-center', // v-align with continuation arrows
        ),

        rowEventBeforeClass: (info) => joinClassNames(
          !info.isStart && `${continuationArrowClass} border-e-[5px] border-e-black`
        ),

        rowEventAfterClass: (info) => joinClassNames(
          !info.isEnd && `${continuationArrowClass} border-s-[5px] border-s-black`
        ),

        rowEventInnerClass: (info) => (
          info.options.eventOverlap
            ? 'py-0.5'
            : 'py-1.5'
        ),

        rowEventTimeClass: 'px-0.5',
        rowEventTitleClass: 'px-0.5',

        /* Timeline > More-Link
        ----------------------------------------------------------------------------------------- */

        rowMoreLinkClass: joinClassNames(
          'me-px mb-px border border-transparent print:border-black',
          `${params.strongSolidPressableClass} print:bg-white`,
        ),
        rowMoreLinkInnerClass: 'p-0.5 text-xs',

        /* Timeline > Slot Header
        ----------------------------------------------------------------------------------------- */

        slotHeaderAlign: (info) => info.isTime ? 'start' : 'center', // h-align

        slotHeaderClass: (info) => joinClassNames(
          'justify-center', // v-align
          !info.level && 'overflow-hidden', // don't apply to potentially sticky cell-inners
        ),
        slotHeaderInnerClass: (info) => joinClassNames(
          'mx-2 my-1 text-sm',
          info.hasNavLink && 'hover:underline',
        ),

        // divider between label and lane
        slotHeaderDividerClass: `border-b ${params.borderColorClass}`,

        /* Timeline > Now-Indicator
        ----------------------------------------------------------------------------------------- */

        // create down pointing arrow
        nowIndicatorHeaderClass: joinClassNames(
          'top-0 -mx-[5px]',
          'border-x-[5px] border-x-transparent',
          `border-t-[6px] ${params.nowBorderColorClass}`,
        ),

        nowIndicatorLineClass: `border-s ${params.nowBorderColorClass}`,
      },
    },
  }
}
