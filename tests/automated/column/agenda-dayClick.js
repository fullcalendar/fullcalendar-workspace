import { getTimeGridPoint } from 'fullcalendar/tests/automated/lib/time-grid'
import { getResourceTimeGridPoint } from '../lib/time-grid'

describe('agenda-view dayClick', function() {
  pushOptions({
    now: '2015-11-28',
    scrollTime: '00:00',
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

    it('allows non-resource clicks', function(done) {
      let dayClickCalled = false

      initCalendar({
        eventAfterAllRender() {
          $.simulateByPoint('drag', {
            point: getTimeGridPoint('2015-11-23T09:00:00'),
            callback() {
              expect(dayClickCalled).toBe(true)
              done()
            }
          })
        },
        dayClick(date, jsEvent, view, resource) {
          dayClickCalled = true
          expect(date).toEqualMoment('2015-11-23T09:00:00')
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

    it('allows a resource click', function(done) {
      let dayClickCalled = false
      initCalendar({
        eventAfterAllRender() {
          $.simulateByPoint('drag', {
            point: getResourceTimeGridPoint('b', '2015-11-29T09:00:00'),
            callback() {
              expect(dayClickCalled).toBe(true)
              done()
            }
          })
        },
        dayClick(date, jsEvent, view, resource) {
          dayClickCalled = true
          expect(date).toEqualMoment('2015-11-29T09:00:00')
          expect(typeof jsEvent).toBe('object')
          expect(typeof view).toBe('object')
          expect(resource.id).toBe('b')
        }
      })
    })
  })

  describe('with date columns above resource columns', function() {
    pushOptions({
      defaultView: 'agendaThreeDay',
      groupByDateAndResource: true
    })

    it('allows a resource click', function(done) {
      let dayClickCalled = false
      initCalendar({
        eventAfterAllRender() {
          $.simulateByPoint('drag', {
            point: getResourceTimeGridPoint('b', '2015-11-30T09:30:00'),
            callback() {
              expect(dayClickCalled).toBe(true)
              done()
            }
          })
        },
        dayClick(date, jsEvent, view, resource) {
          dayClickCalled = true
          expect(date).toEqualMoment('2015-11-30T09:30:00')
          expect(typeof jsEvent).toBe('object')
          expect(typeof view).toBe('object')
          expect(resource.id).toBe('b')
        }
      })
    })
  })
})
