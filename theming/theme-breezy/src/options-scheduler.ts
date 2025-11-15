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
      resourceAreaDividerClass: `border-s ${params.strongBorderColorClass}`,

      resourceAreaHeaderRowClass: `border ${params.borderColorClass}`,
      resourceAreaHeaderClass: `border ${params.mutedBorderColorClass} justify-center`, // v-align
      resourceAreaHeaderInnerClass: `p-2 ${params.fgClass} text-sm`,
      resourceAreaHeaderResizerClass: 'absolute inset-y-0 w-[5px] end-[-3px]',

      resourceAreaRowClass: `border ${params.borderColorClass}`,
      resourceCellClass: `border ${params.mutedBorderColorClass}`,
      resourceCellInnerClass: `p-2  ${params.fgClass} text-sm`,

      resourceGroupHeaderClass: params.mutedBgClass,
      resourceGroupHeaderInnerClass: `p-2 ${params.fgClass} text-sm`,

      resourceGroupLaneClass: `border ${params.borderColorClass} ${params.mutedBgClass}`,
      resourceLaneClass: `border ${params.borderColorClass}`,
      resourceLaneBottomClass: (data) => data.options.eventOverlap && 'h-2',

      // Non-resource Timeline
      timelineBottomClass: 'h-2',

      resourceIndentClass: 'ms-1 -me-1.5 items-center',

      resourceExpanderClass: [
        'group p-0.5 rounded-full inline-flex flex-row',
        params.mutedHoverPressableClass,
        params.outlineWidthFocusClass,
        params.primaryOutlineColorClass,
      ],

      // NOTE: border-color determined per-view below
      resourceDayHeaderClass: `border ${params.fgClass} text-sm/6 font-semibold`,
      resourceDayHeaderInnerClass: 'p-2',

      resourceDayHeaderAlign: 'center',
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
        slotLabelDividerClass: `border-t ${params.strongBorderColorClass} shadow-sm`,

        slotLabelRowClass: `border ${params.borderColorClass}`,

        slotLabelClass: (data) => [
          data.level > 0 && `border ${params.mutedBorderColorClass}`,
          'justify-end', // v-align
        ],
        slotLabelAlign: (data) => data.isTime ? 'start' : 'center', // h-align
        slotLabelInnerClass: (data) => [
          'px-3 py-2 text-xs',
          data.isTime && 'relative -start-4',
          data.hasNavLink && 'hover:underline'
        ],

        rowEventClass: (data) => data.isEnd && 'me-px',
        rowEventInnerClass: (data) => data.options.eventOverlap ? 'py-1' : 'py-2',

        rowMoreLinkClass: [
          'me-px mb-px border border-transparent print:border-black rounded-md',
          `${params.strongSolidPressableClass} print:bg-white`,
        ],
        rowMoreLinkInnerClass: `p-1 ${params.fgClass} text-xs`,
      },
    },
  }
}
