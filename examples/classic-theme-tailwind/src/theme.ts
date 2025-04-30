import { createPlugin, EventContentArg, PluginDef } from '@fullcalendar/core'
import * as svgIcons from './svgIcons'
import './theme.css'

// Will import ambient types during dev but strip out for build
import {} from '@fullcalendar/timegrid'
import {} from '@fullcalendar/timeline'
import {} from '@fullcalendar/list'
import {} from '@fullcalendar/multimonth'
import {} from '@fullcalendar/resource-daygrid'
import {} from '@fullcalendar/resource-timeline'

const dayGridCommon = {
  eventClassNames: getDayGridEventClassNames,
  eventColorClassNames: getDayGridEventColorClassNames,
  weekNumberClassNames: 'fc-daygrid-week-number',
  moreLinkClassNames: 'fc-daygrid-more-link',
}

const buttonIconClassName = 'text-[1.5em] w-[1em] h-[1em]'

const cellClassName = 'border border-gray-300'

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
    resourceExpanderContent: (arg) => arg.isExpanded
      ? svgIcons.minusSquare()
      : svgIcons.plusSquare(),

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
    dayPopoverClassNames: (arg) => [
      'fc-more-popover',
      ...getDayClassNames(arg),
    ],

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
    eventInnerClassNames: 'fc-event-inner',
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
      'fc-day-cell',
      cellClassName,
      ...getDayClassNames(arg),
      arg.isCompact ? 'fc-day-cell-compact' : 'fc-day-cell-not-compact',
    ],

    dayCellTopClassNames: 'fc-day-cell-top',
    dayCellTopInnerClassNames: (arg) => [
      'fc-day-cell-top-inner',
      arg.isMonthStart && 'fc-day-cell-top-inner-monthstart',
    ],

    // MultiMonth
    // ---------------------------------------------------------------------------------------------

    singleMonthClassNames: (arg) => [
      'fc-single-month',
      (arg.colCnt || 0) > 1 && 'fc-single-month-multicol',
    ],
    singleMonthTitleClassNames: (arg) => [
      'fc-single-month-title',
      (arg.colCnt || 0) > 1
        ? 'fc-single-month-title-multicol'
        : 'fc-single-month-title-singlecol',
      arg.sticky && 'fc-single-month-title-sticky',
    ],
    singleMonthTableClassNames: (arg) => [
      'fc-single-month-table',
      (arg.colCnt || 0) > 1 && 'fc-single-month-table-borderx',
      ((arg.colCnt || 0) > 1 || !arg.isLast) && 'fc-single-month-table-borderbottom',
      !arg.stickyTitle && 'fc-single-month-table-bordertop',
    ],
    singleMonthTableHeaderClassNames: (arg) => [
      'fc-single-month-table-header',
      arg.sticky && 'fc-single-month-table-header-sticky',
    ],
    singleMonthTableBodyClassNames: 'fc-single-month-table-body',

    // TimeGrid
    // ---------------------------------------------------------------------------------------------

    allDayHeaderClassNames: 'fc-all-day-header',
    allDayHeaderInnerClassNames: 'fc-all-day-header-inner px-1 py-0.5',
    allDayDividerClassNames: 'fc-all-day-divider',

    dayLaneClassNames: (arg) => [
      'fc-day-lane',
      cellClassName,
      ...getDayClassNames(arg),
    ],
    dayLaneInnerClassNames: (arg) => [
      'fc-day-lane-inner',
      arg.isSimple && 'fc-day-lane-inner-simple',
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
    resourceAreaDividerClassNames: 'fc-resource-area-divider',

    resourceAreaRowClassNames: cellClassName,
    resourceIndentClassNames: 'fc-resource-indent',
    resourceExpanderClassNames: 'fc-resource-expander',

    resourceGroupHeaderClassNames: 'fc-resource-group-header',
    resourceGroupHeaderInnerClassNames: 'p-2',
    resourceGroupLaneClassNames: `fc-resource-group-lane ${cellClassName}`,

    resourceCellClassNames: cellClassName,
    resourceCellInnerClassNames: 'p-2',
    resourceLaneClassNames: cellClassName,
    resourceLaneBottomClassNames: (arg) => [
      'fc-resource-lane-bottom',
      arg.isCompact && 'fc-resource-lane-bottom-compact',
    ],

    // Timeline WITHOUT resources
    // ---------------------------------------------------------------------------------------------

    timelineBottomClassNames: 'fc-timeline-bottom',

    // List View
    // ---------------------------------------------------------------------------------------------

    listDayClassName: 'fc-list-day',
    listDayHeaderClassNames: 'fc-list-day-header',
    listDayHeaderInnerClassNames: 'fc-list-day-header-inner',
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
      allDayHeaderClassNames: 'fc-timegrid-axis',
      allDayHeaderInnerClassNames: 'fc-timegrid-axis-inner',
      weekNumberClassNames: 'fc-timegrid-axis',
      weekNumberInnerClassNames: 'fc-timegrid-axis-inner px-1 py-0.5',
      moreLinkClassNames: 'fc-timegrid-more-link',
      moreLinkInnerClassNames: 'fc-timegrid-more-link-inner',
      slotLabelClassNames: 'fc-timegrid-axis',
      slotLabelInnerClassNames: 'fc-timegrid-axis-inner px-1 py-0.5',
      slotLabelDividerClassNames: 'fc-timegrid-slot-label-divider',
      nowIndicatorLabelClassNames: 'fc-timegrid-now-indicator-label',
      nowIndicatorLineClassNames: 'fc-timegrid-now-indicator-line',
    },
    timeline: {
      viewClassNames: 'fc-timeline',
      eventClassNames: (arg) => [
        'fc-timeline-event fc-event-x',
        arg.isSpacious && 'fc-timeline-event-spacious',
      ],
      moreLinkClassNames: 'fc-timeline-more-link',
      moreLinkInnerClassNames: 'fc-timeline-more-link-inner',
      slotLabelInnerClassNames: 'p-1',
      slotLabelDividerClassNames: 'fc-timeline-slot-label-divider',
      nowIndicatorLabelClassNames: 'fc-timeline-now-indicator-label',
      nowIndicatorLineClassNames: 'fc-timeline-now-indicator-line',
    },
    list: {
      viewClassNames: 'fc-list',
      eventClassNames: 'fc-list-event',
      eventColorClassNames: 'fc-list-event-dot',
      noEventsClassNames: 'fc-list-empty',
      noEventsInnerClassNames: 'fc-list-empty-inner',
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
      'bg-gray-100',
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
