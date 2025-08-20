import { CalendarOptions, ViewOptions } from '@fullcalendar/core'

// ambient types (tsc strips during build because of {})
import {} from '@fullcalendar/daygrid'
import {} from '@fullcalendar/timegrid'
import {} from '@fullcalendar/list'
import {} from '@fullcalendar/multimonth'
import {} from '@fullcalendar/interaction'

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

TODO: put header drop-shadow on resource-timeline header

TODO: implement nowIndicator

TODO: hover effect on multi-month month navlinks

TODO: use muted color in more places than just dayCell
*/

const xxsTextClass = 'text-[0.6875rem]/[1.090909]' // usually 11px font / 12px line-height

// TODO: bg-white

export interface EventCalendarOptionParams {
  primaryBgColorClass: string
  primaryTextColorClass: string
  primaryBorderColorClass: string
  eventColor: string
  backgroundEventColor: string
  backgroundEventColorClass: string
  popoverClass: string
  bgColorClass: string
  bgColorOutlineClass: string
  borderLowColorClass: string
  borderMidColorClass: string
  borderStartMedColorClass: string
  borderHighColorClass: string
  borderBottomHighColorClass: string
  mutedBgClass: string
  textLowColorClass: string
  textMidColorClass: string
  textHighColorClass: string
  textHeaderColorClass: string
}

