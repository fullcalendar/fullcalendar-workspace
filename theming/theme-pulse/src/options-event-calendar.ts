import { CalendarOptions, ViewOptions } from '@fullcalendar/core'

// ambient types (tsc strips during build because of {})
import {} from '@fullcalendar/daygrid'
import {} from '@fullcalendar/timegrid'
import {} from '@fullcalendar/list'
import {} from '@fullcalendar/multimonth'
import {} from '@fullcalendar/interaction'

/*
TODO: default-background-event and selection colors
red: #FF3D57
green: #09B66D
primary-blue: #0081FF
apple-primary-blue: #117aff
apple-red: #fd453b (same for dark mode: #fd3b30)
light-blue: #22CCE2

TODO: implement now-indicator
TODO: text-gray-500 is yucky for Shadcn

TODO: give day-number-circle to list-view day-headers

TODO: multimonth very poorly condensed with events

TODO: test standlone secondary button. correct borders and shadow?

TODO: pressdown colors on buttons

TODO: in default-ui, make secondary button have bg-filled-muted, not lines

TODO: shift timegrid slot labels over to start-of line
*/

export interface EventCalendarOptionParams {
  todayCircleBgColorClass: string
  todayCircleTextColorClass: string

  borderColorClass: string

  eventColor: string
  eventContrastColor: string
  backgroundEventColor: string
  backgroundEventColorClass: string

  highlightClass: string
  ghostButtonClass: string

  popoverClass: string

  bgColorOutlineClass: string
  bgColorClass: string

  mutedTransparentBgClass: string
  mutedOpaqueBgClass: string

  mutedTextClass: string
  mutedExtraTextClass: string
}

export const getDayHeaderInnerClasses = (data: { isToday?: boolean, inPopover?: boolean }) => [
  'my-1 p-1 flex flex-row items-center',
  data.inPopover
    ? 'mx-2'
    : !data.isToday && 'mx-1',
]

