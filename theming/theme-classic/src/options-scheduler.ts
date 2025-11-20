import { CalendarOptions, ViewOptions } from '@fullcalendar/core'
import { EventCalendarOptionParams, xxsTextClass } from './options-event-calendar.js'

// ambient types (tsc strips during build because of {})
import {} from '@fullcalendar/timeline'
import {} from '@fullcalendar/resource-daygrid'
import {} from '@fullcalendar/resource-timegrid'
import {} from '@fullcalendar/resource-timeline'
import {} from '@fullcalendar/adaptive'
import {} from '@fullcalendar/scrollgrid'

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

      resourceDayHeaderClass: (data) => [
        'border',
        data.isMajor ? params.strongBorderColorClass : params.borderColorClass,
      ],
      resourceDayHeaderInnerClass: (data) => [
        'px-1 py-0.5 flex flex-col',
        data.isNarrow ? xxsTextClass : 'text-sm',
      ],

      /* Resource Data Grid
      ------------------------------------------------------------------------------------------- */

      // column header
      resourceAreaHeaderClass: `border ${params.borderColorClass} justify-center`, // valign
      resourceAreaHeaderInnerClass: 'p-2 text-sm',
      resourceAreaHeaderResizerClass: 'absolute inset-y-0 w-[5px] end-[-3px]',

      // group cell
      resourceGroupHeaderClass: params.mutedBgClass,
      resourceGroupHeaderInnerClass: 'p-2 text-sm',

      // cell
      resourceCellClass: `border ${params.borderColorClass}`,
      resourceCellInnerClass: 'p-2 text-sm',

      // row expander
      resourceIndentClass: 'ms-2 -me-1 items-center',
      resourceExpanderClass: [
        'inline-flex flex-row group',
        params.outlineWidthFocusClass,
        params.primaryOutlineColorClass,
      ],

      // row
      resourceAreaHeaderRowClass: `border ${params.borderColorClass}`,
      resourceAreaRowClass: `border ${params.borderColorClass}`,

      // divider between data grid & timeline
      resourceAreaDividerClass: `border-x ${params.borderColorClass} ps-0.5 ${params.mutedBgClass}`,

      /* Timeline Lane
      ------------------------------------------------------------------------------------------- */

      resourceGroupLaneClass: params.mutedBgClass,
      resourceLaneBottomClass: (data) => data.options.eventOverlap && 'h-3',
      timelineBottomClass: 'h-3',
    },
    views: {
      timeline: {

        /* Timeline > Row Event
        ----------------------------------------------------------------------------------------- */

        rowEventClass: (data) => [
          data.isEnd && 'me-px',
          'items-center', // v-align with continuation arrows
        ],

        rowEventBeforeClass: (data) => (
          !data.isStartResizable && `${continuationArrowClass} border-e-[5px] border-e-black`
        ),

        rowEventAfterClass: (data) => (
          !data.isEndResizable && `${continuationArrowClass} border-s-[5px] border-s-black`
        ),

        rowEventInnerClass: (data) => (
          data.options.eventOverlap
            ? 'py-0.5'
            : 'py-1.5'
        ),

        rowEventTimeClass: 'px-0.5',
        rowEventTitleClass: 'px-0.5',

        /* Timeline > More-Link
        ----------------------------------------------------------------------------------------- */

        rowMoreLinkClass: [
          'me-px mb-px border border-transparent print:border-black',
          `${params.strongSolidPressableClass} print:bg-white`,
        ],
        rowMoreLinkInnerClass: 'p-0.5 text-xs',

        /* Timeline > Slot Label
        ----------------------------------------------------------------------------------------- */

        slotLabelAlign: (data) => data.isTime ? 'start' : 'center', // h-align

        slotLabelClass: 'justify-center', // v-align
        slotLabelInnerClass: (data) => [
          'p-2 text-sm',
          data.hasNavLink && 'hover:underline',
        ],

        // divider between label and lane
        slotLabelDividerClass: `border-b ${params.borderColorClass}`,

        /* Timeline > Now-Indicator
        ----------------------------------------------------------------------------------------- */

        // create down pointing arrow
        nowIndicatorLabelClass: [
          'top-0 -mx-[5px]',
          'border-x-[5px] border-x-transparent',
          `border-t-[6px] ${params.nowBorderColorClass}`,
        ],

        nowIndicatorLineClass: `border-s ${params.nowBorderColorClass}`,
      },
    },
  }
}
