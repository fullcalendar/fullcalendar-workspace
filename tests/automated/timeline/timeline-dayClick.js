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
                dayClick(arg) {
                  dayClickCalled = true
                  expect(arg.date).toEqualDate(tz.createDate('2015-11-28T04:30:00'))
                  expect(typeof arg.jsEvent).toBe('object')
                  expect(typeof arg.view).toBe('object')
                  expect(arg.resource).toBeFalsy()
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
                dayClick(arg) {
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
                dayClick(arg) {
                  dayClickCalled = true
                  expect(arg.date).toEqualDate(tz.createDate('2015-11-28T04:30:00'))
                  expect(typeof arg.jsEvent).toBe('object')
                  expect(typeof arg.view).toBe('object')
                  expect(arg.resource.id).toBe('b')
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
              dayClick(arg) {
                dayClickCalled = true
                expect(arg.date).toEqualDate(tz.createDate('2015-11-28T04:15:00'))
                expect(typeof arg.jsEvent).toBe('object')
                expect(typeof arg.view).toBe('object')
                expect(arg.resource.id).toBe('b')
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
          dayClick(arg) {
            dayClickCalled = true
            expect(arg.date).toEqualDate('2015-11-03')
            expect(typeof arg.jsEvent).toBe('object')
            expect(typeof arg.view).toBe('object')
            expect(arg.resource.id).toBe('a')
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
          dayClick(arg) {
            dayClickCalled = true
            expect(arg.date).toEqualDate('2015-01-18')
            expect(typeof arg.jsEvent).toBe('object')
            expect(typeof arg.view).toBe('object')
            expect(arg.resource.id).toBe('a')
          }
        })
      })
    })
  })
})
