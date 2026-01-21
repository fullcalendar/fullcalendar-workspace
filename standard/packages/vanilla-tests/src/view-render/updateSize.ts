import { CalendarWrapper } from '../lib/wrappers/CalendarWrapper.js'

describe('updateSize method', () => {
  it('updates size of a previously hidden element', () => {
    let $el = $('<div style="display:none" />').appendTo('body')
    let calendar = initCalendar({
      initialView: 'dayGridMonth',
      contentHeight: 600,
    }, $el)
    let calendarWrapper = new CalendarWrapper(calendar)

    $el.show()
    calendar.updateSize()
    expect(calendarWrapper.getViewOuterEl().offsetHeight).toBeCloseTo(600, 0)

    $el.remove()
  })
})
