
describe('timeline event rendering', function() { // TAKE A REALLY LONG TIME B/C SO MANY LOOPS!
  pushOptions({
    now: '2015-10-17',
    scrollTime: '00:00'
  })

  describeOptions('timezone', {
    'with no timezone': false,
    'with UTC timezone': 'UTC',
    'with local timezone': 'local'
  }, function(timezone) {

    describeOptions('isRTL', {
      'when LTR': false,
      'when RTL': true
    }, function(isRTL) {

      describeOptions('resources', {
        'with no resources': null,
        'with resources': [ { id: 'a', title: 'resource a' } ]
      }, function(resources) {

        describeValues({
          'with non-background rendering': null,
          'with background events': 'background',
          'with inverse-background events': 'inverse-background'
        }, function(eventRendering) {

          describe('when time scale', function() {

            pushOptions({
              defaultView: 'timelineDay',
              slotDuration: { minutes: 30 }
            })

            describeOptions('snapDuration', {
              'with default snapDuration': null,
              'with halved snapDuration': { minutes: 15 }
            }, function() {

              it('renders correctly when event completely fits', function(done) {
                initCalendar({
                  events: [
                    makeEvent('event1', '2015-10-17T02:00:00', '2015-10-17T06:00:00')
                  ],
                  eventAfterAllRender() {
                    expectEventSlotSpan('event1', '2am', '5am')
                    expectEventIsStartEnd('event1', true, true)
                    done()
                  }
                })
              })

              it('renders correctly when event starts early', function(done) {
                initCalendar({
                  events: [
                    makeEvent('event1', '2015-10-16T22:00:00', '2015-10-17T06:00:00')
                  ],
                  eventAfterAllRender() {
                    expectEventSlotSpan('event1', '12am', '5am')
                    expectEventIsStartEnd('event1', false, true)
                    done()
                  }
                })
              })

              it('renders correctly when event ends late', function(done) {
                initCalendar({
                  events: [
                    makeEvent('event1', '2015-10-17T02:00:00', '2015-10-18T02:00:00')
                  ],
                  eventAfterAllRender() {
                    expectEventSlotSpan('event1', '2am', '11pm')
                    expectEventIsStartEnd('event1', true, false)
                    done()
                  }
                })
              })

              it('renders correctly when event starts/ends outside', function(done) {
                initCalendar({
                  events: [
                    makeEvent('event1', '2015-10-16T22:00:00', '2015-10-18T02:00:00')
                  ],
                  eventAfterAllRender() {
                    expectEventSlotSpan('event1', '12am', '11pm')
                    expectEventIsStartEnd('event1', false, false)
                    done()
                  }
                })
              })

              // minTime/maxTime
              if (!eventRendering) { // non-background, for faster tests

                it('doesn\'t render when on same day before minTime', function(done) {
                  initCalendar({
                    minTime: '09:00',
                    events: [
                      makeEvent('event1', '2015-10-17T02:00:00', '2015-10-17T09:00:00')
                    ],
                    eventAfterAllRender() {
                      expect($('.event1').length).toBe(0)
                      done()
                    }
                  })
                })

                it('renders correctly when on different day, cropped by minTime', function(done) {
                  initCalendar({
                    minTime: '03:00',
                    events: [
                      makeEvent('event1', '2015-10-16T12:00:00', '2015-10-17T06:00:00')
                    ],
                    eventAfterAllRender() {
                      expectEventSlotSpan('event1', '3am', '5am')
                      expectEventIsStartEnd('event1', false, true)
                      done()
                    }
                  })
                })

                it('renders correctly when on same day, cropped by minTime', function(done) {
                  initCalendar({
                    minTime: '03:00',
                    events: [
                      makeEvent('event1', '2015-10-17T02:00:00', '2015-10-17T06:00:00')
                    ],
                    eventAfterAllRender() {
                      expectEventSlotSpan('event1', '3am', '5am')
                      expectEventIsStartEnd('event1', false, true)
                      done()
                    }
                  })
                })

                it('doesn\'t render when on same day after maxTime', function(done) {
                  initCalendar({
                    scrollTime: '24:00', // the most possible
                    maxTime: '18:00',
                    events: [
                      makeEvent('event1', '2015-10-17T18:00:00', '2015-10-17T23:00:00')
                    ],
                    eventAfterAllRender() {
                      expect($('.event1').length).toBe(0)
                      done()
                    }
                  })
                })

                it('renders correctly when end on different day, cropped by maxTime', function(done) {
                  initCalendar({
                    scrollTime: '24:00', // the most possible
                    maxTime: '21:00', // last slot will be 8pm-9pm
                    events: [
                      makeEvent('event1', '2015-10-17T19:00:00', '2015-10-18T02:00:00')
                    ],
                    eventAfterAllRender() {
                      expectEventSlotSpan('event1', '7pm', '8pm')
                      expectEventIsStartEnd('event1', true, false)
                      done()
                    }
                  })
                })

                it('renders correctly when end on same day, cropped by maxTime', function(done) {
                  initCalendar({
                    scrollTime: '24:00', // the most possible
                    maxTime: '18:00', // last slot will be 5pm-6pm
                    events: [
                      makeEvent('event1', '2015-10-17T12:00:00', '2015-10-17T22:00:00')
                    ],
                    eventAfterAllRender() {
                      expectEventSlotSpan('event1', '12pm', '5pm')
                      expectEventIsStartEnd('event1', true, false)
                      done()
                    }
                  })
                })

                it('doesn\'t render when on dead zone between two days', function(done) {
                  initCalendar({
                    minTime: '09:00',
                    maxTime: '17:00', // on the 17th
                    defaultView: 'timelineTwoDay',
                    views: {
                      timelineTwoDay: {
                        type: 'timeline',
                        duration: { days: 2 }
                      }
                    },
                    events: [
                      makeEvent('event1', '2015-10-17T17:00:00', '2015-10-18T09:00:00')
                    ],
                    eventAfterAllRender() {
                      expect($('.event1').length).toBe(0)
                      done()
                    }
                  })
                })
              }
            })

            if (resources && !eventRendering) { // speedup

              it('renders events within exaggerated maxTime', function(done) {
                initCalendar({
                  minTime: '09:00',
                  maxTime: '28:00',
                  events: [
                    makeEvent('event1', '2015-10-17T08:00:00', '2015-10-18T02:00:00')
                  ],
                  eventAfterAllRender() {
                    expectEventSlotSpan('event1', '9am', '1am')
                    expectEventIsStartEnd('event1', false, true)
                    expect($('tr.fc-chrono th:first')).toHaveText('9am')
                    expect($('tr.fc-chrono th:last')).toHaveText('3am')
                    done()
                  }
                })
              })

              it('renders events past an exaggerated maxTime', function(done) {
                initCalendar({
                  minTime: '09:00',
                  maxTime: '28:00',
                  events: [
                    makeEvent('event1', '2015-10-17T08:00:00', '2015-10-18T05:00:00')
                  ],
                  eventAfterAllRender() {
                    expectEventSlotSpan('event1', '9am', '3am')
                    expectEventIsStartEnd('event1', false, false)
                    expect($('tr.fc-chrono th:first')).toHaveText('9am')
                    expect($('tr.fc-chrono th:last')).toHaveText('3am')
                    done()
                  }
                })
              })
            }

            if (!eventRendering) { // non-background
              it('render stacked events by duration', function(done) {
                initCalendar({
                  events: [
                    makeEvent('event1', '2015-10-17T02:00:00', '2015-10-17T06:00:00'),
                    makeEvent('event2', '2015-10-17T02:00:00', '2015-10-17T08:00:00')
                  ],
                  eventAfterAllRender() {
                    const event1El = $('.event1')
                    const event2El = $('.event2')
                    const event2Bottom = event2El.offset().top + event2El.outerHeight()
                    const event1Top = event1El.offset().top
                    expect(event2Bottom).toBeLessThan(event1Top)
                    done()
                  }
                })
              })
            }

            if (resources && (eventRendering === 'background')) {
              it('renders background events with no resource', function(done) {
                initCalendar({
                  events: [
                    {
                      title: 'event1',
                      className: 'event1',
                      rendering: eventRendering,
                      start: '2015-10-17T02:00:00',
                      end: '2015-10-17T06:00:00'
                    }
                  ],
                  eventAfterAllRender() {
                    expectEventSlotSpan('event1', '2am', '5am')
                    expectEventIsStartEnd('event1', true, true)
                    const eventEl = $('.event1')
                    const canvasEl = $('.fc-body .fc-time-area .fc-scroller-canvas')
                    expect(Math.abs(eventEl.outerHeight() - canvasEl.height())).toBeLessThan(3)
                    done()
                  }
                })
              })
            }
          })

          /*
          TODO: inverse-background doesn't work well with events rendered on day-scale or larger.
          Problems with Grid's rangeToSegs.
          SO, DISABLE TESTS, BUT FIX LATER
          */
          if (eventRendering !== 'inverse-background') {

            describe('when day scale', function() {

              pushOptions({
                defaultView: 'timeline3Week',
                views: {
                  timeline3Week: {
                    type: 'timeline',
                    duration: { weeks: 3 },
                    slotDuration: { days: 1 }
                  }
                }
              })

              it('renders correctly when event fits completely', function(done) {
                initCalendar({
                  events: [
                    makeEvent('event1', '2015-10-16', '2015-10-18')
                  ],
                  eventAfterAllRender() {
                    expectEventSlotSpan('event1', 'Fr 16', 'Sa 17')
                    expectEventIsStartEnd('event1', true, true)
                    done()
                  }
                })
              })

              it('renders correctly when event starts is before', function(done) {
                initCalendar({
                  events: [
                    makeEvent('event1', '2015-10-10', '2015-10-18')
                  ],
                  eventAfterAllRender() {
                    expectEventSlotSpan('event1', 'Su 11', 'Sa 17')
                    expectEventIsStartEnd('event1', false, true)
                    done()
                  }
                })
              })

              it('renders correctly when event end is after', function(done) {
                initCalendar({
                  events: [
                    makeEvent('event1', '2015-10-18', '2015-11-18')
                  ],
                  eventAfterAllRender() {
                    expectEventSlotSpan('event1', 'Su 18', 'Sa 31')
                    expectEventIsStartEnd('event1', true, false)
                    done()
                  }
                })
              })

              it('renders correctly when start/end is outside', function(done) {
                initCalendar({
                  events: [
                    makeEvent('event1', '2015-09-18', '2015-11-18')
                  ],
                  eventAfterAllRender() {
                    expectEventSlotSpan('event1', 'Su 11', 'Sa 31')
                    expectEventIsStartEnd('event1', false, false)
                    done()
                  }
                })
              })

              it('renders correctly when start/end is timed on same day', function(done) {
                initCalendar({
                  events: [
                    makeEvent('event1', '2015-10-16T04:00:00', '2015-10-16T05:00:00')
                  ],
                  eventAfterAllRender() {
                    expectEventSlotSpan('event1', 'Fr 16', 'Fr 16')
                    expectEventIsStartEnd('event1', true, true)
                    done()
                  }
                })
              })

              it('renders correctly when end time is before nextDayThreshold', function(done) {
                initCalendar({
                  nextDayThreshold: '02:00', // 2am
                  events: [
                    makeEvent('event1', '2015-10-16T04:00:00', '2015-10-18T01:00:00')
                  ],
                  eventAfterAllRender() {
                    expectEventSlotSpan('event1', 'Fr 16', 'Sa 17')
                    expectEventIsStartEnd('event1', true, true)
                    done()
                  }
                })
              })

              it('renders correctly when end time is after nextDayThreshold', function(done) {
                initCalendar({
                  nextDayThreshold: '02:00', // 2am
                  events: [
                    makeEvent('event1', '2015-10-16T04:00:00', '2015-10-18T03:00:00')
                  ],
                  eventAfterAllRender() {
                    expectEventSlotSpan('event1', 'Fr 16', 'Su 18')
                    expectEventIsStartEnd('event1', true, true)
                    done()
                  }
                })
              })

              // https://github.com/fullcalendar/fullcalendar-scheduler/issues/151
              it('renders correctly when minTime/maxTime', function(done) {
                initCalendar({
                  minTime: '09:00',
                  maxTime: '17:00',
                  events: [
                    makeEvent('event1', '2015-10-16', '2015-10-18')
                  ],
                  eventAfterAllRender() {
                    expectEventSlotSpan('event1', 'Fr 16', 'Sa 17')
                    expectEventIsStartEnd('event1', true, true)
                    done()
                  }
                })
              })
            })

            describe('when week scale', function() {

              pushOptions({
                defaultView: 'timeline52Weeks',
                views: {
                  timeline52Weeks: {
                    type: 'timeline',
                    duration: { weeks: 52 },
                    slotDuration: { weeks: 1 }
                  }
                },
                slotLabelFormat: 'M/D'
              })

              it('renders correctly when aligns with weeks', function(done) {
                initCalendar({
                  events: [
                    makeEvent('event1', '2015-10-18', '2015-11-15')
                  ],
                  eventAfterAllRender() {
                    expectEventSlotSpan('event1', '10/18', '11/8')
                    expectEventIsStartEnd('event1', true, true)
                    done()
                  }
                })
              })

              it('renders correctly when mis-aligned with weeks', function(done) {
                initCalendar({
                  events: [
                    makeEvent('event1', '2015-10-19', '2015-11-17')
                  ],
                  eventAfterAllRender() {
                    expectEventSlotSpan('event1', '10/18', '11/15')
                    expectEventIsStartEnd('event1', true, true)
                    done()
                  }
                })
              })
            })
          }

          /*
          Utils
          --------------------------------------------------------------------------------------------
          */

          function makeEvent(name, start, end) {
            return {
              title: name,
              className: name,
              rendering: eventRendering,
              resourceId: (resources != null ? resources[0].id : undefined),
              start,
              end
            }
          }

          function expectEventSlotSpan(eventName, firstSlotText, lastSlotText) {
            let eventEdges, spanLeft, spanRight
            const firstSlotEl = querySlot(firstSlotText)
            const lastSlotEl = querySlot(lastSlotText)
            expect(firstSlotEl.length).toBe(1)
            expect(lastSlotEl.length).toBe(1)

            if (!isRTL) {
              spanLeft = firstSlotEl.offset().left
              spanRight = lastSlotEl.offset().left + lastSlotEl.outerWidth()
            } else {
              spanLeft = lastSlotEl.offset().left
              spanRight = firstSlotEl.offset().left + firstSlotEl.outerWidth()
            }

            if (eventRendering === 'inverse-background') {
              eventEdges = getInverseBackgroundEventEdges(eventName)
            } else {
              eventEdges = getNormalEventEdges(eventName)
            }

            // TODO: tighten down to 1 or 2
            expect(Math.abs(spanLeft - eventEdges.left)).toBeLessThan(3)
            expect(Math.abs(spanRight - eventEdges.right)).toBeLessThan(3)
          }

          function getNormalEventEdges(eventName) {
            const eventEl = $(`.${eventName}`)
            expect(eventEl.length).toBe(1)
            return {
              left: eventEl.offset().left,
              right: eventEl.offset().left + eventEl.outerWidth()
            }
          }

          function getInverseBackgroundEventEdges(eventName) {
            const eventEl = $(`.${eventName}`)
            expect(eventEl.length).toBeLessThan(3)
            if (eventEl.length === 2) {
              if (!isRTL) {
                return {
                  left: eventEl.eq(0).offset().left + eventEl.eq(0).outerWidth(),
                  right: eventEl.eq(1).offset().left
                }
              } else {
                return {
                  left: eventEl.eq(1).offset().left + eventEl.eq(1).outerWidth(),
                  right: eventEl.eq(0).offset().left
                }
              }
            } else {
              const canvasEl = $('.fc-body .fc-time-area .fc-scroller-canvas > .fc-content')
              const canvasLeft = canvasEl.offset().left
              const canvasRight = canvasLeft + canvasEl.outerWidth()
              if (eventEl.length === 1) {
                const eventLeft = eventEl.offset().left
                const eventRight = eventLeft + eventEl.outerWidth()
                const leftGap = eventLeft - canvasLeft
                const rightGap = canvasRight - eventRight
                if (leftGap > rightGap) {
                  return {
                    left: canvasLeft,
                    right: eventLeft
                  }
                } else {
                  return {
                    left: eventRight,
                    right: canvasRight
                  }
                }
              } else {
                return {
                  left: canvasLeft,
                  right: canvasRight
                }
              }
            }
          }

          function expectEventIsStartEnd(eventName, isStart, isEnd) {
            if (!eventRendering) { // non-background
              const eventEl = $(`.${eventName}`)
              expect(eventEl.length).toBe(1)
              expect(eventEl.hasClass('fc-start')).toBe(isStart)
              expect(eventEl.hasClass('fc-end')).toBe(isEnd)
            }
          }

          function querySlot(slotText) {
            return $(`.fc-head .fc-time-area th:contains(${slotText})`)
              .filter(function(i, node) {
                return $(node).text() === slotText
              })
          }
        })
      })
    })
  })
})
