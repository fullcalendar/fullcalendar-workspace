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
  // TODO: fix color for expander icon
  // TODO: should all datagrid text color be high?

  return {
    optionDefaults: {
      resourceAreaDividerClass: `border-l ${params.borderHighColorClass}`,

      resourceAreaHeaderRowClass: `border ${params.borderMidColorClass}`,
      resourceAreaHeaderClass: `border ${params.borderLowColorClass}`,
      resourceAreaHeaderInnerClass: `p-2 text-sm ${params.textHighColorClass}`,

      resourceAreaRowClass: `border ${params.borderMidColorClass}`,
      resourceCellClass: `border ${params.borderLowColorClass}`,
      resourceCellInnerClass: `p-2 text-sm ${params.textHighColorClass}`,

      resourceGroupHeaderClass: params.mutedBgClass,
      resourceGroupHeaderInnerClass: `p-2 text-sm ${params.textHighColorClass}`,

      resourceGroupLaneClass: `border ${params.borderMidColorClass} ${params.mutedBgClass}`,
      resourceLaneClass: `border ${params.borderMidColorClass}`,
      // resourceLaneTopClass: 'h-0.5',
      // resourceLaneBottomClass: 'h-1', // fix BUG, why this need to be so thick?

      resourceExpanderClass: `self-center ${params.textHighColorClass}`,

      // TODO: weird
      resourceDayHeaderClass: (data) => [
        `border ${params.borderMidColorClass} text-sm/6`,
        data.level
          ? `font-semibold ${params.textHighColorClass}` // resource-above-dates
          : params.textMidColorClass,
      ],
      resourceDayHeaderInnerClass: 'p-2',

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