export function createEventCalendarOptions(params: EventCalendarOptionParams): {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} {
  // transparent resizer for mouse
  const blockPointerResizerClass = `absolute z-20 hidden group-hover:block`
  const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
  const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

  // circle resizer for touch
  const blockTouchResizerClass = `absolute z-20 h-2 w-2 rounded-full border border-(--fc-event-color) ${params.bgColorClass}`
  const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
  const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

  const dayRowItemClasses: CalendarOptions = {
    rowEventClass: (data) => [
      'mb-0.5',
      data.isStart && 'ms-1',
      data.isEnd && 'me-1',
    ],

    listItemEventClass: `mx-1 p-1 mb-0.5 ${params.ghostButtonClass} rounded-sm`,
    listItemEventInnerClass: 'flex flex-row text-xs',
    listItemEventTimeClass: 'order-1',
    listItemEventTitleClass: 'font-medium flex-grow',

    rowEventTimeClass: 'order-1',
    rowEventTitleClass: 'flex-grow',

    moreLinkClass: 'mx-1 flex flex-row',
    moreLinkInnerClass: `p-1 text-xs font-medium rounded-sm ${params.mutedTransparentBgClass}`,
    //^^^ setting that lets you do just "+3"
  }

  return {
    optionDefaults: {
      eventColor: params.eventColor,
      eventContrastColor: params.eventContrastColor,
      backgroundEventColor: params.backgroundEventColor,
      // eventDisplay: 'block',

      // best place? be consistent with otherthemes

      highlightClass: params.highlightClass,

      popoverClass: 'min-w-[220px] ' + params.popoverClass,
      popoverCloseClass: 'absolute top-2 end-2',

      dayHeaderRowClass: `border ${params.borderColorClass}`,

      dayHeaderInnerClass: getDayHeaderInnerClasses,
      // TODO: add dayheader borders ONLY when isMajor

      dayHeaderDividerClass: `border-b ${params.borderColorClass}`,

      dayRowClass: `border ${params.borderColorClass}`,

      dayCellClass: [
        `border ${params.borderColorClass}`,
        // data.isToday && 'bg-[#0081FF]/5',
      ],
      dayCellTopClass: 'flex flex-row justify-end min-h-1',
      dayCellTopInnerClass: (data) => [
        !data.isToday && 'mx-1',
        data.isOther ? params.mutedExtraTextClass : 'font-semibold',
        'p-1',
        'flex flex-row',
      ],

      dayCellInnerClass: (data) => [
        data.inPopover && 'p-2',
      ],

      dayLaneClass: `border ${params.borderColorClass}`,

      /*
      BUG: z-index is wrong, can't click week numbers
      */
      inlineWeekNumberClass: 'absolute z-10 top-0 start-0',
      inlineWeekNumberInnerClass: (data) => [
        `py-2 text-xs ${params.mutedTextClass}`,
        data.isCompact ? 'px-1' : 'px-2',
      ],

      /*
      TODO: not necessary to have color-class do bg color! we're not doing any transforms
      */
      blockEventClass: 'relative group',
      blockEventColorClass: 'absolute z-10 inset-0 bg-(--fc-event-color)',
      blockEventInnerClass: 'relative z-20 text-(--fc-event-contrast-color) text-xs',

      backgroundEventColorClass: `bg-(--fc-event-color) ${params.backgroundEventColorClass}`,
      backgroundEventTitleClass: [
        'm-2 opacity-50 italic',
        'text-xs', // data.isCompact ? xxsTextClass : 'text-xs', -- TODO
      ],

      rowEventBeforeClass: (data) => data.isStartResizable && [
        data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
        '-start-1',
      ],
      rowEventAfterClass: (data) => data.isEndResizable && [
        data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
        '-end-1',
      ],
      rowEventColorClass: (data) => [
        data.isStart && 'rounded-s-sm',
        data.isEnd && 'rounded-e-sm',
      ],
      rowEventInnerClass: 'flex flex-row',
      rowEventTimeClass: 'p-1',
      rowEventTitleClass: 'p-1 font-medium',
      //^^^for row event, switch order of title/time?

      columnEventBeforeClass: (data) => data.isStartResizable && [
        data.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
        '-top-1',
      ],
      columnEventAfterClass: (data) => data.isEndResizable && [
        data.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
        '-bottom-1',
      ],
      columnEventColorClass: (data) => [
        data.isStart && 'rounded-t-lg',
        data.isEnd && 'rounded-b-lg',
        (data.level || data.isDragging) && `outline ${params.bgColorOutlineClass}`,
      ],
      columnEventInnerClass: 'flex-col py-1',
      // TODO: move the x-padding to the inner div? same concept with row-events
      columnEventTimeClass: 'px-2 pt-1',
      columnEventTitleClass: 'px-2 py-1 font-medium',

      allDayHeaderInnerClass: `p-2 text-xs ${params.mutedTextClass}`,

      allDayDividerClass: `border-b ${params.borderColorClass} shadow-sm`,

      slotLabelClass: 'justify-end', // v-align
      slotLabelInnerClass: `p-2 text-xs ${params.mutedTextClass}`,
      slotLabelDividerClass: `border-s ${params.borderColorClass}`,
      // TODO: higher levels should have h-borders

      slotLabelRowClass: `border ${params.borderColorClass}`, // timeline only

      slotLaneClass: `border ${params.borderColorClass}`,

      fillerClass: (data) => [
        !data.isHeader && `border ${params.borderColorClass} opacity-50`,
      ],

      // TODO: move this to view config
      listDayClass: `flex flex-col not-first:border-t ${params.borderColorClass}`,
      listDayHeaderClass: `flex flex-row justify-between ${params.mutedOpaqueBgClass} border-b ${params.borderColorClass} top-0 sticky`,
      // TODO^^ since the color is present before hover, hover should have an effect too. same challenge with dark-mode secondary button for this theme
      listDayHeaderInnerClass: (data) => [
        'px-3 py-3 text-sm',
        !data.level && 'font-semibold',
      ],
    },
    views: {
      dayGrid: {
        ...dayRowItemClasses,
        dayHeaderAlign: (data) => data.inPopover ? 'start' : 'end',
      },
      multiMonth: {
        ...dayRowItemClasses,

        singleMonthClass: (data) => [
          (data.colCount > 1) && 'm-4',
        ],
        singleMonthHeaderClass: 'font-semibold',
      },
      timeGrid: {
        ...dayRowItemClasses,
        dayHeaderAlign: (data) => data.inPopover ? 'start' : 'center',

        weekNumberHeaderClass: 'justify-end items-center',
        weekNumberHeaderInnerClass: `px-2 text-sm ${params.mutedTextClass}`,

        slotLabelInnerClass: '-mt-4',

        columnEventClass: (data) => [
          'mx-0.5', // TODO: move this to the columnInner thing? yes!!
          data.isStart && 'mt-0.5',
          data.isEnd && 'mb-0.5',
        ],
      },
      list: {
        listDayEventsClass: 'flex flex-col py-4 gap-4',

        listItemEventInnerClass: '[display:contents]',
        listItemEventTimeClass: 'ps-6 pe-4 py-2 order-[-1] w-60 text-sm',
        listItemEventTitleClass: 'px-4 py-2 text-sm',
        listItemEventColorClass: 'bg-(--fc-event-color) w-1.5 rounded-full',

        noEventsClass: `py-15 flex flex-col flex-grow items-center justify-center`,
      },
    },
  }
}
