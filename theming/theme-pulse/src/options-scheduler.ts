import { CalendarOptions, ViewOptions } from '@fullcalendar/core'
import { EventCalendarOptionParams, getDayHeaderInnerClasses } from './options-event-calendar.js'

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
      resourceDayHeaderClass: (data) => data.isMajor && `border ${params.majorBorderColorClass}`,
      resourceDayHeaderInnerClass: (data) => [
        ...getDayHeaderInnerClasses(data),
        'text-sm',
        params.mutedExtraTextClass,
      ],

      resourceAreaHeaderRowClass: `border ${params.borderColorClass}`,
      resourceAreaHeaderClass: `border ${params.borderColorClass} items-center`, // valign
      resourceAreaHeaderInnerClass: `p-2 text-sm ${params.nonMutedTextClass}`,

      resourceAreaDividerClass: `border-x ${params.borderColorClass} pl-0.5 ${params.mutedTransparentBgClass}`,

      // For both resources & resource groups
      resourceAreaRowClass: `border ${params.borderColorClass}`,

      resourceGroupHeaderClass: params.mutedTransparentBgClass,
      resourceGroupHeaderInnerClass: `p-2 text-sm ${params.nonMutedTextClass}`,
      resourceGroupLaneClass: `border ${params.borderColorClass} ${params.mutedTransparentBgClass}`,

      resourceCellClass: `border ${params.borderColorClass}`,
      resourceCellInnerClass: `p-2 text-sm ${params.nonMutedTextClass}`,

      resourceIndentClass: 'items-center ms-1 -me-1',
      resourceExpanderClass: `not-hover:opacity-65 ${params.nonMutedTextClass}`,

      resourceLaneClass: `border ${params.borderColorClass}`,
      resourceLaneBottomClass: (data) => !data.isCompact && 'h-3',

      // Non-resource Timeline
      timelineBottomClass: 'h-3',
    },
    views: {
      timeline: {
        slotLabelAlign: (data) => data.isTime ? 'start' : 'center', // h-align
        slotLabelClass: 'justify-center', // v-align
        slotLabelInnerClass: `p-1 text-sm ${params.nonMutedTextClass}`,
        slotLabelDividerClass: `border-b ${params.borderColorClass} shadow-sm`,

        // best place for this?
        rowEventClass: 'me-px mb-px',

        // TODO: keep DRY with columnMoreLink
        rowMoreLinkClass: `relative me-px mb-px p-px rounded-sm ${params.bgColorClass}`,
        rowMoreLinkColorClass: `absolute z-0 inset-0 rounded-sm ${params.neutralBgClass} print:bg-white print:border print:border-black`,
        rowMoreLinkInnerClass: `z-10 p-0.5 text-xs ${params.nonMutedTextClass}`,
      },
    },
  }
}
