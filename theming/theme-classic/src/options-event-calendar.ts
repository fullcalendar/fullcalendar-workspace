import { CalendarOptions, ViewOptions } from '@fullcalendar/core'

// ambient types
import {} from '@fullcalendar/daygrid'
import {} from '@fullcalendar/timegrid'
import {} from '@fullcalendar/list'
import {} from '@fullcalendar/multimonth'
import {} from '@fullcalendar/interaction'

export interface EventCalendarOptionParams {
  borderColorClass: string
  majorBorderColorClass: string
  alertBorderColorClass: string
  alertBorderStartColorClass: string // yuck, but needed for triangle

  todayBgColorClass: string
  highlightBgColorClass: string
  primaryBorderColorClass: string // same color as eventColor!

  eventColor: string
  eventContrastColor: string
  backgroundEventColor: string
  backgroundEventColorClass: string

  popoverClass: string

  canvasBgColorClass: string
  canvasOutlineColorClass: string
}

const xxsTextClass = 'text-[0.7rem]/[1.25]'

export const neutralBgClass = 'bg-gray-500/10 dark:bg-gray-500/15'
export const neutralTextColorClass = 'text-gray-500 dark:text-gray-300'
export const moreLinkBgClass = 'bg-gray-300 dark:bg-gray-600' // the solid-bg version (timegrid+timeline)

const cellPaddingClass = 'px-1 py-0.5'
const listItemPaddingClass = 'px-3 py-2' // list-day-header and list-item-event
const dayGridItemClass = 'mx-0.5 mb-px rounded-sm' // list-item-event and more-link

// timegrid axis
const axisClass = 'justify-end' // align axisInner right
const axisInnerClass = `${cellPaddingClass} text-end` // align text right when multiline --- used by body cells too???

const floatingWeekNumberClasses: CalendarOptions = {
  inlineWeekNumberClass: [
    'absolute z-20 top-0 start-0 rounded-ee-sm p-0.5',
    neutralBgClass,
  ],
  inlineWeekNumberInnerClass: (data) => [
    data.isCompact ? xxsTextClass : 'text-sm',
    neutralTextColorClass,
    'text-center',
  ],
}

export const getDayHeaderClasses = (data: { isDisabled: boolean, isMajor: boolean }, params: EventCalendarOptionParams) => [
  'items-center justify-center',
  data.isMajor ? `border ${params.majorBorderColorClass}` : `border ${params.borderColorClass}`,
  data.isDisabled && neutralBgClass,
]

export const getDayHeaderInnerClasses = (data: { isCompact: boolean }) => [
  'flex flex-col',
  cellPaddingClass,
  data.isCompact ? xxsTextClass : 'text-sm',
]

