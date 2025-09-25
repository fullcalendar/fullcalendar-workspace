import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'

// ambient types (tsc strips during build because of {})
import {} from '@fullcalendar/daygrid'
import {} from '@fullcalendar/timegrid'
import {} from '@fullcalendar/list'
import {} from '@fullcalendar/multimonth'
import {} from '@fullcalendar/interaction'

export interface EventCalendarOptionParams {
  borderColorClass: string
  majorBorderColorClass: string
  nowIndicatorBorderColorClass: string
  nowIndicatorBorderStartColorClass: string
  nowIndicatorBorderTopColorClass: string
  compactMoreLinkBorderColorClass: string
  todayBgClass: string // should be given as NOT-print!!!
  transparentMutedBgClass: string // GUARANTEED transparent --- should be given as NOT-print???
  mutedBgClass: string // could possibly be transparent
  neutralBgClass: string // more contrast than muted (better name?)
  mutedTextColorClass: string
  highlightClass: string
  eventColor: string
  eventContrastColor: string
  backgroundEventColor: string
  backgroundEventColorClass: string
  hoverRowClass: string
  hoverButtonClass: string
  selectedButtonClass: string
  popoverClass: string
  bgColorClass: string
  bgColorOutlineClass: string
}

const xxsTextClass = 'text-[0.6875rem]/[1.090909]' // usually 11px font / 12px line-height
const cellPaddingClass = 'px-1 py-0.5'
const listViewItemPaddingClass = 'px-3 py-2'
const axisClass = 'justify-end' // h-align

export const getDayHeaderClasses = (
  data: { isDisabled: boolean, isMajor: boolean, inPopover?: boolean },
  params: EventCalendarOptionParams
) => [
  'border justify-center', // v-align
  data.isMajor ? params.majorBorderColorClass : params.borderColorClass,
  (data.inPopover || data.isDisabled) && params.mutedBgClass,
]

export const getDayHeaderInnerClasses = (data: { isCompact: boolean }) => [
  `flex flex-col ${cellPaddingClass}`,
  data.isCompact ? xxsTextClass : 'text-sm',
]

