import { TimeGridViewWrapper } from '@fullcalendar-tests/standard/lib/wrappers/TimeGridViewWrapper'
import { ResourceTimeGridViewWrapper } from '../lib/wrappers/ResourceTimeGridViewWrapper.js'

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

    it('allows non-resource clicks', (done) => {
      let dateClickData = null

      let calendar = initCalendar({
        dateClick(data) {
          dateClickData = data
        }
      })

      let timeGridWrapper = new TimeGridViewWrapper(calendar).timeGrid

      timeGridWrapper.clickDate('2015-11-23T09:00:00').then(() => {
        setTimeout(() => { // wait for dateClick to fire
          expect(dateClickData.date).toEqualDate('2015-11-23T09:00:00Z')
          expect(typeof dateClickData.jsEvent).toBe('object')
          expect(typeof dateClickData.view).toBe('object')
          expect(dateClickData.resource).toBeFalsy()
          done()
        })
      })
    })
  })

  describe('with resource columns above date columns', () => {
    pushOptions({
      initialView: 'resourceTimeGridThreeDay',
    })

    it('allows a resource click', (done) => {
      let dateClickCalled = false
      let calendar = initCalendar({
        dateClick(data) {
          dateClickCalled = true
          expect(data.date).toEqualDate('2015-11-29T09:00:00Z')
          expect(typeof data.jsEvent).toBe('object')
          expect(typeof data.view).toBe('object')
          expect(data.resource.id).toBe('b')
        },
      })
      let resourceTimeGridWrapper = new ResourceTimeGridViewWrapper(calendar).timeGrid

      $.simulateByPoint('drag', {
        point: resourceTimeGridWrapper.getPoint('b', '2015-11-29T09:00:00Z'),
        callback() {
          expect(dateClickCalled).toBe(true)
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

    it('allows a resource click', (done) => {
      let dateClickCalled = false
      let calendar = initCalendar({
        dateClick(data) {
          dateClickCalled = true
          expect(data.date).toEqualDate('2015-11-30T09:30:00Z')
          expect(typeof data.jsEvent).toBe('object')
          expect(typeof data.view).toBe('object')
          expect(data.resource.id).toBe('b')
        },
      })
      let resourceTimeGridWrapper = new ResourceTimeGridViewWrapper(calendar).timeGrid

      $.simulateByPoint('drag', {
        point: resourceTimeGridWrapper.getPoint('b', '2015-11-30T09:30:00Z'),
        callback() {
          expect(dateClickCalled).toBe(true)
          done()
        },
      })
    })
  })
})
