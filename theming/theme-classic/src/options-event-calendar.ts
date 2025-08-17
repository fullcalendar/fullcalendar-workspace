import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'

// ambient types (tsc strips during build because of {})
import {} from '@fullcalendar/daygrid'
import {} from '@fullcalendar/timegrid'
import {} from '@fullcalendar/list'
import {} from '@fullcalendar/multimonth'
import {} from '@fullcalendar/interaction'

export interface EventCalendarOptionParams {
  borderColorClass: string
  nowIndicatorBorderColorClass: string
  nowIndicatorBorderStartColorClass: string
  nowIndicatorBorderTopColorClass: string
  compactMoreLinkBorderColorClass: string
  todayBgColorClass: string
  highlightClass: string
  eventColor: string
  eventContrastColor: string
  backgroundEventColor: string
  backgroundEventColorClass: string
  popoverClass: string
  pageBgColorClass: string
  pageBgColorOutlineClass: string
}

export const neutralBgColorClass = 'bg-gray-500/10 dark:bg-gray-500/15'
export const neutralTextColorClass = 'text-gray-500 dark:text-gray-300'
export const solidMoreLinkBgClass = 'bg-gray-300 dark:bg-gray-600'
export const majorBorderColorClass = 'border-gray-400 dark:border-gray-700'

const xxsTextClass = 'text-[0.7rem]/[1.25]'
const cellPaddingClass = 'px-1 py-0.5'
const listItemPaddingClass = 'px-3 py-2'
const dayCellItemClass = 'mx-0.5 mb-px rounded-sm'
const axisClass = 'justify-end' // h-align

const getAxisInnerClasses = (data: { isCompact: boolean }) => [
  `${cellPaddingClass} text-end`,
  data.isCompact ? xxsTextClass : 'text-sm',
]

export const getDayHeaderClasses = (
  data: { isDisabled: boolean, isMajor: boolean, inPopover?: boolean },
  params: EventCalendarOptionParams
) => [
  'border justify-center', // v-align
  data.inPopover ? 'items-start' : 'items-center', // h-align
  data.isMajor ? majorBorderColorClass : params.borderColorClass,
  (data.inPopover || data.isDisabled) && neutralBgColorClass,
]

