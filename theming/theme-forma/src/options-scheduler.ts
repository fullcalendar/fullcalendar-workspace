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

      // TODO: more DRY with dayHeader* ?
      resourceDayHeaderClass: (data) => [
        data.isMajor ? `border ${params.majorBorderColorClass}` : `border ${params.borderColorClass}`,
        data.isDisabled && params.mutedBgClass,
      ],
      resourceDayHeaderInnerClass: (data) => [
        'flex flex-col',
        'p-2', // TODO: adjust padding when isCompact?
        data.isCompact ? xxsTextClass : 'text-xs',
      ],

      resourceAreaHeaderRowClass: `border ${params.borderColorClass}`,
      resourceAreaHeaderClass: `border ${params.borderColorClass} items-center`, // valign
      resourceAreaHeaderInnerClass: 'p-2 text-sm',

      resourceAreaDividerClass: `border-x ${params.borderColorClass} pl-0.5 ${params.mutedBgClass}`,

      // For both resources & resource groups
      resourceAreaRowClass: `border ${params.borderColorClass}`,

      resourceGroupHeaderClass: params.mutedBgClass,
      resourceGroupHeaderInnerClass: 'p-2 text-sm',
      resourceGroupLaneClass: [`border ${params.borderColorClass}`, params.mutedBgClass],

      resourceCellClass: `border ${params.borderColorClass}`,
      resourceCellInnerClass: 'p-2 text-sm',

      resourceIndentClass: 'items-center ms-1 -me-1',
      resourceExpanderClass: 'opacity-65',

      resourceLaneClass: `border ${params.borderColorClass}`,
      resourceLaneBottomClass: (data) => !data.isCompact && 'h-3',

      // Non-resource Timeline
      timelineBottomClass: 'h-3',
    },
    views: {
      timeline: {
        // TODO: keep DRY with columnMoreLink
        rowMoreLinkClass: `relative me-px mb-px p-px ${params.bgColorClass}`,
        rowMoreLinkColorClass: `z-0 absolute inset-0 ${params.neutralBgClass} print:bg-white print:border print:border-black`,
        rowMoreLinkInnerClass: 'z-10 p-0.5 text-xs',

        slotLabelClass: 'justify-center',
        slotLabelInnerClass: 'p-1 text-sm',

        slotLabelDividerClass: `border-b ${params.borderColorClass}`,
      },
    }
  }
}
