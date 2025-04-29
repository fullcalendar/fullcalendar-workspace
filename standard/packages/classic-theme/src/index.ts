import { createPlugin, EventContentArg, PluginDef } from '@fullcalendar/core'
import * as svgIcons from './svgIcons.js'
import './index.css'

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

export default createPlugin({
  name: '<%= pkgName %>',
  optionDefaults: {
    classNames: 'fc',
    directionClassNames: (direction) => `fc-direction-${direction}`,
    mediaTypeClassNames: (mediaType) => `fc-media-${mediaType}`,
    toolbarClassNames: (arg) => [
      `fc-${arg.name}-toolbar`,
      'fc-toolbar',
    ],
    toolbarSectionClassNames: (arg) => [
      'fc-toolbar-section',
      `fc-toolbar-${arg.name}`, // TODO: do section- ?
    ],
    toolbarTitleClassNames: 'fc-toolbar-title',
    viewClassNames: (arg) => [
      'fc-view',
      `fc-${arg.view.type}-view`,
      'fc-view-bordered',
    ],
    viewHeaderClassNames: (arg) => [
      arg.isSticky && 'fc-view-header-sticky'
    ],

    // UI Fundamentals
    // ---------------------------------------------------------------------------------------------

    buttons: {
      prev: {
        iconContent: (arg) => arg.direction === 'ltr'
          ? svgIcons.chevronLeft
          : svgIcons.chevronRight,
      },
      next: {
        iconContent: (arg) => arg.direction === 'ltr'
          ? svgIcons.chevronRight
          : svgIcons.chevronLeft,
      },
      prevYear: {
        iconContent: (arg) => arg.direction === 'ltr'
          ? svgIcons.chevronsLeft
          : svgIcons.chevronsRight,
      },
      nextYear: {
        iconContent: (arg) => arg.direction === 'ltr'
          ? svgIcons.chevronsRight
          : svgIcons.chevronsLeft,
      },
    },
    popoverCloseContent: () => svgIcons.x,
    resourceExpanderContent: (arg) => arg.isExpanded
      ? svgIcons.minusSquare
      : svgIcons.plusSquare,

    buttonClassNames: (arg) => [
      `fc-${arg.name}-button`,
      'fc-button',
      'fc-button-primary',
      arg.isSelected && 'fc-button-active',
    ],
    buttonGroupClassNames: 'fc-button-group',

    popoverClassNames: 'fc-popover', // see also: dayPopoverClassNames
    popoverHeaderClassNames: 'fc-popover-header',
    popoverTitleClassNames: 'fc-popover-title',
    popoverCloseClassNames: 'fc-popover-close',
    popoverBodyClassNames: 'fc-popover-body',

    // Cross-view
    // ---------------------------------------------------------------------------------------------

    weekNumberClassNames: 'fc-week-number',
    navLinkClassNames: 'fc-navlink', // TODO: fc-nav-link ?
    moreLinkClassNames: 'fc-more-link',

    dayCompactWidth: 70,
    dayPopoverClassNames: (arg) => [
      'fc-more-popover',
      ...getDayClassNames(arg),
    ],

    fillerClassNames: 'fc-filler',
    fillerXClassNames: 'fc-filler-x',
    fillerYClassNames: 'fc-filler-y',

    nonBusinessClassNames: 'fc-non-business',
    highlightClassNames: 'fc-highlight',

    // General Event
    // ---------------------------------------------------------------------------------------------

    eventClassNames: (arg) => [
      arg.event.display === 'background' && 'fc-bg-event',
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
      arg.event.display === 'background' && 'fc-bg-event-title',
      'fc-event-title',
    ],
    eventResizerClassNames: 'fc-event-resizer',
    eventResizerStartClassNames: 'fc-event-resizer-start',
    eventResizerEndClassNames: 'fc-event-resizer-end',

    // Day-Headers (DayGrid & MultiMonth & TimeGrid)
    // ---------------------------------------------------------------------------------------------

    dayHeaderRowClassNames: 'fc-day-header-row',
    dayHeaderClassNames: (arg) => [
      'fc-day-header-cell',
      ...getDayClassNames(arg)
    ],
    dayHeaderInnerClassNames: 'fc-padding-sm',
    dayHeaderDividerClassNames: 'fc-day-header-divider',

    // for resource views only
    resourceDayHeaderClassNames: 'fc-resource-day-header',
    resourceDayHeaderInnerClassNames: 'fc-padding-sm',

    // Day-Cells (DayGrid & MultiMonth & TimeGrid "all-day" section)
    // ---------------------------------------------------------------------------------------------

    dayRowClassNames: 'fc-day-row',
    dayCellClassNames: (arg) => [
      'fc-day-cell',
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
      arg.colCnt > 1 && 'fc-single-month-multicol',
    ],
    singleMonthTitleClassNames: (arg) => [
      'fc-single-month-title',
      arg.colCnt > 1
        ? 'fc-single-month-title-multicol'
        : 'fc-single-month-title-singlecol',
      arg.sticky && 'fc-single-month-title-sticky',
    ],
    singleMonthTableClassNames: (arg) => [
      'fc-single-month-table',
      arg.colCnt > 1 && 'fc-single-month-table-borderx',
      (arg.colCnt > 1 || !arg.isLast) && 'fc-single-month-table-borderbottom',
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
    allDayHeaderInnerClassNames: 'fc-all-day-header-inner fc-padding-sm',
    allDayDividerClassNames: 'fc-all-day-divider',

    dayLaneClassNames: (arg) => [
      'fc-day-lane',
      ...getDayClassNames(arg),
    ],
    dayLaneInnerClassNames: (arg) => [
      'fc-day-lane-inner',
      arg.isSimple && 'fc-day-lane-inner-simple',
    ],

    // Slots (TimeGrid & Timeline)
    // ---------------------------------------------------------------------------------------------

    slotLabelClassNames: (arg) => [
      'fc-slot-label',
      ...getSlotClassNames(arg),
    ],
    slotLaneClassNames: (arg) => [
      'fc-slot-lane',
      ...getSlotClassNames(arg),
    ],

    // only for (resource-)timeline
    slotLabelRowClassNames: 'fc-slot-label-row',

    // Resource Timeline
    // ---------------------------------------------------------------------------------------------

    resourceAreaHeaderRowClassNames: 'fc-resource-area-header-row',
    resourceAreaHeaderClassNames: 'fc-resource-area-header',
    resourceAreaHeaderInnerClassNames: 'fc-padding-lg',
    resourceAreaDividerClassNames: 'fc-resource-area-divider',

    resourceAreaRowClassNames: 'fc-resource-area-row',
    resourceIndentClassNames: 'fc-resource-indent',
    resourceExpanderClassNames: 'fc-resource-expander',

    resourceGroupHeaderClassNames: 'fc-resource-group-header',
    resourceGroupHeaderInnerClassNames: 'fc-padding-lg',
    resourceGroupLaneClassNames: 'fc-resource-group-lane',

    resourceCellClassNames: 'fc-resource-cell',
    resourceCellInnerClassNames: 'fc-padding-lg',
    resourceLaneClassNames: 'fc-resource-lane',
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
      weekNumberInnerClassNames: 'fc-timegrid-axis-inner fc-padding-sm',
      moreLinkClassNames: 'fc-timegrid-more-link',
      moreLinkInnerClassNames: 'fc-timegrid-more-link-inner',
      slotLabelClassNames: 'fc-timegrid-axis',
      slotLabelInnerClassNames: 'fc-timegrid-axis-inner fc-padding-sm',
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
      slotLabelInnerClassNames: 'fc-padding-md',
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
      'fc-day-disabled',
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
  return arg.isDisabled
    ? [
      'fc-slot',
      'fc-slot-disabled',
    ]
    : [
      'fc-slot',
      arg.isMajor && 'fc-slot-major',
      arg.isMinor && 'fc-slot-minor',
      `fc-slot-${DAY_IDS[arg.dow]}`,
      arg.isToday && 'fc-slot-today',
      arg.isPast && 'fc-slot-past',
      arg.isFuture && 'fc-slot-future',
      arg.isOther && 'fc-slot-other',
    ]
}
