// TODO: test isRTL?

import { getResourceTimelinePoint } from '../lib/timeline'

describe('timeline-view event drag-n-drop', function() {
  pushOptions({
    editable: true,
    now: '2015-11-29',
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
      { id: 'c', title: 'Resource C' }
    ],
    defaultView: 'timelineDay',
    scrollTime: '00:00'
  })

  describeTimezones(function(tz) {

    it('allows switching date and resource', function(done) {
      let dropSpy
      initCalendar({
        events: [
          { title: 'event0', className: 'event0', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'b' }
        ],
        eventAfterAllRender: oneCall(function() {
          dragElTo($('.event0'), 'a', '2015-11-29T05:00:00', function() {
            expect(dropSpy).toHaveBeenCalled()
            done()
          })
        }),
        eventDrop:
          (dropSpy = spyCall(function(event) {
            expect(event.start).toEqualMoment(tz.moment('2015-11-29T05:00:00'))
            expect(event.end).toEqualMoment(tz.moment('2015-11-29T06:00:00'))
            const resource = currentCalendar.getEventResource(event)
            expect(resource.id).toBe('a')
          }))
      })
    })
  })

  it('can drag one of multiple event occurences', function(done) {
    initCalendar({
      events: [
        { title: 'event0', className: 'event0', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceIds: [ 'a', 'b' ] }
      ],
      eventAfterAllRender: oneCall(function() {
        dragElTo($('.event0:first'), 'c', '2015-11-29T05:00:00')
      }),
      eventDrop(event, delta, revert) {
        setTimeout(function() { // let the drop rerender
          expect(event.start).toEqualMoment('2015-11-29T05:00:00')
          expect(event.end).toEqualMoment('2015-11-29T06:00:00')
          expect(event.resourceId).toBe(null)
          expect(event.resourceIds).toEqual([ 'b', 'c' ])
          done()
        })
      }
    })
  })

  it('can drag one of multiple event occurences, linked by same event-IDs', function(done) {
    initCalendar({
      events: [
        { id: '1', title: 'event0', className: 'event0', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'a' },
        { id: '1', title: 'event1', className: 'event1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'b' }
      ],
      eventAfterAllRender: oneCall(function() {
        dragElTo(
          $('.event0:first'),
          'c',
          '2015-11-29T05:00:00',
          null, // callback
          function() { // onBeforeRelease (happens BEFORE callback)
            expect($('.fc-helper-container').length).toBe(2) // rendered two helpers
          }
        )
      }),
      eventDrop(event, delta, revert) {
        setTimeout(function() { // let the drop rerender
          const events = currentCalendar.clientEvents()

          expect(events[0].start).toEqualMoment('2015-11-29T05:00:00')
          expect(events[0].end).toEqualMoment('2015-11-29T06:00:00')
          expect(events[0].resourceId).toBe('c')

          expect(events[1].start).toEqualMoment('2015-11-29T05:00:00')
          expect(events[1].end).toEqualMoment('2015-11-29T06:00:00')
          expect(events[1].resourceId).toBe('b')

          done()
        })
      }
    })
  })

  it('can drag one of multiple event occurences onto an already-assigned resource', function(done) {
    initCalendar({
      events: [
        { title: 'event0', className: 'event0', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceIds: [ 'a', 'b' ] }
      ],
      eventAfterAllRender: oneCall(function() {
        dragElTo($('.event0:first'), 'b', '2015-11-29T05:00:00')
      }),
      eventDrop(event, delta, revert) {
        setTimeout(function() { // let the drop rerender
          expect(event.start).toEqualMoment('2015-11-29T05:00:00')
          expect(event.end).toEqualMoment('2015-11-29T06:00:00')
          expect(event.resourceId).toBe('b')
          expect(event.resourceIds).toEqual(null)
          done()
        })
      }
    })
  })

  it('allows dragging via touch', function(done) {
    let dropSpy
    initCalendar({
      isTouch: true,
      longPressDelay: 100,
      events: [
        { title: 'event0', className: 'event0', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'b' }
      ],
      eventAfterAllRender: oneCall(function() {
        touchDragElTo($('.event0'), 200, 'a', '2015-11-29T05:00:00', function() {
          expect(dropSpy).toHaveBeenCalled()
          done()
        })
      }),
      eventDrop:
        (dropSpy = spyCall(function(event) {
          expect(event.start).toEqualMoment('2015-11-29T05:00:00')
          expect(event.end).toEqualMoment('2015-11-29T06:00:00')
          const resource = currentCalendar.getEventResource(event)
          expect(resource.id).toBe('a')
        }))
    })
  })

  it('restores resource correctly with revert', function(done) {
    initCalendar({
      events: [
        { title: 'event0', className: 'event0', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'b' }
      ],
      eventAfterAllRender: oneCall(function() {
        dragElTo($('.event0'), 'a', '2015-11-29T05:00:00')
      }),
      eventDrop(event, delta, revert) {
        setTimeout(function() { // let the drop rerender
          expect(event.start).toEqualMoment('2015-11-29T05:00:00')
          expect(event.end).toEqualMoment('2015-11-29T06:00:00')
          expect(event.resourceId).toBe('a')
          revert()
          event = currentCalendar.clientEvents()[0]
          expect(event.start).toEqualMoment('2015-11-29T02:00:00')
          expect(event.end).toEqualMoment('2015-11-29T03:00:00')
          expect(event.resourceId).toBe('b')
          done()
        })
      }
    })
  })

  it('restores multiple resources correctly with revert', function(done) {
    initCalendar({
      events: [
        { title: 'event0', className: 'event0', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceIds: [ 'a', 'b' ] }
      ],
      eventAfterAllRender: oneCall(function() {
        dragElTo($('.event0:first'), 'c', '2015-11-29T05:00:00')
      }),
      eventDrop(event, delta, revert) {
        setTimeout(function() { // let the drop rerender
          expect(event.start).toEqualMoment('2015-11-29T05:00:00')
          expect(event.end).toEqualMoment('2015-11-29T06:00:00')
          expect(event.resourceId).toBe(null)
          expect(event.resourceIds).toEqual([ 'b', 'c' ])
          revert()
          event = currentCalendar.clientEvents()[0]
          expect(event.start).toEqualMoment('2015-11-29T02:00:00')
          expect(event.end).toEqualMoment('2015-11-29T03:00:00')
          expect(event.resourceId).toBe(null)
          expect(event.resourceIds).toEqual([ 'a', 'b' ])
          done()
        })
      }
    })
  })

  describe('when per-resource businessHours and eventConstraint', function() {
    pushOptions({
      now: '2015-11-27', // need a weekday
      businessHours: true,
      eventConstraint: 'businessHours'
    })

    it('allow dragging into custom matching range', function(done) {
      let dropSpy
      initCalendar({
        resources: [
          { id: 'a', title: 'Resource A', businessHours: { start: '02:00', end: '22:00' } },
          { id: 'b', title: 'Resource B' },
          { id: 'c', title: 'Resource C' }
        ],
        events: [
          { title: 'event0', className: 'event0', start: '2015-11-27T09:00', end: '2015-11-27T10:00', resourceId: 'b' }
        ],
        eventAfterAllRender: oneCall(function() {
          dragElTo($('.event0'), 'a', '2015-11-27T05:00', function() {
            expect(dropSpy).toHaveBeenCalled()
            done()
          })
        }),
        eventDrop:
          (dropSpy = spyCall(function(event) {
            expect(event.start).toEqualMoment('2015-11-27T05:00')
            expect(event.end).toEqualMoment('2015-11-27T06:00')
            const resource = currentCalendar.getEventResource(event)
            expect(resource.id).toBe('a')
          }))
      })
    })

    it('disallow dragging into custom non-matching range', function(done) {
      let dropSpy
      initCalendar({
        resources: [
          { id: 'a', title: 'Resource A', businessHours: { start: '10:00', end: '16:00' } },
          { id: 'b', title: 'Resource B' },
          { id: 'c', title: 'Resource C' }
        ],
        events: [
          { title: 'event0', className: 'event0', start: '2015-11-27T09:00', end: '2015-11-27T10:00', resourceId: 'b' }
        ],
        eventAfterAllRender: oneCall(function() {
          dragElTo($('.event0'), 'a', '2015-11-27T09:00:00', function() {
            expect(dropSpy).not.toHaveBeenCalled()
            done()
          })
        }),
        eventDrop:
          (dropSpy = spyCall(function(event) {
            expect(event.start).toEqualMoment('2015-11-27T05:00:00')
            expect(event.end).toEqualMoment('2015-11-27T06:00:00')
            const resource = currentCalendar.getEventResource(event)
            expect(resource.id).toBe('a')
          }))
      })
    })
  })

  function dragElTo(el, resourceId, date, callback, onBeforeRelease) {
    el.simulate('drag', {
      localPoint: { left: 0, top: '50%' },
      end: getResourceTimelinePoint(resourceId, date),
      onBeforeRelease,
      callback
    })
  }

  function touchDragElTo(el, delay, resourceId, date, callback) {
    $('.event0').simulate('drag', {
      isTouch: true,
      delay,
      localPoint: { left: 0, top: '50%' },
      end: getResourceTimelinePoint(resourceId, date),
      callback
    })
  }
})