export function createEventCalendarOptions(params: EventCalendarOptionParams): {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} {
  const dayGridClasses: CalendarOptions = {
    /*
    BUG: z-index is wrong, can't click week numbers
    */
    inlineWeekNumberClass: `absolute z-10 top-0 end-0 border-b ${params.borderBottomHighColorClass} border-s ${params.borderStartMedColorClass} rounded-es-md bg-white`,
    inlineWeekNumberInnerClass: (data) => [
      'py-0.5',
      data.isCompact
        ? `${xxsTextClass} px-0.5`
        : 'text-xs/6 px-1'
    ],

    rowEventClass: (data) => [
      data.isCompact ? 'mb-px' : 'mb-0.5',
      data.isStart && (data.isCompact ? 'ms-px' : 'ms-1'),
      data.isEnd && (data.isCompact ? 'me-px' : 'me-1'),
    ],

    listItemEventClass: 'mx-1 mb-px hover:bg-gray-100 rounded-md',
    listItemEventInnerClass: 'p-1 flex flex-row text-xs/4',
    listItemEventTimeClass: `order-1 ${params.textMidColorClass}`,
    listItemEventTitleClass: 'flex-grow font-medium',

    rowMoreLinkClass: (data) => [
      'flex flex-row',
      data.isCompact ? 'mx-px' : 'mx-1',
      data.isCompact && `border ${params.primaryBorderColorClass} rounded-sm`,
    ],
    rowMoreLinkInnerClass: (data) => [
      data.isCompact ? xxsTextClass : 'text-xs',
      !data.isCompact && 'p-1',
      'whitespace-nowrap overflow-hidden',
    ]
  }

  return {
    optionDefaults: {
      eventColor: params.eventColor,
      backgroundEventColor: params.backgroundEventColor,

      className: `border ${params.borderMidColorClass} rounded-lg overflow-hidden`,
      headerToolbarClass: `border-b ${params.borderMidColorClass}`,
      footerToolbarClass: `border-t ${params.borderMidColorClass}`,

      popoverClass: `min-w-50 m-1 ${params.popoverClass}`,

      dayHeaderAlign: 'center', // h-align. TODO: what about v-align?
      dayHeaderInnerClass: (data) => [
        data.isCompact ? 'p-1' : 'p-2',
        'flex flex-row items-center',
      ],

      dayRowClass: `border ${params.borderMidColorClass}`,

      dayCellClass: (data) => [
        'border',
        (data.isOther || data.isDisabled) && params.mutedBgClass,
      ],
      dayCellTopClass: 'flex flex-row justify-start min-h-1',
      dayCellTopInnerClass: (data) => [
        data.isCompact ? xxsTextClass : 'text-xs/6',
        !data.isCompact && 'p-1',
        data.isOther ? params.textLowColorClass : params.textHighColorClass,
        !data.isToday && 'mx-1',
      ],
      dayCellInnerClass: (data) => [
        data.inPopover && 'p-2',
      ],

      dayLaneClass: `border ${params.borderLowColorClass}`,

      allDayHeaderInnerClass: `text-xs/5 ${params.textLowColorClass} p-3`,

      slotLabelInnerClass: `text-xs/5 ${params.textLowColorClass} uppercase`,

      slotLaneClass: `border ${params.borderLowColorClass}`,

      blockEventClass: `${params.bgColorClass} relative`,
      blockEventColorClass: 'absolute inset-0 bg-(--fc-event-color) opacity-15',
      blockEventInnerClass: 'relative z-20 text-xs/4 flex', // NOTE: subclass determines direction
      /*
      ^^^NOTE: should core determine flex-direction because core needs to do sticky anyway, right!?
      */
      blockEventTimeClass: 'text-(--fc-event-color) contrast-150',
      blockEventTitleClass: 'text-(--fc-event-color) brightness-60',

      backgroundEventColorClass: `bg-(--fc-event-color) ${params.backgroundEventColorClass}`,
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
        (data.level || data.isDragging) && `outline ${params.bgColorOutlineClass}`,
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

      fillerClass: `border ${params.borderLowColorClass} bg-white`,

      listDaysClass: 'px-4 my-10 mx-auto w-full max-w-200',
      listDayClass: `flex flex-row not-last:border-b not-last:${params.borderMidColorClass}`,
      listDayHeaderClass: 'w-40',
      listDayHeaderInnerClass: `sticky top-0 py-4 text-sm ${params.textMidColorClass}`,
      listDayEventsClass: 'flex-grow flex flex-col',

      singleMonthClass: 'm-5',
      singleMonthHeaderClass: (data) => [
        `text-center text-sm font-semibold ${params.textHeaderColorClass}`,
        data.isSticky
          ? `py-2 bg-white border-b ${params.borderMidColorClass}`
          : 'pb-2',
      ],

      // TODO: event resizing
      // TODO: do isMajor border as darker (and put into checklist)
    },
    views: {
      dayGrid: {
        ...dayGridClasses,
        dayHeaderDividerClass: `border-b ${params.borderHighColorClass}`,
        dayHeaderClass: `border ${params.borderMidColorClass} text-xs/6 font-semibold ${params.textHighColorClass}`,
        dayCellClass: params.borderMidColorClass,
      },
      multiMonth: {
        ...dayGridClasses,
        dayHeaderDividerClass: (data) => [
          data.isSticky && `border-b ${params.borderHighColorClass} shadow-sm`,
        ],
        dayHeaderClass: (data) => [
          data.isSticky && `border ${params.borderMidColorClass} text-xs/6 font-semibold ${params.textHighColorClass}`, // single-col
        ],
        dayHeaderInnerClass: [
          `text-xs/6 ${params.textMidColorClass}`,
        ],

        tableHeaderClass: (data) => data.isSticky && 'bg-white',
        tableBodyClass: `border ${params.borderMidColorClass} shadow-sm rounded-md overflow-hidden`,

        // TODO: sync with dayGrid?
      },
      timeGrid: {
        ...dayGridClasses,

        allDayDividerClass: `border-b ${params.borderHighColorClass} shadow-sm`,

        dayHeaderDividerClass: (data) => [
          'border-b',
          data.isSticky ? params.borderMidColorClass : `${params.borderHighColorClass} shadow-sm`,
        ],
        dayHeaderClass: `border ${params.borderLowColorClass} text-sm/6 ${params.textMidColorClass}`,
        dayCellClass: params.borderLowColorClass,
        weekNumberHeaderClass: 'justify-end items-center',
        weekNumberHeaderInnerClass: `px-3 text-sm/6 ${params.textMidColorClass}`,

        /*
        Figure out how not having any border on slotLabel affects height-syncing
        */
        slotLabelClass: 'justify-end',
        slotLabelInnerClass: 'min-h-[3em] px-3 relative -top-[0.8em]', // HACK

        slotLabelDividerClass: `border-l ${params.borderLowColorClass}`,

        columnEventClass: (data) => [
          'mx-1', // TODO: move this to the columnInner thing? yes!!
          data.isStart && 'mt-1',
          data.isEnd && 'mb-1',
        ],
      },
      list: {
        listItemEventClass: `not-last:border-b ${params.borderMidColorClass}`,
        listItemEventInnerClass: 'py-4 flex flex-row text-sm',

        // TODO: make this common?...
        listItemEventTimeClass: `order-1 ${params.textMidColorClass}`,
        listItemEventTitleClass: [
          'flex-grow font-semibold',
          'text-(--fc-event-color) brightness-60',
        ],

        noEventsClass: `py-15 flex flex-col flex-grow items-center justify-center`,
      },
    },
  }
}
