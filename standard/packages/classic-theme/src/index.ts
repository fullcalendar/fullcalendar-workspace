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

const dayGridBlockEventClassNames = 'fc-daygrid-block-event fc-daygrid-event fc-event-x'
const dayGridListItemEventClassNames = 'fc-daygrid-dot-event fc-daygrid-event fc-event-x'

const dayGridCommon = {
  rowEventClassNames: dayGridBlockEventClassNames,
  listEventClassNames: dayGridListItemEventClassNames,
  weekNumberClassNames: 'fc-daygrid-week-number',
  moreLinkClassNames: 'fc-daygrid-more-link',
}

export default createPlugin({
  name: '<%= pkgName %>',
  optionDefaults: {
    classNames: (data) => [
      'fc',
      `fc-direction-${data.direction}`,
      `fc-media-${data.mediaType}`
    ],
    toolbarClassNames: (data) => [
      `fc-${data.name}-toolbar`,
      'fc-toolbar',
    ],
    toolbarSectionClassNames: (data) => [
      'fc-toolbar-section',
      `fc-toolbar-${data.name}`, // TODO: do section- ?
    ],
    toolbarTitleClassNames: 'fc-toolbar-title',
    viewClassNames: (data) => [
      'fc-view',
      `fc-${data.view.type}-view`,
      'fc-view-bordered',
    ],
    viewHeaderClassNames: (data) => [
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

    buttonClassNames: (data) => [
      `fc-${data.name}-button`,
      'fc-button',
      'fc-button-primary',
      data.isSelected && 'fc-button-active',
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

    dayCompactWidth: 75,
    dayPopoverClassNames: (data) => [
      'fc-more-popover',
      ...getDayClassNames(data),
    ],

    fillerClassNames: 'fc-filler', // TODO: give all-sides border

    nonBusinessClassNames: 'fc-non-business',
    highlightClassNames: 'fc-highlight',

    // General Event
    // ---------------------------------------------------------------------------------------------

    eventClassNames: (data) => [
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
    eventInnerClassNames: 'fc-event-inner',
    eventTimeClassNames: 'fc-event-time',
    eventTitleClassNames: (data) => [
      data.event.display === 'background' && 'fc-bg-event-title',
      'fc-event-title',
    ],
    eventBeforeClassNames: (data) => [
      data.isStartResizable && 'fc-event-resizer fc-event-resizer-start',
    ],
    eventAfterClassNames: (data) => [
      data.isEndResizable && 'fc-event-resizer fc-event-resizer-end',
    ],

    // Day-Headers (DayGrid & MultiMonth & TimeGrid)
    // ---------------------------------------------------------------------------------------------

    dayHeaderRowClassNames: 'fc-day-header-row',
    dayHeaderClassNames: (data) => [
      'fc-day-header-cell',
      ...getDayClassNames(data)
    ],
    dayHeaderInnerClassNames: 'fc-padding-sm',
    dayHeaderDividerClassNames: 'fc-day-header-divider',

    // for resource views only
    resourceDayHeaderClassNames: 'fc-resource-day-header',
    resourceDayHeaderInnerClassNames: 'fc-padding-sm',

    // Day-Cells (DayGrid & MultiMonth & TimeGrid "all-day" section)
    // ---------------------------------------------------------------------------------------------

    dayRowClassNames: 'fc-day-row',
    dayCellClassNames: (data) => [
      'fc-day-cell',
      ...getDayClassNames(data),
      data.isCompact ? 'fc-day-cell-compact' : 'fc-day-cell-not-compact',
    ],

    dayCellTopClassNames: 'fc-day-cell-top',
    dayCellTopInnerClassNames: (data) => [
      'fc-day-cell-top-inner',
      data.isMonthStart && 'fc-day-cell-top-inner-monthstart',
    ],

    // MultiMonth
    // ---------------------------------------------------------------------------------------------

    singleMonthClassNames: (data) => [
      'fc-single-month',
      data.colCount > 1 && 'fc-single-month-multicol',
    ],
    // singleMonthTitleClassNames: (data) => [
    //   'fc-single-month-title',
    //   data.colCount > 1
    //     ? 'fc-single-month-title-multicol'
    //     : 'fc-single-month-title-singlecol',
    //   data.sticky && 'fc-single-month-title-sticky',
    // ],
    // singleMonthTableClassNames: (data) => [
    //   'fc-single-month-table',
    //   data.colCount > 1 && 'fc-single-month-table-borderx',
    //   (data.colCount > 1 || !data.isLast) && 'fc-single-month-table-borderbottom',
    //   !data.stickyTitle && 'fc-single-month-table-bordertop',
    // ],
    // singleMonthTableHeaderClassNames: (data) => [
    //   'fc-single-month-table-header',
    //   data.sticky && 'fc-single-month-table-header-sticky',
    // ],
    // singleMonthTableBodyClassNames: 'fc-single-month-table-body',

    // TimeGrid
    // ---------------------------------------------------------------------------------------------

    allDayHeaderClassNames: 'fc-all-day-header',
    allDayHeaderInnerClassNames: 'fc-all-day-header-inner fc-padding-sm',
    allDayDividerClassNames: 'fc-all-day-divider',

    dayLaneClassNames: (data) => [
      'fc-day-lane',
      ...getDayClassNames(data),
    ],
    dayLaneInnerClassNames: (data) => [
      'fc-day-lane-inner',
      data.isSimple && 'fc-day-lane-inner-simple',
    ],

    // Slots (TimeGrid & Timeline)
    // ---------------------------------------------------------------------------------------------

    slotLabelClassNames: (data) => [
      'fc-slot-label',
      ...getSlotClassNames(data),
    ],
    slotLaneClassNames: (data) => [
      'fc-slot-lane',
      ...getSlotClassNames(data),
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
    resourceLaneBottomClassNames: (data) => [
      'fc-resource-lane-bottom',
      data.isCompact && 'fc-resource-lane-bottom-compact',
    ],

    // Timeline WITHOUT resources
    // ---------------------------------------------------------------------------------------------

    timelineBottomClassNames: 'fc-timeline-bottom',

    // List View
    // ---------------------------------------------------------------------------------------------

    listDayClassNames: 'fc-list-day',
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
      eventClassNames: (data) => [
        data.isCompact && 'fc-timegrid-event-compact',
        data.level && 'fc-timegrid-event-inset',
      ],
      rowEventClassNames: dayGridBlockEventClassNames,
      listItemEventClassNames: dayGridListItemEventClassNames,
      listItemEventColorClassNames: 'fc-daygrid-event-dot',
      columnEventClassNames: 'fc-timegrid-event fc-event-y',
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
      eventClassNames: (data) => [
        'fc-timeline-event fc-event-x',
        data.isSpacious && 'fc-timeline-event-spacious',
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

function getSlotClassNames(data: any) {
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
