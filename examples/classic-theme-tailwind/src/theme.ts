import { CalendarOptions, createPlugin, EventContentArg, PluginDef, EventApi } from '@fullcalendar/core'
import * as svgIcons from './svgIcons.js'
import './theme.css'

// Will import ambient types during dev but strip out for build
import {} from '@fullcalendar/timegrid'
import {} from '@fullcalendar/timeline'
import {} from '@fullcalendar/list'
import {} from '@fullcalendar/multimonth'
import {} from '@fullcalendar/resource-daygrid'
import {} from '@fullcalendar/resource-timeline'

/*
TODO: search all "blue"
TODO: convert 2px to 0.5tw
*/

const dayGridCommon: CalendarOptions = {
  eventClassNames: (arg) => (
    arg.event.display === 'background'
      ? getBackgroundEventClassNames(arg)
      : arg.isListItem
        ? [
          // daygrid-specific list-event
          'me-[2px] p-px rounded-sm items-center',
          arg.isSelected
            ? 'bg-black/30'
            : 'hover:bg-black/10 focus:bg-black/20',
        ]
        : [
          ...getRowEventClassNames(arg),
          // daygrid-specific row-event
          arg.isStart && 'ms-[2px]',
          arg.isEnd && 'me-[2px]',
        ]
  ),
  eventBeforeClassNames: (arg) => (
    arg.event.display === 'background'
      ? []
      : arg.isListItem
        ? []
        : arg.isStartResizable ? getRowEventStartResizerClassNames(arg) : []
  ),
  eventAfterClassNames: (arg) => (
    arg.event.display === 'background'
      ? []
      : arg.isListItem
        ? []
        : arg.isEndResizable ? getRowEventEndResizerClassNames(arg) : []
  ),
  eventColorClassNames: (arg) => (
    arg.event.display === 'background'
      ? []
      : arg.isListItem
        ? [
          ...getListItemEventColorClassNames(),
          // daygrid-specific list-event
          'w-[8px] h-[8px] mx-1',
        ]
        : [
          ...getRowEventColorClassNames(arg),
          // daygrid-specific block event
          arg.isStart && 'rounded-s-sm',
          arg.isEnd && 'rounded-e-sm',
        ]
  ),
  eventInnerClassNames: (arg) => (
    arg.event.display === 'background'
      ? []
      : arg.isListItem
        ? [
          // daygrid-specific list-event
          'flex flex-row items-center text-xs',
        ]
        : getRowEventInnerClassNames(arg)
  ),
  eventTimeClassNames: (arg) => (
    arg.event.display === 'background'
      ? []
      : arg.isListItem
        ? [
          // daygrid-specific list-event
          'p-px',
        ]
        : getRowEventTimeClassNames()
  ),
  eventTitleClassNames: (arg) => (
    arg.event.display === 'background'
      ? getBackgroundEventTitleClassNames(arg)
      : arg.isListItem
        ? [
          // daygrid-specific list-event
          'p-px font-bold',
        ]
        : getRowEventTitleClassNames()
  ),

  weekNumberClassNames: [
    'absolute z-20 top-0 rounded-ee-sm p-0.5 min-w-[1.5em] text-center bg-gray-100 text-gray-500',
  ],
  moreLinkClassNames: (arg) => [
    'cursor-pointer text-xs p-0.5 rounded-xs mx-0.5 mb-px',
    // TODO: somehow make this core? will go away with measurement refactor?
    'relative max-w-full overflow-hidden whitespace-nowrap',
    'hover:bg-black/10',
    arg.isCompact
      ? 'border border-blue-600 p-px'
      : 'self-start',
  ],
}

const buttonIconClassName = 'text-[1.5em] w-[1em] h-[1em]'

const cellClassName = 'border border-gray-300'

// a column that aligns right (aka end) and vertically centered
const axisClassNames = 'flex flex-col justify-center items-end'

// align text right (aka end) for when multiline
const axisInnerClassNames = [
  'text-end min-h-[1.5em]',
  'flex flex-col justify-center', // vertically align text if min-height takes effect
]

