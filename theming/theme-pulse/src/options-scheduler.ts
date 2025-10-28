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
        // are all these paddings okay?
        'px-2 py-2 flex flex-row items-center',
        'text-sm',
        params.mutedFgClass,
      ],

      resourceAreaHeaderRowClass: `border ${params.borderColorClass}`,
      resourceAreaHeaderClass: `border ${params.borderColorClass} justify-center`,
      resourceAreaHeaderInnerClass: `p-2 text-sm ${params.strongFgClass}`,
      resourceAreaHeaderResizerClass: 'absolute top-0 bottom-0 w-[5px] end-[-3px]',

      resourceAreaDividerClass: `border-x ${params.borderColorClass} pl-0.5 ${params.mutedBgClass}`,

      // For both resources & resource groups
      resourceAreaRowClass: `border ${params.borderColorClass}`,

      resourceGroupHeaderClass: params.mutedBgClass,
      resourceGroupHeaderInnerClass: `p-2 text-sm ${params.strongFgClass}`,
      resourceGroupLaneClass: `border ${params.borderColorClass} ${params.mutedBgClass}`,

      resourceCellClass: `border ${params.borderColorClass}`,
      resourceCellInnerClass: `p-2 text-sm ${params.strongFgClass}`,

      resourceIndentClass: 'items-center ms-1 -me-1.5',
      resourceExpanderClass: [
        'inline-flex flex-row p-0.5 rounded-sm group',
        params.mutedHoverPressableClass,
        params.tertiaryOutlineColorClass,
        params.outlineWidthFocusClass,
      ],

      resourceLaneClass: `border ${params.borderColorClass}`,
      resourceLaneBottomClass: (data) => !data.isCompact && 'h-3',

      // Non-resource Timeline
      timelineBottomClass: 'h-3',
    },
    views: {
      timeline: {
        slotLabelAlign: (data) => data.isTime ? 'start' : 'center', // h-align
        slotLabelClass: 'justify-center', // v-align
        slotLabelInnerClass: (data) => [
          `p-2 text-sm ${params.strongFgClass}`,
          data.isTime && 'relative -start-3',
          data.hasNavLink && 'hover:underline',
        ],
        slotLabelDividerClass: `border-b ${params.borderColorClass} shadow-sm`,

        // best place for this?
        rowEventClass: 'me-px mb-px',

        // TODO: keep DRY with columnMoreLink
        rowMoreLinkClass: `me-px mb-px rounded-sm ${params.strongSolidPressableClass} border border-transparent print:border-black print:bg-white`,
        rowMoreLinkInnerClass: `p-0.5 text-xs ${params.strongFgClass}`,
      },
    },
  }
}
