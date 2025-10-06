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

TODO: give nav-link hover effect to everything!
TODO: give hover effect to singleMonthHeaderInnerClass

TODO: in all-day section when many events are stacked,
  not enough bottom padding to daycell

TODO: in daygrid, day-header text doesn't align nicely with day-cell day-number-text

TODO: space in-between timeline events (left-to-right space aka "me-px")
TODO: ^^^same with vertical space
TODO: ^^^same with more-link

TODO: list-view day-headers when they stack, border is doubled-up

TODO: have press-effect on ui buttons. and ALL buttons

TODO: hover color on list-view events

TODO: give week-numbers an ghost-pressable-effect!
*/

export interface EventCalendarOptionParams {
  tertiaryClass: string
  tertiaryPressableClass: string

  ghostHoverClass: string
  ghostPressableClass: string

  strongBgClass: string
  mutedBgClass: string
  mutedWashClass: string
  highlightClass: string

  borderColorClass: string
  strongBorderColorClass: string
  nowBorderColorClass: string

  eventColor: string
  eventContrastColor: string
  bgEventColor: string
  bgEventColorClass: string

  popoverClass: string

  bgClass: string
  bgOutlineColorClass: string

  fgClass: string
  strongFgClass: string
  mutedFgClass: string
}

export const getDayHeaderInnerClasses = (data: { isToday?: boolean, inPopover?: boolean }) => [
  // are all these paddings okay?
  'py-2 flex flex-row items-center',
  data.inPopover
    ? 'px-2'
    : !data.isToday && 'px-1',
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
  const blockTouchResizerClass = `absolute z-20 h-2 w-2 rounded-full border border-(--fc-event-color) ${params.bgClass}`
  const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
  const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

  const dayRowItemClass = 'mx-1 mb-px rounded-sm'
  const dayRowItemClasses: CalendarOptions = {
    rowEventClass: (data) => [
      'mb-px',
      data.isStart && 'ms-1',
      data.isEnd && 'me-1',
    ],

    listItemEventClass: (data) => [
      `p-px ${dayRowItemClass}`,
      data.isInteractive ? params.ghostHoverClass : params.ghostPressableClass,
    ],
    listItemEventInnerClass: 'justify-between flex flex-row text-xs',
    listItemEventTimeClass: 'order-1 p-0.5 whitespace-nowrap overflow-hidden shrink-1', // shrinks second
    listItemEventTitleClass: 'text-ellipsis p-0.5 font-medium whitespace-nowrap overflow-hidden shrink-100', // shrinks first

    rowMoreLinkClass: `self-start flex flex-row ${params.ghostPressableClass} ${dayRowItemClass}`,
    rowMoreLinkInnerClass: `p-0.5 text-xs font-medium ${params.strongFgClass}`,
  }

  return {
    optionDefaults: {
      eventColor: params.eventColor,
      eventContrastColor: params.eventContrastColor,
      backgroundEventColor: params.bgEventColor,
      // eventDisplay: 'block',

      // best place? be consistent with otherthemes

      highlightClass: params.highlightClass,
      nonBusinessClass: params.mutedWashClass,

      popoverClass: 'min-w-[220px] ' + params.popoverClass,
      popoverCloseClass: 'absolute top-2 end-2',

      dayHeaderRowClass: `border ${params.borderColorClass}`,

      dayHeaderClass: (data) => data.isMajor && `border ${params.strongBorderColorClass}`,
      dayHeaderInnerClass: getDayHeaderInnerClasses,
      // TODO: add dayheader borders ONLY when isMajor

      dayHeaderDividerClass: `border-b ${params.borderColorClass}`,

      dayRowClass: `border ${params.borderColorClass}`,

      dayCellClass: (data) => [
        'border',
        data.isMajor
          ? params.strongBorderColorClass
          : params.borderColorClass,
      ],
      dayCellTopClass: 'flex flex-row justify-end min-h-1',
      dayCellTopInnerClass: (data) => [
        !data.isToday && 'mx-1',
        data.isOther ? params.mutedFgClass : 'font-semibold',
        'p-1',
        'flex flex-row',
      ],

      dayCellInnerClass: (data) => [
        data.inPopover && 'p-2',
      ],

      dayLaneClass: (data) => [
        'border',
        data.isMajor
          ? params.strongBorderColorClass
          : params.borderColorClass,
      ],

      /*
      BUG: z-index is wrong, can't click week numbers
      */
      inlineWeekNumberClass: 'absolute z-10 top-0 start-0',
      inlineWeekNumberInnerClass: (data) => [
        `py-2 text-xs ${params.fgClass}`,
        data.isCompact ? 'px-1' : 'px-2',
      ],

      listItemEventInnerClass: params.strongFgClass,

      moreLinkInnerClass: 'whitespace-nowrap overflow-hidden',

      /*
      TODO: not necessary to have color-class do bg color! we're not doing any transforms
      */
      blockEventClass: 'relative group p-px',
      blockEventColorClass: 'absolute z-10 inset-0 bg-(--fc-event-color) print:bg-white border-(--fc-event-color)',
      blockEventInnerClass: 'relative z-20 text-(--fc-event-contrast-color) print:text-black text-xs',
      blockEventTimeClass: 'whitespace-nowrap overflow-hidden shrink-1', // shrinks second
      blockEventTitleClass: 'whitespace-nowrap overflow-hidden shrink-100', // shrinks first

      backgroundEventColorClass: `bg-(--fc-event-color) ${params.bgEventColorClass}`,
      backgroundEventTitleClass: [
        'm-2 opacity-50 italic',
        'text-xs', // data.isCompact ? xxsTextClass : 'text-xs', -- TODO
        params.strongFgClass,
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
        'print:border-y',
        data.isStart && 'rounded-s-sm print:border-s',
        data.isEnd && 'rounded-e-sm print:border-e',
      ],
      rowEventInnerClass: 'flex flex-row',
      rowEventTimeClass: 'p-0.5',
      rowEventTitleClass: 'p-0.5 font-medium',
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
        'print:border-x',
        data.isStart && 'rounded-t-lg print:border-t',
        data.isEnd && 'rounded-b-lg print:border-b',
        (data.level || data.isMirror) && `outline ${params.bgOutlineColorClass}`,
      ],
      columnEventInnerClass: 'flex flex-col py-1',
      // TODO: move the x-padding to the inner div? same concept with row-events
      columnEventTimeClass: 'px-2 pt-1',
      columnEventTitleClass: 'px-2 py-1 font-medium',

      // TODO: keep DRY with timeline rowMoreLink
      columnMoreLinkClass: `relative m-0.5 p-px rounded-lg ${params.bgClass} outline ${params.bgOutlineColorClass}`,
      columnMoreLinkColorClass: `absolute z-0 inset-0 rounded-lg ${params.strongBgClass} print:bg-white print:border print:border-black`,
      columnMoreLinkInnerClass: `z-10 p-0.5 text-xs ${params.strongFgClass}`,

      allDayHeaderClass: 'items-center', // v-align
      allDayHeaderInnerClass: `p-2 text-xs ${params.fgClass}`,

      allDayDividerClass: `border-b ${params.borderColorClass} shadow-sm`,

      slotLabelRowClass: `border ${params.borderColorClass}`, // timeline only

      slotLaneClass: `border ${params.borderColorClass}`,

      fillerClass: (data) => [
        !data.isHeader && `border ${params.borderColorClass} opacity-50`,
      ],

      nowIndicatorLineClass: `-m-px border-1 ${params.nowBorderColorClass}`,
      nowIndicatorDotClass: `rounded-full size-0 -m-[6px] border-6 ${params.nowBorderColorClass} outline-2 ${params.bgOutlineColorClass}`,
    },
    views: {
      dayGrid: {
        ...dayRowItemClasses,
        dayCellBottomClass: 'min-h-0.5',
        dayHeaderAlign: (data) => data.inPopover ? 'start' : 'end',
      },
      multiMonth: {
        ...dayRowItemClasses,
        dayCellBottomClass: 'min-h-0.5',

        singleMonthClass: (data) => [
          (data.colCount > 1) && 'm-4',
        ],
        singleMonthHeaderClass: 'font-semibold',
      },
      timeGrid: {
        ...dayRowItemClasses,
        dayCellBottomClass: 'min-h-3',
        dayHeaderAlign: (data) => data.inPopover ? 'start' : 'center',

        dayHeaderDividerClass: (data) => data.isSticky && 'shadow-sm',

        weekNumberHeaderClass: 'justify-end items-center',
        weekNumberHeaderInnerClass: `px-2 text-sm ${params.fgClass}`,

        columnEventClass: (data) => [
          'mx-0.5', // TODO: move this to the columnInner thing? yes!!
          data.isStart && 'mt-0.5',
          data.isEnd && 'mb-0.5',
        ],

        slotLabelClass: 'justify-end', // v-align
        slotLabelInnerClass: `-mt-4 p-2 text-xs ${params.fgClass}`,
        slotLabelDividerClass: `border-s ${params.borderColorClass}`,
        // TODO: higher levels should have h-borders
      },
      list: {


        listDayClass: `flex flex-col not-first:border-t ${params.borderColorClass}`,

        listDayHeaderClass: `relative flex flex-row justify-between ${params.bgClass} border-b ${params.borderColorClass} top-0 sticky`,
        listDayHeaderColorClass: `absolute z-0 inset-0 ${params.mutedBgClass}`,
        listDayHeaderInnerClass: (data) => [
          'z-10 px-3 py-3 text-sm',
          !data.level && 'font-semibold',
          params.strongFgClass,
        ],

        listDayEventsClass: 'flex flex-col py-4 gap-4',

        listItemEventInnerClass: '[display:contents]',
        listItemEventTimeClass: 'shrink-0 w-1/2 max-w-60 ps-6 pe-4 py-2 order-[-1] text-sm whitespace-nowrap overflow-hidden text-ellipsis',
        listItemEventTitleClass: 'grow min-w-0 px-4 py-2 text-sm whitespace-nowrap overflow-hidden',
        listItemEventColorClass: 'bg-(--fc-event-color) w-1.5 rounded-full',

        noEventsClass: 'grow flex flex-col items-center justify-center',
        noEventsInnerClass: 'py-15',
      },
    },
  }
}
