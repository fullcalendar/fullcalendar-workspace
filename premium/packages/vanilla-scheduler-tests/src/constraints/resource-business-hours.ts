import { describe, expect, it, vi } from 'vitest'
import { initCalendar } from '@fullcalendar-tests/standard/src/lib/calendar'
import { waitForSettle } from '@fullcalendar-tests/standard/src/lib/settle'
import { TimelineModel } from '../lib/models/timeline'

/*
eventConstraint:'businessHours' uses the target resource's own businessHours.
*/
describe('eventConstraint:businessHours with per-resource businessHours', () => {
  it.each([
    ['allows a drop within the target resource\'s hours', '02:00', '22:00', true],
    ['prevents a drop outside the target resource\'s hours', '10:00', '16:00', false],
  ])('%s', async (_desc, startTime, endTime, isAllowed) => {
    const eventDrop = vi.fn()
    const calendar = initCalendar({
      initialView: 'resourceTimelineDay',
      initialDate: '2015-11-27', // a weekday
      scrollTime: '04:00',
      editable: true,
      dragScroll: false,
      businessHours: true,
      eventConstraint: 'businessHours',
      resources: [
        { id: 'a', title: 'Resource A', businessHours: { startTime, endTime } },
        { id: 'b', title: 'Resource B' },
      ],
      events: [{ id: '1', start: '2015-11-27T09:00:00', end: '2015-11-27T10:00:00', resourceId: 'b' }],
      eventDrop,
    })
    await waitForSettle()

    await new TimelineModel(calendar.el).dragEvent(
      '1',
      { date: '2015-11-27T09:00', resourceId: 'b' },
      { date: '2015-11-27T05:00', resourceId: 'a' },
    )

    expect(eventDrop).toHaveBeenCalledTimes(isAllowed ? 1 : 0)
    expect(calendar.getEventById('1')!.startStr).toBe(isAllowed ? '2015-11-27T05:00:00Z' : '2015-11-27T09:00:00Z')
  })
})
