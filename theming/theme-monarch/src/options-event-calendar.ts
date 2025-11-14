import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'
import { filledRightTriangle } from './svgs.js'

/*
COLOR TODO:
  default-ui/shadcn: transparentPressableClass hover effect is unnoticable in dark mode
  default-ui: dark-mode now-indicator color is ugly pink
  default-ui: business hours a bit too dark (i.e. "faint" color not faint enough)
*/

// ambient types (tsc strips during build because of {})
import {} from '@fullcalendar/daygrid'
import {} from '@fullcalendar/timegrid'
import {} from '@fullcalendar/list'
import {} from '@fullcalendar/multimonth'
import {} from '@fullcalendar/interaction'

export interface EventCalendarOptionParams {
  // outline
  outlineWidthClass: string
  outlineWidthFocusClass: string
  outlineWidthGroupFocusClass: string
  tertiaryOutlineColorClass: string

  // neutral backgrounds
  bgClass: string
  bgRingColorClass: string
  mutedBgClass: string
  faintBgClass: string

  // neutral foregrounds
  mutedFgClass: string
  faintFgClass: string

  // neutral borders
  borderColorClass: string
  strongBorderColorClass: string
  primaryBorderColorClass: string

  // neutral buttons
  strongSolidPressableClass: string

  // muted-on-hover
  mutedHoverClass: string
  mutedHoverPressableClass: string
  mutedHoverPressableGroupClass: string

  // popover
  popoverClass: string

  // secondary
  secondaryClass: string
  secondaryPressableClass: string

  // tertiary
  tertiaryClass: string
  tertiaryPressableClass: string
  tertiaryPressableGroupClass: string

  // event content
  eventColor: string
  eventContrastColor: string
  bgEventColor: string
  bgEventBgClass: string

  // misc calendar content
  highlightClass: string
  nowBorderColorClass: string
}

export const xxsTextClass = 'text-[0.6875rem]/[1.090909]' // usually 11px font / 12px line-height