export const getDayHeaderInnerClasses = (data: { isCompact: boolean }) => [
  `flex flex-col ${cellPaddingClass}`,
  data.isCompact ? xxsTextClass : 'text-sm',
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
  const blockTouchResizerClass = `absolute z-20 h-2 w-2 rounded-full border border-(--fc-event-color) ${params.pageBgColorClass}`
  const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
  const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

  const getDayClasses = (data: { isMajor: boolean, isToday: boolean, isDisabled: boolean}) => [
    'border',
    data.isMajor ? majorBorderColorClass : params.borderColorClass,
    data.isToday && params.todayBgColorClass,
    data.isDisabled && neutralBgColorClass,
  ]

  const getSlotClasses = (data: { isMinor: boolean }) => [
    `border ${params.borderColorClass}`,
    data.isMinor && 'border-dotted',
  ]

  const dayRowContentClasses: CalendarOptions = {
    listItemEventClass: (data) => [
      `${dayCellItemClass} p-px`,
      data.isSelected
        ? joinClassNames('bg-gray-500/40', data.isDragging && 'shadow-sm')
        : 'hover:bg-gray-500/20 focus-visible:bg-gray-500/30',
    ],
    listItemEventColorClass: (data) => [
      'border-4', // 8px diameter
      data.isCompact ? 'mx-px' : 'mx-1',
    ],
    listItemEventInnerClass: 'flex flex-row items-center',
    listItemEventTimeClass: (data) => [
      'p-px',
      data.isCompact ? xxsTextClass : 'text-xs',
    ],
    listItemEventTitleClass: (data) => [
      'p-px font-bold',
      data.isCompact ? xxsTextClass : 'text-xs',
    ],

    rowEventClass: (data) => [
      data.isStart && 'ms-0.5',
      data.isEnd && 'me-0.5',
    ],
    rowEventColorClass: (data) => [
      data.isStart && 'rounded-s-sm',
      data.isEnd && 'rounded-e-sm',
    ],

    rowMoreLinkClass: (data) => [
      `${dayCellItemClass} hover:bg-gray-500/20`,
      data.isCompact
        ? `border ${params.compactMoreLinkBorderColorClass}`
        : 'self-start p-px',
    ],
    rowMoreLinkInnerClass: (data) => [
      'p-px',
      data.isCompact ? xxsTextClass : 'text-xs',
    ],
  }

  return {
    optionDefaults: {
      eventColor: params.eventColor,
      eventContrastColor: params.eventContrastColor,
      backgroundEventColor: params.backgroundEventColor,

      className: 'gap-5',
      viewClass: `border ${params.borderColorClass}`,
      tableHeaderClass: (data) => data.isSticky && params.pageBgColorClass,

      singleMonthClass: (data) => data.colCount > 1 && 'm-4',
      singleMonthHeaderClass: (data) => [
        data.colCount > 1 ? 'pb-4' : 'py-2',
        data.isSticky && `border-b ${params.borderColorClass} ${params.pageBgColorClass}`,
        'justify-center',
      ],
      singleMonthHeaderInnerClass: 'font-bold',

      popoverClass: `${params.popoverClass} min-w-[220px]`,
      popoverCloseClass: 'absolute top-0.5 end-0.5 not-hover:opacity-65',

      fillerClass: `border ${params.borderColorClass} opacity-50`,
      nonBusinessClass: neutralBgColorClass,
      highlightClass: params.highlightClass,

      navLinkClass: 'hover:underline',
      moreLinkInnerClass: 'whitespace-nowrap overflow-hidden',
      inlineWeekNumberClass: `absolute z-20 top-0 start-0 rounded-ee-sm p-0.5 ${neutralBgColorClass}`,
      inlineWeekNumberInnerClass: (data) => [
        `text-center ${neutralTextColorClass}`,
        data.isCompact ? xxsTextClass : 'text-sm',
      ],

      eventClass: (data) => data.event.url && 'hover:no-underline',
      eventTimeClass: 'whitespace-nowrap overflow-hidden flex-shrink-1', // shrinks second
      eventTitleClass: 'whitespace-nowrap overflow-hidden flex-shrink-100', // shrinks first

      backgroundEventColorClass: `bg-(--fc-event-color) ${params.backgroundEventColorClass}`,
      backgroundEventTitleClass: (data) => [
        'm-2 opacity-50 italic',
        data.isCompact ? xxsTextClass : 'text-xs',
      ],

      listItemEventClass: 'items-center',
      listItemEventColorClass: 'rounded-full border-(--fc-event-color)',

      blockEventClass: (data) => [
        'relative group p-px',
        data.isSelected
          ? (data.isDragging ? 'shadow-lg' : 'shadow-md')
          : joinClassNames('focus-visible:shadow-md', data.isDragging && 'opacity-75')
      ],
      blockEventColorClass: (data) => [
        'absolute z-0 inset-0 bg-(--fc-event-color)',
        'print:border print:border-(--fc-event-color) print:bg-white',
        data.isSelected
          ? 'brightness-75'
          : 'group-focus-visible:brightness-75',
      ],
      blockEventInnerClass: 'relative z-10 text-(--fc-event-contrast-color) print:text-black flex',

      rowEventClass: 'mb-px', // space between events
      rowEventBeforeClass: (data) => data.isStartResizable && [
        data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
        '-start-1',
      ],
      rowEventAfterClass: (data) => data.isEndResizable && [
        data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
        '-end-1',
      ],
      rowEventColorClass: (data) => [
        !data.isStart && 'print:border-s-0',
        !data.isEnd && 'print:border-e-0',
      ],
      rowEventInnerClass: 'flex-row items-center',
      rowEventTimeClass: (data) => [
        'p-px font-bold',
        data.isCompact ? xxsTextClass : 'text-xs',
      ],
      rowEventTitleClass: (data) => [
        'p-px',
        data.isCompact ? xxsTextClass : 'text-xs',
      ],

      columnEventClass: 'mb-px',
      columnEventBeforeClass: (data) => data.isStartResizable && [
        data.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
        '-top-1',
      ],
      columnEventAfterClass: (data) => data.isEndResizable && [
        data.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
        '-bottom-1',
      ],
      columnEventColorClass: (data) => [
        data.isStart && 'rounded-t-sm',
        data.isEnd && 'rounded-b-sm',
        (data.level || data.isDragging) && `outline ${params.pageBgColorOutlineClass}`,
      ],
      columnEventInnerClass: (data) => [
        'p-px',
        data.isCompact
          ? 'flex-row gap-1' // one line
          : 'flex-col gap-px', // two lines
      ],
      columnEventTimeClass: xxsTextClass,
      columnEventTitleClass: (data) => data.isCompact ? xxsTextClass : 'py-px text-xs',

      columnMoreLinkClass: `mb-px rounded-sm outline ${params.pageBgColorOutlineClass} ${solidMoreLinkBgClass}`,
      columnMoreLinkInnerClass: 'px-0.5 py-1 text-xs',

      dayHeaderRowClass: `border ${params.borderColorClass}`,
      dayHeaderDividerClass: `border-t ${params.borderColorClass}`,
      dayHeaderClass: (data) => getDayHeaderClasses(data, params),
      dayHeaderInnerClass: getDayHeaderInnerClasses,

      dayRowClass: `border ${params.borderColorClass}`,
      dayCellClass: getDayClasses,
      dayCellTopClass: (data) => [
        'flex flex-row justify-end min-h-[2px]',
        data.isOther && 'opacity-30',
      ],
      dayCellTopInnerClass: (data) => [
        'px-1',
        data.isCompact ? 'py-0.5' : 'py-1',
        data.hasMonthLabel && 'text-base font-bold',
        data.isCompact ? xxsTextClass : 'text-sm',
      ],
      dayCellInnerClass: (data) => data.inPopover && 'p-2',

      allDayDividerClass: `border-y ${params.borderColorClass} pb-0.5 ${neutralBgColorClass}`,

      dayLaneClass: getDayClasses,
      dayLaneInnerClass: (data) => data.isSimple
        ? 'm-1' // simple print-view
        : 'ms-0.5 me-[2.5%]',

      slotLabelRowClass: `border ${params.borderColorClass}`, // timeline only
      slotLabelAlign: 'center',
      slotLabelClass: getSlotClasses,
      slotLaneClass: getSlotClasses,
    },
    views: {
      dayGrid: {
        ...dayRowContentClasses,
        dayCellBottomClass: 'min-h-[1px]',
      },
      multiMonth: {
        tableClass: `border ${params.borderColorClass}`,
        ...dayRowContentClasses,
        dayCellBottomClass: 'min-h-[1px]',
      },
      timeGrid: {
        ...dayRowContentClasses,
        dayRowClass: 'min-h-10',
        dayCellBottomClass: 'min-h-3',

        allDayHeaderClass: `${axisClass} items-center`, // v-align
        allDayHeaderInnerClass: (data) => [
          ...getAxisInnerClasses(data),
          'whitespace-pre', // respects line-breaks in locale data
        ],

        weekNumberHeaderClass: `${axisClass} items-center`, // v-align
        weekNumberHeaderInnerClass: getAxisInnerClasses,

        slotLabelClass: axisClass,
        slotLabelInnerClass: (data) => [...getAxisInnerClasses(data), 'min-h-5'],
        slotLabelDividerClass: `border-l ${params.borderColorClass}`,

        nowIndicatorLabelClass: `start-0 -mt-[5px] border-y-[5px] border-y-transparent border-s-[6px] ${params.nowIndicatorBorderStartColorClass}`,
        nowIndicatorLineClass: `border-t ${params.nowIndicatorBorderColorClass}`,
      },
      list: {
        listDayClass: `not-last:border-b ${params.borderColorClass}`,
        listDayHeaderClass: [
          `sticky top-0 flex flex-row justify-between border-b ${params.borderColorClass} font-bold`,
          params.pageBgColorClass, // base color for overlaid "before" color
        ],
        listDayHeaderBeforeClass: `absolute inset-0 ${neutralBgColorClass}`,
        listDayHeaderInnerClass: `relative ${listItemPaddingClass} text-sm`, // above the "before" element

        listItemEventClass: [
          'hover:bg-gray-500/7 focus-visible:bg-gray-500/30 group gap-3 not-last:border-b',
          params.borderColorClass,
          listItemPaddingClass
        ],
        listItemEventColorClass: 'border-5', // 10px diameter
        listItemEventInnerClass: '[display:contents]',
        listItemEventTimeClass: 'order-[-1] w-[165px] text-sm', // send to start
        listItemEventTitleClass: (data) => [
          'text-sm',
          data.event.url && 'group-hover:underline',
        ],

        noEventsClass: `py-15 flex flex-col flex-grow items-center justify-center ${neutralBgColorClass}`,
      },
    },
  }
}
