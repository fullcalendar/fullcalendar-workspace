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
            point: getTimeGridPoint('2015-11-23T09:00:00Z'),
            callback() {
              expect(dayClickCalled).toBe(true)
              done()
            }
          })
        },
        dayClick(arg) {
          dayClickCalled = true
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
      defaultView: 'agendaThreeDay',
      groupByResource: true
    })

    it('allows a resource click', function(done) {
      let dayClickCalled = false
      initCalendar({
        eventAfterAllRender() {
          $.simulateByPoint('drag', {
            point: getResourceTimeGridPoint('b', '2015-11-29T09:00:00Z'),
            callback() {
              expect(dayClickCalled).toBe(true)
              done()
            }
          })
        },
        dayClick(arg) {
          dayClickCalled = true
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
      defaultView: 'agendaThreeDay',
      groupByDateAndResource: true
    })

    it('allows a resource click', function(done) {
      let dayClickCalled = false
      initCalendar({
        eventAfterAllRender() {
          $.simulateByPoint('drag', {
            point: getResourceTimeGridPoint('b', '2015-11-30T09:30:00Z'),
            callback() {
              expect(dayClickCalled).toBe(true)
              done()
            }
          })
        },
        dayClick(arg) {
          dayClickCalled = true
          expect(arg.date).toEqualDate('2015-11-30T09:30:00Z')
          expect(typeof arg.jsEvent).toBe('object')
          expect(typeof arg.view).toBe('object')
          expect(arg.resource.id).toBe('b')
        }
      })
    })
  })
})
