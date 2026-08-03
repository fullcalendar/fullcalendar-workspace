import { Calendar } from 'fullcalendar'
import { CalendarWrapper } from '@fullcalendar-tests/standard/lib/wrappers/CalendarWrapper'
import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { ResourceDayHeaderWrapper } from '../lib/wrappers/ResourceDayHeaderWrapper'
import { ResourceDayGridViewWrapper } from '../lib/wrappers/ResourceDayGridViewWrapper'
import { ResourceTimeGridViewWrapper } from '../lib/wrappers/ResourceTimeGridViewWrapper'

const DAY_1 = '2016-12-04'
const DAY_2 = '2016-12-05'
const DATES = [DAY_1, DAY_2]

interface ColumnInfo {
  date: string
  resourceId: string | null
}

interface HeaderCellInfo extends ColumnInfo {
  colSpan: number
}

function buildExpectedColumns(
  resourceIdsByDate: { [date: string]: string[] },
  resourceOrder: string[],
  datesAboveResources: boolean,
): ColumnInfo[] {
  let columns: ColumnInfo[] = []

  if (datesAboveResources) {
    for (let date of DATES) {
      let resourceIds = resourceIdsByDate[date]

      if (resourceIds.length) {
        for (let resourceId of resourceIds) {
          columns.push({ date, resourceId })
        }
      } else {
        columns.push({ date, resourceId: null })
      }
    }
  } else {
    for (let resourceId of resourceOrder) {
      for (let date of DATES) {
        if (resourceIdsByDate[date].includes(resourceId)) {
          columns.push({ date, resourceId })
        }
      }
    }

    for (let date of DATES) {
      if (!resourceIdsByDate[date].length) {
        columns.push({ date, resourceId: null })
      }
    }
  }

  return columns
}

function buildExpectedHeaderRows(
  resourceIdsByDate: { [date: string]: string[] },
  resourceOrder: string[],
  datesAboveResources: boolean,
): HeaderCellInfo[][] {
  let topRow: HeaderCellInfo[] = []
  let bottomRow: HeaderCellInfo[] = []

  if (datesAboveResources) {
    for (let date of DATES) {
      topRow.push({
        date,
        resourceId: null,
        colSpan: Math.max(resourceIdsByDate[date].length, 1),
      })
    }

    bottomRow = buildExpectedColumns(resourceIdsByDate, resourceOrder, true).map((column) => ({
      ...column,
      colSpan: 1,
    }))
  } else {
    for (let resourceId of resourceOrder) {
      let dates = DATES.filter((date) => resourceIdsByDate[date].includes(resourceId))

      if (dates.length) {
        topRow.push({ date: null, resourceId, colSpan: dates.length })

        for (let date of dates) {
          bottomRow.push({ date, resourceId, colSpan: 1 })
        }
      }
    }

    for (let date of DATES) {
      if (!resourceIdsByDate[date].length) {
        topRow.push({ date, resourceId: null, colSpan: 1 })
        bottomRow.push({ date, resourceId: null, colSpan: 1 })
      }
    }
  }

  return [topRow, bottomRow]
}

function expectHeaderStructure(
  header: ResourceDayHeaderWrapper,
  resourceIdsByDate: { [date: string]: string[] },
  resourceOrder: string[],
  datesAboveResources: boolean,
) {
  expect(header.getCellInfoByRow()).toEqual(
    buildExpectedHeaderRows(resourceIdsByDate, resourceOrder, datesAboveResources),
  )
}

function expectTimeGridStructure(
  calendar: Calendar,
  resourceIdsByDate: { [date: string]: string[] },
  resourceOrder: string[],
  datesAboveResources: boolean,
) {
  let viewWrapper = new ResourceTimeGridViewWrapper(calendar)

  expectHeaderStructure(viewWrapper.header, resourceIdsByDate, resourceOrder, datesAboveResources)
  expect(viewWrapper.timeGrid.getColumnInfo()).toEqual(
    buildExpectedColumns(resourceIdsByDate, resourceOrder, datesAboveResources),
  )
}

