// KNOWN ISSUE: title is weird ("April - May")

import { expectActiveRange } from '@fullcalendar-tests/standard/lib/ViewDateUtils'

describe('dateIncrement', () => {
  describe('when a seven days and view is a month', () => {
    pushOptions({
      initialDate: '2017-04-12',
      initialView: 'timeline',
      duration: { months: 1 },
      dateIncrement: { days: 7 },
    })

    it('causes the view to align at initialDate', () => {
      let calendar = initCalendar()
      expectActiveRange(calendar, '2017-04-12', '2017-05-12')
    })
  })

  describe('when a week and view is a month', () => {
    pushOptions({
      initialDate: '2017-04-12',
      initialView: 'timeline',
      duration: { months: 1 },
      dateIncrement: { week: 1 },
    })

    it('causes the view to align at initialDate\'s week start', () => {
      let calendar = initCalendar()
      expectActiveRange(calendar, '2017-04-09', '2017-05-09')
    })
  })

  describe('when a year and view is a month', () => {
    pushOptions({
      initialDate: '2017-04-12',
      initialView: 'timeline',
      duration: { months: 1 },
      dateIncrement: { years: 1 },
    })

    it('causes the view to align to the smaller of the two units (the month)', () => {
      let calendar = initCalendar()
      expectActiveRange(calendar, '2017-04-01', '2017-05-01')
    })
  })
})
