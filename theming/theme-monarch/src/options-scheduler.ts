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
  return {
    optionDefaults: {
      resourceDayHeaderAlign: 'center',
      resourceDayHeaderClass: (data) => [
        'items-center border',
        data.isMajor ? params.strongBorderColorClass : params.borderColorClass,
        data.isDisabled && params.faintBgClass,
      ],
      resourceDayHeaderInnerClass: (data) => [
        'p-2 flex flex-col',
        data.isNarrow ? xxsTextClass : 'text-sm',
      ],

      resourceAreaHeaderRowClass: `border ${params.borderColorClass}`,
      resourceAreaHeaderClass: `border ${params.borderColorClass} justify-center`, // v-align
      resourceAreaHeaderInnerClass: 'p-2 text-sm',
      resourceAreaHeaderResizerClass: 'absolute top-0 bottom-0 w-[5px] end-[-3px]',

      resourceAreaDividerClass: `border-s ${params.borderColorClass}`,

      // For both resources & resource groups
      resourceAreaRowClass: `border ${params.borderColorClass}`,

      resourceGroupHeaderClass: params.faintBgClass,
      resourceGroupHeaderInnerClass: 'p-2 text-sm',
      resourceGroupLaneClass: `border ${params.borderColorClass} ${params.faintBgClass}`,

      resourceCellClass: `border ${params.borderColorClass}`,
      resourceCellInnerClass: 'p-2 text-sm',

      resourceIndentClass: 'ms-1 -me-1.5 items-center',
      resourceExpanderClass: [
        'p-1 rounded-full group flex flex-row',
        params.mutedHoverPressableClass,
        params.tertiaryOutlineColorClass,
        params.outlineWidthFocusClass,
      ],

      resourceLaneClass: `border ${params.borderColorClass}`,
      resourceLaneBottomClass: (data) => data.options.eventOverlap && 'h-3',

      // Non-resource Timeline
      timelineBottomClass: 'h-3',
    },
    views: {
      timeline: {
        rowEventClass: (data) => [
          data.isEnd && 'me-px',
        ],

        rowEventInnerClass: (data) => [
          'px-1 gap-1',
          !data.options.eventOverlap ? 'py-1.5' : 'py-1', // extra v space
        ],

        rowMoreLinkClass: `me-px mb-px rounded-sm ${params.strongSolidPressableClass} border border-transparent print:border-black print:bg-white`,
        rowMoreLinkInnerClass: 'p-0.5 text-xs', // TODO: somehow add that "extra v space" ?

        slotLabelAlign: (data) => (data.level || data.isTime) ? 'start' : 'center',
        slotLabelSticky: '0.5rem', // for pill
        slotLabelClass: (data) => [
          'border',
          data.level
            // housing for pill
            ? 'border-transparent justify-start' // v-align-content
            : joinClassNames(
                params.borderColorClass,
                data.isTime
                  // time-tick
                  ? 'h-2 self-end justify-end' // v-align-self, v-align-content
                  // day-header
                  : 'justify-center', // v-align-content
              )
        ],
        slotLabelInnerClass: (data) => [
          'text-sm',
          data.level
            ? joinClassNames( // pill
                'px-2 py-1 my-0.5 rounded-full',
                data.hasNavLink
                  ? params.secondaryPressableClass
                  : params.secondaryClass,
              )
            : joinClassNames( // just text
                'px-2',
                data.isTime
                  ? 'pb-3 relative -start-3'
                  : 'py-2',
                data.hasNavLink && 'hover:underline',
              )
        ],

        slotLabelDividerClass: `border-b ${params.borderColorClass}`,
      },
      resourceTimeGrid: {
        dayHeaderDividerClass: `border-b ${params.borderColorClass}`, // TODO: DRY
        dayHeaderInnerClass: 'mb-2',
      },
      resourceDayGrid: {
        dayHeaderDividerClass: `border-b ${params.borderColorClass}`, // TODO: DRY
        dayHeaderInnerClass: 'mb-2',
      },
    },
  }
}