export function createEventCalendarOptions(params: EventCalendarOptionParams): {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} {
  // transparent resizer for mouse
  const blockPointerResizerClass = `absolute hidden group-hover:block`
  const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
  const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

  // circle resizer for touch
  const blockTouchResizerClass = `absolute size-2 border border-(--fc-event-color) ${params.bgClass} rounded-full`
  const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
  const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

  const tallDayCellBottomClass = 'min-h-4'
  const getShortDayCellBottomClass = (data: { isNarrow: boolean }) => (
    !data.isNarrow && 'min-h-[1px]'
  )

  const dayRowCommonClasses: CalendarOptions = {
    listItemEventClass: (data) => [
      'mb-px p-px rounded-sm',
      data.isNarrow ? 'mx-px' : 'mx-0.5',
    ],
    listItemEventBeforeClass: (data) => [
      'border-4', // 8px diameter
      data.isNarrow ? 'ms-0.5' : 'ms-1',
    ],
    listItemEventInnerClass: (data) => (
      data.isNarrow
        ? `py-px ${xxsTextClass}`
        : 'py-0.5 text-xs'
    ),
    listItemEventTimeClass: (data) => [
      data.isNarrow ? 'ps-0.5' : 'ps-1',
      'whitespace-nowrap overflow-hidden shrink-1', // shrinks second
    ],
    listItemEventTitleClass: (data) => [
      data.isNarrow ? 'px-0.5' : 'px-1',
      'font-bold whitespace-nowrap overflow-hidden shrink-100', // shrinks first
    ],

    rowEventClass: (data) => [
      data.isStart && 'ms-px',
      data.isEnd && 'me-px',
    ],
    rowEventInnerClass: (data) => data.isNarrow ? 'py-px' : 'py-0.5',

    rowMoreLinkClass: (data) => [
      'mb-px border rounded-sm',
      data.isNarrow
        ? `mx-px ${params.primaryBorderColorClass}`
        : 'mx-0.5 border-transparent',
      params.mutedHoverPressableClass,
    ],
    rowMoreLinkInnerClass: (data) => (
      data.isNarrow
        ? `px-0.5 py-px ${xxsTextClass}`
        : `px-1 py-0.5 text-xs`
    ),
  }

  return {
    optionDefaults: {
      dayPopoverFormat: { day: 'numeric', weekday: 'short' },
      dayNarrowWidth: 100,
      eventShortHeight: 50,
      eventColor: params.eventColor,
      eventContrastColor: params.eventContrastColor,
      backgroundEventColor: params.bgEventColor,

      tableHeaderClass: (data) => (
        data.isSticky && `border-b ${params.borderColorClass} ${params.bgClass}`
      ),

      singleMonthClass: 'm-4',
      singleMonthHeaderClass: (data) => [
        data.isSticky && `border-b ${params.borderColorClass} ${params.bgClass}`,
        data.colCount > 1 ? 'pb-2' : 'py-1',
        'justify-center', // h-align
      ],
      singleMonthHeaderInnerClass: (data) => [
        'px-3 py-1 rounded-full font-bold',
        data.hasNavLink && params.mutedHoverPressableClass,
      ],

      popoverClass: `${params.popoverClass} min-w-60`,
      popoverCloseClass: [
        'absolute top-2 end-2 size-8 rounded-full group',
        'inline-flex flex-row justify-center items-center',
        params.mutedHoverPressableClass,
        params.outlineWidthFocusClass,
        params.tertiaryOutlineColorClass,
      ],

      fillerClass: (data) => [
        'opacity-50 border',
        data.isHeader ? 'border-transparent' : params.borderColorClass,
      ],
      nonBusinessClass: params.faintBgClass,
      highlightClass: params.highlightClass,

      moreLinkClass: [
        params.outlineWidthFocusClass,
        params.tertiaryOutlineColorClass,
      ],
      moreLinkInnerClass: 'whitespace-nowrap overflow-hidden',

      navLinkClass: [
        params.outlineWidthFocusClass,
        params.tertiaryOutlineColorClass,
      ],

      inlineWeekNumberClass: (data) => [
        'absolute flex flex-row items-center whitespace-nowrap', // v-align
        data.isNarrow
          ? `top-0.5 start-0 my-px pe-1 h-4 rounded-e-full ${xxsTextClass}` // half-pill
          : 'top-1.5 start-1 px-2 h-6 rounded-full text-sm', // pill
        data.hasNavLink
          ? params.secondaryPressableClass
          : params.secondaryClass,
      ],

      eventClass: (data) => [
        data.event.url && 'hover:no-underline',
        data.isSelected
          ? joinClassNames(
              params.outlineWidthClass,
              data.isDragging ? 'shadow-lg' : 'shadow-md',
            )
          : params.outlineWidthFocusClass,
        params.tertiaryOutlineColorClass,
      ],

      backgroundEventClass: params.bgEventBgClass,
      backgroundEventTitleClass: (data) => [
        'opacity-50 italic',
        data.isNarrow
          ? `mx-1 my-1.5 ${xxsTextClass}`
          : 'mx-2 my-2.5 text-xs',
      ],

      listItemEventClass: (data) => [
        'items-center',
        data.isSelected
          ? params.mutedBgClass
          : data.isInteractive
            ? params.mutedHoverPressableClass
            : params.mutedHoverClass,
      ],
      listItemEventBeforeClass: 'rounded-full border-(--fc-event-color)',
      listItemEventInnerClass: 'flex flex-row items-center',

      listDayFormat: { day: 'numeric' },
      listDaySideFormat: { month: 'short', weekday: 'short', forceCommas: true },

      blockEventClass: (data) => [
        'relative group',
        'border-transparent print:border-(--fc-event-color)',
        'bg-(--fc-event-color) hover:bg-[color-mix(in_oklab,var(--fc-event-color)_92%,var(--fc-event-contrast-color))] print:bg-white',
        data.isInteractive && 'active:bg-[color-mix(in_oklab,var(--fc-event-color)_85%,var(--fc-event-contrast-color))]',
        (!data.isSelected && data.isDragging) && 'opacity-75',
      ],
      blockEventInnerClass: 'flex text-(--fc-event-contrast-color) print:text-black',
      blockEventTimeClass: 'whitespace-nowrap overflow-hidden',
      blockEventTitleClass: 'whitespace-nowrap overflow-hidden',

      rowEventClass: (data) => [
        'mb-px border-y',
        data.isStart ? 'border-s rounded-s-sm' : (!data.isNarrow && 'ms-2'), // space for triangle
        data.isEnd ? 'border-e rounded-e-sm' : (!data.isNarrow && 'me-2'), // space for triangle
      ],
      rowEventBeforeClass: (data) => (
        data.isStartResizable ? [
          data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-start-1',
        ] : (!data.isStart && !data.isNarrow) && [
          'absolute -start-2 w-2 -top-px -bottom-px' // housing for triangle
        ]
      ),
      rowEventBeforeContent: (data) => (
        (!data.isStart && !data.isNarrow) && filledRightTriangle(
          'size-full rotate-180 [[dir=rtl]_&]:rotate-0 text-(--fc-event-color)',
        )
      ),
      rowEventAfterClass: (data) => (
        data.isEndResizable ? [
          data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-end-1',
        ] : (!data.isEnd && !data.isNarrow) && [
          'absolute -end-2 w-2 -top-px -bottom-px', // housing for triangle
        ]
      ),
      rowEventAfterContent: (data) => (
        (!data.isEnd && !data.isNarrow) && filledRightTriangle(
          'size-full [[dir=rtl]_&]:rotate-180 text-(--fc-event-color)',
        )
      ),
      rowEventInnerClass: (data) => [
        'flex-row items-center',
        data.isNarrow ? xxsTextClass : 'text-xs',
      ],
      rowEventTimeClass: (data) => [
        'font-bold shrink-1', // shrinks second
        data.isNarrow ? 'ps-0.5' : 'ps-1',
      ],
      rowEventTitleClass: (data) => [
        'shrink-100', // shrinks first
        data.isNarrow ? 'px-0.5' : 'px-1',
      ],

      columnEventClass: (data) => [
        `mb-px border-x ring ${params.bgRingColorClass}`,
        data.isStart && 'border-t rounded-t-sm',
        data.isEnd && 'border-b rounded-b-sm',
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
        data.isShort
          ? 'flex-row p-1 gap-1' // one line
          : joinClassNames( // two lines
              'flex-col',
              data.isNarrow ? 'px-1 py-0.5' : 'px-2 py-1',
            ),
        (data.isShort || data.isNarrow) ? xxsTextClass : 'text-xs',
      ],
      columnEventTimeClass: (data) => [
        'order-1 shrink-100', // appears below, shrinks first
        !data.isShort && (data.isNarrow ? 'pb-0.5' : 'pb-1'),
      ],
      columnEventTitleClass: (data) => [
        'shrink-1', // appears above, shrinks second
        !data.isShort && (data.isNarrow ? 'py-0.5' : 'py-1'),
      ],
      columnEventTitleSticky: false, // disabled because title is below time

      columnMoreLinkClass: [
        'mb-px border border-transparent print:border-black rounded-sm',
        `${params.strongSolidPressableClass} print:bg-white`,
        `ring ${params.bgRingColorClass}`,
      ],
      columnMoreLinkInnerClass: (data) => (
        data.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1 text-xs'
      ),

      dayHeaderRowClass: `border ${params.borderColorClass}`,

      dayHeaderAlign: 'center', // h-align

      // FORCED flex-col
      dayHeaderClass: (data) => [
        'justify-center', // v-align
        data.isMajor && `border ${params.strongBorderColorClass}`,
        (data.isDisabled && !data.inPopover) && params.faintBgClass,
      ],
      dayHeaderInnerClass: (
        'mt-2 mx-2 flex flex-col items-center group outline-none' // children do focus outline
      ),
      // dayHeaderContent in slots.tsx...

      dayRowClass: `border ${params.borderColorClass}`,

      dayCellClass: (data) => [
        'border',
        data.isMajor ? params.strongBorderColorClass : params.borderColorClass,
        data.isDisabled && params.faintBgClass,
      ],
      dayCellTopClass: (data) => [
        'min-h-[2px] flex flex-row',
        data.isNarrow ? 'justify-end' : 'justify-center',
      ],
      dayCellTopInnerClass: (data) => [
        'flex flex-row items-center justify-center whitespace-nowrap rounded-full',
        data.isNarrow
          ? `h-5 m-px ${xxsTextClass}`
          : `h-6 m-1.5 text-sm`,
        data.text === data.dayNumberText
          ? (data.isNarrow ? 'w-5' : 'w-6') // circle
          : (data.isNarrow ? 'px-1' : 'px-2'), // pill
        data.isToday
          ? (data.hasNavLink ? params.tertiaryPressableClass : params.tertiaryClass)
          : (data.hasNavLink && params.mutedHoverPressableClass),
        data.isOther && params.faintFgClass,
        data.monthText && 'font-bold',
      ],
      dayCellInnerClass: (data) => data.inPopover && 'p-2',

      dayLaneClass: (data) => [
        'border',
        data.isMajor ? params.strongBorderColorClass : params.borderColorClass,
        data.isDisabled && params.faintBgClass,
      ],
      dayLaneInnerClass: (data) => (
        data.isSimple
          ? 'm-1' // simple print-view
          : data.isNarrow ? 'mx-px' : 'ms-0.5 me-[2.5%]'
      ),

      slotLaneClass: (data) => [
        `border ${params.borderColorClass}`,
        data.isMinor && 'border-dotted',
      ],

      nowIndicatorLineClass: `-m-px border-1 ${params.nowBorderColorClass}`,
      nowIndicatorDotClass: [
        `-m-[6px] border-6 ${params.nowBorderColorClass} size-0 rounded-full`,
        `ring-2 ${params.bgRingColorClass}`,
      ],
    },
    views: {
      dayGrid: {
        ...dayRowCommonClasses,
        dayCellBottomClass: getShortDayCellBottomClass,
      },
      multiMonth: {
        tableBodyClass: `border ${params.borderColorClass} rounded-sm`,
        dayHeaderInnerClass: (data) => !data.inPopover && 'mb-2',

        ...dayRowCommonClasses,
        dayCellBottomClass: getShortDayCellBottomClass,
      },
      timeGrid: {
        ...dayRowCommonClasses,
        dayCellBottomClass: tallDayCellBottomClass,

        // FORCED flex-row
        weekNumberHeaderClass: 'items-center justify-end', // v-align, h-align
        weekNumberHeaderInnerClass: (data) => [
          'ms-1 my-2 flex flex-row items-center rounded-full',
          data.options.dayMinWidth !== undefined && 'me-1', // when h-scrolling
          data.isNarrow
            ? 'h-5 px-1.5 text-xs'
            : 'h-6 px-2 text-sm',
          data.hasNavLink
            ? params.secondaryPressableClass
            : params.secondaryClass,
        ],

        // FORCED flex-row
        allDayHeaderClass: 'items-center justify-end', // v-align, h-align
        allDayHeaderInnerClass: (data) => [
          /*
          whitespace-pre -- respects line breaks for locale text
          text-end -- aligns text when multi-line
          */
          'p-2 whitespace-pre text-end',
          data.isNarrow ? xxsTextClass : 'text-sm',
        ],

        allDayDividerClass: `border-t ${params.borderColorClass}`,

        slotLabelClass: (data) => [
          'w-2 self-end justify-end', // self-h-align, h-align
          `border ${params.borderColorClass}`,
          data.isMinor && 'border-dotted',
        ],
        slotLabelInnerClass: (data) => [
          'relative ps-2 pe-3 py-2',
          data.isNarrow
            ? `-top-4 ${xxsTextClass}`
            : '-top-5 text-sm',
          data.isFirst && 'hidden',
        ],
        slotLabelDividerClass: (data) => [
          'border-s',
          (data.isHeader && data.options.dayMinWidth === undefined)
            ? 'border-transparent'
            : params.borderColorClass,
        ],
      },
      list: {
        listDayClass: `not-last:border-b ${params.borderColorClass} flex flex-row items-start`,

        listDayHeaderClass: 'm-2 shrink-0 w-1/3 max-w-44 min-h-9 flex flex-row items-center gap-2',
        listDayHeaderInnerClass: (data) => (
          !data.level
            // main day-header
            ? joinClassNames(
                'h-9 rounded-full flex flex-row items-center text-lg',
                data.text === data.dayNumberText
                  ? 'w-9 justify-center' // circle
                  : 'px-3', // pill
                data.isToday
                  ? (data.hasNavLink ? params.tertiaryPressableClass : params.tertiaryClass)
                  : (data.hasNavLink && params.mutedHoverPressableClass)
              )
            // alt day-header
            : joinClassNames(
                'text-xs uppercase',
                data.hasNavLink && 'hover:underline',
              )
        ),

        listDayEventsClass: 'py-2 grow min-w-0 flex flex-col',

        // FORCED flex-row
        listItemEventClass: 'p-2 rounded-s-full gap-2 group',
        listItemEventBeforeClass: 'mx-2 border-5', // 10px diameter
        // FORCED flex-row
        listItemEventInnerClass: 'gap-2 text-sm',
        listItemEventTimeClass: 'shrink-0 w-1/2 max-w-40 whitespace-nowrap overflow-hidden text-ellipsis',
        listItemEventTitleClass: (data) => [
          'grow min-w-0 whitespace-nowrap overflow-hidden',
          data.event.url && 'group-hover:underline',
        ],

        noEventsClass: 'grow flex flex-col items-center justify-center',
        noEventsInnerClass: 'py-15',
      },
    },
  }
}
