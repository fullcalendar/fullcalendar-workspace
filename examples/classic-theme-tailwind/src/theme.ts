import { createPlugin, EventContentArg, PluginDef } from '@fullcalendar/core'
import * as svgIcons from './svgIcons.js'
import './theme.css'

// Will import ambient types during dev but strip out for build
import {} from '@fullcalendar/timegrid'
import {} from '@fullcalendar/timeline'
import {} from '@fullcalendar/list'
import {} from '@fullcalendar/multimonth'
import {} from '@fullcalendar/resource-daygrid'
import {} from '@fullcalendar/resource-timeline'

const dayGridCommon = { // TODO: add type to avoid `any`
  eventClassNames: getDayGridEventClassNames,
  eventColorClassNames: getDayGridEventColorClassNames,
  weekNumberClassNames: [
    'absolute z-10 top-0 rounded-ee-sm p-0.5 min-w-[1.5em] text-center bg-gray-100 text-gray-500',
  ],
  moreLinkClassNames: (arg: any) => [
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

const listItemInnerCommon = 'px-3 py-2'

export default createPlugin({
  name: '<%= pkgName %>',
  optionDefaults: {
    classNames: 'gap-5',
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
    dayPopoverClassNames: getDayClassNames, // needed?

    fillerClassNames: 'opacity-50 border-gray-300',
    fillerXClassNames: 'border-s',
    fillerYClassNames: 'border-t',

    nonBusinessClassNames: 'bg-gray-100', // TODO: fix bug: covers the borders!!! add fake border? move UNDER?
    highlightClassNames: 'bg-cyan-100/30',

    // General Event
    // ---------------------------------------------------------------------------------------------

    eventClassNames: (arg) => [
      arg.event.display === 'background' && 'bg-green-300 opacity-30',
      'fc-event',
      arg.isMirror && 'fc-event-mirror',
      arg.isDraggable && 'fc-event-draggable',
      (arg.isStartResizable || arg.isEndResizable) && 'fc-event-resizable',
      arg.isDragging && 'fc-event-dragging',
      arg.isResizing && 'fc-event-resizing',
      arg.isSelected && 'fc-event-selected',
      arg.isStart && 'fc-event-start',
      arg.isEnd && 'fc-event-end',
      arg.isPast && 'fc-event-past',
      arg.isFuture && 'fc-event-future',
      arg.isToday && 'fc-event-today',
    ],
    eventInnerClassNames: 'fc-event-inner', // TODO: put font-size on here?
    eventTimeClassNames: 'fc-event-time',
    eventTitleClassNames: (arg) => [
      arg.event.display === 'background' && 'm-2 text-xs italic',
      'fc-event-title',
    ],
    eventResizerClassNames: 'fc-event-resizer',
    eventResizerStartClassNames: 'fc-event-resizer-start',
    eventResizerEndClassNames: 'fc-event-resizer-end',

    // Day-Headers (DayGrid & MultiMonth & TimeGrid)
    // ---------------------------------------------------------------------------------------------

    dayHeaderRowClassNames: cellClassName,
    dayHeaderClassNames: (arg) => [
      cellClassName,
      arg.isDisabled && 'bg-gray-100',
      ...getDayClassNames(arg)
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
      ...getDayClassNames(arg),
      arg.isCompact ? 'fc-day-cell-compact' : 'fc-day-cell-not-compact',
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

    allDayHeaderClassNames: 'fc-all-day-header',
    // whitespace-pre respects newlines in long text like "Toute la journée", meant to break
    allDayDividerClassNames: 'bg-gray-100 pb-0.5 border-t border-b border-gray-300', // padding creates inner-height

    dayLaneClassNames: (arg) => [
      'fc-day-lane',
      cellClassName,
      arg.isDisabled && 'bg-gray-100',
      arg.isToday && 'bg-yellow-400/15',
      ...getDayClassNames(arg),
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
    resourceIndentClassNames: 'fc-resource-indent me-1',
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
    listDayHeaderInnerClassNames: listItemInnerCommon,
  },
  views: {
    dayGrid: {
      viewClassNames: 'fc-daygrid',
      ...dayGridCommon,
    },
    multiMonth: {
      viewClassNames: 'fc-multimonth',
      ...dayGridCommon,
    },
    timeGrid: {
      viewClassNames: 'fc-timegrid',
      eventClassNames: (arg) => [
        arg.event.allDay ? getDayGridEventClassNames(arg) :
          arg.event.display === 'background' ? '' :
            'fc-timegrid-event fc-event-y',
        arg.isCompact && 'fc-timegrid-event-compact',
        arg.level && 'fc-timegrid-event-inset',
      ],
      eventColorClassNames: (arg) => (
        arg.event.allDay ? getDayGridEventColorClassNames(arg) : ''
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
      nowIndicatorLabelClassNames: 'fc-timegrid-now-indicator-label',
      nowIndicatorLineClassNames: 'border-t border-red-500', // put color on master setting?
    },
    timeline: {
      viewClassNames: 'fc-timeline',
      eventClassNames: (arg) => [
        'fc-timeline-event fc-event-x',
        arg.isSpacious && 'fc-timeline-event-spacious',
      ],
      moreLinkClassNames: 'flex flex-col items-start text-xs bg-gray-300 p-px cursor-pointer me-px',
      moreLinkInnerClassNames: 'p-0.5',
      slotLabelInnerClassNames: 'p-1',
      slotLabelDividerClassNames: 'border-b border-gray-300',
      nowIndicatorLabelClassNames: 'fc-timeline-now-indicator-label',
      nowIndicatorLineClassNames: 'border-l border-red-500', // put color on master setting?
    },
    list: {
      viewClassNames: 'fc-list',
      eventClassNames: `fc-list-event not-last:border-b border-gray-300 ${listItemInnerCommon}`,
      eventColorClassNames: 'fc-list-event-dot',

      // TODO: put these settings in root config?
      // TODO: rename to listEmptyClassNames/listEmptyInnerClassNames?
      // ALSO: why do we need an "inner" ???
      noEventsClassNames: 'flex flex-grow justify-center items-center bg-gray-100 py-15',
    },
    resourceDayGrid: { // inherits dayGrid
      viewClassNames: 'fc-resource-daygrid',
    },
    resourceTimeGrid: { // inherits timeGrid
      viewClassNames: 'fc-resource-timegrid',
    },
    resourceTimeline: { // inherits timeline
      viewClassNames: 'fc-resource-timeline',
    },
  },
}) as PluginDef

// Utils
// -------------------------------------------------------------------------------------------------

function getDayGridEventClassNames(arg: EventContentArg) {
  return arg.event.display === 'background' ? '' :
    arg.isListItem ? 'fc-daygrid-dot-event fc-daygrid-event fc-event-x' :
    'fc-daygrid-block-event fc-daygrid-event fc-event-x'
}

function getDayGridEventColorClassNames(arg: EventContentArg) {
  return arg.isListItem && 'fc-daygrid-event-dot'
}

const DAY_IDS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function getDayClassNames(arg: any) {
  return arg.isDisabled
    ? [
      'fc-day',
    ]
    : [
      'fc-day',
      `fc-day-${DAY_IDS[arg.dow]}`,
      arg.isToday && 'fc-day-today',
      arg.isPast && 'fc-day-past',
      arg.isFuture && 'fc-day-future',
      arg.isOther && 'fc-day-other',
    ]
}

function getSlotClassNames(arg: any) {
  return [
    cellClassName,
    arg.isMinor && 'border-dotted',
  ]
  /*
  NOTE: give conditional styles based on arg.isToday, etc...
  */
}
