import { Calendar } from 'fullcalendar'
import { CalendarWrapper } from '@fullcalendar-tests/standard/lib/wrappers/CalendarWrapper'
import { ignoreResizeObserverLoops, waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { ResourceDayHeaderWrapper } from '../lib/wrappers/ResourceDayHeaderWrapper'
import { ResourceDayGridViewWrapper } from '../lib/wrappers/ResourceDayGridViewWrapper'
import { ResourceTimeGridViewWrapper } from '../lib/wrappers/ResourceTimeGridViewWrapper'

const DAY_1 = '2016-12-04'
const DAY_2 = '2016-12-05'
const DAY_3 = '2016-12-06'
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
      if (resourceIdsByDate[date].length) {
        topRow.push({
          date,
          resourceId: null,
          colSpan: resourceIdsByDate[date].length,
        })
      }
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

/*
The bottom header row always has one colSpan-1 cell per column, so it's a stand-in for the
body columns. Cells in the rows above must line up with the cells they span, which is only
true if their width tracks colSpan -- with ragged groups, equal-share sizing does not.
*/
function expectHeaderRowsAlign(header: ResourceDayHeaderWrapper) {
  let cellElsByRow = header.getCellElsByRow()
  let colEls = cellElsByRow[cellElsByRow.length - 1]

  for (let cellEls of cellElsByRow.slice(0, -1)) {
    let colI = 0

    for (let cellEl of cellEls) {
      let colSpan = Number(cellEl.getAttribute('aria-colspan') || 1)
      let coveredWidth = colEls.slice(colI, colI + colSpan).reduce(
        (total, colEl) => total + colEl.getBoundingClientRect().width,
        0,
      )

      // tolerance for sub-pixel layout rounding
      expect(Math.abs(cellEl.getBoundingClientRect().width - coveredWidth)).toBeLessThan(1)
      colI += colSpan
    }

    expect(colI).toBe(colEls.length)
  }
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

    it('sizes ragged header cells to the columns they span', async () => {
      let calendar = initCalendar({
        resources: [
          { id: 'a', title: 'Resource A' },
          { id: 'b', title: 'Resource B' },
        ],
        events: [
          // day 1 has both resources, day 2 has only B, so one header cell spans two
          // columns while the other spans one
          { title: 'A day 1', start: DAY_1 + 'T09:00:00', resourceId: 'a' },
          { title: 'B day 1', start: DAY_1 + 'T10:00:00', resourceId: 'b' },
          { title: 'B day 2', start: DAY_2 + 'T10:00:00', resourceId: 'b' },
        ],
      })

      await waitTimeout() // let column widths settle

      expectHeaderRowsAlign(new ResourceTimeGridViewWrapper(calendar).header)
    })

    // resource A stays in the view-wide set (its event is inside the overall range) but earns
    // no column, because no column's rendered range contains it
    it('gives no column to an event outside every column\'s slotMinTime window', () => {
      let calendar = initCalendar({
        slotMinTime: '06:00',
        resources: [
          { id: 'a', title: 'Resource A' },
          { id: 'b', title: 'Resource B' },
        ],
        events: [
          { id: 'a-event', title: 'A before slots', start: DAY_1 + 'T02:00:00', resourceId: 'a' },
          { title: 'B in slots', start: DAY_1 + 'T07:00:00', resourceId: 'b' },
        ],
      })
      let timeGrid = new ResourceTimeGridViewWrapper(calendar).timeGrid

      expectTimeGridStructure(calendar, {
        [DAY_1]: ['b'],
        [DAY_2]: [],
      }, ['a', 'b'], datesAboveResources)
      expect(timeGrid.getEventEls().length).toBe(1)

      calendar.getEventById('a-event').setStart(DAY_1 + 'T06:30:00')

      expectTimeGridStructure(calendar, {
        [DAY_1]: ['a', 'b'],
        [DAY_2]: [],
      }, ['a', 'b'], datesAboveResources)
      expect(timeGrid.getEventEls().length).toBe(2)
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

    it('does not count an all-day event within the previous date\'s extended slotMaxTime', () => {
      let calendar = initCalendar({
        slotMaxTime: '30:00',
        resources: [{ id: 'a', title: 'Resource A' }],
        events: [{ title: 'All day 2', start: DAY_2, resourceId: 'a' }],
      })
      let viewWrapper = new ResourceTimeGridViewWrapper(calendar)

      expectTimeGridStructure(calendar, {
        [DAY_1]: [],
        [DAY_2]: ['a'],
      }, ['a'], datesAboveResources)
      expect(viewWrapper.timeGrid.getEventEls().length).toBe(0)
      expect(new CalendarWrapper(calendar).getEventEls().length).toBe(1)
    })

    it('omits a date disabled by validRange even when it has events', () => {
      let calendar = initCalendar({
        validRange: { end: DAY_2 },
        resources: [
          { id: 'a', title: 'Resource A' },
          { id: 'b', title: 'Resource B' },
        ],
        events: [
          { title: 'A day 1', start: DAY_1 + 'T09:00:00', resourceId: 'a' },
          { title: 'B day 2', start: DAY_2 + 'T09:00:00', resourceId: 'b' },
        ],
      })

      expectTimeGridStructure(calendar, {
        [DAY_1]: ['a'],
        [DAY_2]: [],
      }, ['a', 'b'], datesAboveResources)
      expect(new ResourceTimeGridViewWrapper(calendar).timeGrid.getEventEls().length).toBe(1)
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

    it('omits a date when no resource has events', () => {
      let calendar = initCalendar({
        resources: [{ id: 'a', title: 'Resource A' }],
        events: [{ title: 'Day 1 only', start: DAY_1 + 'T09:00:00', resourceId: 'a' }],
      })
      let viewWrapper = new ResourceTimeGridViewWrapper(calendar)

      expectTimeGridStructure(calendar, {
        [DAY_1]: ['a'],
        [DAY_2]: [],
      }, ['a'], datesAboveResources)
      expect(viewWrapper.header.getCellInfoByRow().some((row) => (
        row.some((cell) => cell.date === DAY_2)
      ))).toBe(false)
      expect(viewWrapper.timeGrid.getColumnInfo().some((column) => column.date === DAY_2)).toBe(false)
    })

    it('invokes resource header rendering only for real resources', () => {
      let resourceDayHeaderContent = jasmine.createSpy('resourceDayHeaderContent').and.callFake((arg) => arg.resource.title)
      let calendar = initCalendar({
        resources: [{ id: 'a', title: 'Resource A' }],
        events: [{ title: 'Day 1 only', start: DAY_1 + 'T09:00:00', resourceId: 'a' }],
        resourceDayHeaderContent,
      })
      let header = new ResourceTimeGridViewWrapper(calendar).header
      let resourceHeaderArgs = resourceDayHeaderContent.calls.allArgs().map((args) => args[0])

      expect(resourceDayHeaderContent.calls.count()).toBe(1)
      expect(resourceHeaderArgs[0].resource.id).toBe('a')
      expect(header.getCellInfoByRow().some((row) => (
        row.some((cell) => cell.date === DAY_2)
      ))).toBe(false)
    })

    it('renders all dates as plain day columns when no resource has events', () => {
      let resourceDayHeaderContent = jasmine.createSpy('resourceDayHeaderContent')
      let dayHeaderContent = jasmine.createSpy('dayHeaderContent').and.callFake((arg) => arg.text)
      let calendar = initCalendar({
        resources: [{ id: 'a', title: 'Resource A' }],
        events: [],
        resourceDayHeaderContent,
        dayHeaderContent,
      })
      let viewWrapper = new ResourceTimeGridViewWrapper(calendar)
      let plainColumns = DATES.map((date) => ({ date, resourceId: null }))
      let dayHeaderArgs = dayHeaderContent.calls.allArgs().map((args) => args[0])

      expect(viewWrapper.header.getCellInfoByRow()).toEqual([
        plainColumns.map((column) => ({ ...column, colSpan: 1 })),
      ])
      expect(viewWrapper.timeGrid.getColumnInfo()).toEqual(plainColumns)
      expect(viewWrapper.header.getResourceIds()).toEqual([])
      expect(resourceDayHeaderContent.calls.count()).toBe(0)
      expect(dayHeaderContent.calls.count()).toBe(2)
      expect(dayHeaderArgs.every((arg) => arg.resource === undefined)).toBe(true)
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

  // view-wide filtering asks only whether an event falls within the view's overall range. it
  // deliberately ignores invisible periods inside that range, so a resource whose only event
  // sits outside the slot window is still shown — with an empty column
  it('keeps a single-day resource whose only event is before slotMinTime', () => {
    let calendar = initCalendar({
      initialView: 'resourceTimeGridDay',
      slotMinTime: '06:00',
      resources: [{ id: 'a', title: 'Resource A' }],
      events: [{ title: 'Before slots', start: DAY_1 + 'T02:00:00', resourceId: 'a' }],
    })
    let viewWrapper = new ResourceTimeGridViewWrapper(calendar)

    expect(viewWrapper.header.getResourceIds()).toEqual(['a'])
    expect(viewWrapper.timeGrid.getColumnInfo()).toEqual([{
      date: DAY_1,
      resourceId: 'a',
    }])
    expect(viewWrapper.timeGrid.getEventEls().length).toBe(0)
  })

  it('keeps nav links on every filtered resource-major date header', () => {
    let calendar = initCalendar({
      datesAboveResources: false,
      navLinks: true,
      resources: [
        { id: 'a', title: 'Resource A' },
        { id: 'b', title: 'Resource B' },
      ],
      events: [
        { title: 'A day 1', start: DAY_1 + 'T09:00:00', resourceId: 'a' },
        { title: 'B day 2', start: DAY_2 + 'T09:00:00', resourceId: 'b' },
      ],
    })
    let dateRow = new ResourceTimeGridViewWrapper(calendar).header.getCellElsByRow()[1]

    expect(dateRow.length).toBe(2)
    for (let cellEl of dateRow) {
      expect(cellEl.querySelector('.fc-navlink')).toBeTruthy()
    }
  })

  it('keeps a nav link when only one date-major date survives', () => {
    let calendar = initCalendar({
      datesAboveResources: true,
      navLinks: true,
      resources: [{ id: 'a', title: 'Resource A' }],
      events: [
        { title: 'A day 1', start: DAY_1 + 'T09:00:00', resourceId: 'a' },
      ],
    })
    let dateRow = new ResourceTimeGridViewWrapper(calendar).header.getCellElsByRow()[0]

    expect(dateRow.length).toBe(1)
    expect(dateRow[0].querySelector('.fc-navlink')).toBeTruthy()
  })

  it('allows a selection across a fully-omitted date', async () => {
    let selectInfo = null
    let calendar = initCalendar({
      initialView: 'resourceTimeGridThreeDay',
      datesAboveResources: false,
      selectable: true,
      views: {
        resourceTimeGridThreeDay: {
          type: 'resourceTimeGrid',
          duration: { days: 3 },
        },
      },
      resources: [{ id: 'a', title: 'Resource A' }],
      events: [
        { title: 'Day 1', start: DAY_1 + 'T09:00:00', resourceId: 'a' },
        { title: 'Day 3', start: DAY_3 + 'T09:00:00', resourceId: 'a' },
      ],
      select(info) {
        selectInfo = info
      },
    })

    await waitTimeout()
    let timeGrid = new ResourceTimeGridViewWrapper(calendar).timeGrid

    await new Promise<void>((resolve) => {
      $.simulateByPoint('drag', {
        // early-morning times keep the points within the scrollTime:'00:00' viewport
        point: timeGrid.getPoint('a', DAY_1 + 'T02:00:00'),
        end: timeGrid.getPoint('a', DAY_3 + 'T04:00:00'),
        callback() {
          resolve()
        },
      })
    })

    expect(selectInfo).toBeTruthy()
    expect(selectInfo.resource.id).toBe('a')
    expect(selectInfo.start).toEqualDate(DAY_1 + 'T02:00:00Z')
    expect(selectInfo.end.toISOString().slice(0, 10)).toBe(DAY_3) // spans the omitted day 2
  })

  it('allows a selection across a date rendered without the resource', async () => {
    let selectInfo = null
    let calendar = initCalendar({
      initialView: 'resourceTimeGridThreeDay',
      datesAboveResources: false,
      selectable: true,
      views: {
        resourceTimeGridThreeDay: {
          type: 'resourceTimeGrid',
          duration: { days: 3 },
        },
      },
      resources: [
        { id: 'a', title: 'Resource A' },
        { id: 'b', title: 'Resource B' },
      ],
      events: [
        { title: 'A day 1', start: DAY_1 + 'T09:00:00', resourceId: 'a' },
        { title: 'B day 2', start: DAY_2 + 'T09:00:00', resourceId: 'b' },
        { title: 'A day 3', start: DAY_3 + 'T09:00:00', resourceId: 'a' },
      ],
      select(info) {
        selectInfo = info
      },
    })

    await waitTimeout()
    let timeGrid = new ResourceTimeGridViewWrapper(calendar).timeGrid

    await new Promise<void>((resolve) => {
      $.simulateByPoint('drag', {
        // early-morning times keep the points within the scrollTime:'00:00' viewport
        point: timeGrid.getPoint('a', DAY_1 + 'T02:00:00'),
        end: timeGrid.getPoint('a', DAY_3 + 'T04:00:00'),
        callback() {
          resolve()
        },
      })
    })

    expect(selectInfo).toBeTruthy()
    expect(selectInfo.resource.id).toBe('a')
    expect(selectInfo.start).toEqualDate(DAY_1 + 'T02:00:00Z')
    expect(selectInfo.end.toISOString().slice(0, 10)).toBe(DAY_3) // spans day 2, where A has no column
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

      it('falls back to plain day columns when the only event ends before nextDayThreshold', () => {
        let calendar = initCalendar({
          nextDayThreshold: '09:00:00',
          resources: [{ id: 'a', title: 'Resource A' }],
          events: [{
            title: 'Overnight tail',
            start: '2016-12-03T22:00:00', // day before the view
            end: DAY_1 + 'T02:00:00', // within day 1, but before nextDayThreshold
            resourceId: 'a',
          }],
        })
        let viewWrapper = new ResourceDayGridViewWrapper(calendar)

        expect(viewWrapper.header.getResourceIds()).toEqual([])
        expect(viewWrapper.dayGrid.getCellInfo()).toEqual([
          { date: DAY_1, resourceId: null },
          { date: DAY_2, resourceId: null },
        ])
        expect(new CalendarWrapper(calendar).getEventEls().length).toBe(0)
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

    it('allows selections in later weeks of a multi-row month view', async () => {
      let selectInfo = null
      let calendar = initCalendar({
        initialView: 'resourceDayGridMonth',
        selectable: true,
        resources: [
          { id: 'a', title: 'Resource A' },
          { id: 'b', title: 'Resource B' },
        ],
        events: [
          { title: 'A first week', start: DAY_1, resourceId: 'a' },
          { title: 'B second week', start: '2016-12-12', resourceId: 'b' },
        ],
        select(info) {
          selectInfo = info
        },
      })

      await ignoreResizeObserverLoops(async () => {
        await waitTimeout()
        let dayGrid = new ResourceDayGridViewWrapper(calendar).dayGrid
        let startEl = dayGrid.getDayEl('a', '2016-12-12')
        let endEl = dayGrid.getDayEl('a', '2016-12-13')

        await new Promise<void>((resolve) => {
          $(startEl).simulate('drag', {
            point: getElCenter(startEl),
            end: getElCenter(endEl),
            onRelease: () => resolve(),
          })
        })
        await waitTimeout()
      })

      expect(selectInfo).toBeTruthy()
      expect(selectInfo.resource.id).toBe('a')
      expect(selectInfo.start).toEqualDate('2016-12-12')
      expect(selectInfo.end).toEqualDate('2016-12-14')
    })
  })
})

function getElCenter(el: Element) {
  let rect = el.getBoundingClientRect()

  return {
    left: (rect.left + rect.right) / 2,
    top: (rect.top + rect.bottom) / 2,
  }
}
