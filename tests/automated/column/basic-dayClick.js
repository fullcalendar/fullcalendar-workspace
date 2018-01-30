import { getLeadingBoundingRect, sortBoundingRects } from 'fullcalendar/tests/automated/lib/dom-geom'
import { getDayGridDowEls } from 'fullcalendar/tests/automated/lib/day-grid'

describe('basic-view dayClick', function() {
  pushOptions({
    now: '2015-11-28',
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' }
    ],
    views: {
      basicThreeDay: {
        type: 'basic',
        duration: { days: 3 }
      }
    }
  })

  describe('when there are no resource columns', function() {
    pushOptions({
      defaultView: 'basicWeek',
      groupByResource: false
    })

    it('allows non-resource clicks', function(done) {
      let dayClickCalled = false
      initCalendar({
        eventAfterAllRender() {
          const monEls = getDayGridDowEls('mon')
          expect(monEls.length).toBe(1)
          monEls.eq(0).simulate('drag', {
            callback() {
              expect(dayClickCalled).toBe(true)
              done()
            }
          })
        },
        dayClick(date, jsEvent, view, resource) {
          dayClickCalled = true
          expect(date).toEqualMoment('2015-11-23')
          expect(typeof jsEvent).toBe('object')
          expect(typeof view).toBe('object')
          expect(resource).toBeFalsy()
        }
      })
    })
  })

  describe('with resource columns above date columns', function() {
    pushOptions({
      defaultView: 'basicThreeDay',
      groupByResource: true
    })

    it('allows a resource click', function(done) {
      let dayClickCalled = false
      initCalendar({
        eventAfterAllRender() {
          const sunAEl = $(getLeadingBoundingRect(getDayGridDowEls('sun')).node)
          sunAEl.simulate('drag', {
            callback() {
              expect(dayClickCalled).toBe(true)
              done()
            }
          })
        },
        dayClick(date, jsEvent, view, resource) {
          dayClickCalled = true
          expect(date).toEqualMoment('2015-11-29')
          expect(typeof jsEvent).toBe('object')
          expect(typeof view).toBe('object')
          expect(resource.id).toBe('a')
        }
      })
    })
  })

  describe('with date columns above resource columns', function() {
    pushOptions({
      defaultView: 'basicThreeDay',
      groupByDateAndResource: true
    })

    it('allows a resource click', function(done) {
      let dayClickCalled = false
      initCalendar({
        eventAfterAllRender() {
          const rects = sortBoundingRects(getDayGridDowEls('mon'))
          const monBEl = $(rects[1].node)
          monBEl.simulate('drag', {
            callback() {
              expect(dayClickCalled).toBe(true)
              done()
            }
          })
        },
        dayClick(date, jsEvent, view, resource) {
          dayClickCalled = true
          expect(date).toEqualMoment('2015-11-30')
          expect(typeof jsEvent).toBe('object')
          expect(typeof view).toBe('object')
          expect(resource.id).toBe('b')
        }
      })
    })
  })
})