const listInnerCommon = 'px-3 py-2'

export default createPlugin({
  name: '<%= pkgName %>',
  optionDefaults: {
    classNames: 'gap-5 [--fc-event-color:green]',
    directionClassNames: (direction) => `fc-direction-${direction}`,
    mediaTypeClassNames: (mediaType) => `fc-media-${mediaType}`,
    toolbarClassNames: 'gap-3',
    toolbarSectionClassNames: 'gap-3',
    toolbarTitleClassNames: 'text-2xl font-bold whitespace-nowrap',
    viewClassNames: (arg) => [
      'fc-view',
      `fc-${arg.view.type}-view`,
      cellClassName,
    ],
    viewHeaderClassNames: (arg) => [
      arg.isSticky && 'bg-white'
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
      'inline-flex items-center px-4 py-2 border text-sm text-white cursor-pointer',
      arg.inGroup
        ? 'first:rounded-s-sm last:rounded-e-sm relative' // in button-group
        : 'rounded-sm', // alone
      arg.isSelected
        ? 'border-slate-900 bg-slate-800 z-10' // selected
        : 'border-transparent bg-slate-700', // not-selected
      arg.isDisabled
        ? 'opacity-65 pointer-events-none' // disabled
        : '',
      'active:border-slate-900 active:bg-slate-800 active:z-20', // active (similar to selected)
      'hover:border-slate-900 hover:bg-slate-800', // hover
      'focus:outline-3 outline-slate-600/50 focus:z-10', // focus
      /*
      what about print!?
      */
    ],

    popoverClassNames: `bg-white shadow-md ${cellClassName}`, // see also: dayPopoverClassNames
    popoverHeaderClassNames: 'flex flex-row justify-between items-center bg-gray-100 px-1 py-1',
    popoverTitleClassNames: 'px-1',
    popoverCloseClassNames: 'cursor-pointer', // TODO: have core do all cursors!!??
    popoverCloseContent: () => svgIcons.x('w-[1.357em] h-[1.357em] opacity-65'),
    popoverBodyClassNames: 'p-2 min-w-[220px]',

    // Cross-view
    // ---------------------------------------------------------------------------------------------

    weekNumberClassNames: 'fc-week-number',
    navLinkClassNames: 'cursor-pointer hover:underline',
    moreLinkClassNames: 'fc-more-link',

    dayCompactWidth: 70,

    fillerClassNames: 'opacity-50 border-gray-300',
    fillerXClassNames: 'border-s',
    fillerYClassNames: 'border-t',

    nonBusinessClassNames: 'bg-gray-100', // TODO: fix bug: covers the borders!!! add fake border? move UNDER?
    highlightClassNames: 'bg-cyan-100/30',

    // General Event
    // ---------------------------------------------------------------------------------------------

    eventClassNames: (arg) => [
      // a reset. put elsewhere?
      arg.event.url && 'no-underline hover:no-underline',
    ],

    // Day-Headers (DayGrid & MultiMonth & TimeGrid)
    // ---------------------------------------------------------------------------------------------

    dayHeaderRowClassNames: cellClassName,
    dayHeaderClassNames: (arg) => [
      cellClassName,
      arg.isDisabled && 'bg-gray-100',
    ],
    dayHeaderInnerClassNames: 'px-1 py-0.5',
    dayHeaderDividerClassNames: 'border-t border-gray-300',

    // for resource views only
    resourceDayHeaderClassNames: cellClassName,
    resourceDayHeaderInnerClassNames: 'px-1 py-0.5',

    // Day-Cells (DayGrid & MultiMonth & TimeGrid "all-day" section)
    // ---------------------------------------------------------------------------------------------

    dayRowClassNames: cellClassName,
    dayCellClassNames: (arg) => [
      arg.isToday && 'bg-yellow-400/15',
      cellClassName,
      arg.isDisabled && 'bg-gray-100',
    ],

    dayCellTopClassNames: (arg) => [
      'flex flex-row-reverse relative', // relative for z-index above bg events
      arg.isOther && 'opacity-30',
    ],
    dayCellTopInnerClassNames: (arg) => [
      'p-1',
      arg.isMonthStart && 'text-base font-bold',
    ],

    // MultiMonth
    // ---------------------------------------------------------------------------------------------

    singleMonthClassNames: (arg) => [
      (arg.colCnt || 0) > 1 && 'm-4',
    ],
    singleMonthTitleClassNames: (arg) => [
      'text-center font-bold text-lg',
      (arg.colCnt || 0) > 1
        ? 'pb-4' // multicol
        : 'py-2', // singlecol
      arg.sticky && 'border-b border-gray-300 bg-white',
    ],
    singleMonthTableClassNames: (arg) => [
      'border-gray-300',
      (arg.colCnt || 0) > 1 && 'border-x text-xs',
      ((arg.colCnt || 0) > 1 || !arg.isLast) && 'border-b',
      !arg.stickyTitle && 'border-t',
    ],
    singleMonthTableHeaderClassNames: (arg) => [
      arg.sticky && 'bg-white',
    ],

    // TimeGrid
    // ---------------------------------------------------------------------------------------------

    // whitespace-pre respects newlines in long text like "Toute la journée", meant to break
    allDayDividerClassNames: 'bg-gray-100 pb-0.5 border-t border-b border-gray-300', // padding creates inner-height

    dayLaneClassNames: (arg) => [
      cellClassName,
      arg.isDisabled && 'bg-gray-100',
      arg.isToday && 'bg-yellow-400/15',
    ],
    dayLaneInnerClassNames: (arg) => [
      arg.isSimple
        ? 'm-1'
        : 'ms-0.5 me-[2.5%]'
    ],

    // Slots (TimeGrid & Timeline)
    // ---------------------------------------------------------------------------------------------

    slotLabelClassNames: getSlotClassNames,
    slotLaneClassNames: getSlotClassNames,

    // only for (resource-)timeline
    slotLabelRowClassNames: cellClassName,

    // Resource Timeline
    // ---------------------------------------------------------------------------------------------

    resourceAreaHeaderRowClassNames: cellClassName,
    resourceAreaHeaderClassNames: cellClassName,
    resourceAreaHeaderInnerClassNames: 'p-2',
    resourceAreaDividerClassNames: 'pl-0.5 bg-gray-100 border-x border-gray-300',

    resourceAreaRowClassNames: cellClassName,
    resourceIndentClassNames: 'me-1',
    resourceExpanderClassNames: 'cursor-pointer opacity-65',
    resourceExpanderContent: (arg) => arg.isExpanded
      ? svgIcons.minusSquare('w-[1em] h-[1em]')
      : svgIcons.plusSquare('w-[1em] h-[1em]'),

    resourceGroupHeaderClassNames: 'bg-gray-100',
    resourceGroupHeaderInnerClassNames: 'p-2',
    resourceGroupLaneClassNames: `bg-gray-100 ${cellClassName}`,

    resourceCellClassNames: cellClassName,
    resourceCellInnerClassNames: 'p-2',
    resourceLaneClassNames: cellClassName,
    resourceLaneBottomClassNames: (arg) => [
      !arg.isCompact && 'pb-3'
    ],

    // Timeline WITHOUT resources
    // ---------------------------------------------------------------------------------------------

    timelineBottomClassNames: 'pb-3',

    // List View
    // ---------------------------------------------------------------------------------------------

    listDayClassNames: 'not-last:border-b border-gray-300',
    listDayHeaderClassNames: 'border-b border-gray-300 flex flex-row justify-between font-bold bg-gray-100',
    listDayHeaderInnerClassNames: listInnerCommon,
  },
  views: {
    dayGrid: {
      ...dayGridCommon,
    },
    multiMonth: {
      ...dayGridCommon,
    },
    timeGrid: {
      eventClassNames: (arg) => (
        arg.event.display === 'background'
          ? getBackgroundEventClassNames(arg)
          : arg.event.allDay
            ? getRowEventClassNames(arg)
            : getColEventClassNames(arg)
      ),
      eventBeforeClassNames: (arg) => (
        arg.event.display === 'background'
          ? []
          : arg.event.allDay
            ? arg.isStartResizable ? getRowEventStartResizerClassNames(arg) : []
            : arg.isStartResizable ? getColEventStartResizerClassNames(arg) : []
      ),
      eventAfterClassNames: (arg) => (
        arg.event.display === 'background'
          ? []
          : arg.event.allDay
            ? arg.isEndResizable ? getRowEventEndResizerClassNames(arg) : []
            : arg.isEndResizable ? getColEventEndResizerClassNames(arg) : []
      ),
      eventColorClassNames: (arg) => (
        arg.event.display === 'background'
          ? []
          : arg.event.allDay
            ? getRowEventColorClassNames(arg)
            : [
              ...getColEventColorClassNames(arg),
              arg.level && 'outline outline-white',
            ]
      ),
      eventInnerClassNames: (arg) => (
        arg.event.display === 'background'
          ? []
          : arg.event.allDay
            ? getRowEventInnerClassNames(arg)
            : getColEventInnerClassNames(arg)
      ),
      eventTimeClassNames: (arg) => (
        arg.event.display === 'background'
          ? []
          : arg.event.allDay
            ? getRowEventTimeClassNames()
            : getColEventTimeClassNames()
      ),
      eventTitleClassNames: (arg) => (
        arg.event.display === 'background'
          ? []
          : arg.event.allDay
            ? getRowEventTitleClassNames()
            : getColEventTitleClassNames(arg)
      ),

      allDayHeaderClassNames: axisClassNames,
      allDayHeaderInnerClassNames: `${axisInnerClassNames} whitespace-pre px-1 py-0.5`, // TODO: keep here our move to general section?
      weekNumberClassNames: axisClassNames,
      weekNumberInnerClassNames: `${axisInnerClassNames} px-1 py-0.5`,
      moreLinkClassNames: 'mb-px rounded-xs text-xs ring ring-white bg-gray-300 cursor-pointer',
      moreLinkInnerClassNames: 'px-0.5 py-1',
      slotLabelClassNames: axisClassNames,
      slotLabelInnerClassNames: `${axisInnerClassNames} px-1 py-0.5`,
      slotLabelDividerClassNames: 'border-l border-gray-300',
      nowIndicatorLabelClassNames: 'start-0 -mt-[5px] border-y-[5px] border-y-transparent border-s-[6px] border-s-red-500',
      nowIndicatorLineClassNames: 'border-t border-red-500', // put color on master setting?
    },
    timeline: {
      eventClassNames: (arg) => (
        arg.event.display === 'background' ? [
          ...getBackgroundEventClassNames(arg),
        ] : [
          ...getRowEventClassNames(arg),
          // timeline-specific
          'items-center', // for aligning little arrows
          'me-px',
        ]
      ),
      eventBeforeClassNames: (arg) => (
        arg.event.display === 'background'
          ? []
          : arg.isStartResizable
            ? getRowEventStartResizerClassNames(arg)
            : [
              // timeline-specific
              'relative z-10 mx-px',
              'border-y-[5px] border-y-transparent border-e-[5px] border-e-black opacity-50',
            ]
      ),
      eventAfterClassNames: (arg) => (
        arg.event.display === 'background'
          ? []
          : arg.isEndResizable
            ? getRowEventEndResizerClassNames(arg)
            : [
              // timeline-specific
              'relative z-10 mx-px',
              'border-y-[5px] border-y-transparent border-s-[5px] border-s-black opacity-50',
            ]
      ),
      eventColorClassNames: (arg) => (
        arg.event.display === 'background'
          ? []
          : getRowEventColorClassNames(arg)
      ),
      eventInnerClassNames: (arg) => (
        arg.event.display === 'background'
          ? []
          : [
            ...getRowEventInnerClassNames(arg),
            // timeline-specific
            'px-px',
            arg.isSpacious
              ? 'py-1'
              : 'py-px',
          ]
      ),
      eventTimeClassNames: (arg) => (
        arg.event.display === 'background'
          ? []
          : getRowEventTimeClassNames()
      ),
      eventTitleClassNames: (arg) => (
        arg.event.display === 'background'
          ? getBackgroundEventTitleClassNames(arg)
          : getRowEventTitleClassNames()
      ),

      moreLinkClassNames: 'flex flex-col items-start text-xs bg-gray-300 p-px cursor-pointer me-px',
      moreLinkInnerClassNames: 'p-0.5',
      slotLabelInnerClassNames: 'p-1',
      slotLabelDividerClassNames: 'border-b border-gray-300',
      nowIndicatorLabelClassNames: 'top-0 -mx-[5px] border-x-[5px] border-x-transparent border-t-[6px] border-t-red-500',
      nowIndicatorLineClassNames: 'border-l border-red-500', // put color on master setting?
    },
    list: {
      eventClassNames: [
        listInnerCommon,
        'not-last:border-b border-gray-300 hover:bg-gray-50',
        'flex flex-row items-center gap-3',
        'group',
      ],
      eventColorClassNames: [
        ...getListItemEventColorClassNames(),
        'w-[10px] h-[10px]'
      ],
      eventInnerClassNames: '[display:contents]',
      eventTimeClassNames: 'order-[-1] w-[165px]',
      eventTitleClassNames: (arg) => [
        arg.event.url && 'group-hover:underline',
      ],

      // TODO: put these settings in root config?
      // TODO: rename to listEmptyClassNames/listEmptyInnerClassNames?
      // ALSO: why do we need an "inner" ???
      noEventsClassNames: 'flex flex-grow justify-center items-center bg-gray-100 py-15',
    },
  },
}) as PluginDef

