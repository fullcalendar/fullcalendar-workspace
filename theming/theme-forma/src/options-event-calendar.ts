import { CalendarOptions, ViewOptions } from '@fullcalendar/core'

/*
Colors:
https://react.fluentui.dev/?path=/docs/theme-colors--docs
For color variations, see different brand colors:
https://fluent2.microsoft.design/color
spacing and whatnot:
https://react.fluentui.dev/?path=/docs/theme-spacing--docs

TODO: put blue line at top of popover when isToday?

TODO: week numbers in small singleMonths look bad
*/

// ambient types
// TODO: make these all peer deps? or wait, move options to just core
import '@fullcalendar/daygrid'
import '@fullcalendar/timegrid'
import '@fullcalendar/list'
import '@fullcalendar/multimonth'
import '@fullcalendar/interaction'

// css vars
// TODO: contrast color. highlight color, default background event color

const xxsTextClass = 'text-[0.7rem]/[1.25]'

export const neutralBgClass = 'bg-gray-500/10'
const moreLinkBgClass = 'bg-gray-300 dark:bg-gray-600'

const cellPaddingClass = 'p-2'
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
const getBlockTouchResizerClass = (canvasBgColorClass: string) => `absolute z-20 h-2 w-2 rounded-full border border-(--fc-event-color) ${canvasBgColorClass}`;
const getRowTouchResizerClass = (canvasBgColorClass: string) => `${getBlockTouchResizerClass(canvasBgColorClass)} top-1/2 -mt-1`;
const getColumnTouchResizerClass = (canvasBgColorClass: string) => `${getBlockTouchResizerClass(canvasBgColorClass)} left-1/2 -ml-1`;

