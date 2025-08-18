import { CalendarOptions, ViewOptions } from '@fullcalendar/core'
import { xxsTextClass, moreLinkBgClass, transparentPressableClass, EventCalendarOptionParams, majorBorderColorClass } from './options-event-calendar.js'

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
      resourceDayHeaderClass: (data) => [
        'items-center border',
        data.isMajor ? majorBorderColorClass : params.borderColorClass,
        data.isDisabled && params.disabledBgClass,
      ],
      resourceDayHeaderInnerClass: (data) => [
        'py-2 flex flex-col',
        data.isCompact ? xxsTextClass : 'text-sm',
      ],

      resourceAreaHeaderRowClass: `border ${params.borderColorClass}`,
      resourceAreaHeaderClass: `border ${params.borderColorClass} items-center`, // v-align
      resourceAreaHeaderInnerClass: 'p-2 text-sm',

      resourceAreaDividerClass: `border-s ${params.borderColorClass}`,

      // For both resources & resource groups
      resourceAreaRowClass: `border ${params.borderColorClass}`,

      resourceGroupHeaderClass: params.disabledBgClass,
      resourceGroupHeaderInnerClass: 'p-2 text-sm',
      resourceGroupLaneClass: `border ${params.borderColorClass} ${params.disabledBgClass}`,

      resourceCellClass: `border ${params.borderColorClass}`,
      resourceCellInnerClass: 'p-2 text-sm',

      resourceExpanderClass: [
        'self-center w-6 h-6 flex flex-row items-center justify-center rounded-full text-sm relative start-1',
        transparentPressableClass,
      ],

      resourceLaneClass: `border ${params.borderColorClass}`,
      resourceLaneBottomClass: (data) => !data.isCompact && 'pb-3',

      // Non-resource Timeline
      timelineBottomClass: 'pb-3',
    },
    views: {
      timeline: {
        rowEventClass: 'me-px',
        rowEventInnerClass: 'gap-1',

        rowMoreLinkClass: `me-px p-px ${moreLinkBgClass}`,
        rowMoreLinkInnerClass: 'p-0.5 text-xs',

        slotLabelSticky: '0.5rem',
        slotLabelClass: (data) => (data.level && !data.isTime)
          ? [
            'border border-transparent',
            'justify-start',
          ]
          : [
            `border ${params.borderColorClass}`,
            'h-2 self-end justify-end',
          ],
        slotLabelInnerClass: (data) => (data.level && !data.isTime)
          ? [
            // TODO: converge with week-label styles
            'px-2 py-1 rounded-full text-sm',
            params.pillClass({ hasNavLink: data.hasNavLink }),
          ]
          : 'pb-3 -ms-1 text-sm min-w-14',
          // TODO: also test lowest-level days

        slotLabelDividerClass: `border-b ${params.borderColorClass}`,
      },
    },
  }
}
