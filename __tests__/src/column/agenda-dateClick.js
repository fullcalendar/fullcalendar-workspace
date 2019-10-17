import { getTimeGridPoint } from 'package-tests/lib/time-grid'
import { getResourceTimeGridPoint } from '../lib/time-grid'

describe('timeGrid-view dateClick', function() {
  pushOptions({
    now: '2015-11-28',
    scrollTime: '00:00',
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' }
    ],
    views: {
      resourceTimeGridThreeDay: {
        type: 'resourceTimeGrid',
        duration: { days: 3 }
      }
    }
  })

  describe('when there are no resource columns', function() {
    pushOptions({
      defaultView: 'timeGridWeek'
    })

    it('allows non-resource clicks', function(done) {
      let dateClickCalled = false

      initCalendar({
        _eventsPositioned() {
          $.simulateByPoint('drag', {
            point: getTimeGridPoint('2015-11-23T09:00:00'),
            callback() {
              expect(dateClickCalled).toBe(true)
              done()
            }
          })
        },
        dateClick(arg) {
          dateClickCalled = true
          expect(arg.date).toEqualDate('2015-11-23T09:00:00Z')
          expect(typeof arg.jsEvent).toBe('object')
          expect(typeof arg.view).toBe('object')
          expect(arg.resource).toBeFalsy()
        }
      })
    })
  })

  describe('with resource columns above date columns', function() {
    pushOptions({
      defaultView: 'resourceTimeGridThreeDay'
    })

    it('allows a resource click', function(done) {
      let dateClickCalled = false
      initCalendar({
        _eventsPositioned() {
          $.simulateByPoint('drag', {
            point: getResourceTimeGridPoint('b', '2015-11-29T09:00:00Z'),
            callback() {
              expect(dateClickCalled).toBe(true)
              done()
            }
          })
        },
        dateClick(arg) {
          dateClickCalled = true
          expect(arg.date).toEqualDate('2015-11-29T09:00:00Z')
          expect(typeof arg.jsEvent).toBe('object')
          expect(typeof arg.view).toBe('object')
          expect(arg.resource.id).toBe('b')
        }
      })
    })
  })

  describe('with date columns above resource columns', function() {
    pushOptions({
      defaultView: 'resourceTimeGridThreeDay',
      datesAboveResources: true
    })

    it('allows a resource click', function(done) {
      let dateClickCalled = false
      initCalendar({
        _eventsPositioned() {
          $.simulateByPoint('drag', {
            point: getResourceTimeGridPoint('b', '2015-11-30T09:30:00Z'),
            callback() {
              expect(dateClickCalled).toBe(true)
              done()
            }
          })
        },
        dateClick(arg) {
          dateClickCalled = true
          expect(arg.date).toEqualDate('2015-11-30T09:30:00Z')
          expect(typeof arg.jsEvent).toBe('object')
          expect(typeof arg.view).toBe('object')
          expect(arg.resource.id).toBe('b')
        }
      })
    })
  })
})