// Utils
// -------------------------------------------------------------------------------------------------

function getSlotClassNames(arg: any) {
  return [
    cellClassName,
    arg.isMinor && 'border-dotted',
  ]
  /*
  NOTE: give conditional styles based on arg.isToday, etc...
  */
}

// Background Event
// -------------------------------------------------------------------------------------------------

function getBackgroundEventClassNames(_afterprintarg: EventContentArg): string[] {
  return [
    'bg-green-300 opacity-30'
  ]
}

function getBackgroundEventTitleClassNames(arg: { event: EventApi, isCompact: boolean }): (string | false)[] {
  return [
    arg.event.display === 'background' && 'm-2 text-xs italic'
  ]
}

// List-Item Event
// -------------------------------------------------------------------------------------------------

function getListItemEventColorClassNames(): string[] {
  return [
    'rounded-full bg-(--fc-event-color)'
  ]
}

// Block Event
// -------------------------------------------------------------------------------------------------

function getBlockEventClassNames(arg: EventContentArg): (string | false)[] {
  return [
    'relative', // for absolutes below
    'group', // for focus and hover below
    'p-px',
    (arg.isDragging && !arg.isSelected) && 'opacity-75',
    arg.isSelected
      ? (arg.isDragging ? 'shadow-lg' : 'shadow-md')
      : 'focus:shadow-md',
  ]
}

