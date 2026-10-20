import { describe, expect, it } from 'vitest'
import { initCalendar } from '../lib/calendar'
import { queryPart } from '../lib/models/events'
import { waitForSettle } from '../lib/settle'

describe('named time zones', () => {
  it('computes view dates and parses zoneless event dates with the zone\'s offset', async () => {
    const calendar = initCalendar({
      initialView: 'dayGridMonth',
      initialDate: '2018-09-01',
      timeZone: 'Europe/Moscow',
      events: [{ start: '2018-09-05' }],
    })
    await waitForSettle()

    expect(calendar.view.currentStart.toISOString()).toBe(new Date('2018-09-01T00:00:00+03:00').toISOString())
    expect(calendar.getEvents()[0].start!.toISOString()).toBe(new Date('2018-09-05T00:00:00+03:00').toISOString())
  })

  // https://github.com/fullcalendar/fullcalendar/issues/5753
  it('moves the now indicator when switching timeZone', async () => {
    const calendar = initCalendar({
      timeZone: 'America/Chicago',
      initialView: 'timeGridDay',
      now: '2025-03-20T01:00:00',
      nowIndicator: true,
      scrollTime: 0,
    })
    await waitForSettle()

    const top0 = queryPart(calendar.el, 'nowIndicatorLine')!.getBoundingClientRect().top

    calendar.setOption('timeZone', 'Europe/London')
    await waitForSettle()

    const top1 = queryPart(calendar.el, 'nowIndicatorLine')!.getBoundingClientRect().top
    expect(Math.abs(top1 - top0)).toBeGreaterThan(100)
  })
})
