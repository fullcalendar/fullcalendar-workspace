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
      resourceDayHeaderAlign: 'center',
      resourceDayHeaderClass: (data) => data.isMajor && `border ${params.strongBorderColorClass}`,
      resourceDayHeaderInnerClass: [
        'p-2 flex flex-row items-center text-sm',
        params.mutedFgClass,
      ],

      resourceAreaHeaderRowClass: `border ${params.borderColorClass}`,
      resourceAreaHeaderClass: `border ${params.borderColorClass} justify-center`,
      resourceAreaHeaderInnerClass: `p-2 ${params.strongFgClass} text-sm`,
      resourceAreaHeaderResizerClass: 'absolute inset-y-0 w-[5px] end-[-3px]',

      resourceAreaDividerClass: `border-s ${params.strongBorderColorClass}`,

      // For both resources & resource groups
      resourceAreaRowClass: `border ${params.borderColorClass}`,

      resourceGroupHeaderClass: params.mutedBgClass,
      resourceGroupHeaderInnerClass: `p-2 ${params.strongFgClass} text-sm`,
      resourceGroupLaneClass: `border ${params.borderColorClass} ${params.mutedBgClass}`,

      resourceCellClass: `border ${params.borderColorClass}`,
      resourceCellInnerClass: `p-2 ${params.strongFgClass} text-sm`,

      resourceIndentClass: 'ms-1 -me-1.5 items-center',
      resourceExpanderClass: [
        'group p-0.5 rounded-sm inline-flex flex-row',
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
        slotLabelAlign: (data) => data.isTime ? 'start' : 'center', // h-align
        slotLabelClass: (data) => [
          data.level > 0 && `border ${params.borderColorClass}`,
          'justify-center', // v-align
        ],
        slotLabelInnerClass: (data) => [
          `p-2 ${params.strongFgClass} text-sm`,
          data.isTime && 'relative -start-3',
          data.hasNavLink && 'hover:underline',
        ],
        slotLabelDividerClass: `border-t ${params.strongBorderColorClass} shadow-sm`,

        rowEventClass: (data) => data.isEnd && 'me-px',
        rowEventInnerClass: (data) => data.options.eventOverlap ? 'py-1' : 'py-2',

        rowMoreLinkClass: [
          'me-px mb-px border border-transparent print:border-black rounded-sm',
          `${params.strongSolidPressableClass} print:bg-white`,
        ],
        rowMoreLinkInnerClass: `p-1 ${params.strongFgClass} text-xs`,
      },
    },
  }
}
