import { createPlugin, EventContentArg, PluginDef } from '@fullcalendar/core'
import './index.css'

export default createPlugin({
  name: '<%= pkgName %>',
  optionDefaults: {
    classNames: ['fc', 'fc-theme-standard'],
    directionClassNames: (direction) => `fc-direction-${direction}`,
    mediaTypeClassNames: (mediaType) => `fc-media-${mediaType}`,
    viewClassNames: (arg) => ['fc-view', `fc-${arg.view.type}-view`, 'fc-border'],
    popoverClassNames: 'fc-popover',
    popoverHeaderClassNames: 'fc-popover-header',
    popoverBodyClassNames: 'fc-popover-body',
    dayNarrowWidth: 70,
    dayNarrowClassNames: 'fc-day-narrow',
    dayNotNarrowClassNames: 'fc-day-not-narrow',
    eventClassNames: (arg) => [
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
        arg.event.allDay ? getDayGridEventClassNames(arg) : ''
      ),
      eventColorClassNames: (arg) => (
        arg.event.allDay ? getDayGridEventColorClassNames(arg) : ''
      ),
    },
    list: {
      viewClassNames: 'fc-list',
    },
    multiMonth: {
      viewClassNames: 'fc-multimonth',
      eventClassNames: getDayGridEventClassNames,
      eventColorClassNames: getDayGridEventColorClassNames,
    },
    timeline: {
      viewClassNames: 'fc-timeline',
    },
    resourceDayGrid: {
      viewClassNames: 'fc-resource-daygrid', // also inherits dayGrid
    },
    resourceTimeGrid: {
      viewClassNames: 'fc-resource-timegrid', // also inherits timeGrid
    },
    resourceTimeline: {
      viewClassNames: 'fc-resource-timeline',
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
