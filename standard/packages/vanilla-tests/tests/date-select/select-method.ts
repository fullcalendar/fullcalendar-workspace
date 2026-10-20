import { describe, expect, it, vi } from 'vitest'
import { Calendar } from 'fullcalendar'
import dayGridPlugin from 'fullcalendar/daygrid'
import interactionPlugin from 'fullcalendar/interaction'
import { initCalendar } from '../lib/calendar'
import { DayGridModel } from '../lib/models/day-grid'
import { TimeGridModel } from '../lib/models/time-grid'
import { queryParts } from '../lib/models/events'
import { waitForSettle } from '../lib/settle'

/*
Selecting with calendar.select().
*/
describe('select method', () => {
  const options = {
    initialDate: '2014-05-25',
    selectable: true,
  }

  function getHighlightEls(root: HTMLElement): HTMLElement[] {
    return queryParts(root, 'highlight')
  }

  describe('in dayGrid', () => {
    const dayGridOptions = { ...options, initialView: 'dayGridMonth' }

    it.each([
      ['a start and end', ['2014-05-07', '2014-05-09'], '2014-05-09'],
      ['only a start', ['2014-05-07'], '2014-05-08'],
    ])('highlights and reports days given %s', async (_desc, args, expectedEnd) => {
      const select = vi.fn()
      const calendar = initCalendar({ ...dayGridOptions, select })
      await waitForSettle()

      calendar.select(...(args as [string, string?]))
      await waitForSettle()

      const dayGrid = new DayGridModel(calendar.el)
      expect(getHighlightEls(dayGrid.getDayCell('2014-05-07'))).toHaveLength(1)
      const info = select.mock.calls[0][0]
      expect(info.allDay).toBe(true)
      expect(info.startStr).toBe('2014-05-07')
      expect(info.endStr).toBe(expectedEnd)
    })

    it('highlights and reports timed dates as timed', async () => {
      const select = vi.fn()
      const calendar = initCalendar({ ...dayGridOptions, select })
      await waitForSettle()

      calendar.select('2014-05-07T06:00:00', '2014-05-09T06:00:00')
      await waitForSettle()

      expect(getHighlightEls(calendar.el).length).toBeGreaterThan(0)
      const info = select.mock.calls[0][0]
      expect(info.allDay).toBe(false)
      expect(info.startStr).toBe('2014-05-07T06:00:00Z')
      expect(info.endStr).toBe('2014-05-09T06:00:00Z')
    })

    it('highlights nothing for dates outside the view', async () => {
      const calendar = initCalendar(dayGridOptions)
      await waitForSettle()

      calendar.select('2015-05-07', '2015-05-09')
      await waitForSettle()

      expect(getHighlightEls(calendar.el)).toHaveLength(0)
    })
  })

  describe('in timeGrid', () => {
    const timeGridOptions = { ...options, initialView: 'timeGridWeek', scrollTime: '00:00' }

    it.each([
      ['a start and end', ['2014-05-26T06:00:00', '2014-05-26T08:00:00']],
      ['only a start', ['2014-05-26T06:00:00']],
    ])('highlights timed dates in the slots, given %s', async (_desc, args) => {
      const calendar = initCalendar(timeGridOptions)
      await waitForSettle()

      calendar.select(...(args as [string, string?]))
      await waitForSettle()

      const timeGrid = new TimeGridModel(calendar.el)
      expect(getHighlightEls(timeGrid.getDayLane('2014-05-26'))).toHaveLength(1)
    })

    it('highlights and reports all-day dates in the all-day row', async () => {
      const select = vi.fn()
      const calendar = initCalendar({ ...timeGridOptions, select })
      await waitForSettle()

      calendar.select('2014-05-26', '2014-05-28')
      await waitForSettle()

      const timeGrid = new TimeGridModel(calendar.el)
      expect(getHighlightEls(timeGrid.allDay.getDayCell('2014-05-26'))).toHaveLength(1)
      expect(getHighlightEls(timeGrid.getDayLane('2014-05-26'))).toHaveLength(0)
      const info = select.mock.calls[0][0]
      expect(info.allDay).toBe(true)
      expect(info.startStr).toBe('2014-05-26')
      expect(info.endStr).toBe('2014-05-28')
    })

    it.each([
      ['timed dates outside the view', {}, ['2015-05-26T06:00:00', '2015-05-26T07:00:00']],
      ['all-day dates when allDaySlot:false', { allDaySlot: false }, ['2014-05-26', '2014-05-28']],
    ])('highlights nothing for %s', async (_desc, moreOptions, args) => {
      const calendar = initCalendar({ ...timeGridOptions, ...moreOptions })
      await waitForSettle()

      calendar.select(...(args as [string, string]))
      await waitForSettle()

      expect(getHighlightEls(calendar.el)).toHaveLength(0)
    })
  })

  it('reports a selection on a calendar that isn\'t rendered', () => {
    const select = vi.fn()
    const calendar = new Calendar(document.createElement('div'), {
      plugins: [interactionPlugin, dayGridPlugin],
      now: '2018-12-25',
      select,
    })

    calendar.select('2018-12-20', '2018-12-23')

    const info = select.mock.calls[0][0]
    expect(info.startStr).toBe('2018-12-20')
    expect(info.endStr).toBe('2018-12-23')
  })
})
