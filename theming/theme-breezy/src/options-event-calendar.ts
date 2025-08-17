import { CalendarOptions, ViewOptions } from '@fullcalendar/core'

// ambient types
// TODO: make these all peer deps? or wait, move options to just core
import '@fullcalendar/daygrid'
import '@fullcalendar/timegrid'
import '@fullcalendar/list'
import '@fullcalendar/multimonth'
import '@fullcalendar/interaction'

// active-color also used below for border...

const xxsTextClass = 'text-[0.7rem]/[1.25]' // about 11px when default 16px root font size

/*
applies to DayGrid, TimeGrid ALL-DAY, MultiMonth
TODO: rename to "dayRowContent" or something
TODO: audit all forced line-heights. not a fan

Some dark mode:
https://tailwindcss.com/plus/ui-blocks/application-ui/lists/tables

User different navbar for view-selector:
https://tailwindcss.com/plus/ui-blocks/application-ui/navigation/tabs#component-2a66fc822e8ad55f59321825e5af0980

Flyout menus:
https://tailwindcss.com/plus/ui-blocks/marketing/elements/flyout-menus#component-25601925ae83e51e1b31d3bd1c286515

Themes should completely decide if list-view dayheaders are sticky (put in the changelog?)

TODO: add all the whitespace-nowrap overflow-hidden to the text divs
  add to checklist

TODO: fix popover styling

TODO: multi-month SINGLE-col sticky mess

TODO: audit other more-link styles (not just for daygrid)

TODO: now indicator
TODO: shadow on resourceArea?

TODO: in all-day area, when stacking events, allDayHeader not valigned
  also, wrong cell-bottom padding

PROBLEM: event color too dim to pop above background-event color

TODO: fix multiple listDayFormats

TODO: new dark-mode!
  https://tailwindcss.com/plus/changelog#2025-08-11

TODO: move list-header sticky from listDayHeaderInnerClass -> listDayHeaderClass (like Forma)

TODO: timegrid resizing broken
TODO: timegrid events have unnecessasry extra 1px bottom margin
*/
function createDayGridClasses(primaryBorderColorClass: string): CalendarOptions {
  return {
    /*
    TODO: make new inlineWeekNumberClass / cellWeekNumberClass
    BUG: z-index is wrong, can't click week numbers
    */
    inlineWeekNumberClass: 'absolute z-10 top-0 end-0 border-b border-b-gray-300 border-s border-s-gray-200 rounded-es-md bg-white',
    inlineWeekNumberInnerClass: (data) => [
      'py-0.5 ' +
        (data.isCompact
          ? xxsTextClass + ' px-0.5'
          : 'text-xs/6 px-1')
    ],

    rowEventClass: (data) => [
      data.isCompact ? 'mb-px' : 'mb-0.5',
      data.isStart && (data.isCompact ? 'ms-px' : 'ms-1'),
      data.isEnd && (data.isCompact ? 'me-px' : 'me-1'),
    ],

    /*
    TODO: ensure ellipsis on overflowing title text
    TODO: add-back space between time/title? (try ellipsis first)
    */
    listItemEventClass: 'mx-1 mb-px hover:bg-gray-100 rounded-md',
    listItemEventInnerClass: 'p-1 flex flex-row text-xs/4',
    listItemEventTimeClass: 'order-1 text-gray-500',
    listItemEventTitleClass: 'flex-grow font-medium',

    rowMoreLinkClass: (data) => [
      'flex flex-row',
      data.isCompact ? 'mx-px' : 'mx-1',
      data.isCompact && `border ${primaryBorderColorClass} rounded-sm`,
    ],
    rowMoreLinkInnerClass: (data) => [
      data.isCompact ? xxsTextClass : 'text-xs',
      !data.isCompact && 'p-1',
      'whitespace-nowrap overflow-hidden',
    ]
  }
}

/*
NOTE: instead of w-* h-*, just use size-* !!!

TODO: how to do inner drop shadow within scroll area?
*/

export interface EventCalendarOptionParams {
  // !!! Having trouble b/c some many different shades
  // borderColorClass: string // eventually just borderColor

  // !!! now-indicator not-yet-implemented!
  // nowIndicatorBorderColorClass: string // eventually just alertBorderColor

  primaryBgColorClass: string
  primaryTextColorClass: string
  primaryBorderColorClass: string

  eventColor: string
  // NOTE: eventContrastColor not needed because eventColor always faded to bg color
  backgroundEventColor: string
  backgroundEventColorClass: string

  popoverClass: string

  pageBgColorClass: string
  pageBgColorOutlineClass: string
}

