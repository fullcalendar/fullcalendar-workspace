import { CalendarOptions, ViewOptions } from '@fullcalendar/core'
import { EventCalendarOptionParams, xxsTextClass } from './options-event-calendar.js'

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

      resourceDayHeaderClass: (data) => [
        'border',
        data.isMajor ? params.strongBorderColorClass : params.borderColorClass,
        data.isDisabled && params.mutedBgClass,
      ],
      resourceDayHeaderInnerClass: (data) => [
        'p-2 flex flex-col',
        data.isNarrow ? xxsTextClass : 'text-xs',
      ],

      resourceAreaHeaderRowClass: `border ${params.borderColorClass}`,

      resourceAreaHeaderClass: `border ${params.borderColorClass} justify-center`, // v-align
      resourceAreaHeaderInnerClass: 'p-2 text-sm',
      resourceAreaHeaderResizerClass: 'absolute inset-y-0 w-[5px] end-[-3px]',

      resourceAreaDividerClass: `border-x ${params.borderColorClass} ps-0.5 ${params.mutedBgClass}`,

      // For both resources & resource groups
      resourceAreaRowClass: `border ${params.borderColorClass}`,

      resourceGroupHeaderClass: params.mutedBgClass,
      resourceGroupHeaderInnerClass: 'p-2 text-sm',
      resourceGroupLaneClass: `border ${params.borderColorClass} ${params.mutedBgClass}`,

      resourceCellClass: `border ${params.borderColorClass}`,
      resourceCellInnerClass: 'p-2 text-sm',

      resourceIndentClass: 'ms-1 -me-1.5 items-center',

      resourceExpanderClass: [
        'p-0.5 rounded-sm inline-flex flex-row group',
        params.mutedHoverPressableClass,
        params.outlineWidthFocusClass,
        params.primaryOutlineColorClass,
      ],

      resourceLaneClass: `border ${params.borderColorClass}`,
      resourceLaneBottomClass: (data) => data.options.eventOverlap && 'h-2.5',

      // Non-resource Timeline
      timelineBottomClass: 'h-2.5',
    },
    views: {
      timeline: {
        rowEventClass: (data) => data.isEnd && 'me-px',
        rowEventInnerClass: (data) => (
          data.options.eventOverlap
            ? 'py-[0.1875rem]' // usually 3px
            : 'py-2'
        ),

        rowMoreLinkClass: [
          'me-px mb-px rounded-sm border border-transparent print:border-black',
          `${params.strongSolidPressableClass} print:bg-white`,
        ],
        rowMoreLinkInnerClass: 'px-1 py-[0.1875rem] text-xs',

        slotLabelClass: 'justify-center', // v-align
        slotLabelAlign: (data) => data.isTime ? 'start' : 'center', // h-align
        slotLabelInnerClass: (data) => [
          'p-2 text-sm',
          data.hasNavLink && 'hover:underline',
        ],

        slotLabelDividerClass: `border-b ${params.borderColorClass}`,
      },
    }
  }
}
