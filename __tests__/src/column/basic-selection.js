import { getLeadingBoundingRect, getTrailingBoundingRect, sortBoundingRects } from 'package-tests/lib/dom-geom'
import { getDayGridDowEls } from 'package-tests/lib/day-grid'

describe('dayGrid-view selection', function() {
  pushOptions({
    now: '2015-11-28',
    selectable: true,
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

    it('allows non-resource selects', function(done) {
      let selectCalled = false

      initCalendar({
        _eventsPositioned() {
          const monEls = getDayGridDowEls('mon')
          const tueEls = getDayGridDowEls('tue')
          expect(monEls.length).toBe(1)
          expect(tueEls.length).toBe(1)
          monEls.eq(0)
            .simulate('drag', {
              end: tueEls.eq(0),
              callback() {
                expect(selectCalled).toBe(true)
                done()
              }
            })
        },
        select(arg) {
          selectCalled = true
          expect(arg.start).toEqualDate('2015-11-23')
          expect(arg.end).toEqualDate('2015-11-25')
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

    it('allows a resource selects', function(done) {
      let selectCalled = false

      initCalendar({
        _eventsPositioned() {
          const sunAEl = $(getLeadingBoundingRect(getDayGridDowEls('sun')).node)
          const monAEl = $(getLeadingBoundingRect(getDayGridDowEls('mon')).node)
          sunAEl.simulate('drag', {
            end: monAEl,
            callback() {
              expect(selectCalled).toBe(true)
              done()
            }
          })
        },
        select(arg) {
          selectCalled = true
          expect(arg.start).toEqualDate('2015-11-29')
          expect(arg.end).toEqualDate('2015-12-01')
          expect(typeof arg.jsEvent).toBe('object')
          expect(typeof arg.view).toBe('object')
          expect(arg.resource.id).toBe('a')
        }
      })
    })

    it('disallows a selection across resources', function(done) {
      let selectCalled = false

      initCalendar({
        _eventsPositioned() {
          const sunAEl = $(getLeadingBoundingRect(getDayGridDowEls('sun')).node)
          const monBEl = $(getTrailingBoundingRect(getDayGridDowEls('mon')).node)
          sunAEl.simulate('drag', {
            end: monBEl,
            callback() {
              expect(selectCalled).toBe(false)
              done()
            }
          })
        },
        select(arg) {
          selectCalled = true
        }
      })
    })
  })

  describe('with date columns above resource columns', function() {
    pushOptions({
      defaultView: 'resourceDayGridThreeDay',
      datesAboveResources: true
    })

    it('allows a resource selection', function(done) {
      let selectCalled = false

      initCalendar({
        _eventsPositioned() {
          const monRects = sortBoundingRects(getDayGridDowEls('mon'))
          const monBEl = $(monRects[1].node)
          const satRects = sortBoundingRects(getDayGridDowEls('sat'))
          const satBEl = $(satRects[1].node)
          monBEl.simulate('drag', {
            end: satBEl,
            callback() {
              expect(selectCalled).toBe(true)
              done()
            }
          })
        },
        select(arg) {
          selectCalled = true
          expect(arg.start).toEqualDate('2015-11-28')
          expect(arg.end).toEqualDate('2015-12-01')
          expect(typeof arg.jsEvent).toBe('object')
          expect(typeof arg.view).toBe('object')
          expect(arg.resource.id).toBe('b')
        }
      })
    })

    it('disallows a selection across resources', function(done) {
      let selectCalled = false

      initCalendar({
        _eventsPositioned() {
          const monRects = sortBoundingRects(getDayGridDowEls('mon'))
          const monBEl = $(monRects[1].node)
          const satRects = sortBoundingRects(getDayGridDowEls('sat'))
          const satAEl = $(satRects[0].node)
          monBEl.simulate('drag', {
            end: satAEl,
            callback() {
              expect(selectCalled).toBe(false)
              done()
            }
          })
        },
        select(arg) {
          selectCalled = true
        }
      })
    })
  })
})
