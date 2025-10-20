import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'

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

https://tailwindcss.com/plus/ui-blocks/application-ui/data-display/calendars

Themes should completely decide if list-view dayheaders are sticky (put in the changelog?)

major-border not working

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

TODO: multi-month dayheader text should be dimmer, but hard to do with slots.ts

TODO: new dark-mode!
  https://tailwindcss.com/plus/changelog#2025-08-11

TODO: move list-header sticky from listDayHeaderInnerClass -> listDayHeaderClass (like Forma)

TODO: timegrid resizing broken
TODO: timegrid events have unnecessasry extra 1px bottom margin

TODO: put header drop-shadow on resource-timeline header

TODO: implement nowIndicator

TODO: hover effect on multi-month month navlinks

TODO: use muted color in more places than just dayCell

TODO: hover:bg-gray-100 -> hover-button system

kill all text-xs/6 ??? is just "text-xs" used?

TODO: default-ui, for daygrid view, should have smaller dayHeader font size

TODO: no hover-effect on today button when isDisabled

TODO: MUI purple theme gives overly-dark toolbar bg

TODO: hover effect for navlinks

TODO: fix popover X valignment... easier API?

TODO: multimonth title needs to be center-aligned

TODO: v-resource headers different border color than days

TODO: Auditorium stickness doesn't stick to right-side

TODO: give navlink hover-effect to everything

TODO: condense timegrid event doesn't work

