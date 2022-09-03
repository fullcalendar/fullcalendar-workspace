import { waitEventDrag } from 'fullcalendar-tests/src/lib/wrappers/interaction-util'
import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'

describe('eventConstraint', () => {
  pushOptions({
    now: '2016-09-04',
    initialView: 'resourceTimelineWeek',
    scrollTime: '00:00',
    editable: true,
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
      { id: 'c', title: 'Resource C' },
    ],
    events: [
      {
        title: 'event 1',
        start: '2016-09-04T01:00',
        resourceId: 'b',
      },
    ],
  })

  // FYI: the fact that eventConstraint may be specified in Event Source and Event Objects
  // is covered by the core tests.

  describe('with one resourceId', () => {
    pushOptions({
      eventConstraint: {
        resourceId: 'b',
      },
    })

    it('allows dragging to the resource', (done) => {
      let calendar = initCalendar()
      let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid
      let dragging = timelineGridWrapper.dragEventTo(
        timelineGridWrapper.getFirstEventEl(), 'b', '2016-09-04T03:00:00',
      )

      waitEventDrag(calendar, dragging).then((modifiedEvent) => {
        expect(modifiedEvent.start).toEqualDate('2016-09-04T03:00:00Z')
        done()
      })
    })

    it('disallows dragging to other resources', (done) => {
      let calendar = initCalendar()
      let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid
      let dragging = timelineGridWrapper.dragEventTo(
        timelineGridWrapper.getFirstEventEl(), 'c', '2016-09-04T03:00:00',
      )

      waitEventDrag(calendar, dragging).then((modifiedEvent) => {
        expect(modifiedEvent).toBeFalsy() // failure
        done()
      })
    })
  })

  describe('with multiple resourceIds', () => {
    pushOptions({
      eventConstraint: {
        resourceIds: ['b', 'c'],
      },
    })

    it('allows dragging to whitelisted resource', (done) => {
      let calendar = initCalendar()
      let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid
      let dragging = timelineGridWrapper.dragEventTo(
        timelineGridWrapper.getFirstEventEl(), 'c', '2016-09-04T03:00:00',
      )

      waitEventDrag(calendar, dragging).then((modifiedEvent) => {
        expect(modifiedEvent.start).toEqualDate('2016-09-04T03:00:00Z')
        done()
      })
    })

    it('disallows dragging to non-whitelisted resources', (done) => {
      let calendar = initCalendar()
      let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid
      let dragging = timelineGridWrapper.dragEventTo(
        timelineGridWrapper.getFirstEventEl(), 'a', '2016-09-04T03:00:00',
      )

      waitEventDrag(calendar, dragging).then((modifiedEvent) => {
        expect(modifiedEvent).toBeFalsy() // failure
        done()
      })
    })
  })
})