// applies to DayGrid, TimeGrid ALL-DAY, MultiMonth
const dayGridClasses: CalendarOptions = {
  listItemEventClass: (data) => [
    dayGridItemClass, 'p-px',

    'items-center',
    data.isSelected
      ? 'bg-gray-500/40' // touch-selected
      : 'hover:bg-gray-500/20 focus:bg-gray-500/30',
    (data.isSelected && data.isDragging) && 'shadow-sm', // touch-dragging
  ],
  listItemEventColorClass: (data) => [
    data.isCompact ? 'mx-px' : 'mx-1',
    'border-4', // 8px diameter circle

    // Dot uses border instead of bg because it shows up in print
    // Views must decide circle radius via border thickness
    'rounded-full border-(--fc-event-color)',
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



const getSlotClasses = (data: { isMinor: boolean }, borderClass: string) => [
  borderClass,
  data.isMinor && 'border-dotted',
]

/*
TODO: bottom border radius weird
TODO: ensure button-group (non-view) looks okay. not hover-only
*/

export interface EventCalendarOptionParams {
  primaryBgColorClass: string // TODO: combine these two?
  primaryTextColorClass: string // "
  primaryBorderColorClass: string // for now-indicator AND line above dayHeader

  borderColorClass: string // eventually just borderColor
  majorBorderColorClass: string // eventually just majorBorderColor
  alertBorderColorClass: string // eventually just alertBorderColor

  eventColor: string
  // NOTE: eventContrastColor not needed because eventColor always faded to bg color
  backgroundEventColor: string
  backgroundEventColorClass: string

  popoverClass: string

  canvasBgColorClass: string
  canvasOutlineColorClass: string
}

export function createEventCalendarOptions(params: EventCalendarOptionParams): {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} {
  const borderClass = `border ${params.borderColorClass}`
  const majorBorderClass = `border ${params.majorBorderColorClass}`

  return {
    optionDefaults: {
      eventColor: params.eventColor,
      backgroundEventColor: params.backgroundEventColor,

      className: `${borderClass} rounded-sm shadow-xs overflow-hidden`,
      headerToolbarClass: `border-b ${params.borderColorClass}`,
      footerToolbarClass: `border-t ${params.borderColorClass}`,

      tableHeaderClass: (data) => data.isSticky && params.canvasBgColorClass,

      navLinkClass: 'hover:underline',

      moreLinkInnerClass: 'whitespace-nowrap overflow-hidden',

      // TODO: fix problem with huge hit area for title
      popoverClass: params.popoverClass,
      popoverHeaderClass: neutralBgClass,
      popoverCloseClass: 'absolute top-2 end-2',
      popoverBodyClass: 'p-2 min-w-[220px]',

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
        data.isSelected ? getRowTouchResizerClass(params.canvasBgColorClass) : rowPointerResizerClass,
        '-start-1',
      ] : [
        // the < continuation
        !data.isStart && (
          'relative z-10 w-[0.4em] h-[0.4em] border-t-1 border-s-1 border-gray-500 ms-1' +
          ' -rotate-45' // TODO: make RTL-friendly
        )
      ],
      rowEventAfterClass: (data) => data.isEndResizable ? [
        data.isSelected ? getRowTouchResizerClass(params.canvasBgColorClass) : rowPointerResizerClass,
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
        (data.level || data.isDragging) && `outline ${params.canvasOutlineColorClass}`
      ],
      columnEventBeforeClass: (data) => data.isStartResizable && [
        data.isSelected ? getColumnTouchResizerClass(params.canvasBgColorClass) : columnPointerResizerClass,
        '-top-1',
      ],
      columnEventAfterClass: (data) => data.isEndResizable && [
        data.isSelected ? getColumnTouchResizerClass(params.canvasBgColorClass) : columnPointerResizerClass,
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
        data.isSticky && `border-b ${params.borderColorClass} ${params.canvasBgColorClass}`,
        data.isSticky
          ? 'py-2' // single column
          : 'pb-4', // multi-column
        data.isCompact ? 'text-base' : 'text-lg',
        'text-center font-bold',
      ],

      dayHeaderRowClass: borderClass,

      dayHeaderDividerClass: ['border-t', params.borderColorClass],

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

      allDayDividerClass: `border-t ${params.borderColorClass}`,

      dayLaneClass: (data) => [
        data.isMajor ? majorBorderClass : borderClass,
        data.isDisabled && neutralBgClass,
      ],
      dayLaneInnerClass: (data) => data.isSimple
        ? 'm-1' // simple print-view
        : 'ms-0.5 me-[2.5%]',

      slotLabelRowClass: borderClass, // Timeline
      slotLabelAlign: 'center',
      slotLabelClass: (data) => getSlotClasses(data, borderClass),
      slotLaneClass: (data) => getSlotClasses(data, borderClass),

      nowIndicatorLineClass: `-m-px border-1 ${params.alertBorderColorClass}`,
      nowIndicatorDotClass: `rounded-full w-0 h-0 -mx-[6px] -my-[6px] border-6 ${params.alertBorderColorClass} outline-2 ${params.canvasOutlineColorClass}`,

      listDayClass: `not-last:border-b ${params.borderColorClass} flex flex-row items-start`,
      listDayHeaderClass: 'top-0 sticky w-1/4 max-w-40 p-3 flex flex-col',
      listDayHeaderInnerClass: (data) => [
        data.level ? 'text-xs' : ('text-lg' + (data.isToday ? ' font-bold' : '')),
      ],
      listDayEventsClass: 'flex-grow flex flex-col items-stretch gap-4 p-4',
    },
    views: {
      dayGrid: {
        ...dayGridClasses,
        // TODO: DRY
        dayHeaderClass: (data) => [
          data.isMajor ? majorBorderClass : borderClass,
          data.isDisabled && neutralBgClass,
        ],
        dayHeaderInnerClass: (data) => [
          'flex flex-col',
          'px-2 pt-1 pb-2 border-t-4', // TODO: adjust padding when isCompact?
          (data.isToday && !data.inPopover) ? params.primaryBorderColorClass : 'border-transparent',
          data.isCompact ? xxsTextClass : 'text-xs',
        ],

        ...floatingWeekNumberClasses,

        dayCellBottomClass: 'min-h-[1px]',
      },
      multiMonth: {
        ...dayGridClasses,
        dayHeaderClass: 'items-center',

        ...floatingWeekNumberClasses,

        dayCellBottomClass: 'min-h-[1px]',
      },
      timeGrid: {
        ...dayGridClasses,
        // TODO: DRY
        dayHeaderClass: (data) => [
          data.isMajor ? majorBorderClass : borderClass,
          data.isDisabled && neutralBgClass,
        ],
        dayHeaderInnerClass: (data) => [
          'flex flex-col',
          'px-2 pt-1 pb-2 border-t-4', // TODO: adjust padding when isCompact?
          (data.isToday && !data.inPopover) ? params.primaryBorderColorClass : 'border-transparent',
          data.isCompact ? xxsTextClass : 'text-xs',
        ],

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

        columnMoreLinkClass: `mb-px rounded-xs outline ${params.canvasOutlineColorClass} ${moreLinkBgClass}`,
        columnMoreLinkInnerClass: 'px-0.5 py-1 text-xs',

        slotLabelClass: axisClass,
        slotLabelInnerClass: (data) => [
          axisInnerClass,
          'min-h-[1.5em]',
          data.isCompact ? xxsTextClass : 'text-xs',
        ],

        slotLabelDividerClass: `border-l ${params.borderColorClass}`,
      },
      list: {
        listItemEventClass: 'bg-white p-3 flex flex-row rounded-sm border-s-6 border-(--fc-event-color) relative', // why the hover color!?
        listItemEventColorClass: 'absolute inset-0 bg-(--fc-event-color) opacity-20 rounded-e-sm',

        listItemEventInnerClass: 'relative flex flex-row text-sm', // TODO: ensure gap
        listItemEventTimeClass: 'w-40',
        listItemEventTitleClass: 'flex-grow font-semibold',

        noEventsClass: `py-15 flex flex-col flex-grow items-center justify-center`,
      },
    },
  }
}
