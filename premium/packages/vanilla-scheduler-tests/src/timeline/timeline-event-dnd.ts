import { waitEventDrag } from '@fullcalendar-tests/standard/lib/wrappers/interaction-util'
import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'

// TODO: test isRtl?

describe('timeline-view event drag-n-drop', () => {
  pushOptions({
    editable: true,
    now: '2015-11-29',
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
      { id: 'c', title: 'Resource C' },
    ],
    initialView: 'resourceTimelineDay',
    scrollTime: '00:00',
  })

  describeTimeZones((tz) => {
    it('allows switching date and resource', async () => {
      let dropSpy

      let calendar = initCalendar({
        events: [
          { title: 'event0', className: 'event0', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'b' },
        ],
        eventDrop:
          (dropSpy = spyCall((info) => {
            expect(info.event.start).toEqualDate(tz.parseDate('2015-11-29T05:00:00'))
            expect(info.event.end).toEqualDate(tz.parseDate('2015-11-29T06:00:00'))

            expect(info.oldResource.id).toBe('b')
            expect(info.newResource.id).toBe('a')

            let resources = info.event.getResources()
            expect(resources.length).toBe(1)
            expect(resources[0].id).toBe('a')
          })),
      })

      await waitTimeout()
      await dragElTo(calendar, $('.event0'), 'a', '2015-11-29T05:00:00')
      await waitTimeout()
      expect(dropSpy).toHaveBeenCalled()
    })
  })

  // https://github.com/fullcalendar/fullcalendar/issues/3900
  it('can drag past midnight with extended slotMaxTime', async () => {
    let calendar = initCalendar({
      slotDuration: '04:00',
      slotMaxTime: '36:00',
      events: [
        { title: 'event0', start: '2015-11-29T20:00:00', end: '2015-11-29T24:00:00', resourceId: 'b' },
      ],
    })

    await waitTimeout()
    let grid = new ResourceTimelineViewWrapper(calendar).timelineGrid
    let eventEl = grid.getEventEls()[0]
    let dragging = grid.dragEventTo(eventEl, 'b', '2015-11-30T04:00:00')
    let info = await waitEventDrag(calendar, dragging)
    expect(info.event.startStr).toBe('2015-11-30T04:00:00Z')
  })

  it('receives correct eventAllow args when switching date and resource', async () => {
    let calledEventAllow = false

    let calendar = initCalendar({
      events: [
        { title: 'event0', className: 'event0', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'b' },
      ],
      eventAllow(dropLocation, draggedEvent) {
        calledEventAllow = true
        expect(draggedEvent.start instanceof Date).toBe(true)
        return true
      },
    })

    await waitTimeout()
    await dragElTo(calendar, $('.event0'), 'a', '2015-11-29T05:00:00')
    await waitTimeout()
    expect(calledEventAllow).toBe(true)
  })

  it('allows switching date only', async () => {
    let dropSpy

    let calendar = initCalendar({
      events: [
        { title: 'event0', className: 'event0', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'b' },
      ],
      eventDrop:
        (dropSpy = spyCall((info) => {
          expect(info.event.start).toEqualDate('2015-11-29T05:00:00Z')
          expect(info.event.end).toEqualDate('2015-11-29T06:00:00Z')

          expect(info.oldResource).toBeNull()
          expect(info.newResource).toBeNull()

          let resources = info.event.getResources()
          expect(resources.length).toBe(1)
          expect(resources[0].id).toBe('b')
        })),
    })

    await waitTimeout()
    await dragElTo(calendar, $('.event0'), 'b', '2015-11-29T05:00:00')
    await waitTimeout()
    expect(dropSpy).toHaveBeenCalled()
  })

  it('can drag one of multiple event occurences', async () => {
    let dropInfo: any

    let calendar = initCalendar({
      events: [
        { title: 'event0', className: 'event0', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceIds: ['a', 'b'] },
      ],
      eventDrop(info) {
        dropInfo = info
      },
    })

    await waitTimeout()
    await dragElTo(calendar, $('.event0:first'), 'c', '2015-11-29T05:00:00')
    await waitTimeout() // let the drop rerender

    expect(dropInfo.event.start).toEqualDate('2015-11-29T05:00:00Z')
    expect(dropInfo.event.end).toEqualDate('2015-11-29T06:00:00Z')

    let resourceIds = dropInfo.event.getResources().map((resource) => resource.id)
    resourceIds.sort()
    expect(resourceIds).toEqual(['b', 'c'])
  })

  it('can drag one of multiple event occurences, linked by same event-IDs', async () => {
    let calendar = initCalendar({
      events: [
        { groupId: '1', title: 'event0', className: 'event0', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'a' },
        { groupId: '1', title: 'event1', className: 'event1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'b' },
      ],
    })

    let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid

    await waitTimeout()
    await dragElTo(
      calendar,
      $('.event0:first'),
      'c',
      '2015-11-29T05:00:00',
      () => { // onBeforeRelease (happens BEFORE callback)
        expect(timelineGridWrapper.getMirrorEventEls().length).toBe(2) // rendered two mirrors
      },
    )
    await waitTimeout() // let the drop rerender

    const events = calendar.getEvents()

    expect(events[0].start).toEqualDate('2015-11-29T05:00:00Z')
    expect(events[0].end).toEqualDate('2015-11-29T06:00:00Z')
    expect(events[0].getResources().length).toBe(1)
    expect(events[0].getResources()[0].id).toBe('c')

    expect(events[1].start).toEqualDate('2015-11-29T05:00:00Z')
    expect(events[1].end).toEqualDate('2015-11-29T06:00:00Z')
    expect(events[1].getResources().length).toBe(1)
    expect(events[1].getResources()[0].id).toBe('b')
  })

  it('can drag one of multiple event occurences onto an already-assigned resource', async () => {
    let dropInfo: any

    let calendar = initCalendar({
      events: [
        { title: 'event0', className: 'event0', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceIds: ['a', 'b'] },
      ],
      eventDrop(info) {
        dropInfo = info
      },
    })

    await waitTimeout()
    await dragElTo(calendar, $('.event0:first'), 'b', '2015-11-29T05:00:00')
    await waitTimeout() // let the drop rerender

    expect(dropInfo.event.start).toEqualDate('2015-11-29T05:00:00Z')
    expect(dropInfo.event.end).toEqualDate('2015-11-29T06:00:00Z')
    expect(dropInfo.event.getResources().length).toBe(1)
    expect(dropInfo.event.getResources()[0].id).toBe('b')
  })

  it('allows dragging via touch', async () => {
    let dropSpy

    let calendar = initCalendar({
      longPressDelay: 100,
      events: [
        { title: 'event0', className: 'event0', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'b' },
      ],
      eventDrop:
        (dropSpy = spyCall((info) => {
          expect(info.event.start).toEqualDate('2015-11-29T05:00:00Z')
          expect(info.event.end).toEqualDate('2015-11-29T06:00:00Z')

          let resources = info.event.getResources()
          expect(resources.length).toBe(1)
          expect(resources[0].id).toBe('a')
        })),
    })

    await waitTimeout()
    await touchDragElTo(calendar, $('.event0'), 200, 'a', '2015-11-29T05:00:00')
    await waitTimeout()
    expect(dropSpy).toHaveBeenCalled()
  })

  it('restores resource correctly with revert', async () => {
    let dropInfo: any

    let calendar = initCalendar({
      events: [
        { title: 'event0', className: 'event0', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'b' },
      ],
      eventDrop(info) {
        dropInfo = info
      },
    })

    await waitTimeout()
    await dragElTo(calendar, $('.event0'), 'a', '2015-11-29T05:00:00')
    await waitTimeout() // let the drop rerender

    expect(dropInfo.event.start).toEqualDate('2015-11-29T05:00:00Z')
    expect(dropInfo.event.end).toEqualDate('2015-11-29T06:00:00Z')
    expect(dropInfo.event.getResources().length).toBe(1)
    expect(dropInfo.event.getResources()[0].id).toBe('a')
    dropInfo.revert()

    let event = calendar.getEvents()[0]
    expect(event.start).toEqualDate('2015-11-29T02:00:00Z')
    expect(event.end).toEqualDate('2015-11-29T03:00:00Z')
    expect(event.getResources().length).toBe(1)
    expect(event.getResources()[0].id).toBe('b')
  })

  it('restores multiple resources correctly with revert', async () => {
    let dropInfo: any

    let calendar = initCalendar({
      events: [
        { title: 'event0', className: 'event0', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceIds: ['a', 'b'] },
      ],
      eventDrop(info) {
        dropInfo = info
      },
    })

    await waitTimeout()
    await dragElTo(calendar, $('.event0:first'), 'c', '2015-11-29T05:00:00')
    await waitTimeout() // let the drop rerender

    let resourceIds

    expect(dropInfo.event.start).toEqualDate('2015-11-29T05:00:00Z')
    expect(dropInfo.event.end).toEqualDate('2015-11-29T06:00:00Z')
    resourceIds = dropInfo.event.getResources().map((resource) => resource.id)
    expect(resourceIds).toEqual(['b', 'c'])
    dropInfo.revert()

    let event = calendar.getEvents()[0]
    expect(event.start).toEqualDate('2015-11-29T02:00:00Z')
    expect(event.end).toEqualDate('2015-11-29T03:00:00Z')
    resourceIds = event.getResources().map((resource) => resource.id)
    expect(resourceIds).toEqual(['a', 'b'])
  })

  describe('when per-resource businessHours and eventConstraint', () => {
    pushOptions({
      now: '2015-11-27', // need a weekday
      businessHours: true,
      eventConstraint: 'businessHours',
    })

    it('allow dragging into custom matching range', async () => {
      let dropSpy

      let calendar = initCalendar({
        resources: [
          { id: 'a', title: 'Resource A', businessHours: { startTime: '02:00', endTime: '22:00' } },
          { id: 'b', title: 'Resource B' },
          { id: 'c', title: 'Resource C' },
        ],
        events: [
          { title: 'event0', className: 'event0', start: '2015-11-27T09:00', end: '2015-11-27T10:00', resourceId: 'b' },
        ],
        scrollTime: '04:00:00',
        eventDrop:
          (dropSpy = spyCall((info) => {
            expect(info.event.start).toEqualDate('2015-11-27T05:00Z')
            expect(info.event.end).toEqualDate('2015-11-27T06:00Z')

            let resources = info.event.getResources()
            expect(resources.length).toBe(1)
            expect(resources[0].id).toBe('a')
          })),
      })

      await waitTimeout()
      await dragElTo(calendar, $('.event0'), 'a', '2015-11-27T05:00')
      await waitTimeout()
      expect(dropSpy).toHaveBeenCalled()
    })

    it('disallow dragging into custom non-matching range', async () => {
      let dropSpy

      let calendar = initCalendar({
        resources: [
          { id: 'a', title: 'Resource A', businessHours: { startTime: '10:00', endTime: '16:00' } },
          { id: 'b', title: 'Resource B' },
          { id: 'c', title: 'Resource C' },
        ],
        events: [
          { title: 'event0', className: 'event0', start: '2015-11-27T09:00', end: '2015-11-27T10:00', resourceId: 'b' },
        ],
        eventDrop:
          (dropSpy = spyCall((info) => {
            expect(info.event.start).toEqualDate('2015-11-27T05:00:00Z')
            expect(info.event.end).toEqualDate('2015-11-27T06:00:00Z')

            let resources = info.event.getResources()
            expect(resources.length).toBe(1)
            expect(resources[0].id).toBe('a')
          })),
      })

      await waitTimeout()
      await dragElTo(calendar, $('.event0'), 'a', '2015-11-27T09:00:00')
      await waitTimeout()
      expect(dropSpy).not.toHaveBeenCalled()
    })
  })

  function dragElTo(calendar, el, resourceId, date, onBeforeRelease?) {
    const dragging = new Promise<void>((resolve) => {
      let timelineGrid = new ResourceTimelineViewWrapper(calendar).timelineGrid

      el.simulate('drag', {
        localPoint: { left: 1, top: '50%' },
        end: timelineGrid.getPoint(resourceId, date),
        onBeforeRelease,
        callback: resolve,
      })
    })

    return waitEventDrag(calendar, dragging)
  }

  function touchDragElTo(calendar, el, delay, resourceId, date) {
    const dragging = new Promise<void>((resolve) => {
      let timelineGrid = new ResourceTimelineViewWrapper(calendar).timelineGrid

      el.simulate('drag', {
        isTouch: true,
        delay,
        localPoint: { left: 1, top: '50%' },
        end: timelineGrid.getPoint(resourceId, date),
        callback: resolve,
      })
    })

    return waitEventDrag(calendar, dragging)
  }
})