export function createEventCalendarOptions(params: EventCalendarOptionParams): {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} {
  const dayGridClasses = createDayGridClasses(params.primaryBorderColorClass)

  return {
    optionDefaults: {
      eventColor: params.eventColor,
      // eventContrastColor: defaultEventContrastColor, -- not needed in this theme!?
      backgroundEventColor: params.backgroundEventColor,

      className: 'border border-gray-950/10 rounded-lg overflow-hidden', // TODO: standardize color
      headerToolbarClass: 'border-b border-gray-200',
      footerToolbarClass: 'border-t border-gray-200',

      popoverClass: 'min-w-50 m-1 ' + params.popoverClass,

      dayHeaderClass: 'items-center',
      dayHeaderInnerClass: (data) => [
        data.isCompact ? 'p-1' : 'p-2',
        'flex flex-row items-center',
      ],

      dayRowClass: 'border border-gray-200',

      dayCellClass: (data) => [
        'border',
        (data.isOther || data.isDisabled) && 'bg-gray-50',
      ],
      dayCellTopClass: 'flex flex-row justify-start min-h-1',
      dayCellTopInnerClass: (data) => [
        data.isCompact ? xxsTextClass : 'text-xs/6',
        !data.isCompact && 'p-1',
        data.isOther ? 'text-gray-400' : 'text-gray-700',
        !data.isToday && 'mx-1',
      ],
      dayCellInnerClass: (data) => [
        data.inPopover && 'p-2',
      ],

      dayLaneClass: 'border border-gray-100',

      allDayHeaderInnerClass: 'text-xs/5 text-gray-400 p-3',

      slotLabelInnerClass: 'text-xs/5 text-gray-400 uppercase',

      slotLaneClass: 'border border-gray-100',

      blockEventClass: `${params.pageBgColorClass} relative`,
      blockEventColorClass: 'absolute inset-0 bg-(--fc-event-color) opacity-15',
      blockEventInnerClass: 'relative z-20 text-xs/4 flex', // NOTE: subclass determines direction
      /*
      ^^^NOTE: should core determine flex-direction because core needs to do sticky anyway, right!?
      */
      blockEventTimeClass: 'text-(--fc-event-color) contrast-150',
      blockEventTitleClass: 'text-(--fc-event-color) brightness-60',

      backgroundEventColorClass: 'bg-(--fc-event-color) ' + params.backgroundEventColorClass,
      backgroundEventTitleClass: (data) => [
        'm-2 opacity-50 italic',
        data.isCompact ? xxsTextClass : 'text-xs',
      ],

      rowEventClass: (data) => [
        data.isStart && 'rounded-s-md',
        data.isEnd && 'rounded-e-md',
      ],
      rowEventColorClass: (data) => [
        data.isStart && 'rounded-s-md',
        data.isEnd && 'rounded-e-md',
      ],
      rowEventInnerClass: 'flex-row',
      rowEventTimeClass: 'p-1',
      rowEventTitleClass: 'p-1',

      columnEventClass: (data) => [
        data.isStart && 'rounded-t-lg',
        data.isEnd && 'rounded-b-lg',
        (data.level || data.isDragging) && `outline ${params.pageBgColorOutlineClass}`,
      ],
      columnEventColorClass: (data) => [
        data.isStart && 'rounded-t-lg',
        data.isEnd && 'rounded-b-lg',
      ],
      columnEventInnerClass: 'flex-col py-1',
      // TODO: move the x-padding to the inner div? same concept with row-events
      columnEventTimeClass: 'px-2 pt-1',
      columnEventTitleClass: 'px-2 py-1 font-semibold',

      rowMoreLinkInnerClass: 'rounded-md hover:bg-gray-100',

      fillerClass: 'border border-gray-100 bg-white',

      listDaysClass: 'px-4 my-10 mx-auto w-full max-w-200',
      listDayClass: 'flex flex-row not-last:border-b not-last:border-gray-200',
      listDayHeaderClass: 'w-40',
      listDayHeaderInnerClass: 'sticky top-0 py-4 text-sm text-gray-500',
      listDayEventsClass: 'flex-grow flex flex-col',

      singleMonthClass: 'm-5',
      singleMonthHeaderClass: (data) => [
        'text-center text-sm font-semibold text-gray-900',
        data.isSticky
          ? 'py-2 bg-white border-b border-gray-200'
          : 'pb-2',
      ],

      // TODO: event resizing
      // TODO: do isMajor border as darker (and put into checklist)
    },
    views: {
      dayGrid: {
        ...dayGridClasses,
        dayHeaderDividerClass: 'border-b border-gray-300',
        dayHeaderClass: 'border border-gray-200 text-xs/6 font-semibold text-gray-700',
        dayCellClass: 'border-gray-200',
      },
      multiMonth: {
        ...dayGridClasses,
        dayHeaderDividerClass: (data) => [
          data.isSticky && 'border-b border-gray-300 shadow-sm',
        ],
        dayHeaderClass: (data) => [
          data.isSticky && 'border border-gray-200 text-xs/6 font-semibold text-gray-700', // single-col
        ],
        dayHeaderInnerClass: [
          'text-xs/6 text-gray-500',
        ],

        tableHeaderClass: (data) => data.isSticky && 'bg-white',
        tableBodyClass: 'border border-gray-200 shadow-sm rounded-md overflow-hidden',

        // TODO: sync with dayGrid?
      },
      timeGrid: {
        ...dayGridClasses,

        allDayDividerClass: 'border-b border-gray-300 shadow-sm',

        dayHeaderDividerClass: (data) => [
          'border-b',
          data.isSticky ? 'border-gray-200' : 'border-gray-300 shadow-sm',
        ],
        dayHeaderClass: 'border border-gray-100 text-sm/6 text-gray-500',
        dayCellClass: 'border-gray-100',
        weekNumberHeaderClass: 'justify-end items-center',
        weekNumberHeaderInnerClass: 'px-3 text-sm/6 text-gray-500',

        /*
        Figure out how not having any border on slotLabel affects height-syncing
        */
        slotLabelClass: 'justify-end',
        slotLabelInnerClass: 'min-h-[3em] px-3 relative -top-[0.8em]', // HACK

        slotLabelDividerClass: 'border-l border-gray-100',

        columnEventClass: (data) => [
          'mx-1', // TODO: move this to the columnInner thing? yes!!
          data.isStart && 'mt-1',
          data.isEnd && 'mb-1',
        ],
      },
      list: {
        listItemEventClass: 'not-last:border-b not-last:border-gray-200',
        listItemEventInnerClass: 'py-4 flex flex-row text-sm',

        // TODO: make this common?...
        listItemEventTimeClass: 'order-1 text-gray-500',
        listItemEventTitleClass: [
          'flex-grow font-semibold',
          'text-(--fc-event-color) brightness-60',
        ],

        noEventsClass: `py-15 flex flex-col flex-grow items-center justify-center`,
      },
    },
  }
}