describe('filterResourcesWithEvents per date', () => {
  pushOptions({
    initialDate: DAY_1,
    initialView: 'resourceTimeGridTwoDay',
    now: DAY_1,
    scrollTime: '00:00',
    filterResourcesWithEvents: true,
    views: {
      resourceTimeGridTwoDay: {
        type: 'resourceTimeGrid',
        duration: { days: 2 },
      },
    },
  })

  describeValues({
    'when resources are above dates': false,
    'when dates are above resources': true,
  }, (datesAboveResources) => {
    pushOptions({ datesAboveResources })

    it('filters each date\'s headers and body columns', () => {
      let calendar = initCalendar({
        resources: [
          { id: 'a', title: 'Resource A' },
          { id: 'b', title: 'Resource B' },
        ],
        events: [
          { title: 'A day 1', start: DAY_1 + 'T09:00:00', resourceId: 'a' },
          { title: 'B day 1', start: DAY_1 + 'T10:00:00', resourceId: 'b' },
          { title: 'B day 2', start: DAY_2 + 'T10:00:00', resourceId: 'b' },
        ],
      })

      expectTimeGridStructure(calendar, {
        [DAY_1]: ['a', 'b'],
        [DAY_2]: ['b'],
      }, ['a', 'b'], datesAboveResources)
      expect(new ResourceTimeGridViewWrapper(calendar).timeGrid.getEventEls().length).toBe(3)
    })

    it('keeps the full Cartesian layout when filtering is false', () => {
      let calendar = initCalendar({
        filterResourcesWithEvents: false,
        resources: [
          { id: 'a', title: 'Resource A' },
          { id: 'b', title: 'Resource B' },
        ],
      })

      expectTimeGridStructure(calendar, {
        [DAY_1]: ['a', 'b'],
        [DAY_2]: ['a', 'b'],
      }, ['a', 'b'], datesAboveResources)
    })

    it('counts an all-day event and keeps the all-day and timed columns aligned', () => {
      let calendar = initCalendar({
        resources: [{ id: 'a', title: 'Resource A' }],
        events: [{ title: 'All day', start: DAY_1, resourceId: 'a' }],
      })
      let expectedResourceIdsByDate = {
        [DAY_1]: ['a'],
        [DAY_2]: [],
      }
      let viewWrapper = new ResourceTimeGridViewWrapper(calendar)

      expectTimeGridStructure(calendar, expectedResourceIdsByDate, ['a'], datesAboveResources)
      expect(viewWrapper.dayGrid.getCellInfo()).toEqual(
        buildExpectedColumns(expectedResourceIdsByDate, ['a'], datesAboveResources),
      )
      expect(viewWrapper.timeGrid.getEventEls().length).toBe(0)
      expect(new CalendarWrapper(calendar).getEventEls().length).toBe(1)
    })

    it('counts a timed event on both dates when it spans midnight', () => {
      let calendar = initCalendar({
        resources: [{ id: 'a', title: 'Resource A' }],
        events: [{
          title: 'Spans midnight',
          start: DAY_1 + 'T22:00:00',
          end: DAY_2 + 'T02:00:00',
          resourceId: 'a',
        }],
      })

      expectTimeGridStructure(calendar, {
        [DAY_1]: ['a'],
        [DAY_2]: ['a'],
      }, ['a'], datesAboveResources)
      expect(new ResourceTimeGridViewWrapper(calendar).timeGrid.getEventEls().length).toBe(2)
    })

    it('does not count an exclusive midnight end on day 2', () => {
      let calendar = initCalendar({
        resources: [{ id: 'a', title: 'Resource A' }],
        events: [{
          title: 'Ends at midnight',
          start: DAY_1 + 'T22:00:00',
          end: DAY_2 + 'T00:00:00',
          resourceId: 'a',
        }],
      })

      expectTimeGridStructure(calendar, {
        [DAY_1]: ['a'],
        [DAY_2]: [],
      }, ['a'], datesAboveResources)
      expect(new ResourceTimeGridViewWrapper(calendar).timeGrid.getEventEls().length).toBe(1)
    })

    it('uses extended slotMaxTime ranges for both intersecting dates', () => {
      let calendar = initCalendar({
        slotMaxTime: '30:00',
        resources: [{ id: 'a', title: 'Resource A' }],
        events: [{
          title: 'Early day 2',
          start: DAY_2 + 'T02:00:00',
          end: DAY_2 + 'T03:00:00',
          resourceId: 'a',
        }],
      })

      expectTimeGridStructure(calendar, {
        [DAY_1]: ['a'],
        [DAY_2]: ['a'],
      }, ['a'], datesAboveResources)
      expect(new ResourceTimeGridViewWrapper(calendar).timeGrid.getEventEls().length).toBe(2)
    })

    it('counts every resource on a multi-resource event', () => {
      let calendar = initCalendar({
        resources: [
          { id: 'a', title: 'Resource A' },
          { id: 'b', title: 'Resource B' },
        ],
        events: [{
          title: 'Shared',
          start: DAY_1 + 'T09:00:00',
          resourceIds: ['a', 'b'],
        }],
      })

      expectTimeGridStructure(calendar, {
        [DAY_1]: ['a', 'b'],
        [DAY_2]: [],
      }, ['a', 'b'], datesAboveResources)
      expect(new ResourceTimeGridViewWrapper(calendar).timeGrid.getEventEls().length).toBe(2)
    })

    it('counts background events', () => {
      let calendar = initCalendar({
        resources: [{ id: 'a', title: 'Resource A' }],
        events: [{
          start: DAY_1 + 'T09:00:00',
          end: DAY_1 + 'T10:00:00',
          resourceId: 'a',
          display: 'background',
        }],
      })

      expectTimeGridStructure(calendar, {
        [DAY_1]: ['a'],
        [DAY_2]: [],
      }, ['a'], datesAboveResources)
      expect(new CalendarWrapper(calendar).getBgEventEls().length).toBe(1)
    })

    it('counts recurring instances on only their matching date', () => {
      let calendar = initCalendar({
        resources: [{ id: 'a', title: 'Resource A' }],
        events: [{
          title: 'Monday only',
          daysOfWeek: [1],
          startTime: '09:00',
          endTime: '10:00',
          startRecur: DAY_1,
          endRecur: '2016-12-06',
          resourceId: 'a',
        }],
      })

      expectTimeGridStructure(calendar, {
        [DAY_1]: [],
        [DAY_2]: ['a'],
      }, ['a'], datesAboveResources)
      expect(new ResourceTimeGridViewWrapper(calendar).timeGrid.getEventEls().length).toBe(1)
    })

    it('propagates child events to ancestors per date', () => {
      let calendar = initCalendar({
        resources: [{
          id: 'parent',
          title: 'Parent',
          children: [{ id: 'child', title: 'Child' }],
        }],
        events: [{ title: 'Child event', start: DAY_1 + 'T09:00:00', resourceId: 'child' }],
      })

      expectTimeGridStructure(calendar, {
        [DAY_1]: ['parent', 'child'],
        [DAY_2]: [],
      }, ['parent', 'child'], datesAboveResources)
      expect(new ResourceTimeGridViewWrapper(calendar).timeGrid.getEventEls().length).toBe(1)
    })

    it('keeps an empty date as a resource-less placeholder column', () => {
      let calendar = initCalendar({
        resources: [{ id: 'a', title: 'Resource A' }],
        events: [{ title: 'Day 1 only', start: DAY_1 + 'T09:00:00', resourceId: 'a' }],
      })
      let viewWrapper = new ResourceTimeGridViewWrapper(calendar)

      expectTimeGridStructure(calendar, {
        [DAY_1]: ['a'],
        [DAY_2]: [],
      }, ['a'], datesAboveResources)
      expect(viewWrapper.timeGrid.getColumnInfo()[1]).toEqual({
        date: DAY_2,
        resourceId: null,
      })
    })

    it('reports dateClick from a present date and resource column', async () => {
      let clickResolve: () => void
      let clickPromise = new Promise<void>((resolve) => {
        clickResolve = resolve
      })
      let calendar = initCalendar({
        resources: [
          { id: 'a', title: 'Resource A' },
          { id: 'b', title: 'Resource B' },
        ],
        events: [
          { title: 'A day 1', start: DAY_1 + 'T09:00:00', resourceId: 'a' },
          { title: 'B day 2', start: DAY_2 + 'T10:00:00', resourceId: 'b' },
        ],
        dateClick(info) {
          expect(info.date).toEqualDate(DAY_2 + 'T09:00:00Z')
          expect(info.resource.id).toBe('b')
          clickResolve()
        },
      })

      await waitTimeout()
      let point = new ResourceTimeGridViewWrapper(calendar).timeGrid.getPoint('b', DAY_2 + 'T09:00:00Z')

      await new Promise<void>((resolve) => {
        $.simulateByPoint('drag', {
          point,
          callback() {
            resolve()
          },
        })
      })
      await clickPromise
    })
  })

  describe('in resource dayGrid', () => {
    pushOptions({
      initialView: 'resourceDayGridTwoDay',
      views: {
        resourceDayGridTwoDay: {
          type: 'resourceDayGrid',
          duration: { days: 2 },
        },
      },
    })

    describeValues({
      'when resources are above dates': false,
      'when dates are above resources': true,
    }, (datesAboveResources) => {
      pushOptions({ datesAboveResources })

      it('filters a single-row multi-day view per date', () => {
        let calendar = initCalendar({
          resources: [
            { id: 'a', title: 'Resource A' },
            { id: 'b', title: 'Resource B' },
          ],
          events: [
            { title: 'A day 1', start: DAY_1, resourceId: 'a' },
            { title: 'B day 1', start: DAY_1, resourceId: 'b' },
            { title: 'B day 2', start: DAY_2, resourceId: 'b' },
          ],
        })
        let viewWrapper = new ResourceDayGridViewWrapper(calendar)
        let expectedResourceIdsByDate = {
          [DAY_1]: ['a', 'b'],
          [DAY_2]: ['b'],
        }

        expectHeaderStructure(viewWrapper.header, expectedResourceIdsByDate, ['a', 'b'], datesAboveResources)
        expect(viewWrapper.dayGrid.getCellInfo()).toEqual(
          buildExpectedColumns(expectedResourceIdsByDate, ['a', 'b'], datesAboveResources),
        )
        expect(new CalendarWrapper(calendar).getEventEls().length).toBe(3)
      })
    })

    it('keeps view-wide resource columns in a multi-row month view', () => {
      let calendar = initCalendar({
        initialView: 'resourceDayGridMonth',
        resources: [
          { id: 'a', title: 'Resource A' },
          { id: 'b', title: 'Resource B' },
        ],
        events: [
          { title: 'A first week', start: DAY_1, resourceId: 'a' },
          { title: 'B second week', start: '2016-12-12', resourceId: 'b' },
        ],
      })
      let cellInfo = new ResourceDayGridViewWrapper(calendar).dayGrid.getCellInfo()
      let resourceIdsByDate = {}

      for (let cell of cellInfo) {
        if (!resourceIdsByDate[cell.date]) {
          resourceIdsByDate[cell.date] = []
        }
        resourceIdsByDate[cell.date].push(cell.resourceId)
      }

      expect(Object.keys(resourceIdsByDate).length).toBeGreaterThan(7)
      for (let date in resourceIdsByDate) {
        expect(resourceIdsByDate[date]).toEqual(['a', 'b'])
      }
      expect(new CalendarWrapper(calendar).getEventEls().length).toBe(2)
    })
  })
})
