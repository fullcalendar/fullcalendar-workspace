// TODO: test isRtl?

import { Draggable } from '@fullcalendar/interaction'
import ResourceTimelineViewWrapper from '../lib/wrappers/ResourceTimelineViewWrapper'
import CalendarWrapper from 'standard-tests/src/lib/wrappers/CalendarWrapper'

describe('timeline-view external element drag-n-drop', function() {
  pushOptions({
    droppable: true,
    now: '2015-11-29',
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' }
    ],
    defaultView: 'resourceTimelineDay',
    scrollTime: '00:00'
  })

  let dragEl = null

  beforeEach(function() {
    dragEl = $('<a' +
      ` class="external-event ${CalendarWrapper.EVENT_CLASSNAME}"` +
      ' style="width:100px"' +
      '>external</a>')
      .appendTo('body')

    new Draggable(dragEl[0], {
      eventData: {
        title: 'my external event'
      }
    })
  })

  afterEach(function() {
    dragEl.remove()
  })

  describeTimeZones(function(tz) {

    it('allows dropping onto a resource', function(done) {
      let dropSpy, receiveSpy
      let calendar = initCalendar({
        drop:
          (dropSpy = spyCall(function(arg) {
            expect(arg.date).toEqualDate(tz.parseDate('2015-11-29T05:00:00'))
          })),
        eventReceive:
          (receiveSpy = spyCall(function(arg) {
            expect(arg.event.title).toBe('my external event')
            expect(arg.event.start).toEqualDate(tz.parseDate('2015-11-29T05:00:00'))
            expect(arg.event.end).toBe(null)

            let resources = arg.event.getResources()
            expect(resources.length).toBe(1)
            expect(resources[0].id).toBe('b')
          }))
      })

      let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid
      timelineGridWrapper.dragEventTo(
        $('.external-event')[0], 'b', '2015-11-29T05:00:00'
      ).then(() => {
        expect(dropSpy).toHaveBeenCalled()
        expect(receiveSpy).toHaveBeenCalled()
        done()
      })
    })
  })

  describe('when overlap is false', function() {
    pushOptions({
      eventOverlap: false,
      events: [
        {
          title: 'existing event',
          start: '2015-11-29T01:00:00',
          end: '2015-11-29T03:00:00',
          resourceId: 'a'
        }
      ]
    })

    it('doesn\'t allow the drop on an event', function(done) {
      let dropSpy, receiveSpy
      let calendar = initCalendar({
        drop: (dropSpy = jasmine.createSpy('drop')),
        eventReceive: (receiveSpy = jasmine.createSpy('receive'))
      })

      let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid
      timelineGridWrapper.dragEventTo(
        $('.external-event')[0], 'a', '2015-11-29T02:00:00'
      ).then(() => {
        expect(dropSpy).not.toHaveBeenCalled()
        expect(receiveSpy).not.toHaveBeenCalled()
        done()
      })
    })
  })

  // issue 256 (but with event dragging, not dateClick)
  it('restricts drop to bounding area', function(done) {
    let isDropCalled = false

    // get dragEl to the right of the calendar, parallel with body slots
    const wrapEl = $('<div style="float:left;position:relative;width:900px">').appendTo('body')
    const calEl = $('<div>').appendTo(wrapEl)
    dragEl.appendTo(wrapEl)
      .css({
        position: 'absolute',
        left: '100%',
        top: 50
      })

    initCalendar({
      header: false, // better guarantee that dragEl is parallel with body slots
      drop() {
        isDropCalled = true
      }
    }, calEl) // will render calendar within this el

    dragEl.simulate('drag', {
      dy: 10, // some movement
      callback() {
        setTimeout(function() { // wait for potential `drop`
          expect(isDropCalled).toBe(false)
          calEl.remove()
          done()
        }, 100)
      }
    })
  })

  it('works after a view switch', function(done) {
    let calendar = initCalendar()
    currentCalendar.changeView('resourceTimelineWeek')

    let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid
    timelineGridWrapper.dragEventTo(
      $('.external-event')[0], 'b', '2015-11-29T05:00:00'
    ).then(() => {
      // all we care about is no JS errors
      done()
    })
  })

  it('works after calling destroy', function(done) {
    initCalendar()

    setTimeout(function() { // problems with destroy otherwise
      currentCalendar.destroy()
      $('.external-event').simulate('drag', {
        dx: 100,
        dy: 100,
        callback() {
          // all we care about is no JS errors
          done()
        }
      })
    })
  })
})
