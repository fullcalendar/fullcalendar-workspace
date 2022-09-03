import { TimeGridViewWrapper } from 'fullcalendar-tests/src/lib/wrappers/TimeGridViewWrapper'
import { TimelineViewWrapper } from '../lib/wrappers/TimelineViewWrapper'

describe('visibleRange', () => {
  pushOptions({
    resources: [
      { id: 'a', title: 'a' },
      { id: 'b', title: 'b' },
      { id: 'c', title: 'c' },
    ],
  })

  describe('in timeline view for a few days', () => {
    pushOptions({
      initialView: 'timeline',
    })

    it('renders the range correctly', () => {
      let calendar = initCalendar({
        visibleRange: {
          start: '2017-06-07',
          end: '2017-06-09',
        },
      })

      let headerWrapper = new TimelineViewWrapper(calendar).header
      let dates = headerWrapper.getDates()

      expect(dates.length).toBe(2)
      expect(dates[0]).toEqualDate('2017-06-07T00:00:00Z')
      expect(dates[1]).toEqualDate('2017-06-08T00:00:00Z')
    })
  })

  describe('in timeline view for years', () => {
    pushOptions({
      initialView: 'timeline',
    })

    it('renders the range correctly', () => {
      let calendar = initCalendar({
        visibleRange: {
          start: '2017-01',
          end: '2019-01',
        },
      })

      let headerWrapper = new TimelineViewWrapper(calendar).header
      let dates = headerWrapper.getDates()

      expect(dates.length).toBe(2)
      expect(dates[0]).toEqualDate('2017-01-01')
      expect(dates[1]).toEqualDate('2018-01-01')
    })
  })

  describe('in vertical resource view', () => {
    pushOptions({
      initialView: 'timeGrid',
      datesAboveResources: true,
    })

    it('renders range correctly', () => {
      let calendar = initCalendar({
        visibleRange: {
          start: '2017-06-07',
          end: '2017-06-09',
        },
      })

      let headerWrapper = new TimeGridViewWrapper(calendar).header
      let dates = headerWrapper.getDates()

      expect(dates.length).toBe(2)
      expect(dates[0]).toEqualDate('2017-06-07')
      expect(dates[1]).toEqualDate('2017-06-08')
    })
  })
})
