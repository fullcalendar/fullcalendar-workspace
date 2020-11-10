import { DayGridViewWrapper } from 'fullcalendar-tests/src/lib/wrappers/DayGridViewWrapper'
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

    it('allows non-resource resizing', (done) => {
      let resizeCalled = false
      let calendar = initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-23' },
        ],
        eventResize(arg) {
          resizeCalled = true
          expect(arg.event.start).toEqualDate('2015-11-23')
          expect(arg.event.end).toEqualDate('2015-11-25')

          let resources = arg.event.getResources()
          expect(resources.length).toBe(0)
        },
      })

      let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid
      dayGridWrapper.resizeEvent(
        $('.event1')[0], '2015-11-23', '2015-11-24',
      ).then(() => {
        expect(resizeCalled).toBe(true)
        done()
      })
    })
  })

  describe('with resource columns above date columns', () => {
    pushOptions({
      initialView: 'resourceDayGridThreeDay',
    })

    it('allows resizing', (done) => {
      let resizeCalled = false
      let calendar = initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-29', resourceId: 'a' },
        ],
        eventResize(arg) {
          resizeCalled = true
          expect(arg.event.start).toEqualDate('2015-11-29')
          expect(arg.event.end).toEqualDate('2015-12-01')

          let resources = arg.event.getResources()
          expect(resources.length).toBe(1)
          expect(resources[0].id).toBe('a')
        },
      })

      let dayGridWrapper = new ResourceDayGridViewWrapper(calendar).dayGrid
      dayGridWrapper.resizeEvent(
        $('.event1')[0],
        { resourceId: 'a', date: '2015-11-29' },
        { resourceId: 'a', date: '2015-11-30' },
      ).then(() => {
        expect(resizeCalled).toBe(true)
        done()
      })
    })

    it('disallows resizing across resources', (done) => {
      let resizeCalled = false
      let calendar = initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-29', resourceId: 'a' },
        ],
        eventResize(arg) {
          resizeCalled = true
        },
      })

      let dayGridWrapper = new ResourceDayGridViewWrapper(calendar).dayGrid
      dayGridWrapper.resizeEvent(
        $('.event1')[0],
        { resourceId: 'a', date: '2015-11-29' },
        { resourceId: 'b', date: '2015-11-30' },
      ).then(() => {
        expect(resizeCalled).toBe(false)
        done()
      })
    })
  })

  describe('with date columns above resource columns', () => {
    pushOptions({
      initialView: 'resourceDayGridThreeDay',
      datesAboveResources: true,
    })

    it('allows resizing', (done) => {
      let resizeCalled = false
      let calendar = initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-28', resourceId: 'b' },
        ],
        eventResize(arg) {
          resizeCalled = true
          expect(arg.event.start).toEqualDate('2015-11-28')
          expect(arg.event.end).toEqualDate('2015-12-01')

          let resources = arg.event.getResources()
          expect(resources.length).toBe(1)
          expect(resources[0].id).toBe('b')
        },
      })

      let dayGridWrapper = new ResourceDayGridViewWrapper(calendar).dayGrid
      dayGridWrapper.resizeEvent(
        $('.event1')[0],
        { resourceId: 'b', date: '2015-11-28' },
        { resourceId: 'b', date: '2015-11-30' },
      ).then(() => {
        expect(resizeCalled).toBe(true)
        done()
      })
    })

    it('disallows resizing across resources', (done) => {
      let resizeCalled = false
      let calendar = initCalendar({
        events: [
          { title: 'event1', className: 'event1', start: '2015-11-28', resourceId: 'a' },
        ],
        eventResize() {
          resizeCalled = true
        },
      })

      let dayGridWrapper = new ResourceDayGridViewWrapper(calendar).dayGrid
      dayGridWrapper.resizeEvent(
        $('.event1')[0],
        { resourceId: 'a', date: '2015-11-28' },
        { resourceId: 'b', date: '2015-11-30' },
      ).then(() => {
        expect(resizeCalled).toBe(false)
        done()
      })
    })
  })
})
