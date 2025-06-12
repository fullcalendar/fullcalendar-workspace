import { CalendarOptions, createPlugin, PluginDef } from '@fullcalendar/core'
import * as svgIcons from './svgIcons.js'

// Will import ambient types during dev but strip out for build
import {} from '@fullcalendar/timegrid'
import {} from '@fullcalendar/timeline'
import {} from '@fullcalendar/list'
import {} from '@fullcalendar/multimonth'
import {} from '@fullcalendar/resource-daygrid'
import {} from '@fullcalendar/resource-timeline'

const xxsTextClass = 'text-[0.7rem]/[1.25]'
const buttonIconClass = 'text-[1.5em] w-[1em] h-[1em]'

const neutralBgClass = 'bg-gray-500/10'
const todayBgClass = 'bg-yellow-400/15 dark:bg-yellow-200/10'
const moreLinkBgClass = 'bg-gray-300 dark:bg-gray-600'

const majorBorderClass = 'border border-gray-400 dark:border-gray-700'
const borderColorClass = 'border-gray-300 dark:border-gray-800'
const borderClass = `border ${borderColorClass}` // all sides

const cellPaddingClass = 'px-1 py-0.5'
const listItemPaddingClass = 'px-3 py-2' // list-day-header and list-item-event
const dayGridItemClass = 'mx-0.5 mb-px rounded-sm' // list-item-event and more-link

// timegrid axis
const axisClass = 'justify-end' // align axisInner right
const axisInnerClass = `${cellPaddingClass} text-end min-h-[1.5em]` // align text right when multiline

// transparent resizer for mouse
// must have 'group' on the event, for group-hover
const blockPointerResizerClass = `absolute z-20 hidden group-hover:block`
const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

// circle resizer for touch
const blockTouchResizerClass = `absolute z-20 h-2 w-2 rounded-full border border-(--fc-event-color) bg-(--fc-canvas-color)`
const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

const continuationArrowClass = 'relative z-10 mx-px border-y-[5px] border-y-transparent opacity-50'

