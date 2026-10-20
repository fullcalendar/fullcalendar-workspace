import { describe, expect, it } from 'vitest'
import { CalendarOptions } from 'fullcalendar'
import { initCalendar } from '@fullcalendar-tests/standard/src/lib/calendar'
import { getEventEls, isElVisible, queryPart, queryParts } from '@fullcalendar-tests/standard/src/lib/models/events'
import { getRectCenter, pointer } from '@fullcalendar-tests/standard/src/lib/pointer'
import { waitForSettle } from '@fullcalendar-tests/standard/src/lib/settle'
import { getResourceLane, getText } from '../lib/models/timeline-layout'

describe('timeline more-links', () => {
  const options: CalendarOptions = {
    initialView: 'resourceTimelineDay',
    initialDate: '2021-05-07',
    scrollTime: '00:00',
    eventMaxStack: 2,
    resources: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
  }

  function event(id: string, start: string, end: string) {
    return { id, title: id, resourceId: 'a', start: `2021-05-07T${start}:00`, end: `2021-05-07T${end}:00` }
  }

  async function openPopover(moreLinkEl: HTMLElement): Promise<HTMLElement> {
    await pointer.click(getRectCenter(moreLinkEl.getBoundingClientRect()))
    await waitForSettle()
    return queryPart(document, 'popover')!
  }

  function getPopoverEventIds(popoverEl: HTMLElement): string[] {
    return getEventEls(popoverEl).map((el) => getText(el))
  }

  it('puts the events past eventMaxStack in a popover', async () => {
    const calendar = initCalendar({
      ...options,
      events: [event('1', '00:00', '01:00'), event('2', '00:00', '01:00'), event('3', '00:00', '01:00')],
    })
    await waitForSettle()

    const moreLinkEls = queryParts(getResourceLane(calendar.el, 'a'), 'moreLink')
    expect(moreLinkEls).toHaveLength(1)
    expect(getText(moreLinkEls[0])).toBe('+1 more')

    const popoverEl = await openPopover(moreLinkEls[0])
    expect(getPopoverEventIds(popoverEl)).toEqual(['3'])
  })

  it('renders separate more-links for adjacent stacks', async () => {
    const calendar = initCalendar({
      ...options,
      events: [
        event('1', '00:00', '01:00'), event('2', '00:00', '01:00'), event('3', '00:00', '01:00'),
        event('4', '01:00', '02:00'), event('5', '01:00', '02:00'), event('6', '01:00', '02:00'),
      ],
    })
    await waitForSettle()

    expect(queryParts(calendar.el, 'moreLink')).toHaveLength(2)
  })

  it('puts overlapping hidden events in one popover, ordered by eventOrder', async () => {
    const calendar = initCalendar({
      ...options,
      eventOrder: 'title',
      events: [
        event('1', '00:00', '02:00'),
        event('2', '00:00', '02:00'),
        event('3', '01:00', '03:00'), // hidden
        event('4', '00:30', '02:30'), // hidden
      ],
    })
    await waitForSettle()

    const moreLinkEls = queryParts(calendar.el, 'moreLink')
    expect(moreLinkEls).toHaveLength(1)
    expect(isElVisible(moreLinkEls[0])).toBe(true)

    // below the stacked events, starting at the earliest hidden event
    const laneRect = getResourceLane(calendar.el, 'a').getBoundingClientRect()
    const moreLinkRect = moreLinkEls[0].getBoundingClientRect()
    const event2Rect = getEventEls(calendar.el, '2')[0].getBoundingClientRect()
    expect(moreLinkRect.top).toBeGreaterThanOrEqual(event2Rect.bottom - 1)
    expect(moreLinkRect.left).toBeGreaterThan(laneRect.left + 10)

    const popoverEl = await openPopover(moreLinkEls[0])
    expect(getPopoverEventIds(popoverEl)).toEqual(['3', '4'])
  })

  // https://github.com/fullcalendar/fullcalendar/issues/6543
  it('doesn\'t show the hidden events in the lane', async () => {
    const calendar = initCalendar({
      ...options,
      eventMaxStack: 2,
      eventOrder: 'title',
      initialDate: '2021-07-29',
      scrollTime: '11:00',
      resources: [{ id: 'a', title: 'Auditorium A' }],
      events: ['A', 'B', 'C'].map((title) => ({ resourceId: 'a', title, start: '2021-07-29T12:00:00+00:00' })),
    })
    await waitForSettle()

    const visibleEventEls = getEventEls(calendar.el).filter(isElVisible)
    expect(visibleEventEls.map((el) => getText(el)).sort()).toEqual(['A', 'B'])
    expect(queryParts(calendar.el, 'moreLink').filter(isElVisible)).toHaveLength(1)
  })
})
