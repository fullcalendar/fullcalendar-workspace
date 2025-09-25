import { createPlugin, EventDisplayData, PluginDef } from '@fullcalendar/core'
import './index.css'

// TODO: better solution for this
// Also figure out resource-header-tier.ts
const PLUGIN_SPECIFIC_SETTINGS: any = {
  dayHeaderClass: (data) => getDayClassNames(data),
  dayCellClass: (data) => getDayClassNames(data),
  dayLaneClass: (data) => getDayClassNames(data),
}

export default createPlugin({
  name: '<%= pkgName %>',
  optionDefaults: {
    className: ['fc', 'fc-theme-bootstrap5'],
    directionClass: (direction) => `fc-direction-${direction}`,
    mediaTypeClass: (mediaType) => `fc-media-${mediaType}`,
    viewClass: (data) => ['fc-view', `fc-${data.view.type}-view`, 'fc-view-bordered'],
    popoverClass: ['fc-popover', 'popover'],
    popoverHeaderClass: ['fc-popover-header', 'popover-header'],
    // popoverBodyClass: ['fc-popover-body', 'popover-body'],
    buttonGroupClass: 'btn-group',
    buttonClass: (data) => [
      'btn',
      'btn-primary',
      data.isSelected && 'active',
    ],
    iconClass: 'bi',
    icons: { // killed
      close: { classNames: 'bi-x-lg' },
      prev: { classNames: 'bi-chevron-left' },
      next: { classNames: 'bi-chevron-right}' },
      prevYear: { classNames: 'bi-chevron-double-left' },
      nextYear: { classNames: 'bi-chevron-double-right}' },
    },
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
    eventTitleClass: 'fc-event-title',
    dayPopoverClass: (data) => getDayClassNames(data),
    slotLabelClass: (data) => getSlotClass(data),
    slotLaneClass: (data) => getSlotClass(data),
    ...PLUGIN_SPECIFIC_SETTINGS,
  },
  views: {
    dayGrid: {
      viewClass: 'fc-daygrid',
      eventClass: getDayGridEventClass,
      eventColorClass: getDayGridEventColorClass,
    },
    timeGrid: {
      viewClass: 'fc-timegrid',
      eventClass: (data) => (
        data.event.allDay ? getDayGridEventClass(data) :
        data.event.display === 'background' ? '' :
        'fc-timegrid-event fc-v-event'
      ),
      eventColorClass: (data) => (
        data.event.allDay ? getDayGridEventColorClass(data) : ''
      ),
    },
    list: {
      viewClass: 'fc-list',
      eventClass: 'fc-list-event',
      eventColorClass: 'fc-list-event-dot',
    },
    multiMonth: {
      viewClass: 'fc-multimonth',
      eventClass: getDayGridEventClass,
      eventColorClass: getDayGridEventColorClass,
    },
    timeline: {
      viewClass: 'fc-timeline',
      eventClass: 'fc-timeline-event fc-h-event',
    },
    resourceDayGrid: {
      viewClass: 'fc-resource-daygrid', // also inherits dayGrid
    },
    resourceTimeGrid: {
      viewClass: 'fc-resource-timegrid', // also inherits timeGrid
    },
    resourceTimeline: {
      viewClass: 'fc-resource-timeline', // also inherits timeline
    },
  },
}) as PluginDef

function getDayGridEventClass(data: EventDisplayData) {
  return ''
  // return data.event.display === 'background' ? '' :
  //   data.isListItem ? 'fc-daygrid-dot-event fc-daygrid-event' :
  //   'fc-daygrid-block-event fc-daygrid-event fc-h-event'
}

function getDayGridEventColorClass(data: EventDisplayData) {
  return ''
  // return data.isListItem && 'fc-daygrid-event-dot'
}

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
      `fc-slot-${DAY_IDS[data.dow]}`,
      data.isToday && 'fc-slot-today',
      data.isPast && 'fc-slot-past',
      data.isFuture && 'fc-slot-future',
      data.isOther && 'fc-slot-other',
    ]
}
