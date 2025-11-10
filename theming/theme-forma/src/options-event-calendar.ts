import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'

/*
REAL TODO:
  continuation arrows nomore when isNarrow
  Week-view business hours, add dark line at top bottom (see real outlook site)
  BUG: no hover+down effect on week-number in timegrid view
*/

// ambient types (tsc strips during build because of {})
import {} from '@fullcalendar/daygrid'
import {} from '@fullcalendar/timegrid'
import {} from '@fullcalendar/list'
import {} from '@fullcalendar/multimonth'
import {} from '@fullcalendar/interaction'

export const xxsTextClass = 'text-[0.6875rem]/[1.090909]' // usually 11px font / 12px line-height
const cellPaddingClass = 'p-2'
const axisClass = 'justify-end' // align axisInner right
const axisInnerClass = `${cellPaddingClass} text-end` // align text right when multiline

const getSlotClasses = (data: { isMinor: boolean }, borderClass: string) => [
  borderClass,
  data.isMinor && 'border-dotted',
]

export interface EventCalendarOptionParams {
  // outline
  outlineWidthClass: string
  outlineWidthFocusClass: string
  outlineOffsetClass: string
  outlineInsetClass: string
  primaryOutlineColorClass: string

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

  // muted *button*
  mutedClass: string
  mutedPressableClass: string

  // strong *button*
  strongSolidPressableClass: string

  // muted-on-hover
  mutedHoverClass: string
  mutedHoverPressableClass: string

  // popover
  popoverClass: string
  popoverHeaderClass: string

  // primary
  primaryClass: string
  primaryBorderColorClass: string
  primaryPressableClass: string

  // event content
  eventColor: string
  eventContrastColor: string
  eventFaintBgClass: string
  eventFaintPressableClass: string
  eventMutedBgClass: string
  eventMutedPressableClass: string
  bgEventColor: string
  bgEventBgClass: string

  // misc calendar content
  highlightClass: string
  nowBorderColorClass: string
}

