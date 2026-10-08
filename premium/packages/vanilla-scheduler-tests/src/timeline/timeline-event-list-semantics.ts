import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'
import { TimelineViewWrapper } from '../lib/wrappers/TimelineViewWrapper'

// each event element is wrapped by an unstyled list item, directly within a list
function expectInList(eventEl: Element) {
  let itemEl = eventEl.parentElement
  expect(itemEl.getAttribute('role')).toBe('listitem')
  expect(itemEl.parentElement.getAttribute('role')).toBe('list')
}

describe('timeline event list semantics', () => {
  pushOptions({
    initialDate: '2023-04-03',
    scrollTime: 0,
  })

  it('renders events in a labeled list in non-resource timeline', async () => {
    let calendar = initCalendar({
      initialView: 'timelineDay',
      events: [
        { title: 'a', start: '2023-04-03T01:00:00', end: '2023-04-03T02:00:00' },
        { title: 'b', start: '2023-04-03T03:00:00', end: '2023-04-03T04:00:00' },
      ],
    })
    await waitTimeout()
    let eventEls = new TimelineViewWrapper(calendar).timelineGrid.getEventEls()

    expect(eventEls.length).toBe(2)
    eventEls.forEach(expectInList)
    expect(eventEls[0].parentElement.parentElement.getAttribute('aria-label')).toBe('Events')
  })

  describe('in resource timeline', () => {
    pushOptions({
      initialView: 'resourceTimelineDay',
      resources: [
        { id: 'a' },
        { id: 'b' },
      ],
    })

    it('renders an unlabeled list per lane, only when it has events', async () => {
      let calendar = initCalendar({
        events: [
          { title: 'a1', start: '2023-04-03T01:00:00', end: '2023-04-03T02:00:00', resourceId: 'a' },
          { title: 'a2', start: '2023-04-03T03:00:00', end: '2023-04-03T04:00:00', resourceId: 'a' },
        ],
      })
      await waitTimeout()
      let timelineGrid = new ResourceTimelineViewWrapper(calendar).timelineGrid
      let eventEls = timelineGrid.getEventEls()

      expect(eventEls.length).toBe(2)
      eventEls.forEach(expectInList)

      let listEl = eventEls[0].parentElement.parentElement
      expect(listEl.hasAttribute('aria-label')).toBe(false)
      expect(timelineGrid.getResourceLaneEl('a').querySelectorAll('[role=list]').length).toBe(1)
      expect(timelineGrid.getResourceLaneEl('b').querySelector('[role=list]')).toBe(null)
    })

    it('renders the more-link as a list item, and lists popover events', async () => {
      let calendar = initCalendar({
        eventMaxStack: 1,
        events: [
          { title: 'a1', start: '2023-04-03T01:00:00', end: '2023-04-03T02:00:00', resourceId: 'a' },
          { title: 'a2', start: '2023-04-03T01:00:00', end: '2023-04-03T02:00:00', resourceId: 'a' },
          { title: 'a3', start: '2023-04-03T01:00:00', end: '2023-04-03T02:00:00', resourceId: 'a' },
        ],
      })
      await waitTimeout()
      let timelineGrid = new ResourceTimelineViewWrapper(calendar).timelineGrid
      let moreEls = timelineGrid.getMoreEls()

      expect(moreEls.length).toBe(1)
      let moreItemEl = moreEls[0].closest('[role=listitem]')
      expect(moreItemEl).toBeTruthy()
      expect(moreItemEl.parentElement.getAttribute('role')).toBe('list')

      timelineGrid.openMorePopover()
      await waitTimeout()
      let popoverEventEls = timelineGrid.getMorePopoverEventEls()

      expect(popoverEventEls.length).toBe(2)
      popoverEventEls.forEach(expectInList)
    })
  })
})
