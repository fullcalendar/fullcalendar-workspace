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

// TODO: DRY
const neutralBgClass = 'bg-gray-500/10'
const borderColorClass = 'border-[#ddd] dark:border-gray-800'
const borderClass = `border ${borderColorClass}` // all sides
const continuationArrowClass = 'relative z-10 mx-px border-y-[5px] border-y-transparent opacity-50'
const moreLinkBgClass = 'bg-gray-300 dark:bg-gray-600'

export function createSchedulerOnlyOptions({}: EventCalendarOptionParams): {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} {
  return {
    optionDefaults: {
      resourceDayHeaderClass: getDayHeaderClasses,
      resourceDayHeaderInnerClass: getDayHeaderInnerClasses,

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

      // TODO: move this to ui-default. same with other themes
      resourceExpanderClass: 'self-center relative -top-px start-1 opacity-65', // HACK: relative 1px shift up

      resourceLaneClass: borderClass,
      resourceLaneBottomClass: (data) => !data.isCompact && 'pb-3',

      // Non-resource Timeline
      timelineBottomClass: 'pb-3',
    },
    views: {
      timeline: {
        rowEventClass: [
          'me-px', // space from slot line
          'items-center', // for aligning continuation arrows
        ],
        rowEventBeforeClass: (data) => !data.isStartResizable && [
          continuationArrowClass,
          'border-e-[5px] border-e-black', // pointing to start
        ],
        rowEventAfterClass: (data) => !data.isEndResizable && [
          continuationArrowClass,
          'border-s-[5px] border-s-black', // pointing to end
        ],
        rowEventInnerClass: (data) => [
          'px-px gap-1', // TODO: put the gap on the global rowEventInnerClass???
          data.isSpacious ? 'py-1' : 'py-px',
        ],

        rowMoreLinkClass: `me-px p-px ${moreLinkBgClass}`,
        rowMoreLinkInnerClass: 'p-0.5 text-xs',

        slotLabelClass: 'justify-center',
        slotLabelInnerClass: 'p-1 text-sm',

        slotLabelDividerClass: `border-b ${borderColorClass}`,

        nowIndicatorLabelClass: 'top-0 -mx-[5px] border-x-[5px] border-x-transparent border-t-[6px] border-t-red-500',
        nowIndicatorLineClass: 'border-l border-red-500',
      },
    },
  }
}
