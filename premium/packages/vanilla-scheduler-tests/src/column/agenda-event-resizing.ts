import { CalendarWrapper } from '@fullcalendar-tests/standard/lib/wrappers/CalendarWrapper'
import { TimeGridViewWrapper } from '@fullcalendar-tests/standard/lib/wrappers/TimeGridViewWrapper'
import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { waitEventResize } from '@fullcalendar-tests/standard/lib/wrappers/interaction-util'
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

    it('allows non-resource resize', async () => {
      let calendar = initCalendar({
        events: [
          { title: 'event1', start: '2015-11-23T02:00:00', end: '2015-11-23T03:00:00' },
        ],
      })

      await waitTimeout()
      let calendarWrapper = new CalendarWrapper(calendar)
      let timeGridWrapper = new TimeGridViewWrapper(calendar).timeGrid
      let resizing = timeGridWrapper.resizeEvent(
        calendarWrapper.getFirstEventEl(),
        '2015-11-23T03:00:00',
        '2015-11-23T04:30:00',
      )

      let modifiedEvent = await waitEventResize(calendar, resizing)
      expect(modifiedEvent.start).toEqualDate('2015-11-23T02:00:00Z')
      expect(modifiedEvent.end).toEqualDate('2015-11-23T04:30:00Z')

      let resources = modifiedEvent.getResources()
      expect(resources.length).toBe(0)
    })
  })

  describe('with resource columns above date columns', () => {
    pushOptions({
      initialView: 'resourceTimeGridThreeDay',
    })

    it('allows a same-day resize', async () => {
      let resizeSpy
      let calendar = initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'b' },
        ],
        eventResize:
          (resizeSpy = spyCall((data) => {
            expect(data.event.start).toEqualDate('2015-11-29T02:00:00Z')
            expect(data.event.end).toEqualDate('2015-11-29T04:30:00Z')

            let resources = data.event.getResources()
            expect(resources.length).toBe(1)
            expect(resources[0].id).toBe('b')
          })),
      })

      await waitTimeout()
      let resourceTimeGridWrapper = new ResourceTimeGridViewWrapper(calendar).timeGrid
      await resourceTimeGridWrapper.resizeEvent(
        $('.event1')[0], 'b', '2015-11-29T03:00:00', '2015-11-29T04:30:00',
      )
      expect(resizeSpy).toHaveBeenCalled()
    })

    it('allows a different-day resize', async () => {
      let resizeSpy
      let calendar = initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'b' },
        ],
        eventResize:
          (resizeSpy = spyCall((data) => {
            expect(data.event.start).toEqualDate('2015-11-29T02:00:00Z')
            expect(data.event.end).toEqualDate('2015-11-30T04:30:00Z')

            let resources = data.event.getResources()
            expect(resources.length).toBe(1)
            expect(resources[0].id).toBe('b')
          })),
      })

      await waitTimeout()
      let resourceTimeGridWrapper = new ResourceTimeGridViewWrapper(calendar).timeGrid
      await resourceTimeGridWrapper.resizeEvent(
        $('.event1')[0], 'b', '2015-11-29T03:00:00', '2015-11-30T04:30:00Z',
      )
      expect(resizeSpy).toHaveBeenCalled()
    })

    it('disallows a resize across resources', async () => {
      let resizeSpy
      let calendar = initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'a' },
        ],
        eventResize:
          (resizeSpy = spyCall()),
      })

      await waitTimeout()
      let resourceTimeGridWrapper = new ResourceTimeGridViewWrapper(calendar).timeGrid
      await resourceTimeGridWrapper.resizeEvent(
        $('.event1')[0], 'b', '2015-11-29T03:00:00', '2015-11-30T04:00:00',
      )
      expect(resizeSpy).not.toHaveBeenCalled()
    })
  })

  describe('with date columns above resource columns', () => {
    pushOptions({
      initialView: 'resourceTimeGridThreeDay',
      datesAboveResources: true,
    })

    it('allows a same-day resize', async () => {
      let resizeSpy
      let calendar = initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-30T02:00:00', end: '2015-11-30T03:00:00', resourceId: 'b' },
        ],
        eventResize:
          (resizeSpy = spyCall((data) => {
            expect(data.event.start).toEqualDate('2015-11-30T02:00:00Z')
            expect(data.event.end).toEqualDate('2015-11-30T04:30:00Z')

            let resources = data.event.getResources()
            expect(resources.length).toBe(1)
            expect(resources[0].id).toBe('b')
          })),
      })

      await waitTimeout()
      let resourceTimeGridWrapper = new ResourceTimeGridViewWrapper(calendar).timeGrid
      await resourceTimeGridWrapper.resizeEvent(
        $('.event1')[0], 'b', '2015-11-30T03:00:00', '2015-11-30T04:30:00',
      )
      expect(resizeSpy).toHaveBeenCalled()
    })

    it('allows a multi-day resize', async () => {
      let resizeSpy
      let calendar = initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'a' },
        ],
        eventResize:
          (resizeSpy = spyCall((data) => {
            expect(data.event.start).toEqualDate('2015-11-29T02:00:00Z')
            expect(data.event.end).toEqualDate('2015-11-30T04:30:00Z')

            let resources = data.event.getResources()
            expect(resources.length).toBe(1)
            expect(resources[0].id).toBe('a')
          })),
      })

      await waitTimeout()
      let resourceTimeGridWrapper = new ResourceTimeGridViewWrapper(calendar).timeGrid
      await resourceTimeGridWrapper.resizeEvent(
        $('.event1')[0], 'a', '2015-11-29T03:00:00', '2015-11-30T04:30:00',
      )
      expect(resizeSpy).toHaveBeenCalled()
    })

    it('disallows a resize across resources', async () => {
      let resizeSpy
      let calendar = initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'a' },
        ],
        eventResize:
          (resizeSpy = spyCall()),
      })

      await waitTimeout()
      let resourceTimeGridWrapper = new ResourceTimeGridViewWrapper(calendar).timeGrid
      await resourceTimeGridWrapper.resizeEvent(
        $('.event1')[0], 'b', '2015-11-29T03:00:00', '2015-11-29T04:00:00',
      )
      expect(resizeSpy).not.toHaveBeenCalled()
    })
  })
})
