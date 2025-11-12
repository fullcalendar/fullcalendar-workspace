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
      resourceAreaDividerClass: `border-l ${params.strongBorderColorClass}`,

      resourceAreaHeaderRowClass: `border ${params.borderColorClass}`,
      resourceAreaHeaderClass: `border ${params.mutedBorderColorClass} justify-center`, // v-align
      resourceAreaHeaderInnerClass: `p-2 text-sm ${params.fgClass}`,
      resourceAreaHeaderResizerClass: 'absolute inset-y-0 w-[5px] end-[-3px]',

      resourceAreaRowClass: `border ${params.borderColorClass}`,
      resourceCellClass: `border ${params.mutedBorderColorClass}`,
      resourceCellInnerClass: `p-2 text-sm ${params.fgClass}`,

      resourceGroupHeaderClass: params.mutedBgClass,
      resourceGroupHeaderInnerClass: `p-2 text-sm ${params.fgClass}`,

      resourceGroupLaneClass: `border ${params.borderColorClass} ${params.mutedBgClass}`,
      resourceLaneClass: `border ${params.borderColorClass}`,
      resourceLaneBottomClass: (data) => [
        data.options.eventOverlap && 'h-2',
      ],

      timelineBottomClass: 'h-2',

      resourceIndentClass: 'items-center ms-1 -me-1.5',
      resourceExpanderClass: [
        'inline-flex flex-row p-0.5 rounded-full group',
        params.mutedHoverPressableClass,
        params.primaryOutlineColorClass,
        params.outlineWidthFocusClass,
      ],

      // TODO: DRY with getDayHeaderClass?
      // NOTE: border-color determined per-view below
      resourceDayHeaderClass: (data) => [
        `border text-sm/6`,
        data.level
          ? `font-semibold ${params.fgClass}` // resource-above-dates
          : params.mutedFgClass,
      ],
      resourceDayHeaderInnerClass: 'p-2',

      resourceDayHeaderAlign: 'center', // best place?
    },
    views: {
      resourceDayGrid: {
        resourceDayHeaderClass: (data) => [
          data.isMajor
            ? params.strongBorderColorClass
            : params.borderColorClass,
        ],
      },
      resourceTimeGrid: {
        resourceDayHeaderClass: (data) => [
          data.isMajor
            ? params.strongBorderColorClass
            : params.mutedBorderColorClass,
        ],
      },
      timeline: {
        slotLabelDividerClass: `border-t ${params.strongBorderColorClass} shadow-sm`,

        slotLabelRowClass: `border ${params.borderColorClass}`,

        slotLabelClass: (data) => [
          'justify-end', // v-align-content (best for one-line with too much v space)
          data.level > 0 && `border ${params.mutedBorderColorClass}`,
        ],
        slotLabelAlign: (data) => data.isTime ? 'start' : 'center', // h-align-content
        slotLabelInnerClass: (data) => [
          'px-3 py-2',
          data.isTime && 'relative -start-4',
          data.hasNavLink && 'hover:underline'
        ],

        rowEventClass: 'me-px mb-px',
        rowEventInnerClass: (data) => [
          data.options.eventOverlap ? 'py-1' : 'py-2',
        ],

        // TODO: keep DRY with columnMoreLink
        rowMoreLinkClass: (data) => [
          `me-px mb-px ${params.strongSolidPressableClass} border border-transparent print:border-black print:bg-white`,
          data.isNarrow ? 'rounded-sm' : 'rounded-md', // needed? isn't isNarrow always false in timeline?
        ],
        rowMoreLinkInnerClass: `p-1 text-xs ${params.fgClass}`,
      },
    },
  }
}
