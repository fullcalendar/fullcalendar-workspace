import { CalendarOptions, ViewOptions } from '@fullcalendar/core'
import { EventCalendarOptionParams, getDayHeaderClasses, getDayHeaderInnerClasses, solidMoreLinkBgClass, subtleBgColorClass } from './options-event-calendar.js'

// ambient types
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
      resourceDayHeaderClass: (data) => getDayHeaderClasses(data, params),
      resourceDayHeaderInnerClass: getDayHeaderInnerClasses,

      resourceAreaHeaderRowClass: `border ${params.borderColorClass}`,
      resourceAreaHeaderClass: `border ${params.borderColorClass} items-center`, // valign
      resourceAreaHeaderInnerClass: 'p-2 text-sm',

      resourceAreaDividerClass: `border-x ${params.borderColorClass} pl-0.5 ${subtleBgColorClass}`,

      // For both resources & resource groups
      resourceAreaRowClass: `border ${params.borderColorClass}`,

      resourceGroupHeaderClass: subtleBgColorClass,
      resourceGroupHeaderInnerClass: 'p-2 text-sm',
      resourceGroupLaneClass: `border ${params.borderColorClass} ${subtleBgColorClass}`,

      resourceCellClass: `border ${params.borderColorClass}`,
      resourceCellInnerClass: 'p-2 text-sm',

      resourceExpanderClass: 'self-center relative start-1 not-hover:opacity-65',

      resourceLaneClass: `border ${params.borderColorClass}`,
      resourceLaneBottomClass: (data) => !data.isCompact && 'pb-3',

      // Non-resource Timeline
      timelineBottomClass: 'pb-3',
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

        rowMoreLinkClass: `me-px p-px ${solidMoreLinkBgClass}`,
        rowMoreLinkInnerClass: 'p-0.5 text-xs',

        slotLabelClass: 'justify-center', // v-align
        slotLabelInnerClass: 'p-1 text-sm',
        slotLabelDividerClass: `border-b ${params.borderColorClass}`,

        nowIndicatorLabelClass: `top-0 -mx-[5px] border-x-[5px] border-x-transparent border-t-[6px] ${params.nowIndicatorBorderColorClass}`,
        nowIndicatorLineClass: `border-l ${params.nowIndicatorBorderColorClass}`,
      },
    },
  }
}
