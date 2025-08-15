import { CalendarOptions, ViewOptions } from '@fullcalendar/core'
import { xxsTextClass, moreLinkBgClass, transparentPressableClass, EventCalendarOptionParams } from './options-event-calendar.js'

// ambient types
// TODO: make these all peer deps? or wait, move options to just core
import '@fullcalendar/timeline'
import '@fullcalendar/resource-daygrid'
import '@fullcalendar/resource-timegrid'
import '@fullcalendar/resource-timeline'
import '@fullcalendar/adaptive'
import '@fullcalendar/scrollgrid'

export function createSchedulerOnlyOptions({
  borderColorClass,
  majorBorderColorClass,
  nowIndicatorBorderColorClass,
  eventColor,
  eventContrastColor,
  backgroundEventColor,
  ...props
}: EventCalendarOptionParams): {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} {
  // TODO: DRY
  const borderClass = `border ${borderColorClass}` // all sides
  const majorBorderClass = `border ${majorBorderColorClass}`

  return {
    optionDefaults: {
      resourceDayHeaderClass: (data) => [
        data.isMajor ? majorBorderClass : borderClass,
        data.isDisabled && props.disabledBgClass,
        'items-center',
      ],
      resourceDayHeaderInnerClass: (data) => [
        'py-2 flex flex-col',
        data.isCompact ? xxsTextClass : 'text-sm',
      ],

      resourceAreaHeaderRowClass: borderClass,
      resourceAreaHeaderClass: `${borderClass} items-center`, // valign
      resourceAreaHeaderInnerClass: 'p-2 text-sm',

      resourceAreaDividerClass: `border-s ${borderColorClass}`, // TODO: put bigger hit area inside

      // For both resources & resource groups
      resourceAreaRowClass: borderClass,

      resourceGroupHeaderClass: props.disabledBgClass,
      resourceGroupHeaderInnerClass: 'p-2 text-sm',
      resourceGroupLaneClass: [borderClass, props.disabledBgClass],

      resourceCellClass: borderClass,
      resourceCellInnerClass: 'p-2 text-sm',

      resourceExpanderClass: [
        'self-center w-6 h-6 flex flex-row items-center justify-center rounded-full text-sm relative start-1',
        transparentPressableClass,
      ],

      resourceLaneClass: borderClass,
      resourceLaneBottomClass: (data) => !data.isCompact && 'pb-3',

      // Non-resource Timeline
      timelineBottomClass: 'pb-3',
    },
    views: {
      timeline: {
        rowEventClass: [
          'me-px', // space from slot line
        ],
        rowEventInnerClass: () => [
          'gap-1', // large gap, because usually time is *range*, and we have a lot of h space anyway
          // TODO: find better way to do isSpacious
          // data.isSpacious
        ],

        rowMoreLinkClass: `me-px p-px ${moreLinkBgClass}`,
        rowMoreLinkInnerClass: 'p-0.5 text-xs',

        slotLabelSticky: '0.5rem',
        slotLabelClass: (data) => (data.level && !data.isTime)
          ? [
            'border border-transparent',
            'justify-start',
          ]
          : [
            borderClass,
            'h-2 self-end justify-end',
          ],
        slotLabelInnerClass: (data) => (data.level && !data.isTime)
          ? [
            // TODO: converge with week-label styles
            'px-2 py-1 rounded-full text-sm',
            props.pillClass({ hasNavLink: data.hasNavLink }),
          ]
          : 'pb-3 -ms-1 text-sm min-w-14',
          // TODO: also test lowest-level days

        slotLabelDividerClass: `border-b ${borderColorClass}`,
      },
    },
  }
}
