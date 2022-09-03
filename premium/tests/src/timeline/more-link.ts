import { filterVisibleEls } from 'fullcalendar-tests/src/lib/dom-misc'
import { ResourceTimelineGridWrapper } from '../lib/wrappers/ResourceTimelineGridWrapper'
import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'

describe('eventMaxStack', () => {
  pushOptions({
    initialView: 'resourceTimelineDay',
    initialDate: '2021-05-07',
    scrollTime: 0,
    eventMaxStack: 2,
    resources: [
      { id: 'a' },
      { id: 'b' },
      { id: 'c' },
    ],
  })

  it('puts hidden events in a popover', (done) => {
    let calendar = initCalendar({
      events: [
        { start: '2021-05-07T00:00:00', end: '2021-05-07T01:00:00', resourceId: 'a' },
        { start: '2021-05-07T00:00:00', end: '2021-05-07T01:00:00', resourceId: 'a' },
        { start: '2021-05-07T00:00:00', end: '2021-05-07T01:00:00', resourceId: 'a' }, // hidden
      ],
    })
    let timelineGrid = new ResourceTimelineViewWrapper(calendar).timelineGrid
    let moreLinkEls = timelineGrid.getMoreEls()
    expect(moreLinkEls.length).toBe(1)

    timelineGrid.openMorePopover()
    setTimeout(() => {
      let moreEventEls = timelineGrid.getMorePopoverEventEls()
      expect(moreEventEls.length).toBe(1)
      done()
    })
  })

  it('can drag events out of popover', (done) => {
    let calendar = initCalendar({
      editable: true,
      events: [
        { id: '1', start: '2021-05-07T00:00:00', end: '2021-05-07T01:00:00', resourceId: 'a' },
        { id: '2', start: '2021-05-07T00:00:00', end: '2021-05-07T01:00:00', resourceId: 'a' },
        { id: '3', start: '2021-05-07T00:00:00', end: '2021-05-07T01:00:00', resourceId: 'a' }, // hidden
      ],
    })
    let timelineGrid = new ResourceTimelineViewWrapper(calendar).timelineGrid
    timelineGrid.openMorePopover()
    setTimeout(() => {
      let moreEventEls = timelineGrid.getMorePopoverEventEls()
      let newStart = '2021-05-07T04:00:00'
      let endPoint = timelineGrid.getPoint('c', newStart)
      endPoint.left += 1 // has trouble overcoming border
      $(moreEventEls).simulate('drag', {
        end: endPoint,
        onRelease() {
          let event = calendar.getEventById('3')
          expect(event.start).toEqualDate(newStart)
          expect(event.getResources()[0].id).toBe('c')
          done()
        },
      })
    })
  })

  it('causes separate adjacent more links', () => {
    let calendar = initCalendar({
      events: [
        { start: '2021-05-07T00:00:00', end: '2021-05-07T01:00:00', resourceId: 'a' },
        { start: '2021-05-07T00:00:00', end: '2021-05-07T01:00:00', resourceId: 'a' },
        { start: '2021-05-07T00:00:00', end: '2021-05-07T01:00:00', resourceId: 'a' }, // hidden
        { start: '2021-05-07T01:00:00', end: '2021-05-07T02:00:00', resourceId: 'a' },
        { start: '2021-05-07T01:00:00', end: '2021-05-07T02:00:00', resourceId: 'a' },
        { start: '2021-05-07T01:00:00', end: '2021-05-07T02:00:00', resourceId: 'a' }, // hidden
      ],
    })
    let timelineGrid = new ResourceTimelineViewWrapper(calendar).timelineGrid
    let moreLinkEls = timelineGrid.getMoreEls()
    expect(moreLinkEls.length).toBe(2)
  })

  // TODO: test coords of more link
  it('puts overlapping hidden events in same popover, respecting eventOrder', (done) => {
    let calendar = initCalendar({
      eventOrder: 'title',
      events: [
        { title: '1', start: '2021-05-07T00:00:00', end: '2021-05-07T02:00:00', resourceId: 'a' },
        { title: '2', start: '2021-05-07T00:00:00', end: '2021-05-07T02:00:00', resourceId: 'a' },
        { title: '3', start: '2021-05-07T01:00:00', end: '2021-05-07T03:00:00', resourceId: 'a' }, // hidden
        { title: '4', start: '2021-05-07T00:30:00', end: '2021-05-07T02:30:00', resourceId: 'a' }, // hidden
      ],
    })
    let timelineGrid = new ResourceTimelineViewWrapper(calendar).timelineGrid
    let moreLinkEls = timelineGrid.getMoreEls()
    expect(moreLinkEls.length).toBe(1)
    expect(moreLinkEls[0].style.visibility).not.toBe('hidden') // was having trouble finishing positioning process

    timelineGrid.openMorePopover()
    setTimeout(() => {
      let moreEventEls = timelineGrid.getMorePopoverEventEls()
      expect(moreEventEls.length).toBe(2)
      expect(ResourceTimelineGridWrapper.getEventElInfo(moreEventEls[0]).title).toBe('3')
      done()
    })
  })

  // https://github.com/fullcalendar/fullcalendar/issues/6543
  it('does not display hidden events', () => {
    let calendar = initCalendar({
      initialView: 'resourceTimelineDay',
      eventOrder: 'title',
      initialDate: '2021-07-29',
      scrollTime: '11:00',
      events: [
        {
          resourceId: 'a',
          title: 'A',
          start: '2021-07-29T12:00:00+00:00',
        },
        {
          resourceId: 'a',
          title: 'B',
          start: '2021-07-29T12:00:00+00:00',
        },
        {
          resourceId: 'a',
          title: 'C',
          start: '2021-07-29T12:00:00+00:00',
        },
      ],
      resources: [
        {
          id: 'a',
          title: 'Auditorium A',
        },
      ],
    })
    let timelineGrid = new ResourceTimelineViewWrapper(calendar).timelineGrid
    let eventEls = timelineGrid.getEventEls()
    let visibleEventEls = filterVisibleEls(eventEls)
    expect(visibleEventEls.length).toBe(2)
  })
})
