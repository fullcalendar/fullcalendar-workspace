import { describe, expect, it, vi } from 'vitest'
import { createCalendarElement, initCalendar } from '@fullcalendar-tests/standard/tests/lib/calendar'
import { waitForSettle } from '@fullcalendar-tests/standard/tests/lib/settle'
import { TimelineModel } from '../lib/models/timeline'

describe('dragging events between resource timelines', () => {
  it('moves an event onto a resource of the other calendar', async () => {
    const els = [createCalendarElement(), createCalendarElement()]
    for (const el of els) {
      el.style.width = '50%'
      el.style.cssFloat = 'left'
    }

    const options = {
      initialView: 'resourceTimelineDay',
      initialDate: '2019-01-01',
      scrollTime: '00:00',
      editable: true,
      dragScroll: false,
    }
    const eventReceive = vi.fn()
    const calendar0 = initCalendar({
      ...options,
      resources: [{ id: 'a' }],
      events: [{ id: '1', resourceId: 'a', start: '2019-01-01T00:00:00', end: '2019-01-01T01:00:00' }],
    }, els[0])
    const calendar1 = initCalendar({ ...options, droppable: true, resources: [{ id: 'b' }], eventReceive }, els[1])
    await waitForSettle()

    const timeline1 = new TimelineModel(calendar1.el)
    await new TimelineModel(calendar0.el).dragEvent(
      '1',
      { date: '2019-01-01T00:00', resourceId: 'a' },
      () => timeline1.pointForDateTime({ date: '2019-01-01T02:00', resourceId: 'b' }),
    )

    expect(eventReceive).toHaveBeenCalledOnce()
    const event = calendar1.getEventById('1')!
    expect(event.startStr).toBe('2019-01-01T02:00:00Z')
    expect(event.getResources().map((resource) => resource.id)).toEqual(['b'])
    expect(calendar0.getEventById('1')).toBeNull()
  })
})