// applies to DayGrid, TimeGrid ALL-DAY, MultiMonth
const dayGridClasses: CalendarOptions = {
  listItemEventClass: [dayGridItemClass, 'p-px'],
  listItemEventColorClass: (data) => [
    data.isCompact ? 'mx-px' : 'mx-1',
    'border-4', // 8px diameter circle
  ],
  listItemEventInnerClass: (data) => [
    'flex flex-row items-center', // doesn't compete with display:contents
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
      ? 'border border-blue-500' // looks like bordered event
      : 'self-start p-px',
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

const getDayHeaderClasses = (data: { isDisabled: boolean, isMajor: boolean }) => [
  'items-center',
  data.isMajor ? majorBorderClass : borderClass,
  data.isDisabled && neutralBgClass,
]

const getDayHeaderInnerClasses = (data: { isCompact: boolean }) => [
  cellPaddingClass,
  data.isCompact && xxsTextClass,
]

const getSlotClasses = (data: { isMinor: boolean }) => [
  borderClass,
  data.isMinor && 'border-dotted',
]

// Plugin
// -------------------------------------------------------------------------------------------------

export default createPlugin({
  name: '<%= pkgName %>',
  optionDefaults: {
    className: 'gap-5',

    eventColor: 'var(--color-blue-500)',
    eventContrastColor: 'var(--color-white)',
    backgroundEventColor: 'var(--color-green-500)',

    toolbarClass: (data) => [
      'items-center gap-3',
      data.borderlessX && 'px-3', // space from edge
    ],
    toolbarSectionClass: (data) => [
      'items-center gap-3',
      data.name === 'center' && '-order-1 sm:order-0 w-full sm:w-auto', // nicer wrapping
    ],
    toolbarTitleClass: 'text-xl md:text-2xl font-bold',
    viewClass: borderClass,
    viewHeaderClass: (data) => [
      data.isSticky && 'bg-(--fc-canvas-color)',
    ],

    // UI Fundamentals
    // ---------------------------------------------------------------------------------------------

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
      'inline-flex items-center px-3 py-2 border-x',
      'focus:outline-3 outline-slate-600/50',
      'hover:border-slate-900 active:border-slate-900 print:border-slate-900',
      'hover:bg-slate-800 active:bg-slate-800 print:bg-white',
      'text-sm text-white print:text-black',
      data.inGroup
        ? 'first:rounded-s-sm last:rounded-e-sm relative active:z-20 focus:z-20'
        : 'rounded-sm',
      data.isSelected // implies inGroup
        ? 'z-10 border-slate-900 bg-slate-800'
        : 'z-0 border-transparent bg-slate-700',
      data.isDisabled
        && 'opacity-65 pointer-events-none', // bypass hover styles
    ],

    popoverClass: [borderClass, 'bg-(--fc-canvas-color) shadow-md'],
    popoverHeaderClass: ['flex flex-row justify-between items-center px-1 py-1', neutralBgClass],
    popoverTitleClass: 'px-1',
    popoverCloseContent: () => svgIcons.x('w-[1.357em] h-[1.357em] opacity-65'),
    popoverBodyClass: 'p-2 min-w-[220px]',

    // Cross-view
    // ---------------------------------------------------------------------------------------------

    navLinkClass: 'hover:underline',
    fillerClass: ['opacity-50', borderClass],
    nonBusinessClass: neutralBgClass,
    highlightClass: 'bg-cyan-100/40 dark:bg-blue-500/20',

    // All Events
    // ---------------------------------------------------------------------------------------------

    eventClass: (data) => data.event.url && 'no-underline hover:no-underline',
    eventTimeClass: 'whitespace-nowrap overflow-hidden flex-shrink-1', // shrinks second
    eventTitleClass: 'whitespace-nowrap overflow-hidden flex-shrink-100', // shrinks first

    // Background Event
    // ---------------------------------------------------------------------------------------------

    backgroundEventColorClass: 'bg-(--fc-event-color) brightness-150 opacity-15',
    backgroundEventTitleClass: (data) => [
      'm-2 opacity-50 italic',
      data.isCompact ? xxsTextClass : 'text-xs',
    ],

    // List-Item Event
    // ---------------------------------------------------------------------------------------------

    listItemEventClass: (data) => [
      'items-center',
      data.isSelected
        ? 'bg-gray-500/40' // touch-selected
        : 'hover:bg-gray-500/20 focus:bg-gray-500/30',
      (data.isSelected && data.isDragging) && 'shadow-sm', // touch-dragging
    ],

    // Dot - uses border instead of bg because it shows up in print
    // Views must decide circle radius via border thickness
    listItemEventColorClass: 'rounded-full border-(--fc-event-color)',

    // Block Event
    // ---------------------------------------------------------------------------------------------

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
    blockEventTitleClass: 'sticky',

    // TODO: best place?
    moreLinkInnerClass: 'sticky whitespace-nowrap overflow-hidden',
    rowMoreLinkInnerClass: 'start-0',
    columnMoreLinkInnerClass: 'top-0',

    // Block Event > Row Event
    // ---------------------------------------------------------------------------------------------

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
    rowEventTitleClass: 'p-px start-0', // `start` for stickiness

    // Block Event > Column Event
    // ---------------------------------------------------------------------------------------------

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
      (data.level || data.isDragging) && 'outline outline-(--fc-canvas-color)',
    ],
    columnEventInnerClass: (data) => [
      'p-px',
      data.isCompact
        ? 'flex-row gap-1' // one line
        : 'flex-col gap-px', // two lines
    ],
    columnEventTimeClass: xxsTextClass,
    columnEventTitleClass: (data) => [
      'top-0', // top for stickiness
      data.isCompact ? xxsTextClass : 'py-px text-xs',
    ],

    // Day-Headers (DayGrid & MultiMonth & TimeGrid)
    // ---------------------------------------------------------------------------------------------

    dayHeaderRowClass: borderClass,
    dayHeaderClass: getDayHeaderClasses,
    dayHeaderInnerClass: getDayHeaderInnerClasses,
    dayHeaderDividerClass: ['border-t', borderColorClass],

    // for resource views only
    resourceDayHeaderClass: getDayHeaderClasses,
    resourceDayHeaderInnerClass: getDayHeaderInnerClasses,

    // Day-Cells (DayGrid & MultiMonth & TimeGrid "all-day" section)
    // ---------------------------------------------------------------------------------------------

    dayRowClass: borderClass,
    dayCellClass: (data) => [
      data.isMajor ? majorBorderClass : borderClass,
      data.isToday && todayBgClass,
      data.isDisabled && neutralBgClass,
    ],

    dayCellTopClass: (data) => [
      'flex flex-row-reverse',
      'min-h-[2px]', // effectively 2px top padding
      data.isOther && 'opacity-30',
    ],
    dayCellTopInnerClass: (data) => [
      'p-1',
      data.hasMonthLabel && 'text-base font-bold',
      data.isCompact && xxsTextClass,
    ],

    // MultiMonth
    // ---------------------------------------------------------------------------------------------
    /*
    Also leverages viewClass and viewHeaderClass
    */
    singleMonthClass: (data) => [
      (data.colCount || 0) > 1 && 'm-4',
    ],
    singleMonthTitleClass: (data) => [
      data.isSticky && `border-b ${borderColorClass} bg-(--fc-canvas-color)`,
      data.isSticky
        ? 'py-2' // single column
        : 'pb-4', // multi-column
      data.isCompact ? 'text-base' : 'text-lg',
      'text-center font-bold',
    ],

    // TimeGrid
    // ---------------------------------------------------------------------------------------------

    allDayDividerClass: `border-y ${borderColorClass} pb-0.5 ${neutralBgClass}`,

    dayLaneClass: (data) => [
      data.isMajor ? majorBorderClass : borderClass,
      data.isToday && todayBgClass,
      data.isDisabled && neutralBgClass,
    ],
    dayLaneInnerClass: (data) => data.isSimple
      ? 'm-1' // simple print-view
      : 'ms-0.5 me-[2.5%]',

    // Slots (TimeGrid & Timeline)
    // ---------------------------------------------------------------------------------------------

    slotLabelClass: getSlotClasses,
    slotLaneClass: getSlotClasses,

    // Timeline + Resource-Timeline
    // ---------------------------------------------------------------------------------------------

    slotLabelRowClass: borderClass,

    // Resource Timeline
    // ---------------------------------------------------------------------------------------------

    resourceAreaHeaderRowClass: borderClass,
    resourceAreaHeaderClass: [borderClass, /* valign = */ 'justify-center'],
    resourceAreaHeaderInnerClass: 'p-2',
    resourceAreaDividerClass: `border-x ${borderColorClass} pl-0.5 ${neutralBgClass}`,

    resourceAreaRowClass: borderClass,
    resourceIndentClass: 'self-center me-1 relative -top-px', // HACK: relative 1px shift up
    resourceExpanderClass: 'opacity-65',
    resourceExpanderContent: (data) => data.isExpanded
      ? svgIcons.minusSquare('w-[1em] h-[1em]')
      : svgIcons.plusSquare('w-[1em] h-[1em]'),

    resourceGroupHeaderClass: neutralBgClass,
    resourceGroupHeaderInnerClass: 'p-2',
    resourceGroupLaneClass: [borderClass, neutralBgClass],

    resourceCellClass: borderClass,
    resourceCellInnerClass: 'p-2',
    resourceLaneClass: borderClass,
    resourceLaneBottomClass: (data) => !data.isCompact && 'pb-3',

    // Timeline WITHOUT resources
    // ---------------------------------------------------------------------------------------------

    timelineBottomClass: 'pb-3',

    // List View
    // ---------------------------------------------------------------------------------------------

    listDayClass: `not-last:border-b ${borderColorClass}`,
    listDayHeaderClass: (data) => [
      `flex flex-row justify-between border-b ${borderColorClass} font-bold`,
      'relative', // for overlaid "before" color
      data.isSticky && 'bg-(--fc-canvas-color)', // base color for overlaid "before" color
    ],
    listDayHeaderBeforeClass: `${neutralBgClass} absolute inset-0`,
    listDayHeaderInnerClass: `${listItemPaddingClass} relative`, // above the "before" element
  },

  // View-specific overrides for shared elements
  // ---------------------------------------------------------------------------------------------

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
      dayCellBottomClass: 'min-h-[1em]', // for all-day section
      allDayHeaderClass: [
        axisClass,
        'items-center', // valign
      ],
      allDayHeaderInnerClass: (data) => [
        axisInnerClass,
        'whitespace-pre', // respect line-breaks in locale data
        data.isCompact && xxsTextClass,
      ],
      weekNumberClass: axisClass,
      weekNumberInnerClass: (data) => [
        axisInnerClass,
        data.isCompact && xxsTextClass,
      ],
      columnMoreLinkClass: `mb-px rounded-xs outline outline-(--fc-canvas-color) ${moreLinkBgClass}`,
      columnMoreLinkInnerClass: 'px-0.5 py-1 text-xs',
      slotLabelClass: axisClass,
      slotLabelInnerClass: (data) => [
        axisInnerClass,
        data.isCompact && xxsTextClass,
      ],
      slotLabelDividerClass: `border-l ${borderColorClass}`,
      nowIndicatorLabelClass: 'start-0 -mt-[5px] border-y-[5px] border-y-transparent border-s-[6px] border-s-red-500',
      nowIndicatorLineClass: 'border-t border-red-500',
    },
    timeline: {
      rowEventClass: [
        'me-px', // space from slot line
        'items-center', // for aligning continuation arrows
      ],
      rowEventBeforeClass: (data) => !data.isStartResizable && [
        continuationArrowClass,
        'border-e-[5px] border-e-black', // pointing to start
      ],
      rowEventAfterClass: (data) => !data.isEndResizable && [
        continuationArrowClass,
        'border-s-[5px] border-s-black', // pointing to end
      ],
      rowEventInnerClass: (data) => [
        'px-px gap-1',
        data.isSpacious ? 'py-1' : 'py-px',
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
      listItemEventClass: `${listItemPaddingClass} group gap-3 not-last:border-b ${borderColorClass}`,
      listItemEventColorClass: 'border-5', // 10px diameter circle
      listItemEventInnerClass: '[display:contents]',
      listItemEventTimeClass: 'order-[-1] w-[165px]', // move to start
      listItemEventTitleClass: (data) => data.event.url && 'group-hover:underline',
      noEventsClass: `flex flex-col flex-grow justify-center items-center ${neutralBgClass} py-15`,
    },
  },
}) as PluginDef

/*
Event continuation arrows experiment.
Looks great in Firefox. Clip-path is fuzzy in Chrome. TODO: use SVG?
Need to refactor inner-padding in event element, b/c the before/after need entire height

  rowEventClass: 'mb-px',
  rowEventBeforeClass: (data) => data.isStartResizable ? [
    data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
    '-start-1',
  ] : [
    // continuation arrow
    !data.isStart && 'w-[6px] bg-(--fc-event-color) [clip-path:polygon(100%_0,0_50%,100%_100%)]',
  ],
  rowEventAfterClass: (data) => data.isEndResizable ? [
    data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
    '-end-1',
  ] : [
    // continuation arrow
    !data.isEnd && 'w-[6px] bg-(--fc-event-color) [clip-path:polygon(0_0,100%_50%,0_100%)]',
  ],
  rowEventColorClass: (data) => [
    !data.isStart && 'ms-[6px]',
    !data.isEnd && 'me-[6px]',
  ],
*/

/*
Tick Marks
  for timegrid:
    slotLabelClass: 'w-2 self-end',
  for timeline:
    slotLabelClass: 'h-2 self-end justify-end'
*/