const getAxisInnerClasses = (data: { isCompact: boolean }) => [
  `${cellPaddingClass} text-end`,
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
  const blockTouchResizerClass = `absolute z-20 h-2 w-2 rounded-full border border-(--fc-event-color) ${params.bgColorClass}`
  const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
  const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

  const getDayClasses = (data: { isMajor: boolean, isToday: boolean, isDisabled: boolean}) => [
    'border',
    data.isMajor ? params.majorBorderColorClass : params.borderColorClass,
    data.isToday && params.todayBgClass,
    data.isDisabled && params.mutedBgClass,
  ]

  const getSlotClasses = (data: { isMinor: boolean }) => [
    `border ${params.borderColorClass}`,
    data.isMinor && 'border-dotted',
  ]

  const dayRowItemBaseClass = 'mx-0.5 mb-px rounded-sm' // TODO: make x a px val?
  const dayRowItemClasses: CalendarOptions = {
    listItemEventClass: (data) => [
      `${dayRowItemBaseClass} p-px`,
      data.isSelected
        ? joinClassNames(params.selectedButtonClass, data.isDragging && 'shadow-sm')
        : params.hoverButtonClass,
    ],
    listItemEventColorClass: (data) => [
      'border-4', // 8px diameter
      data.isCompact ? 'mx-px' : 'mx-1',
    ],
    listItemEventInnerClass: (data) => [
      'flex flex-row items-center',
      data.isCompact ? xxsTextClass : 'text-xs',
    ],
    listItemEventTimeClass: 'p-px whitespace-nowrap overflow-hidden shrink-1', // shrinks second
    listItemEventTitleClass: 'p-px font-bold whitespace-nowrap overflow-hidden shrink-100', // shrinks first

    rowEventClass: (data) => [
      data.isStart && 'ms-0.5',
      data.isEnd && 'me-0.5',
    ],
    rowEventColorClass: (data) => [
      data.isStart && 'rounded-s-sm',
      data.isEnd && 'rounded-e-sm',
    ],

    rowMoreLinkClass: (data) => [
      dayRowItemBaseClass,
      params.hoverButtonClass,
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

      tableHeaderClass: (data) => data.isSticky && params.bgColorClass,

      singleMonthClass: (data) => data.colCount > 1 && 'm-4',
      singleMonthHeaderClass: (data) => [
        data.colCount > 1 ? 'pb-4' : 'py-2',
        data.isSticky && `border-b ${params.borderColorClass} ${params.bgColorClass}`,
        'justify-center',
      ],
      singleMonthHeaderInnerClass: 'font-bold',

      popoverClass: `${params.popoverClass} min-w-[220px]`,
      popoverCloseClass: 'absolute top-0.5 end-0.5 not-hover:opacity-65',

      fillerClass: `border ${params.borderColorClass} opacity-50`,
      nonBusinessClass: params.transparentMutedBgClass,
      highlightClass: params.highlightClass,

      navLinkClass: 'hover:underline',
      moreLinkInnerClass: 'whitespace-nowrap overflow-hidden',
      inlineWeekNumberClass: `absolute z-20 top-0 start-0 rounded-ee-sm p-0.5 ${params.transparentMutedBgClass}`,
      inlineWeekNumberInnerClass: (data) => [
        'text-center',
        params.mutedTextColorClass,
        data.isCompact ? xxsTextClass : 'text-sm',
      ],

      eventClass: 'hover:no-underline',

      backgroundEventColorClass: `bg-(--fc-event-color) ${params.backgroundEventColorClass}`,
      backgroundEventTitleClass: (data) => [
        'm-2 opacity-50 italic',
        data.isCompact ? xxsTextClass : 'text-xs',
      ],

      listItemEventClass: 'items-center',
      listItemEventColorClass: 'rounded-full border-(--fc-event-color)',

      blockEventClass: (data) => [
        'relative isolate group p-px', // 1px matches print-border
        data.isSelected
          ? (data.isDragging ? 'shadow-lg' : 'shadow-md')
          : joinClassNames('focus-visible:shadow-md', data.isDragging && 'opacity-75'),
      ],
      blockEventColorClass: (data) => [
        'absolute z-0 inset-0 bg-(--fc-event-color)',
        'print:bg-white print:border-(--fc-event-color)', // subclasses do print-border-width
        data.isSelected
          ? 'brightness-75'
          : 'group-focus-visible:brightness-75',
      ],
      blockEventInnerClass: 'relative z-10 flex text-(--fc-event-contrast-color) print:text-black',
      blockEventTimeClass: 'whitespace-nowrap overflow-hidden shrink-1', // shrinks second
      blockEventTitleClass: 'whitespace-nowrap overflow-hidden shrink-100', // shrinks first

      rowEventClass: 'mb-px',
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
        data.isStart && 'print:border-s',
        data.isEnd && 'print:border-e',
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
        'print:border-x',
        data.isStart && 'print:border-t rounded-t-sm',
        data.isEnd && 'print:border-b rounded-b-sm',
        (data.level || data.isMirror) && `outline ${params.bgColorOutlineClass}`,
      ],
      columnEventInnerClass: (data) => [
        'p-px',
        data.isCompact
          ? 'flex-row gap-1' // one line
          : 'flex-col gap-px', // two lines
      ],
      columnEventTimeClass: xxsTextClass,
      columnEventTitleClass: (data) => data.isCompact ? xxsTextClass : 'py-px text-xs',

      // TODO: keep DRY with timeline rowMoreLink
      columnMoreLinkClass: `relative mb-px p-px rounded-sm ${params.bgColorClass} outline ${params.bgColorOutlineClass}`,
      columnMoreLinkColorClass: `absolute z-0 inset-0 rounded-sm ${params.neutralBgClass}`,
      columnMoreLinkInnerClass: 'z-10 p-0.5 text-xs',

      dayHeaderRowClass: `border ${params.borderColorClass}`,
      dayHeaderAlign: (data) => data.inPopover ? 'start' : 'center',
      dayHeaderClass: (data) => getDayHeaderClasses(data, params),
      dayHeaderInnerClass: getDayHeaderInnerClasses,
      dayHeaderDividerClass: `border-t ${params.borderColorClass}`,

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

      dayLaneClass: getDayClasses,
      dayLaneInnerClass: (data) => data.isSimple
        ? 'm-1' // simple print-view
        : 'ms-0.5 me-[2.5%]',

      slotLabelRowClass: `border ${params.borderColorClass}`, // timeline only
      slotLabelClass: getSlotClasses,
      slotLaneClass: getSlotClasses,
    },
    views: {
      dayGrid: {
        ...dayRowItemClasses,
        dayCellBottomClass: 'min-h-[1px]',
      },
      multiMonth: {
        tableClass: `border ${params.borderColorClass}`,
        ...dayRowItemClasses,
        dayCellBottomClass: 'min-h-[1px]',
      },
      timeGrid: {
        ...dayRowItemClasses,
        dayCellBottomClass: 'min-h-3',

        weekNumberHeaderClass: `${axisClass} items-center`, // v-align
        weekNumberHeaderInnerClass: getAxisInnerClasses,

        allDayHeaderClass: `${axisClass} items-center`, // v-align
        allDayHeaderInnerClass: (data) => [ // sort of like getAxisInnerClasses, but with different padding
          `px-1 py-2 text-end`,
          data.isCompact ? xxsTextClass : 'text-sm',
          'whitespace-pre', // respects line-breaks in locale data
        ],
        allDayDividerClass: `border-y ${params.borderColorClass} pb-0.5 ${params.mutedBgClass}`,

        slotLabelClass: axisClass,
        slotLabelInnerClass: getAxisInnerClasses,
        slotLabelDividerClass: `border-l ${params.borderColorClass}`,

        nowIndicatorLabelClass: `start-0 -mt-[5px] border-y-[5px] border-y-transparent border-s-[6px] ${params.nowIndicatorBorderStartColorClass}`,
        nowIndicatorLineClass: `border-t ${params.nowIndicatorBorderColorClass}`,
      },
      list: {
        listDayHeaderClass: `sticky z-10 top-0 flex flex-row justify-between border-b ${params.borderColorClass} ${params.bgColorClass}`,
        listDayHeaderColorClass: `absolute z-0 inset-0 ${params.mutedBgClass}`,
        listDayHeaderInnerClass: `z-10 ${listViewItemPaddingClass} text-sm font-bold`, // TODO: z-10

        listItemEventClass: [
          'group gap-3 border-b',
          params.borderColorClass,
          params.hoverRowClass,
          listViewItemPaddingClass,
        ],
        listItemEventColorClass: 'border-5', // 10px diameter
        listItemEventInnerClass: '[display:contents]',
        listItemEventTimeClass: 'order-[-1] shrink-0 w-1/2 max-w-50 whitespace-nowrap overflow-hidden text-ellipsis text-sm', // send to start
        listItemEventTitleClass: (data) => [
          'grow min-w-0 whitespace-nowrap overflow-hidden text-sm',
          data.event.url && 'group-hover:underline',
        ],

        noEventsClass: `flex flex-col items-center justify-center ${params.mutedBgClass}`,
        noEventsInnerClass: 'sticky bottom-0 py-15',
      },
    },
  }
}
