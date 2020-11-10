import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'
import { TimelineViewWrapper } from '../lib/wrappers/TimelineViewWrapper'

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

  describeOptions('direction', {
    'LTR': 'ltr',
    'RTL': 'rtl'
  }, function() {

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

            it('reports selection with no resource', function(done) {
              let selectCalled = false
              let calendar = initCalendar({
                select(arg) {
                  selectCalled = true
                  expect(arg.start).toEqualDate(tz.parseDate('2015-11-28T04:00:00'))
                  expect(arg.end).toEqualDate(tz.parseDate('2015-11-28T07:30:00'))
                  expect(typeof arg.jsEvent).toBe('object')
                  expect(typeof arg.view).toBe('object')
                  expect(arg.resource).toBeFalsy()
                }
              })

              let timelineGridWrapper = new TimelineViewWrapper(calendar).timelineGrid
              let slatEl = timelineGridWrapper.getSlatElByDate('2015-11-28T04:00:00')

              $(slatEl).simulate('drag', {
                end: timelineGridWrapper.getSlatElByDate('2015-11-28T07:00:00'),
                callback() {
                  expect(selectCalled).toBe(true)
                  done()
                }
              })
            })
          })

          describe('when resources', function() {

            it('won\'t report anything if not selected on resource', function(done) {
              let selectCalled = false
              let calendar = initCalendar({
                select() {
                  selectCalled = true
                }
              })

              let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid
              let slatEl = timelineGridWrapper.getSlatElByDate('2015-11-28T04:00:00')

              $(slatEl).simulate('drag', {
                end: timelineGridWrapper.getSlatElByDate('2015-11-28T07:00:00'),
                callback() {
                  expect(selectCalled).toBe(false)
                  done()
                }
              })
            })

            it('reports selection on a resource', function(done) {
              let selectCalled = false
              let calendar = initCalendar({
                select(arg) {
                  selectCalled = true
                  expect(arg.start).toEqualDate(tz.parseDate('2015-11-28T04:00:00'))
                  expect(arg.end).toEqualDate(tz.parseDate('2015-11-28T07:30:00'))
                  expect(typeof arg.jsEvent).toBe('object')
                  expect(typeof arg.view).toBe('object')
                  expect(arg.resource.id).toBe('b')
                }
              })

              let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid
              timelineGridWrapper.selectDates(
                { resourceId: 'b', date: '2015-11-28T04:00:00' },
                { resourceId: 'b', date: '2015-11-28T07:30:00' }
              ).then(() => {
                expect(selectCalled).toBe(true)
                done()
              })
            })

            it('reports selection across resources', function(done) {
              let selectCalled = false
              let calendar = initCalendar({
                select(arg) {
                  selectCalled = true
                  expect(arg.start).toEqualDate(tz.parseDate('2015-11-28T04:00:00'))
                  expect(arg.end).toEqualDate(tz.parseDate('2015-11-28T07:30:00'))
                  expect(typeof arg.jsEvent).toBe('object')
                  expect(typeof arg.view).toBe('object')
                  expect(arg.resource.id).toBe('b')
                }
              })

              let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid
              timelineGridWrapper.selectDates(
                { resourceId: 'b', date: '2015-11-28T04:00:00' },
                { resourceId: 'a', date: '2015-11-28T07:30:00' }
              ).then(() => {
                expect(selectCalled).toBe(true)
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
            let selectCalled = false
            let calendar = initCalendar({
              select(arg) {
                selectCalled = true
                expect(arg.start).toEqualDate(tz.parseDate('2015-11-28T04:15:00'))
                expect(arg.end).toEqualDate(tz.parseDate('2015-11-28T07:45:00'))
                expect(typeof arg.jsEvent).toBe('object')
                expect(typeof arg.view).toBe('object')
                expect(arg.resource.id).toBe('b')
              }
            })

            let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid
            timelineGridWrapper.selectDates(
              { resourceId: 'b', date: '2015-11-28T04:15:00' },
              { resourceId: 'b', date: '2015-11-28T07:45:00' }
            ).then(() => {
              expect(selectCalled).toBe(true)
              done()
            })
          })
        })
      })
    })

    describe('when day scale', function() {
      pushOptions({
        initialView: 'resourceTimelineMonth',
        slotDuration: { days: 1 }
      })

      it('reports untimed dates', function(done) {
        let selectCalled = false
        let calendar = initCalendar({
          select(arg) {
            selectCalled = true
            expect(arg.start).toEqualDate('2015-11-03')
            expect(arg.end).toEqualDate('2015-11-05')
            expect(typeof arg.jsEvent).toBe('object')
            expect(typeof arg.view).toBe('object')
            expect(arg.resource.id).toBe('a')
          }
        })

        let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid
        timelineGridWrapper.selectDates(
          { resourceId: 'a', date: '2015-11-03' },
          { resourceId: 'a', date: '2015-11-05' }
        ).then(() => {
          expect(selectCalled).toBe(true)
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

      it('reports untimed dates', function(done) {
        let selectCalled = false
        let calendar = initCalendar({
          select(arg) {
            selectCalled = true
            expect(arg.start).toEqualDate('2015-01-18')
            expect(arg.end).toEqualDate('2015-02-08')
            expect(typeof arg.jsEvent).toBe('object')
            expect(typeof arg.view).toBe('object')
            expect(arg.resource.id).toBe('a')
          }
        })

        let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid
        timelineGridWrapper.selectDates(
          { resourceId: 'a', date: '2015-01-18' },
          { resourceId: 'a', date: '2015-02-08' }
        ).then(() => {
          expect(selectCalled).toBe(true)
          done()
        })
      })
    })
  })

  it('reports selection on a resource via touch', function(done) {
    let selectCalled = false
    let calendar = initCalendar({
      longPressDelay: 100,
      initialView: 'resourceTimelineDay',
      select(arg) {
        selectCalled = true
        expect(arg.start).toEqualDate('2015-11-28T04:00:00Z')
        expect(arg.end).toEqualDate('2015-11-28T07:30:00Z')
        expect(typeof arg.jsEvent).toBe('object')
        expect(typeof arg.view).toBe('object')
        expect(arg.resource.id).toBe('b')
      }
    })

    let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid
    $.simulateByPoint('drag', {
      isTouch: true,
      delay: 200,
      point: timelineGridWrapper.getPoint('b', '2015-11-28T04:00:00'),
      end: timelineGridWrapper.getPoint('b', '2015-11-28T07:00:00'),
      callback() {
        expect(selectCalled).toBe(true)
        done()
      }
    })
  })
})
