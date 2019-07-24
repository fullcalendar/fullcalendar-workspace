import { getTimeGridPoint } from 'package-tests/lib/time-grid'
import { getResourceTimeGridPoint } from '../lib/time-grid'

describe('timeGrid-view event resizing', function() {
  pushOptions({
    now: '2015-11-28',
    scrollTime: '00:00',
    editable: true,
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

    it('allows non-resource resize', function(done) {
      let resizeSpy
      initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-23T02:00:00', end: '2015-11-23T03:00:00' }
        ],
        _eventsPositioned: oneCall(function() {
          $('.event1').simulate('mouseover') // resizer only shows on hover
          $('.event1 .fc-resizer')
            .simulate('drag', {
              end: getTimeGridPoint('2015-11-23T04:00:00'),
              callback() {
                expect(resizeSpy).toHaveBeenCalled()
                done()
              }
            })
        }),
        eventResize:
          (resizeSpy = spyCall(function(arg) {
            expect(arg.event.start).toEqualDate('2015-11-23T02:00:00Z')
            expect(arg.event.end).toEqualDate('2015-11-23T04:30:00Z')

            let resources = arg.event.getResources()
            expect(resources.length).toBe(0)
          }))
      })
    })
  })

  describe('with resource columns above date columns', function() {
    pushOptions({
      defaultView: 'resourceTimeGridThreeDay'
    })

    it('allows a same-day resize', function(done) {
      let resizeSpy
      initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'b' }
        ],
        _eventsPositioned: oneCall(function() { // avoid second call after event rerender
          $('.event1').simulate('mouseover') // resizer only shows on hover
          $('.event1 .fc-resizer')
            .simulate('drag', {
              end: getResourceTimeGridPoint('b', '2015-11-29T04:00:00'),
              callback() {
                expect(resizeSpy).toHaveBeenCalled()
                done()
              }
            })
        }),
        eventResize:
          (resizeSpy = spyCall(function(arg) {
            expect(arg.event.start).toEqualDate('2015-11-29T02:00:00Z')
            expect(arg.event.end).toEqualDate('2015-11-29T04:30:00Z')

            let resources = arg.event.getResources()
            expect(resources.length).toBe(1)
            expect(resources[0].id).toBe('b')
          }))
      })
    })

    it('allows a different-day resize', function(done) {
      let resizeSpy
      initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'b' }
        ],
        _eventsPositioned: oneCall(function() {
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
          (resizeSpy = spyCall(function(arg) {
            expect(arg.event.start).toEqualDate('2015-11-29T02:00:00Z')
            expect(arg.event.end).toEqualDate('2015-11-30T04:30:00Z')

            let resources = arg.event.getResources()
            expect(resources.length).toBe(1)
            expect(resources[0].id).toBe('b')
          }))
      })
    })

    it('disallows a resize across resources', function(done) {
      let resizeSpy
      initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'a' }
        ],
        _eventsPositioned: oneCall(function() {
          $('.event1').simulate('mouseover') // resizer only shows on hover
          $('.event1 .fc-resizer')
            .simulate('drag', {
              end: getResourceTimeGridPoint('b', '2015-11-30T04:00:00'),
              callback() {
                expect(resizeSpy).not.toHaveBeenCalled()
                done()
              }
            })
        }),
        eventResize:
          (resizeSpy = spyCall())
      })
    })
  })

  describe('with date columns above resource columns', function() {
    pushOptions({
      defaultView: 'resourceTimeGridThreeDay',
      datesAboveResources: true
    })

    it('allows a same-day resize', function(done) {
      let resizeSpy
      initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-30T02:00:00', end: '2015-11-30T03:00:00', resourceId: 'b' }
        ],
        _eventsPositioned: oneCall(function() {
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
          (resizeSpy = spyCall(function(arg) {
            expect(arg.event.start).toEqualDate('2015-11-30T02:00:00Z')
            expect(arg.event.end).toEqualDate('2015-11-30T04:30:00Z')

            let resources = arg.event.getResources()
            expect(resources.length).toBe(1)
            expect(resources[0].id).toBe('b')
          }))
      })
    })

    it('allows a multi-day resize', function(done) {
      let resizeSpy
      initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'a' }
        ],
        _eventsPositioned: oneCall(function() {
          $('.event1').simulate('mouseover') // resizer only shows on hover
          $('.event1 .fc-resizer')
            .simulate('drag', {
              end: getResourceTimeGridPoint('a', '2015-11-30T04:00:00'),
              callback() {
                expect(resizeSpy).toHaveBeenCalled()
                done()
              }
            })
        }),
        eventResize:
          (resizeSpy = spyCall(function(arg) {
            expect(arg.event.start).toEqualDate('2015-11-29T02:00:00Z')
            expect(arg.event.end).toEqualDate('2015-11-30T04:30:00Z')

            let resources = arg.event.getResources()
            expect(resources.length).toBe(1)
            expect(resources[0].id).toBe('a')
          }))
      })
    })

    it('disallows a resize across resources', function(done) {
      let resizeSpy
      initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'a' }
        ],
        _eventsPositioned: oneCall(function() {
          $('.event1').simulate('mouseover') // resizer only shows on hover
          $('.event1 .fc-resizer')
            .simulate('drag', {
              end: getResourceTimeGridPoint('b', '2015-11-29T04:00:00'),
              callback() {
                expect(resizeSpy).not.toHaveBeenCalled()
                done()
              }
            })
        }),
        eventResize:
          (resizeSpy = spyCall())
      })
    })
  })
})
