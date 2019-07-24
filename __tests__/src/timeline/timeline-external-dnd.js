// TODO: test isRtl?

import { Draggable } from '@fullcalendar/interaction'
import { getResourceTimelinePoint } from '../lib/timeline'

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
      ' class="external-event fc-event"' +
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
      initCalendar({
        _eventsPositioned: oneCall(function() {
          $('.external-event').simulate('drag', {
            localPoint: { left: 0, top: '50%' },
            end: getResourceTimelinePoint('b', '2015-11-29T05:00:00'),
            callback() {
              expect(dropSpy).toHaveBeenCalled()
              expect(receiveSpy).toHaveBeenCalled()
              done()
            }
          })
        }),
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
      initCalendar({
        _eventsPositioned: oneCall(function() {
          $('.external-event').simulate('drag', {
            localPoint: { left: 0, top: '50%' },
            end: getResourceTimelinePoint('a', '2015-11-29T02:00:00'),
            callback() {
              expect(dropSpy).not.toHaveBeenCalled()
              expect(receiveSpy).not.toHaveBeenCalled()
              done()
            }
          })
        }),
        drop: (dropSpy = jasmine.createSpy('drop')),
        eventReceive: (receiveSpy = jasmine.createSpy('receive'))
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
      datesRender() {
        dragEl.simulate('drag', {
          dy: 10, // some movement
          callback() {
            setTimeout(function() { // wait for potential `drop`
              expect(isDropCalled).toBe(false)
              calEl.remove()
              done()
            }
              , 100)
          }
        })
      },
      drop() {
        isDropCalled = true
      }
    }, calEl) // will render calendar within this el
  })

  it('works after a view switch', function(done) {
    let renderCnt = 0
    initCalendar({
      datesRender() {
        renderCnt++
        if (renderCnt === 1) {
          currentCalendar.changeView('resourceTimelineWeek')
        } else if (renderCnt === 2) {
          $('.external-event').simulate('drag', {
            localPoint: { left: 0, top: '50%' },
            end: getResourceTimelinePoint('b', '2015-11-29T05:00:00'),
            callback() {
              // all we care about is no JS errors
              done()
            }
          })
        }
      }
    })
  })

  it('works after calling destroy', function(done) {
    initCalendar({
      datesRender() {
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
      }
    })
  })
})
