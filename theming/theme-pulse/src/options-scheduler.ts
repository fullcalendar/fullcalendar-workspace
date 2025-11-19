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

      resourceDayHeaderAlign: 'center',

      resourceDayHeaderClass: (data) => data.isMajor && `border ${params.strongBorderColorClass}`,
      resourceDayHeaderInnerClass: [
        'p-2 flex flex-row items-center text-sm',
        params.mutedFgClass,
      ],

      /* Resource Data Grid
      ------------------------------------------------------------------------------------------- */

      // column header
      resourceAreaHeaderClass: `border ${params.borderColorClass} justify-center`,
      resourceAreaHeaderInnerClass: `p-2 ${params.strongFgClass} text-sm`,
      resourceAreaHeaderResizerClass: 'absolute inset-y-0 w-[5px] end-[-3px]',

      // group cell
      resourceGroupHeaderClass: params.mutedBgClass,
      resourceGroupHeaderInnerClass: `p-2 ${params.strongFgClass} text-sm`,

      // cell
      resourceCellClass: `border ${params.borderColorClass}`,
      resourceCellInnerClass: `p-2 ${params.strongFgClass} text-sm`,

      // row expander
      resourceIndentClass: 'ms-1 -me-1.5 items-center',
      resourceExpanderClass: [
        'group p-0.5 rounded-sm inline-flex flex-row',
        params.mutedHoverPressableClass,
        params.outlineWidthFocusClass,
        params.tertiaryOutlineColorClass,
      ],

      // row
      resourceAreaHeaderRowClass: `border ${params.borderColorClass}`,
      resourceAreaRowClass: `border ${params.borderColorClass}`,

      // divider between data grid & timeline
      resourceAreaDividerClass: `border-e ${params.strongBorderColorClass}`,

      /* Timeline Lane
      ------------------------------------------------------------------------------------------- */

      resourceGroupLaneClass: `border ${params.borderColorClass} ${params.mutedBgClass}`,
      resourceLaneClass: `border ${params.borderColorClass}`,
      resourceLaneBottomClass: (data) => data.options.eventOverlap && 'h-2',
      timelineBottomClass: 'h-2',
    },
    views: {
      timeline: {

        /* Timeline > Row Event
        ----------------------------------------------------------------------------------------- */

        rowEventClass: (data) => data.isEnd && 'me-px',
        rowEventInnerClass: (data) => data.options.eventOverlap ? 'py-1' : 'py-2',

        /* Timeline > More-Link
        ----------------------------------------------------------------------------------------- */

        rowMoreLinkClass: [
          'me-px mb-px border border-transparent print:border-black rounded-sm',
          `${params.strongSolidPressableClass} print:bg-white`,
        ],
        rowMoreLinkInnerClass: `p-1 ${params.strongFgClass} text-xs`,

        /* Timeline > Slot Label
        ----------------------------------------------------------------------------------------- */

        slotLabelAlign: (data) => data.isTime ? 'start' : 'center', // h-align

        slotLabelClass: (data) => [
          data.level > 0 && `border ${params.borderColorClass}`,
          'justify-center', // v-align
        ],
        slotLabelInnerClass: (data) => [
          `p-2 ${params.strongFgClass} text-sm`,
          data.isTime && joinClassNames(
            'relative -start-3',
            data.isFirst && 'hidden',
          ),
          data.hasNavLink && 'hover:underline',
        ],

        // divider between label and lane
        slotLabelDividerClass: `border-b ${params.strongBorderColorClass} shadow-sm`,
      },
    },
  }
}
