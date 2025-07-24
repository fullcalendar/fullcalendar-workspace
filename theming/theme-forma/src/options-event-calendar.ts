import { CalendarOptions, ViewOptions } from '@fullcalendar/core'

/*
Colors:
https://react.fluentui.dev/?path=/docs/theme-colors--docs
For color variations, see different brand colors:
https://fluent2.microsoft.design/color
spacing and whatnot:
https://react.fluentui.dev/?path=/docs/theme-spacing--docs
*/

// ambient types
// TODO: make these all peer deps? or wait, move options to just core
import '@fullcalendar/daygrid'
import '@fullcalendar/timegrid'
import '@fullcalendar/list'
import '@fullcalendar/multimonth'
import '@fullcalendar/interaction'

// css vars
const defaultEventColor = 'var(--fc-forma-event-color)'
const primaryBorderColorClass = 'border-(--fc-forma-primary-color)'
// TODO: contrast color. highlight color, default background event color

const xxsTextClass = 'text-[0.7rem]/[1.25]'

const neutralBgClass = 'bg-gray-500/10'
const moreLinkBgClass = 'bg-gray-300 dark:bg-gray-600'

const majorBorderClass = 'border border-gray-400 dark:border-gray-700'
const borderColorClass = 'border-[#ddd] dark:border-gray-800'
const borderClass = `border ${borderColorClass}` // all sides

const cellPaddingClass = 'p-2'
const listItemPaddingClass = 'px-3 py-2' // list-day-header and list-item-event
const dayGridItemClass = 'mx-0.5 mb-px rounded-sm' // list-item-event and more-link

// timegrid axis
const axisClass = 'justify-end' // align axisInner right
const axisInnerClass = `${cellPaddingClass} text-end` // align text right when multiline

// transparent resizer for mouse
// must have 'group' on the event, for group-hover
const blockPointerResizerClass = `absolute z-20 hidden group-hover:block`
const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

// circle resizer for touch
const blockTouchResizerClass = `absolute z-20 h-2 w-2 rounded-full border border-(--fc-event-color) bg-(--fc-canvas-color)`
const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

// applies to DayGrid, TimeGrid ALL-DAY, MultiMonth
const dayGridClasses: CalendarOptions = {
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
    data.isEnd && 'me-0.5',
  ],

  rowMoreLinkClass: (data) => [
    dayGridItemClass,
    data.isCompact
      ? 'border border-blue-500' // looks like bordered event
      : 'self-start p-px',
    'hover:bg-gray-500/20', // matches list-item hover
  ],
  rowMoreLinkInnerClass: (data) => [
    'p-px',
    data.isCompact ? xxsTextClass : 'text-xs',
  ],
}

// TODO: improve this
const floatingWeekNumberClasses: CalendarOptions = {
  weekNumberClass: [
    'absolute z-20 top-1 end-0 rounded-s-full',
    neutralBgClass,
  ],
  weekNumberInnerClass: (data) => [
    data.isCompact ? xxsTextClass : 'text-xs',
    'py-1 pe-1 ps-2 opacity-60 text-center',
  ],
}

// TODO: core should prevent a top border. does it?
export const getDayHeaderClasses = (data: { isDisabled: boolean, isMajor: boolean }) => [
  data.isMajor ? majorBorderClass : borderClass,
  data.isDisabled && neutralBgClass,
]
export const getDayHeaderInnerClasses = (data: { isCompact: boolean, isToday?: boolean, inPopover?: boolean }) => [
  'flex flex-col',
  'px-2 pt-1 pb-2 border-t-4',
  (data.isToday && !data.inPopover) ? primaryBorderColorClass : 'border-transparent',
  data.isCompact ? xxsTextClass : 'text-xs',
]

const getSlotClasses = (data: { isMinor: boolean }) => [
  borderClass,
  data.isMinor && 'border-dotted',
]

/*
TODO: bottom border radius weird
TODO: ensure button-group (non-view) looks okay. not hover-only
*/

export interface EventCalendarOptionParams {
}

