import { CalendarOptions, DayCellData, DayHeaderData, joinClassNames, ViewOptions } from '@fullcalendar/core'

// ambient types (tsc strips during build because of {})
import {} from '@fullcalendar/daygrid'
import {} from '@fullcalendar/timegrid'
import {} from '@fullcalendar/list'
import {} from '@fullcalendar/multimonth'
import {} from '@fullcalendar/interaction'

/*
COLOR TODO:
  default-ui: are timegrid borders too faint (esp now that we have dotted isMinor) ?

NOTE: We don't do active: states, because tailwindplus does not do this!

REFERENCE:
  https://tailwindcss.com/plus/ui-blocks/application-ui/data-display/calendars
  Some dark mode:
    https://tailwindcss.com/plus/ui-blocks/application-ui/lists/tables
  User different navbar for view-selector:
    https://tailwindcss.com/plus/ui-blocks/application-ui/navigation/tabs#component-2a66fc822e8ad55f59321825e5af0980
  Flyout menus:
    https://tailwindcss.com/plus/ui-blocks/marketing/elements/flyout-menus#component-25601925ae83e51e1b31d3bd1c286515
*/

export interface EventCalendarOptionParams {
  // outline
  outlineWidthClass: string
  outlineWidthFocusClass: string
  outlineWidthGroupFocusClass: string
  outlineOffsetClass: string
  primaryOutlineColorClass: string

  // neutral backgrounds
  bgClass: string
  bgRingColorClass: string
  mutedBgClass: string
  faintBgClass: string

  // neutral foregrounds
  fgClass: string
  strongFgClass: string
  mutedFgClass: string
  mutedFgHoverClass: string
  faintFgClass: string

  // neutral borders
  borderColorClass: string
  borderStartColorClass: string
  strongBorderColorClass: string
  strongBorderBottomColorClass: string
  mutedBorderColorClass: string

  // neutral buttons
  strongSolidPressableClass: string
  mutedHoverClass: string
  mutedHoverPressableClass: string
  faintHoverClass: string
  faintHoverPressableClass: string

  // popover
  popoverClass: string
  popoverHeaderClass: string

  // primary
  primaryClass: string
  primaryBorderColorClass: string
  primaryPressableClass: string
  primaryPressableGroupClass: string

  // secondary
  secondaryClass: string
  secondaryPressableClass: string

  // event content
  eventColor: string
  eventFaintBgClass: string
  eventFaintPressableClass: string
  eventMutedFgClass: string
  bgEventColor: string
  bgEventBgClass: string

  // misc content
  highlightClass: string
  nowBorderColorClass: string
}

// usually 11px font / 12px line-height
export const xxsTextClass = 'text-[0.6875rem]/[1.090909]'

