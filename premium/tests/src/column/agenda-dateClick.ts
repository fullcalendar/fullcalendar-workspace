import { waitDateClick } from 'fullcalendar-tests/src/lib/wrappers/interaction-util'
import { TimeGridViewWrapper } from 'fullcalendar-tests/src/lib/wrappers/TimeGridViewWrapper'
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

    it('allows non-resource clicks', (done) => {
      let calendar = initCalendar()

      let timeGridWrapper = new TimeGridViewWrapper(calendar).timeGrid
      let clicking = timeGridWrapper.clickDate('2015-11-23T09:00:00')

      waitDateClick(calendar, clicking).then((dateClickArg) => {
        expect(dateClickArg.date).toEqualDate('2015-11-23T09:00:00Z')
        expect(typeof dateClickArg.jsEvent).toBe('object')
        expect(typeof dateClickArg.view).toBe('object')
        expect(dateClickArg.resource).toBeFalsy()
        done()
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
        dateClick(arg) {
          dateClickCalled = true
          expect(arg.date).toEqualDate('2015-11-29T09:00:00Z')
          expect(typeof arg.jsEvent).toBe('object')
          expect(typeof arg.view).toBe('object')
          expect(arg.resource.id).toBe('b')
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
        dateClick(arg) {
          dateClickCalled = true
          expect(arg.date).toEqualDate('2015-11-30T09:30:00Z')
          expect(typeof arg.jsEvent).toBe('object')
          expect(typeof arg.view).toBe('object')
          expect(arg.resource.id).toBe('b')
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
