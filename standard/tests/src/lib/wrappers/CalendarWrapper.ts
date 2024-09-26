import { Calendar } from '@fullcalendar/core'
import { findElements } from '@fullcalendar/core/internal'
import { ToolbarWrapper } from './ToolbarWrapper.js'

export class CalendarWrapper {
  static EVENT_CLASSNAME = 'fcnew-event' // TODO: put this everywhere?
  static EVENT_IS_START_CLASSNAME = 'fcnew-event-start'
  static EVENT_IS_END_CLASSNAME = 'fcnew-event-end'
  static EVENT_TIME_CLASSNAME = 'fcnew-event-time'
  static EVENT_TITLE_CLASSNAME = 'fcnew-event-title'
  static EVENT_RESIZER_CLASSNAME = 'fcnew-event-resizer'
  static EVENT_START_RESIZER_CLASSNAME = 'fcnew-event-resizer-start'
  static EVENT_END_RESIZER_CLASSNAME = 'fcnew-event-resizer-end'
  static EVENT_PAST_CLASSNAME = 'fcnew-event-past'
  static BG_EVENT_CLASSNAME = 'fcnew-bg-event'
  static DAY_PAST_CLASSNAME = 'fcnew-day-past'
  static DAY_FUTURE_CLASSNAME = 'fcnew-day-future'
  static SLOT_PAST_CLASSNAME = 'fcnew-slot-past'
  static SLOT_FUTURE_CLASSNAME = 'fcnew-slot-future'
  static TODAY_CLASSNAME = 'fcnew-day-today'
  static SLOT_TODAY_CLASSNAME = 'fcnew-slot-today'
  static DOW_CLASSNAMES = ['fcnew-day-sun', 'fcnew-day-mon', 'fcnew-day-tue', 'fcnew-day-wed', 'fcnew-day-thu', 'fcnew-day-fri', 'fcnew-day-sat']
  static DOW_SLOT_CLASSNAMES = ['fcnew-slot-sun', 'fcnew-slot-mon', 'fcnew-slot-tue', 'fcnew-slot-wed', 'fcnew-slot-thu', 'fcnew-slot-fri', 'fcnew-slot-sat']
  static LTR_CLASSNAME = 'fcnew-direction-ltr'
  static RTL_CLASSNAME = 'fcnew-direction-rtl'
  static BOOTSTRAP_CLASSNAME = 'fcnew-theme-bootstrap'
  static UNTHEMED_CLASSNAME = 'fcnew-theme-standard'
  static ROOT_CLASSNAME = 'fcnew'

  constructor(private calendar: Calendar) {
  }

  // TODO: distinguish between header/footerToolbar
  get toolbar() {
    let toolbarEl = this.calendar.el.querySelector('.fcnew-toolbar') as HTMLElement
    return toolbarEl ? new ToolbarWrapper(toolbarEl) : null
  }

  get footerToolbar() {
    let toolbarEl = this.calendar.el.querySelector('.fcnew-footer-toolbar') as HTMLElement
    return toolbarEl ? new ToolbarWrapper(toolbarEl) : null
  }

  getViewContainerEl() {
    return this.calendar.el.querySelector('.fcnew-view-harness') as HTMLElement
  }

  getViewEl() {
    return this.calendar.el.querySelector('.fcnew-view') as HTMLElement
  }

  getViewName() {
    return this.getViewEl().getAttribute('class').match(/fcnew-(\w+)-view/)[1]
  }

  // DISCOURAGE use of the following...

  getNonBusinessDayEls() {
    return findElements(this.calendar.el, '.fcnew-non-business')
  }

  getEventEls() { // FG only
    return findElements(this.calendar.el, '.fcnew-event:not(.fcnew-bg-event)')
  }

  getFirstEventEl() {
    return this.calendar.el.querySelector('.fcnew-event:not(.fcnew-bg-event)') as HTMLElement
  }

  getTodayEls() {
    return findElements(this.calendar.el, '.fcnew-day-today')
  }

  getEventElInfo(eventEl: HTMLElement) {
    return {
      isStart: eventEl.classList.contains(CalendarWrapper.EVENT_IS_START_CLASSNAME),
      isEnd: eventEl.classList.contains(CalendarWrapper.EVENT_IS_END_CLASSNAME),
      timeText: $(eventEl).find('.' + CalendarWrapper.EVENT_TIME_CLASSNAME).text() || '',
      titleEl: eventEl.querySelector('.' + CalendarWrapper.EVENT_TITLE_CLASSNAME),
      resizerEl: eventEl.querySelector('.' + CalendarWrapper.EVENT_RESIZER_CLASSNAME),
    }
  }

  getBgEventEls() {
    return findElements(this.calendar.el, '.' + CalendarWrapper.BG_EVENT_CLASSNAME)
  }

  getFirstDateEl() {
    return this.calendar.el.querySelector('.fcnew [data-date]')
  }

  getDateCellEl(dateStr: string) {
    return this.calendar.el.querySelector('td.fcnew-day[data-date="' + dateStr + '"]')
  }

  getLicenseMessage() {
    return $('.fcnew-license-message', this.calendar.el).text()
  }

  isAllowingDragging() {
    return !$('body').hasClass('fcnew-not-allowed')
  }
}
