import { createPlugin, PluginDef } from '@fullcalendar/core'
import * as svgIcons from './svgIcons.js'
import './index.css'

// Will import ambient types during dev but strip out for build
import {} from '@fullcalendar/timegrid'
import {} from '@fullcalendar/timeline'
import {} from '@fullcalendar/list'
import {} from '@fullcalendar/multimonth'
import {} from '@fullcalendar/resource-daygrid'
import {} from '@fullcalendar/resource-timeline'

const dayGridBlockEventClass = 'fc-daygrid-block-event fc-daygrid-event fc-event-x'
const dayGridListItemEventClass = 'fc-daygrid-dot-event fc-daygrid-event fc-event-x'

const dayGridCommon = {
  rowEventClass: dayGridBlockEventClass,
  listEventClass: dayGridListItemEventClass,
  weekNumberClass: 'fc-daygrid-week-number',
  moreLinkClass: 'fc-daygrid-more-link',
}

export default createPlugin({
  name: '<%= pkgName %>',
  optionDefaults: {
    classNames: (data) => [
      'fc',
      `fc-direction-${data.direction}`,
      `fc-media-${data.mediaType}`
    ],
    toolbarClass: (data) => [
      `fc-${data.name}-toolbar`,
      'fc-toolbar',
    ],
    toolbarSectionClass: (data) => [
      'fc-toolbar-section',
      `fc-toolbar-${data.name}`, // TODO: do section- ?
    ],
    toolbarTitleClass: 'fc-toolbar-title',
    viewClass: (data) => [
      'fc-view',
      `fc-${data.view.type}-view`,
      'fc-view-bordered',
    ],
    viewHeaderClass: (data) => [
      data.isSticky && 'fc-view-header-sticky'
    ],

    // UI Fundamentals
    // ---------------------------------------------------------------------------------------------

    buttons: {
      prev: {
        iconContent: (data) => data.direction === 'ltr'
          ? svgIcons.chevronLeft
          : svgIcons.chevronRight,
      },
      next: {
        iconContent: (data) => data.direction === 'ltr'
          ? svgIcons.chevronRight
          : svgIcons.chevronLeft,
      },
      prevYear: {
        iconContent: (data) => data.direction === 'ltr'
          ? svgIcons.chevronsLeft
          : svgIcons.chevronsRight,
      },
      nextYear: {
        iconContent: (data) => data.direction === 'ltr'
          ? svgIcons.chevronsRight
          : svgIcons.chevronsLeft,
      },
    },
    popoverCloseContent: () => svgIcons.x,
    resourceExpanderContent: (data) => data.isExpanded
      ? svgIcons.minusSquare
      : svgIcons.plusSquare,

    buttonClass: (data) => [
      `fc-${data.name}-button`,
      'fc-button',
      'fc-button-primary',
      data.isSelected && 'fc-button-active',
    ],
    buttonGroupClass: 'fc-button-group',

    popoverClass: 'fc-popover', // see also: dayPopoverClass
    popoverHeaderClass: 'fc-popover-header',
    popoverTitleClass: 'fc-popover-title',
    popoverCloseClass: 'fc-popover-close',
    popoverBodyClass: 'fc-popover-body',

    // Cross-view
    // ---------------------------------------------------------------------------------------------

    weekNumberClass: 'fc-week-number',
    navLinkClass: 'fc-navlink', // TODO: fc-nav-link ?
    moreLinkClass: 'fc-more-link',

    dayCompactWidth: 75,
    dayPopoverClass: (data) => [
      'fc-more-popover',
      ...getDayClassNames(data),
    ],

    fillerClass: 'fc-filler', // TODO: give all-sides border

    nonBusinessClass: 'fc-non-business',
    highlightClass: 'fc-highlight',

    // General Event
    // ---------------------------------------------------------------------------------------------

    eventClass: (data) => [
      data.event.display === 'background' && 'fc-bg-event',
      'fc-event',
      data.isMirror && 'fc-event-mirror',
      data.isDraggable && 'fc-event-draggable',
      (data.isStartResizable || data.isEndResizable) && 'fc-event-resizable',
      data.isDragging && 'fc-event-dragging',
      data.isResizing && 'fc-event-resizing',
      data.isSelected && 'fc-event-selected',
      data.isStart && 'fc-event-start',
      data.isEnd && 'fc-event-end',
      data.isPast && 'fc-event-past',
      data.isFuture && 'fc-event-future',
      data.isToday && 'fc-event-today',
    ],
    eventInnerClass: 'fc-event-inner',
    eventTimeClass: 'fc-event-time',
    eventTitleClass: (data) => [
      data.event.display === 'background' && 'fc-bg-event-title',
      'fc-event-title',
    ],
    eventBeforeClass: (data) => [
      data.isStartResizable && 'fc-event-resizer fc-event-resizer-start',
    ],
    eventAfterClass: (data) => [
      data.isEndResizable && 'fc-event-resizer fc-event-resizer-end',
    ],

    // Day-Headers (DayGrid & MultiMonth & TimeGrid)
    // ---------------------------------------------------------------------------------------------

    dayHeaderRowClass: 'fc-day-header-row',
    dayHeaderClass: (data) => [
      'fc-day-header-cell',
      ...getDayClassNames(data)
    ],
    dayHeaderInnerClass: 'fc-padding-sm',
    dayHeaderDividerClass: 'fc-day-header-divider',

    // for resource views only
    resourceDayHeaderClass: 'fc-resource-day-header',
    resourceDayHeaderInnerClass: 'fc-padding-sm',

    // Day-Cells (DayGrid & MultiMonth & TimeGrid "all-day" section)
    // ---------------------------------------------------------------------------------------------

    dayRowClass: 'fc-day-row',
    dayCellClass: (data) => [
      'fc-day-cell',
      ...getDayClassNames(data),
      data.isCompact ? 'fc-day-cell-compact' : 'fc-day-cell-not-compact',
    ],

    dayCellTopClass: 'fc-day-cell-top',
    dayCellTopInnerClass: (data) => [
      'fc-day-cell-top-inner',
      data.isMonthStart && 'fc-day-cell-top-inner-monthstart',
    ],

    // MultiMonth
    // ---------------------------------------------------------------------------------------------

    singleMonthClass: (data) => [
      'fc-single-month',
      data.colCount > 1 && 'fc-single-month-multicol',
    ],
    // singleMonthTitleClass: (data) => [
    //   'fc-single-month-title',
    //   data.colCount > 1
    //     ? 'fc-single-month-title-multicol'
    //     : 'fc-single-month-title-singlecol',
    //   data.sticky && 'fc-single-month-title-sticky',
    // ],
    // singleMonthTableClass: (data) => [
    //   'fc-single-month-table',
    //   data.colCount > 1 && 'fc-single-month-table-borderx',
    //   (data.colCount > 1 || !data.isLast) && 'fc-single-month-table-borderbottom',
    //   !data.stickyTitle && 'fc-single-month-table-bordertop',
    // ],
    // singleMonthTableHeaderClass: (data) => [
    //   'fc-single-month-table-header',
    //   data.sticky && 'fc-single-month-table-header-sticky',
    // ],
    // singleMonthTableBodyClass: 'fc-single-month-table-body',

    // TimeGrid
    // ---------------------------------------------------------------------------------------------

    allDayHeaderClass: 'fc-all-day-header',
    allDayHeaderInnerClass: 'fc-all-day-header-inner fc-padding-sm',
    allDayDividerClass: 'fc-all-day-divider',

    dayLaneClass: (data) => [
      'fc-day-lane',
      ...getDayClassNames(data),
    ],
    dayLaneInnerClass: (data) => [
      'fc-day-lane-inner',
      data.isSimple && 'fc-day-lane-inner-simple',
    ],

    // Slots (TimeGrid & Timeline)
    // ---------------------------------------------------------------------------------------------

    slotLabelClass: (data) => [
      'fc-slot-label',
      ...getSlotClass(data),
    ],
    slotLaneClass: (data) => [
      'fc-slot-lane',
      ...getSlotClass(data),
    ],

    // only for (resource-)timeline
    slotLabelRowClass: 'fc-slot-label-row',

    // Resource Timeline
    // ---------------------------------------------------------------------------------------------

    resourceAreaHeaderRowClass: 'fc-resource-area-header-row',
    resourceAreaHeaderClass: 'fc-resource-area-header',
    resourceAreaHeaderInnerClass: 'fc-padding-lg',
    resourceAreaDividerClass: 'fc-resource-area-divider',

    resourceAreaRowClass: 'fc-resource-area-row',
    resourceIndentClass: 'fc-resource-indent',
    resourceExpanderClass: 'fc-resource-expander',

    resourceGroupHeaderClass: 'fc-resource-group-header',
    resourceGroupHeaderInnerClass: 'fc-padding-lg',
    resourceGroupLaneClass: 'fc-resource-group-lane',

    resourceCellClass: 'fc-resource-cell',
    resourceCellInnerClass: 'fc-padding-lg',
    resourceLaneClass: 'fc-resource-lane',
    resourceLaneBottomClass: (data) => [
      'fc-resource-lane-bottom',
      data.isCompact && 'fc-resource-lane-bottom-compact',
    ],

    // Timeline WITHOUT resources
    // ---------------------------------------------------------------------------------------------

    timelineBottomClass: 'fc-timeline-bottom',

    // List View
    // ---------------------------------------------------------------------------------------------

    listDayClass: 'fc-list-day',
    listDayHeaderClass: 'fc-list-day-header',
    listDayHeaderInnerClass: 'fc-list-day-header-inner',
  },
  views: {
    dayGrid: {
      viewClass: 'fc-daygrid',
      ...dayGridCommon,
    },
    multiMonth: {
      viewClass: 'fc-multimonth',
      ...dayGridCommon,
    },
    timeGrid: {
      viewClass: 'fc-timegrid',
      eventClass: (data) => [
        data.isCompact && 'fc-timegrid-event-compact',
        data.level && 'fc-timegrid-event-inset',
      ],
      rowEventClass: dayGridBlockEventClass,
      listItemEventClass: dayGridListItemEventClass,
      listItemEventColorClass: 'fc-daygrid-event-dot',
      columnEventClass: 'fc-timegrid-event fc-event-y',
      allDayHeaderClass: 'fc-timegrid-axis',
      allDayHeaderInnerClass: 'fc-timegrid-axis-inner',
      weekNumberClass: 'fc-timegrid-axis',
      weekNumberInnerClass: 'fc-timegrid-axis-inner fc-padding-sm',
      moreLinkClass: 'fc-timegrid-more-link',
      moreLinkInnerClass: 'fc-timegrid-more-link-inner',
      slotLabelClass: 'fc-timegrid-axis',
      slotLabelInnerClass: 'fc-timegrid-axis-inner fc-padding-sm',
      slotLabelDividerClass: 'fc-timegrid-slot-label-divider',
      nowIndicatorLabelClass: 'fc-timegrid-now-indicator-label',
      nowIndicatorLineClass: 'fc-timegrid-now-indicator-line',
    },
    timeline: {
      viewClass: 'fc-timeline',
      eventClass: (data) => [
        'fc-timeline-event fc-event-x',
        data.isSpacious && 'fc-timeline-event-spacious',
      ],
      moreLinkClass: 'fc-timeline-more-link',
      moreLinkInnerClass: 'fc-timeline-more-link-inner',
      slotLabelInnerClass: 'fc-padding-md',
      slotLabelDividerClass: 'fc-timeline-slot-label-divider',
      nowIndicatorLabelClass: 'fc-timeline-now-indicator-label',
      nowIndicatorLineClass: 'fc-timeline-now-indicator-line',
    },
    list: {
      viewClass: 'fc-list',
      eventClass: 'fc-list-event',
      eventColorClass: 'fc-list-event-dot',
      noEventsClass: 'fc-list-empty',
      noEventsInnerClass: 'fc-list-empty-inner',
    },
    resourceDayGrid: { // inherits dayGrid
      viewClass: 'fc-resource-daygrid',
    },
    resourceTimeGrid: { // inherits timeGrid
      viewClass: 'fc-resource-timegrid',
    },
    resourceTimeline: { // inherits timeline
      viewClass: 'fc-resource-timeline',
    },
  },
}) as PluginDef

// Utils
// -------------------------------------------------------------------------------------------------

const DAY_IDS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function getDayClassNames(data: any) {
  return data.isDisabled
    ? [
      'fc-day',
      'fc-day-disabled',
    ]
    : [
      'fc-day',
      `fc-day-${DAY_IDS[data.dow]}`,
      data.isToday && 'fc-day-today',
      data.isPast && 'fc-day-past',
      data.isFuture && 'fc-day-future',
      data.isOther && 'fc-day-other',
    ]
}

function getSlotClass(data: any) {
  return data.isDisabled
    ? [
      'fc-slot',
      'fc-slot-disabled',
    ]
    : [
      'fc-slot',
      data.isMajor && 'fc-slot-major',
      data.isMinor && 'fc-slot-minor',
      `fc-slot-${DAY_IDS[data.dow]}`,
      data.isToday && 'fc-slot-today',
      data.isPast && 'fc-slot-past',
      data.isFuture && 'fc-slot-future',
      data.isOther && 'fc-slot-other',
    ]
}