TODO: dark mode, list-view, event text colors too dark (because brightness-60 isn't adaptive!)

TODO: audit rowMoreLink effects

TODO: where there's rounded-lg, ensure it goes smaller when isCompact

TODO: ensure resourc-timeline-lanes have bottom empty space

TODO: non-business-hours

For list-view, when <a href> (like "Click for Google"), should hover-underline

TODO: give week-numbers an ghost-pressable-effect!

TODO day-popover header looks bad with margin/padding!
*/

export const xxsTextClass = 'text-[0.6875rem]/[1.090909]' // usually 11px font / 12px line-height

export interface EventCalendarOptionParams {
  primaryClass: string
  primaryPressableClass: string
  primaryPressableGroupClass: string

  ghostHoverClass: string
  ghostPressableClass: string

  primaryOutlineColorClass: string
  outlineWidthClass: string
  outlineWidthFocusClass: string
  outlineWidthGroupFocusClass: string
  outlineOffsetClass: string // TODO: use this on primary-today-circle

  strongSolidPressableClass: string

  mutedBgClass: string
  faintBgClass: string
  highlightClass: string

  borderColorClass: string
  borderStartColorClass: string
  primaryBorderColorClass: string
  strongBorderColorClass: string
  strongBorderBottomColorClass: string
  mutedBorderColorClass: string
  nowBorderColorClass: string

  eventColor: string
  bgEventColor: string
  bgEventBgClass: string

  popoverClass: string

  bgClass: string
  bgRingColorClass: string

  fgClass: string
  strongFgClass: string
  mutedFgClass: string
  faintFgClass: string

  faintEventBgClass: string
  faintEventPressableClass: string

  mutedEventFgClass: string
}

export function createEventCalendarOptions(params: EventCalendarOptionParams): {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} {
  // transparent resizer for mouse
  const blockPointerResizerClass = `absolute z-10 hidden group-hover:block`
  const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
  const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

  // circle resizer for touch
  const blockTouchResizerClass = `absolute z-10 h-2 w-2 rounded-full border border-(--fc-event-color) ${params.bgClass}`
  const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
  const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

  const getDayGridItemClass = (data: { isCompact: boolean }) => joinClassNames(
    'mx-1 mb-px',
    data.isCompact ? 'rounded-sm' : 'rounded-md',
  )
  const dayGridClasses: CalendarOptions = {
    /*
    BUG: z-index is wrong, can't click week numbers
    */
    inlineWeekNumberClass: (data) => [
      `absolute z-10 top-0 end-0 border-b ${params.strongBorderBottomColorClass} border-s ${params.borderStartColorClass} rounded-es-md ${params.bgClass} py-0.5 ${params.mutedFgClass}`,
      data.hasNavLink
        ? `${params.ghostPressableClass} -outline-offset-1` // because border
        : params.ghostHoverClass,
      data.isCompact
        ? `${xxsTextClass} px-0.5`
        : 'text-xs/6 px-1',
    ],

    rowEventClass: (data) => [
      'mb-px',
      data.isStart && 'ms-1',
      data.isEnd && 'me-1',
    ],

    listItemEventClass: (data) => [
      'p-px',
      getDayGridItemClass(data),
      data.isSelected
        ? joinClassNames(params.mutedBgClass, data.isDragging && 'shadow-sm')
        : (data.isInteractive ? params.ghostPressableClass : params.ghostHoverClass),
    ],
    listItemEventInnerClass: 'justify-between flex flex-row text-xs/4',
    listItemEventTimeClass: `order-1 p-0.5 ${params.mutedFgClass} whitespace-nowrap overflow-hidden shrink-1`, // shrinks second
    listItemEventTitleClass: `text-ellipsis p-0.5 font-medium ${params.strongFgClass} whitespace-nowrap overflow-hidden shrink-100`, // shrinks first

    rowMoreLinkClass: (data) => [
      'self-start',
      params.ghostPressableClass,
      data.isCompact
        ? `border ${params.primaryBorderColorClass}`
        : 'p-px',
      'flex flex-row',
      getDayGridItemClass(data),
    ],
    rowMoreLinkInnerClass: (data) => [
      data.isCompact ? xxsTextClass : 'text-xs',
      !data.isCompact && 'p-0.5',
      params.strongFgClass,
    ]
  }

  return {
    optionDefaults: {
      eventColor: params.eventColor,
      backgroundEventColor: params.bgEventColor,

      popoverClass: `min-w-50 m-1 ${params.popoverClass}`,
      popoverCloseClass: [
        'absolute top-1 end-1',
        params.primaryOutlineColorClass,
        params.outlineWidthFocusClass,
      ],

      highlightClass: params.highlightClass,
      nonBusinessClass: params.faintBgClass,

      dayHeaderAlign: (data) => data.inPopover ? 'start' : 'center', // h-align
      dayHeaderRowClass: `border ${params.mutedBorderColorClass}`,

      // ensure v-align center for dayHeaderClass?

      dayHeaderInnerClass: (data) => [
        'mx-2 flex flex-row items-center', // v-align
        (data.isToday && !data.inPopover)
          // circle inside (see slots.tsx)
          ? 'my-2 h-8 group outline-none'
          // ghost-button-like
          : joinClassNames(
              'h-6 px-1 rounded-sm',
              data.dayNumberText ? 'my-3' : 'my-2',
              data.hasNavLink && joinClassNames(
                params.ghostPressableClass,
                params.primaryOutlineColorClass,
                params.outlineWidthFocusClass,
              ),
            ),
        // TODO: consider isCompact for above scenarios
      ],

      dayRowClass: `border ${params.borderColorClass}`,

      dayCellClass: (data) => [
        'border',
        // don't display bg-color for other-month/disabled cells when businessHours is doing the same
        ((data.isOther || data.isDisabled) && !data.options.businessHours) && params.faintBgClass,
      ],
      dayCellTopClass: 'flex flex-row justify-start min-h-1',
      dayCellTopInnerClass: (data) => [
        'my-1 h-6 flex flex-row items-center',
        data.isCompact ? xxsTextClass : 'text-xs/6',
        data.isToday
          ? joinClassNames(
              'ms-1 rounded-full font-semibold',
              data.text === data.dayNumberText
                ? 'w-6 justify-center' // circle
                : 'px-2', // pill
              data.hasNavLink
                ? joinClassNames(
                    params.primaryPressableClass,
                    params.outlineOffsetClass,
                  )
                : params.primaryClass,
            )
          : joinClassNames( // half-pill
              'px-2 rounded-e-sm',
              data.isOther ? params.faintFgClass : params.mutedFgClass,
              data.hasNavLink && params.ghostPressableClass,
            ),
      ],
      dayCellInnerClass: (data) => data.inPopover && 'p-2',

      dayLaneClass: (data) => [
        'border',
        data.isMajor
          ? params.strongBorderColorClass
          : params.mutedBorderColorClass,
        data.isDisabled && params.faintBgClass,
      ],

      allDayHeaderClass: 'items-center', // v-align
      allDayHeaderInnerClass: `text-xs/5 ${params.faintFgClass} p-3`,

      slotLabelInnerClass: `text-xs/5 ${params.faintFgClass} uppercase`,

      slotLaneClass: `border ${params.mutedBorderColorClass}`,

      moreLinkClass: [
        params.primaryOutlineColorClass,
        params.outlineWidthFocusClass,
      ],
      moreLinkInnerClass: 'whitespace-nowrap overflow-hidden',

      navLinkClass: [
        params.primaryOutlineColorClass,
        params.outlineWidthFocusClass,
      ],

      eventClass: (data) => [
        params.primaryOutlineColorClass,
        data.isSelected
          ? params.outlineWidthClass
          : params.outlineWidthFocusClass,
      ],

      blockEventClass: (data) => [
        'relative group',
        data.isInteractive
          ? params.faintEventPressableClass
          : params.faintEventBgClass,
        'print:bg-white',
        'border-transparent print:border-(--fc-event-color)',
      ],
      blockEventInnerClass: 'text-xs/4 flex', // NOTE: subclass determines direction
      /*
      ^^^NOTE: should core determine flex-direction because core needs to do sticky anyway, right!?
      */
      blockEventTimeClass: `${params.mutedEventFgClass} whitespace-nowrap overflow-hidden shrink-1`, // shrinks second
      blockEventTitleClass: `${params.mutedEventFgClass} whitespace-nowrap overflow-hidden shrink-100`, // shrinks first

      backgroundEventClass: params.bgEventBgClass,
      backgroundEventTitleClass: (data) => [
        'm-2 opacity-50 italic',
        params.fgClass,
        data.isCompact ? xxsTextClass : 'text-xs',
      ],

      rowEventClass: (data) => [
        'border-y',
        data.isStart && 'border-s',
        data.isEnd && 'border-e',
        data.isStart && (data.isCompact ? 'rounded-s-sm' : 'rounded-s-md'),
        data.isEnd && (data.isCompact ? 'rounded-e-sm' : 'rounded-e-md'),
      ],
      rowEventBeforeClass: (data) => data.isStartResizable && [
        data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
        '-start-1',
      ],
      rowEventAfterClass: (data) => data.isEndResizable && [
        data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
        '-end-1',
      ],
      rowEventInnerClass: 'flex-row',
      rowEventTimeClass: 'p-0.5',
      rowEventTitleClass: 'p-0.5',

      columnEventClass: (data) => [
        'border-x',
        data.isStart && 'border-t rounded-t-lg',
        data.isEnd && 'border-b rounded-b-lg',
        (data.level || data.isMirror) && `ring ${params.bgRingColorClass}`,
      ],
      columnEventBeforeClass: (data) => data.isStartResizable && [
        data.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
        '-top-1',
      ],
      columnEventAfterClass: (data) => data.isEndResizable && [
        data.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
        '-bottom-1',
      ],
      columnEventInnerClass: 'flex-col py-1',
      // TODO: move the x-padding to the inner div? same concept with row-events
      columnEventTimeClass: 'px-2 pt-1',
      columnEventTitleClass: 'px-2 py-1 font-semibold',

      columnMoreLinkClass: `rounded-md ${params.strongSolidPressableClass} border border-transparent print:border-black print:bg-white ring ${params.bgRingColorClass}`,
      columnMoreLinkInnerClass: `p-0.5 text-xs/4 ${params.fgClass}`,
      // TODO: see columnMoreLinkClass in timeGrid below...

      fillerClass: `border ${params.mutedBorderColorClass} ${params.bgClass}`,

      singleMonthClass: 'm-5',
      singleMonthHeaderClass: (data) => [
        'justify-center', // h-align
        data.isSticky && `${params.bgClass} border-b ${params.borderColorClass}`,
        data.colCount > 1 ? 'pb-1' : 'py-1',
      ],
      singleMonthHeaderInnerClass: (data) => [
        `text-sm font-semibold rounded-sm py-1 px-2 ${params.strongFgClass}`,
        data.hasNavLink && params.ghostPressableClass,
      ],

      nowIndicatorLineClass: `-m-px border-1 ${params.nowBorderColorClass}`,
      nowIndicatorDotClass: `rounded-full size-0 -m-[6px] border-6 ${params.nowBorderColorClass} ring-2 ${params.bgRingColorClass}`,

      // TODO: event resizing
      // TODO: do isMajor border as darker (and put into checklist)
    },
    views: {
      dayGrid: {
        ...dayGridClasses,
        dayCellBottomClass: 'min-h-[1px]',
        dayHeaderDividerClass: `border-b ${params.strongBorderColorClass}`,
        dayHeaderClass: (data) => [
          'border',
          data.isMajor
            ? params.strongBorderColorClass
            : params.borderColorClass,
        ],
        dayCellClass: (data) => data.isMajor
          ? params.strongBorderColorClass
          : params.borderColorClass,
      },
      multiMonth: {
        ...dayGridClasses,
        dayCellBottomClass: 'min-h-[1px]',
        dayHeaderDividerClass: (data) => [
          data.isSticky && `border-b ${params.strongBorderColorClass} shadow-sm`,
        ],
        dayHeaderClass: (data) => [
          // isCompact is a HACK to detect multi-month multi-col
          !data.isCompact && joinClassNames(
            'border',
            data.isMajor
              ? params.strongBorderColorClass
              : params.borderColorClass,
          ),
        ],

        tableHeaderClass: (data) => data.isSticky && params.bgClass,
        tableBodyClass: `border ${params.borderColorClass} shadow-sm rounded-md overflow-hidden`,

        // TODO: sync with dayGrid?
      },
      timeGrid: {
        ...dayGridClasses,
        dayCellBottomClass: 'min-h-3',

        allDayDividerClass: `border-b ${params.strongBorderColorClass} shadow-sm`,

        dayHeaderDividerClass: (data) => [
          'border-b',
          data.isSticky ? `${params.strongBorderColorClass} shadow-sm` : params.borderColorClass,
        ],
        dayHeaderClass: (data) => [
          'border',
          data.isMajor
            ? params.strongBorderColorClass
            : params.borderColorClass,
        ],
        dayCellClass: (data) => data.isMajor
          ? params.strongBorderColorClass
          : params.mutedBorderColorClass,
        weekNumberHeaderClass: 'justify-end items-center',
        weekNumberHeaderInnerClass: `px-3 text-sm/6 ${params.mutedFgClass}`,

        /*
        Figure out how not having any border on slotLabel affects height-syncing
        */
        slotLabelClass: 'justify-end',
        slotLabelInnerClass: 'relative -top-2.5 px-3 py-2',

        slotLabelDividerClass: `border-l ${params.mutedBorderColorClass}`,

        columnEventClass: (data) => [
          'mx-1', // TODO: move this to the columnInner thing? yes!!
          data.isStart && 'mt-1',
          data.isEnd && 'mb-1',
        ],
        columnMoreLinkClass: 'm-1',
      },
      list: {
        listDaysClass: 'px-4 my-10 mx-auto w-full max-w-200',
        listDayClass: `flex flex-row gap-2 not-last:border-b not-last:${params.borderColorClass}`,
        listDayHeaderClass: 'shrink-0 w-1/4 max-w-40',
        listDayHeaderInnerClass: `sticky top-0 py-4 text-sm ${params.mutedFgClass}`,
        listDayEventsClass: 'grow min-w-0 flex flex-col',

        listItemEventClass: `not-last:border-b ${params.borderColorClass}`,
        listItemEventInnerClass: 'py-4 flex flex-row justify-between gap-2 text-sm',

        // TODO: make this common?...
        listItemEventTimeClass: `order-1 ${params.mutedFgClass} text-end`,
        listItemEventTitleClass: [
          'font-semibold',
          'text-(--fc-event-color) brightness-60',
        ],

        noEventsClass: 'grow py-15 flex flex-col items-center justify-center',
        noEventsInnerClass: 'py-15',
      },
    },
  }
}
