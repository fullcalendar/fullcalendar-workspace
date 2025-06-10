import { CalendarOptions, createPlugin, PluginDef } from '@fullcalendar/core'
import * as svgIcons from './svgIcons.js'

// Will import ambient types during dev but strip out for build
import {} from '@fullcalendar/timegrid'
import {} from '@fullcalendar/timeline'
import {} from '@fullcalendar/list'
import {} from '@fullcalendar/multimonth'
import {} from '@fullcalendar/resource-daygrid'
import {} from '@fullcalendar/resource-timeline'

// General Utils
// -------------------------------------------------------------------------------------------------

const buttonIconClass = 'text-[1.5em] w-[1em] h-[1em]'

const borderColorClass = 'border-gray-300 dark:border-gray-800'
const borderClass = `border ${borderColorClass}`

const neutralBgClass = 'bg-gray-500/10' // un-make this variable. always do shades of gray-500
const todayBgClass = 'bg-yellow-400/15 dark:bg-yellow-200/10'

// transparent resizer for mouse
// must have 'group' on the event, for group-hover
const blockPointerResizerClass = `absolute z-20 hidden group-hover:block`
const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

// circle resizer for touch
const blockTouchResizerClass = `absolute z-20 h-2 w-2 rounded border border-solid border-(--fc-event-color) bg-(--fc-canvas-color)`
const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

const realSmallText = 'text-[0.85em]/[1.1]'

function getSlotClass(data: any) {
  return [
    borderClass,
    data.isMinor && 'border-dotted',
  ]
}

// List View Util
// -------------------------------------------------------------------------------------------------

const listViewItemClass = 'px-3 py-2' // in list view, any type of row-ish thing

// TimeGrid Util
// -------------------------------------------------------------------------------------------------

const axisClass = 'justify-end' // align inner-content right

const axisInnerClass = 'text-end min-h-[1.5em]' // align text right (aka end) for when multiline

// DayGrid Util
// -------------------------------------------------------------------------------------------------

const dayGridOverrides: CalendarOptions = {
  listItemEventClass: (data) => [
    'mb-px mx-0.5 p-px rounded-sm items-center',
    (data.isSelected && data.isDragging) && 'shadow-sm',
    data.isSelected
      ? 'bg-gray-500/40'
      : 'hover:bg-gray-500/20 focus:bg-gray-500/30',
  ],
  listItemEventColorClass: 'border-[4px] mx-1', // 8px diameter (border shows up in print)
  listItemEventInnerClass: (data) => [
    'flex flex-row items-center',
    data.isCompact ? realSmallText : 'text-xs',
  ],
  listItemEventTimeClass: 'whitespace-nowrap overflow-hidden flex-shrink-0 max-w-full p-px',
  listItemEventTitleClass: 'whitespace-nowrap overflow-hidden flex-shrink p-px font-bold',

  rowEventClass: (data) => [
    data.isStart && 'ms-0.5',
    data.isEnd && 'me-0.5',
  ],
  rowEventColorClass: (data) => [
    data.isStart && 'rounded-s-sm',
    data.isEnd && 'rounded-e-sm',
  ],

  rowMoreLinkClass: (data) => [
    'mb-px  p-0.5 rounded-sm mx-0.5',
    // TODO: this more-link manual positioning will go away with measurement refactor
    'relative max-w-full overflow-hidden whitespace-nowrap',
    'hover:bg-gray-500/20',
    data.isCompact
      ? realSmallText + ' border border-(--fc-event-color) p-px'
      : 'text-xs self-start',
  ],
}

const dayGridWeekNumberOverrides: CalendarOptions = {
  weekNumberClass: (data) => [
    data.isCompact && realSmallText,
    `absolute z-20 top-0 rounded-ee-sm p-0.5 min-w-[1.5em] text-center ${neutralBgClass}`
  ],
  weekNumberInnerClass: 'opacity-60',
}

// Plugin
// -------------------------------------------------------------------------------------------------