function getBlockEventResizerClassNames(arg: EventContentArg): string[] {
  return [
    'absolute z-20',
    arg.isSelected
      // circle resizer for touch
      ? 'h-2 w-2 rounded border border-solid border-blue-500 bg-white'
      // transparent resizer for mouse
      : 'hidden group-hover:block bg-red-500'
  ]
}

function getBlockEventColorClassNames(arg: EventContentArg): string[] {
  return [
    'absolute z-0 inset-0 bg-(--fc-event-color)',
    arg.isSelected
      ? 'brightness-75'
      : 'group-focus:brightness-75',
  ]
}

function getBlockEventInnerClassNames(_arg: EventContentArg): string[] {
  return [
    'relative z-10 text-white',
    'flex gap-[3px]', // subclasses will decide direction
  ]
}

function getBlockEventTimeClassNames(): string[] {
  return [
    'whitespace-nowrap overflow-hidden flex-shrink-0 max-w-full max-h-full',
  ]
}

function getBlockEventTitleClassNames(): string[] {
  return [
    'whitespace-nowrap overflow-hidden flex-shrink sticky top-0 start-0',
  ]
}

// Row Event
// -------------------------------------------------------------------------------------------------

function getRowEventClassNames(arg: EventContentArg): (string | false)[] {
  return [
    ...getBlockEventClassNames(arg),
    'mb-px' // okay to have on all row events, but lateral spacing is view-specific
  ]
}

