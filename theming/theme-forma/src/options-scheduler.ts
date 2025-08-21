import { CalendarOptions, ViewOptions } from '@fullcalendar/core'
import { EventCalendarOptionParams } from './options-event-calendar.js'

// ambient types
// TODO: make these all peer deps? or wait, move options to just core
import '@fullcalendar/timeline'
import '@fullcalendar/resource-daygrid'
import '@fullcalendar/resource-timegrid'
import '@fullcalendar/resource-timeline'
import '@fullcalendar/adaptive'
import '@fullcalendar/scrollgrid'

// TODO: make these dependent on EventCalendarOptionParams
const moreLinkBgClass = 'bg-gray-300 dark:bg-gray-600'
const neutralBgColorClass = 'bg-gray-500/10'
const xxsTextClass = 'text-[0.7rem]/[1.25]'

export const majorBorderColorClass = 'border-gray-400 dark:border-gray-700'

export function createSchedulerOnlyOptions(params: EventCalendarOptionParams): {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} {
  // TODO: DRY
  const borderClass = `border ${params.borderColorClass}`
  const majorBorderClass = `border ${majorBorderColorClass}`

  return {
    optionDefaults: {

      // TODO: more DRY with dayHeader* ?
      resourceDayHeaderClass: (data) => [
        data.isMajor ? majorBorderClass : borderClass,
        data.isDisabled && neutralBgColorClass,
      ],
      resourceDayHeaderInnerClass: (data) => [
        'flex flex-col',
        'p-2', // TODO: adjust padding when isCompact?
        data.isCompact ? xxsTextClass : 'text-xs',
      ],

      resourceAreaHeaderRowClass: borderClass,
      resourceAreaHeaderClass: `${borderClass} items-center`, // valign
      resourceAreaHeaderInnerClass: 'p-2 text-sm',

      resourceAreaDividerClass: `border-x ${params.borderColorClass} pl-0.5 ${neutralBgColorClass}`,

      // For both resources & resource groups
      resourceAreaRowClass: borderClass,

      resourceGroupHeaderClass: neutralBgColorClass,
      resourceGroupHeaderInnerClass: 'p-2 text-sm',
      resourceGroupLaneClass: [borderClass, neutralBgColorClass],

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

        slotLabelDividerClass: `border-b ${params.borderColorClass}`,
      },
    }
  }
}
