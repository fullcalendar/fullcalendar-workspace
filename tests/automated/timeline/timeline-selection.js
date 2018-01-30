import { getResourceTimelinePoint, getTimelineSlatEl } from '../lib/timeline'

describe('timeline selection', function() {
  pushOptions({
    now: '2015-11-28',
    scrollTime: '00:00',
    selectable: true,
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

            it('reports selection with no resource', function(done) {
              let selectCalled = false
              initCalendar({
                eventAfterAllRender() {
                  const slatEl = getTimelineSlatEl('2015-11-28T04:00:00')
                  slatEl.simulate('drag', {
                    end: getTimelineSlatEl('2015-11-28T07:00:00'),
                    callback() {
                      expect(selectCalled).toBe(true)
                      done()
                    }
                  })
                },
                select(start, end, jsEvent, view, resource) {
                  selectCalled = true
                  expect(start).toEqualMoment(tz.moment('2015-11-28T04:00:00'))
                  expect(end).toEqualMoment(tz.moment('2015-11-28T07:30:00'))
                  expect(typeof jsEvent).toBe('object')
                  expect(typeof view).toBe('object')
                  expect(resource).toBeFalsy()
                }
              })
            })
          })

          describe('when resources', function() {

            it('won\'t report anything if not selected on resource', function(done) {
              let selectCalled = false
              initCalendar({
                eventAfterAllRender() {
                  const slatEl = getTimelineSlatEl('2015-11-28T04:00:00')
                  slatEl.simulate('drag', {
                    end: getTimelineSlatEl('2015-11-28T07:00:00'),
                    callback() {
                      expect(selectCalled).toBe(false)
                      done()
                    }
                  })
                },
                select(date, jsEvent, view, resource) {
                  selectCalled = true
                }
              })
            })

            it('reports selection on a resource', function(done) {
              let selectCalled = false
              initCalendar({
                eventAfterAllRender() {
                  $.simulateByPoint('drag', {
                    point: getResourceTimelinePoint('b', '2015-11-28T04:00:00'),
                    end: getResourceTimelinePoint('b', '2015-11-28T07:00:00'),
                    callback() {
                      expect(selectCalled).toBe(true)
                      done()
                    }
                  })
                },
                select(start, end, jsEvent, view, resource) {
                  selectCalled = true
                  expect(start).toEqualMoment(tz.moment('2015-11-28T04:00:00'))
                  expect(end).toEqualMoment(tz.moment('2015-11-28T07:30:00'))
                  expect(typeof jsEvent).toBe('object')
                  expect(typeof view).toBe('object')
                  expect(resource.id).toBe('b')
                }
              })
            })

            it('reports selection across resources', function(done) {
              let selectCalled = false
              initCalendar({
                eventAfterAllRender() {
                  $.simulateByPoint('drag', {
                    point: getResourceTimelinePoint('b', '2015-11-28T04:00:00'),
                    end: getResourceTimelinePoint('a', '2015-11-28T07:00:00'),
                    callback() {
                      expect(selectCalled).toBe(true)
                      done()
                    }
                  })
                },
                select(start, end, jsEvent, view, resource) {
                  selectCalled = true
                  expect(start).toEqualMoment(tz.moment('2015-11-28T04:00:00'))
                  expect(end).toEqualMoment(tz.moment('2015-11-28T07:30:00'))
                  expect(typeof jsEvent).toBe('object')
                  expect(typeof view).toBe('object')
                  expect(resource.id).toBe('b')
                }
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
            let selectCalled = false
            initCalendar({
              eventAfterAllRender() {
                $.simulateByPoint('drag', {
                  point: getResourceTimelinePoint('b', '2015-11-28T04:15:00'),
                  end: getResourceTimelinePoint('b', '2015-11-28T07:30:00'),
                  callback() {
                    expect(selectCalled).toBe(true)
                    done()
                  }
                })
              },
              select(start, end, jsEvent, view, resource) {
                selectCalled = true
                expect(start).toEqualMoment(tz.moment('2015-11-28T04:15:00'))
                expect(end).toEqualMoment(tz.moment('2015-11-28T07:45:00'))
                expect(typeof jsEvent).toBe('object')
                expect(typeof view).toBe('object')
                expect(resource.id).toBe('b')
              }
            })
          })
        })
      })
    })

    describe('when day scale', function() {
      pushOptions({
        defaultView: 'timelineMonth',
        slotDuration: { days: 1 }
      })

      it('reports untimed dates', function(done) {
        let selectCalled = false
        initCalendar({
          eventAfterAllRender() {
            $.simulateByPoint('drag', {
              point: getResourceTimelinePoint('a', '2015-11-03'),
              end: getResourceTimelinePoint('a', '2015-11-05'),
              callback() {
                expect(selectCalled).toBe(true)
                done()
              }
            })
          },
          select(start, end, jsEvent, view, resource) {
            selectCalled = true
            expect(start).toEqualMoment('2015-11-03')
            expect(end).toEqualMoment('2015-11-06')
            expect(typeof jsEvent).toBe('object')
            expect(typeof view).toBe('object')
            expect(resource.id).toBe('a')
          }
        })
      })
    })

    describe('when week scale', function() {
      pushOptions({
        defaultView: 'timelineYear',
        slotDuration: { weeks: 1 }
      })

      it('reports untimed dates', function(done) {
        let selectCalled = false
        initCalendar({
          eventAfterAllRender() {
            $.simulateByPoint('drag', {
              point: getResourceTimelinePoint('a', '2015-01-18'),
              end: getResourceTimelinePoint('a', '2015-02-08'),
              callback() {
                expect(selectCalled).toBe(true)
                done()
              }
            })
          },
          select(start, end, jsEvent, view, resource) {
            selectCalled = true
            expect(start).toEqualMoment('2015-01-18')
            expect(end).toEqualMoment('2015-02-15')
            expect(typeof jsEvent).toBe('object')
            expect(typeof view).toBe('object')
            expect(resource.id).toBe('a')
          }
        })
      })
    })
  })

  it('reports selection on a resource via touch', function(done) {
    let selectCalled = false
    initCalendar({
      isTouch: true,
      longPressDelay: 100,
      defaultView: 'timelineDay',
      eventAfterAllRender() {
        $.simulateByPoint('drag', {
          isTouch: true,
          delay: 200,
          point: getResourceTimelinePoint('b', '2015-11-28T04:00:00'),
          end: getResourceTimelinePoint('b', '2015-11-28T07:00:00'),
          callback() {
            expect(selectCalled).toBe(true)
            done()
          }
        })
      },
      select(start, end, jsEvent, view, resource) {
        selectCalled = true
        expect(start).toEqualMoment('2015-11-28T04:00:00')
        expect(end).toEqualMoment('2015-11-28T07:30:00')
        expect(typeof jsEvent).toBe('object')
        expect(typeof view).toBe('object')
        expect(resource.id).toBe('b')
      }
    })
  })
})
