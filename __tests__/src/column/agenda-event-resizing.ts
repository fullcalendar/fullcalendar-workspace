import { CalendarWrapper } from 'fullcalendar-tests/src/lib/wrappers/CalendarWrapper'
import { TimeGridViewWrapper } from 'fullcalendar-tests/src/lib/wrappers/TimeGridViewWrapper'
import { waitEventResize } from 'fullcalendar-tests/src/lib/wrappers/interaction-util'
import { ResourceTimeGridViewWrapper } from '../lib/wrappers/ResourceTimeGridViewWrapper'

describe('timeGrid-view event resizing', () => {
  pushOptions({
    now: '2015-11-28',
    scrollTime: '00:00',
    editable: true,
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
    ],
    views: {
      resourceTimeGridThreeDay: {
        type: 'resourceTimeGrid',
        duration: { days: 3 },
      },
    },
  })

  describe('when there are no resource columns', () => {
    pushOptions({
      initialView: 'timeGridWeek',
    })

    it('allows non-resource resize', (done) => {
      let calendar = initCalendar({
        events: [
          { title: 'event1', start: '2015-11-23T02:00:00', end: '2015-11-23T03:00:00' },
        ],
      })

      let calendarWrapper = new CalendarWrapper(calendar)
      let timeGridWrapper = new TimeGridViewWrapper(calendar).timeGrid
      let resizing = timeGridWrapper.resizeEvent(
        calendarWrapper.getFirstEventEl(),
        '2015-11-23T03:00:00',
        '2015-11-23T04:30:00',
      )

      waitEventResize(calendar, resizing).then((modifiedEvent) => {
        expect(modifiedEvent.start).toEqualDate('2015-11-23T02:00:00Z')
        expect(modifiedEvent.end).toEqualDate('2015-11-23T04:30:00Z')

        let resources = modifiedEvent.getResources()
        expect(resources.length).toBe(0)

        done()
      })
    })
  })

  describe('with resource columns above date columns', () => {
    pushOptions({
      initialView: 'resourceTimeGridThreeDay',
    })

    it('allows a same-day resize', (done) => {
      let resizeSpy
      let calendar = initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'b' },
        ],
        eventResize:
          (resizeSpy = spyCall((arg) => {
            expect(arg.event.start).toEqualDate('2015-11-29T02:00:00Z')
            expect(arg.event.end).toEqualDate('2015-11-29T04:30:00Z')

            let resources = arg.event.getResources()
            expect(resources.length).toBe(1)
            expect(resources[0].id).toBe('b')
          })),
      })

      let resourceTimeGridWrapper = new ResourceTimeGridViewWrapper(calendar).timeGrid
      resourceTimeGridWrapper.resizeEvent(
        $('.event1')[0], 'b', '2015-11-29T03:00:00', '2015-11-29T04:30:00',
      ).then(() => {
        expect(resizeSpy).toHaveBeenCalled()
        done()
      })
    })

    it('allows a different-day resize', (done) => {
      let resizeSpy
      let calendar = initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'b' },
        ],
        eventResize:
          (resizeSpy = spyCall((arg) => {
            expect(arg.event.start).toEqualDate('2015-11-29T02:00:00Z')
            expect(arg.event.end).toEqualDate('2015-11-30T04:30:00Z')

            let resources = arg.event.getResources()
            expect(resources.length).toBe(1)
            expect(resources[0].id).toBe('b')
          })),

      })
      let resourceTimeGridWrapper = new ResourceTimeGridViewWrapper(calendar).timeGrid
      resourceTimeGridWrapper.resizeEvent(
        $('.event1')[0], 'b', '2015-11-29T03:00:00', '2015-11-30T04:30:00Z',
      ).then(() => {
        expect(resizeSpy).toHaveBeenCalled()
        done()
      })
    })

    it('disallows a resize across resources', (done) => {
      let resizeSpy
      let calendar = initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'a' },
        ],
        eventResize:
          (resizeSpy = spyCall()),
      })

      let resourceTimeGridWrapper = new ResourceTimeGridViewWrapper(calendar).timeGrid
      resourceTimeGridWrapper.resizeEvent(
        $('.event1')[0], 'b', '2015-11-29T03:00:00', '2015-11-30T04:00:00',
      ).then(() => {
        expect(resizeSpy).not.toHaveBeenCalled()
        done()
      })
    })
  })

  describe('with date columns above resource columns', () => {
    pushOptions({
      initialView: 'resourceTimeGridThreeDay',
      datesAboveResources: true,
    })

    it('allows a same-day resize', (done) => {
      let resizeSpy
      let calendar = initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-30T02:00:00', end: '2015-11-30T03:00:00', resourceId: 'b' },
        ],
        eventResize:
          (resizeSpy = spyCall((arg) => {
            expect(arg.event.start).toEqualDate('2015-11-30T02:00:00Z')
            expect(arg.event.end).toEqualDate('2015-11-30T04:30:00Z')

            let resources = arg.event.getResources()
            expect(resources.length).toBe(1)
            expect(resources[0].id).toBe('b')
          })),
      })

      let resourceTimeGridWrapper = new ResourceTimeGridViewWrapper(calendar).timeGrid
      resourceTimeGridWrapper.resizeEvent(
        $('.event1')[0], 'b', '2015-11-30T03:00:00', '2015-11-30T04:30:00',
      ).then(() => {
        expect(resizeSpy).toHaveBeenCalled()
        done()
      })
    })

    it('allows a multi-day resize', (done) => {
      let resizeSpy
      let calendar = initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'a' },
        ],
        eventResize:
          (resizeSpy = spyCall((arg) => {
            expect(arg.event.start).toEqualDate('2015-11-29T02:00:00Z')
            expect(arg.event.end).toEqualDate('2015-11-30T04:30:00Z')

            let resources = arg.event.getResources()
            expect(resources.length).toBe(1)
            expect(resources[0].id).toBe('a')
          })),
      })

      let resourceTimeGridWrapper = new ResourceTimeGridViewWrapper(calendar).timeGrid
      resourceTimeGridWrapper.resizeEvent(
        $('.event1')[0], 'a', '2015-11-29T03:00:00', '2015-11-30T04:30:00',
      ).then(() => {
        expect(resizeSpy).toHaveBeenCalled()
        done()
      })
    })

    it('disallows a resize across resources', (done) => {
      let resizeSpy
      let calendar = initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'a' },
        ],
        eventResize:
          (resizeSpy = spyCall()),
      })

      let resourceTimeGridWrapper = new ResourceTimeGridViewWrapper(calendar).timeGrid
      resourceTimeGridWrapper.resizeEvent(
        $('.event1')[0], 'b', '2015-11-29T03:00:00', '2015-11-29T04:00:00',
      ).then(() => {
        expect(resizeSpy).not.toHaveBeenCalled()
        done()
      })
    })
  })
})
