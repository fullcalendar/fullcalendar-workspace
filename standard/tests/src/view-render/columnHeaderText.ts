import { DayGridViewWrapper } from '../lib/wrappers/DayGridViewWrapper.js'
import { TimeGridViewWrapper } from '../lib/wrappers/TimeGridViewWrapper.js'

describe('dayHeaderContent as text', () => { // TODO: rename file
  pushOptions({
    initialDate: '2014-05-11',
  })

  describeOptions('initialView', {
    'when month view': 'dayGridMonth',
    'when timeGrid view': 'timeGridDay',
    'when dayGrid view': 'dayGridDay',
  }, (viewName) => {
    let ViewWrapper = viewName.match(/^dayGrid/) ? DayGridViewWrapper : TimeGridViewWrapper

    it('should contain custom HTML escaped text', () => {
      let calendar = initCalendar({
        dayHeaderContent(data) {
          return '<div>Custom ' + currentCalendar.formatDate(data.date, { weekday: 'long' }) + '</div>'
        },
      })
      let headerWrapper = new ViewWrapper(calendar).header
      let $firstCell = $(headerWrapper.getCellEls()[0])
      expect($firstCell.text()).toBe('<div>Custom Sunday</div>')
    })
  })

  describeTimeZones((tz) => {
    it('receives correct date', () => {
      let dates = []

      initCalendar({
        initialView: 'timeGridDay',
        dayHeaderContent(data) {
          dates.push(data.date)
        },
      })

      expect(dates.length).toBe(1)
      expect(dates[0]).toEqualDate(tz.parseDate('2014-05-11'))
    })
  })
})
