import { getRectCenter } from 'standard-tests/src/lib/geom'
import { getTrailingBoundingRect } from 'standard-tests/src/lib/dom-geom'
import DayGridViewWrapper from 'standard-tests/src/lib/wrappers/DayGridViewWrapper'

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
      let calendar = initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-23' }
        ],
        eventResize(arg) {
          resizeCalled = true
          expect(arg.event.start).toEqualDate('2015-11-23')
          expect(arg.event.end).toEqualDate('2015-11-25')

          let resources = arg.event.getResources()
          expect(resources.length).toBe(0)
        }
      })
      let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid

      $('.event1').simulate('mouseover') // resizer only shows on hover
      $('.event1 .fc-resizer')
        .simulate('drag', {
          end: dayGridWrapper.getDayEls('2015-11-24')[0],
          callback() {
            expect(resizeCalled).toBe(true)
            done()
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
      let calendar = initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-29', resourceId: 'a' }
        ],
        eventResize(arg) {
          resizeCalled = true
          expect(arg.event.start).toEqualDate('2015-11-29')
          expect(arg.event.end).toEqualDate('2015-12-01')

          let resources = arg.event.getResources()
          expect(resources.length).toBe(1)
          expect(resources[0].id).toBe('a')
        }
      })
      let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid

      $('.event1').simulate('mouseover') // resizer only shows on hover
      $('.event1 .fc-resizer')
        .simulate('drag', {
          end: dayGridWrapper.getDayEls('2015-11-30')[0],
          callback() {
            expect(resizeCalled).toBe(true)
            done()
          }
        })
    })

    it('disallows resizing across resources', function(done) {
      let resizeCalled = false
      let calendar = initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-29', resourceId: 'a' }
        ],
        eventResize(arg) {
          resizeCalled = true
        }
      })
      let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid

      const bMonRect = getTrailingBoundingRect(dayGridWrapper.getDayEls('2015-11-30'))
      $('.event1').simulate('mouseover') // resizer only shows on hover
      $('.event1 .fc-resizer')
        .simulate('drag', {
          end: getRectCenter(bMonRect),
          callback() {
            expect(resizeCalled).toBe(false)
            done()
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
      let calendar = initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-28', resourceId: 'b' }
        ],
        eventResize(arg) {
          resizeCalled = true
          expect(arg.event.start).toEqualDate('2015-11-28')
          expect(arg.event.end).toEqualDate('2015-12-01')

          let resources = arg.event.getResources()
          expect(resources.length).toBe(1)
          expect(resources[0].id).toBe('b')
        }
      })
      let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid

      const bMonRect = getTrailingBoundingRect(dayGridWrapper.getDayEls('2015-11-30'))
      $('.event1').simulate('mouseover') // resizer only shows on hover
      $('.event1 .fc-resizer')
        .simulate('drag', {
          end: getRectCenter(bMonRect),
          callback() {
            expect(resizeCalled).toBe(true)
            done()
          }
        })
    })

    it('disallows resizing across resources', function(done) {
      let resizeCalled = false
      let calendar = initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-28', resourceId: 'a' }
        ],
        eventResize() {
          resizeCalled = true
        }
      })
      let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid

      const bMonRect = getTrailingBoundingRect(dayGridWrapper.getDayEls('2015-11-30'))
      $('.event1').simulate('mouseover') // resizer only shows on hover
      $('.event1 .fc-resizer')
        .simulate('drag', {
          end: getRectCenter(bMonRect),
          callback() {
            expect(resizeCalled).toBe(false)
            done()
          }
        })
    })
  })
})
