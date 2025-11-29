import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'
import { EventCalendarOptionParams } from './options-event-calendar.js'

// ambient types (tsc strips during build because of {})
import {} from '@fullcalendar/timeline'
import {} from '@fullcalendar/resource-daygrid'
import {} from '@fullcalendar/resource-timegrid'
import {} from '@fullcalendar/resource-timeline'
import {} from '@fullcalendar/adaptive'
import {} from '@fullcalendar/scrollgrid'

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
      resourceDayHeaderInnerClass: (data) => [
        `p-2 ${params.fgClass} font-semibold`,
        data.isNarrow ? 'text-xs' : 'text-sm',
      ],

      /* Resource Data Grid
      ------------------------------------------------------------------------------------------- */

      // column header
      resourceColumnHeaderClass: `border ${params.mutedBorderColorClass} justify-center`, // v-align
      resourceColumnHeaderInnerClass: `p-2 ${params.fgClass} text-sm`,
      resourceColumnResizerClass: 'absolute inset-y-0 w-[5px] end-[-3px]',

      // group header
      resourceGroupHeaderClass: `border ${params.borderColorClass} ${params.mutedBgClass}`,
      resourceGroupHeaderInnerClass: `p-2 ${params.fgClass} text-sm`,

      // cell
      resourceCellClass: `border ${params.mutedBorderColorClass}`,
      resourceCellInnerClass: `p-2 ${params.fgClass} text-sm`,

      // row expander
      resourceIndentClass: 'ms-1 -me-1.5 justify-center', // v-align
      resourceExpanderClass: [
        'group p-0.5 rounded-full',
        params.mutedHoverPressableClass,
        params.outlineWidthFocusClass,
        params.primaryOutlineColorClass,
      ],

      // row
      resourceHeaderRowClass: `border ${params.borderColorClass}`,
      resourceRowClass: `border ${params.borderColorClass}`,

      // divider between data grid & timeline
      resourceColumnDividerClass: `border-e ${params.strongBorderColorClass}`,

      /* Timeline Lane
      ------------------------------------------------------------------------------------------- */

      resourceGroupLaneClass:  `border ${params.borderColorClass} ${params.mutedBgClass}`,
      resourceLaneClass: `border ${params.borderColorClass}`,
      resourceLaneBottomClass: (data) => data.options.eventOverlap && 'h-2',
      timelineBottomClass: 'h-2',
    },
    views: {
      resourceDayGrid: {
        resourceDayHeaderClass: (data) => (
          data.isMajor
            ? params.strongBorderColorClass
            : params.borderColorClass
        ),
      },
      resourceTimeGrid: {
        resourceDayHeaderClass: (data) => (
          data.isMajor
            ? params.strongBorderColorClass
            : params.mutedBorderColorClass
        ),
      },
      timeline: {

        /* Timeline > Row Event
        ----------------------------------------------------------------------------------------- */

        rowEventClass: (data) => data.isEnd && 'me-px',
        rowEventInnerClass: (data) => data.options.eventOverlap ? 'py-1' : 'py-2',

        /* Timeline > More-Link
        ----------------------------------------------------------------------------------------- */

        rowMoreLinkClass: [
          'me-px mb-px border border-transparent print:border-black rounded-md',
          `${params.strongSolidPressableClass} print:bg-white`,
        ],
        rowMoreLinkInnerClass: `p-1 ${params.fgClass} text-xs`,

        /* Timeline > Slot Header
        ----------------------------------------------------------------------------------------- */

        slotHeaderAlign: (data) => data.isTime ? 'start' : 'center', // h-align

        slotHeaderClass: (data) => [
          data.level > 0 && `border ${params.mutedBorderColorClass}`,
          'justify-end', // v-align
        ],
        slotHeaderInnerClass: (data) => [
          'px-3 py-2 text-xs',
          data.isTime && joinClassNames(
            'relative -start-4',
            data.isFirst && 'hidden',
          ),
          data.hasNavLink && 'hover:underline',
        ],

        // divider between label and lane
        slotHeaderDividerClass: `border-b ${params.strongBorderColorClass} shadow-sm`,
      },
    },
  }
}