function getRowEventStartResizerClassNames(arg: EventContentArg): (string | false)[] {
  return [
    ...getRowEventResizerClassNames(arg),
    '-start-1',
  ]
}

function getRowEventEndResizerClassNames(arg: EventContentArg): (string | false)[] {
  return [
    ...getRowEventResizerClassNames(arg),
    '-end-1',
  ]
}

function getRowEventResizerClassNames(arg: EventContentArg): (string | false)[] {
  return [
    ...getBlockEventResizerClassNames(arg),
    arg.isSelected
      // POSITION: circle resizer for touch
      ? 'top-1/2 -mt-1'
      // POSITION: transparent resizer for mouse
      : 'inset-y-0 w-2'
  ]
}

function getRowEventColorClassNames(arg: EventContentArg): (string | false)[] {
  return [
    ...getBlockEventColorClassNames(arg),
    // nothing. would normally be responsible for rounded corners on left/right,
    // but unfortunately our daygrid/timeline events look very different
  ]
}

function getRowEventInnerClassNames(arg: EventContentArg): string[] {
  return [
    ...getBlockEventInnerClassNames(arg),
    'flex-row items-center text-xs',
  ]
}

function getRowEventTimeClassNames(): string[] {
  return [
    ...getBlockEventTimeClassNames(),
    'p-px font-bold',
  ]
}

