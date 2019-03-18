import { getResourceTimelinePoint, getTimelineSlatEl } from '../lib/timeline'

describe('timeline dateClick', function() {
  pushOptions({
    now: '2015-11-28',
    scrollTime: '00:00',
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' }
    ]
  })

  describeOptions('dir', {
    'LTR': false,
    'RTL': true
  }, function() {

    describeTimeZones(function(tz) {

      describe('when time scale', function() {
        pushOptions({
          defaultView: 'resourceTimelineDay'
        })

        describe('when snap matches slots', function() {

          describe('when no resources', function() {
            pushOptions({
              defaultView: 'timelineDay'
            })

            it('reports date with no resource', function(done) {
              let dateClickCalled = false
              initCalendar({
                _eventsPositioned() {
                  const slatEl = getTimelineSlatEl('2015-11-28T04:30:00')
                  slatEl.simulate('drag', {
                    callback() {
                      expect(dateClickCalled).toBe(true)
                      done()
                    }
                  })
                },
                dateClick(arg) {
                  dateClickCalled = true
                  expect(arg.date).toEqualDate(tz.parseDate('2015-11-28T04:30:00'))
                  expect(typeof arg.jsEvent).toBe('object')
                  expect(typeof arg.view).toBe('object')
                  expect(arg.resource).toBeFalsy()
                }
              })
            })
          })

          describe('when resources', function() {

            it('won\'t report anything if not clicked on resource', function(done) {
              let dateClickCalled = false
              initCalendar({
                _eventsPositioned() {
                  const slatEl = getTimelineSlatEl('2015-11-28T04:30:00')
                  slatEl.simulate('drag', {
                    callback() {
                      expect(dateClickCalled).toBe(false)
                      done()
                    }
                  })
                },
                dateClick(arg) {
                  dateClickCalled = true
                }
              })
            })

            it('reports click on a resource', function(done) {
              let dateClickCalled = false
              initCalendar({
                _eventsPositioned() {
                  $.simulateByPoint('drag', {
                    point: getResourceTimelinePoint('b', '2015-11-28T04:30:00'),
                    callback() {
                      expect(dateClickCalled).toBe(true)
                      done()
                    }
                  })
                },
                dateClick(arg) {
                  dateClickCalled = true
                  expect(arg.date).toEqualDate(tz.parseDate('2015-11-28T04:30:00'))
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
            let dateClickCalled = false
            initCalendar({
              _eventsPositioned() {
                $.simulateByPoint('drag', {
                  point: getResourceTimelinePoint('b', '2015-11-28T04:15:00'),
                  callback() {
                    expect(dateClickCalled).toBe(true)
                    done()
                  }
                })
              },
              dateClick(arg) {
                dateClickCalled = true
                expect(arg.date).toEqualDate(tz.parseDate('2015-11-28T04:15:00'))
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
        defaultView: 'resourceTimelineMonth',
        slotDuration: { days: 1 }
      })

      it('reports untimed dates', function(done) {
        let dateClickCalled = false
        initCalendar({
          _eventsPositioned() {
            $.simulateByPoint('drag', {
              point: getResourceTimelinePoint('a', '2015-11-03'),
              callback() {
                expect(dateClickCalled).toBe(true)
                done()
              }
            })
          },
          dateClick(arg) {
            dateClickCalled = true
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
        defaultView: 'resourceTimelineYear',
        slotDuration: { weeks: 1 }
      })

      it('reports untimed dates', function(done) {
        let dateClickCalled = false
        initCalendar({
          _eventsPositioned() {
            $.simulateByPoint('drag', {
              point: getResourceTimelinePoint('a', '2015-01-18'),
              callback() {
                expect(dateClickCalled).toBe(true)
                done()
              }
            })
          },
          dateClick(arg) {
            dateClickCalled = true
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
