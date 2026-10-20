import { describe, expect, it } from 'vitest'
import { initCalendar } from '../lib/calendar'
import { waitForSettle } from '../lib/settle'
import { getActiveRange, getDayHeaderDates } from '../lib/view-dates'

describe('dayCount', () => {
  const options = {
    initialDate: '2017-03-15', // Wednesday
    weekends: false,
  }

  it.each([
    ['a top-level option', { initialView: 'dayGrid', dayCount: 5 }],
    ['a custom view\'s option', { initialView: 'custom', views: { custom: { type: 'dayGrid', dayCount: 5 } } }],
  ])('counts only visible days, as %s', async (_desc, extraOptions) => {
    const calendar = initCalendar({ ...options, ...extraOptions })
    await waitForSettle()

    expect(getActiveRange(calendar)).toEqual(['2017-03-15', '2017-03-22'])
    expect(getDayHeaderDates(calendar.el)).toEqual([
      '2017-03-15', '2017-03-16', '2017-03-17', '2017-03-20', '2017-03-21',
    ])
  })

  it('can span multiple weeks', async () => {
    const calendar = initCalendar({ ...options, initialView: 'timeGrid', dayCount: 9 })
    await waitForSettle()

    expect(getActiveRange(calendar)).toEqual(['2017-03-15', '2017-03-28'])
    expect(getDayHeaderDates(calendar.el)).toEqual([
      '2017-03-15', '2017-03-16', '2017-03-17',
      '2017-03-20', '2017-03-21', '2017-03-22', '2017-03-23', '2017-03-24',
      '2017-03-27',
    ])
  })

  it('navigates back over hidden days by a small dateIncrement', async () => {
    const calendar = initCalendar({
      initialDate: '2018-06-11', // Monday
      initialView: 'timeGridTwoDay',
      hiddenDays: [0, 6],
      views: {
        timeGridTwoDay: {
          type: 'timeGrid',
          dayCount: 2,
          dateIncrement: { days: 1 },
        },
      },
    })
    await waitForSettle()
    expect(getActiveRange(calendar)).toEqual(['2018-06-11', '2018-06-13'])

    calendar.prev()
    await waitForSettle()

    expect(getActiveRange(calendar)).toEqual(['2018-06-08', '2018-06-12'])
    expect(getDayHeaderDates(calendar.el)).toEqual(['2018-06-08', '2018-06-11'])
  })
})
