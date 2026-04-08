import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { TimeGridViewWrapper } from '@fullcalendar-tests/standard/lib/wrappers/TimeGridViewWrapper'
import { ResourceTimeGridViewWrapper } from '../lib/wrappers/ResourceTimeGridViewWrapper'

describe('timeGrid-view dateClick', () => {
  pushOptions({
    now: '2015-11-28',
    scrollTime: '00:00',
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

    it('allows non-resource clicks', async () => {
      let dateClickCalled = false
      let clickResolve: () => void
      let clickPromise = new Promise<void>((resolve) => {
        clickResolve = resolve
      })

      let calendar = initCalendar({
        dateClick(info) {
          dateClickCalled = true
          expect(info.date).toEqualDate('2015-11-23T09:00:00Z')
          expect(typeof info.jsEvent).toBe('object')
          expect(typeof info.view).toBe('object')
          expect(info.resource).toBeFalsy()
          clickResolve()
        },
      })

      await waitTimeout()
      let timeGridWrapper = new TimeGridViewWrapper(calendar).timeGrid

      await timeGridWrapper.clickDate('2015-11-23T09:00:00')
      await clickPromise
      expect(dateClickCalled).toBe(true)
    })
  })

  describe('with resource columns above date columns', () => {
    pushOptions({
      initialView: 'resourceTimeGridThreeDay',
    })

    it('allows a resource click', async () => {
      let dateClickCalled = false
      let clickResolve: () => void
      let clickPromise = new Promise<void>((resolve) => {
        clickResolve = resolve
      })
      let calendar = initCalendar({
        dateClick(info) {
          dateClickCalled = true
          expect(info.date).toEqualDate('2015-11-29T09:00:00Z')
          expect(typeof info.jsEvent).toBe('object')
          expect(typeof info.view).toBe('object')
          expect(info.resource.id).toBe('b')
          clickResolve()
        },
      })

      await waitTimeout()
      let resourceTimeGridWrapper = new ResourceTimeGridViewWrapper(calendar).timeGrid

      await new Promise<void>((resolve) => {
        $.simulateByPoint('drag', {
          point: resourceTimeGridWrapper.getPoint('b', '2015-11-29T09:00:00Z'),
          callback() {
            resolve()
          },
        })
      })
      await clickPromise
      expect(dateClickCalled).toBe(true)
    })
  })

  describe('with date columns above resource columns', () => {
    pushOptions({
      initialView: 'resourceTimeGridThreeDay',
      datesAboveResources: true,
    })

    it('allows a resource click', async () => {
      let dateClickCalled = false
      let clickResolve: () => void
      let clickPromise = new Promise<void>((resolve) => {
        clickResolve = resolve
      })
      let calendar = initCalendar({
        dateClick(info) {
          dateClickCalled = true
          expect(info.date).toEqualDate('2015-11-30T09:30:00Z')
          expect(typeof info.jsEvent).toBe('object')
          expect(typeof info.view).toBe('object')
          expect(info.resource.id).toBe('b')
          clickResolve()
        },
      })

      await waitTimeout()
      let resourceTimeGridWrapper = new ResourceTimeGridViewWrapper(calendar).timeGrid

      await new Promise<void>((resolve) => {
        $.simulateByPoint('drag', {
          point: resourceTimeGridWrapper.getPoint('b', '2015-11-30T09:30:00Z'),
          callback() {
            resolve()
          },
        })
      })
      await clickPromise
      expect(dateClickCalled).toBe(true)
    })
  })
})