export default createPlugin({
  name: '<%= pkgName %>',
  optionDefaults: {
    // important to define these as CSS vars because things other than events leverage them
    className: 'gap-5 [--fc-event-color:green] [--fc-event-contrast-color:white]',

    toolbarClass: (data) => [
      'gap-3',
      data.borderlessX && 'px-3',
    ],
    toolbarSectionClass: (data) => [
      'gap-3',
      // slightly nicer wrapping behavior
      data.name === 'center' && '-order-1 sm:order-0 w-full sm:w-auto',
    ],
    toolbarTitleClass: 'text-xl md:text-2xl font-bold whitespace-nowrap',
    viewClass: borderClass,
    viewHeaderClass: (data) => [
      data.isSticky && 'bg-(--fc-canvas-color)'
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

    buttonGroupClass: 'isolate',
    buttonClass: (data) => [
      'inline-flex items-center px-3 py-2 border-x text-sm text-white',
      data.inGroup
        ? 'first:rounded-s-sm last:rounded-e-sm relative' // in button-group
        : 'rounded-sm', // alone
      data.isSelected
        ? 'border-slate-900 bg-slate-800 z-10' // selected
        : 'border-transparent bg-slate-700', // not-selected
      data.isDisabled
        ? 'opacity-65 pointer-events-none' // disabled. TODO: why do we care about pointer-events?
        : '',
      'active:border-slate-900 active:bg-slate-800 active:z-20', // active (similar to selected)
      'hover:border-slate-900 hover:bg-slate-800', // hover
      'focus:outline-3 outline-slate-600/50 focus:z-10', // focus
      'print:bg-white print:border-slate-900 print:text-black', // print
    ],

    popoverClass: [borderClass, 'bg-(--fc-canvas-color) shadow-md'],
    popoverHeaderClass: `flex flex-row justify-between items-center ${neutralBgClass} px-1 py-1`,
    popoverTitleClass: 'px-1',
    popoverCloseContent: () => svgIcons.x('w-[1.357em] h-[1.357em] opacity-65'),
    popoverBodyClass: 'p-2 min-w-[220px]',

    // Cross-view
    // ---------------------------------------------------------------------------------------------

    navLinkClass: 'hover:underline',

    dayCompactWidth: 75,

    fillerClass: `opacity-50 ${borderClass}`,

    nonBusinessClass: neutralBgClass,
    highlightClass: 'bg-cyan-100/30 dark:bg-blue-500/20',

    // All Events
    // ---------------------------------------------------------------------------------------------

    eventClass: (data) => [
      // a reset. put elsewhere?
      data.event.url && 'no-underline hover:no-underline',
    ],

    // Background Event
    // ---------------------------------------------------------------------------------------------

    backgroundEventColorClass: 'bg-(--fc-event-color) brightness-150 opacity-15',
    backgroundEventTitleClass: (data) => [
      'm-2 italic opacity-50',
      data.isCompact ? realSmallText : 'text-xs',
    ],

    // List-Item Event
    // ---------------------------------------------------------------------------------------------

    listItemEventColorClass: 'rounded-full border-(--fc-event-color)',

    // Block Event
    // ---------------------------------------------------------------------------------------------

    blockEventClass: (data) => [
      'relative', // for absolutes below
      'group', // for focus and hover below
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
    blockEventInnerClass: 'relative z-10 text-(--fc-event-contrast-color) print:text-black flex gap-[3px]', // subclasses will decide flex-direction
    blockEventTimeClass: 'whitespace-nowrap overflow-hidden flex-shrink-0 max-w-full max-h-full',
    blockEventTitleClass: 'whitespace-nowrap overflow-hidden flex-shrink sticky top-0 start-0',

    // TODO: best place?
    moreLinkInnerClass: 'sticky top-0 start-0',

    // Block Event > Row Event
    // ---------------------------------------------------------------------------------------------

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
      !data.isStart && 'print:border-s-0',
      !data.isEnd && 'print:border-e-0',
    ],
    rowEventInnerClass: (data) => [
      'flex-row items-center',
      data.isCompact ? realSmallText : 'text-xs',
    ],
    rowEventTimeClass: 'p-px font-bold',
    rowEventTitleClass: 'p-px',

    // Block Event > Column Event
    // ---------------------------------------------------------------------------------------------

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
      data.level && 'outline outline-(--fc-canvas-color)',
    ],
    columnEventInnerClass: (data) => [
      'p-px text-xs',
      data.isCompact
        ? 'flex-row gap-1 overflow-hidden' // one line
        : 'flex-col gap-px', // two lines
    ],
    columnEventTimeClass: realSmallText,
    columnEventTitleClass: (data) => [
      data.isCompact && realSmallText,
    ],

    // Day-Headers (DayGrid & MultiMonth & TimeGrid)
    // ---------------------------------------------------------------------------------------------

    dayHeaderRowClass: borderClass,
    dayHeaderClass: (data) => [
      data.isCompact && realSmallText,
      borderClass,
      data.isDisabled && neutralBgClass,
    ],
    dayHeaderInnerClass: 'px-1 py-0.5',
    dayHeaderDividerClass: ['border-t', borderColorClass],

    // for resource views only
    resourceDayHeaderClass: (data) => [
      data.isCompact && realSmallText,
      borderClass,
    ],
    resourceDayHeaderInnerClass: 'px-1 py-0.5', // TODO: make this a constant... standard inner padding!

    // Day-Cells (DayGrid & MultiMonth & TimeGrid "all-day" section)
    // ---------------------------------------------------------------------------------------------

    dayRowClass: borderClass,
    dayCellClass: (data) => [
      data.isToday && todayBgClass,
      borderClass,
      data.isDisabled && neutralBgClass,
    ],

    dayCellTopClass: (data) => [
      data.isCompact && realSmallText,
      'min-h-[2px]', // effectively 2px top padding
      'flex flex-row-reverse relative', // relative for z-index above bg events
      data.isOther && 'opacity-30',
    ],
    dayCellTopInnerClass: (data) => [
      'p-1',
      data.isMonthStart && 'text-base font-bold',
    ],

    // MultiMonth
    // ---------------------------------------------------------------------------------------------
    /*
    Also leverages viewClass and viewHeaderClass
    */
    singleMonthClass: (data) => [
      (data.colCount || 0) > 1 && 'm-4', /* text-xs */
    ],
    singleMonthTitleClass: (data) => [
      'text-center font-bold',
      data.isCompact ? 'text-base' : 'text-lg',
      data.isSticky
        ? 'py-2' // singlecol
        : 'pb-4', // multicol
      data.isSticky && `border-b ${borderColorClass} bg-(--fc-canvas-color)`,
    ],

    // TimeGrid
    // ---------------------------------------------------------------------------------------------

    // whitespace-pre respects newlines in long text like "Toute la journée", meant to break
    // padding creates inner-height
    allDayDividerClass: `${neutralBgClass} pb-0.5 border-t border-b ${borderColorClass}`,

    dayLaneClass: (data) => [
      borderClass,
      data.isDisabled && neutralBgClass,
      data.isToday && todayBgClass,
    ],
    dayLaneInnerClass: (data) => [
      data.isSimple ? 'm-1' : 'ms-0.5 me-[2.5%]'
    ],

    // Slots (TimeGrid & Timeline)
    // ---------------------------------------------------------------------------------------------

    slotLabelClass: getSlotClass,
    slotLaneClass: getSlotClass,

    // only for (resource-)timeline
    slotLabelRowClass: borderClass,

    // Resource Timeline
    // ---------------------------------------------------------------------------------------------

    resourceAreaHeaderRowClass: borderClass,
    resourceAreaHeaderClass: [borderClass, /* valign = */ 'justify-center'],
    resourceAreaHeaderInnerClass: 'p-2',
    resourceAreaDividerClass: `pl-0.5 ${neutralBgClass} border-x ${borderColorClass}`,

    resourceAreaRowClass: borderClass,
    resourceIndentClass: 'me-1 relative -top-px',
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
    resourceLaneBottomClass: (data) => [
      !data.isCompact && 'pb-3'
    ],

    // Timeline WITHOUT resources
    // ---------------------------------------------------------------------------------------------

    timelineBottomClass: 'pb-3',

    // List View
    // ---------------------------------------------------------------------------------------------

    listDayClass: `not-last:border-b ${borderColorClass}`,
    listDayHeaderClass: (data) => [
      `border-b ${borderColorClass} flex flex-row justify-between font-bold relative`,
      data.isSticky && 'bg-(--fc-canvas-color)',
      // TODO: explain why
    ],
    listDayHeaderBeforeClass: `${neutralBgClass} absolute inset-0`,
    listDayHeaderInnerClass: `${listViewItemClass} relative`,
  },

  // View-specific overrides for shared elements
  // ---------------------------------------------------------------------------------------------

  /*
  why does dragging from all-day to timed cause event artifact?
  */

  views: {
    dayGrid: {
      ...dayGridOverrides,
      // effectively 2px bottom padding because events have 1px margin-bottom
      dayCellBottomClass: 'min-h-[1px]', // put elsewhere?
      ...dayGridWeekNumberOverrides,
    },
    multiMonth: {
      ...dayGridOverrides,
      // effectively 2px bottom padding because events have 1px margin-bottom
      dayCellBottomClass: 'min-h-[1px]', // put elsewhere?
      ...dayGridWeekNumberOverrides,
    },
    timeGrid: {
      ...dayGridOverrides,
      dayRowClass: 'min-h-[3em]',
      dayCellBottomClass: 'min-h-[1em]', // for all-day section
      allDayHeaderClass: (data) => [
        data.isCompact && realSmallText,
        axisClass,
        /* vertical-align = */ 'items-center',
      ],
      allDayHeaderInnerClass: [axisInnerClass, 'whitespace-pre px-1 py-0.5'],
      weekNumberClass: (data) => [
        data.isCompact && realSmallText,
        axisClass,
      ],
      weekNumberInnerClass: [axisInnerClass, 'px-1 py-0.5'],
      columnMoreLinkClass: `mb-px rounded-xs text-xs outline outline-(--fc-canvas-color) bg-gray-300 dark:bg-gray-600`,
      columnMoreLinkInnerClass: 'px-0.5 py-1',
      slotLabelClass: (data) => [
        data.isCompact && realSmallText,
        axisClass,
        /* tick-marks = 'w-2 self-end' */
      ],
      slotLabelInnerClass: [axisInnerClass, 'px-1 py-0.5'],
      slotLabelDividerClass: `border-l ${borderColorClass}`,
      nowIndicatorLabelClass: 'start-0 -mt-[5px] border-y-[5px] border-y-transparent border-s-[6px] border-s-red-500',
      nowIndicatorLineClass: 'border-t border-red-500', // put color on master setting?
    },
    timeline: {
      rowEventClass: 'me-px items-center', // for aligning continuation arrows
      rowEventBeforeClass: (data) => !data.isStartResizable && [
        // continuation arrow
        'relative z-10 mx-px border-y-[5px] border-y-transparent border-e-[5px] border-e-black opacity-50',
      ],
      rowEventAfterClass: (data) => !data.isEndResizable && [
        // continuation arrow
        'relative z-10 mx-px border-y-[5px] border-y-transparent border-s-[5px] border-s-black opacity-50',
      ],
      rowEventInnerClass: (data) => [
        'px-px',
        data.isSpacious ? 'py-1' : 'py-px',
      ],
      rowMoreLinkClass: `flex flex-col items-start text-xs bg-gray-300 dark:bg-gray-600 p-px me-px`, // TODO: dry bg color?
      rowMoreLinkInnerClass: 'p-0.5',
      slotLabelClass: [
        /* tick-marks = 'h-2 self-end justify-end', */
        'justify-center'
      ],
      slotLabelInnerClass: 'p-1',
      slotLabelDividerClass: `border-b ${borderColorClass}`,
      nowIndicatorLabelClass: 'top-0 -mx-[5px] border-x-[5px] border-x-transparent border-t-[6px] border-t-red-500',
      nowIndicatorLineClass: 'border-l border-red-500', // put color on master setting?
    },
    list: {
      listItemEventClass: [
        listViewItemClass,
        `not-last:border-b ${borderColorClass} hover:bg-gray-500/20`,
        'flex flex-row items-center gap-3',
        'group',
      ],
      listItemEventColorClass: 'border-[5px]', // 5px radius = 10px width (border shows up in print!)
      listItemEventInnerClass: '[display:contents]',
      listItemEventTimeClass: 'order-[-1] w-[165px]',
      listItemEventTitleClass: (data) => [
        data.event.url && 'group-hover:underline',
      ],
      noEventsClass: `flex flex-grow justify-center items-center ${neutralBgClass} py-15`,
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
