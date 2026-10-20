import { describe, expect, it } from 'vitest'
import { Calendar } from 'fullcalendar'
import { initCalendar } from '@fullcalendar-tests/standard/src/lib/calendar'
import { queryParts } from '@fullcalendar-tests/standard/src/lib/models/events'
import { waitForSettle } from '@fullcalendar-tests/standard/src/lib/settle'
import { ResourceColumnsModel } from '../lib/models/resource-columns'

/*
Business hours in resource columns: the calendar's businessHours shade every resource's column, and a
resource's own businessHours replace them in its column.
*/
describe('business hours in resource columns', () => {
  const options = {
    now: '2015-11-18', // a Wednesday
    scrollTime: '00:00',
    businessHours: true, // Mon-Fri 9-5
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
    ],
  }
  const WEEK = ['2015-11-15', '2015-11-16', '2015-11-17', '2015-11-18', '2015-11-19', '2015-11-20', '2015-11-21']
  const WEEKEND = ['2015-11-15', '2015-11-21']

  /*
  The non-business spans of each timeGrid column, keyed by `date:resourceId`, as `HH:mm-HH:mm` rounded to
  the half hour. Assumes the default full-day slots.
  */
  function getNonBusinessSpans(calendar: Calendar): { [column: string]: string[] } {
    const res: { [column: string]: string[] } = {}

    for (const laneEl of new ResourceColumnsModel(calendar.el).getDayLaneEls()) {
      const laneRect = laneEl.getBoundingClientRect()
      const toTime = (y: number) => {
        const halfHours = Math.round((y - laneRect.top) / laneRect.height * 48)
        return String(Math.floor(halfHours / 2)).padStart(2, '0') + ':' + (halfHours % 2 ? '30' : '00')
      }

      res[laneEl.getAttribute('data-date') + ':' + laneEl.getAttribute('data-resource-id')] =
        queryParts(laneEl, 'nonBusinessHours').map((el) => {
          const rect = el.getBoundingClientRect()
          return toTime(rect.top) + '-' + toTime(rect.bottom)
        })
    }

    return res
  }

  function buildSpans(dates: string[], resourceIds: string[], getSpans: (date: string, resourceId: string) => string[]) {
    const res: { [column: string]: string[] } = {}

    for (const date of dates) {
      for (const resourceId of resourceIds) {
        res[date + ':' + resourceId] = getSpans(date, resourceId)
      }
    }

    return res
  }

  const NINE_TO_FIVE = ['00:00-09:00', '17:00-24:00']

  describe.each([
    ['resources above dates', false],
    ['dates above resources', true],
  ])('with %s', (_desc, datesAboveResources) => {
    it('shades the weekend days in resourceDayGridWeek', async () => {
      const calendar = initCalendar({ ...options, initialView: 'resourceDayGridWeek', datesAboveResources })
      await waitForSettle()

      const shadedCells = new ResourceColumnsModel(calendar.el).getDayCellEls()
        .filter((el) => queryParts(el, 'nonBusinessHours').length)
        .map((el) => el.getAttribute('data-date') + ':' + el.getAttribute('data-resource-id'))
        .sort()

      expect(shadedCells).toEqual(['2015-11-15:a', '2015-11-15:b', '2015-11-21:a', '2015-11-21:b'])
    })

    it('shades the weekend and off-hours in resourceTimeGridWeek', async () => {
      const calendar = initCalendar({ ...options, initialView: 'resourceTimeGridWeek', datesAboveResources })
      await waitForSettle()

      expect(getNonBusinessSpans(calendar)).toEqual(buildSpans(WEEK, ['a', 'b'], (date) => (
        WEEKEND.includes(date) ? ['00:00-24:00'] : NINE_TO_FIVE
      )))
    })
  })

  describe('in resourceTimeGridDay', () => {
    const dayOptions = { ...options, initialView: 'resourceTimeGridDay' }
    const overriddenB = { id: 'b', title: 'Resource B', businessHours: { startTime: '02:00', endTime: '22:00' } }

    it('gives every resource the calendar\'s business hours', async () => {
      const calendar = initCalendar(dayOptions)
      await waitForSettle()

      expect(getNonBusinessSpans(calendar)).toEqual(buildSpans(['2015-11-18'], ['a', 'b'], () => NINE_TO_FIVE))
    })

    it('gives a resource its own business hours', async () => {
      const calendar = initCalendar({ ...dayOptions, resources: [{ id: 'a', title: 'Resource A' }, overriddenB] })
      await waitForSettle()

      expect(getNonBusinessSpans(calendar)).toEqual({
        '2015-11-18:a': NINE_TO_FIVE,
        '2015-11-18:b': ['00:00-02:00', '22:00-24:00'],
      })
    })

    it('follows the resource with its own business hours as it\'s removed and added', async () => {
      const calendar = initCalendar({ ...dayOptions, resources: [{ id: 'a', title: 'Resource A' }, overriddenB] })
      await waitForSettle()

      calendar.getResourceById('b')!.remove()
      await waitForSettle()
      expect(getNonBusinessSpans(calendar)).toEqual({ '2015-11-18:a': NINE_TO_FIVE })

      calendar.addResource(overriddenB)
      await waitForSettle()
      expect(getNonBusinessSpans(calendar)).toEqual({
        '2015-11-18:a': NINE_TO_FIVE,
        '2015-11-18:b': ['00:00-02:00', '22:00-24:00'],
      })
    })

    it('shades a whole day for only the resource with business hours', async () => {
      const calendar = initCalendar({
        ...dayOptions,
        initialDate: '2016-10-30', // a Sunday
        businessHours: false,
        resources: [
          { id: 'a', title: 'Resource A' },
          {
            id: 'b',
            title: 'Resource B',
            businessHours: [{ startTime: '08:00', endTime: '18:00', daysOfWeek: [1, 2, 3, 4, 5] }],
          },
        ],
      })
      await waitForSettle()

      expect(getNonBusinessSpans(calendar)).toEqual({
        '2016-10-30:a': [],
        '2016-10-30:b': ['00:00-24:00'],
      })
    })
  })
})