export function createEventCalendarOptions(params: EventCalendarOptionParams): {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} {

  /* Common
  ----------------------------------------------------------------------------------------------- */

  // transparent resizer for mouse
  const blockPointerResizerClass = 'absolute hidden group-hover:block'
  const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
  const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

  // circle resizer for touch
  const blockTouchResizerClass = `absolute size-2 border border-(--fc-event-color) ${params.bgClass} rounded-full`
  const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
  const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

  const getNormalDayHeaderBorderClass = (data: DayHeaderData) => (
    !data.inPopover && (
      data.isMajor ? `border ${params.strongBorderColorClass}` :
        !data.isNarrow && `border ${params.borderColorClass}`
    )
  )
  const getMutedDayHeaderBorderClass = (data: DayHeaderData) => (
    !data.inPopover && (
      data.isMajor ? `border ${params.strongBorderColorClass}` :
        !data.isNarrow && `border ${params.mutedBorderColorClass}`
    )
  )

  const getNormalDayCellBorderColorClass = (data: DayCellData) => (
    data.isMajor ? params.strongBorderColorClass : params.borderColorClass
  )
  const getMutedDayCellBorderColorClass = (data: DayCellData) => (
    data.isMajor ? params.strongBorderColorClass : params.mutedBorderColorClass
  )

  const tallDayCellBottomClass = 'min-h-3'
  const getShortDayCellBottomClass = (data: DayCellData) => (
    !data.isNarrow && 'min-h-px'
  )

  const mutedHoverButtonClass = joinClassNames(
    params.mutedHoverPressableClass,
    params.outlineWidthFocusClass,
    params.primaryOutlineColorClass,
  )

  const dayRowCommonClasses: CalendarOptions = {

    /* Day Row > List-Item Event
    --------------------------------------------------------------------------------------------- */

    listItemEventClass: (data) => [
      'mb-px p-px',
      data.isNarrow
        ? 'mx-px rounded-sm'
        : 'mx-1 rounded-md',
      data.isSelected
        ? params.mutedBgClass
        : data.isInteractive
          ? params.mutedHoverPressableClass
          : params.mutedHoverClass,
    ],

    listItemEventInnerClass: (data) => [
      'flex flex-row items-center justify-between',
      data.isNarrow
        ? `py-px ${xxsTextClass}`
        : 'py-0.5 text-xs',
    ],

    listItemEventTimeClass: (data) => [
      data.isNarrow ? 'px-px' : 'px-0.5',
      params.mutedFgClass,
      'order-1 whitespace-nowrap overflow-hidden shrink-1', // shrinks second
    ],

    listItemEventTitleClass: (data) => [
      data.isNarrow ? 'px-px' : 'px-0.5',
      params.strongFgClass,
      'font-medium whitespace-nowrap overflow-hidden shrink-100', // shrinks first
      data.timeText && 'text-ellipsis',
    ],

    /* Day Row > Row Event
    --------------------------------------------------------------------------------------------- */

    rowEventClass: (data) => [
      data.isStart && (data.isNarrow ? 'ms-0.5' : 'ms-1'),
      data.isEnd && (data.isNarrow ? 'me-0.5' : 'me-1'),
    ],

    rowEventInnerClass: (data) => data.isNarrow ? 'py-px' : 'py-0.5',

    /* Day Row > More-Link
    --------------------------------------------------------------------------------------------- */

    rowMoreLinkClass: (data) => [
      'mb-px border',
      data.isNarrow
        ? `mx-px ${params.primaryBorderColorClass} rounded-sm`
        : 'self-start mx-1 border-transparent rounded-md',
      params.mutedHoverPressableClass,
    ],

    rowMoreLinkInnerClass: (data) => [
      data.isNarrow
        ? `p-px ${xxsTextClass}`
        : 'p-0.5 text-xs',
      params.strongFgClass,
    ]
  }

  return {
    optionDefaults: {

      /* Abstract Event
      ------------------------------------------------------------------------------------------- */

      eventShortHeight: 50,
      eventColor: params.eventColor,

      eventClass: (data) => [
        data.isSelected
          ? joinClassNames(
              params.outlineWidthClass,
              data.isDragging && 'shadow-md',
            )
          : params.outlineWidthFocusClass,
        params.primaryOutlineColorClass,
      ],

      /* Background Event
      ------------------------------------------------------------------------------------------- */

      backgroundEventColor: params.bgEventColor,
      backgroundEventClass: params.bgEventBgClass,

      backgroundEventTitleClass: (data) => [
        'opacity-50 italic',
        data.isNarrow
          ? `p-1 ${xxsTextClass}`
          : 'p-2 text-xs',
        params.fgClass,
      ],

      /* Block Event
      ------------------------------------------------------------------------------------------- */

      blockEventClass: (data) => [
        'group relative',
        data.isInteractive
          ? params.eventFaintPressableClass
          : params.eventFaintBgClass,
        'print:bg-white',
        'border-transparent print:border-(--fc-event-color)',
        (data.isDragging && !data.isSelected) && 'opacity-75',
      ],

      blockEventInnerClass: params.eventMutedFgClass,
      blockEventTimeClass: 'whitespace-nowrap overflow-hidden shrink-1', // shrinks second
      blockEventTitleClass: 'whitespace-nowrap overflow-hidden shrink-100', // shrinks first

      /* Row Event
      ------------------------------------------------------------------------------------------- */

      rowEventClass: (data) => [
        'mb-px border-y',
        data.isStart && joinClassNames('border-s', data.isNarrow ? 'rounded-s-sm' : 'rounded-s-md'),
        data.isEnd && joinClassNames('border-e', data.isNarrow ? 'rounded-e-sm' : 'rounded-e-md'),
      ],

      rowEventBeforeClass: (data) => (
        data.isStartResizable && [
          data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-start-1',
        ]
      ),

      rowEventAfterClass: (data) => (
        data.isEndResizable && [
          data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-end-1',
        ]
      ),

      rowEventInnerClass: (data) => [
        'flex flex-row items-center',
        data.isNarrow ? xxsTextClass : 'text-xs',
      ],

      rowEventTimeClass: (data) => [
        data.isNarrow ? 'ps-0.5' : 'ps-1',
        'font-medium',
      ],

      rowEventTitleClass: (data) => (
        data.isNarrow ? 'px-0.5' : 'px-1'
      ),

      /* Column Event
      ------------------------------------------------------------------------------------------- */

      columnEventClass: (data) => [
        `border-x ring ${params.bgRingColorClass}`,
        data.isStart && joinClassNames('border-t rounded-t-lg', data.isNarrow ? 'mt-px' : 'mt-1'),
        data.isEnd && joinClassNames('border-b rounded-b-lg', data.isNarrow ? 'mb-px' : 'mb-1'),
      ],

      columnEventBeforeClass: (data) => (
        data.isStartResizable && [
          data.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
          '-top-1',
        ]
      ),

      columnEventAfterClass: (data) => (
        data.isEndResizable && [
          data.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
          '-bottom-1',
        ]
      ),

      columnEventInnerClass: (data) => [
        'flex',
        data.isShort
          ? 'flex-row items-center gap-1 p-1' // one line
          : joinClassNames( // two lines
              'flex-col',
              data.isNarrow ? 'px-1 py-0.5' : 'px-2 py-1',
            ),
        (data.isShort || data.isNarrow) ? xxsTextClass : 'text-xs',
      ],

      columnEventTimeClass: (data) => (
        !data.isShort && (data.isNarrow ? 'pt-0.5' : 'pt-1')
      ),

      columnEventTitleClass: (data) => [
        !data.isShort && (data.isNarrow ? 'py-0.5' : 'py-1'),
        'font-semibold',
      ],

      /* More-Link
      ------------------------------------------------------------------------------------------- */

      moreLinkClass: [
        params.outlineWidthFocusClass,
        params.primaryOutlineColorClass,
      ],
      moreLinkInnerClass: 'whitespace-nowrap overflow-hidden',

      columnMoreLinkClass: (data) => [
        data.isNarrow ? 'my-px' : 'my-1',
        'border border-transparent print:border-black rounded-md',
        `${params.strongSolidPressableClass} print:bg-white`,
        `ring ${params.bgRingColorClass}`,
      ],
      columnMoreLinkInnerClass: (data) => [
        data.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1 text-xs',
        params.fgClass,
      ],

      /* Day Header
      ------------------------------------------------------------------------------------------- */
      // see dayHeaderContent in slots.tsx...

      dayHeaderAlign: (data) => data.inPopover ? 'start' : 'center', // h-align

      dayHeaderClass: (data) => [
        'justify-center', // v-align
        data.inPopover && params.popoverHeaderClass,
      ],

      dayHeaderInnerClass: (data) => [
        'flex flex-row items-center', // v-align
        (!data.dayNumberText && !data.inPopover)
          // small uniform text
          ? joinClassNames(
              'py-1 rounded-sm text-xs',
              data.isNarrow
                ? `px-1 m-1 ${params.mutedFgClass}`
                : `px-1.5 m-2 font-semibold ${params.fgClass}`,
              data.hasNavLink && mutedHoverButtonClass,
            )
          // normal-sized varying-color text
          : (data.isToday && data.dayNumberText && !data.inPopover)
              // WITH today circle
              ? joinClassNames(
                  'group m-2 outline-none',
                  data.isNarrow ? 'h-6' : 'h-8'
                )
              // WITHOUT today circle
              : joinClassNames(
                  'rounded-sm',
                  data.inPopover
                    ? 'm-2 px-1 py-0.5'
                    : joinClassNames(
                        'mx-2 h-6 px-1.5',
                        data.isNarrow ? 'my-2' : 'my-3'
                      ),
                  data.hasNavLink && mutedHoverButtonClass,
                ),
      ],

      /* Day Cell
      ------------------------------------------------------------------------------------------- */

      dayCellClass: (data) => [
        'border',
        // don't display bg-color for other-month/disabled cells when businessHours is doing the same
        ((data.isOther || data.isDisabled) && !data.options.businessHours) && params.faintBgClass,
      ],

      dayCellTopClass: (data) => [
        data.isNarrow ? 'min-h-0.5' : 'min-h-1',
        'flex flex-row',
      ],

      dayCellTopInnerClass: (data) => [
        'flex flex-row items-center justify-center whitespace-nowrap', // v-align, h-align
        data.isNarrow
          ? `my-px h-5 ${xxsTextClass}`
          : 'my-1 h-6 text-xs',
        data.isToday
          // primary-colored circle or pill
          ? joinClassNames(
              'rounded-full font-semibold',
              data.isNarrow
                ? 'ms-px'
                : 'ms-1',
              data.text === data.dayNumberText
                ? (data.isNarrow ? 'w-5' : 'w-6') // circle
                : (data.isNarrow ? 'px-1' : 'px-2'), // pill
              data.hasNavLink
                ? joinClassNames(params.primaryPressableClass, params.outlineOffsetClass)
                : params.primaryClass,
            )
          // half-rounded-ghost-button
          : joinClassNames(
              'rounded-e-sm',
              data.isNarrow ? 'px-1' : 'px-2',
              data.hasNavLink && params.mutedHoverPressableClass,
              data.isOther
                ? params.faintFgClass
                : (data.monthText ? params.fgClass : params.mutedFgClass),
              data.monthText && 'font-bold',
            ),
      ],

      dayCellInnerClass: (data) => data.inPopover && 'p-2',

      /* Popover
      ------------------------------------------------------------------------------------------- */

      popoverClass: `${params.popoverClass} min-w-55`,

      popoverCloseClass: [
        'group absolute top-2 end-2 p-0.5 rounded-sm',
        mutedHoverButtonClass,
      ],

      /* Lane
      ------------------------------------------------------------------------------------------- */

      dayLaneClass: (data) => [
        'border',
        data.isMajor ? params.strongBorderColorClass : params.mutedBorderColorClass,
        data.isDisabled && params.faintBgClass,
      ],
      dayLaneInnerClass: (data) => (
        data.isStack
          ? 'm-1' // simple print-view
          : data.isNarrow ? 'mx-px' : 'mx-1'
      ),

      slotLaneClass: (data) => [
        `border ${params.mutedBorderColorClass}`,
        data.isMinor && 'border-dotted',
      ],

      /* List Day
      ------------------------------------------------------------------------------------------- */

      // contains multiple days
      listDaysClass: 'my-10 mx-auto w-full max-w-218 px-4',

      listDayClass: [
        `not-last:border-b ${params.mutedBorderColorClass}`,
        'flex flex-row items-start gap-2',
      ],

      listDayHeaderClass: 'my-px shrink-0 w-1/4 max-w-50 py-3.5 flex flex-col items-start',
      listDayHeaderInnerClass: (data) => [
        'my-0.5 py-0.5 px-2 -mx-2 rounded-full text-sm',
        !data.level
          // main title
          ? joinClassNames(
              data.isToday
                ? joinClassNames(
                    'font-semibold',
                    data.hasNavLink ? params.primaryPressableClass : params.primaryClass,
                  )
                : joinClassNames(
                    `font-medium ${params.strongFgClass}`,
                    data.hasNavLink && params.mutedHoverPressableClass,
                  )
            )
          // subtitle
          : joinClassNames(
              params.faintFgClass,
              data.hasNavLink && joinClassNames(
                params.mutedHoverPressableClass,
                params.mutedFgHoverClass,
              ),
            )
      ],

      listDayEventsClass: `my-4 grow min-w-0 border ${params.borderColorClass} rounded-md`,

      /* Single Month (in Multi-Month)
      ------------------------------------------------------------------------------------------- */

      singleMonthClass: 'm-4',

      singleMonthHeaderClass: (data) => [
        data.isSticky && `${params.bgClass} border-b ${params.borderColorClass}`,
        data.colCount > 1 ? 'pb-1' : 'py-1',
        'items-center', // h-align
      ],

      singleMonthHeaderInnerClass: (data) => [
        `py-1 px-2 rounded-md text-sm font-semibold ${params.strongFgClass}`,
        data.hasNavLink && params.mutedHoverPressableClass,
      ],

      /* Misc Table
      ------------------------------------------------------------------------------------------- */

      fillerClass: `border ${params.mutedBorderColorClass}`,

      dayNarrowWidth: 100,
      dayHeaderRowClass: `border ${params.mutedBorderColorClass}`,
      dayRowClass: `border ${params.borderColorClass}`,

      slotHeaderRowClass: `border ${params.borderColorClass}`,
      slotHeaderInnerClass: `${params.faintFgClass} uppercase`,

      /* Misc Content
      ------------------------------------------------------------------------------------------- */

      navLinkClass: [
        params.outlineWidthFocusClass,
        params.primaryOutlineColorClass,
      ],

      inlineWeekNumberClass: (data) => [
        `absolute top-0 end-0 ${params.bgClass} ${params.mutedFgClass} whitespace-nowrap rounded-es-md`,
        `border-b ${params.strongBorderBottomColorClass}`,
        `border-s ${params.borderStartColorClass}`,
        data.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1.5 text-xs',
        data.hasNavLink
          ? `${params.mutedHoverPressableClass} -outline-offset-1`
          : params.mutedHoverClass,
      ],

      highlightClass: params.highlightClass,
      nonBusinessClass: params.faintBgClass,

      nowIndicatorLineClass: `-m-px border-1 ${params.nowBorderColorClass}`,
      nowIndicatorDotClass: [
        `-m-[6px] border-6 ${params.nowBorderColorClass} size-0 rounded-full`,
        `ring-2 ${params.bgRingColorClass}`,
      ],
    },
    views: {

      /* View-Specific
      ------------------------------------------------------------------------------------------- */

      dayGrid: {
        ...dayRowCommonClasses,
        dayHeaderClass: getNormalDayHeaderBorderClass,
        dayHeaderDividerClass: `border-b ${params.strongBorderColorClass}`,
        dayCellClass: getNormalDayCellBorderColorClass,
        dayCellBottomClass: getShortDayCellBottomClass,

        // day-numbers are on start-side, so move bg-event titles to end-side
        backgroundEventInnerClass: 'flex flex-row justify-end',
      },
      multiMonth: {
        ...dayRowCommonClasses,
        dayHeaderClass: getNormalDayHeaderBorderClass,
        dayHeaderDividerClass: (data) => data.isSticky && `border-b ${params.strongBorderColorClass} shadow-sm`,
        dayCellBottomClass: getShortDayCellBottomClass,

        tableHeaderClass: (data) => data.isSticky && params.bgClass,
        tableBodyClass: `border ${params.borderColorClass} rounded-md shadow-xs overflow-hidden`,
      },
      timeGrid: {
        ...dayRowCommonClasses,
        dayHeaderClass: getMutedDayHeaderBorderClass,
        dayHeaderDividerClass: (data) => [
          'border-b',
          data.options.allDaySlot
            ? params.borderColorClass
            : `${params.strongBorderColorClass} shadow-sm`,
        ],
        dayCellClass: getMutedDayCellBorderColorClass,
        dayCellBottomClass: tallDayCellBottomClass,

        /* TimeGrid > Week Number Header
        ----------------------------------------------------------------------------------------- */

        weekNumberHeaderClass: 'items-center justify-end', // v-align, h-align
        weekNumberHeaderInnerClass: (data) => [
          `m-1.5 h-6 px-1.5 ${params.mutedFgClass} rounded-sm flex flex-row items-center`,
          data.hasNavLink && params.mutedHoverPressableClass,
          data.isNarrow ? 'text-xs' : 'text-sm',
        ],

        /* TimeGrid > All-Day Header
        ----------------------------------------------------------------------------------------- */

        allDayHeaderClass: 'items-center', // v-align
        allDayHeaderInnerClass: (data) => [
          `p-3 ${params.faintFgClass}`,
          data.isNarrow ? xxsTextClass : 'text-xs',
        ],

        allDayDividerClass: `border-b ${params.strongBorderColorClass} shadow-sm`,

        /* TimeGrid > Slot Header
        ----------------------------------------------------------------------------------------- */

        slotHeaderClass: 'justify-end', // h-align
        slotHeaderInnerClass: (data) => [
          'relative px-3 py-2',
          data.isNarrow
            ? `-top-3.5 ${xxsTextClass}`
            : '-top-4 text-xs',
          data.isFirst && 'hidden',
        ],

        slotHeaderDividerClass: `border-e ${params.mutedBorderColorClass}`,
      },
      list: {

        /* List-View > List-Item Event
        ----------------------------------------------------------------------------------------- */

        listItemEventClass: (data) => [
          `group not-last:border-b ${params.mutedBorderColorClass} p-4 items-center gap-3`,
          data.isInteractive
            ? params.faintHoverPressableClass
            : params.faintHoverClass,
        ],

        listItemEventBeforeClass: 'border-4 border-(--fc-event-color) rounded-full', // 8px diameter

        listItemEventInnerClass: 'flex flex-row items-center gap-3 text-sm',

        listItemEventTimeClass: [
          'shrink-0 w-1/2 max-w-50 whitespace-nowrap overflow-hidden text-ellipsis',
          params.mutedFgClass,
        ],

        listItemEventTitleClass: (data) => [
          'grow min-w-0 font-medium whitespace-nowrap overflow-hidden',
          params.fgClass,
          data.event.url && 'group-hover:underline',
        ],

        /* No-Events Screen
        ----------------------------------------------------------------------------------------- */

        noEventsClass: 'grow flex flex-col items-center justify-center',
        noEventsInnerClass: 'py-15',
      },
    },
  }
}
