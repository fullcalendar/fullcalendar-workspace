import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'

// ambient types (tsc strips during build because of {})
import {} from '@fullcalendar/daygrid'
import {} from '@fullcalendar/timegrid'
import {} from '@fullcalendar/list'
import {} from '@fullcalendar/multimonth'
import {} from '@fullcalendar/interaction'

/*
COLOR TODO:
  Bad that timegrid slots are bolder than daygridheaders in same view?
  Rethink daygrid day-number color/boldness

REFERENCE:
  https://themeforest.net/item/arion-admin-dashboard-ui-kit-sketch-template/23432569
  colors from template:
    red: #FF3D57
    green: #09B66D
    primary-blue: #0081FF
    apple-primary-blue: #117aff
    apple-red: #fd453b (same for dark mode: #fd3b30)
    light-blue: #22CCE2
*/

export interface EventCalendarOptionParams {
  // outline
  outlineWidthClass: string
  outlineWidthFocusClass: string
  outlineWidthGroupFocusClass: string
  outlineOffsetClass: string
  outlineInsetClass: string
  tertiaryOutlineColorClass: string

  // neutral backgrounds
  bgClass: string
  bgRingColorClass: string
  mutedBgClass: string
  mutedSolidBgClass: string
  faintBgClass: string

  // neutral foregrounds
  fgClass: string
  mutedFgClass: string

  // neutral borders
  borderColorClass: string
  strongBorderColorClass: string

  // neutral buttons
  strongSolidPressableClass: string
  mutedPressableClass: string
  mutedHoverClass: string
  mutedHoverPressableClass: string

  // faint-on-hover
  faintHoverClass: string
  faintHoverPressableClass: string

  // popover
  popoverClass: string
  popoverHeaderClass: string

  // primary
  primaryBorderColorClass: string

  // tertiary
  tertiaryClass: string
  tertiaryPressableClass: string
  tertiaryPressableGroupClass: string

  // event content
  eventColor: string
  eventContrastColor: string
  bgEventColor: string
  bgEventBgClass: string

  // misc content
  highlightClass: string
  nowBorderColorClass: string
}

