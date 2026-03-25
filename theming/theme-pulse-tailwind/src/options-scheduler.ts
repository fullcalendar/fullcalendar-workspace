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

      resourceDayHeaderAlign: 'center',

      resourceDayHeaderClass: (data) => joinClassNames(data.isMajor && `border ${params.strongBorderColorClass}`),
      resourceDayHeaderInnerClass: (data) => joinClassNames(
        'p-2 flex flex-row items-center',
        params.mutedFgClass,
        data.isNarrow ? 'text-xs' : 'text-sm',
      ),

      /* Resource Data Grid
      ------------------------------------------------------------------------------------------- */

      // column header
      resourceColumnHeaderClass: `border ${params.borderColorClass} justify-center`, // v-align
      resourceColumnHeaderInnerClass: `p-2 ${params.fgClass} text-sm`,
      resourceColumnResizerClass: 'absolute inset-y-0 w-[5px] end-[-3px]',

      // group header
      resourceGroupHeaderClass: `border ${params.borderColorClass} ${params.mutedBgClass}`,
      resourceGroupHeaderInnerClass: `p-2 ${params.fgClass} text-sm`,

      // cell
      resourceCellClass: `border ${params.borderColorClass}`,
      resourceCellInnerClass: `p-2 ${params.fgClass} text-sm`,

      // row expander
      resourceIndentClass: 'ms-1 -me-1.5 justify-center', // v-align
      resourceExpanderClass: joinClassNames(
        'group p-0.5 rounded-sm',
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

      resourceGroupLaneClass: `border ${params.borderColorClass} ${params.mutedBgClass}`,
      resourceLaneClass: `border ${params.borderColorClass}`,
      resourceLaneBottomClass: (data) => joinClassNames(data.options.eventOverlap && 'h-2'),
      timelineBottomClass: 'h-2',
    },
    views: {
      timeline: {
        tableHeaderClass: params.bgClass,

        /* Timeline > Row Event
        ----------------------------------------------------------------------------------------- */

        rowEventClass: (data) => joinClassNames(data.isEnd && 'me-px'),
        rowEventInnerClass: (data) => data.options.eventOverlap ? 'py-1' : 'py-2',

        /* Timeline > More-Link
        ----------------------------------------------------------------------------------------- */

        rowMoreLinkClass: joinClassNames(
          'me-px mb-px border border-transparent print:border-black rounded-sm',
          `${params.strongSolidPressableClass} print:bg-white`,
        ),
        rowMoreLinkInnerClass: `p-1 ${params.fgClass} text-xs`,

        /* Timeline > Slot Header
        ----------------------------------------------------------------------------------------- */

        slotHeaderAlign: (data) => data.isTime ? 'start' : 'center', // h-align

        slotHeaderClass: (data) => joinClassNames(
          data.level > 0 && `border ${params.borderColorClass}`,
          'justify-center', // v-align
        ),
        slotHeaderInnerClass: (data) => joinClassNames(
          'p-2 text-sm',
          data.isTime && joinClassNames(
            'relative -start-3',
            data.isFirst && 'hidden',
          ),
          data.hasNavLink && 'hover:underline',
        ),

        // divider between label and lane
        slotHeaderDividerClass: `border-b ${params.strongBorderColorClass} shadow-sm`,
      },
    },
  }
}