export function createEventCalendarOptions(params: EventCalendarOptionParams): {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} {
  // transparent resizer for mouse
  const blockPointerResizerClass = `absolute hidden group-hover:block`
  const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
  const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

  // circle resizer for touch
  const blockTouchResizerClass = `absolute size-2 rounded-full border border-(--fc-event-color) ${params.bgClass}`
  const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
  const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

  const dayRowItemClasses: CalendarOptions = {
    listItemEventClass: (data) => [
      'mb-px p-px rounded-sm items-center',
      data.isNarrow ? 'mx-px' : 'mx-0.5',
      data.isSelected
        ? joinClassNames(params.mutedBgClass, data.isDragging && 'shadow-sm')
        : (data.isInteractive ? params.mutedHoverPressableClass : params.mutedHoverClass),
    ],
    listItemEventBeforeClass: (data) => [
      data.isNarrow ? 'ms-0.5' : 'ms-1',
      'border-4', // 8px diameter circle

      // Dot uses border instead of bg because it shows up in print
      // Views must decide circle radius via border thickness
      'rounded-full border-(--fc-event-color)',
    ],
    listItemEventInnerClass: (data) => [
      'flex flex-row items-center', // as opposed to display:contents
      data.isNarrow ? 'py-px' : 'py-0.5',
      data.isNarrow ? xxsTextClass : 'text-xs',
    ],
    listItemEventTimeClass: (data) => [
      data.isNarrow ? 'ps-0.5' : 'ps-1',
      'whitespace-nowrap overflow-hidden shrink-1', // shrinks second
    ],
    listItemEventTitleClass: (data) => [
      data.isNarrow ? 'px-0.5' : 'px-1',
      'font-bold whitespace-nowrap overflow-hidden shrink-100', // shrinks first
    ],

    rowEventClass: (data) => [
      data.isEnd && 'me-0.5',
    ],
    rowEventInnerClass: (data) => [
      data.isNarrow ? 'py-px' : 'py-0.5',
    ],

    rowMoreLinkClass: (data) => [
      'mb-px rounded-sm',
      data.isNarrow ? 'mx-px' : 'mx-0.5',
      'border',
      data.isNarrow
        ? params.primaryBorderColorClass
        : 'border-transparent self-start',
      params.mutedHoverPressableClass,
    ],
    rowMoreLinkInnerClass: (data) => [
      data.isNarrow ? 'px-0.5 py-px' : 'px-1 py-0.5',
      data.isNarrow ? xxsTextClass : 'text-xs',
    ],
  }

  return {
    optionDefaults: {
      eventColor: params.eventColor,
      eventContrastColor: params.eventContrastColor,
      backgroundEventColor: params.bgEventColor,

      eventShortHeight: 50,
      dayNarrowWidth: 100,

      dayPopoverFormat: { day: 'numeric', weekday: 'long' },

      tableHeaderClass: (data) => data.isSticky && params.bgClass,

      navLinkClass: [
        params.primaryOutlineColorClass,
        params.outlineWidthFocusClass,
      ],

      moreLinkClass: [
        params.primaryOutlineColorClass,
        params.outlineWidthFocusClass,
      ],
      moreLinkInnerClass: 'whitespace-nowrap overflow-hidden',

      // TODO: fix problem with huge hit area for title
      popoverClass: 'min-w-[220px] ' + params.popoverClass,
      popoverCloseClass: [
        'absolute inline-flex flex-row top-1 end-1 p-1 rounded-sm group',
        params.primaryOutlineColorClass,
        params.outlineWidthFocusClass,
        params.mutedHoverPressableClass,
        params.mutedFgClass,
      ],

      inlineWeekNumberClass: (data) => [
        'absolute rounded-s-sm end-0',
        data.isNarrow
          ? `top-0.5 my-px p-0.5 ${xxsTextClass}`
          : 'top-1 p-1 text-xs',
        data.hasNavLink
          ? params.mutedPressableClass
          : params.mutedClass,
      ],

      // misc BG
      fillerClass: `border ${params.borderColorClass} opacity-50`,
      nonBusinessClass: params.faintBgClass,
      highlightClass: params.highlightClass,

      eventClass: (data) => [
        'hover:no-underline',
        params.primaryOutlineColorClass,
        data.isSelected
          ? params.outlineWidthClass
          : params.outlineWidthFocusClass,
      ],

      backgroundEventClass: params.bgEventBgClass,
      backgroundEventTitleClass: (data) => [
        'opacity-50 italic',
        data.isNarrow ? 'p-1' : 'p-2',
        data.isNarrow ? xxsTextClass : 'text-xs',
      ],

      blockEventClass: (data) => [
        'group relative', // for resizers
        params.outlineOffsetClass,
        data.isInteractive
          ? params.eventMutedPressableClass
          : params.eventMutedBgClass,
        'border-(--fc-event-color)',
        'print:bg-white',
      ],
      blockEventTimeClass: 'whitespace-nowrap overflow-hidden shrink-1', // shrinks second
      blockEventTitleClass: 'whitespace-nowrap overflow-hidden shrink-100', // shrinks first

      rowEventClass: (data) => [
        'mb-px', // space between events
        'flex flex-row items-center', // for valigning title and <> arrows
        'not-print:py-px print:border-y',
        data.isStart && 'rounded-s-sm border-s-6',
        data.isEnd && 'rounded-e-sm not-print:pe-px print:border-e',
      ],
      rowEventBeforeClass: (data) => data.isStartResizable ? [
        data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
        '-start-2', // do more than just half-width of circle, because of 6px start-border
      ] : [
        // the < continuation
        !data.isStart && (
          'size-2 border-t-1 border-s-1 border-gray-500 ms-1' +
          ' -rotate-45' // TODO: make RTL-friendly
        )
      ],
      rowEventAfterClass: (data) => data.isEndResizable ? [
        data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
        '-end-1',
      ] : [
        // the > continuation
        !data.isEnd && (
          'size-2 border-t-1 border-e-1 border-gray-500 me-1' +
          ' rotate-45' // TODO: make RTL-friendly
        )
      ],
      rowEventInnerClass: (data) => [
        'flex flex-row items-center',
        data.isNarrow ? xxsTextClass : 'text-xs',
        // subclasses determine py
      ],
      rowEventTimeClass: (data) => [
        'font-medium',
        data.isNarrow ? 'ps-0.5' : 'ps-1',
      ],
      rowEventTitleClass: (data) => [
        data.isNarrow ? 'px-0.5' : 'px-1',
      ],

      columnEventClass: (data) => [
        'mb-px',
        'border-s-6', // start edge
        'not-print:pe-px print:border-e', // end edge
        data.isStart && 'rounded-t-sm not-print:pt-px print:border-t', // top edge
        data.isEnd && 'rounded-b-sm not-print:pb-px print:border-b', // bottom edge
        `ring ${params.bgRingColorClass}`
      ],
      columnEventBeforeClass: (data) => data.isStartResizable && [
        data.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
        '-top-1',
      ],
      columnEventAfterClass: (data) => data.isEndResizable && [
        data.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
        '-bottom-1',
      ],
      columnEventInnerClass: (data) => [
        'flex',
        data.isShort
          ? 'flex-row p-0.5 gap-1' // one line
          : joinClassNames( // two lines
              'flex-col',
              data.isNarrow ? 'px-0.5' : 'px-1',
            )
      ],
      columnEventTimeClass: (data) => [
        !data.isShort && (data.isNarrow ? 'pt-0.5' : 'pt-1'),
        xxsTextClass,
      ],
      columnEventTitleClass: (data) => [
        !data.isShort && (data.isNarrow ? 'py-0.5' : 'py-1'),
        (data.isShort || data.isNarrow) ? xxsTextClass : 'text-xs',
      ],

      // MultiMonth
      singleMonthClass: 'm-4',
      singleMonthHeaderClass: (data) => [
        data.isSticky && `border-b ${params.borderColorClass} ${params.bgClass}`,
        data.colCount > 1 ? 'pb-4' : 'py-2',
        'justify-center',
      ],
      singleMonthHeaderInnerClass: (data) => [
        'text-center font-bold rounded-sm px-1',
        data.hasNavLink && params.mutedHoverPressableClass,
        data.isNarrow ? 'text-base' : 'text-lg', // need to specify "base". no
      ],

      dayHeaderRowClass: `border ${params.borderColorClass}`,

      dayHeaderClass: (data) => [
        data.isToday && !data.level && 'relative', // contain wide top-border
        data.isDisabled && params.faintBgClass,
        data.inPopover
          ? params.popoverHeaderClass
          : joinClassNames(
              data.isMajor ? `border ${params.strongBorderColorClass}` :
                !data.isNarrow && `border ${params.borderColorClass}`,
            ),
      ],
      dayHeaderInnerClass: (data) => [
        'p-2 flex flex-col', // TODO: adjust padding when isNarrow?
        data.isNarrow ? xxsTextClass : 'text-xs',
        data.isToday && data.level && 'relative', // contain narrow top-border
        data.hasNavLink && joinClassNames(
          params.mutedHoverPressableClass,
          params.outlineInsetClass, // move inside
        )
      ],

      dayRowClass: `border ${params.borderColorClass}`,
      dayCellClass: (data) => [
        data.isMajor ? `border ${params.strongBorderColorClass}` : `border ${params.borderColorClass}`,
        // don't display bg-color for other-month/disabled cells when businessHours is doing the same
        ((data.isOther || data.isDisabled) && !data.options.businessHours) && params.faintBgClass,
      ],
      dayCellTopClass: (data) => [
        'flex flex-row',
        'min-h-[2px]', // effectively 2px top padding when no day-number
        // then businessHours owns the cell bg-color, use faint-text to denote other-month/disabled
        ((data.isOther || data.isDisabled) && data.options.businessHours) && params.faintFgClass,
      ],
      dayCellTopInnerClass: (data) => [
        'flex flex-row items-center whitespace-nowrap',
        data.monthText && 'font-bold',
        data.isNarrow
          ? `my-px h-5 ${xxsTextClass}`
          : 'my-1 h-6 text-sm',
        data.isToday
          ? joinClassNames(
              'rounded-full',
              data.isNarrow
                ? 'ms-px'
                : 'ms-1',
              data.text === data.dayNumberText
                ? (data.isNarrow ? 'w-5' : 'w-6') + ' justify-center' // number only. circle
                : (data.isNarrow ? 'px-1' : 'px-2'), // pill
              data.hasNavLink
                ? joinClassNames(params.primaryPressableClass, params.outlineOffsetClass)
                : params.primaryClass,
            )
          : joinClassNames( // ghost-button-like
              'rounded-e-sm',
              data.isNarrow ? 'px-1' : 'px-2',
              data.hasNavLink && params.mutedHoverPressableClass,
            ),
      ],
      dayCellInnerClass: (data) => [
        data.inPopover && 'p-2',
      ],

      allDayDividerClass: `border-t ${params.borderColorClass}`,

      dayLaneClass: (data) => [
        data.isMajor ? `border ${params.strongBorderColorClass}` : `border ${params.borderColorClass}`,
        data.isDisabled && params.faintBgClass,
      ],
      dayLaneInnerClass: (data) => data.isSimple
        ? 'm-1' // simple print-view
        : 'ms-0.5 me-[2.5%]',

      slotLabelRowClass: `border ${params.borderColorClass}`, // Timeline
      slotLabelClass: (data) => getSlotClasses(data, `border ${params.borderColorClass}`),
      slotLaneClass: (data) => getSlotClasses(data, `border ${params.borderColorClass}`),

      nowIndicatorLineClass: `-m-px border-1 ${params.nowBorderColorClass}`,
      nowIndicatorDotClass: `rounded-full size-0 -m-[6px] border-6 ${params.nowBorderColorClass} ring-2 ${params.bgRingColorClass}`,
    },
    views: {
      dayGrid: {
        ...dayRowItemClasses,
        dayHeaderAlign: (data) => data.isNarrow ? 'center' : 'start', // pairs with dayHeaderClass above (TODO: rearrange)

        dayHeaderDividerClass: ['border-t', params.borderColorClass],

        // core normally display short for month (like "Mon") but long (like "Monday") looks good in Forma
        dayHeaderFormat: { weekday: 'long' },

        dayCellBottomClass: (data) => !data.isNarrow && 'min-h-[1px]', // TODO: DRY
      },
      multiMonth: {
        ...dayRowItemClasses,
        dayHeaderAlign: (data) => data.isNarrow ? 'center' : 'start', // pairs with dayHeaderClass above (TODO: rearrange)

        dayHeaderDividerClass: (data) => data.isSticky && ['border-t', params.borderColorClass],

        tableBodyClass: [
          'border', params.borderColorClass,
          'rounded-sm overflow-hidden',
        ],

        dayCellBottomClass: (data) => !data.isNarrow && 'min-h-[1px]', // TODO: DRY
      },
      timeGrid: {
        ...dayRowItemClasses,
        dayHeaderAlign: 'start',
        // TODO: DRY
        dayHeaderDividerClass: ['border-t', params.borderColorClass],

        dayCellBottomClass: 'min-h-4', // for ALL-DAY

        allDayHeaderClass: [
          axisClass,
          'items-center', // valign
        ],
        allDayHeaderInnerClass: (data) => [
          axisInnerClass,
          'whitespace-pre', // respects line-breaks in locale data
          data.isNarrow ? xxsTextClass : 'text-xs',
        ],

        weekNumberHeaderClass: `${axisClass} items-end`,
        weekNumberHeaderInnerClass: (data) => [
          axisInnerClass,
          data.isNarrow ? xxsTextClass : 'text-xs',
        ],

        columnMoreLinkClass: [
          `mb-px rounded-sm ${params.strongSolidPressableClass} border border-transparent print:border-black print:bg-white ring ${params.bgRingColorClass}`,
          params.outlineOffsetClass, // just like block events
        ],
        columnMoreLinkInnerClass: (data) => [ // why not have this in general settings (since it aims to match columnEventInnerClass in general settings)
          data.isNarrow ? xxsTextClass : 'text-xs',
          data.isNarrow ? 'p-0.5' : 'p-1',
        ],

        slotLabelClass: axisClass,
        slotLabelInnerClass: (data) => [
          axisInnerClass,
          data.isNarrow ? xxsTextClass : 'text-xs',
        ],

        slotLabelDividerClass: `border-l ${params.borderColorClass}`,
      },
      list: {
        listDayClass: `not-last:border-b ${params.borderColorClass} flex flex-row items-start`,

        listDayHeaderClass: (data) => [
          'shrink-0 w-1/4 max-w-40 p-3 flex flex-col items-start',
          data.isToday && `border-s-4 ${params.primaryBorderColorClass}`,
        ],
        listDayHeaderInnerClass: (data) => [
          'my-0.5',
          data.hasNavLink && 'hover:underline',
          !data.level
            ? joinClassNames('text-lg', data.isToday && 'font-bold')
            : 'text-xs',
        ],
        listDayEventsClass: 'grow min-w-0 flex flex-col items-stretch gap-4 p-4',

        listItemEventClass: (data) => [
          data.isInteractive
            ? params.eventFaintPressableClass
            : params.eventFaintBgClass,
          'p-3 flex flex-row rounded-sm border-s-6 border-(--fc-event-color)',
        ],

        listItemEventInnerClass: 'flex flex-row gap-2 text-sm',
        listItemEventTimeClass: 'shrink-0 w-1/2 max-w-40 whitespace-nowrap overflow-hidden text-ellipsis',
        listItemEventTitleClass: 'grow min-w-0 font-semibold whitespace-nowrap overflow-hidden',

        noEventsClass: 'grow flex flex-col items-center justify-center',
        noEventsInnerClass: 'py-15',
      },
    },
  }
}
