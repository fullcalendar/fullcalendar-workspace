import { createPlugin, EventContentArg, PluginDef } from '@fullcalendar/core'
import * as svgIcons from './svgIcons.js'
import './index.css'

// TODO: better solution for this
// Also figure out resource-header-tier.ts
// BAD::: gives errors if specific plugins not loaded
const PLUGIN_SPECIFIC_SETTINGS: any = {
  dayHeaderRowClassNames: 'fc-day-header-row',
  dayHeaderClassNames: (arg) => [
    'fc-day-header-cell',
    ...getDayClassNames(arg)
  ],
  dayRowClassNames: 'fc-day-row',
  dayCellClassNames: (arg) => [
    'fc-day-cell',
    ...getDayClassNames(arg),
  ],
  dayCellTopClassNames: 'fc-day-cell-top',
  dayCellTopInnerClassNames: (arg) => [
    'fc-day-cell-top-inner',
    arg.isMonthStart && 'fc-day-cell-top-inner-monthstart',
  ],
  dayHeaderDividerClassNames: 'fc-day-header-divider',
  resourceAreaDividerClassNames: 'fc-resource-area-divider',
  resourceAreaHeaderRowClassNames: 'fc-resource-area-header-row',
  resourceAreaHeaderClassNames: 'fc-resource-area-header',
  resourceAreaRowClassNames: 'fc-resource-area-row',
  resourceLaneClassNames: 'fc-resource-lane',
  resourceGroupLaneClassNames: 'fc-resource-group-lane',
  resourceDayHeaderClassNames: 'fc-resource-day-header',
  resourceCellClassNames: 'fc-resource-cell',
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
  listDayClassName: 'fc-list-day',
  listDayHeaderClassNames: 'fc-list-day-header',
  listDayHeaderInnerClassNames: 'fc-list-day-header-inner',
  resourceIndentClassNames: 'fc-resource-indent',
  resourceExpanderClassNames: 'fc-resource-expander',
}

