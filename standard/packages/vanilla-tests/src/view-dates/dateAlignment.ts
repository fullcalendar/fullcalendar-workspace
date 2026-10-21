import { expectActiveRange } from '../lib/ViewDateUtils'

/*
SEE ALSO: next/prev
*/
describe('dateAlignment', () => {
  describe('when week alignment', () => {
    pushOptions({
      initialView: 'timeGrid',
      dateAlignment: 'week',
      initialDate: '2017-06-15',
    })

    describe('when 3 day duration', () => {
      pushOptions({
        duration: { days: 3 },
      })

      it('aligns with the week', () => {
        let calendar = initCalendar()
        expectActiveRange(calendar, '2017-06-11', '2017-06-14')
      })
    })

    describe('when 5 day count', () => {
      pushOptions({
        dayCount: 5,
        weekends: false,
      })

      it('aligns with first visible day of the week', () => {
        let calendar = initCalendar()
        expectActiveRange(calendar, '2017-06-12', '2017-06-17')
      })
    })
  })

  // a one-day view aligned to the week starts on Sunday, a hidden day: it used to throw. it starts
  // on the week's first visible day instead (dayCount's behavior just above)
  describe('when week alignment of a one-day view with weekends hidden', () => {
    pushOptions({
      dateAlignment: 'week',
      weekends: false,
      initialDate: '2017-06-15', // a Thursday
    })

    for (const initialView of ['dayGridDay', 'timeGridDay', 'listDay']) {
      it(`starts on the first visible day of the week in ${initialView}, and navigates by weeks`, () => {
        let calendar = initCalendar({ initialView })
        expectActiveRange(calendar, '2017-06-12', '2017-06-13')

        calendar.next()
        expectActiveRange(calendar, '2017-06-19', '2017-06-20')

        calendar.prev()
        calendar.prev()
        expectActiveRange(calendar, '2017-06-05', '2017-06-06')
      })
    }
  })

  // test in Safari!
  // https://github.com/fullcalendar/fullcalendar/issues/4363
  describe('when year alignment', () => {
    pushOptions({
      initialView: 'dayGrid',
      duration: { months: 1 },
      dateAlignment: 'year',
      initialDate: '2017-06-15',
    })

    it('aligns with first day of year', () => {
      let calendar = initCalendar()
      expectActiveRange(calendar, '2017-01-01', '2017-02-05')
    })
  })
})
