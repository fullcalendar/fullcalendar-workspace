import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { DayGridViewWrapper } from '@fullcalendar-tests/standard/lib/wrappers/DayGridViewWrapper'
import { ResourceDayGridViewWrapper } from '../lib/wrappers/ResourceDayGridViewWrapper'

describe('dayGrid-view event resizing', () => {
  pushOptions({
    now: '2015-11-28',
    editable: true,
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
    ],
    views: {
      resourceDayGridThreeDay: {
        type: 'resourceDayGrid',
        duration: { days: 3 },
      },
    },
  })

  describe('when there are no resource columns', () => {
    pushOptions({
      initialView: 'dayGridWeek',
    })

    it('allows non-resource resizing', async () => {
      let resizeCalled = false
      let calendar = initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-23' },
        ],
        eventResize(data) {
          resizeCalled = true
          expect(data.event.start).toEqualDate('2015-11-23')
          expect(data.event.end).toEqualDate('2015-11-25')

          let resources = data.event.getResources()
          expect(resources.length).toBe(0)
        },
      })

      await waitTimeout()
      let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid
      await dayGridWrapper.resizeEvent(
        $('.event1')[0], '2015-11-23', '2015-11-24',
      )
      expect(resizeCalled).toBe(true)
    })
  })

  describe('with resource columns above date columns', () => {
    pushOptions({
      initialView: 'resourceDayGridThreeDay',
    })

    it('allows resizing', async () => {
      let resizeCalled = false
      let calendar = initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-29', resourceId: 'a' },
        ],
        eventResize(data) {
          resizeCalled = true
          expect(data.event.start).toEqualDate('2015-11-29')
          expect(data.event.end).toEqualDate('2015-12-01')

          let resources = data.event.getResources()
          expect(resources.length).toBe(1)
          expect(resources[0].id).toBe('a')
        },
      })

      await waitTimeout()
      let dayGridWrapper = new ResourceDayGridViewWrapper(calendar).dayGrid
      await dayGridWrapper.resizeEvent(
        $('.event1')[0],
        { resourceId: 'a', date: '2015-11-29' },
        { resourceId: 'a', date: '2015-11-30' },
      )
      expect(resizeCalled).toBe(true)
    })

    it('disallows resizing across resources', async () => {
      let resizeCalled = false
      let calendar = initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-29', resourceId: 'a' },
        ],
        eventResize(data) {
          resizeCalled = true
        },
      })

      await waitTimeout()
      let dayGridWrapper = new ResourceDayGridViewWrapper(calendar).dayGrid
      await dayGridWrapper.resizeEvent(
        $('.event1')[0],
        { resourceId: 'a', date: '2015-11-29' },
        { resourceId: 'b', date: '2015-11-30' },
      )
      expect(resizeCalled).toBe(false)
    })
  })

  describe('with date columns above resource columns', () => {
    pushOptions({
      initialView: 'resourceDayGridThreeDay',
      datesAboveResources: true,
    })

    it('allows resizing', async () => {
      let resizeCalled = false
      let calendar = initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-28', resourceId: 'b' },
        ],
        eventResize(data) {
          resizeCalled = true
          expect(data.event.start).toEqualDate('2015-11-28')
          expect(data.event.end).toEqualDate('2015-12-01')

          let resources = data.event.getResources()
          expect(resources.length).toBe(1)
          expect(resources[0].id).toBe('b')
        },
      })

      await waitTimeout()
      let dayGridWrapper = new ResourceDayGridViewWrapper(calendar).dayGrid
      await dayGridWrapper.resizeEvent(
        $('.event1')[0],
        { resourceId: 'b', date: '2015-11-28' },
        { resourceId: 'b', date: '2015-11-30' },
      )
      expect(resizeCalled).toBe(true)
    })

    it('disallows resizing across resources', async () => {
      let resizeCalled = false
      let calendar = initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-28', resourceId: 'a' },
        ],
        eventResize() {
          resizeCalled = true
        },
      })

      await waitTimeout()
      let dayGridWrapper = new ResourceDayGridViewWrapper(calendar).dayGrid
      await dayGridWrapper.resizeEvent(
        $('.event1')[0],
        { resourceId: 'a', date: '2015-11-28' },
        { resourceId: 'b', date: '2015-11-30' },
      )
      expect(resizeCalled).toBe(false)
    })
  })
})
