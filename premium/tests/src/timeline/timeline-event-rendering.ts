import { CalendarWrapper } from 'fullcalendar-tests/src/lib/wrappers/CalendarWrapper'
import { anyElsIntersect } from 'fullcalendar-tests/src/lib/dom-geom'
import { filterVisibleEls } from 'fullcalendar-tests/src/lib/dom-misc'
import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'
import { TimelineViewWrapper } from '../lib/wrappers/TimelineViewWrapper'

describe('timeline event rendering', () => { // TAKE A REALLY LONG TIME B/C SO MANY LOOPS!
  pushOptions({
    now: '2015-10-17',
    scrollTime: '00:00',
  })

  describeOptions('timeZone', {
    'with UTC timeZone': 'UTC',
    'with local timeZone': 'local',
  }, (timeZone) => {
    describeOptions('direction', {
      'when LTR': 'ltr',
      'when RTL': 'rtl',
    }, (direction) => {
      describeOptions('resources', {
        'with no resources': null,
        'with resources': [{ id: 'a', title: 'resource a' }],
      }, (resources) => {
        let ViewWrapper = resources ? ResourceTimelineViewWrapper : TimelineViewWrapper

        describeValues({
          'with non-background rendering': '',
          'with background events': 'background',
          'with inverse-background events': 'inverse-background',
        }, (eventDisplay) => {
          describe('when time scale', () => {
            pushOptions({
              initialView: resources ? 'resourceTimelineDay' : 'timelineDay',
              slotDuration: { minutes: 30 },
            })

            describeOptions('snapDuration', {
              'with default snapDuration': null,
              'with halved snapDuration': { minutes: 15 },
            }, () => {
              it('renders correctly when event completely fits', () => {
                let calendar = initCalendar({
                  events: [
                    makeEvent('event1', '2015-10-17T02:00:00', '2015-10-17T06:00:00'),
                  ],
                })
                expectEventRendering(calendar, 'event1', {
                  startDate: '2015-10-17T02:00:00',
                  endDate: '2015-10-17T06:00:00',
                  isStart: true,
                  isEnd: true,
                })
              })

              it('renders correctly when event starts early', () => {
                let calendar = initCalendar({
                  events: [
                    makeEvent('event1', '2015-10-16T22:00:00', '2015-10-17T06:00:00'),
                  ],
                })
                expectEventRendering(calendar, 'event1', {
                  startDate: '2015-10-17T00:00:00',
                  endDate: '2015-10-17T06:00:00',
                  isStart: false,
                  isEnd: true,
                })
              })

              it('renders correctly when event ends late', () => {
                let calendar = initCalendar({
                  events: [
                    makeEvent('event1', '2015-10-17T02:00:00', '2015-10-18T02:00:00'),
                  ],
                })
                expectEventRendering(calendar, 'event1', {
                  startDate: '2015-10-17T02:00:00',
                  endDate: '2015-10-18T00:00:00',
                  isStart: true,
                  isEnd: false,
                })
              })

              it('renders correctly when event starts/ends outside', () => {
                let calendar = initCalendar({
                  events: [
                    makeEvent('event1', '2015-10-16T22:00:00', '2015-10-18T02:00:00'),
                  ],
                })
                expectEventRendering(calendar, 'event1', {
                  startDate: '2015-10-17T00:00:00',
                  endDate: '2015-10-18T00:00:00',
                  isStart: false,
                  isEnd: false,
                })
              })

              // slotMinTime/slotMaxTime
              if (!eventDisplay) { // non-background, for faster tests
                it('doesn\'t render when on same day before slotMinTime', () => {
                  initCalendar({
                    slotMinTime: '09:00',
                    events: [
                      makeEvent('event1', '2015-10-17T02:00:00', '2015-10-17T09:00:00'),
                    ],
                  })
                  expect($('.event1').length).toBe(0)
                })

                it('renders correctly when on different day, cropped by slotMinTime', () => {
                  let calendar = initCalendar({
                    slotMinTime: '03:00',
                    events: [
                      makeEvent('event1', '2015-10-16T12:00:00', '2015-10-17T06:00:00'),
                    ],
                  })
                  expectEventRendering(calendar, 'event1', {
                    startDate: '2015-10-17T03:00:00',
                    endDate: '2015-10-17T06:00:00',
                    isStart: false,
                    isEnd: true,
                  })
                })

                it('renders correctly when on same day, cropped by slotMinTime', () => {
                  let calendar = initCalendar({
                    slotMinTime: '03:00',
                    events: [
                      makeEvent('event1', '2015-10-17T02:00:00', '2015-10-17T06:00:00'),
                    ],
                  })
                  expectEventRendering(calendar, 'event1', {
                    startDate: '2015-10-17T03:00:00',
                    endDate: '2015-10-17T06:00:00',
                    isStart: false,
                    isEnd: true,
                  })
                })

                it('doesn\'t render when on same day after slotMaxTime', () => {
                  initCalendar({
                    scrollTime: '24:00', // the most possible
                    slotMaxTime: '18:00',
                    events: [
                      makeEvent('event1', '2015-10-17T18:00:00', '2015-10-17T23:00:00'),
                    ],
                  })
                  expect($('.event1').length).toBe(0)
                })

                it('renders correctly when end on different day, cropped by slotMaxTime', () => {
                  let calendar = initCalendar({
                    scrollTime: '24:00', // the most possible
                    slotMaxTime: '21:00', // last slot will be 8pm-9pm
                    events: [
                      makeEvent('event1', '2015-10-17T19:00:00', '2015-10-18T02:00:00'),
                    ],
                  })
                  expectEventRendering(calendar, 'event1', {
                    startDate: '2015-10-17T19:00:00',
                    endDate: '2015-10-17T21:00:00',
                    isStart: true,
                    isEnd: false,
                  })
                })

                it('renders correctly when end on same day, cropped by slotMaxTime', () => {
                  let calendar = initCalendar({
                    scrollTime: '24:00', // the most possible
                    slotMaxTime: '18:00', // last slot will be 5pm-6pm
                    events: [
                      makeEvent('event1', '2015-10-17T12:00:00', '2015-10-17T22:00:00'),
                    ],
                  })
                  expectEventRendering(calendar, 'event1', {
                    startDate: '2015-10-17T12:00:00',
                    endDate: '2015-10-17T18:00:00',
                    isStart: true,
                    isEnd: false,
                  })
                })

                it('doesn\'t render when on dead zone between two days', () => {
                  initCalendar({
                    slotMinTime: '09:00',
                    slotMaxTime: '17:00', // on the 17th
                    initialView: 'timelineTwoDay',
                    views: {
                      timelineTwoDay: {
                        type: resources ? 'resourceTimeline' : 'timeline',
                        duration: { days: 2 },
                      },
                    },
                    events: [
                      makeEvent('event1', '2015-10-17T17:00:00', '2015-10-18T09:00:00'),
                    ],
                  })
                  expect($('.event1').length).toBe(0)
                })
              }
            })

            if (resources && !eventDisplay) { // speedup
              it('renders events within exaggerated slotMaxTime', () => {
                let calendar = initCalendar({
                  slotMinTime: '09:00',
                  slotMaxTime: '28:00',
                  events: [
                    makeEvent('event1', '2015-10-17T08:00:00', '2015-10-18T02:00:00'),
                  ],
                  scrollTime: '24:00',
                })
                expectEventRendering(calendar, 'event1', {
                  startDate: '2015-10-17T09:00:00',
                  endDate: '2015-10-18T02:00:00',
                  isStart: false,
                  isEnd: true,
                })
              })

              it('renders events past an exaggerated slotMaxTime', () => {
                let calendar = initCalendar({
                  slotMinTime: '09:00',
                  slotMaxTime: '28:00',
                  events: [
                    makeEvent('event1', '2015-10-17T08:00:00', '2015-10-18T05:00:00'),
                  ],
                })
                expectEventRendering(calendar, 'event1', {
                  startDate: '2015-10-17T09:00:00',
                  endDate: '2015-10-18T04:00:00',
                  isStart: false,
                  isEnd: false,
                })
              })
            }

            if (!eventDisplay) { // non-background
              it('render stacked events by duration', () => {
                initCalendar({
                  events: [
                    makeEvent('event1', '2015-10-17T02:00:00', '2015-10-17T06:00:00'),
                    makeEvent('event2', '2015-10-17T02:00:00', '2015-10-17T08:00:00'),
                  ],
                })
                let event1El = $('.event1')
                let event2El = $('.event2')
                let event2Bottom = event2El.offset().top + event2El.outerHeight()
                let event1Top = event1El.offset().top
                expect(event2Bottom).toBeLessThan(event1Top)
              })
            }

            if (resources && eventDisplay === 'background') {
              it('renders background events with no resource', () => {
                let calendar = initCalendar({
                  events: [
                    {
                      title: 'event1',
                      className: 'event1',
                      display: eventDisplay,
                      start: '2015-10-17T02:00:00',
                      end: '2015-10-17T06:00:00',
                    },
                  ],
                })
                expectEventRendering(calendar, 'event1', {
                  startDate: '2015-10-17T02:00:00',
                  endDate: '2015-10-17T06:00:00',
                  isStart: true,
                  isEnd: true,
                })

                let eventEl = $('.event1')[0]
                let canvasEl = new ViewWrapper(calendar).timelineGrid.el
                expect(eventEl.offsetHeight).toBeCloseTo(canvasEl.offsetHeight)
              })
            }
          })

          /*
          TODO: inverse-background doesn't work well with events rendered on day-scale or larger.
          Problems with Grid's rangeToSegs.
          SO, DISABLE TESTS, BUT FIX LATER
          */
          if (eventDisplay !== 'inverse-background') {
            describe('when day scale', () => {
              pushOptions({
                initialView: 'timeline3Week',
                views: {
                  timeline3Week: {
                    type: resources ? 'resourceTimeline' : 'timeline',
                    duration: { weeks: 3 },
                    slotDuration: { days: 1 },
                  },
                },
              })

              it('renders correctly when event fits completely', () => {
                let calendar = initCalendar({
                  events: [
                    makeEvent('event1', '2015-10-16', '2015-10-18'),
                  ],
                })
                expectEventRendering(calendar, 'event1', {
                  startDate: '2015-10-16',
                  endDate: '2015-10-18',
                  isStart: true,
                  isEnd: true,
                })
              })

              it('renders correctly when event starts is before', () => {
                let calendar = initCalendar({
                  events: [
                    makeEvent('event1', '2015-10-10', '2015-10-18'),
                  ],
                })
                expectEventRendering(calendar, 'event1', {
                  startDate: '2015-10-11',
                  endDate: '2015-10-18',
                  isStart: false,
                  isEnd: true,
                })
              })

              it('renders correctly when event end is after', () => {
                let calendar = initCalendar({
                  events: [
                    makeEvent('event1', '2015-10-18', '2015-11-18'),
                  ],
                })
                expectEventRendering(calendar, 'event1', {
                  startDate: '2015-10-18',
                  endDate: '2015-11-01',
                  isStart: true,
                  isEnd: false,
                })
              })

              it('renders correctly when start/end is outside', () => {
                let calendar = initCalendar({
                  events: [
                    makeEvent('event1', '2015-09-18', '2015-11-18'),
                  ],
                })
                expectEventRendering(calendar, 'event1', {
                  startDate: '2015-10-11',
                  endDate: '2015-11-01',
                  isStart: false,
                  isEnd: false,
                })
              })

              it('renders correctly when start/end is timed on same day', () => {
                let calendar = initCalendar({
                  events: [
                    makeEvent('event1', '2015-10-16T04:00:00', '2015-10-16T05:00:00'),
                  ],
                })
                expectEventRendering(calendar, 'event1', {
                  startDate: '2015-10-16',
                  endDate: '2015-10-17',
                  isStart: true,
                  isEnd: true,
                })
              })

              it('renders correctly when end time is before nextDayThreshold', () => {
                let calendar = initCalendar({
                  nextDayThreshold: '02:00', // 2am
                  events: [
                    makeEvent('event1', '2015-10-16T04:00:00', '2015-10-18T01:00:00'),
                  ],
                })
                expectEventRendering(calendar, 'event1', {
                  startDate: '2015-10-16',
                  endDate: '2015-10-18',
                  isStart: true,
                  isEnd: true,
                })
              })

              it('renders correctly when end time is after nextDayThreshold', () => {
                let calendar = initCalendar({
                  nextDayThreshold: '02:00', // 2am
                  events: [
                    makeEvent('event1', '2015-10-16T04:00:00', '2015-10-18T03:00:00'),
                  ],
                })
                expectEventRendering(calendar, 'event1', {
                  startDate: '2015-10-16',
                  endDate: '2015-10-19',
                  isStart: true,
                  isEnd: true,
                })
              })

              // https://github.com/fullcalendar/fullcalendar-scheduler/issues/151
              it('renders correctly when slotMinTime/slotMaxTime', () => {
                let calendar = initCalendar({
                  slotMinTime: '09:00',
                  slotMaxTime: '17:00',
                  events: [
                    makeEvent('event1', '2015-10-16', '2015-10-18'),
                  ],
                })
                expectEventRendering(calendar, 'event1', {
                  startDate: '2015-10-16',
                  endDate: '2015-10-18',
                  isStart: true,
                  isEnd: true,
                })
              })
            })

            describe('when week scale', () => {
              pushOptions({
                initialView: 'timeline52Weeks',
                views: {
                  timeline52Weeks: {
                    type: resources ? 'resourceTimeline' : 'timeline',
                    duration: { weeks: 52 },
                    slotDuration: { weeks: 1 },
                  },
                },
                slotLabelFormat: { month: 'numeric', day: 'numeric' },
              })

              it('renders correctly when aligns with weeks', () => {
                let calendar = initCalendar({
                  events: [
                    makeEvent('event1', '2015-10-18', '2015-11-15'),
                  ],
                })
                expectEventRendering(calendar, 'event1', {
                  startDate: '2015-10-18',
                  endDate: '2015-11-15',
                  isStart: true,
                  isEnd: true,
                })
              })

              it('renders correctly when mis-aligned with weeks', () => {
                let calendar = initCalendar({
                  events: [
                    makeEvent('event1', '2015-10-19', '2015-11-17'),
                  ],
                })
                expectEventRendering(calendar, 'event1', {
                  startDate: '2015-10-18',
                  endDate: '2015-11-22',
                  isStart: true,
                  isEnd: true,
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
              display: eventDisplay,
              resourceId: (resources != null ? resources[0].id : undefined),
              start,
              end,
            }
          }

          function expectEventRendering(calendar, eventClassName, options) {
            let viewWrapper = new ViewWrapper(calendar)
            let timelineGridWrapper = viewWrapper.timelineGrid
            let $eventEls = $('.' + eventClassName, viewWrapper.el)
            let eventEdges = getEventEdges($eventEls, timelineGridWrapper.el)
            let isBg = Boolean(eventDisplay)

            let startDiff = Math.abs(eventEdges.start - timelineGridWrapper.getLeft(options.startDate))
            let endDiff = Math.abs(eventEdges.end - timelineGridWrapper.getLeft(options.endDate))

            // TODO: tighten up
            expect(startDiff).toBeLessThanOrEqual(1)
            expect(endDiff).toBeLessThanOrEqual(1)

            if (!isBg) {
              expect($eventEls.length).toBe(1)
              expect($eventEls.hasClass(CalendarWrapper.EVENT_IS_START_CLASSNAME)).toBe(options.isStart)
              expect($eventEls.hasClass(CalendarWrapper.EVENT_IS_END_CLASSNAME)).toBe(options.isEnd)
            }
          }

          function getEventEdges($eventEls, canvasEl) { // gives start/end. fake-fills trailing gap
            let isBg = Boolean(eventDisplay)
            let edges

            if (eventDisplay === 'inverse-background') {
              edges = getInverseBackgroundEventEdges($eventEls, canvasEl)
            } else {
              edges = getNormalEventEdges($eventEls)
            }

            if (direction === 'rtl') {
              return { start: edges.right, end: edges.left - (isBg ? 0 : 1) }
            }

            return { start: edges.left, end: edges.right + (isBg ? 0 : 1) }
          }

          function getNormalEventEdges($eventEls) {
            expect($eventEls.length).toBe(1)
            return {
              left: $eventEls.offset().left,
              right: $eventEls.offset().left + $eventEls.outerWidth(),
            }
          }

          function getInverseBackgroundEventEdges($eventEls, canvasEl) {
            expect($eventEls.length).toBeLessThan(3)

            if ($eventEls.length === 2) {
              if (direction === 'ltr') {
                return {
                  left: $eventEls.eq(0).offset().left + $eventEls.eq(0).outerWidth(),
                  right: $eventEls.eq(1).offset().left,
                }
              }
              return {
                left: $eventEls.eq(1).offset().left + $eventEls.eq(1).outerWidth(),
                right: $eventEls.eq(0).offset().left,
              }
            }

            let $canvasEl = $(canvasEl)
            let canvasLeft = $canvasEl.offset().left
            let canvasRight = canvasLeft + $canvasEl.outerWidth()

            if ($eventEls.length === 1) {
              let eventLeft = $eventEls.offset().left
              let eventRight = eventLeft + $eventEls.outerWidth()
              let leftGap = eventLeft - canvasLeft
              let rightGap = canvasRight - eventRight

              if (leftGap > rightGap) {
                return {
                  left: canvasLeft,
                  right: eventLeft,
                }
              }
              return {
                left: eventRight,
                right: canvasRight,
              }
            }

            return {
              left: canvasLeft,
              right: canvasRight,
            }
          }
        })
      })
    })
  })

  // https://github.com/fullcalendar/fullcalendar/issues/5413
  it('doesn\'t collide when events are different heights', () => {
    let calendar = initCalendar({
      initialView: 'timelineDay',
      initialDate: '2020-05-12',
      slotMinTime: '08:00:00',
      events: [
        { id: '2', resourceId: 'b', start: '2020-05-12T08:00:00', end: '2020-05-12T22:00:00', title: 'event 2' },
        { id: '3', resourceId: 'b', start: '2020-05-12T09:00:00', end: '2020-05-12T22:00:00', title: 'event 3' },
      ],
      eventContent(arg) {
        let innerHTML = arg.event.title
        if (arg.event.id === '2') {
          innerHTML += '<br><br><br><br>'
        } else {
          innerHTML += '<br><br>'
        }
        return { html: '<div class="fc-event-description">' + innerHTML + '</div>' }
      },
    })
    let timelineGridWrapper = new TimelineViewWrapper(calendar).timelineGrid
    let eventEls = timelineGridWrapper.getEventEls()
    expect(anyElsIntersect(eventEls)).toBe(false)
  })

  // https://github.com/fullcalendar/fullcalendar/issues/5549
  // repro that doesn't need zoom: https://codepen.io/arshaw/pen/NWxvjwv?editable=true&editors=001
  it('condenses events even when left/right are not computed as integers', () => {
    let calendar = initCalendar({
      initialDate: '2018-12-13',
      initialView: 'resourceTimelineTenDay',
      views: {
        resourceTimelineTenDay: {
          type: 'resourceTimeline',
          duration: { days: 10 },
        },
      },
      resources: [
        { id: 'a', title: 'Auditorium A' },
      ],
      events: [
        {
          id: '3',
          resourceId: 'a',
          start: '2018-12-13T08:00:00.2052265',
          end: '2018-12-13T10:00:04.2052265',
          title: 'Event 3',
        },
        {
          id: '4',
          resourceId: 'a',
          start: '2018-12-13T07:00:00.2052265',
          end: '2018-12-13T08:00:04.2052265',
          title: 'Verry verry verry  long named event',
        },
      ],
    })
    let timelineGridWrapper = new TimelineViewWrapper(calendar).timelineGrid
    let eventEls = timelineGridWrapper.getEventEls()
    let eventTop0 = eventEls[0].getBoundingClientRect().top
    let eventTop1 = eventEls[1].getBoundingClientRect().top
    expect(Math.abs(eventTop0 - eventTop1)).toBeLessThan(1)
  })

  // https://github.com/fullcalendar/fullcalendar/issues/6395
  it('does not overlap events when different heights', () => {
    let calendar = initCalendar({
      initialDate: '2021-06-24',
      initialView: 'resourceTimelineDay',
      slotMinTime: '05:00',
      resources: [
        { id: 'a', title: 'Auditorium A' },
      ],
      eventContent: (arg) => ({
        html: arg.event.title,
      }),
      events: [
        {
          resourceId: 'a',
          title: 'event1',
          start: '2021-06-24T06:00:00+00:00',
          end: '2021-06-24T08:00:00+00:00',
        },
        {
          resourceId: 'a',
          title: '<div><div>event 2</div><div>line 2</div></div>',
          start: '2021-06-24T06:00:00+00:00',
          end: '2021-06-24T08:00:00+00:00',
        },

        {
          resourceId: 'a',
          title: 'event 3',
          start: '2021-06-24T09:00:00+00:00',
          end: '2021-06-24T10:00:00+00:00',
        },
        {
          resourceId: 'a',
          title: 'event 4',
          start: '2021-06-24T09:00:00+00:00',
          end: '2021-06-24T10:00:00+00:00',
        },
        {
          resourceId: 'a',
          title: '<div><div>event 5</div><div>line 2</div></div>',
          start: '2021-06-24T12:00:00+00:00',
          end: '2021-06-25T06:00:00+00:00',
        },
        {
          resourceId: 'a',
          title: '<div><div>event 6</div><div>line 2</div></div>',
          start: '2021-06-24T12:00:00+00:00',
          end: '2021-06-25T06:00:00+00:00',
        },
        {
          resourceId: 'a',
          title: '<div><div>event 7</div><div>line 2</div></div>',
          start: '2021-06-24T12:00:00+00:00',
          end: '2021-06-25T06:00:00+00:00',
        },
      ],
    })
    let timelineGridWrapper = new TimelineViewWrapper(calendar).timelineGrid
    let eventEls = timelineGridWrapper.getEventEls()
    let visibleEventEls = filterVisibleEls(eventEls)
    expect(visibleEventEls.length).toBe(7)
    expect(anyElsIntersect(visibleEventEls)).toBe(false)
  })
})
