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

      resourceDayHeaderClass: (data) => [
        'border',
        data.isMajor ? params.strongBorderColorClass : params.borderColorClass,
      ],
      resourceDayHeaderInnerClass: (data) => [
        'p-2 flex flex-col',
        data.isNarrow ? 'text-xs' : 'text-sm',
      ],

      /* Resource Data Grid
      ------------------------------------------------------------------------------------------- */

      // column header
      resourceAreaHeaderClass: `border ${params.borderColorClass} justify-center`, // v-align
      resourceAreaHeaderInnerClass: 'p-2 text-sm',
      resourceAreaHeaderResizerClass: 'absolute inset-y-0 w-[5px] end-[-3px]',

      // group cell
      resourceGroupHeaderClass: `border ${params.borderColorClass} ${params.faintBgClass}`,
      resourceGroupHeaderInnerClass: 'p-2 text-sm',

      // cell
      resourceCellClass: `border ${params.borderColorClass}`,
      resourceCellInnerClass: 'p-2 text-sm',

      // row expander
      resourceIndentClass: 'ms-1 -me-1.5 justify-center', // v-align
      resourceExpanderClass: [
        'group p-1 rounded-full',
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

      resourceGroupLaneClass: `border ${params.borderColorClass} ${params.faintBgClass}`,
      resourceLaneClass: `border ${params.borderColorClass}`,
      resourceLaneBottomClass: (data) => data.options.eventOverlap && 'h-2',
      timelineBottomClass: 'h-2',
    },
    views: {
      resourceTimeGrid: resourceDayHeaderClasses,
      resourceDayGrid: resourceDayHeaderClasses,
      timeline: {

        /* Timeline > Row Event
        ----------------------------------------------------------------------------------------- */

        rowEventClass: (data) => data.isEnd && 'me-px',
        rowEventInnerClass: (data) => data.options.eventOverlap ? 'py-1' : 'py-2',

        /* Timeline > More-Link
        ----------------------------------------------------------------------------------------- */

        rowMoreLinkClass: [
          'me-px mb-px rounded-sm',
          'border border-transparent print:border-black',
          `${params.strongSolidPressableClass} print:bg-white`,
        ],
        rowMoreLinkInnerClass: 'p-1 text-xs',

        /* Timeline > Slot Label
        ----------------------------------------------------------------------------------------- */

        slotLabelSticky: '0.5rem', // for pill

        slotLabelAlign: (data) => ( // h-align
          (data.level || data.isTime)
            // pill OR time
            ? 'start'
            // other
            : 'center'
        ),

        slotLabelClass: (data) => [
          'border',
          data.level
            // housing for pill
            ? 'border-transparent justify-start' // v-align
            // cell-like
            : joinClassNames(
                params.borderColorClass,
                data.isTime
                  // time-tick
                  ? 'h-2 self-end justify-end' // self-v-align, v-align
                  // day-header
                  : 'justify-center', // v-align
              ),
        ],

        slotLabelInnerClass: (data) => [
          'text-sm',
          data.level
            // pill
            ? joinClassNames(
                'my-0.5 px-2 py-1 rounded-full',
                data.hasNavLink
                  ? params.secondaryPressableClass
                  : params.secondaryClass,
              )
            // cell-like inner
            : joinClassNames(
                'px-2',
                data.isTime
                  // time-tick inner
                  ? joinClassNames(
                      'pb-3 relative -start-3',
                      data.isFirst && 'hidden',
                    )
                  // day-header inner
                  : 'py-2',
                data.hasNavLink && 'hover:underline',
              )
        ],

        // divider between label and lane
        slotLabelDividerClass: `border-b ${params.borderColorClass}`,
      },
    },
  }
}
