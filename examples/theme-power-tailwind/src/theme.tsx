import { CalendarOptions, createPlugin, PluginDef, ViewApi } from '@fullcalendar/core'
import { createElement, Fragment } from '@fullcalendar/core/preact'
import * as svgIcons from './svgIcons.js'

/*
TODO: segmented buttons:
https://m3.material.io/components/segmented-buttons/overview
*/

// Will import ambient types during dev but strip out for build
import {} from '@fullcalendar/timegrid'
import {} from '@fullcalendar/timeline'
import {} from '@fullcalendar/list'
import {} from '@fullcalendar/multimonth'
import {} from '@fullcalendar/resource-daygrid'
import {} from '@fullcalendar/resource-timeline'

const xxsTextClass = 'text-[0.7rem]/[1.25]'
const buttonIconClass = 'text-[1.5em] w-[1em] h-[1em]'

const neutralBgClass = 'bg-gray-500/7'
const moreLinkBgClass = 'bg-gray-300 dark:bg-gray-600'

const majorBorderClass = 'border border-gray-400 dark:border-gray-700'
const borderColorClass = 'border-gray-300 dark:border-gray-800'
const borderClass = `border ${borderColorClass}` // all sides

const cellPaddingClass = 'px-1 py-0.5'
const listItemPaddingClass = 'px-3 py-2' // list-day-header and list-item-event
const dayGridItemClass = 'mx-0.5 mb-px rounded-sm' // list-item-event and more-link

// timegrid axis
const axisClass = 'justify-end' // align axisInner right --- kill this?
const axisInnerClass = `${cellPaddingClass} text-end` // align text right when multiline

// transparent resizer for mouse
// must have 'group' on the event, for group-hover
const blockPointerResizerClass = `absolute z-20 hidden group-hover:block`
const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

// circle resizer for touch
// TODO: make circle bigger?
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

  rowEventInnerClass: 'gap-px', // small gap, because usually only start-time

  rowMoreLinkClass: (data) => [
    dayGridItemClass,
    data.isCompact
      ? 'border border-blue-500' // looks like bordered event
      : 'p-px',
    'hover:bg-gray-500/20', // matches list-item hover
  ],
  rowMoreLinkInnerClass: (data) => [
    'p-px',
    data.isCompact ? xxsTextClass : 'text-xs',
  ],
}

const floatingWeekNumberClasses: CalendarOptions = {
  weekNumberClass: [
    'absolute z-20 top-0 start-0 rounded-ee-sm p-0.5 min-w-[1.5em]',
    neutralBgClass,
  ],
  weekNumberInnerClass: (data) => [
    data.isCompact && xxsTextClass,
    'opacity-60 text-center',
  ],
}

const getDayHeaderClasses = (data: { isDisabled: boolean, isMajor: boolean, view: ViewApi }) => [
  data.isDisabled && neutralBgClass,
]

const getDayHeaderInnerClasses = (data: { isCompact: boolean }) => [
  'mt-2 flex flex-col items-center',
  data.isCompact && xxsTextClass,
]

const getSlotClasses = (data: { isMinor: boolean }) => [
  borderClass,
  data.isMinor && 'border-dotted',
]