export default createPlugin({
  name: '<%= pkgName %>',
  optionDefaults: {
    classNames: ['fc', 'fc-theme-standard'],
    directionClassNames: (direction) => `fc-direction-${direction}`,
    mediaTypeClassNames: (mediaType) => `fc-media-${mediaType}`,
    viewClassNames: (arg) => ['fc-view', `fc-${arg.view.type}-view`, 'fc-view-bordered'],
    popoverClassNames: 'fc-popover',
    popoverHeaderClassNames: 'fc-popover-header',
    popoverTitleClassNames: 'fc-popover-title',
    popoverCloseClassNames: 'fc-popover-close',
    popoverBodyClassNames: 'fc-popover-body',
    toolbarClassNames: (arg) => [
      `fc-${arg.name}-toolbar`,
      'fc-toolbar',
    ],
    toolbarSectionClassNames: (arg) => [
      'fc-toolbar-section',
      `fc-toolbar-${arg.name}`, // TODO: do section- ?
    ],
    toolbarTitleClassNames: 'fc-toolbar-title',
    buttonGroupClassNames: 'fc-button-group',
    buttonClassNames: (arg) => [
      `fc-${arg.name}-button`,
      'fc-button',
      'fc-button-primary',
      arg.isSelected && 'fc-button-active',
    ],
    icons: {
      close: () => svgIcons.x,
      prev: (arg) => arg.direction === 'ltr' ? svgIcons.chevronLeft : svgIcons.chevronRight,
      next: (arg) => arg.direction === 'ltr' ? svgIcons.chevronRight : svgIcons.chevronLeft,
      prevYear: (arg) => arg.direction === 'ltr' ? svgIcons.chevronsLeft : svgIcons.chevronsRight,
      nextYear: (arg) => arg.direction === 'ltr' ? svgIcons.chevronsRight : svgIcons.chevronsLeft,
      expand: () => svgIcons.plusSquare,
      collapse: () => svgIcons.minusSquare,
    },
    dayNarrowWidth: 70,
    dayNarrowClassNames: 'fc-day-narrow',
    dayNotNarrowClassNames: 'fc-day-not-narrow',
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
    eventResizerClassNames: 'fc-event-resizer',
    eventResizerStartClassNames: 'fc-event-resizer-start',
    eventResizerEndClassNames: 'fc-event-resizer-end',
    eventInnerClassNames: 'fc-event-inner',
    eventTimeClassNames: 'fc-event-time',
    eventTitleClassNames: (arg) => [
      arg.event.display === 'background' && 'fc-bg-event-title',
      'fc-event-title',
    ],
    navLinkClassNames: 'fc-navlink',
    dayPopoverClassNames: (arg) => [
      'fc-more-popover',
      ...getDayClassNames(arg),
    ],
    slotLabelClassNames: (arg) => [
      'fc-slot-label',
      ...getSlotClassNames(arg),
    ],
    slotLaneClassNames: (arg) => [
      'fc-slot-lane',
      ...getSlotClassNames(arg),
    ],
    fillerClassNames: 'fc-filler',
    fillerXClassNames: 'fc-filler-x',
    fillerYClassNames: 'fc-filler-y',
    allDayDividerClassNames: 'fc-all-day-divider',
    slotLabelRowClassNames: 'fc-slot-label-row',
    nonBusinessClassNames: 'fc-non-business',
    highlightClassNames: 'fc-highlight',
    moreLinkClassNames: 'fc-more-link',
    weekNumberClassNames: 'fc-week-number',
    dayLaneClassNames: (arg) => [
      'fc-day-lane',
      ...getDayClassNames(arg),
    ],
    dayLaneInnerClassNames: 'fc-day-lane-inner',
    allDayHeaderClassNames: 'fc-all-day-header',
    allDayHeaderInnerClassNames: 'fc-all-day-header-inner',
    timelineBottomClassNames: 'fc-timeline-bottom',
    resourceLaneBottomClassNames: (arg) => [
      'fc-resource-lane-bottom',
      arg.isCompact && 'fc-resource-lane-bottom-compact',
    ],
    ...PLUGIN_SPECIFIC_SETTINGS,
  },
  views: {
    dayGrid: {
      viewClassNames: 'fc-daygrid',
      eventClassNames: getDayGridEventClassNames,
      eventColorClassNames: getDayGridEventColorClassNames,
      moreLinkClassNames: 'fc-daygrid-more-link',
      weekNumberClassNames: 'fc-daygrid-week-number',
    },
    timeGrid: {
      viewClassNames: 'fc-timegrid',
      slotLabelDividerClassNames: 'fc-timegrid-slot-label-divider',
      eventClassNames: (arg) => (
        arg.event.allDay ? getDayGridEventClassNames(arg) :
        arg.event.display === 'background' ? '' :
        'fc-timegrid-event fc-event-y'
      ),
      eventColorClassNames: (arg) => (
        arg.event.allDay ? getDayGridEventColorClassNames(arg) : ''
      ),
      allDayHeaderClassNames: 'fc-timegrid-axis',
      allDayHeaderInnerClassNames: 'fc-timegrid-axis-inner',
      weekNumberClassNames: 'fc-timegrid-axis',
      weekNumberInnerClassNames: 'fc-timegrid-axis-inner',
      slotLabelClassNames: 'fc-timegrid-axis',
      slotLabelInnerClassNames: 'fc-timegrid-axis-inner',
      moreLinkClassNames: 'fc-timegrid-more-link',
      moreLinkInnerClassNames: 'fc-timegrid-more-link-inner',
      nowIndicatorLabelClassNames: 'fc-timegrid-now-indicator-label',
      nowIndicatorLineClassNames: 'fc-timegrid-now-indicator-line',
    },
    list: {
      viewClassNames: 'fc-list',
      eventClassNames: 'fc-list-event',
      eventColorClassNames: 'fc-list-event-dot',
      noEventsContent: 'fc-list-empty',
      noEventsInnerClassNames: 'fc-list-empty-inner',
    },
    multiMonth: {
      viewClassNames: 'fc-multimonth',
      eventClassNames: getDayGridEventClassNames,
      eventColorClassNames: getDayGridEventColorClassNames,
    },
    timeline: {
      viewClassNames: 'fc-timeline',
      slotLabelDividerClassNames: 'fc-timeline-slot-label-divider',
      eventClassNames: (arg) => [
        'fc-timeline-event fc-event-x',
        arg.isSpacious && 'fc-timeline-event-spacious',
      ],
      moreLinkClassNames: 'fc-timeline-more-link',
      moreLinkInnerClassNames: 'fc-timeline-more-link-inner',
      nowIndicatorLabelClassNames: 'fc-timeline-now-indicator-label',
      nowIndicatorLineClassNames: 'fc-timeline-now-indicator-line',
    },
    resourceDayGrid: {
      viewClassNames: 'fc-resource-daygrid', // also inherits dayGrid
    },
    resourceTimeGrid: {
      viewClassNames: 'fc-resource-timegrid', // also inherits timeGrid
    },
    resourceTimeline: {
      viewClassNames: 'fc-resource-timeline', // also inherits timeline
    },
  },
}) as PluginDef

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
