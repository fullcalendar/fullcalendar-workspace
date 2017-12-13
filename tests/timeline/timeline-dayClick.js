import { getResourceTimelinePoint, getTimelineSlatEl } from '../lib/timeline'

describe('timeline dayClick', function() {
  pushOptions({
    now: '2015-11-28',
    scrollTime: '00:00',
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' }
    ]
  })

  describeOptions('isRTL', {
    'LTR': false,
    'RTL': true
  }, function() {

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

            it('reports date with no resource', function(done) {
              let dayClickCalled = false
              initCalendar({
                eventAfterAllRender() {
                  const slatEl = getTimelineSlatEl('2015-11-28T04:30:00')
                  slatEl.simulate('drag', {
                    callback() {
                      expect(dayClickCalled).toBe(true)
                      done()
                    }
                  })
                },
                dayClick(date, jsEvent, view, resource) {
                  dayClickCalled = true
                  expect(date).toEqualMoment(tz.moment('2015-11-28T04:30:00'))
                  expect(typeof jsEvent).toBe('object')
                  expect(typeof view).toBe('object')
                  expect(resource).toBeFalsy()
                }
              })
            })
          })

          describe('when resources', function() {

            it('won\'t report anything if not clicked on resource', function(done) {
              let dayClickCalled = false
              initCalendar({
                eventAfterAllRender() {
                  const slatEl = getTimelineSlatEl('2015-11-28T04:30:00')
                  slatEl.simulate('drag', {
                    callback() {
                      expect(dayClickCalled).toBe(false)
                      done()
                    }
                  })
                },
                dayClick(date, jsEvent, view, resource) {
                  dayClickCalled = true
                }
              })
            })

            it('reports click on a resource', function(done) {
              let dayClickCalled = false
              initCalendar({
                eventAfterAllRender() {
                  $.simulateByPoint('drag', {
                    point: getResourceTimelinePoint('b', '2015-11-28T04:30:00'),
                    callback() {
                      expect(dayClickCalled).toBe(true)
                      done()
                    }
                  })
                },
                dayClick(date, jsEvent, view, resource) {
                  dayClickCalled = true
                  expect(date).toEqualMoment(tz.moment('2015-11-28T04:30:00'))
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
            let dayClickCalled = false
            initCalendar({
              eventAfterAllRender() {
                $.simulateByPoint('drag', {
                  point: getResourceTimelinePoint('b', '2015-11-28T04:15:00'),
                  callback() {
                    expect(dayClickCalled).toBe(true)
                    done()
                  }
                })
              },
              dayClick(date, jsEvent, view, resource) {
                dayClickCalled = true
                expect(date).toEqualMoment(tz.moment('2015-11-28T04:15:00'))
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
        let dayClickCalled = false
        initCalendar({
          eventAfterAllRender() {
            $.simulateByPoint('drag', {
              point: getResourceTimelinePoint('a', '2015-11-03'),
              callback() {
                expect(dayClickCalled).toBe(true)
                done()
              }
            })
          },
          dayClick(date, jsEvent, view, resource) {
            dayClickCalled = true
            expect(date).toEqualMoment('2015-11-03')
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
        let dayClickCalled = false
        initCalendar({
          eventAfterAllRender() {
            $.simulateByPoint('drag', {
              point: getResourceTimelinePoint('a', '2015-01-18'),
              callback() {
                expect(dayClickCalled).toBe(true)
                done()
              }
            })
          },
          dayClick(date, jsEvent, view, resource) {
            dayClickCalled = true
            expect(date).toEqualMoment('2015-01-18')
            expect(typeof jsEvent).toBe('object')
            expect(typeof view).toBe('object')
            expect(resource.id).toBe('a')
          }
        })
      })
    })
  })
})
