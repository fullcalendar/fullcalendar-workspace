import { describe, expect, it } from 'vitest'
import { Calendar } from 'fullcalendar'
import { initCalendar } from '@fullcalendar-tests/standard/src/lib/calendar'
import { waitForSettle } from '@fullcalendar-tests/standard/src/lib/settle'
import { getSlotDates, getSlotHeaderDates } from '../lib/models/timeline-layout'

describe('timeline visible range', () => {
  function getActiveRange(calendar: Calendar): [string, string] {
    return [calendar.view.activeStart.toISOString(), calendar.view.activeEnd.toISOString()]
  }

  /*
  Week alignment: when the slots or their header intervals are a whole number of weeks, they start on
  firstDay. Otherwise firstDay doesn't come into play.
  */
  describe('aligning to firstDay', () => {
    const options = {
      initialDate: '2018-01-24', // a Wednesday
      initialView: 'timeline',
      duration: { days: 183 },
      firstDay: 1, // Monday
    }

    it('starts header intervals that aren\'t whole weeks at the initial date', async () => {
      const calendar = initCalendar({ ...options, slotHeaderInterval: { days: 5 } })
      await waitForSettle()

      expect(getActiveRange(calendar)).toEqual(['2018-01-24T00:00:00.000Z', '2018-07-26T00:00:00.000Z'])
      expect(getSlotHeaderDates(calendar.el, 0).slice(0, 2)).toEqual(['2018-01-24', '2018-01-29'])
    })

    it.each([
      ['slotDuration', { slotDuration: { weeks: 1 } }],
      ['slotHeaderInterval', { slotHeaderInterval: { weeks: 1 } }],
    ])('starts a %s in weeks on firstDay', async (_desc, moreOptions) => {
      const calendar = initCalendar({ ...options, ...moreOptions })
      await waitForSettle()

      expect(getSlotHeaderDates(calendar.el, 0).slice(0, 2)).toEqual(['2018-01-22', '2018-01-29'])
    })

    /*
    KNOWN BUG (`it.fails` until fixed): a whole number of weeks given in days isn't treated as weeks.
    Only a slotDuration whose greatest unit is week/month/year sets largeUnit
    (timeline-date-profile.ts), so these start on the initial Wednesday.
    */
    it.fails.each([
      ['slotHeaderInterval of 7 days', { slotHeaderInterval: { days: 7 } }],
      ['slotDuration of 14 days', { slotDuration: { days: 14 } }],
    ])('starts a %s on firstDay', async (_desc, moreOptions) => {
      const calendar = initCalendar({ ...options, ...moreOptions })
      await waitForSettle()

      expect(getSlotHeaderDates(calendar.el, 0)[0]).toBe('2018-01-22')
    })
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
