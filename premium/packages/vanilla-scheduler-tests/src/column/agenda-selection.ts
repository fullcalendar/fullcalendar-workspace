import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { TimeGridViewWrapper } from '@fullcalendar-tests/standard/lib/wrappers/TimeGridViewWrapper'
import { waitDateSelect } from '@fullcalendar-tests/standard/lib/wrappers/interaction-util'
import { ResourceTimeGridViewWrapper } from '../lib/wrappers/ResourceTimeGridViewWrapper'

describe('timeGrid-view selection', () => {
  pushOptions({
    now: '2015-11-28',
    scrollTime: '00:00',
    selectable: true,
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

    it('allows non-resource selection', async () => {
      let calendar = initCalendar()
      await waitTimeout()
      let timeGridWrapper = new TimeGridViewWrapper(calendar).timeGrid
      let selecting = timeGridWrapper.selectDates('2015-11-23T02:00:00', '2015-11-23T04:30:00')

      let selectInfo = await waitDateSelect(calendar, selecting)
      expect(selectInfo.start).toEqualDate('2015-11-23T02:00:00Z')
      expect(selectInfo.end).toEqualDate('2015-11-23T04:30:00Z')
      expect(typeof selectInfo.jsEvent).toBe('object')
      expect(typeof selectInfo.view).toBe('object')
      expect(selectInfo.resource).toBeFalsy()
    })
  })

  describe('with resource columns above date columns', () => {
    pushOptions({
      initialView: 'resourceTimeGridThreeDay',
    })

    it('allows a same-day resource selection', async () => {
      let selectCalled = false
      let selectInfo = null
      let calendar = initCalendar({
        select(info) {
          selectCalled = true
          selectInfo = info
        },
      })
      await waitTimeout()
      let resourceTimeGridWrapper = new ResourceTimeGridViewWrapper(calendar).timeGrid

      await new Promise<void>((resolve) => {
        $.simulateByPoint('drag', {
          point: resourceTimeGridWrapper.getPoint('b', '2015-11-29T02:00:00'),
          end: resourceTimeGridWrapper.getPoint('b', '2015-11-29T04:00:00'),
          callback() {
            resolve()
          },
        })
      })

      expect(selectCalled).toBe(true)
      expect(selectInfo).toBeTruthy()
      expect(selectInfo.start).toEqualDate('2015-11-29T02:00:00Z')
      expect(selectInfo.end).toEqualDate('2015-11-29T04:30:00Z')
      expect(typeof selectInfo.jsEvent).toBe('object')
      expect(typeof selectInfo.view).toBe('object')
      expect(selectInfo.resource.id).toBe('b')
    })

    it('allows a different-day resource selection', async () => {
      let selectCalled = false
      let selectInfo = null
      let calendar = initCalendar({
        select(info) {
          selectCalled = true
          selectInfo = info
        },
      })
      await waitTimeout()
      let resourceTimeGridWrapper = new ResourceTimeGridViewWrapper(calendar).timeGrid

      await new Promise<void>((resolve) => {
        $.simulateByPoint('drag', {
          point: resourceTimeGridWrapper.getPoint('b', '2015-11-29T02:00:00'),
          end: resourceTimeGridWrapper.getPoint('b', '2015-11-30T04:00:00'),
          callback() {
            resolve()
          },
        })
      })

      expect(selectCalled).toBe(true)
      expect(selectInfo).toBeTruthy()
      expect(selectInfo.start).toEqualDate('2015-11-29T02:00:00Z')
      expect(selectInfo.end).toEqualDate('2015-11-30T04:30:00Z')
      expect(typeof selectInfo.jsEvent).toBe('object')
      expect(typeof selectInfo.view).toBe('object')
      expect(selectInfo.resource.id).toBe('b')
    })

    it('disallows a selection across resources', async () => {
      let selectCalled = false
      let calendar = initCalendar({
        select() {
          selectCalled = true
        },
      })
      await waitTimeout()
      let resourceTimeGridWrapper = new ResourceTimeGridViewWrapper(calendar).timeGrid

      await new Promise<void>((resolve) => {
        $.simulateByPoint('drag', {
          point: resourceTimeGridWrapper.getPoint('a', '2015-11-29T02:00:00'),
          end: resourceTimeGridWrapper.getPoint('b', '2015-11-30T04:00:00'),
          callback() {
            resolve()
          },
        })
      })

      expect(selectCalled).toBe(false)
    })
  })

  describe('with date columns above resource columns', () => {
    pushOptions({
      initialView: 'resourceTimeGridThreeDay',
      datesAboveResources: true,
    })

    it('allows a same-day resource selection', async () => {
      let selectCalled = false
      let selectInfo = null
      let calendar = initCalendar({
        select(info) {
          selectCalled = true
          selectInfo = info
        },
      })
      await waitTimeout()
      let resourceTimeGridWrapper = new ResourceTimeGridViewWrapper(calendar).timeGrid

      await new Promise<void>((resolve) => {
        $.simulateByPoint('drag', {
          point: resourceTimeGridWrapper.getPoint('b', '2015-11-30T02:00:00'),
          end: resourceTimeGridWrapper.getPoint('b', '2015-11-30T04:00:00'),
          callback() {
            resolve()
          },
        })
      })

      expect(selectCalled).toBe(true)
      expect(selectInfo).toBeTruthy()
      expect(selectInfo.start).toEqualDate('2015-11-30T02:00:00Z')
      expect(selectInfo.end).toEqualDate('2015-11-30T04:30:00Z')
      expect(typeof selectInfo.jsEvent).toBe('object')
      expect(typeof selectInfo.view).toBe('object')
      expect(selectInfo.resource.id).toBe('b')
    })

    it('allows a multi-day resource selection', async () => {
      let selectCalled = false
      let selectInfo = null
      let calendar = initCalendar({
        select(info) {
          selectCalled = true
          selectInfo = info
        },
      })
      await waitTimeout()
      let resourceTimeGridWrapper = new ResourceTimeGridViewWrapper(calendar).timeGrid

      await new Promise<void>((resolve) => {
        $.simulateByPoint('drag', {
          point: resourceTimeGridWrapper.getPoint('b', '2015-11-30T02:00:00'),
          end: resourceTimeGridWrapper.getPoint('b', '2015-11-29T04:00:00'),
          callback() {
            resolve()
          },
        })
      })

      expect(selectCalled).toBe(true)
      expect(selectInfo).toBeTruthy()
      expect(selectInfo.start).toEqualDate('2015-11-29T04:00:00Z')
      expect(selectInfo.end).toEqualDate('2015-11-30T02:30:00Z')
      expect(typeof selectInfo.jsEvent).toBe('object')
      expect(typeof selectInfo.view).toBe('object')
      expect(selectInfo.resource.id).toBe('b')
    })

    it('disallows a selection across resources', async () => {
      let selectCalled = false
      let calendar = initCalendar({
        select(info) {
          selectCalled = true
        },
      })
      await waitTimeout()
      let resourceTimeGridWrapper = new ResourceTimeGridViewWrapper(calendar).timeGrid

      await new Promise<void>((resolve) => {
        $.simulateByPoint('drag', {
          point: resourceTimeGridWrapper.getPoint('a', '2015-11-29T02:00:00'),
          end: resourceTimeGridWrapper.getPoint('b', '2015-11-29T04:00:00'),
          callback() {
            resolve()
          },
        })
      })

      expect(selectCalled).toBe(false)
    })
  })
})
