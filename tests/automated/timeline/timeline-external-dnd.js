// TODO: test isRTL?

import { getResourceTimelinePoint } from '../lib/timeline'

describe('timeline-view external element drag-n-drop', function() {
  pushOptions({
    droppable: true,
    now: '2015-11-29',
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' }
    ],
    defaultView: 'timelineDay',
    scrollTime: '00:00'
  })

  let dragEl = null

  beforeEach(function() {
    dragEl = $('<a' +
      ' class="external-event fc-event"' +
      ' style="width:100px"' +
      ' data-event=\'{"title":"my external event"}\'' +
      '>external</a>')
      .appendTo('body')
      .draggable()
  })

  afterEach(function() {
    dragEl.remove()
  })

  describeTimezones(function(tz) {

    it('allows dropping onto a resource', function(done) {
      let dropSpy, receiveSpy
      initCalendar({
        eventAfterAllRender: oneCall(function() {
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
          (dropSpy = spyCall(function(date) {
            expect(date).toEqualMoment(tz.moment('2015-11-29T05:00:00'))
          })),
        eventReceive:
          (receiveSpy = spyCall(function(event) {
            expect(event.title).toBe('my external event')
            expect(event.start).toEqualMoment(tz.moment('2015-11-29T05:00:00'))
            expect(event.end).toBe(null)
            const resource = currentCalendar.getEventResource(event)
            expect(resource.id).toBe('b')
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
        eventAfterAllRender: oneCall(function() {
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

  // issue 256 (but with event dragging, not dayClick)
  it('restricts drop to bounding area', function(done) {
    let isDropCalled = false

    // get dragEl to the right of the calendar, parallel with body slots
    const wrapEl = $('<div style="float:left;position:relative;width:500px">').appendTo('body')
    const calEl = $('<div>').appendTo(wrapEl)
    dragEl.appendTo(wrapEl)
      .css({
        position: 'absolute',
        left: '100%',
        top: 50
      })

    initCalendar({
      header: false, // better guarantee that dragEl is parallel with body slots
      viewRender() {
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
      viewRender() {
        renderCnt++
        if (renderCnt === 1) {
          currentCalendar.changeView('timelineWeek')
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
      viewRender() {
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