export const xxsTextClass = 'text-[0.6875rem]/[1.090909]' // usually 11px font / 12px line-height

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

  const tallDayCellBottomClass = 'min-h-3'
  const getShortDayCellBottomClass = (data: { isNarrow: boolean }) => (
    !data.isNarrow && 'min-h-0.5'
  )

  const dayRowCommonClasses: CalendarOptions = {

    /* Day Row > List-Item Event
    --------------------------------------------------------------------------------------------- */

    listItemEventClass: (data) => [
      'mb-px p-px rounded-sm',
      data.isNarrow ? 'mx-0.5' : 'mx-1',
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
      'order-1 whitespace-nowrap overflow-hidden shrink-1', // shrinks second
    ],

    listItemEventTitleClass: (data) => [
      data.isNarrow ? 'px-px' : 'px-0.5',
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
      'mb-px border rounded-sm',
      data.isNarrow
        ? `mx-0.5 ${params.primaryBorderColorClass}`
        : 'self-start mx-1 border-transparent',
      params.mutedPressableClass,
    ],

    rowMoreLinkInnerClass: (data) => [
      data.isNarrow
        ? `p-px ${xxsTextClass}`
        : 'p-0.5 text-xs',
      params.fgClass,
    ],
  }

  return {
    optionDefaults: {

      /* Abstract Event
      ------------------------------------------------------------------------------------------- */

      eventShortHeight: 50,
      eventColor: params.eventColor,
      eventContrastColor: params.eventContrastColor,

      eventClass: (data) => [
        data.isSelected
          ? joinClassNames(
              params.outlineWidthClass,
              data.isDragging && 'shadow-lg',
            )
          : params.outlineWidthFocusClass,
        params.tertiaryOutlineColorClass,
      ],

      /* Background Event
      ------------------------------------------------------------------------------------------- */

      backgroundEventColor: params.bgEventColor,
      backgroundEventClass: params.bgEventBgClass,

      backgroundEventTitleClass: (data) => [
        'opacity-50 italic',
        (data.isNarrow || data.isShort)
          ? `p-1 ${xxsTextClass}`
          : 'p-2 text-xs',
        params.fgClass,
      ],

      /* List-Item Event
      ------------------------------------------------------------------------------------------- */

      listItemEventTitleClass: params.fgClass,
      listItemEventTimeClass: params.mutedFgClass,

      /* Block Event
      ------------------------------------------------------------------------------------------- */

      blockEventClass: (data) => [
        'group relative border-transparent print:border-(--fc-event-color)',
        'bg-(--fc-event-color) print:bg-white',
        'hover:bg-[color-mix(in_oklab,var(--fc-event-color)_92%,var(--fc-event-contrast-color))]',
        data.isInteractive && 'active:bg-[color-mix(in_oklab,var(--fc-event-color)_85%,var(--fc-event-contrast-color))]',
        (data.isDragging && !data.isSelected) && 'opacity-75',
      ],

      blockEventInnerClass: 'text-(--fc-event-contrast-color) print:text-black',
      blockEventTimeClass: 'whitespace-nowrap overflow-hidden shrink-1', // shrinks second
      blockEventTitleClass: 'whitespace-nowrap overflow-hidden shrink-100', // shrinks first

      /* Row Event
      ------------------------------------------------------------------------------------------- */

      rowEventClass: (data) => [
        'mb-px border-y',
        data.isStart && 'rounded-s-sm border-s',
        data.isEnd && 'rounded-e-sm border-e',
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

      rowEventTimeClass: (data) => (
        data.isNarrow ? 'ps-0.5' : 'ps-1'
      ),

      rowEventTitleClass: (data) => [
        data.isNarrow ? 'px-0.5' : 'px-1',
        'font-medium',
      ],

      /* Column Event
      ------------------------------------------------------------------------------------------- */

      columnEventClass: (data) => [
        `border-x ring ${params.bgRingColorClass}`,
        data.isStart && joinClassNames('border-t rounded-t-lg', data.isNarrow ? 'mt-px' : 'mt-0.5'),
        data.isEnd && joinClassNames('border-b rounded-b-lg', data.isNarrow ? 'mb-px' : 'mb-0.5'),
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
        (data.isNarrow || data.isShort) ? xxsTextClass : 'text-xs',
      ],

      columnEventTimeClass: (data) => (
        !data.isShort && (data.isNarrow ? 'pt-0.5' : 'pt-1')
      ),

      columnEventTitleClass: (data) => [
        !data.isShort && (data.isNarrow ? 'py-0.5' : 'py-1'),
        'font-medium',
      ],

      /* More-Link
      ------------------------------------------------------------------------------------------- */

      moreLinkClass: [
        params.outlineWidthFocusClass,
        params.tertiaryOutlineColorClass,
      ],
      moreLinkInnerClass: 'whitespace-nowrap overflow-hidden',

      columnMoreLinkClass: [
        'my-0.5 border border-transparent print:border-black rounded-md',
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
      // dayHeaderContent in slots.tsx...

      dayHeaderClass: (data) => [
        'justify-center', // v-align
        data.inPopover ? params.popoverHeaderClass :
          data.isMajor && `border ${params.strongBorderColorClass}`,
      ],

      dayHeaderInnerClass: (data) => [
        'flex flex-row items-center', // v-align
        data.isNarrow ? 'text-xs' : 'text-sm',
        data.inPopover ? joinClassNames(
          // ghost-button IN POPOVER
          'm-1.5 px-1 py-0.5 rounded-sm font-semibold',
          params.fgClass,
          data.hasNavLink && params.mutedHoverPressableClass,
        ) : !data.dayNumberText ? joinClassNames(
          // ghost-button IN VIEW HEADER (short)
          'mx-0.5 my-1.5 py-0.5 px-1.5 rounded-sm',
          params.mutedFgClass,
          data.hasNavLink && params.mutedHoverPressableClass,
        ) : !data.isToday ? joinClassNames(
          // ghost-button IN VIEW HEADER (tall)
          'mx-2 my-2.5 h-6 px-1.5 rounded-sm',
          params.mutedFgClass,
          data.hasNavLink && params.mutedHoverPressableClass,
        ) : (
          // circle inside (see slots.tsx)
          'group mx-2 my-2 h-7 outline-none'
        )
      ],

      /* Day Cell
      ------------------------------------------------------------------------------------------- */

      dayCellClass: (data) => [
        'border',
        data.isMajor
          ? params.strongBorderColorClass
          : params.borderColorClass,
      ],

      dayCellTopClass: (data) => [
        data.isNarrow ? 'min-h-0.5' : 'min-h-1',
        'flex flex-row justify-end', // h-align
      ],

      dayCellTopInnerClass: (data) => [
        'flex flex-row items-center', // v-align
        data.isNarrow
          ? `my-px h-5 ${xxsTextClass}`
          : 'my-1 h-6 text-sm',
        !data.isToday
          // ghost-button
          ? joinClassNames(
              'rounded-s-sm whitespace-nowrap',
              !data.isOther && 'font-semibold',
              data.isNarrow ? 'px-1' : 'px-2',
              data.monthText ? params.fgClass : params.mutedFgClass,
              data.hasNavLink && params.mutedHoverPressableClass,
            )
          // circle inside (see slots.tsx)
          : joinClassNames(
              'group outline-none',
              data.isNarrow
                ? 'mx-px'
                : 'mx-2', // NOTE: today-circle might have -1 x-margin
            )
      ],

      dayCellInnerClass: (data) => data.inPopover && 'p-2',

      /* Popover
      ------------------------------------------------------------------------------------------- */

      popoverClass: `${params.popoverClass} min-w-55`,

      popoverCloseClass: [
        'group absolute top-1.5 end-1.5 p-0.5 rounded-sm',
        params.mutedHoverPressableClass,
        params.outlineWidthFocusClass,
        params.tertiaryOutlineColorClass,
      ],

      /* Lane
      ------------------------------------------------------------------------------------------- */

      dayLaneClass: (data) => [
        'border',
        data.isMajor ? params.strongBorderColorClass : params.borderColorClass,
        data.isDisabled && params.faintBgClass,
      ],
      dayLaneInnerClass: (data) => (
        data.isStack
          ? 'm-1' // simple print-view
          : data.isNarrow ? 'mx-px' : 'mx-0.5'
      ),

      slotLaneClass: (data) => [
        `border ${params.borderColorClass}`,
        data.isMinor && 'border-dotted',
      ],

      /* List Day
      ------------------------------------------------------------------------------------------- */

      listDayClass: 'group/day flex flex-col',

      listDayHeaderClass: [
        `border-b ${params.borderColorClass} ${params.faintBgClass} ${params.fgClass}`,
        'flex flex-row items-center justify-between',
      ],
      listDayHeaderInnerClass: (data) => [
        'm-1.5 px-1.5 py-0.5 rounded-sm text-sm',
        !data.level && 'font-semibold',
        (!data.level && data.isToday)
          // today
          ? data.hasNavLink
              ? joinClassNames(params.tertiaryPressableClass, params.outlineOffsetClass)
              : params.tertiaryClass
          // NOT today
          : data.hasNavLink && params.mutedHoverPressableClass,
      ],

      listDayEventsClass: `group-not-last/day:border-b ${params.borderColorClass} px-1.5 py-2 gap-2`,

      /* Single Month (in Multi-Month)
      ------------------------------------------------------------------------------------------- */

      singleMonthClass: 'm-4',

      singleMonthHeaderClass: (data) => [
        data.isSticky && `border-b ${params.borderColorClass} ${params.bgClass}`,
        data.colCount > 1 ? 'pb-2' : 'py-1',
        'items-center', // h-align
      ],

      singleMonthHeaderInnerClass: (data) => [
        'px-1.5 py-0.5 rounded-sm font-semibold',
        data.hasNavLink && params.mutedHoverPressableClass,
      ],

      /* Misc Table
      ------------------------------------------------------------------------------------------- */

      tableHeaderClass: (data) => data.isSticky && params.bgClass,
      fillerClass: `border ${params.borderColorClass} opacity-50`,

      dayNarrowWidth: 100,
      dayHeaderRowClass: `border ${params.borderColorClass}`,
      dayRowClass: `border ${params.borderColorClass}`,

      slotLabelRowClass: `border ${params.borderColorClass}`,
      slotLabelInnerClass: params.mutedFgClass,

      /* Misc Content
      ------------------------------------------------------------------------------------------- */

      navLinkClass: [
        params.outlineWidthFocusClass,
        params.tertiaryOutlineColorClass,
      ],

      inlineWeekNumberClass: (data) => [
        `absolute start-0 whitespace-nowrap rounded-e-sm`,
        data.isNarrow
          ? `top-0.5 my-px p-0.5 ${xxsTextClass}`
          : 'top-1 p-1 text-xs',
        data.hasNavLink && params.mutedHoverPressableClass,
        params.mutedFgClass,
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
        dayHeaderAlign: (data) => data.inPopover ? 'start' : data.isNarrow ? 'center' : 'end',
        dayHeaderDividerClass: `border-b ${params.borderColorClass}`,
        dayCellBottomClass: getShortDayCellBottomClass,
      },
      multiMonth: {
        ...dayRowCommonClasses,
        dayHeaderAlign: (data) => data.inPopover ? 'start' : data.isNarrow ? 'center' : 'end',
        dayHeaderDividerClass: (data) => data.isSticky && `border-b ${params.borderColorClass}`,
        dayCellBottomClass: getShortDayCellBottomClass,

        tableBodyClass: `border ${params.borderColorClass} rounded-sm overflow-hidden`,
      },
      timeGrid: {
        ...dayRowCommonClasses,
        dayHeaderAlign: (data) => data.inPopover ? 'start' : 'center',
        dayHeaderDividerClass: (data) => [
          'border-b',
          data.options.allDaySlot
            ? params.borderColorClass
            : `${params.strongBorderColorClass} shadow-sm`
        ],
        dayCellBottomClass: tallDayCellBottomClass,

        /* TimeGrid > Week Number Header
        ----------------------------------------------------------------------------------------- */

        weekNumberHeaderClass: 'items-center justify-end', // v-align, h-align
        weekNumberHeaderInnerClass: (data) => [
          `mx-0.5 h-6 px-1.5 ${params.mutedFgClass} flex flex-row items-center rounded-sm`,
          data.isNarrow ? 'text-xs' : 'text-sm',
          data.hasNavLink && params.mutedHoverPressableClass,
        ],

        /* TimeGrid > All-Day Header
        ----------------------------------------------------------------------------------------- */

        allDayHeaderClass: 'items-center', // v-align
        allDayHeaderInnerClass: (data) => [
          `p-2 ${params.mutedFgClass}`,
          data.isNarrow ? xxsTextClass : 'text-xs',
        ],

        allDayDividerClass: `border-b ${params.strongBorderColorClass} shadow-sm`,

        /* TimeGrid > Slot Label
        ----------------------------------------------------------------------------------------- */

        slotLabelClass: 'justify-end', // h-align
        slotLabelInnerClass: (data) => [
          'relative p-2',
          data.isNarrow
            ? `-top-3.5 ${xxsTextClass}`
            : '-top-4 text-xs',
          data.isFirst && 'hidden',
        ],

        slotLabelDividerClass: `border-e ${params.borderColorClass}`,
      },
      list: {

        /* List-View > List-Item Event
        ----------------------------------------------------------------------------------------- */

        listItemEventClass: (data) => [
          'group py-1 rounded-sm',
          data.isInteractive
            ? joinClassNames(params.faintHoverPressableClass, params.outlineInsetClass)
            : params.faintHoverClass,
        ],

        listItemEventBeforeClass: 'w-1.5 bg-(--fc-event-color) rounded-full', // stretches full height

        listItemEventInnerClass: '[display:contents]',

        listItemEventTimeClass: [
          '-order-1 shrink-0 w-1/2 max-w-60 px-4 py-2',
          'whitespace-nowrap overflow-hidden text-ellipsis text-sm',
        ],

        listItemEventTitleClass: (data) => [
          'grow min-w-0 px-4 py-2 whitespace-nowrap overflow-hidden text-sm',
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
