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
      resourceDayHeaderInnerClass: (data) => [
        ...getDayHeaderInnerClasses(data),
        'text-sm',
        params.mutedExtraTextClass,
      ],

      resourceAreaHeaderRowClass: `border ${params.borderColorClass}`,
      resourceAreaHeaderClass: `border ${params.borderColorClass} items-center`, // valign
      resourceAreaHeaderInnerClass: 'p-2 text-sm',

      resourceAreaDividerClass: `border-x ${params.borderColorClass} pl-0.5 ${params.mutedTransparentBgClass}`,

      // For both resources & resource groups
      resourceAreaRowClass: `border ${params.borderColorClass}`,

      resourceGroupHeaderClass: params.mutedTransparentBgClass,
      resourceGroupHeaderInnerClass: 'p-2 text-sm',
      resourceGroupLaneClass: `border ${params.borderColorClass} ${params.mutedTransparentBgClass}`,

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
        slotLabelAlign: (data) => data.isTime ? 'start' : 'center', // h-align
        slotLabelClass: 'justify-center', // v-align
        slotLabelInnerClass: 'p-1 text-sm',
        slotLabelDividerClass: `border-b ${params.borderColorClass}`,
      },
    },
  }
}
