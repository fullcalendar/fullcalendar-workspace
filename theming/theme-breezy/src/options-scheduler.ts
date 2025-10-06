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
      resourceAreaDividerClass: `border-l ${params.strongBorderColorClass}`,

      resourceAreaHeaderRowClass: `border ${params.borderColorClass}`,
      resourceAreaHeaderClass: `border ${params.mutedBorderColorClass}`,
      resourceAreaHeaderInnerClass: `p-2 text-sm ${params.fgClass}`,

      resourceAreaRowClass: `border ${params.borderColorClass}`,
      resourceCellClass: `border ${params.mutedBorderColorClass}`,
      resourceCellInnerClass: `p-2 text-sm ${params.fgClass}`,

      resourceGroupHeaderClass: params.mutedBgClass,
      resourceGroupHeaderInnerClass: `p-2 text-sm ${params.fgClass}`,

      resourceGroupLaneClass: `border ${params.borderColorClass} ${params.mutedBgClass}`,
      resourceLaneClass: `border ${params.borderColorClass}`,
      resourceLaneBottomClass: 'h-3',

      resourceIndentClass: 'items-center ms-1 -me-1',
      resourceExpanderClass: params.fgClass,

      // TODO: weird
      resourceDayHeaderClass: (data) => [
        `border text-sm/6`,
        data.isMajor
          ? params.strongBorderColorClass
          : params.borderColorClass,
        data.level
          ? `font-semibold ${params.fgClass}` // resource-above-dates
          : params.mutedFgClass,
      ],
      resourceDayHeaderInnerClass: 'p-2',

      resourceDayHeaderAlign: 'center', // best place?
    },
    views: {
      timeline: {
        slotLabelDividerClass: `border-t ${params.strongBorderColorClass} shadow-sm`,

        slotLabelAlign: 'center',
        slotLabelClass: 'justify-end',
        slotLabelInnerClass: '-ms-1 pe-6 py-2',
        //^^^wait, we don't want do this this for upper-level slot labels

        rowEventClass: 'me-px mb-px',

        // TODO: keep DRY with columnMoreLink
        rowMoreLinkClass: (data) => [
          `relative me-px mb-px p-px ${params.bgClass}`,
          data.isCompact ? 'rounded-sm' : 'rounded-md', // needed? isn't isCompact always false in timeline?
        ],
        rowMoreLinkColorClass: (data) => [
          `absolute z-0 inset-0 ${params.strongBgClass} print:bg-white print:border print:border-black`,
          data.isCompact ? 'rounded-sm' : 'rounded-md', // needed? isn't isCompact always false in timeline?
        ],
        rowMoreLinkInnerClass: `z-1 p-0.5 text-xs/4 ${params.fgClass}`,
      },
    },
  }
}