function getRowEventTitleClassNames(): string[] {
  return [
    ...getBlockEventTitleClassNames(),
    'p-px',
  ]
}

// Col Event
// -------------------------------------------------------------------------------------------------

function getColEventClassNames(arg: EventContentArg): (string | false)[] {
  return [
    ...getBlockEventClassNames(arg),
    'mb-px',
  ]
}

function getColEventColorClassNames(arg: EventContentArg): (string | false)[] {
  return [
    ...getBlockEventColorClassNames(arg),
    arg.isStart && 'rounded-t-sm',
    arg.isEnd && 'rounded-b-sm',
  ]
}

function getColEventStartResizerClassNames(arg: EventContentArg): (string | false)[] {
  return [
    ...getColEventResizerClassNames(arg),
    '-top-1',
  ]
}

function getColEventEndResizerClassNames(arg: EventContentArg): (string | false)[] {
  return [
    ...getColEventResizerClassNames(arg),
    '-bottom-1',
  ]
}

function getColEventResizerClassNames(arg: EventContentArg): (string | false)[] {
  return [
    ...getBlockEventResizerClassNames(arg),
    arg.isSelected
      // POSITION: circle resizer for touch
      ? 'left-1/2 -ml-1'
      // POSITION: transparent resizer for mouse
      : 'inset-x-0 h-2'
  ]
}

function getColEventInnerClassNames(arg: EventContentArg): string[] {
  return [
    ...getBlockEventInnerClassNames(arg),
    'p-px text-xs',
    arg.isCompact
      ? 'flex-row gap-1 overflow-hidden' // one line
      : 'flex-col gap-px', // two lines
  ]
}

function getColEventTimeClassNames(): string[] {
  return [
    ...getBlockEventTimeClassNames(),
    'text-[0.9em]',
  ]
}

function getColEventTitleClassNames(arg: { isCompact: boolean }): (string | false)[] {
  return [
    ...getBlockEventTitleClassNames(),
    arg.isCompact && 'text-[0.9em]',
  ]
}
