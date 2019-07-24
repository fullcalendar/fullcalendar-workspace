import { getTimeGridPoint } from 'package-tests/lib/time-grid'
import { getResourceTimeGridPoint } from '../lib/time-grid'

describe('timeGrid-view selection', function() {
  pushOptions({
    now: '2015-11-28',
    scrollTime: '00:00',
    selectable: true,
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

    it('allows non-resource selection', function(done) {
      let selectCalled = false
      initCalendar({
        _eventsPositioned() {
          $.simulateByPoint('drag', {
            point: getTimeGridPoint('2015-11-23T02:00:00'),
            end: getTimeGridPoint('2015-11-23T04:00:00'),
            callback() {
              expect(selectCalled).toBe(true)
              done()
            }
          })
        },
        select(arg) {
          selectCalled = true
          expect(arg.start).toEqualDate('2015-11-23T02:00:00Z')
          expect(arg.end).toEqualDate('2015-11-23T04:30:00Z')
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

    it('allows a same-day resource selection', function(done) {
      let selectCalled = false
      initCalendar({
        _eventsPositioned() {
          $.simulateByPoint('drag', {
            point: getResourceTimeGridPoint('b', '2015-11-29T02:00:00'),
            end: getResourceTimeGridPoint('b', '2015-11-29T04:00:00'),
            callback() {
              expect(selectCalled).toBe(true)
              done()
            }
          })
        },
        select(arg) {
          selectCalled = true
          expect(arg.start).toEqualDate('2015-11-29T02:00:00Z')
          expect(arg.end).toEqualDate('2015-11-29T04:30:00Z')
          expect(typeof arg.jsEvent).toBe('object')
          expect(typeof arg.view).toBe('object')
          expect(arg.resource.id).toBe('b')
        }
      })
    })

    it('allows a different-day resource selection', function(done) {
      let selectCalled = false
      initCalendar({
        _eventsPositioned() {
          $.simulateByPoint('drag', {
            point: getResourceTimeGridPoint('b', '2015-11-29T02:00:00'),
            end: getResourceTimeGridPoint('b', '2015-11-30T04:00:00'),
            callback() {
              expect(selectCalled).toBe(true)
              done()
            }
          })
        },
        select(arg) {
          selectCalled = true
          expect(arg.start).toEqualDate('2015-11-29T02:00:00Z')
          expect(arg.end).toEqualDate('2015-11-30T04:30:00Z')
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
          $.simulateByPoint('drag', {
            point: getResourceTimeGridPoint('a', '2015-11-29T02:00:00'),
            end: getResourceTimeGridPoint('b', '2015-11-30T04:00:00'),
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
      defaultView: 'resourceTimeGridThreeDay',
      datesAboveResources: true
    })

    it('allows a same-day resource selection', function(done) {
      let selectCalled = false
      initCalendar({
        _eventsPositioned() {
          $.simulateByPoint('drag', {
            point: getResourceTimeGridPoint('b', '2015-11-30T02:00:00'),
            end: getResourceTimeGridPoint('b', '2015-11-30T04:00:00'),
            callback() {
              expect(selectCalled).toBe(true)
              done()
            }
          })
        },
        select(arg) {
          selectCalled = true
          expect(arg.start).toEqualDate('2015-11-30T02:00:00Z')
          expect(arg.end).toEqualDate('2015-11-30T04:30:00Z')
          expect(typeof arg.jsEvent).toBe('object')
          expect(typeof arg.view).toBe('object')
          expect(arg.resource.id).toBe('b')
        }
      })
    })

    it('allows a multi-day resource selection', function(done) {
      let selectCalled = false
      initCalendar({
        _eventsPositioned() {
          $.simulateByPoint('drag', {
            point: getResourceTimeGridPoint('b', '2015-11-30T02:00:00'),
            end: getResourceTimeGridPoint('b', '2015-11-29T04:00:00'),
            callback() {
              expect(selectCalled).toBe(true)
              done()
            }
          })
        },
        select(arg) {
          selectCalled = true
          expect(arg.start).toEqualDate('2015-11-29T04:00:00Z')
          expect(arg.end).toEqualDate('2015-11-30T02:30:00Z')
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
          $.simulateByPoint('drag', {
            point: getResourceTimeGridPoint('a', '2015-11-29T02:00:00'),
            end: getResourceTimeGridPoint('b', '2015-11-29T04:00:00'),
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
