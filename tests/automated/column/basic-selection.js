import { getLeadingBoundingRect, getTrailingBoundingRect, sortBoundingRects } from 'fullcalendar/tests/automated/lib/dom-geom'
import { getDayGridDowEls } from 'fullcalendar/tests/automated/lib/day-grid'

describe('basic-view selection', function() {
  pushOptions({
    now: '2015-11-28',
    selectable: true,
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

    it('allows non-resource selects', function(done) {
      let selectCalled = false
      initCalendar({
        eventAfterAllRender() {
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
            }
            )
        },
        select(start, end, jsEvent, view, resource) {
          selectCalled = true
          expect(start).toEqualMoment('2015-11-23')
          expect(end).toEqualMoment('2015-11-25')
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

    it('allows a resource selects', function(done) {
      let selectCalled = false
      initCalendar({
        eventAfterAllRender() {
          const sunAEl = $(getLeadingBoundingRect(getDayGridDowEls('sun')).node)
          const monAEl = $(getLeadingBoundingRect(getDayGridDowEls('mon')).node)
          sunAEl.simulate('drag', {
            end: monAEl,
            callback() {
              expect(selectCalled).toBe(true)
              done()
            }
          }
          )
        },
        select(start, end, jsEvent, view, resource) {
          selectCalled = true
          expect(start).toEqualMoment('2015-11-29')
          expect(end).toEqualMoment('2015-12-01')
          expect(typeof jsEvent).toBe('object')
          expect(typeof view).toBe('object')
          expect(resource.id).toBe('a')
        }
      })
    })

    it('disallows a selection across resources', function(done) {
      let selectCalled = false
      initCalendar({
        eventAfterAllRender() {
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
        select(start, end, jsEvent, view, resource) {
          selectCalled = true
        }
      })
    })
  })

  describe('with date columns above resource columns', function() {
    pushOptions({
      defaultView: 'basicThreeDay',
      groupByDateAndResource: true
    })

    it('allows a resource selection', function(done) {
      let selectCalled = false
      initCalendar({
        eventAfterAllRender() {
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
        select(start, end, jsEvent, view, resource) {
          selectCalled = true
          expect(start).toEqualMoment('2015-11-28')
          expect(end).toEqualMoment('2015-12-01')
          expect(typeof jsEvent).toBe('object')
          expect(typeof view).toBe('object')
          expect(resource.id).toBe('b')
        }
      })
    })

    it('disallows a selection across resources', function(done) {
      let selectCalled = false
      initCalendar({
        eventAfterAllRender() {
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
        select(start, end, jsEvent, view, resource) {
          selectCalled = true
        }
      })
    })
  })
})
