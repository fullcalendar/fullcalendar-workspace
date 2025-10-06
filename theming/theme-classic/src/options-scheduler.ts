import { CalendarOptions, ViewOptions } from '@fullcalendar/core'
import { EventCalendarOptionParams, getDayHeaderClasses, getDayHeaderInnerClasses } from './options-event-calendar.js'

// ambient types (tsc strips during build because of {})
import {} from '@fullcalendar/timeline'
import {} from '@fullcalendar/resource-daygrid'
import {} from '@fullcalendar/resource-timegrid'
import {} from '@fullcalendar/resource-timeline'
import {} from '@fullcalendar/adaptive'
import {} from '@fullcalendar/scrollgrid'

const continuationArrowClass = 'relative z-10 mx-px border-y-[5px] border-y-transparent opacity-50'

export function createSchedulerOnlyOptions(params: EventCalendarOptionParams): {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} {
  return {
    optionDefaults: {
      resourceDayHeaderAlign: 'center',
      resourceDayHeaderClass: (data) => getDayHeaderClasses(data, params),
      resourceDayHeaderInnerClass: getDayHeaderInnerClasses,

      resourceAreaHeaderRowClass: `border ${params.borderColorClass}`,
      resourceAreaHeaderClass: `border ${params.borderColorClass} items-center`, // valign
      resourceAreaHeaderInnerClass: 'p-2 text-sm',

      resourceAreaDividerClass: `border-x ${params.borderColorClass} pl-0.5 ${params.mutedBgClass}`,

      // For both resources & resource groups
      resourceAreaRowClass: `border ${params.borderColorClass}`,

      resourceGroupHeaderClass: params.mutedWashClass,
      resourceGroupHeaderInnerClass: 'p-2 text-sm',
      resourceGroupLaneClass: `border ${params.borderColorClass} ${params.mutedWashClass}`,

      resourceCellClass: `border ${params.borderColorClass}`,
      resourceCellInnerClass: 'p-2 text-sm',

      resourceIndentClass: 'ms-2 -me-1 items-center',
      resourceExpanderClass: 'not-hover:opacity-65',

      resourceLaneClass: `border ${params.borderColorClass}`,
      resourceLaneBottomClass: (data) => !data.isCompact && 'h-3',

      // Non-resource Timeline
      timelineBottomClass: 'h-3',
    },
    views: {
      timeline: {
        rowEventClass: 'me-px items-center', // v-align with continuation arrows
        rowEventBeforeClass: (data) => !data.isStartResizable && [
          continuationArrowClass,
          'border-e-[5px] border-e-black',
        ],
        rowEventAfterClass: (data) => !data.isEndResizable && [
          continuationArrowClass,
          'border-s-[5px] border-s-black',
        ],
        rowEventInnerClass: (data) => [
          'px-px gap-1', // more h-space than daygrid
          data.isSpacious ? 'py-1' : 'py-px',
        ],

        // TODO: keep DRY with columnMoreLink
        rowMoreLinkClass: `relative me-px mb-px p-px ${params.bgClass}`,
        rowMoreLinkColorClass: `absolute z-0 inset-0 ${params.strongBgClass} print:bg-white print:border print:border-black`,
        rowMoreLinkInnerClass: 'z-10 p-0.5 text-xs',

        slotLabelAlign: (data) => data.isTime ? 'start' : 'center', // h-align
        slotLabelClass: 'justify-center', // v-align
        slotLabelInnerClass: 'p-1 text-sm',
        slotLabelDividerClass: `border-b ${params.borderColorClass}`,

        nowIndicatorLabelClass: `top-0 -mx-[5px] border-x-[5px] border-x-transparent border-t-[6px] ${params.nowBorderColorClass}`,
        nowIndicatorLineClass: `border-l ${params.nowBorderColorClass}`,
      },
    },
  }
}
