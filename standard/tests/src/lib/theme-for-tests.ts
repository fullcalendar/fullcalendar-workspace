import { CalendarOptions, createPlugin, PluginDef, joinClassNames } from '@fullcalendar/core'

/*
NOTE: other classnames in theme-for-tests-premium.ts
*/

const dayRowCommonClasses: CalendarOptions = {
  moreLinkClass: 'fc-daygrid-more-link',
  dayCellClass: 'fc-daygrid-day',
  dayCellTopClass: 'fc-daygrid-day-header',
  dayCellTopInnerClass: (data) => joinClassNames(
    'fc-daygrid-day-number',
    data.monthText && 'fc-daygrid-month-start',
  ),
  rowEventClass: 'fc-daygrid-event',
  listItemEventClass: 'fc-daygrid-dot-event',
}

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
    viewClass: (data) => joinClassNames(
      'fc-view',
      `fc-${data.view.type}-view`,
    ),
    buttonClass: (data) => joinClassNames(
      'fc-button',
      `fc-${data.name}-button`,
    ),
    buttonGroupClass: 'fc-button-group',
    popoverClass: 'fc-more-popover',
    popoverCloseClass: 'fc-popover-close',
    navLinkClass: 'fc-navlink',
    nonBusinessClass: 'fc-non-business',
    highlightClass: 'fc-highlight',
    eventClass: (data) => joinClassNames(
      data.event.display === 'background' && 'fc-bg-event',
      'fc-event',
      data.isMirror && 'fc-event-mirror',
      data.isStart && 'fc-event-start',
      data.isEnd && 'fc-event-end',
      data.isPast && 'fc-event-past',
      data.isFuture && 'fc-event-future',
    ),
    eventTimeClass: 'fc-event-time',
    eventTitleClass: 'fc-event-title',
    eventBeforeClass: (data) => joinClassNames(
      data.isStartResizable && 'fc-event-resizer fc-event-resizer-start',
    ),
    eventAfterClass: (data) => joinClassNames(
      data.isEndResizable && 'fc-event-resizer fc-event-resizer-end',
    ),
    dayHeaderClass: (data) => joinClassNames(
      ...getDayClassNames(data),
      data.inPopover && 'fc-popover-header',
    ),
    dayHeaderInnerClass: (data) => joinClassNames(
      data.inPopover && 'fc-popover-title',
    ),
    dayCellClass: (data) => joinClassNames(...getDayClassNames(data)),
    slotHeaderClass: (data) => joinClassNames(...getSlotClass(data)),
    slotLaneClass: (data) => joinClassNames(...getSlotClass(data)),
  },
  views: {
    dayGrid: {
      ...dayRowCommonClasses,
      inlineWeekNumberClass: 'fc-daygrid-week-number',
    },
    timeGrid: {
      ...dayRowCommonClasses,
      viewClass: 'fc-timegrid',
      tableHeaderClass: 'fc-timegrid-header',
      tableBodyClass: 'fc-timegrid-body',
      moreLinkClass: 'fc-timegrid-more-link',
      weekNumberHeaderClass: 'fc-timegrid-axis',
      allDayHeaderClass: 'fc-timegrid-allday fc-timegrid-axis',
      slotLabelClass: (data) => joinClassNames(
        'fc-timegrid-slot-label',
        'fc-timegrid-axis',
        ...getTimeGridSlotClass(data),
      ),
      slotLaneClass: (data) => joinClassNames(
        'fc-timegrid-slot-lane',
        ...getTimeGridSlotClass(data),
      ),
      dayLaneClass: 'fc-timegrid-day',
      nowIndicatorHeaderClass: 'fc-timegrid-now-indicator-arrow',
      nowIndicatorLineClass: 'fc-timegrid-now-indicator-line',
      columnEventClass: (data) => joinClassNames(
        'fc-timegrid-event',
        data.isShort && 'fc-timegrid-event-short',
      ),
    },
    multiMonth: {
      ...dayRowCommonClasses,
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

function getTimeGridSlotClass(data: any) {
  return [
    'fc-timegrid-slot',
    data.isMinor && 'fc-timegrid-slot-minor',
  ]
}
