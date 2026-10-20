import { describe, expect, it } from 'vitest'
import { Calendar } from 'fullcalendar'
import { initCalendar } from '@fullcalendar-tests/standard/tests/lib/calendar'
import { waitForSettle } from '@fullcalendar-tests/standard/tests/lib/settle'
import { getSlotDates, getSlotHeaderDates } from '../lib/models/timeline-layout'

describe('timeline visible range', () => {
  function getActiveRange(calendar: Calendar): [string, string] {
    return [calendar.view.activeStart.toISOString(), calendar.view.activeEnd.toISOString()]
  }

  /*
  A duration in days aligns to the day, so the range and its 7-day header intervals start at the
  initial date. firstDay doesn't shift them.
  */
  it('starts a range of days and its 7-day header intervals at the initial date, regardless of firstDay', async () => {
    const calendar = initCalendar({
      initialDate: '2018-01-24', // a Wednesday
      initialView: 'timeline',
      duration: { days: 183 },
      slotHeaderInterval: { days: 7 },
      firstDay: 1, // Monday
    })
    await waitForSettle()

    expect(getActiveRange(calendar)).toEqual(['2018-01-24T00:00:00.000Z', '2018-07-26T00:00:00.000Z'])
    expect(getSlotHeaderDates(calendar.el, 0).slice(0, 2)).toEqual(['2018-01-24', '2018-01-31'])
  })

  // https://github.com/fullcalendar/fullcalendar-scheduler/issues/525
  it('goes back by dateIncrement when it\'s smaller than the duration', async () => {
    const calendar = initCalendar({
      initialDate: '2019-04-23',
      initialView: 'timelineThreeMonth',
      views: {
        timelineThreeMonth: {
          type: 'timeline',
          duration: { months: 3 },
          slotDuration: { months: 1 },
          dateIncrement: { months: 1 },
        },
      },
    })
    await waitForSettle()
    expect(getActiveRange(calendar)).toEqual(['2019-04-01T00:00:00.000Z', '2019-07-01T00:00:00.000Z'])
    expect(getSlotDates(calendar.el)).toEqual(['2019-04-01', '2019-05-01', '2019-06-01'])

    calendar.prev()
    await waitForSettle()
    expect(getActiveRange(calendar)).toEqual(['2019-03-01T00:00:00.000Z', '2019-06-01T00:00:00.000Z'])

    calendar.prev()
    await waitForSettle()
    expect(getActiveRange(calendar)).toEqual(['2019-02-01T00:00:00.000Z', '2019-05-01T00:00:00.000Z'])
    expect(getSlotDates(calendar.el)).toEqual(['2019-02-01', '2019-03-01', '2019-04-01'])
  })

  /*
  KNOWN BUG: https://github.com/fullcalendar/fullcalendar/issues/4937
  Warns "slotHeaderInterval must be a multiple of slotDuration" and renders 12 month slots instead.
  Marked as failing so it turns red once fixed. Then remove `.fails`.
  */
  it.fails('renders day slots with month-interval slot headers', async () => {
    const calendar = initCalendar({
      initialDate: '2019-05-16',
      initialView: 'timelineYear',
      slotDuration: { days: 1 },
      slotHeaderInterval: { months: 1 },
    })
    await waitForSettle()

    expect(getSlotHeaderDates(calendar.el, -1)).toHaveLength(12)
    expect(getSlotDates(calendar.el)).toHaveLength(365)
  })
})
