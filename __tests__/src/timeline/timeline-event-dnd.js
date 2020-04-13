import ResourceTimelineViewWrapper from "../lib/wrappers/ResourceTimelineViewWrapper"

// TODO: test isRtl?

describe('timeline-view event drag-n-drop', function() {
  pushOptions({
    editable: true,
    now: '2015-11-29',
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
      { id: 'c', title: 'Resource C' }
    ],
    initialView: 'resourceTimelineDay',
    scrollTime: '00:00'
  })

  describeTimeZones(function(tz) {

    it('allows switching date and resource', function(done) {
      let dropSpy

      initCalendar({
        events: [
          { title: 'event0', className: 'event0', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'b' }
        ],
        eventDrop:
          (dropSpy = spyCall(function(arg) {
            expect(arg.event.start).toEqualDate(tz.parseDate('2015-11-29T05:00:00'))
            expect(arg.event.end).toEqualDate(tz.parseDate('2015-11-29T06:00:00'))

            expect(arg.oldResource.id).toBe('b')
            expect(arg.newResource.id).toBe('a')

            let resources = arg.event.getResources()
            expect(resources.length).toBe(1)
            expect(resources[0].id).toBe('a')
          }))
      })

      dragElTo($('.event0'), 'a', '2015-11-29T05:00:00', function() {
        expect(dropSpy).toHaveBeenCalled()
        done()
      })
    })
  })

  it('receives correct eventAllow args when switching date and resource', function(done) {
    let calledEventAllow = false

    initCalendar({
      events: [
        { title: 'event0', className: 'event0', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'b' }
      ],
      eventAllow(dropLocation, draggedEvent) {
        calledEventAllow = true
        if (!draggedEvent.start) {
          debugger
        }
        expect(draggedEvent.start instanceof Date).toBe(true)
      }
    })

    dragElTo($('.event0'), 'a', '2015-11-29T05:00:00', function() {
      expect(calledEventAllow).toBe(true)
      done()
    })
  })

  it('allows switching date only', function(done) {
    let dropSpy

    initCalendar({
      events: [
        { title: 'event0', className: 'event0', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'b' }
      ],
      eventDrop:
        (dropSpy = spyCall(function(arg) {
          expect(arg.event.start).toEqualDate('2015-11-29T05:00:00Z')
          expect(arg.event.end).toEqualDate('2015-11-29T06:00:00Z')

          expect(arg.oldResource).toBeNull()
          expect(arg.newResource).toBeNull()

          let resources = arg.event.getResources()
          expect(resources.length).toBe(1)
          expect(resources[0].id).toBe('b')
        }))
    })

    dragElTo($('.event0'), 'b', '2015-11-29T05:00:00', function() {
      expect(dropSpy).toHaveBeenCalled()
      done()
    })
  })

  it('can drag one of multiple event occurences', function(done) {
    initCalendar({
      events: [
        { title: 'event0', className: 'event0', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceIds: [ 'a', 'b' ] }
      ],
      eventDrop(arg) {
        setTimeout(function() { // let the drop rerender
          expect(arg.event.start).toEqualDate('2015-11-29T05:00:00Z')
          expect(arg.event.end).toEqualDate('2015-11-29T06:00:00Z')

          let resourceIds = arg.event.getResources().map((resource) => resource.id)
          resourceIds.sort()
          expect(resourceIds).toEqual([ 'b', 'c' ])
          done()
        })
      }
    })

    dragElTo($('.event0:first'), 'c', '2015-11-29T05:00:00')
  })

  it('can drag one of multiple event occurences, linked by same event-IDs', function(done) {
    let calendar = initCalendar({
      events: [
        { groupId: '1', title: 'event0', className: 'event0', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'a' },
        { groupId: '1', title: 'event1', className: 'event1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'b' }
      ],
      eventDrop() {
        setTimeout(function() { // let the drop rerender
          const events = currentCalendar.getEvents()

          expect(events[0].start).toEqualDate('2015-11-29T05:00:00Z')
          expect(events[0].end).toEqualDate('2015-11-29T06:00:00Z')
          expect(events[0].getResources().length).toBe(1)
          expect(events[0].getResources()[0].id).toBe('c')

          expect(events[1].start).toEqualDate('2015-11-29T05:00:00Z')
          expect(events[1].end).toEqualDate('2015-11-29T06:00:00Z')
          expect(events[1].getResources().length).toBe(1)
          expect(events[1].getResources()[0].id).toBe('b')

          done()
        })
      }
    })

    let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid

    dragElTo(
      $('.event0:first'),
      'c',
      '2015-11-29T05:00:00',
      null, // callback
      function() { // onBeforeRelease (happens BEFORE callback)
        expect(timelineGridWrapper.getMirrorEventEls().length).toBe(2) // rendered two mirrors
      }
    )
  })

  it('can drag one of multiple event occurences onto an already-assigned resource', function(done) {
    initCalendar({
      events: [
        { title: 'event0', className: 'event0', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceIds: [ 'a', 'b' ] }
      ],
      eventDrop(arg) {
        setTimeout(function() { // let the drop rerender
          expect(arg.event.start).toEqualDate('2015-11-29T05:00:00Z')
          expect(arg.event.end).toEqualDate('2015-11-29T06:00:00Z')
          expect(arg.event.getResources().length).toBe(1)
          expect(arg.event.getResources()[0].id).toBe('b')
          done()
        })
      }
    })

    dragElTo($('.event0:first'), 'b', '2015-11-29T05:00:00')
  })

  it('allows dragging via touch', function(done) {
    let dropSpy

    initCalendar({
      isTouch: true,
      longPressDelay: 100,
      events: [
        { title: 'event0', className: 'event0', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'b' }
      ],
      eventDrop:
        (dropSpy = spyCall(function(arg) {
          expect(arg.event.start).toEqualDate('2015-11-29T05:00:00Z')
          expect(arg.event.end).toEqualDate('2015-11-29T06:00:00Z')

          let resources = arg.event.getResources()
          expect(resources.length).toBe(1)
          expect(resources[0].id).toBe('a')
        }))
    })

    touchDragElTo($('.event0'), 200, 'a', '2015-11-29T05:00:00', function() {
      expect(dropSpy).toHaveBeenCalled()
      setTimeout(done, 1000) // wait, so next tests don't have mousedown ignored :(
    })
  })

  it('restores resource correctly with revert', function(done) {
    initCalendar({
      events: [
        { title: 'event0', className: 'event0', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'b' }
      ],
      eventDrop(arg) {
        setTimeout(function() { // let the drop rerender
          expect(arg.event.start).toEqualDate('2015-11-29T05:00:00Z')
          expect(arg.event.end).toEqualDate('2015-11-29T06:00:00Z')
          expect(arg.event.getResources().length).toBe(1)
          expect(arg.event.getResources()[0].id).toBe('a')
          arg.revert()

          let event = currentCalendar.getEvents()[0]
          expect(event.start).toEqualDate('2015-11-29T02:00:00Z')
          expect(event.end).toEqualDate('2015-11-29T03:00:00Z')
          expect(event.getResources().length).toBe(1)
          expect(event.getResources()[0].id).toBe('b')
          done()
        })
      }
    })

    dragElTo($('.event0'), 'a', '2015-11-29T05:00:00')
  })

  it('restores multiple resources correctly with revert', function(done) {
    initCalendar({
      events: [
        { title: 'event0', className: 'event0', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceIds: [ 'a', 'b' ] }
      ],
      eventDrop(arg) {
        setTimeout(function() { // let the drop rerender
          let resourceIds

          expect(arg.event.start).toEqualDate('2015-11-29T05:00:00Z')
          expect(arg.event.end).toEqualDate('2015-11-29T06:00:00Z')
          resourceIds = arg.event.getResources().map((resource) => resource.id)
          expect(resourceIds).toEqual([ 'b', 'c' ])
          arg.revert()

          let event = currentCalendar.getEvents()[0]
          expect(event.start).toEqualDate('2015-11-29T02:00:00Z')
          expect(event.end).toEqualDate('2015-11-29T03:00:00Z')
          resourceIds = event.getResources().map((resource) => resource.id)
          expect(resourceIds).toEqual([ 'a', 'b' ])
          done()
        })
      }
    })

    dragElTo($('.event0:first'), 'c', '2015-11-29T05:00:00')
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
          { id: 'a', title: 'Resource A', businessHours: { startTime: '02:00', endTime: '22:00' } },
          { id: 'b', title: 'Resource B' },
          { id: 'c', title: 'Resource C' }
        ],
        events: [
          { title: 'event0', className: 'event0', start: '2015-11-27T09:00', end: '2015-11-27T10:00', resourceId: 'b' }
        ],
        eventDrop:
          (dropSpy = spyCall(function(arg) {
            expect(arg.event.start).toEqualDate('2015-11-27T05:00Z')
            expect(arg.event.end).toEqualDate('2015-11-27T06:00Z')

            let resources = arg.event.getResources()
            expect(resources.length).toBe(1)
            expect(resources[0].id).toBe('a')
          }))
      })

      dragElTo($('.event0'), 'a', '2015-11-27T05:00', function() {
        expect(dropSpy).toHaveBeenCalled()
        done()
      })
    })

    it('disallow dragging into custom non-matching range', function(done) {
      let dropSpy

      initCalendar({
        resources: [
          { id: 'a', title: 'Resource A', businessHours: { startTime: '10:00', endTime: '16:00' } },
          { id: 'b', title: 'Resource B' },
          { id: 'c', title: 'Resource C' }
        ],
        events: [
          { title: 'event0', className: 'event0', start: '2015-11-27T09:00', end: '2015-11-27T10:00', resourceId: 'b' }
        ],
        eventDrop:
          (dropSpy = spyCall(function(arg) {
            expect(arg.event.start).toEqualDate('2015-11-27T05:00:00Z')
            expect(arg.event.end).toEqualDate('2015-11-27T06:00:00Z')

            let resources = arg.event.getResources()
            expect(resources.length).toBe(1)
            expect(resources[0].id).toBe('a')
          }))
      })

      dragElTo($('.event0'), 'a', '2015-11-27T09:00:00', function() {
        expect(dropSpy).not.toHaveBeenCalled()
        done()
      })
    })
  })


  function dragElTo(el, resourceId, date, callback, onBeforeRelease) {
    let timelineGrid = new ResourceTimelineViewWrapper(currentCalendar).timelineGrid

    el.simulate('drag', {
      localPoint: { left: 1, top: '50%' },
      end: timelineGrid.getPoint(resourceId, date),
      onBeforeRelease,
      callback
    })
  }


  function touchDragElTo(el, delay, resourceId, date, callback) {
    let timelineGrid = new ResourceTimelineViewWrapper(currentCalendar).timelineGrid

    $('.event0').simulate('drag', {
      isTouch: true,
      delay,
      localPoint: { left: 1, top: '50%' },
      end: timelineGrid.getPoint(resourceId, date),
      callback
    })
  }

})
