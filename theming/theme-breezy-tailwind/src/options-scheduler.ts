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
      // NOTE: border-color determined per-view below

      resourceDayHeaderAlign: 'center',

      resourceDayHeaderClass: 'border',
      resourceDayHeaderInnerClass: (info) => joinClassNames(
        `m-2 ${params.fgClass} font-semibold`,
        info.isNarrow ? 'text-xs' : 'text-sm',
      ),

      /* Resource Data Grid
      ------------------------------------------------------------------------------------------- */

      // column header
      resourceColumnHeaderClass: `border ${params.mutedBorderColorClass} justify-center`, // v-align
      resourceColumnHeaderInnerClass: `m-2 ${params.fgClass} text-sm`,
      resourceColumnResizerClass: 'absolute inset-y-0 w-[5px] end-[-3px]',

      // group header
      resourceGroupHeaderClass: `border ${params.borderColorClass} ${params.mutedBgClass}`,
      resourceGroupHeaderInnerClass: `m-2 ${params.fgClass} text-sm`,

      // cell
      resourceCellClass: `border ${params.mutedBorderColorClass}`,
      resourceCellInnerClass: `m-2 ${params.fgClass} text-sm`,

      // row expander
      resourceIndentClass: 'ms-1 -me-1.5 justify-center', // v-align
      resourceExpanderClass: joinClassNames(
        'group p-0.5 rounded-full',
        params.mutedHoverPressableClass,
        params.outlineWidthFocusClass,
        params.primaryOutlineColorClass,
      ),

      // row
      resourceHeaderRowClass: `border ${params.borderColorClass}`,
      resourceRowClass: `border ${params.borderColorClass}`,

      // divider between data grid & timeline
      resourceColumnDividerClass: `border-e ${params.strongBorderColorClass}`,

      /* Timeline Lane
      ------------------------------------------------------------------------------------------- */

      resourceGroupLaneClass:  `border ${params.borderColorClass} ${params.mutedBgClass}`,
      resourceLaneClass: `border ${params.borderColorClass}`,
      resourceLaneBottomClass: (info) => joinClassNames(info.options.eventOverlap && 'h-2'),
      timelineBottomClass: 'h-2',
    },
    views: {
      resourceDayGrid: {
        resourceDayHeaderClass: (info) => (
          info.isMajor
            ? params.strongBorderColorClass
            : params.borderColorClass
        ),
      },
      resourceTimeGrid: {
        resourceDayHeaderClass: (info) => (
          info.isMajor
            ? params.strongBorderColorClass
            : params.mutedBorderColorClass
        ),
      },
      timeline: {

        /* Timeline > Row Event
        ----------------------------------------------------------------------------------------- */

        rowEventClass: (info) => joinClassNames(info.isEnd && 'me-px'),
        rowEventInnerClass: (info) => info.options.eventOverlap ? 'py-1' : 'py-2',

        /* Timeline > More-Link
        ----------------------------------------------------------------------------------------- */

        rowMoreLinkClass: joinClassNames(
          'me-px mb-px border border-transparent print:border-black rounded-md',
          `${params.strongSolidPressableClass} print:bg-white`,
        ),
        rowMoreLinkInnerClass: `p-1 ${params.fgClass} text-xs`,

        /* Timeline > Slot Header
        ----------------------------------------------------------------------------------------- */

        slotHeaderAlign: (info) => info.isTime ? 'start' : 'center', // h-align

        slotHeaderClass: (info) => joinClassNames(
          info.level > 0 && `border ${params.mutedBorderColorClass}`,
          'justify-end', // v-align
        ),
        slotHeaderInnerClass: (info) => joinClassNames(
          'mx-3 my-2 text-xs',
          info.isTime && joinClassNames(
            'relative -start-4',
            info.isFirst && 'hidden',
          ),
          info.hasNavLink && 'hover:underline',
        ),

        // divider between label and lane
        slotHeaderDividerClass: `border-b ${params.strongBorderColorClass} shadow-sm`,
      },
    },
  }
}
