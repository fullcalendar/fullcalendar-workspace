import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'
import { xxsTextClass, EventCalendarOptionParams } from './options-event-calendar.js'

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
  const resourceDayHeaderClasses = {
    dayHeaderDividerClass: `border-b ${params.borderColorClass}`,
    dayHeaderInnerClass: 'mb-1',
  }

  return {
    optionDefaults: {
      resourceDayHeaderAlign: 'center',

      // FORCED flex-col
      resourceDayHeaderClass: (data) => [
        'border',
        data.isMajor ? params.strongBorderColorClass : params.borderColorClass,
        data.isDisabled && params.faintBgClass,
      ],
      // NOT forced
      resourceDayHeaderInnerClass: (data) => [
        'p-2 flex flex-col',
        data.isNarrow ? xxsTextClass : 'text-sm',
      ],

      resourceAreaHeaderRowClass: `border ${params.borderColorClass}`,

      // FORCED flex-col
      resourceAreaHeaderClass: `border ${params.borderColorClass} justify-center`, // v-align
      // NOT forced
      resourceAreaHeaderInnerClass: 'p-2 text-sm',
      resourceAreaHeaderResizerClass: 'absolute inset-y-0 w-[5px] end-[-3px]',

      resourceAreaDividerClass: `border-s ${params.strongBorderColorClass}`,

      // For both resources & resource groups
      resourceAreaRowClass: `border ${params.borderColorClass}`,

      resourceGroupHeaderClass: params.faintBgClass,
      resourceGroupHeaderInnerClass: 'p-2 text-sm',
      resourceGroupLaneClass: `border ${params.borderColorClass} ${params.faintBgClass}`,

      resourceCellClass: `border ${params.borderColorClass}`,
      resourceCellInnerClass: 'p-2 text-sm',

      // FORCED flex-row
      resourceIndentClass: 'ms-1 -me-1.5 items-center',

      resourceExpanderClass: [
        'p-1 rounded-full flex flex-row group',
        params.mutedHoverPressableClass,
        params.outlineWidthFocusClass,
        params.tertiaryOutlineColorClass,
      ],

      resourceLaneClass: `border ${params.borderColorClass}`,
      resourceLaneBottomClass: (data) => data.options.eventOverlap && 'h-2',

      // Non-resource Timeline
      timelineBottomClass: 'h-2',
    },
    views: {
      timeline: {
        rowEventClass: (data) => data.isEnd && 'me-px',

        rowEventInnerClass: (data) => data.options.eventOverlap ? 'py-1' : 'py-2',

        rowMoreLinkClass: [
          'me-px mb-px rounded-sm',
          'border border-transparent print:border-black',
          `${params.strongSolidPressableClass} print:bg-white`,
        ],
        rowMoreLinkInnerClass: 'p-1 text-xs',

        slotLabelAlign: (data) => ( // h-align
          (data.level || data.isTime)
            // pill OR time
            ? 'start'
            // other
            : 'center'
        ),
        slotLabelSticky: '0.5rem', // for pill

        // FORCE flex-col
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
              )
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
                  ? 'pb-3 relative -start-3'
                  // day-header inner
                  : 'py-2',
                data.hasNavLink && 'hover:underline',
              )
        ],

        slotLabelDividerClass: `border-b ${params.borderColorClass}`,
      },
      resourceTimeGrid: resourceDayHeaderClasses,
      resourceDayGrid: resourceDayHeaderClasses,
    },
  }
}
