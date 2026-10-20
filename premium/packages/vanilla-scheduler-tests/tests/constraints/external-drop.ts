import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { Draggable } from 'fullcalendar/interaction'
import { initCalendar } from '@fullcalendar-tests/standard/tests/lib/calendar'
import { createExternalEl, dragExternalEl } from '@fullcalendar-tests/standard/tests/lib/external'
import { waitForSettle } from '@fullcalendar-tests/standard/tests/lib/settle'
import { TimelineModel } from '../lib/models/timeline'

describe('constraints on external drops in resource timeline', () => {
  it.each([
    ['allows a drop beside the other event', '2015-11-29T04:00', true],
    ['prevents a drop onto the other event with eventOverlap:false', '2015-11-29T02:00', false],
  ])('%s', async (_desc, dateTime, isAllowed) => {
    const drop = vi.fn()
    const eventReceive = vi.fn()
    const calendar = initCalendar({
      initialView: 'resourceTimelineDay',
      initialDate: '2015-11-29',
      scrollTime: '00:00',
      dragScroll: false,
      droppable: true,
      eventOverlap: false,
      resources: [{ id: 'a', title: 'Resource A' }],
      events: [{ start: '2015-11-29T01:00:00', end: '2015-11-29T03:00:00', resourceId: 'a' }],
      drop,
      eventReceive,
    })
    await waitForSettle()

    const externalEl = createExternalEl()
    const draggable = new Draggable(externalEl, { eventData: { duration: '01:00' } })
    onTestFinished(() => draggable.destroy())
    await dragExternalEl(externalEl, () => new TimelineModel(calendar.el).pointForDateTime({ date: dateTime, resourceId: 'a' }))

    expect(drop).toHaveBeenCalledTimes(isAllowed ? 1 : 0)
    expect(eventReceive).toHaveBeenCalledTimes(isAllowed ? 1 : 0)
    expect(calendar.getEvents()).toHaveLength(isAllowed ? 2 : 1)
  })
})
