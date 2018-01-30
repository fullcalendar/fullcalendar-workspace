import { getTimeGridPoint } from 'fullcalendar/tests/automated/lib/time-grid'
import { getResourceTimeGridPoint } from '../lib/time-grid'

describe('agenda-view event resizing', function() {
  pushOptions({
    now: '2015-11-28',
    scrollTime: '00:00',
    editable: true,
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

    it('allows non-resource resize', function(done) {
      let resizeSpy
      initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-23T02:00:00', end: '2015-11-23T03:00:00' }
        ],
        eventAfterAllRender: oneCall(function() {
          $('.event1').simulate('mouseover') // resizer only shows on hover
          $('.event1 .fc-resizer')
            .simulate('drag', {
              end: getTimeGridPoint('2015-11-23T04:00:00'),
              callback() {
                expect(resizeSpy).toHaveBeenCalled()
                done()
              }
            }
            )
        }),
        eventResize:
          (resizeSpy = spyCall(function(event) {
            expect(event.start).toEqualMoment('2015-11-23T02:00:00')
            expect(event.end).toEqualMoment('2015-11-23T04:30:00')
            const resource = currentCalendar.getEventResource(event)
            expect(resource).toBeFalsy()
          }))
      })
    })
  })

  describe('with resource columns above date columns', function() {
    pushOptions({
      defaultView: 'agendaThreeDay',
      groupByResource: true
    })

    it('allows a same-day resize', function(done) {
      let resizeSpy
      initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'b' }
        ],
        eventAfterAllRender: oneCall(function() { // avoid second call after event rerender
          $('.event1').simulate('mouseover') // resizer only shows on hover
          $('.event1 .fc-resizer')
            .simulate('drag', {
              end: getResourceTimeGridPoint('b', '2015-11-29T04:00:00'),
              callback() {
                expect(resizeSpy).toHaveBeenCalled()
                done()
              }
            }
            )
        }),
        eventResize:
          (resizeSpy = spyCall(function(event) {
            expect(event.start).toEqualMoment('2015-11-29T02:00:00')
            expect(event.end).toEqualMoment('2015-11-29T04:30:00')
            const resource = currentCalendar.getEventResource(event)
            expect(resource.id).toBe('b')
          }))
      })
    })

    it('allows a different-day resize', function(done) {
      let resizeSpy
      initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'b' }
        ],
        eventAfterAllRender: oneCall(function() {
          $('.event1').simulate('mouseover') // resizer only shows on hover
          $('.event1 .fc-resizer')
            .simulate('drag', {
              end: getResourceTimeGridPoint('b', '2015-11-30T04:00:00'),
              callback() {
                expect(resizeSpy).toHaveBeenCalled()
                done()
              }
            })
        }),
        eventResize:
          (resizeSpy = spyCall(function(event) {
            expect(event.start).toEqualMoment('2015-11-29T02:00:00')
            expect(event.end).toEqualMoment('2015-11-30T04:30:00')
            const resource = currentCalendar.getEventResource(event)
            expect(resource.id).toBe('b')
          }))
      })
    })

    it('disallows a resize across resources', function(done) {
      let resizeSpy
      initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'a' }
        ],
        eventAfterAllRender: oneCall(function() {
          $('.event1').simulate('mouseover') // resizer only shows on hover
          $('.event1 .fc-resizer')
            .simulate('drag', {
              end: getResourceTimeGridPoint('b', '2015-11-30T04:00:00'),
              callback() {
                expect(resizeSpy).not.toHaveBeenCalled()
                done()
              }
            }
            )
        }),
        eventResize:
          (resizeSpy = spyCall())
      })
    })
  })

  describe('with date columns above resource columns', function() {
    pushOptions({
      defaultView: 'agendaThreeDay',
      groupByDateAndResource: true
    })

    it('allows a same-day resize', function(done) {
      let resizeSpy
      initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-30T02:00:00', end: '2015-11-30T03:00:00', resourceId: 'b' }
        ],
        eventAfterAllRender: oneCall(function() {
          $('.event1').simulate('mouseover') // resizer only shows on hover
          $('.event1 .fc-resizer')
            .simulate('drag', {
              end: getResourceTimeGridPoint('b', '2015-11-30T04:00:00'),
              callback() {
                expect(resizeSpy).toHaveBeenCalled()
                done()
              }
            }
            )
        }),
        eventResize:
          (resizeSpy = spyCall(function(event) {
            expect(event.start).toEqualMoment('2015-11-30T02:00:00')
            expect(event.end).toEqualMoment('2015-11-30T04:30:00')
            const resource = currentCalendar.getEventResource(event)
            expect(resource.id).toBe('b')
          }))
      })
    })

    it('allows a multi-day resize', function(done) {
      let resizeSpy
      initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'a' }
        ],
        eventAfterAllRender: oneCall(function() {
          $('.event1').simulate('mouseover') // resizer only shows on hover
          $('.event1 .fc-resizer')
            .simulate('drag', {
              end: getResourceTimeGridPoint('a', '2015-11-30T04:00:00'),
              callback() {
                expect(resizeSpy).toHaveBeenCalled()
                done()
              }
            }
            )
        }),
        eventResize:
          (resizeSpy = spyCall(function(event) {
            expect(event.start).toEqualMoment('2015-11-29T02:00:00')
            expect(event.end).toEqualMoment('2015-11-30T04:30:00')
            const resource = currentCalendar.getEventResource(event)
            expect(resource.id).toBe('a')
          }))
      })
    })

    it('disallows a resize across resources', function(done) {
      let resizeSpy
      initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'a' }
        ],
        eventAfterAllRender: oneCall(function() {
          $('.event1').simulate('mouseover') // resizer only shows on hover
          $('.event1 .fc-resizer')
            .simulate('drag', {
              end: getResourceTimeGridPoint('b', '2015-11-29T04:00:00'),
              callback() {
                expect(resizeSpy).not.toHaveBeenCalled()
                done()
              }
            }
            )
        }),
        eventResize:
          (resizeSpy = spyCall())
      })
    })
  })
})
