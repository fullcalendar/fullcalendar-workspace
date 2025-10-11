import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'
import { xxsTextClass, EventCalendarOptionParams } from './options-event-calendar.js'

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
      resourceDayHeaderClass: (data) => [
        'items-center border',
        data.isMajor ? params.strongBorderColorClass : params.borderColorClass,
        data.isDisabled && params.faintBgClass,
      ],
      resourceDayHeaderInnerClass: (data) => [
        'p-2 flex flex-col',
        data.isCompact ? xxsTextClass : 'text-sm',
      ],

      resourceAreaHeaderRowClass: `border ${params.borderColorClass}`,
      resourceAreaHeaderClass: `border ${params.borderColorClass} items-center`, // v-align
      resourceAreaHeaderInnerClass: 'p-2 text-sm',

      resourceAreaDividerClass: `border-s ${params.borderColorClass}`,

      // For both resources & resource groups
      resourceAreaRowClass: `border ${params.borderColorClass}`,

      resourceGroupHeaderClass: params.faintBgClass,
      resourceGroupHeaderInnerClass: 'p-2 text-sm',
      resourceGroupLaneClass: `border ${params.borderColorClass} ${params.faintBgClass}`,

      resourceCellClass: `border ${params.borderColorClass}`,
      resourceCellInnerClass: 'p-2 text-sm',

      resourceIndentClass: 'ms-1 -me-1 items-center',
      resourceExpanderClass: [
        'w-6 h-6 flex flex-row items-center justify-center rounded-full text-sm',
        params.ghostPressableClass,
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
        rowEventClass: 'me-px',
        rowEventInnerClass: (data) => [
          'gap-0.5',
          data.isSpacious ? 'py-1' : 'py-px', // extra v space
        ],

        // TODO: keep DRY with columnMoreLink
        rowMoreLinkClass: `relative me-px mb-px p-px rounded-sm ${params.bgClass}`,
        rowMoreLinkColorClass: `absolute z-0 inset-0 rounded-sm ${params.strongPressableClass} print:bg-white print:border print:border-black`,
        rowMoreLinkInnerClass: 'z-10 p-0.5 text-xs', // TODO: somehow add that "extra v space" ?

        slotLabelAlign: (data) => (data.level || data.isTime) ? 'start' : 'center',
        slotLabelSticky: '0.5rem', // for pill
        slotLabelClass: (data) => [
          'border',
          data.level
            // housing for pill
            ? 'border-transparent justify-start' // v-align-content
            : joinClassNames(
                params.borderColorClass,
                data.isTime
                  // time-tick
                  ? 'h-2 self-end justify-end' // v-align-self, v-align-content
                  // day-header
                  : 'justify-center', // v-align-content
              )
        ],
        slotLabelInnerClass: (data) => data.level
          ? [ // pill
            'px-2 py-1 rounded-full text-sm',
            data.hasNavLink
              ? params.secondaryPressableClass
              : params.secondaryClass,
          ]
          : [
            'min-w-14 text-sm',
            data.isTime
              // time-tick inner
              ? 'pb-3 -ms-1'
              // day-header
              : 'flex flex-row justify-center' // h-align-text
          ],

        slotLabelDividerClass: `border-b ${params.borderColorClass}`,
      },
    },
  }
}
