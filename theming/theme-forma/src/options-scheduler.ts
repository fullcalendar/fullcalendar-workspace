import { CalendarOptions, ViewOptions } from '@fullcalendar/core'
import { EventCalendarOptionParams, getDayHeaderClasses, getDayHeaderInnerClasses } from './options-event-calendar.js'

// ambient types
// TODO: make these all peer deps? or wait, move options to just core
import '@fullcalendar/timeline'
import '@fullcalendar/resource-daygrid'
import '@fullcalendar/resource-timegrid'
import '@fullcalendar/resource-timeline'
import '@fullcalendar/adaptive'
import '@fullcalendar/scrollgrid'

// TODO: make these dependent on EventCalendarOptionParams
const borderColorClass = 'border-[#ddd] dark:border-gray-800'
const borderClass = `border ${borderColorClass}` // all sides
const moreLinkBgClass = 'bg-gray-300 dark:bg-gray-600'
const neutralBgClass = 'bg-gray-500/10'

export function createSchedulerOnlyOptions(params: EventCalendarOptionParams): {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} {
  return {
    optionDefaults: {
      resourceDayHeaderClass: getDayHeaderClasses,
      resourceDayHeaderInnerClass: (data) => getDayHeaderInnerClasses(data, params.primaryBorderColorClass),

      resourceAreaHeaderRowClass: borderClass,
      resourceAreaHeaderClass: `${borderClass} items-center`, // valign
      resourceAreaHeaderInnerClass: 'p-2 text-sm',

      resourceAreaDividerClass: `border-x ${borderColorClass} pl-0.5 ${neutralBgClass}`,

      // For both resources & resource groups
      resourceAreaRowClass: borderClass,

      resourceGroupHeaderClass: neutralBgClass,
      resourceGroupHeaderInnerClass: 'p-2 text-sm',
      resourceGroupLaneClass: [borderClass, neutralBgClass],

      resourceCellClass: borderClass,
      resourceCellInnerClass: 'p-2 text-sm',

      resourceExpanderClass: 'self-center relative -top-px start-1 opacity-65', // HACK: relative 1px shift up

      resourceLaneClass: borderClass,
      resourceLaneBottomClass: (data) => !data.isCompact && 'pb-3',

      // Non-resource Timeline
      timelineBottomClass: 'pb-3',
    },
    views: {
      timeline: {
        rowMoreLinkClass: `me-px p-px ${moreLinkBgClass}`,
        rowMoreLinkInnerClass: 'p-0.5 text-xs',

        slotLabelClass: 'justify-center',
        slotLabelInnerClass: 'p-1 text-sm',

        slotLabelDividerClass: `border-b ${borderColorClass}`,
      },
    }
  }
}
