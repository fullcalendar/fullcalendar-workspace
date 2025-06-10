import { createPlugin, EventDisplayData, PluginDef } from '@fullcalendar/core'
import './index.css'

// TODO: better solution for this
// Also figure out resource-header-tier.ts
const PLUGIN_SPECIFIC_SETTINGS: any = {
  dayHeaderClassNames: (data) => getDayClassNames(data),
  dayCellClassNames: (data) => getDayClassNames(data),
  dayLaneClassNames: (data) => getDayClassNames(data),
}

export default createPlugin({
  name: '<%= pkgName %>',
  optionDefaults: {
    classNames: ['fc', 'fc-theme-bootstrap5'],
    directionClassNames: (direction) => `fc-direction-${direction}`,
    mediaTypeClassNames: (mediaType) => `fc-media-${mediaType}`,
    viewClassNames: (data) => ['fc-view', `fc-${data.view.type}-view`, 'fc-view-bordered'],
    popoverClassNames: ['fc-popover', 'popover'],
    popoverHeaderClassNames: ['fc-popover-header', 'popover-header'],
    popoverBodyClassNames: ['fc-popover-body', 'popover-body'],
    buttonGroupClassNames: 'btn-group',
    buttonClassNames: (data) => [
      'btn',
      'btn-primary',
      data.isSelected && 'active',
    ],
    iconClassNames: 'bi',
    icons: {
      close: { classNames: 'bi-x-lg' },
      prev: { classNames: (data) => `bi-chevron-${startSide(data.direction)}` },
      next: { classNames: (data) => `bi-chevron-${endSide(data.direction)}` },
      prevYear: { classNames: (data) => `bi-chevron-double-${startSide(data.direction)}` },
      nextYear: { classNames: (data) => `bi-chevron-double-${endSide(data.direction)}` },
    },
    dayCompactWidth: 75,
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
    eventTitleClassNames: 'fc-event-title',
    dayPopoverClassNames: (data) => getDayClassNames(data),
    slotLabelClassNames: (data) => getSlotClassNames(data),
    slotLaneClassNames: (data) => getSlotClassNames(data),
    ...PLUGIN_SPECIFIC_SETTINGS,
  },
  views: {
    dayGrid: {
      viewClassNames: 'fc-daygrid',
      eventClassNames: getDayGridEventClassNames,
      eventColorClassNames: getDayGridEventColorClassNames,
    },
    timeGrid: {
      viewClassNames: 'fc-timegrid',
      eventClassNames: (data) => (
        data.event.allDay ? getDayGridEventClassNames(data) :
        data.event.display === 'background' ? '' :
        'fc-timegrid-event fc-v-event'
      ),
      eventColorClassNames: (data) => (
        data.event.allDay ? getDayGridEventColorClassNames(data) : ''
      ),
    },
    list: {
      viewClassNames: 'fc-list',
      eventClassNames: 'fc-list-event',
      eventColorClassNames: 'fc-list-event-dot',
    },
    multiMonth: {
      viewClassNames: 'fc-multimonth',
      eventClassNames: getDayGridEventClassNames,
      eventColorClassNames: getDayGridEventColorClassNames,
    },
    timeline: {
      viewClassNames: 'fc-timeline',
      eventClassNames: 'fc-timeline-event fc-h-event',
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

function getDayGridEventClassNames(data: EventDisplayData) {
  return ''
  // return data.event.display === 'background' ? '' :
  //   data.isListItem ? 'fc-daygrid-dot-event fc-daygrid-event' :
  //   'fc-daygrid-block-event fc-daygrid-event fc-h-event'
}

function getDayGridEventColorClassNames(data: EventDisplayData) {
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

function getSlotClassNames(data: any) {
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

function startSide(direction: 'ltr' | 'rtl'): string {
  return direction === 'ltr' ? 'left' : 'right'
}

function endSide(direction: 'ltr' | 'rtl'): string {
  return direction === 'ltr' ? 'right' : 'left'
}
