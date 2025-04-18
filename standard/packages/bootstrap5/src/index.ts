import { createPlugin, EventContentArg, PluginDef } from '@fullcalendar/core'
import './index.css'

// TODO: better solution for this
// Also figure out resource-header-tier.ts
const PLUGIN_SPECIFIC_SETTINGS: any = {
  dayHeaderClassNames: (arg) => getDayClassNames(arg),
  dayCellClassNames: (arg) => getDayClassNames(arg),
  dayLaneClassNames: (arg) => getDayClassNames(arg),
}

export default createPlugin({
  name: '<%= pkgName %>',
  optionDefaults: {
    classNames: ['fc', 'fc-theme-bootstrap5'],
    directionClassNames: (direction) => `fc-direction-${direction}`,
    mediaTypeClassNames: (mediaType) => `fc-media-${mediaType}`,
    viewClassNames: (arg) => ['fc-view', `fc-${arg.view.type}-view`, 'fc-border'],
    popoverClassNames: ['fc-popover', 'popover'],
    popoverHeaderClassNames: ['fc-popover-header', 'popover-header'],
    popoverBodyClassNames: ['fc-popover-body', 'popover-body'],
    buttonGroupClassNames: 'btn-group',
    buttonClassNames: (arg) => [
      'btn',
      'btn-primary',
      arg.isSelected && 'active',
    ],
    iconClassNames: 'bi',
    icons: {
      close: { classNames: 'bi-x-lg' },
      prev: { classNames: (arg) => `bi-chevron-${startSide(arg.direction)}` },
      next: { classNames: (arg) => `bi-chevron-${endSide(arg.direction)}` },
      prevYear: { classNames: (arg) => `bi-chevron-double-${startSide(arg.direction)}` },
      nextYear: { classNames: (arg) => `bi-chevron-double-${endSide(arg.direction)}` },
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
    eventInnerClassNames: 'fc-event-inner',
    eventTimeClassNames: 'fc-event-time',
    eventTitleOuterClassNames: 'fc-event-title-outer',
    eventTitleClassNames: 'fc-event-title',
    dayPopoverClassNames: (arg) => getDayClassNames(arg),
    slotLabelClassNames: (arg) => getSlotClassNames(arg),
    slotLaneClassNames: (arg) => getSlotClassNames(arg),
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
      eventClassNames: (arg) => (
        arg.event.allDay ? getDayGridEventClassNames(arg) :
        arg.event.display === 'background' ? '' :
        'fc-timegrid-event fc-v-event'
      ),
      eventColorClassNames: (arg) => (
        arg.event.allDay ? getDayGridEventColorClassNames(arg) : ''
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

function getDayGridEventClassNames(arg: EventContentArg) {
  return arg.event.display === 'background' ? '' :
    arg.isListItem ? 'fc-daygrid-dot-event fc-daygrid-event' :
    'fc-daygrid-block-event fc-daygrid-event fc-h-event'
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
      `fc-slot-${DAY_IDS[arg.dow]}`,
      arg.isToday && 'fc-slot-today',
      arg.isPast && 'fc-slot-past',
      arg.isFuture && 'fc-slot-future',
      arg.isOther && 'fc-slot-other',
    ]
}

function startSide(direction: 'ltr' | 'rtl'): string {
  return direction === 'ltr' ? 'left' : 'right'
}

function endSide(direction: 'ltr' | 'rtl'): string {
  return direction === 'ltr' ? 'right' : 'left'
}
