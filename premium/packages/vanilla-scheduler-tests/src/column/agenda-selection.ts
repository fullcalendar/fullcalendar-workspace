import { TimeGridViewWrapper } from '@fullcalendar-tests/standard/lib/wrappers/TimeGridViewWrapper'
import { waitDateSelect } from '@fullcalendar-tests/standard/lib/wrappers/interaction-util'
import { ResourceTimeGridViewWrapper } from '../lib/wrappers/ResourceTimeGridViewWrapper.js'

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

    it('allows non-resource selection', (done) => {
      let calendar = initCalendar()
      let timeGridWrapper = new TimeGridViewWrapper(calendar).timeGrid
      let selecting = timeGridWrapper.selectDates('2015-11-23T02:00:00', '2015-11-23T04:30:00')

      waitDateSelect(calendar, selecting).then((selectInfo) => {
        expect(selectInfo.start).toEqualDate('2015-11-23T02:00:00Z')
        expect(selectInfo.end).toEqualDate('2015-11-23T04:30:00Z')
        expect(typeof selectInfo.jsEvent).toBe('object')
        expect(typeof selectInfo.view).toBe('object')
        expect(selectInfo.resource).toBeFalsy()
        done()
      })
    })
  })

  describe('with resource columns above date columns', () => {
    pushOptions({
      initialView: 'resourceTimeGridThreeDay',
    })

    it('allows a same-day resource selection', (done) => {
      let selectCalled = false
      let calendar = initCalendar({
        select(data) {
          selectCalled = true
          expect(data.start).toEqualDate('2015-11-29T02:00:00Z')
          expect(data.end).toEqualDate('2015-11-29T04:30:00Z')
          expect(typeof data.jsEvent).toBe('object')
          expect(typeof data.view).toBe('object')
          expect(data.resource.id).toBe('b')
        },
      })
      let resourceTimeGridWrapper = new ResourceTimeGridViewWrapper(calendar).timeGrid

      $.simulateByPoint('drag', {
        point: resourceTimeGridWrapper.getPoint('b', '2015-11-29T02:00:00'),
        end: resourceTimeGridWrapper.getPoint('b', '2015-11-29T04:00:00'),
        callback() {
          expect(selectCalled).toBe(true)
          done()
        },
      })
    })

    it('allows a different-day resource selection', (done) => {
      let selectCalled = false
      let calendar = initCalendar({
        select(data) {
          selectCalled = true
          expect(data.start).toEqualDate('2015-11-29T02:00:00Z')
          expect(data.end).toEqualDate('2015-11-30T04:30:00Z')
          expect(typeof data.jsEvent).toBe('object')
          expect(typeof data.view).toBe('object')
          expect(data.resource.id).toBe('b')
        },
      })
      let resourceTimeGridWrapper = new ResourceTimeGridViewWrapper(calendar).timeGrid

      $.simulateByPoint('drag', {
        point: resourceTimeGridWrapper.getPoint('b', '2015-11-29T02:00:00'),
        end: resourceTimeGridWrapper.getPoint('b', '2015-11-30T04:00:00'),
        callback() {
          expect(selectCalled).toBe(true)
          done()
        },
      })
    })

    it('disallows a selection across resources', (done) => {
      let selectCalled = false
      let calendar = initCalendar({
        select() {
          selectCalled = true
        },
      })
      let resourceTimeGridWrapper = new ResourceTimeGridViewWrapper(calendar).timeGrid

      $.simulateByPoint('drag', {
        point: resourceTimeGridWrapper.getPoint('a', '2015-11-29T02:00:00'),
        end: resourceTimeGridWrapper.getPoint('b', '2015-11-30T04:00:00'),
        callback() {
          expect(selectCalled).toBe(false)
          done()
        },
      })
    })
  })

  describe('with date columns above resource columns', () => {
    pushOptions({
      initialView: 'resourceTimeGridThreeDay',
      datesAboveResources: true,
    })

    it('allows a same-day resource selection', (done) => {
      let selectCalled = false
      let calendar = initCalendar({
        select(data) {
          selectCalled = true
          expect(data.start).toEqualDate('2015-11-30T02:00:00Z')
          expect(data.end).toEqualDate('2015-11-30T04:30:00Z')
          expect(typeof data.jsEvent).toBe('object')
          expect(typeof data.view).toBe('object')
          expect(data.resource.id).toBe('b')
        },
      })
      let resourceTimeGridWrapper = new ResourceTimeGridViewWrapper(calendar).timeGrid

      $.simulateByPoint('drag', {
        point: resourceTimeGridWrapper.getPoint('b', '2015-11-30T02:00:00'),
        end: resourceTimeGridWrapper.getPoint('b', '2015-11-30T04:00:00'),
        callback() {
          expect(selectCalled).toBe(true)
          done()
        },
      })
    })

    it('allows a multi-day resource selection', (done) => {
      let selectCalled = false
      let calendar = initCalendar({
        select(data) {
          selectCalled = true
          expect(data.start).toEqualDate('2015-11-29T04:00:00Z')
          expect(data.end).toEqualDate('2015-11-30T02:30:00Z')
          expect(typeof data.jsEvent).toBe('object')
          expect(typeof data.view).toBe('object')
          expect(data.resource.id).toBe('b')
        },
      })
      let resourceTimeGridWrapper = new ResourceTimeGridViewWrapper(calendar).timeGrid

      $.simulateByPoint('drag', {
        point: resourceTimeGridWrapper.getPoint('b', '2015-11-30T02:00:00'),
        end: resourceTimeGridWrapper.getPoint('b', '2015-11-29T04:00:00'),
        callback() {
          expect(selectCalled).toBe(true)
          done()
        },
      })
    })

    it('disallows a selection across resources', (done) => {
      let selectCalled = false
      let calendar = initCalendar({
        select(data) {
          selectCalled = true
        },
      })
      let resourceTimeGridWrapper = new ResourceTimeGridViewWrapper(calendar).timeGrid

      $.simulateByPoint('drag', {
        point: resourceTimeGridWrapper.getPoint('a', '2015-11-29T02:00:00'),
        end: resourceTimeGridWrapper.getPoint('b', '2015-11-29T04:00:00'),
        callback() {
          expect(selectCalled).toBe(false)
          done()
        },
      })
    })
  })
})
