import { waitEventDrag } from 'fullcalendar-tests/src/lib/wrappers/interaction-util'
import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'

describe('eventResourceEditable', () => {
  pushOptions({
    now: '2016-09-04',
    initialView: 'resourceTimelineWeek',
    scrollTime: '00:00',
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
      { id: 'c', title: 'Resource C' },
    ],
  })

  function buildEvent(extra = {}) {
    return $.extend({
      title: 'event 1',
      start: '2016-09-04T01:00:00',
      resourceId: 'b',
    }, extra)
  }

  describe('when dates ARE draggable but resource is NOT', () => {
    pushOptions({
      editable: true,
    })

    describeOptions({
      'via master property': {
        eventResourceEditable: false,
        events: [buildEvent()],
      },
      'via event source property': {
        eventSources: [{
          resourceEditable: false,
          events: [buildEvent()],
        }],
      },
      'via event property': {
        events: [buildEvent({ resourceEditable: false })],
      },
    }, () => {
      it('keeps within resource while dragging', (done) => {
        let calendar = initCalendar()
        let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid
        let dragging = timelineGridWrapper.dragEventTo(
          timelineGridWrapper.getFirstEventEl(), 'c', '2016-09-04T03:00:00',
        )

        waitEventDrag(calendar, dragging).then((modifiedEvent) => {
          expect(modifiedEvent.start).toEqualDate('2016-09-04T03:00:00Z')
          expect(modifiedEvent.getResources().length).toBe(1)
          expect(modifiedEvent.getResources()[0].id).toBe('b')
          done()
        })
      })
    })
  })

  describe('when dates are NOT draggable but resource IS', () => {
    pushOptions({
      editable: false,
    })

    describeOptions({
      'via master property': {
        eventResourceEditable: true,
        events: [buildEvent()],
      },
      'via event source property': {
        eventSources: [{
          resourceEditable: true,
          events: [buildEvent()],
        }],
      },
      'via event property': {
        events: [buildEvent({ resourceEditable: true })],
      },
    }, () => {
      it('keeps within resource while dragging', (done) => {
        let calendar = initCalendar()
        let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid
        let dragging = timelineGridWrapper.dragEventTo(
          timelineGridWrapper.getFirstEventEl(), 'c', '2016-09-04T03:00:00',
        )

        waitEventDrag(calendar, dragging).then((modifiedEvent) => {
          expect(modifiedEvent.start).toEqualDate('2016-09-04T01:00:00Z')
          expect(modifiedEvent.getResources().length).toBe(1)
          expect(modifiedEvent.getResources()[0].id).toBe('c')
          done()
        })
      })
    })
  })
})
