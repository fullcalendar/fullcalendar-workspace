import { getRectCenter } from 'package-tests/lib/geom'
import { getTrailingBoundingRect } from 'package-tests/lib/dom-geom'
import { getDayGridDayEls } from 'package-tests/lib/day-grid'

describe('dayGrid-view event resizing', function() {
  pushOptions({
    now: '2015-11-28',
    editable: true,
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

    it('allows non-resource resizing', function(done) {
      let resizeCalled = false
      let afterRenderCalled = false
      initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-23' }
        ],
        _eventsPositioned() {
          if (afterRenderCalled) {
            return
          }
          afterRenderCalled = true
          $('.event1').simulate('mouseover') // resizer only shows on hover
          $('.event1 .fc-resizer')
            .simulate('drag', {
              end: getDayGridDayEls('2015-11-24').eq(0),
              callback() {
                expect(resizeCalled).toBe(true)
                done()
              }
            })
        },
        eventResize(arg) {
          resizeCalled = true
          expect(arg.event.start).toEqualDate('2015-11-23')
          expect(arg.event.end).toEqualDate('2015-11-25')

          let resources = arg.event.getResources()
          expect(resources.length).toBe(0)
        }
      })
    })
  })

  describe('with resource columns above date columns', function() {
    pushOptions({
      defaultView: 'resourceDayGridThreeDay'
    })

    it('allows resizing', function(done) {
      let resizeCalled = false
      let afterRenderCalled = false
      initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-29', resourceId: 'a' }
        ],
        _eventsPositioned() {
          if (afterRenderCalled) {
            return
          }
          afterRenderCalled = true
          $('.event1').simulate('mouseover') // resizer only shows on hover
          $('.event1 .fc-resizer')
            .simulate('drag', {
              end: getDayGridDayEls('2015-11-30').eq(0),
              callback() {
                expect(resizeCalled).toBe(true)
                done()
              }
            })
        },
        eventResize(arg) {
          resizeCalled = true
          expect(arg.event.start).toEqualDate('2015-11-29')
          expect(arg.event.end).toEqualDate('2015-12-01')

          let resources = arg.event.getResources()
          expect(resources.length).toBe(1)
          expect(resources[0].id).toBe('a')
        }
      })
    })

    it('disallows resizing across resources', function(done) {
      let resizeCalled = false
      let afterRenderCalled = false
      initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-29', resourceId: 'a' }
        ],
        _eventsPositioned() {
          if (afterRenderCalled) {
            return
          }
          afterRenderCalled = true
          const bMonRect = getTrailingBoundingRect(getDayGridDayEls('2015-11-30'))
          $('.event1').simulate('mouseover') // resizer only shows on hover
          $('.event1 .fc-resizer')
            .simulate('drag', {
              end: getRectCenter(bMonRect),
              callback() {
                expect(resizeCalled).toBe(false)
                done()
              }
            })
        },
        eventResize(arg) {
          resizeCalled = true
        }
      })
    })
  })

  describe('with date columns above resource columns', function() {
    pushOptions({
      defaultView: 'resourceDayGridThreeDay',
      datesAboveResources: true
    })

    it('allows resizing', function(done) {
      let resizeCalled = false
      let afterRenderCalled = false
      initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-28', resourceId: 'b' }
        ],
        _eventsPositioned() {
          if (afterRenderCalled) {
            return
          }
          afterRenderCalled = true
          const bMonRect = getTrailingBoundingRect(getDayGridDayEls('2015-11-30'))
          $('.event1').simulate('mouseover') // resizer only shows on hover
          $('.event1 .fc-resizer')
            .simulate('drag', {
              end: getRectCenter(bMonRect),
              callback() {
                expect(resizeCalled).toBe(true)
                done()
              }
            }
            )
        },
        eventResize(arg) {
          resizeCalled = true
          expect(arg.event.start).toEqualDate('2015-11-28')
          expect(arg.event.end).toEqualDate('2015-12-01')

          let resources = arg.event.getResources()
          expect(resources.length).toBe(1)
          expect(resources[0].id).toBe('b')
        }
      })
    })

    it('disallows resizing across resources', function(done) {
      let resizeCalled = false
      let afterRenderCalled = false
      initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-28', resourceId: 'a' }
        ],
        _eventsPositioned() {
          if (afterRenderCalled) {
            return
          }
          afterRenderCalled = true
          const bMonRect = getTrailingBoundingRect(getDayGridDayEls('2015-11-30'))
          $('.event1').simulate('mouseover') // resizer only shows on hover
          $('.event1 .fc-resizer')
            .simulate('drag', {
              end: getRectCenter(bMonRect),
              callback() {
                expect(resizeCalled).toBe(false)
                done()
              }
            })
        },
        eventResize(arg) {
          resizeCalled = true
        }
      })
    })
  })
})
