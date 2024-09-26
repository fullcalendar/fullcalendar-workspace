import { Calendar } from '@fullcalendar/core'
import { findElements } from '@fullcalendar/core/internal'
import { ViewWrapper } from './ViewWrapper.js'
import { formatIsoDay } from '../datelib-utils.js'

export class ListViewWrapper extends ViewWrapper {
  static EVENT_DOT_CLASSNAME = 'fcnew-list-event-dot'

  constructor(calendar: Calendar) {
    super(calendar, 'fcnew-list-view')
  }

  getEventEls() {
    return findElements(this.el, '.fcnew-list-event')
  }

  getEventInfo() {
    return this.getEventEls().map((eventEl) => ({
      title: $(eventEl).find('.fcnew-list-event-title').text(),
      timeText: $(eventEl).find('.fcnew-list-event-time').text(),
    }))
  }

  getDayInfo() {
    return this.getHeadingEls().map((el) => {
      let $el = $(el)
      return {
        mainText: $el.find('.fcnew-list-day-text').text() || '',
        altText: $el.find('.fcnew-list-day-side-text').text() || '',
        date: new Date(el.getAttribute('data-date')),
      }
    })
  }

  getHeadingEls() {
    return findElements(this.el, '.fcnew-list-day')
  }

  getScrollerEl() {
    return this.el // it IS a scroller
  }

  hasEmptyMessage() {
    return Boolean(this.el.querySelector('.fcnew-list-empty'))
  }

  getNavLinkEl(dayDate) {
    if (typeof dayDate === 'string') {
      dayDate = new Date(dayDate)
    }
    return this.el.querySelector('.fcnew-list-day[data-date="' + formatIsoDay(dayDate) + '"] a.fcnew-list-day-text')
  }

  clickNavLink(dayDate) {
    $.simulateMouseClick(this.getNavLinkEl(dayDate))
  }
}
