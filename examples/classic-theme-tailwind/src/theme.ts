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

const buttonIconClassName = 'text-[1.5em] w-[1em] h-[1em]'

const borderColorClassNames = 'border-gray-300 dark:border-gray-800'
const borderClassName = `border ${borderColorClassNames}`

const neutralBgClassNames = 'bg-gray-500/10' // un-make this variable. always do shades of gray-500
const todayBgClassNames = 'bg-yellow-400/15 dark:bg-yellow-200/10'

// transparent resizer for mouse
// must have 'group' on the event, for group-hover
const blockPointerResizerClassName = `absolute z-20 hidden group-hover:block`
const rowPointerResizerClassName = `${blockPointerResizerClassName} inset-y-0 w-2`
const columnPointerResizerClassName = `${blockPointerResizerClassName} inset-x-0 h-2`

// circle resizer for touch
const blockTouchResizerClassName = `absolute z-20 h-2 w-2 rounded border border-solid border-(--fc-event-color) bg-(--fc-canvas-color)`
const rowTouchResizerClassName = `${blockTouchResizerClassName} top-1/2 -mt-1`
const columnTouchResizerClassName = `${blockTouchResizerClassName} left-1/2 -ml-1`

const realSmallText = 'text-[0.85em]/[1.1]'

function getSlotClassNames(arg: any) {
  return [
    borderClassName,
    arg.isMinor && 'border-dotted',
  ]
}

// List View Util
// -------------------------------------------------------------------------------------------------

const listViewItemClassName = 'px-3 py-2' // in list view, any type of row-ish thing

// TimeGrid Util
// -------------------------------------------------------------------------------------------------

const axisClassName = 'justify-end' // align inner-content right

const axisInnerClassName = 'text-end min-h-[1.5em]' // align text right (aka end) for when multiline

// DayGrid Util
// -------------------------------------------------------------------------------------------------

const dayGridOverrides: CalendarOptions = {
  listItemEventClassNames: (arg) => [
    'mb-px me-0.5 p-px rounded-sm items-center',
    (arg.isSelected && arg.isDragging) && 'shadow-sm',
    arg.isSelected
      ? 'bg-gray-500/40'
      : 'hover:bg-gray-500/20 focus:bg-gray-500/30',
  ],
  listItemEventColorClassNames: 'border-[4px] mx-1', // 8px diameter (border shows up in print)
  listItemEventInnerClassNames: (arg) => [
    'flex flex-row items-center',
    arg.isCompact ? realSmallText : 'text-xs',
  ],
  listItemEventTimeClassNames: 'whitespace-nowrap overflow-hidden flex-shrink-0 max-w-full p-px',
  listItemEventTitleClassNames: 'whitespace-nowrap overflow-hidden flex-shrink p-px font-bold',

  rowEventClassNames: (arg) => [
    arg.isStart && 'ms-0.5',
    arg.isEnd && 'me-0.5',
  ],
  rowEventColorClassNames: (arg) => [
    arg.isStart && 'rounded-s-sm',
    arg.isEnd && 'rounded-e-sm',
  ],

  rowMoreLinkClassNames: (arg) => [
    'mb-px  p-0.5 rounded-sm mx-0.5',
    // TODO: this more-link manual positioning will go away with measurement refactor
    'relative max-w-full overflow-hidden whitespace-nowrap',
    'hover:bg-gray-500/20',
    arg.isCompact
      ? realSmallText + ' border border-(--fc-event-color) p-px'
      : 'text-xs self-start',
  ],
}

const dayGridWeekNumberOverrides: CalendarOptions = {
  weekNumberClassNames: (arg) => [
    arg.isCompact && realSmallText,
    `absolute z-20 top-0 rounded-ee-sm p-0.5 min-w-[1.5em] text-center ${neutralBgClassNames}`
  ],
  weekNumberInnerClassNames: 'opacity-60',
}

// Plugin
// -------------------------------------------------------------------------------------------------

