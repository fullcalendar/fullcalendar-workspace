import { createPlugin, PluginDef } from '@fullcalendar/core'

/*
NOTE: other classnames in theme-for-tests-premium.ts
*/
export default createPlugin({
  name: 'theme-for-tests',
  optionDefaults: {
    headerToolbar: {
      start: 'title',
      end: 'today prev,next',
    },
    className: 'fc',
    toolbarClass: 'fc-toolbar',
    headerToolbarClass: 'fc-header-toolbar',
    footerToolbarClass: 'fc-footer-toolbar',
    toolbarSectionClass: 'fc-toolbar-section',
    toolbarTitleClass: 'fc-toolbar-title',
    viewClass: (data) => [
      'fc-view',
      `fc-${data.view.type}-view`,
    ],
    buttonClass: (data) => [
      `fc-${data.name}-button`,
      'fc-button',
    ],
    buttonGroupClass: 'fc-button-group',
    popoverClass: 'fc-more-popover',
    popoverCloseClass: 'fc-popover-close',
    navLinkClass: 'fc-navlink',
    nonBusinessClass: 'fc-non-business',
    highlightClass: 'fc-highlight',
    eventClass: (data) => [
      data.event.display === 'background' && 'fc-bg-event',
      'fc-event',
      data.isMirror && 'fc-event-mirror',
      data.isStart && 'fc-event-start',
      data.isEnd && 'fc-event-end',
      data.isPast && 'fc-event-past',
      data.isFuture && 'fc-event-future',
    ],
    eventTimeClass: 'fc-event-time',
    eventTitleClass: 'fc-event-title',
    eventBeforeClass: (data) => [
      data.isStartResizable && 'fc-event-resizer fc-event-resizer-start',
    ],
    eventAfterClass: (data) => [
      data.isEndResizable && 'fc-event-resizer fc-event-resizer-end',
    ],
    dayHeaderClass: (data) => [
      ...getDayClassNames(data),
      data.inPopover && 'fc-popover-header',
    ],
    dayHeaderInnerClass: (data) => [
      data.inPopover && 'fc-popover-title',
    ],
    dayCellClass: (data) => getDayClassNames(data),
    slotHeaderClass: getSlotClass,
    slotLaneClass: getSlotClass,
  },
  views: {
    multiMonth: {
      viewClass: 'fc-multimonth',
      singleMonthClass: 'fc-multimonth-month',
      singleMonthHeaderClass: 'fc-multimonth-title',
      dayHeaderRowClass: 'fc-multimonth-header-row',
    },
    list: {
      viewClass: 'fc-list',
      listDayHeaderInnerClass: (data) => (
        data.level ? 'fc-list-day-side-text' : 'fc-list-day-text'
      ),
      listItemEventClass: 'fc-list-event',
      listItemEventBeforeClass: 'fc-list-event-dot',
      listItemEventTitleClass: 'fc-list-event-title',
      listItemEventTimeClass: 'fc-list-event-time',
    }
  }
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
    ]
}