export function createEventCalendarOptions({}: EventCalendarOptionParams): {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} {
  return {
    optionDefaults: {
      eventColor: defaultEventColor,
      eventContrastColor: 'var(--color-white)',
      backgroundEventColor: 'var(--color-green-500)',

      className: `${borderClass} rounded-sm shadow-xs overflow-hidden`,
      headerToolbarClass: `border-b ${borderColorClass}`,
      footerToolbarClass: `border-t ${borderColorClass}`,

      tableHeaderClass: (data) => data.isSticky && 'bg-(--fc-canvas-color)',

      navLinkClass: 'hover:underline',

      moreLinkInnerClass: 'whitespace-nowrap overflow-hidden',

      // misc BG
      fillerClass: `${borderClass} opacity-50`,
      nonBusinessClass: neutralBgClass,
      highlightClass: 'bg-cyan-100/40 dark:bg-blue-500/20',

      eventClass: (data) => data.event.url && 'hover:no-underline',
      eventTimeClass: 'whitespace-nowrap overflow-hidden flex-shrink-1', // shrinks second
      eventTitleClass: 'whitespace-nowrap overflow-hidden flex-shrink-100', // shrinks first

      backgroundEventColorClass: 'bg-(--fc-event-color) brightness-150 opacity-15',
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

      blockEventClass: [
        'relative', // for absolute-positioned color
        'group', // for focus and hover
        'bg-white',
        'border-(--fc-event-color)',
        // TODO: isDragging, isSelected
      ],
      blockEventColorClass: [
        'absolute inset-0 bg-(--fc-event-color) opacity-40',
      ],
      blockEventInnerClass: 'relative z-10 flex', // TODO

      rowEventClass: (data) => [
        'mb-px', // space between events
        'flex flex-row items-center', // for valigning title and <> arrows
        data.isStart && 'border-s-6 rounded-s-sm',
        data.isEnd && 'rounded-e-sm',
      ],
      rowEventBeforeClass: (data) => data.isStartResizable ? [
        data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
        '-start-1',
      ] : [
        // the < continuation
        !data.isStart && (
          'relative z-10 w-[0.4em] h-[0.4em] border-t-1 border-s-1 border-gray-500 ms-1' +
          ' -rotate-45' // TODO: make RTL-friendly
        )
      ],
      rowEventAfterClass: (data) => data.isEndResizable ? [
        data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
        '-end-1',
      ] : [
        // the > continuation
        !data.isEnd && (
          'relative z-10 w-[0.4em] h-[0.4em] border-t-1 border-e-1 border-gray-500 me-1' +
          ' rotate-45' // TODO: make RTL-friendly
        )
      ],
      rowEventColorClass: (data) => [
        data.isEnd && 'rounded-e-sm',
      ],
      rowEventInnerClass: (data) => [
        'flex-row items-center',
        data.isCompact ? xxsTextClass : 'text-xs',
      ],
      rowEventTimeClass: 'p-1',
      rowEventTitleClass: 'p-1',

      columnEventClass: (data) => [
        'border-s-6 rounded-s-sm rounded-e-sm',
        (data.level || data.isDragging) && 'outline outline-(--fc-canvas-color)'
      ],
      columnEventBeforeClass: (data) => data.isStartResizable && [
        data.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
        '-top-1',
      ],
      columnEventAfterClass: (data) => data.isEndResizable && [
        data.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
        '-bottom-1',
      ],
      columnEventColorClass: [
        'rounded-e-sm',
      ],
      columnEventInnerClass: (data) => [
        data.isCompact
          ? 'flex-row gap-1' // one line
          : 'flex-col gap-px', // two lines
      ],
      columnEventTimeClass: [
        'p-0.5',
        xxsTextClass,
      ],
      columnEventTitleClass: (data) => [
        'p-0.5',
        data.isCompact ? xxsTextClass : 'text-xs',
      ],

      // MultiMonth
      singleMonthClass: (data) => data.colCount > 1 && 'm-4',
      singleMonthTitleClass: (data) => [
        data.isSticky && `border-b ${borderColorClass} bg-(--fc-canvas-color)`,
        data.isSticky
          ? 'py-2' // single column
          : 'pb-4', // multi-column
        data.isCompact ? 'text-base' : 'text-lg',
        'text-center font-bold',
      ],

      dayHeaderRowClass: borderClass,

      dayHeaderClass: getDayHeaderClasses,
      dayHeaderInnerClass: getDayHeaderInnerClasses,

      dayHeaderDividerClass: ['border-t', borderColorClass],

      dayRowClass: borderClass,
      dayCellClass: (data) => [
        data.isMajor ? majorBorderClass : borderClass,
        data.isDisabled
          ? 'bg-gray-100'
          : data.isOther && 'bg-gray-50',
      ],
      dayCellTopClass: [
        'flex flex-row',
        'min-h-[2px]', // effectively 2px top padding when no day-number
      ],
      dayCellTopInnerClass: (data) => [
        'px-1 py-1 flex flex-row',
        data.hasMonthLabel && 'text-base font-bold',
        data.isCompact ? xxsTextClass : 'text-sm',
      ],

      allDayDividerClass: `border-t ${borderColorClass}`,

      dayLaneClass: (data) => [
        data.isMajor ? majorBorderClass : borderClass,
        data.isDisabled && neutralBgClass,
      ],
      dayLaneInnerClass: (data) => data.isSimple
        ? 'm-1' // simple print-view
        : 'ms-0.5 me-[2.5%]',

      slotLabelRowClass: borderClass, // Timeline
      slotLabelAlign: 'center',
      slotLabelClass: getSlotClasses,
      slotLaneClass: getSlotClasses,

      nowIndicatorLineClass: `-m-px border-1 ${primaryBorderColorClass}`,
      nowIndicatorDotClass: `rounded-full w-0 h-0 -mx-[6px] -my-[6px] border-6 ${primaryBorderColorClass} outline-2 outline-(--fc-canvas-color)`,

      listDayClass: `not-last:border-b ${borderColorClass}`,
      listDayHeaderClass: (data) => [
        `flex flex-row justify-between border-b ${borderColorClass} font-bold`,
        'relative', // for overlaid "before" color
        data.isSticky && 'bg-(--fc-canvas-color)', // base color for overlaid "before" color
      ],
      listDayHeaderBeforeClass: `absolute inset-0 ${neutralBgClass}`,
      listDayHeaderInnerClass: `relative ${listItemPaddingClass} text-sm`, // above the "before" element
    },
    views: {
      dayGrid: {
        ...dayGridClasses,
        ...floatingWeekNumberClasses,

        dayCellBottomClass: 'min-h-[1px]',
      },
      multiMonth: {
        ...dayGridClasses,
        ...floatingWeekNumberClasses,

        dayCellBottomClass: 'min-h-[1px]',
      },
      timeGrid: {
        ...dayGridClasses,

        dayRowClass: 'min-h-[3em]',
        dayCellBottomClass: 'min-h-[1em]', // for ALL-DAY

        allDayHeaderClass: [
          axisClass,
          'items-center', // valign
        ],
        allDayHeaderInnerClass: (data) => [
          axisInnerClass,
          'whitespace-pre', // respects line-breaks in locale data
          data.isCompact ? xxsTextClass : 'text-xs',
        ],

        weekNumberClass: `${axisClass} items-end`,
        weekNumberInnerClass: (data) => [
          axisInnerClass,
          data.isCompact ? xxsTextClass : 'text-xs',
        ],

        columnMoreLinkClass: `mb-px rounded-xs outline outline-(--fc-canvas-color) ${moreLinkBgClass}`,
        columnMoreLinkInnerClass: 'px-0.5 py-1 text-xs',

        slotLabelClass: axisClass,
        slotLabelInnerClass: (data) => [
          axisInnerClass,
          'min-h-[1.5em]',
          data.isCompact ? xxsTextClass : 'text-xs',
        ],

        slotLabelDividerClass: `border-l ${borderColorClass}`,
      },
      list: {
        listItemEventClass: `group gap-3 not-last:border-b ${borderColorClass} ${listItemPaddingClass}`,
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
