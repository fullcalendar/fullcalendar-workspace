// TODO: do resizing from the start
// TODO: more tests when slotDuration=1week, no event end. resize behavior?

import { getResourceTimelinePoint, getTimelineSlatEl } from '../lib/timeline'

describe('timeline event resizing', function() {
  pushOptions({
    now: '2015-11-28',
    scrollTime: '00:00',
    editable: true,
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' }
    ]
  })

  describeOptions('isRTL', {
    'LTR': false,
    'RTL': true
  }, function(isRTL) {

    describeTimezones(function(tz) {

      describe('when time scale', function() {
        pushOptions({
          defaultView: 'timelineDay'
        })

        describe('when snap matches slots', function() {

          describe('when no resources', function() {
            pushOptions({
              resources: false
            })

            it('reports resize with no resource', function(done) {
              let resizeSpy
              initCalendar({
                events: [
                  { title: 'event1', className: 'event1', start: '2015-11-28T04:00:00', end: '2015-11-28T05:00:00' }
                ],
                eventAfterAllRender: oneCall(function() {
                  $('.event1').simulate('mouseover') // resizer only shows on hover
                  $('.event1 .fc-end-resizer')
                    .simulate('drag', {
                      end: getTimelineSlatEl('2015-11-28T07:00:00'),
                      callback() {
                        expect(resizeSpy).toHaveBeenCalled()
                        expect(isAnyHighlight()).toBe(false) // TODO: move to its own test
                        done()
                      }
                    })
                }),
                eventResize:
                  (resizeSpy = spyCall(function(event) {
                    expect(event.start).toEqualMoment(tz.moment('2015-11-28T04:00:00'))
                    expect(event.end).toEqualMoment(tz.moment('2015-11-28T07:30:00'))
                    const resource = currentCalendar.getEventResource(event)
                    expect(resource).toBeFalsy()
                  }))
              })
            })
          })

          describe('when resources', function() {

            it('reports resize on a resource', function(done) {
              let resizeSpy
              initCalendar({
                events: [
                  { title: 'event1', className: 'event1', start: '2015-11-28T04:00:00', end: '2015-11-28T05:00:00', resourceId: 'b' }
                ],
                eventAfterAllRender: oneCall(function() {
                  $('.event1').simulate('mouseover') // resizer only shows on hover
                  $('.event1 .fc-end-resizer')
                    .simulate('drag', {
                      end: getResourceTimelinePoint('b', '2015-11-28T07:00:00'),
                      callback() {
                        expect(resizeSpy).toHaveBeenCalled()
                        expect(isAnyHighlight()).toBe(false) // TODO: move to its own test
                        done()
                      }
                    })
                }),
                eventResize:
                  (resizeSpy = spyCall(function(event) {
                    expect(event.start).toEqualMoment(tz.moment('2015-11-28T04:00:00'))
                    expect(event.end).toEqualMoment(tz.moment('2015-11-28T07:30:00'))
                    const resource = currentCalendar.getEventResource(event)
                    expect(resource.id).toBe('b')
                  }))
              })
            })

            it('reports resize across resources', function(done) {
              let resizeSpy
              initCalendar({
                events: [
                  { title: 'event1', className: 'event1', start: '2015-11-28T04:00:00', end: '2015-11-28T05:00:00', resourceId: 'b' }
                ],
                eventAfterAllRender: oneCall(function() {
                  $('.event1').simulate('mouseover') // resizer only shows on hover
                  $('.event1 .fc-end-resizer')
                    .simulate('drag', {
                      end: getResourceTimelinePoint('a', '2015-11-28T07:00:00'),
                      callback() {
                        expect(resizeSpy).toHaveBeenCalled()
                        done()
                      }
                    })
                }),
                eventResize:
                  (resizeSpy = spyCall(function(event) {
                    expect(event.start).toEqualMoment(tz.moment('2015-11-28T04:00:00'))
                    expect(event.end).toEqualMoment(tz.moment('2015-11-28T07:30:00'))
                    const resource = currentCalendar.getEventResource(event)
                    expect(resource.id).toBe('b')
                  }))
              })
            })

            it('reports resize on one event of multiple resources', function(done) {
              let resizeSpy
              initCalendar({
                events: [
                  { title: 'event1', className: 'event1', start: '2015-11-28T04:00:00', end: '2015-11-28T05:00:00', resourceIds: [ 'a', 'b' ] }
                ],
                eventAfterAllRender: oneCall(function() {
                  $('.event1:first').simulate('mouseover') // resizer only shows on hover
                  $('.event1:first .fc-end-resizer')
                    .simulate('drag', {
                      end: getResourceTimelinePoint('a', '2015-11-28T07:00:00'),
                      callback() {
                        expect(resizeSpy).toHaveBeenCalled()
                        done()
                      }
                    })
                }),
                eventResize:
                  (resizeSpy = spyCall(function(event) {
                    expect(event.start).toEqualMoment(tz.moment('2015-11-28T04:00:00'))
                    expect(event.end).toEqualMoment(tz.moment('2015-11-28T07:30:00'))
                    expect(event.resourceId).toBe(null)
                    // resources stay the same
                    expect(event.resourceIds).toEqual([ 'a', 'b' ])
                  }))
              })
            })
          })
        })

        describe('when snap smaller than slots', function() {
          pushOptions({
            slotDuration: '00:30',
            snapDuration: '00:15'
          })

          it('reports a smaller granularity', function(done) {
            let resizeSpy
            initCalendar({
              events: [
                { title: 'event1', className: 'event1', start: '2015-11-28T04:00:00', end: '2015-11-28T05:00:00', resourceId: 'b' }
              ],
              eventAfterAllRender: oneCall(function() {
                $('.event1').simulate('mouseover') // resizer only shows on hover
                $('.event1 .fc-end-resizer')
                  .simulate('drag', {
                    end: getResourceTimelinePoint('b', '2015-11-28T07:30:00'),
                    callback() {
                      expect(resizeSpy).toHaveBeenCalled()
                      done()
                    }
                  })
              }),
              eventResize:
                (resizeSpy = spyCall(function(event) {
                  expect(event.start).toEqualMoment(tz.moment('2015-11-28T04:00:00'))
                  expect(event.end).toEqualMoment(tz.moment('2015-11-28T07:45:00'))
                  const resource = currentCalendar.getEventResource(event)
                  expect(resource.id).toBe('b')
                }))
            })
          })
        })
      })
    })

    it('works with touch', function(done) {
      let resizeSpy
      initCalendar({
        isTouch: true,
        longPressDelay: 100,
        defaultView: 'timelineDay',
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-28T04:00:00', end: '2015-11-28T05:00:00', resourceId: 'b' }
        ],
        eventAfterAllRender: oneCall(function() {
          $('.event1').simulate('drag', {
            isTouch: true,
            delay: 200,
            callback() {
              $('.event1').simulate('mouseover') // resizer only shows on hover
              $('.event1 .fc-end-resizer').simulate('drag', {
                // hack to make resize start within the bounds of the event
                localPoint: { top: '50%', left: (isRTL ? '100%' : '0%') },
                isTouch: true,
                end: getResourceTimelinePoint('b', '2015-11-28T07:00:00'),
                callback() {
                  expect(resizeSpy).toHaveBeenCalled()
                  done()
                }
              })
            }
          })
        }),
        eventResize:
          (resizeSpy = spyCall(function(event) {
            expect(event.start).toEqualMoment('2015-11-28T04:00:00')
            expect(event.end).toEqualMoment('2015-11-28T07:30:00')
            const resource = currentCalendar.getEventResource(event)
            expect(resource.id).toBe('b')
          }))
      })
    })

    describe('when day scale', function() {
      pushOptions({
        defaultView: 'timelineMonth',
        slotDuration: { days: 1 }
      })

      it('reports untimed dates', function(done) {
        let resizeSpy
        initCalendar({
          events: [
            { title: 'event1', className: 'event1', start: '2015-11-03', resourceId: 'a' }
          ],
          eventAfterAllRender: oneCall(function() {
            $('.event1').simulate('mouseover') // resizer only shows on hover
            $('.event1 .fc-end-resizer')
              .simulate('drag', {
                end: getResourceTimelinePoint('a', '2015-11-05'),
                callback() {
                  expect(resizeSpy).toHaveBeenCalled()
                  done()
                }
              })
          }),
          eventResize:
            (resizeSpy = spyCall(function(event) {
              expect(event.start).toEqualMoment('2015-11-03')
              expect(event.end).toEqualMoment('2015-11-06')
              const resource = currentCalendar.getEventResource(event)
              expect(resource.id).toBe('a')
            }))
        })
      })
    })

    describe('when week scale', function() {
      pushOptions({
        defaultView: 'timelineYear',
        slotDuration: { weeks: 1 }
      })

      it('reports untimed dates', function(done) { // TODO: this is desired behavior when no end???
        let resizeSpy
        initCalendar({
          events: [
            { title: 'event1', className: 'event1', start: '2015-01-18', end: '2015-01-25', resourceId: 'a' }
          ],
          eventAfterAllRender: oneCall(function() {
            $('.event1').simulate('mouseover') // resizer only shows on hover
            $('.event1 .fc-end-resizer')
              .simulate('drag', {
                end: getResourceTimelinePoint('a', '2015-02-08'),
                callback() {
                  expect(resizeSpy).toHaveBeenCalled()
                  done()
                }
              })
          }),
          eventResize:
            (resizeSpy = spyCall(function(event) {
              expect(event.start).toEqualMoment('2015-01-18')
              expect(event.end).toEqualMoment('2015-02-15')
              const resource = currentCalendar.getEventResource(event)
              expect(resource.id).toBe('a')
            }))
        })
      })
    })
  })

  function isAnyHighlight() {
    return $('.fc-highlight').length > 0
  }
})