export default createPlugin({
  name: '<%= pkgName %>', // TODO
  optionDefaults: {
    eventColor: 'var(--color-blue-500)',
    eventContrastColor: 'var(--color-white)',
    backgroundEventColor: 'var(--color-green-500)',
    // eventDisplay: 'block',

    className: `${borderClass} rounded-xl overflow-hidden`,

    viewHeaderClass: (data) => data.isSticky && 'bg-(--fc-canvas-color)',

    toolbarClass: 'p-4 items-center gap-3',
    toolbarSectionClass: (data) => [
      'items-center gap-3',
      data.name === 'center' && '-order-1 sm:order-0 w-full sm:w-auto', // nicer wrapping
    ],
    toolbarTitleClass: 'text-xl md:text-2xl font-bold',

    buttons: {
      prev: {
        iconContent: (data) => data.direction === 'ltr'
          ? svgIcons.chevronLeft(buttonIconClass)
          : svgIcons.chevronRight(buttonIconClass),
      },
      next: {
        iconContent: (data) => data.direction === 'ltr'
          ? svgIcons.chevronRight(buttonIconClass)
          : svgIcons.chevronLeft(buttonIconClass),
      },
      prevYear: {
        iconContent: (data) => data.direction === 'ltr'
          ? svgIcons.chevronsLeft(buttonIconClass)
          : svgIcons.chevronsRight(buttonIconClass),
      },
      nextYear: {
        iconContent: (data) => data.direction === 'ltr'
          ? svgIcons.chevronsRight(buttonIconClass)
          : svgIcons.chevronsLeft(buttonIconClass),
      },
    },

    buttonGroupClass: 'items-center isolate',
    buttonClass: (data) => [
      'inline-flex items-center px-4 py-3 border-x',
      'focus:outline-3 outline-slate-600/50',
      'hover:border-slate-900 active:border-slate-900 print:border-slate-900',
      'hover:bg-slate-800 active:bg-slate-800 print:bg-white',
      'text-sm text-white print:text-black',
      data.inGroup
        ? 'first:rounded-s-lg last:rounded-e-lg relative active:z-20 focus:z-20'
        : 'rounded-lg',
      data.isSelected // implies inGroup
        ? 'z-10 border-slate-900 bg-slate-800'
        : 'z-0 border-transparent bg-slate-700',
      data.isDisabled
        && 'opacity-65 pointer-events-none', // bypass hover styles
    ],

    popoverClass: `${borderClass} bg-(--fc-canvas-color) shadow-md`,
    popoverHeaderClass: `flex flex-row justify-between items-center px-1 py-1 ${neutralBgClass}`,
    popoverTitleClass: 'px-1',
    popoverCloseContent: () => svgIcons.x('w-[1.357em] h-[1.357em] opacity-65'),
    popoverBodyClass: 'p-2 min-w-[220px]',

    navLinkClass: 'hover:underline',

    moreLinkInnerClass: 'sticky whitespace-nowrap overflow-hidden',
    rowMoreLinkInnerClass: 'start-0',
    columnMoreLinkInnerClass: 'top-0',

    // misc BG
    fillerClass: (data) => !data.isHeader && `${borderClass} opacity-50`,
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

    blockEventClass: (data) => [
      'relative', // for absolute-positioned color
      'group', // for focus and hover
      'bg-(--fc-canvas-color)',
      'border-(--fc-event-color)', // subclasses define thickness
      (data.isDragging && !data.isSelected) && 'opacity-75',
      data.isSelected
        ? (data.isDragging ? 'shadow-lg' : 'shadow-md')
        : 'focus:shadow-md',
    ],
    blockEventColorClass: (data) => [
      'absolute z-0 inset-0',
      'bg-(--fc-event-color) print:bg-white',
      'not-print:opacity-30',
      'print:border print:border-(--fc-event-color)',
      data.isSelected
        ? 'brightness-75'
        : 'group-focus:brightness-75',
    ],
    blockEventInnerClass: 'relative z-10 p-0.5 flex',
    blockEventTimeClass: 'text-(--fc-event-color) brightness-40 dark:brightness-160',
    blockEventTitleClass: 'sticky text-(--fc-event-color) brightness-40 dark:brightness-160',

    rowEventClass: (data) => [
      'mb-px', // space between events
      data.isStart ? 'ms-px rounded-s-sm border-s-4' : 'ps-2',
      data.isEnd ? 'me-px rounded-e-sm' : 'pe-2',
      (!data.isStart && !data.isEnd) // arrows on both sides
        ? '[clip-path:polygon(0_50%,6px_0,calc(100%_-_6px)_0,100%_50%,calc(100%_-_6px)_100%,6px_100%)]'
        : !data.isStart // just start side
          ? '[clip-path:polygon(0_50%,6px_0,100%_0,100%_100%,6px_100%)]'
          : !data.isEnd // just end side
            && '[clip-path:polygon(0_0,calc(100%_-_6px)_0,100%_50%,calc(100%_-_6px)_100%,0_100%)]',
    ],
    rowEventBeforeClass: (data) => data.isStartResizable && [
      data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
      '-start-1',
    ],
    rowEventAfterClass: (data) => data.isEndResizable && [
      data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
      '-end-1',
    ],
    rowEventColorClass: (data) => [
      data.isEnd && 'rounded-e-sm', // match rounded rowEventClass (the bg)
    ],
    rowEventInnerClass: (data) => [
      'flex-row items-center',
      data.isCompact ? xxsTextClass : 'text-xs',
    ],
    rowEventTimeClass: 'p-px font-bold',
    rowEventTitleClass: 'p-px start-0', // `start` for stickiness

    columnEventClass: (data) => [
      'mb-px', // space from slot line
      'border-s-4', // always
      data.isStart && 'rounded-t-sm',
      data.isEnd && 'rounded-b-sm',
      (data.level || data.isDragging) && 'outline outline-(--fc-canvas-color)',
    ],
    columnEventBeforeClass: (data) => data.isStartResizable && [
      data.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
      '-top-1',
    ],
    columnEventAfterClass: (data) => data.isEndResizable && [
      data.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
      '-bottom-1',
    ],
    columnEventColorClass: (data) => [
      data.isStart && 'rounded-se-sm',
      data.isEnd && 'rounded-ee-sm',
    ],
    columnEventInnerClass: (data) => [
      data.isCompact
        ? 'flex-row gap-1' // one line
        : 'flex-col gap-px', // two lines
    ],
    columnEventTimeClass: xxsTextClass,
    columnEventTitleClass: (data) => [
      'top-0', // top for stickiness
      data.isCompact ? xxsTextClass : 'py-px text-xs',
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
    dayHeaderContent: (data) => (
      <Fragment>
        {data.weekdayText && (
          <div className='uppercase text-xs'>{data.weekdayText}</div>
        )}
        {data.dayNumberText && (
          /* TODO: kill navLink text decoration somehow */
          <div
            className={
              'm-0.5 flex flex-row items-center justify-center text-lg h-[2em]' +
              (data.isToday ? ' w-[2em] rounded-full bg-blue-500 text-white decoration-red-100' : '')
            }
          >{data.dayNumberText}</div>
        )}
      </Fragment>
    ),

    dayRowClass: borderClass,
    dayCellClass: (data) => [
      data.isMajor ? majorBorderClass : borderClass,
      // data.isDisabled && neutralBgClass,
    ],
    dayCellTopClass: (data) => [
      'flex flex-row justify-center',
      'min-h-[2px]', // effectively 2px top padding when no day-number
      data.isOther && 'opacity-30',
    ],
    dayCellTopInnerClass: (data) => [
      'm-1 flex flex-row items-center justify-center h-[1.8em]' +
        (data.isToday ? ' w-[1.8em] rounded-full bg-blue-500 text-white decoration-red-100' : ''),
      data.hasMonthLabel && 'text-base font-bold',
      data.isCompact && xxsTextClass,
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
    slotLabelClass: getSlotClasses,
    slotLaneClass: getSlotClasses,

    listDayClass: `not-last:border-b ${borderColorClass}`,
    listDayHeaderClass: (data) => [
      `flex flex-row justify-between border-b ${borderColorClass} font-bold`,
      'relative', // for overlaid "before" color
      data.isSticky && 'bg-(--fc-canvas-color)', // base color for overlaid "before" color
    ],
    listDayHeaderBeforeClass: `absolute inset-0 ${neutralBgClass}`,
    listDayHeaderInnerClass: `relative ${listItemPaddingClass}`, // above the "before" element

    resourceDayHeaderClass: getDayHeaderClasses,
    resourceDayHeaderInnerClass: getDayHeaderInnerClasses,

    resourceAreaHeaderRowClass: borderClass,
    resourceAreaHeaderClass: `${borderClass} items-center`, // valign
    resourceAreaHeaderInnerClass: 'p-2',

    resourceAreaDividerClass: `border-x ${borderColorClass} pl-0.5 ${neutralBgClass}`,

    // For both resources & resource groups
    resourceAreaRowClass: borderClass,

    resourceGroupHeaderClass: neutralBgClass,
    resourceGroupHeaderInnerClass: 'p-2',
    resourceGroupLaneClass: [borderClass, neutralBgClass],

    resourceCellClass: borderClass,
    resourceCellInnerClass: 'p-2',

    resourceExpanderClass: 'self-center relative -top-px start-1 opacity-65', // HACK: relative 1px shift up
    resourceExpanderContent: (data) => data.isExpanded
      ? svgIcons.minusSquare('w-[1em] h-[1em]')
      : svgIcons.plusSquare('w-[1em] h-[1em]'),

    resourceLaneClass: borderClass,
    resourceLaneBottomClass: (data) => !data.isCompact && 'pb-3',

    // Non-resource Timeline
    timelineBottomClass: 'pb-3',
  },
  views: {
    day: { // why this not working??? needed for single-day events. better solution?
      dayHeaderFormat: { day: 'numeric', weekday: 'long' },
    },
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

      dayRowClass: 'min-h-[3em]', // looks good when matches slotLabelInnerClass
      dayCellBottomClass: 'min-h-[1em]', // for ALL-DAY

      allDayHeaderClass: [
        axisClass,
        'items-center', // valign
      ],
      allDayHeaderInnerClass: (data) => [
        axisInnerClass,
        'whitespace-pre', // respects line-breaks in locale data
        data.isCompact && xxsTextClass,
      ],

      weekNumberClass: `${axisClass} items-center`,
      weekNumberInnerClass: (data) => [
        axisInnerClass,
        data.isCompact && xxsTextClass,
      ],

      columnMoreLinkClass: `mb-px rounded-xs outline outline-(--fc-canvas-color) ${moreLinkBgClass}`,
      columnMoreLinkInnerClass: 'px-0.5 py-1 text-xs',

      slotLabelClass: [axisClass, 'w-2 self-end'],
      slotLabelInnerClass: (data) => [
        'ps-2 pe-3 py-0.5 -mt-[1em] text-end', // was axisInnerClass -- best -mt- value???
        'min-h-[3em]',
        data.isCompact && xxsTextClass,
      ],

      slotLabelDividerClass: (data) => !data.isHeader && `border-l ${borderColorClass}`,

      nowIndicatorLabelClass: 'start-0 -mt-[5px] border-y-[5px] border-y-transparent border-s-[6px] border-s-red-500',
      nowIndicatorLineClass: 'border-t border-red-500',
    },
    timeline: {
      rowEventClass: [
        'me-px', // space from slot line
      ],
      rowEventInnerClass: () => [
        'gap-1', // large gap, because usually time is *range*, and we have a lot of h space anyway
        // TODO: find better way to do isSpacious
        // data.isSpacious
      ],

      rowMoreLinkClass: `me-px p-px ${moreLinkBgClass}`,
      rowMoreLinkInnerClass: 'p-0.5 text-xs',

      slotLabelClass: 'justify-center',
      slotLabelInnerClass: 'p-1',

      slotLabelDividerClass: `border-b ${borderColorClass}`,

      nowIndicatorLabelClass: 'top-0 -mx-[5px] border-x-[5px] border-x-transparent border-t-[6px] border-t-red-500',
      nowIndicatorLineClass: 'border-l border-red-500',
    },
    list: {
      listItemEventClass: `group gap-3 not-last:border-b ${borderColorClass} ${listItemPaddingClass}`,
      listItemEventColorClass: 'border-5', // 10px diameter circle
      listItemEventInnerClass: '[display:contents]',
      listItemEventTimeClass: 'order-[-1] w-[165px]', // send to start
      listItemEventTitleClass: (data) => data.event.url && 'group-hover:underline',

      noEventsClass: `py-15 flex flex-col flex-grow items-center justify-center ${neutralBgClass}`,
    },
  },
}) as PluginDef
