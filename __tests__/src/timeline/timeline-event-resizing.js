import { TimelineViewWrapper } from "../lib/wrappers/TimelineViewWrapper"
import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'
import { CalendarWrapper } from 'standard-tests/src/lib/wrappers/CalendarWrapper'

// TODO: do resizing from the start
// TODO: more tests when slotDuration=1week, no event end. resize behavior?

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

  describeOptions('direction', {
    'LTR': 'ltr',
    'RTL': 'rtl'
  }, function(direction) {

    describeTimeZones(function(tz) {

      describe('when time scale', function() {
        pushOptions({
          initialView: 'resourceTimelineDay'
        })

        describe('when snap matches slots', function() {

          describe('when no resources', function() {
            pushOptions({
              initialView: 'timelineDay'
            })

            it('reports resize with no resource', function(done) {
              let resizeSpy
              let calendar = initCalendar({
                events: [
                  { title: 'event1', className: 'event1', start: '2015-11-28T04:00:00', end: '2015-11-28T05:00:00' }
                ],
                eventResize:
                  (resizeSpy = spyCall(function(arg) {
                    expect(arg.event.start).toEqualDate(tz.parseDate('2015-11-28T04:00:00'))
                    expect(arg.event.end).toEqualDate(tz.parseDate('2015-11-28T07:30:00'))

                    let resources = arg.event.getResources()
                    expect(resources.length).toBe(0)
                  }))
              })

              let timelineGridWrapper = new TimelineViewWrapper(calendar).timelineGrid
              timelineGridWrapper.resizeEvent(
                $('.event1')[0],
                '2015-11-28T07:30:00'
              ).then(() => {
                expect(resizeSpy).toHaveBeenCalled()
                expect(timelineGridWrapper.getHighlightEls().length).toBe(0) // TODO: move to its own test
                done()
              })
            })
          })

          describe('when resources', function() {

            it('reports resize on a resource', function(done) {
              let resizeSpy
              let calendar = initCalendar({
                events: [
                  { title: 'event1', className: 'event1', start: '2015-11-28T04:00:00', end: '2015-11-28T05:00:00', resourceId: 'b' }
                ],
                eventResize:
                  (resizeSpy = spyCall(function(arg) {
                    expect(arg.event.start).toEqualDate(tz.parseDate('2015-11-28T04:00:00'))
                    expect(arg.event.end).toEqualDate(tz.parseDate('2015-11-28T07:30:00'))

                    let resources = arg.event.getResources()
                    expect(resources.length).toBe(1)
                    expect(resources[0].id).toBe('b')
                  }))
              })

              let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid
              timelineGridWrapper.resizeEvent(
                $('.event1')[0], 'b', '2015-11-28T07:30:00'
              ).then(() => {
                expect(resizeSpy).toHaveBeenCalled()
                expect(timelineGridWrapper.getHighlightEls().length).toBe(0) // TODO: move to its own test
                done()
              })
            })

            it('reports resize across resources', function(done) {
              let resizeSpy
              let calendar = initCalendar({
                events: [
                  { title: 'event1', className: 'event1', start: '2015-11-28T04:00:00', end: '2015-11-28T05:00:00', resourceId: 'b' }
                ],
                eventResize:
                  (resizeSpy = spyCall(function(arg) {
                    expect(arg.event.start).toEqualDate(tz.parseDate('2015-11-28T04:00:00'))
                    expect(arg.event.end).toEqualDate(tz.parseDate('2015-11-28T07:30:00'))

                    let resources = arg.event.getResources()
                    expect(resources.length).toBe(1)
                    expect(resources[0].id).toBe('b')
                  }))
              })

              let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid
              timelineGridWrapper.resizeEvent(
                $('.event1')[0], 'a', '2015-11-28T07:30:00'
              ).then(() => {
                expect(resizeSpy).toHaveBeenCalled()
                done()
              })
            })

            it('reports resize on one event of multiple resources', function(done) {
              let resizeSpy
              let calendar = initCalendar({
                events: [
                  { title: 'event1', className: 'event1', start: '2015-11-28T04:00:00', end: '2015-11-28T05:00:00', resourceIds: [ 'a', 'b' ] }
                ],
                eventResize:
                  (resizeSpy = spyCall(function(arg) {
                    expect(arg.event.start).toEqualDate(tz.parseDate('2015-11-28T04:00:00'))
                    expect(arg.event.end).toEqualDate(tz.parseDate('2015-11-28T07:30:00'))

                    let resourceIds = arg.event.getResources().map((resource) => resource.id)
                    resourceIds.sort()
                    expect(resourceIds).toEqual([ 'a', 'b' ])
                  }))
              })

              let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid
              timelineGridWrapper.resizeEvent(
                $('.event1:first')[0], 'a', '2015-11-28T07:30:00'
              ).then(() => {
                expect(resizeSpy).toHaveBeenCalled()
                done()
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
            let calendar = initCalendar({
              events: [
                { title: 'event1', className: 'event1', start: '2015-11-28T04:00:00', end: '2015-11-28T05:00:00', resourceId: 'b' }
              ],
              eventResize:
                (resizeSpy = spyCall(function(arg) {
                  expect(arg.event.start).toEqualDate(tz.parseDate('2015-11-28T04:00:00'))
                  expect(arg.event.end).toEqualDate(tz.parseDate('2015-11-28T07:45:00'))

                  let resources = arg.event.getResources()
                  expect(resources.length).toBe(1)
                  expect(resources[0].id).toBe('b')
                }))
            })

            let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid
            timelineGridWrapper.resizeEvent(
              $('.event1')[0], 'b', '2015-11-28T07:45:00'
            ).then(() => {
              expect(resizeSpy).toHaveBeenCalled()
              done()
            })
          })
        })
      })
    })

    it('works with touch', function(done) {
      let resizeSpy
      let calendar = initCalendar({
        longPressDelay: 100,
        initialView: 'resourceTimelineDay',
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-28T04:00:00', end: '2015-11-28T05:00:00', resourceId: 'b' }
        ],
        eventResize:
          (resizeSpy = spyCall(function(arg) {
            expect(arg.event.start).toEqualDate('2015-11-28T04:00:00Z')
            expect(arg.event.end).toEqualDate('2015-11-28T07:30:00Z')

            let resources = arg.event.getResources()
            expect(resources.length).toBe(1)
            expect(resources[0].id).toBe('b')
          }))
      })

      let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid

      $('.event1').simulate('drag', {
        isTouch: true,
        delay: 200,
        callback() {
          $('.event1').simulate('mouseover') // resizer only shows on hover
          $(`.event1 .${CalendarWrapper.EVENT_END_RESIZER_CLASSNAME}`).simulate('drag', {
            // hack to make resize start within the bounds of the event
            localPoint: { top: '50%', left: (direction === 'rtl' ? '100%' : '0%') },
            isTouch: true,
            end: timelineGridWrapper.getPoint('b', '2015-11-28T07:00:00'),
            callback() {
              setTimeout(function() { // for next test. won't ignore mousedown
                expect(resizeSpy).toHaveBeenCalled()
                done()
              }, 500)
            }
          })
        }
      })
    })

    describe('when day scale', function() {
      pushOptions({
        initialView: 'resourceTimelineMonth',
        slotDuration: { days: 1 }
      })

      it('reports untimed dates', function(done) {
        let resizeSpy
        let calendar = initCalendar({
          events: [
            { title: 'event1', className: 'event1', start: '2015-11-03', resourceId: 'a' }
          ],
          eventResize:
            (resizeSpy = spyCall(function(arg) {
              expect(arg.event.start).toEqualDate('2015-11-03')
              expect(arg.event.end).toEqualDate('2015-11-06')

              let resources = arg.event.getResources()
              expect(resources.length).toBe(1)
              expect(resources[0].id).toBe('a')
            }))
        })

        let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid
        timelineGridWrapper.resizeEvent(
          $('.event1')[0], 'a', '2015-11-06'
        ).then(() => {
          expect(resizeSpy).toHaveBeenCalled()
          done()
        })
      })
    })

    describe('when week scale', function() {
      pushOptions({
        initialView: 'resourceTimelineYear',
        slotDuration: { weeks: 1 },
        slotMinWidth: 50
      })

      it('reports untimed dates', function(done) { // TODO: this is desired behavior when no end???
        let resizeSpy
        let calendar = initCalendar({
          events: [
            { title: 'event1', className: 'event1', start: '2015-01-18', end: '2015-01-25', resourceId: 'a' }
          ],
          eventResize:
            (resizeSpy = spyCall(function(arg) {
              expect(arg.event.start).toEqualDate('2015-01-18')
              expect(arg.event.end).toEqualDate('2015-02-15')

              let resources = arg.event.getResources()
              expect(resources.length).toBe(1)
              expect(resources[0].id).toBe('a')
            }))
        })

        let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid
        timelineGridWrapper.resizeEvent(
          $('.event1')[0], 'a', '2015-02-15'
        ).then(() => {
          expect(resizeSpy).toHaveBeenCalled()
          done()
        })
      })
    })
  })

  describe('mirror', function() {

    it('gets passed into render hooks', function(done) {
      let mirrorMountCnt = 0
      let mirrorContentCnt = 0
      let mirrorUnmountCnt = 0

      let calendar = initCalendar({
        initialView: 'resourceTimelineDay',
        eventDragMinDistance: 0, // so mirror will render immediately upon mousedown
        slotDuration: '01:00',
        snapDuration: '01:00',
        events: [
          { start: '2015-11-28T01:00:00', end: '2015-11-28T02:00:00', resourceId: 'a' }
        ],
        eventDidMount(info) {
          if (info.isMirror) {
            mirrorMountCnt++
          }
        },
        eventContent(info) {
          if (info.isMirror) {
            mirrorContentCnt++
          }
        },
        eventWillUnmount(info) {
          if (info.isMirror) {
            mirrorUnmountCnt++
          }
        }
      })

      // move two slots
      let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid
      timelineGridWrapper.resizeEvent(
        timelineGridWrapper.getFirstEventEl(), 'a', '2015-11-28T04:00:00'
      ).then(() => {

        expect(mirrorMountCnt).toBe(1)
        expect(mirrorContentCnt).toBe(3)
        expect(mirrorUnmountCnt).toBe(1)

        done()
      })
    })
  })

})
