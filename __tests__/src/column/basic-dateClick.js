import { getLeadingBoundingRect, sortBoundingRects } from 'package-tests/lib/dom-geom'
import { getDayGridDowEls } from 'package-tests/lib/day-grid'

describe('dayGrid-view dateClick', function() {
  pushOptions({
    now: '2015-11-28',
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' }
    ],
    views: {
      resourceDayGridThreeDay: {
        type: 'resourceDayGrid',
        duration: { days: 3 }
      }
    }
  })

  describe('when there are no resource columns', function() {
    pushOptions({
      defaultView: 'dayGridWeek'
    })

    it('allows non-resource clicks', function(done) {
      let dateClickCalled = false
      initCalendar({
        _eventsPositioned() {
          const monEls = getDayGridDowEls('mon')
          expect(monEls.length).toBe(1)
          monEls.eq(0).simulate('drag', {
            callback() {
              expect(dateClickCalled).toBe(true)
              done()
            }
          })
        },
        dateClick(arg) {
          dateClickCalled = true
          expect(arg.date).toEqualDate('2015-11-23')
          expect(typeof arg.jsEvent).toBe('object')
          expect(typeof arg.view).toBe('object')
          expect(arg.resource).toBeFalsy()
        }
      })
    })
  })

  describe('with resource columns above date columns', function() {
    pushOptions({
      defaultView: 'resourceDayGridThreeDay'
    })

    it('allows a resource click', function(done) {
      let dateClickCalled = false
      initCalendar({
        _eventsPositioned() {
          const sunAEl = $(getLeadingBoundingRect(getDayGridDowEls('sun')).node)
          sunAEl.simulate('drag', {
            callback() {
              expect(dateClickCalled).toBe(true)
              done()
            }
          })
        },
        dateClick(arg) {
          dateClickCalled = true
          expect(arg.date).toEqualDate('2015-11-29')
          expect(typeof arg.jsEvent).toBe('object')
          expect(typeof arg.view).toBe('object')
          expect(arg.resource.id).toBe('a')
        }
      })
    })
  })

  describe('with date columns above resource columns', function() {
    pushOptions({
      defaultView: 'resourceDayGridThreeDay',
      datesAboveResources: true
    })

    it('allows a resource click', function(done) {
      let dateClickCalled = false
      initCalendar({
        _eventsPositioned() {
          const rects = sortBoundingRects(getDayGridDowEls('mon'))
          const monBEl = $(rects[1].node)
          monBEl.simulate('drag', {
            callback() {
              expect(dateClickCalled).toBe(true)
              done()
            }
          })
        },
        dateClick(arg) {
          dateClickCalled = true
          expect(arg.date).toEqualDate('2015-11-30')
          expect(typeof arg.jsEvent).toBe('object')
          expect(typeof arg.view).toBe('object')
          expect(arg.resource.id).toBe('b')
        }
      })
    })
  })
})
