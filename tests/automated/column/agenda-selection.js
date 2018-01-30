import { getTimeGridPoint } from 'fullcalendar/tests/automated/lib/time-grid'
import { getResourceTimeGridPoint } from '../lib/time-grid'

describe('agenda-view selection', function() {
  pushOptions({
    now: '2015-11-28',
    scrollTime: '00:00',
    selectable: true,
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' }
    ],
    views: {
      agendaThreeDay: {
        type: 'agenda',
        duration: { days: 3 }
      }
    }
  })

  describe('when there are no resource columns', function() {
    pushOptions({
      defaultView: 'agendaWeek',
      groupByResource: false
    })

    it('allows non-resource selection', function(done) {
      let selectCalled = false
      initCalendar({
        eventAfterAllRender() {
          $.simulateByPoint('drag', {
            point: getTimeGridPoint('2015-11-23T02:00:00'),
            end: getTimeGridPoint('2015-11-23T04:00:00'),
            callback() {
              expect(selectCalled).toBe(true)
              done()
            }
          })
        },
        select(start, end, jsEvent, view, resource) {
          selectCalled = true
          expect(start).toEqualMoment('2015-11-23T02:00:00')
          expect(end).toEqualMoment('2015-11-23T04:30:00')
          expect(typeof jsEvent).toBe('object')
          expect(typeof view).toBe('object')
          expect(resource).toBeFalsy()
        }
      })
    })
  })

  describe('with resource columns above date columns', function() {
    pushOptions({
      defaultView: 'agendaThreeDay',
      groupByResource: true
    })

    it('allows a same-day resource selection', function(done) {
      let selectCalled = false
      initCalendar({
        eventAfterAllRender() {
          $.simulateByPoint('drag', {
            point: getResourceTimeGridPoint('b', '2015-11-29T02:00:00'),
            end: getResourceTimeGridPoint('b', '2015-11-29T04:00:00'),
            callback() {
              expect(selectCalled).toBe(true)
              done()
            }
          })
        },
        select(start, end, jsEvent, view, resource) {
          selectCalled = true
          expect(start).toEqualMoment('2015-11-29T02:00:00')
          expect(end).toEqualMoment('2015-11-29T04:30:00')
          expect(typeof jsEvent).toBe('object')
          expect(typeof view).toBe('object')
          expect(resource.id).toBe('b')
        }
      })
    })

    it('allows a different-day resource selection', function(done) {
      let selectCalled = false
      initCalendar({
        eventAfterAllRender() {
          $.simulateByPoint('drag', {
            point: getResourceTimeGridPoint('b', '2015-11-29T02:00:00'),
            end: getResourceTimeGridPoint('b', '2015-11-30T04:00:00'),
            callback() {
              expect(selectCalled).toBe(true)
              done()
            }
          })
        },
        select(start, end, jsEvent, view, resource) {
          selectCalled = true
          expect(start).toEqualMoment('2015-11-29T02:00:00')
          expect(end).toEqualMoment('2015-11-30T04:30:00')
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
          $.simulateByPoint('drag', {
            point: getResourceTimeGridPoint('a', '2015-11-29T02:00:00'),
            end: getResourceTimeGridPoint('b', '2015-11-30T04:00:00'),
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
      defaultView: 'agendaThreeDay',
      groupByDateAndResource: true
    })

    it('allows a same-day resource selection', function(done) {
      let selectCalled = false
      initCalendar({
        eventAfterAllRender() {
          $.simulateByPoint('drag', {
            point: getResourceTimeGridPoint('b', '2015-11-30T02:00:00'),
            end: getResourceTimeGridPoint('b', '2015-11-30T04:00:00'),
            callback() {
              expect(selectCalled).toBe(true)
              done()
            }
          })
        },
        select(start, end, jsEvent, view, resource) {
          selectCalled = true
          expect(start).toEqualMoment('2015-11-30T02:00:00')
          expect(end).toEqualMoment('2015-11-30T04:30:00')
          expect(typeof jsEvent).toBe('object')
          expect(typeof view).toBe('object')
          expect(resource.id).toBe('b')
        }
      })
    })

    it('allows a multi-day resource selection', function(done) {
      let selectCalled = false
      initCalendar({
        eventAfterAllRender() {
          $.simulateByPoint('drag', {
            point: getResourceTimeGridPoint('b', '2015-11-30T02:00:00'),
            end: getResourceTimeGridPoint('b', '2015-11-29T04:00:00'),
            callback() {
              expect(selectCalled).toBe(true)
              done()
            }
          })
        },
        select(start, end, jsEvent, view, resource) {
          selectCalled = true
          expect(start).toEqualMoment('2015-11-29T04:00:00')
          expect(end).toEqualMoment('2015-11-30T02:30:00')
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
          $.simulateByPoint('drag', {
            point: getResourceTimeGridPoint('a', '2015-11-29T02:00:00'),
            end: getResourceTimeGridPoint('b', '2015-11-29T04:00:00'),
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
