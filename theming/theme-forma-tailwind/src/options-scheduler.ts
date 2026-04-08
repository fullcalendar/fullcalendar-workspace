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
  return {
    optionDefaults: {

      /* Resource Day Header
      ------------------------------------------------------------------------------------------- */

      resourceDayHeaderClass: (info) => joinClassNames(
        'border',
        info.isMajor ? params.strongBorderColorClass : params.borderColorClass,
      ),
      resourceDayHeaderInnerClass: (info) => joinClassNames(
        'p-2 flex flex-col',
        info.isNarrow ? 'text-xs' : 'text-sm',
      ),

      /* Resource Data Grid
      ------------------------------------------------------------------------------------------- */

      // column header
      resourceColumnHeaderClass: `border ${params.borderColorClass} justify-center`, // v-align
      resourceColumnHeaderInnerClass: 'p-2 text-sm',
      resourceColumnResizerClass: 'absolute inset-y-0 w-[5px] end-[-3px]',

      // group header
      resourceGroupHeaderClass: `border ${params.borderColorClass} ${params.mutedBgClass}`,
      resourceGroupHeaderInnerClass: 'p-2 text-sm',

      // cell
      resourceCellClass: `border ${params.borderColorClass}`,
      resourceCellInnerClass: 'p-2 text-sm',

      // row expander
      resourceIndentClass: 'ms-1 -me-1.5 justify-center', // v-align
      resourceExpanderClass: joinClassNames(
        'group p-0.5 rounded-sm',
        params.mutedHoverPressableClass,
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
      resourceLaneBottomClass: (info) => joinClassNames(info.options.eventOverlap && 'h-2.5'),
      timelineBottomClass: 'h-2.5',
    },
    views: {
      timeline: {

        /* Timeline > Row Event
        ----------------------------------------------------------------------------------------- */

        rowEventClass: (info) => joinClassNames(info.isEnd && 'me-px'),
        rowEventInnerClass: (info) => (
          info.options.eventOverlap
            ? 'py-[0.1875rem]' // usually 3px
            : 'py-2'
        ),

        /* Timeline > More-Link
        ----------------------------------------------------------------------------------------- */

        rowMoreLinkClass: joinClassNames(
          'me-px mb-px rounded-sm border border-transparent print:border-black',
          `${params.strongSolidPressableClass} print:bg-white`,
        ),
        rowMoreLinkInnerClass: 'px-1 py-[0.1875rem] text-xs',

        /* Timeline > Slot Header
        ----------------------------------------------------------------------------------------- */

        slotHeaderAlign: (info) => info.isTime ? 'start' : 'center', // h-align

        slotHeaderClass: 'justify-center', // v-align
        slotHeaderInnerClass: (info) => joinClassNames(
          'p-2 text-sm',
          info.hasNavLink && 'hover:underline',
        ),

        // divider between label and lane
        slotHeaderDividerClass: `border-b ${params.borderColorClass}`,
      },
    }
  }
}
