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
      resourceAreaDividerClass: `border-l ${params.borderHighColorClass}`,

      resourceAreaHeaderRowClass: `border ${params.borderMedColorClass}`,
      resourceAreaHeaderClass: `border ${params.borderLowColorClass}`,
      resourceAreaHeaderInnerClass: 'p-2 text-sm',

      resourceAreaRowClass: `border ${params.borderMedColorClass}`,
      resourceCellClass: `border ${params.borderLowColorClass}`,
      resourceCellInnerClass: 'p-2 text-sm',

      resourceGroupHeaderClass: 'bg-gray-50',
      resourceGroupHeaderInnerClass: 'p-2 text-sm',

      resourceGroupLaneClass: `border ${params.borderMedColorClass} bg-gray-50`,
      resourceLaneClass: `border ${params.borderMedColorClass}`,
      // resourceLaneTopClass: 'h-0.5',
      // resourceLaneBottomClass: 'h-1', // fix BUG, why this need to be so thick?

      resourceExpanderClass: 'self-center',

      resourceDayHeaderAlign: 'center', // best place?
    },
    views: {
      timeline: {
        slotLabelDividerClass: `border-t ${params.borderHighColorClass}`,

        slotLabelAlign: 'center',
        slotLabelClass: 'justify-end',
        slotLabelInnerClass: '-ms-1 pe-6 py-2',
        //^^^wait, we don't want do this this for upper-level slot labels

        rowEventClass: 'mb-px',
      },
    },
  }
}
