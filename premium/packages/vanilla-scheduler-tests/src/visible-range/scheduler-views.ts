import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { Calendar } from 'fullcalendar'
import { config } from 'fullcalendar/protected-api'
import { initCalendar } from '@fullcalendar-tests/standard/src/lib/calendar'
import { queryParts } from '@fullcalendar-tests/standard/src/lib/models/events'
import { ResourceColumnsModel } from '../lib/models/resource-columns'

/*
Which dates timeline and resource views show: dateIncrement, visibleRange, validRange, and the cap
on the number of timeline slots.
*/
describe('visible range in scheduler views', () => {
  function getActiveRange(calendar: Calendar): [string, string] {
    return [calendar.view.activeStart.toISOString().slice(0, 10), calendar.view.activeEnd.toISOString().slice(0, 10)]
  }

  function getSlotDates(calendar: Calendar): string[] {
    return queryParts(calendar.el, 'slotLane').map((el) => el.getAttribute('data-date')!)
  }

  // the dates of the top row of slot headers
  function getTopHeaderDates(calendar: Calendar): string[] {
    return queryParts(queryParts(calendar.el, 'slotHeaderRow')[0], 'slotHeader').map((el) => el.getAttribute('data-date')!)
  }

  describe('dateIncrement in a month-long timeline', () => {
    const options = {
      initialView: 'timeline',
      initialDate: '2017-04-12',
      duration: { months: 1 },
    }

    it.each([
      // aligns to the start of the dateIncrement's unit when it's smaller than the duration's
      ['7 days', { days: 7 }, ['2017-04-12', '2017-05-12']],
      ['a week', { week: 1 }, ['2017-04-09', '2017-05-09']],
      // aligns to the smaller of the two units (the duration's month)
      ['a year', { years: 1 }, ['2017-04-01', '2017-05-01']],
    ])('with %s, aligns the initial range', (_desc, dateIncrement, initialRange) => {
      const calendar = initCalendar({ ...options, dateIncrement })

      expect(getActiveRange(calendar)).toEqual(initialRange)
    })

    it('moves by a dateIncrement bigger than the duration', () => {
      const calendar = initCalendar({ ...options, dateIncrement: { years: 1 } })

      calendar.next()

      expect(getActiveRange(calendar)).toEqual(['2018-04-01', '2018-05-01'])
    })

    // KNOWN BUG (`it.fails` until fixed): next() goes from the start of the duration's unit (Apr 1) plus 7 days, landing on
    // Apr 8, before the initial Apr 12. See planning/agent-notes/scheduler-misc.md
    it.fails('moves forward by a dateIncrement smaller than the duration', () => {
      const calendar = initCalendar({ ...options, dateIncrement: { days: 7 } })

      calendar.next()

      expect(getActiveRange(calendar)).toEqual(['2017-04-19', '2017-05-19'])
    })
  })

  describe('visibleRange', () => {
    const resources = [
      { id: 'a', title: 'a' },
      { id: 'b', title: 'b' },
    ]

    it.each([
      ['a few days', { start: '2017-06-07', end: '2017-06-09' }, ['2017-06-07T00:00:00', '2017-06-08T00:00:00']],
      ['years', { start: '2017-01', end: '2019-01' }, ['2017-01-01', '2018-01-01']],
    ])('shows %s in a timeline, a header per unit', (_desc, visibleRange, expectedDates) => {
      const calendar = initCalendar({ initialView: 'timeline', resources, visibleRange })

      expect(getTopHeaderDates(calendar)).toEqual(expectedDates)
    })

    it('shows a few days in resource timeGrid', () => {
      const calendar = initCalendar({
        initialView: 'resourceTimeGrid',
        datesAboveResources: true,
        resources,
        visibleRange: { start: '2017-06-07', end: '2017-06-09' },
      })

      expect(new ResourceColumnsModel(calendar.el).getDayLaneColumns()).toEqual([
        { date: '2017-06-07', resourceId: 'a' },
        { date: '2017-06-07', resourceId: 'b' },
        { date: '2017-06-08', resourceId: 'a' },
        { date: '2017-06-08', resourceId: 'b' },
      ])
    })
  })

  it('disables the slots outside validRange in a timeline', () => {
    const slotHeaderDidMount = vi.fn()
    const calendar = initCalendar({
      initialView: 'timelineWeek',
      initialDate: '2017-03-23',
      slotDuration: { days: 1 },
      validRange: { start: '2017-03-20', end: '2017-03-25' },
      slotHeaderDidMount,
    })

    expect(getTopHeaderDates(calendar)).toEqual([
      '2017-03-19', '2017-03-20', '2017-03-21', '2017-03-22', '2017-03-23', '2017-03-24', '2017-03-25',
    ])
    expect(slotHeaderDidMount.mock.calls.map(([info]) => [info.date.toISOString().slice(0, 10), info.isDisabled])).toEqual([
      ['2017-03-19', true],
      ['2017-03-20', false],
      ['2017-03-21', false],
      ['2017-03-22', false],
      ['2017-03-23', false],
      ['2017-03-24', false],
      ['2017-03-25', true],
    ])
  })

  describe('config.MAX_TIMELINE_SLOTS', () => {
    const options = {
      initialView: 'timelineDay',
      initialDate: '2017-03-23',
      slotDuration: '00:05', // 288 slots
    }

    it('allows a slotDuration within the limit', () => {
      const calendar = initCalendar(options)

      expect(config.MAX_TIMELINE_SLOTS).toBe(1000)
      expect(getSlotDates(calendar)).toHaveLength(288)
    })

    it('ignores a slotDuration that would make more slots, with a warning', () => {
      const origMax = config.MAX_TIMELINE_SLOTS
      config.MAX_TIMELINE_SLOTS = 100
      onTestFinished(() => {
        config.MAX_TIMELINE_SLOTS = origMax
      })
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const calendar = initCalendar(options)

      expect(warn).toHaveBeenCalledWith('FullCalendar:', 'Invalid option `slotDuration`: too many timeline cells.')
      const slotCount = getSlotDates(calendar).length
      expect(slotCount).toBeGreaterThan(0)
      expect(slotCount).toBeLessThanOrEqual(100)
    })
  })
})