export default createPlugin({
  name: '<%= pkgName %>',
  optionDefaults: {
    // important to define these as CSS vars because things other than events leverage them
    classNames: 'gap-5 [--fc-event-color:green] [--fc-event-contrast-color:white]',

    toolbarClassNames: (arg) => [
      'gap-3',
      arg.borderlessX && 'px-3',
    ],
    toolbarSectionClassNames: 'gap-3',
    toolbarTitleClassNames: 'text-2xl font-bold whitespace-nowrap',
    viewClassNames: borderClassName,
    viewHeaderClassNames: (arg) => [
      arg.isSticky && 'bg-(--fc-canvas-color)'
    ],

    // UI Fundamentals
    // ---------------------------------------------------------------------------------------------

    buttons: {
      prev: {
        iconContent: (arg) => arg.direction === 'ltr'
          ? svgIcons.chevronLeft(buttonIconClassName)
          : svgIcons.chevronRight(buttonIconClassName),
      },
      next: {
        iconContent: (arg) => arg.direction === 'ltr'
          ? svgIcons.chevronRight(buttonIconClassName)
          : svgIcons.chevronLeft(buttonIconClassName),
      },
      prevYear: {
        iconContent: (arg) => arg.direction === 'ltr'
          ? svgIcons.chevronsLeft(buttonIconClassName)
          : svgIcons.chevronsRight(buttonIconClassName),
      },
      nextYear: {
        iconContent: (arg) => arg.direction === 'ltr'
          ? svgIcons.chevronsRight(buttonIconClassName)
          : svgIcons.chevronsLeft(buttonIconClassName),
      },
    },

    buttonGroupClassNames: 'isolate',
    buttonClassNames: (arg) => [
      'inline-flex items-center px-3 py-2 border-x text-sm text-white',
      arg.inGroup
        ? 'first:rounded-s-sm last:rounded-e-sm relative' // in button-group
        : 'rounded-sm', // alone
      arg.isSelected
        ? 'border-slate-900 bg-slate-800 z-10' // selected
        : 'border-transparent bg-slate-700', // not-selected
      arg.isDisabled
        ? 'opacity-65 pointer-events-none' // disabled. TODO: why do we care about pointer-events?
        : '',
      'active:border-slate-900 active:bg-slate-800 active:z-20', // active (similar to selected)
      'hover:border-slate-900 hover:bg-slate-800', // hover
      'focus:outline-3 outline-slate-600/50 focus:z-10', // focus
      'print:bg-white print:border-slate-900 print:text-black', // print
    ],

    popoverClassNames: [borderClassName, 'bg-(--fc-canvas-color) shadow-md'],
    popoverHeaderClassNames: `flex flex-row justify-between items-center ${neutralBgClassNames} px-1 py-1`,
    popoverTitleClassNames: 'px-1',
    popoverCloseContent: () => svgIcons.x('w-[1.357em] h-[1.357em] opacity-65'),
    popoverBodyClassNames: 'p-2 min-w-[220px]',

    // Cross-view
    // ---------------------------------------------------------------------------------------------

    navLinkClassNames: 'hover:underline',

    dayCompactWidth: 75,

    fillerClassNames: `opacity-50 ${borderClassName}`,

    nonBusinessClassNames: neutralBgClassNames,
    highlightClassNames: 'bg-cyan-100/30 dark:bg-blue-500/20',

    // All Events
    // ---------------------------------------------------------------------------------------------

    eventClassNames: (arg) => [
      // a reset. put elsewhere?
      arg.event.url && 'no-underline hover:no-underline',
    ],

    // Background Event
    // ---------------------------------------------------------------------------------------------

    backgroundEventColorClassNames: 'bg-(--fc-event-color) brightness-150 opacity-15',
    backgroundEventTitleClassNames: (arg) => [
      'm-2 italic opacity-50',
      arg.isCompact ? realSmallText : 'text-xs',
    ],

    // List-Item Event
    // ---------------------------------------------------------------------------------------------

    listItemEventColorClassNames: 'rounded-full border-(--fc-event-color)',

    // Block Event
    // ---------------------------------------------------------------------------------------------

    blockEventClassNames: (arg) => [
      'relative', // for absolutes below
      'group', // for focus and hover below
      'p-px',
      (arg.isDragging && !arg.isSelected) && 'opacity-75',
      arg.isSelected
        ? (arg.isDragging ? 'shadow-lg' : 'shadow-md')
        : 'focus:shadow-md',
    ],
    blockEventColorClassNames: (arg) => [
      'absolute z-0 inset-0 bg-(--fc-event-color)',
      'print:border print:border-(--fc-event-color) print:bg-white',
      arg.isSelected
        ? 'brightness-75'
        : 'group-focus:brightness-75',
    ],
    blockEventInnerClassNames: 'relative z-10 text-(--fc-event-contrast-color) print:text-black flex gap-[3px]', // subclasses will decide flex-direction
    blockEventTimeClassNames: 'whitespace-nowrap overflow-hidden flex-shrink-0 max-w-full max-h-full',
    blockEventTitleClassNames: 'whitespace-nowrap overflow-hidden flex-shrink sticky top-0 start-0',

    // TODO: best place?
    moreLinkInnerClassNames: 'sticky top-0 start-0',

    // Block Event > Row Event
    // ---------------------------------------------------------------------------------------------

    rowEventClassNames: 'mb-px',
    rowEventBeforeClassNames: (arg) => arg.isStartResizable && [
      arg.isSelected ? rowTouchResizerClassName : rowPointerResizerClassName,
      '-start-1',
    ],
    rowEventAfterClassNames: (arg) => arg.isEndResizable && [
      arg.isSelected ? rowTouchResizerClassName : rowPointerResizerClassName,
      '-end-1',
    ],
    rowEventColorClassNames: (arg) => [
      !arg.isStart && 'print:border-s-0',
      !arg.isEnd && 'print:border-e-0',
    ],
    rowEventInnerClassNames: (arg) => [
      'flex-row items-center',
      arg.isCompact ? realSmallText : 'text-xs',
    ],
    rowEventTimeClassNames: 'p-px font-bold',
    rowEventTitleClassNames: 'p-px',

    // Block Event > Column Event
    // ---------------------------------------------------------------------------------------------

    columnEventClassNames: 'mb-px',
    columnEventBeforeClassNames: (arg) => arg.isStartResizable && [
      arg.isSelected ? columnTouchResizerClassName : columnPointerResizerClassName,
      '-top-1',
    ],
    columnEventAfterClassNames: (arg) => arg.isEndResizable && [
      arg.isSelected ? columnTouchResizerClassName : columnPointerResizerClassName,
      '-bottom-1',
    ],
    columnEventColorClassNames: (arg) => [
      arg.isStart && 'rounded-t-sm',
      arg.isEnd && 'rounded-b-sm',
      arg.level && 'outline outline-(--fc-canvas-color)',
    ],
    columnEventInnerClassNames: (arg) => [
      'p-px text-xs',
      arg.isCompact
        ? 'flex-row gap-1 overflow-hidden' // one line
        : 'flex-col gap-px', // two lines
    ],
    columnEventTimeClassNames: realSmallText,
    columnEventTitleClassNames: (arg) => [
      arg.isCompact && realSmallText,
    ],

    // Day-Headers (DayGrid & MultiMonth & TimeGrid)
    // ---------------------------------------------------------------------------------------------

    dayHeaderRowClassNames: borderClassName,
    dayHeaderClassNames: (arg) => [
      arg.isCompact && realSmallText,
      borderClassName,
      arg.isDisabled && neutralBgClassNames,
    ],
    dayHeaderInnerClassNames: 'px-1 py-0.5',
    dayHeaderDividerClassNames: ['border-t', borderColorClassNames],

    // for resource views only
    resourceDayHeaderClassNames: (arg) => [
      arg.isCompact && realSmallText,
      borderClassName,
    ],
    resourceDayHeaderInnerClassNames: 'px-1 py-0.5', // TODO: make this a constant... standard inner padding!

    // Day-Cells (DayGrid & MultiMonth & TimeGrid "all-day" section)
    // ---------------------------------------------------------------------------------------------

    dayRowClassNames: borderClassName,
    dayCellClassNames: (arg) => [
      arg.isToday && todayBgClassNames,
      borderClassName,
      arg.isDisabled && neutralBgClassNames,
    ],

    dayCellTopClassNames: (arg) => [
      arg.isCompact && realSmallText,
      'min-h-[2px]', // effectively 2px top padding
      'flex flex-row-reverse relative', // relative for z-index above bg events
      arg.isOther && 'opacity-30',
    ],
    dayCellTopInnerClassNames: (arg) => [
      'p-1',
      arg.isMonthStart && 'text-base font-bold',
    ],

    // MultiMonth
    // ---------------------------------------------------------------------------------------------
    /*
    Also leverages viewClassNames and viewHeaderClassNames
    */
    singleMonthClassNames: (arg) => [
      (arg.colCount || 0) > 1 && 'm-4', /* text-xs */
    ],
    singleMonthTitleClassNames: (arg) => [
      'text-center font-bold',
      arg.isCompact ? 'text-base' : 'text-lg',
      arg.isSticky
        ? 'py-2' // singlecol
        : 'pb-4', // multicol
      arg.isSticky && `border-b ${borderColorClassNames} bg-(--fc-canvas-color)`,
    ],

    // TimeGrid
    // ---------------------------------------------------------------------------------------------

    // whitespace-pre respects newlines in long text like "Toute la journée", meant to break
    // padding creates inner-height
    allDayDividerClassNames: `${neutralBgClassNames} pb-0.5 border-t border-b ${borderColorClassNames}`,

    dayLaneClassNames: (arg) => [
      borderClassName,
      arg.isDisabled && neutralBgClassNames,
      arg.isToday && todayBgClassNames,
    ],
    dayLaneInnerClassNames: (arg) => [
      arg.isSimple ? 'm-1' : 'ms-0.5 me-[2.5%]'
    ],

    // Slots (TimeGrid & Timeline)
    // ---------------------------------------------------------------------------------------------

    slotLabelClassNames: getSlotClassNames,
    slotLaneClassNames: getSlotClassNames,

    // only for (resource-)timeline
    slotLabelRowClassNames: borderClassName,

    // Resource Timeline
    // ---------------------------------------------------------------------------------------------

    resourceAreaHeaderRowClassNames: borderClassName,
    resourceAreaHeaderClassNames: [borderClassName, /* valign = */ 'justify-center'],
    resourceAreaHeaderInnerClassNames: 'p-2',
    resourceAreaDividerClassNames: `pl-0.5 ${neutralBgClassNames} border-x ${borderColorClassNames}`,

    resourceAreaRowClassNames: borderClassName,
    resourceIndentClassNames: 'me-1 relative -top-px',
    resourceExpanderClassNames: 'opacity-65',
    resourceExpanderContent: (arg) => arg.isExpanded
      ? svgIcons.minusSquare('w-[1em] h-[1em]')
      : svgIcons.plusSquare('w-[1em] h-[1em]'),

    resourceGroupHeaderClassNames: neutralBgClassNames,
    resourceGroupHeaderInnerClassNames: 'p-2',
    resourceGroupLaneClassNames: [borderClassName, neutralBgClassNames],

    resourceCellClassNames: borderClassName,
    resourceCellInnerClassNames: 'p-2',
    resourceLaneClassNames: borderClassName,
    resourceLaneBottomClassNames: (arg) => [
      !arg.isCompact && 'pb-3'
    ],

    // Timeline WITHOUT resources
    // ---------------------------------------------------------------------------------------------

    timelineBottomClassNames: 'pb-3',

    // List View
    // ---------------------------------------------------------------------------------------------

    listDayClassNames: `not-last:border-b ${borderColorClassNames}`,
    listDayHeaderClassNames: (arg) => [
      `border-b ${borderColorClassNames} flex flex-row justify-between font-bold relative`,
      arg.isSticky && 'bg-(--fc-canvas-color)',
      // TODO: explain why
    ],
    listDayHeaderBeforeClassNames: `${neutralBgClassNames} absolute inset-0`,
    listDayHeaderInnerClassNames: `${listViewItemClassName} relative`,
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
      dayCellBottomClassNames: 'min-h-[1px]', // put elsewhere?
      ...dayGridWeekNumberOverrides,
    },
    multiMonth: {
      ...dayGridOverrides,
      // effectively 2px bottom padding because events have 1px margin-bottom
      dayCellBottomClassNames: 'min-h-[1px]', // put elsewhere?
      ...dayGridWeekNumberOverrides,
    },
    timeGrid: {
      ...dayGridOverrides,
      dayRowClassNames: 'min-h-[3em]',
      dayCellBottomClassNames: 'min-h-[1em]', // for all-day section
      allDayHeaderClassNames: (arg) => [
        arg.isCompact && realSmallText,
        axisClassName,
        /* vertical-align = */ 'items-center',
      ],
      allDayHeaderInnerClassNames: [axisInnerClassName, 'whitespace-pre px-1 py-0.5'],
      weekNumberClassNames: (arg) => [
        arg.isCompact && realSmallText,
        axisClassName,
      ],
      weekNumberInnerClassNames: [axisInnerClassName, 'px-1 py-0.5'],
      columnMoreLinkClassNames: `mb-px rounded-xs text-xs outline outline-(--fc-canvas-color) bg-gray-300 dark:bg-gray-600`,
      columnMoreLinkInnerClassNames: 'px-0.5 py-1',
      slotLabelClassNames: (arg) => [
        arg.isCompact && realSmallText,
        axisClassName,
        /* tick-marks = 'w-2 self-end' */
      ],
      slotLabelInnerClassNames: [axisInnerClassName, 'px-1 py-0.5'],
      slotLabelDividerClassNames: `border-l ${borderColorClassNames}`,
      nowIndicatorLabelClassNames: 'start-0 -mt-[5px] border-y-[5px] border-y-transparent border-s-[6px] border-s-red-500',
      nowIndicatorLineClassNames: 'border-t border-red-500', // put color on master setting?
    },
    timeline: {
      rowEventClassNames: 'me-px items-center', // for aligning continuation arrows
      rowEventBeforeClassNames: (arg) => !arg.isStartResizable && [
        // continuation arrow
        'relative z-10 mx-px border-y-[5px] border-y-transparent border-e-[5px] border-e-black opacity-50',
      ],
      rowEventAfterClassNames: (arg) => !arg.isEndResizable && [
        // continuation arrow
        'relative z-10 mx-px border-y-[5px] border-y-transparent border-s-[5px] border-s-black opacity-50',
      ],
      rowEventInnerClassNames: (arg) => [
        'px-px',
        arg.isSpacious ? 'py-1' : 'py-px',
      ],
      rowMoreLinkClassNames: `flex flex-col items-start text-xs bg-gray-300 dark:bg-gray-600 p-px me-px`, // TODO: dry bg color?
      rowMoreLinkInnerClassNames: 'p-0.5',
      slotLabelClassNames: [
        /* tick-marks = 'h-2 self-end justify-end', */
        'justify-center'
      ],
      slotLabelInnerClassNames: 'p-1',
      slotLabelDividerClassNames: `border-b ${borderColorClassNames}`,
      nowIndicatorLabelClassNames: 'top-0 -mx-[5px] border-x-[5px] border-x-transparent border-t-[6px] border-t-red-500',
      nowIndicatorLineClassNames: 'border-l border-red-500', // put color on master setting?
    },
    list: {
      listItemEventClassNames: [
        listViewItemClassName,
        `not-last:border-b ${borderColorClassNames} hover:bg-gray-500/20`,
        'flex flex-row items-center gap-3',
        'group',
      ],
      listItemEventColorClassNames: 'border-[5px]', // 5px radius = 10px width (border shows up in print!)
      listItemEventInnerClassNames: '[display:contents]',
      listItemEventTimeClassNames: 'order-[-1] w-[165px]',
      listItemEventTitleClassNames: (arg) => [
        arg.event.url && 'group-hover:underline',
      ],
      noEventsClassNames: `flex flex-grow justify-center items-center ${neutralBgClassNames} py-15`,
    },
  },
}) as PluginDef

/*
Event continuation arrows experiment.
Looks great in Firefox. Clip-path is fuzzy in Chrome. TODO: use SVG?
Need to refactor inner-padding in event element, b/c the before/after need entire height

  rowEventClassNames: 'mb-px',
  rowEventBeforeClassNames: (arg) => arg.isStartResizable ? [
    arg.isSelected ? rowTouchResizerClassName : rowPointerResizerClassName,
    '-start-1',
  ] : [
    // continuation arrow
    !arg.isStart && 'w-[6px] bg-(--fc-event-color) [clip-path:polygon(100%_0,0_50%,100%_100%)]',
  ],
  rowEventAfterClassNames: (arg) => arg.isEndResizable ? [
    arg.isSelected ? rowTouchResizerClassName : rowPointerResizerClassName,
    '-end-1',
  ] : [
    // continuation arrow
    !arg.isEnd && 'w-[6px] bg-(--fc-event-color) [clip-path:polygon(0_0,100%_50%,0_100%)]',
  ],
  rowEventColorClassNames: (arg) => [
    !arg.isStart && 'ms-[6px]',
    !arg.isEnd && 'me-[6px]',
  ],
*/