export function createEventCalendarOptions(params: EventCalendarOptionParams): {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} {
  // transparent resizer for mouse
  // must have 'group' on the event, for group-hover
  const blockPointerResizerClass = `absolute z-20 hidden group-hover:block`
  const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
  const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

  // circle resizer for touch
  const blockTouchResizerClass = `absolute z-20 h-2 w-2 rounded-full border border-(--fc-event-color) ${params.canvasBgColorClass}`
  const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
  const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

  const getSlotClasses = (data: { isMinor: boolean }) => [
    `border ${params.borderColorClass}`,
    data.isMinor && 'border-dotted',
  ]

  // applies to DayGrid, TimeGrid ALL-DAY, MultiMonth
  const rowContentClasses: CalendarOptions = {
    listItemEventClass: [dayGridItemClass, 'p-px'],
    listItemEventColorClass: (data) => [
      data.isCompact ? 'mx-px' : 'mx-1',
      'border-4', // 8px diameter circle
    ],
    listItemEventInnerClass: (data) => [
      'flex flex-row items-center', // as opposed to display:contents
      data.isCompact ? xxsTextClass : 'text-xs',
    ],
    listItemEventTimeClass: 'p-px',
    listItemEventTitleClass: 'p-px font-bold',

    rowEventClass: (data) => [
      data.isStart && 'ms-0.5',
      data.isEnd && 'me-0.5',
    ],
    rowEventColorClass: (data) => [
      data.isStart && 'rounded-s-sm',
      data.isEnd && 'rounded-e-sm',
    ],

    rowMoreLinkClass: (data) => [
      dayGridItemClass,
      data.isCompact
        ? `border ${params.primaryBorderColorClass}`
        : 'self-start p-px',
      'hover:bg-gray-500/20', // matches list-item hover
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
      tableHeaderClass: (data) => data.isSticky && params.canvasBgColorClass,

      navLinkClass: 'hover:underline',

      moreLinkInnerClass: 'whitespace-nowrap overflow-hidden',

      popoverClass: [
        params.popoverClass,
        'min-w-[220px]',
      ],
      // popoverHeaderClass: `flex flex-row justify-between items-center px-1 py-1 ${neutralBgClass}`,
      // popoverBodyClass: 'p-2',

      // misc BG
      fillerClass: `border ${params.borderColorClass} opacity-50`,
      nonBusinessClass: neutralBgClass,
      highlightClass: params.highlightBgColorClass,

      eventClass: (data) => data.event.url && 'hover:no-underline',
      eventTimeClass: 'whitespace-nowrap overflow-hidden flex-shrink-1', // shrinks second
      eventTitleClass: 'whitespace-nowrap overflow-hidden flex-shrink-100', // shrinks first

      backgroundEventColorClass: 'bg-(--fc-event-color) ' + params.backgroundEventColorClass,
      backgroundEventTitleClass: (data) => [
        'm-2 opacity-50 italic',
        data.isCompact ? xxsTextClass : 'text-xs',
      ],

      listItemEventClass: (data) => [
        'items-center',
        data.isSelected
          ? 'bg-gray-500/40' // touch-selected
          : 'hover:bg-gray-500/20 focus:bg-gray-500/30',
        (data.isSelected && data.isDragging) && 'shadow-sm', // touch-dragging
      ],
      // Dot uses border instead of bg because it shows up in print
      // Views must decide circle radius via border thickness
      listItemEventColorClass: 'rounded-full border-(--fc-event-color)',

      blockEventClass: (data) => [
        'relative', // for absolute-positioned color
        'group', // for focus and hover
        'p-px',
        (data.isDragging && !data.isSelected) && 'opacity-75',
        data.isSelected
          ? (data.isDragging ? 'shadow-lg' : 'shadow-md')
          : 'focus:shadow-md',
      ],
      blockEventColorClass: (data) => [
        'absolute z-0 inset-0 bg-(--fc-event-color)',
        'print:border print:border-(--fc-event-color) print:bg-white',
        data.isSelected
          ? 'brightness-75'
          : 'group-focus:brightness-75',
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
      rowEventInnerClass: (data) => [
        'flex-row items-center',
        data.isCompact ? xxsTextClass : 'text-xs',
      ],
      rowEventTimeClass: 'p-px font-bold',
      rowEventTitleClass: 'p-px start-0', // `start` for stickiness -- TODO: don't need anymore!!!

      columnEventClass: 'mb-px', // space from slot line
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
        (data.level || data.isDragging) && `outline ${params.canvasOutlineColorClass}`,
      ],
      columnEventInnerClass: (data) => [
        'p-px',
        data.isCompact
          ? 'flex-row gap-1' // one line
          : 'flex-col gap-px', // two lines
      ],
      columnEventTimeClass: xxsTextClass,
      columnEventTitleClass: (data) => [
        'top-0', // top for stickiness -- TODO: don't need anymore!!!
        data.isCompact ? xxsTextClass : 'py-px text-xs',
      ],

      // MultiMonth
      singleMonthClass: (data) => data.colCount > 1 && 'm-4',
      singleMonthTitleClass: (data) => [
        data.isSticky && `border-b ${params.borderColorClass} ${params.canvasBgColorClass}`,
        data.isSticky
          ? 'py-2' // single column
          : 'pb-4', // multi-column
        data.isCompact ? 'text-base' : 'text-lg',
        'text-center font-bold',
      ],

      dayHeaderRowClass: `border ${params.borderColorClass}`,
      dayHeaderClass: (data) => getDayHeaderClasses(data, params),
      dayHeaderInnerClass: getDayHeaderInnerClasses,
      dayHeaderDividerClass: ['border-t', params.borderColorClass],

      dayRowClass: `border ${params.borderColorClass}`,
      dayCellClass: (data) => [
        data.isMajor ? `border ${params.majorBorderColorClass}` : `border ${params.borderColorClass}`,
        data.isToday && params.todayBgColorClass,
        data.isDisabled && neutralBgClass,
      ],
      dayCellTopClass: (data) => [
        'flex flex-row justify-end',
        'min-h-[2px]', // effectively 2px top padding when no day-number
        data.isOther && 'opacity-30',
      ],
      dayCellTopInnerClass: (data) => [
        'px-1',
        data.isCompact ? 'py-0.5' : 'py-1',
        data.hasMonthLabel && 'text-base font-bold',
        data.isCompact ? xxsTextClass : 'text-sm',
      ],
      dayCellInnerClass: (data) => [
        data.inPopover && 'p-2',
      ],

      allDayDividerClass: `border-y ${params.borderColorClass} pb-0.5 ${neutralBgClass}`,

      dayLaneClass: (data) => [
        data.isMajor ? `border ${params.majorBorderColorClass}` : `border ${params.borderColorClass}`,
        data.isToday && params.todayBgColorClass,
        data.isDisabled && neutralBgClass,
      ],
      dayLaneInnerClass: (data) => data.isSimple
        ? 'm-1' // simple print-view
        : 'ms-0.5 me-[2.5%]',

      slotLabelRowClass: `border ${params.borderColorClass}`, // Timeline
      slotLabelAlign: 'center',
      slotLabelClass: (data) => getSlotClasses(data),
      slotLaneClass: (data) => getSlotClasses(data),

      listDayClass: `not-last:border-b ${params.borderColorClass}`,
      listDayHeaderClass: [
        `flex flex-row justify-between border-b ${params.borderColorClass} font-bold`,
        'relative', // for overlaid "before" color
        'sticky top-0',
        params.canvasBgColorClass, // base color for overlaid "before" color
      ],
      listDayHeaderBeforeClass: `absolute inset-0 ${neutralBgClass}`,
      listDayHeaderInnerClass: `relative ${listItemPaddingClass} text-sm`, // above the "before" element
    },
    views: {
      dayGrid: {
        ...rowContentClasses,
        ...floatingWeekNumberClasses,

        dayCellBottomClass: 'min-h-[1px]', // along with 1px margin-bottom on events, gives 2px effective
      },
      multiMonth: {
        ...rowContentClasses,
        ...floatingWeekNumberClasses,

        dayCellBottomClass: 'min-h-[1px]', // along with 1px margin-bottom on events, gives 2px effective

        tableClass: `border ${params.borderColorClass}`,
      },
      timeGrid: {
        ...rowContentClasses,

        dayRowClass: 'min-h-10',
        dayCellBottomClass: 'min-h-3', // for ALL-DAY

        allDayHeaderClass: [
          axisClass,
          'items-center', // valign
        ],
        allDayHeaderInnerClass: (data) => [
          axisInnerClass,
          'whitespace-pre', // respects line-breaks in locale data
          data.isCompact ? xxsTextClass : 'text-sm',
        ],

        weekNumberHeaderClass: `${axisClass} items-center`,
        weekNumberHeaderInnerClass: (data) => [
          axisInnerClass,
          data.isCompact ? xxsTextClass : 'text-sm',
        ],

        columnMoreLinkClass: `mb-px rounded-sm outline ${params.canvasOutlineColorClass} ${moreLinkBgClass}`,
        columnMoreLinkInnerClass: 'px-0.5 py-1 text-xs',

        slotLabelClass: axisClass,
        slotLabelInnerClass: (data) => [
          axisInnerClass,
          'min-h-[1.5em]', // add some vertical-align-center for this? make standard unit!!??
          data.isCompact ? xxsTextClass : 'text-sm',
        ],

        slotLabelDividerClass: `border-l ${params.borderColorClass}`,

        nowIndicatorLabelClass: `start-0 -mt-[5px] border-y-[5px] border-y-transparent border-s-[6px] ${params.alertBorderStartColorClass}`,
        nowIndicatorLineClass: `border-t ${params.alertBorderColorClass}`,
      },
      list: {
        listItemEventClass: `group gap-3 not-last:border-b ${params.borderColorClass} ${listItemPaddingClass}`,
        listItemEventColorClass: 'border-5', // 10px diameter circle
        listItemEventInnerClass: '[display:contents]',
        listItemEventTimeClass: 'order-[-1] w-[165px] text-sm', // send to start
        listItemEventTitleClass: (data) => [
          'text-sm',
          data.event.url && 'group-hover:underline',
        ],

        noEventsClass: `py-15 flex flex-col flex-grow items-center justify-center ${neutralBgClass}`,
      },
    },
  }
}
