import { CalendarOptions, ViewOptions } from '@fullcalendar/core'
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

      resourceDayHeaderClass: `border ${params.fgClass} text-sm font-semibold`,
      resourceDayHeaderInnerClass: 'p-2',

      /* Resource Data Grid
      ------------------------------------------------------------------------------------------- */

      // column header
      resourceAreaHeaderClass: `border ${params.mutedBorderColorClass} justify-center`, // v-align
      resourceAreaHeaderInnerClass: `p-2 ${params.fgClass} text-sm`,
      resourceAreaHeaderResizerClass: 'absolute inset-y-0 w-[5px] end-[-3px]',

      // group cell
      resourceGroupHeaderClass: params.mutedBgClass,
      resourceGroupHeaderInnerClass: `p-2 ${params.fgClass} text-sm`,

      // cell
      resourceCellClass: `border ${params.mutedBorderColorClass}`,
      resourceCellInnerClass: `p-2  ${params.fgClass} text-sm`,

      // row expander
      resourceIndentClass: 'ms-1 -me-1.5 items-center',
      resourceExpanderClass: [
        'group p-0.5 rounded-full inline-flex flex-row',
        params.mutedHoverPressableClass,
        params.outlineWidthFocusClass,
        params.primaryOutlineColorClass,
      ],

      // row
      resourceAreaHeaderRowClass: `border ${params.borderColorClass}`,
      resourceAreaRowClass: `border ${params.borderColorClass}`,

      // divider between data grid & timeline
      resourceAreaDividerClass: `border-s ${params.strongBorderColorClass}`,

      /* Timeline Lane
      ------------------------------------------------------------------------------------------- */

      resourceGroupLaneClass: `border ${params.borderColorClass} ${params.mutedBgClass}`,
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

        /* Timeline > Slot Label
        ----------------------------------------------------------------------------------------- */

        slotLabelAlign: (data) => data.isTime ? 'start' : 'center', // h-align

        slotLabelClass: (data) => [
          data.level > 0 && `border ${params.mutedBorderColorClass}`,
          'justify-end', // v-align
        ],
        slotLabelInnerClass: (data) => [
          'px-3 py-2 text-xs',
          data.isTime && 'relative -start-4',
          data.hasNavLink && 'hover:underline'
        ],

        // divider between label and lane
        slotLabelDividerClass: `border-t ${params.strongBorderColorClass} shadow-sm`,
      },
    },
  }
}
