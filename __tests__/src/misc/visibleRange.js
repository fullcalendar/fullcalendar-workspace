import { parseIsoAsUtc } from 'package-tests/datelib/utils'

describe('visibleRange', function() {
  pushOptions({
    resources: [
      { id: 'a', title: 'a' },
      { id: 'b', title: 'b' },
      { id: 'c', title: 'c' }
    ]
  })


  describe('in timeline view for a few days', function() {
    pushOptions({
      defaultView: 'timeline'
    })

    it('renders the range correctly', function() {
      initCalendar({
        visibleRange: {
          start: '2017-06-07',
          end: '2017-06-09'
        }
      })

      const dates = $('.fc-head .fc-time-area tr:first-child > th[data-date]')
        .map(function(i, node) {
          return parseIsoAsUtc($(node).data('date'))
        })
        .get()

      expect(dates.length).toBe(2)
      expect(dates[0]).toEqualDate('2017-06-07T00:00:00Z')
      expect(dates[1]).toEqualDate('2017-06-08T00:00:00Z')
    })
  })


  describe('in timeline view for years', function() {
    pushOptions({
      defaultView: 'timeline'
    })

    it('renders the range correctly', function() {
      initCalendar({
        visibleRange: {
          start: '2017-01',
          end: '2019-01'
        }
      })

      const dates = $('.fc-head .fc-time-area tr:first-child > th[data-date]')
        .map(function(i, node) {
          return new Date($(node).data('date'))
        })
        .get()

      expect(dates.length).toBe(2)
      expect(dates[0]).toEqualDate('2017-01-01')
      expect(dates[1]).toEqualDate('2018-01-01')
    })
  })


  describe('in vertical resource view', function() {
    pushOptions({
      defaultView: 'timeGrid',
      datesAboveResources: true
    })

    it('renders range correctly', function() {
      initCalendar({
        visibleRange: {
          start: '2017-06-07',
          end: '2017-06-09'
        }
      })

      const dates = $('.fc-head tr:first-child > th[data-date]')
        .map(function(i, node) {
          return new Date($(node).data('date'))
        })
        .get()

      expect(dates.length).toBe(2)
      expect(dates[0]).toEqualDate('2017-06-07')
      expect(dates[1]).toEqualDate('2017-06-08')
    })
  })
})
