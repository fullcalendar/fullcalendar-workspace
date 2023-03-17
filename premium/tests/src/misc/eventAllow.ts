import { waitEventDrag } from '@fullcalendar/standard-tests/lib/wrappers/interaction-util'
import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper.js'

describe('eventAllow', () => {
  pushOptions({
    now: '2016-09-04',
    initialView: 'resourceTimelineWeek',
    scrollTime: '00:00',
    editable: true,
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
    ],
    events: [
      {
        title: 'event 1',
        start: '2016-09-04T01:00',
        resourceId: 'a',
      },
    ],
  })

  it('disallows dragging when returning false', (done) => { // and given correct params
    let isACalled = false
    let isBCalled = false
    let calendar = initCalendar({
      eventAllow(dropInfo, event) {
        if (dropInfo.resource.id === 'a') {
          isACalled = true
        } else if (dropInfo.resource.id === 'b') {
          isBCalled = true
        }
        expect(typeof event).toBe('object')
        return false
      },
    })

    let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid
    let dragging = timelineGridWrapper.dragEventTo(
      timelineGridWrapper.getFirstEventEl(), 'b', '2016-09-04T03:00:00',
    )

    waitEventDrag(calendar, dragging).then((modifiedEvent) => {
      expect(modifiedEvent).toBeFalsy() // drop failure?
      expect(isACalled).toBe(true)
      expect(isBCalled).toBe(true)
      done()
    })
  })

  it('allows dragging when returning true', (done) => {
    let isCalled = false
    let calendar = initCalendar({
      eventAllow() {
        isCalled = true
        return true
      },
    })

    let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid
    let dragging = timelineGridWrapper.dragEventTo(
      timelineGridWrapper.getFirstEventEl(), 'b', '2016-09-04T03:00:00',
    )

    waitEventDrag(calendar, dragging).then((modifiedEvent) => {
      expect(typeof modifiedEvent).toBe('object')
      expect(modifiedEvent.start).toEqualDate('2016-09-04T03:00:00Z')
      expect(modifiedEvent.getResources().length).toBe(1)
      expect(modifiedEvent.getResources()[0].id).toBe('b')
      expect(isCalled).toBe(true)
      done()
    })
  })
})
