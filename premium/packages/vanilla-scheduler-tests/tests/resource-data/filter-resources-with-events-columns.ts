import { describe, expect, it, vi } from 'vitest'
import { Calendar } from 'fullcalendar'
import { strictModeFactor } from 'fullcalendar/protected-api'
import { initCalendar } from '@fullcalendar-tests/standard/tests/lib/calendar'
import { getEventEls, queryPart, queryParts } from '@fullcalendar-tests/standard/tests/lib/models/events'
import { DayGridModel } from '@fullcalendar-tests/standard/tests/lib/models/day-grid'
import { TimeGridModel } from '@fullcalendar-tests/standard/tests/lib/models/time-grid'
import { waitForSettle } from '@fullcalendar-tests/standard/tests/lib/settle'
import { ResourceColumnsModel } from '../lib/models/resource-columns'
import {
  buildExpectedColumns,
  buildExpectedHeaderRows,
  expectHeaderRowsAlign,
  ResourceIdsByDate,
} from '../lib/filter-resources-with-events'

/*
filterResourcesWithEvents in multi-day resource column views: each date gets only the resources
with events on that date. (With dates above resources, a date without any gets a placeholder column:
see filter-resources-with-events-placeholders.ts.)
*/
describe('filterResourcesWithEvents per date', () => {
  const DAY_1 = '2016-12-04'
  const DAY_2 = '2016-12-05'
  const DAY_3 = '2016-12-06'
  const DATES = [DAY_1, DAY_2]

  const options = {
    initialDate: DAY_1,
    initialView: 'resourceTimeGridTwoDay',
    now: DAY_1,
    scrollTime: '00:00',
    filterResourcesWithEvents: true,
    views: {
      resourceTimeGridTwoDay: { type: 'resourceTimeGrid', duration: { days: 2 } },
      resourceTimeGridThreeDay: { type: 'resourceTimeGrid', duration: { days: 3 } },
      resourceDayGridTwoDay: { type: 'resourceDayGrid', duration: { days: 2 } },
    },
  }
  const resourcesAB = [
    { id: 'a', title: 'Resource A' },
    { id: 'b', title: 'Resource B' },
  ]
  const resourceA = [{ id: 'a', title: 'Resource A' }]

  function getTimeGridEventCount(calendar: Calendar): number {
    return new TimeGridModel(calendar.el).getEventEls().length
  }

  describe.each([
    ['resources above dates', false],
    ['dates above resources', true],
  ])('with %s', (_desc, datesAboveResources) => {
    function initTimeGrid(calendarOptions: object): Calendar {
      return initCalendar({ ...options, datesAboveResources, ...calendarOptions })
    }

    function expectTimeGridStructure(calendar: Calendar, resourceIdsByDate: ResourceIdsByDate, resourceOrder: string[]) {
      const columns = new ResourceColumnsModel(calendar.el)

      expect(columns.getHeaderCellInfoByRow()).toEqual(
        buildExpectedHeaderRows(DATES, resourceIdsByDate, resourceOrder, datesAboveResources),
      )
      expect(columns.getDayLaneColumns()).toEqual(
        buildExpectedColumns(DATES, resourceIdsByDate, resourceOrder, datesAboveResources),
      )
    }

    it('filters each date\'s headers and body columns', () => {
      const calendar = initTimeGrid({
        resources: resourcesAB,
        events: [
          { title: 'A day 1', start: DAY_1 + 'T09:00:00', resourceId: 'a' },
          { title: 'B day 1', start: DAY_1 + 'T10:00:00', resourceId: 'b' },
          { title: 'B day 2', start: DAY_2 + 'T10:00:00', resourceId: 'b' },
        ],
      })

      expectTimeGridStructure(calendar, { [DAY_1]: ['a', 'b'], [DAY_2]: ['b'] }, ['a', 'b'])
      expect(getTimeGridEventCount(calendar)).toBe(3)
    })

    it('sizes ragged header cells to the columns they span', async () => {
      const calendar = initTimeGrid({
        resources: resourcesAB,
        events: [
          // day 1 has both resources, day 2 only B, so one header cell spans two columns, the other one
          { title: 'A day 1', start: DAY_1 + 'T09:00:00', resourceId: 'a' },
          { title: 'B day 1', start: DAY_1 + 'T10:00:00', resourceId: 'b' },
          { title: 'B day 2', start: DAY_2 + 'T10:00:00', resourceId: 'b' },
        ],
      })
      await waitForSettle()

      expectHeaderRowsAlign(new ResourceColumnsModel(calendar.el))
    })

    // resource A stays in the view-wide set (its event is in the overall range), but no column's
    // rendered range contains its event, so it gets no column
    it('gives no column to an event outside every column\'s slotMinTime window', () => {
      const calendar = initTimeGrid({
        slotMinTime: '06:00',
        resources: resourcesAB,
        events: [
          { id: 'a-event', title: 'A before slots', start: DAY_1 + 'T02:00:00', resourceId: 'a' },
          { title: 'B in slots', start: DAY_1 + 'T07:00:00', resourceId: 'b' },
        ],
      })

      expectTimeGridStructure(calendar, { [DAY_1]: ['b'], [DAY_2]: [] }, ['a', 'b'])
      expect(getTimeGridEventCount(calendar)).toBe(1)

      calendar.getEventById('a-event')!.setStart(DAY_1 + 'T06:30:00')

      expectTimeGridStructure(calendar, { [DAY_1]: ['a', 'b'], [DAY_2]: [] }, ['a', 'b'])
      expect(getTimeGridEventCount(calendar)).toBe(2)
    })

    it('keeps the full layout when off', () => {
      const calendar = initTimeGrid({ filterResourcesWithEvents: false, resources: resourcesAB })

      expectTimeGridStructure(calendar, { [DAY_1]: ['a', 'b'], [DAY_2]: ['a', 'b'] }, ['a', 'b'])
    })

    it('counts an all-day event, keeping the all-day and timed columns aligned', () => {
      const calendar = initTimeGrid({
        resources: resourceA,
        events: [{ title: 'All day', start: DAY_1, resourceId: 'a' }],
      })
      const resourceIdsByDate = { [DAY_1]: ['a'], [DAY_2]: [] }

      expectTimeGridStructure(calendar, resourceIdsByDate, ['a'])
      expect(new ResourceColumnsModel(calendar.el).getDayCellColumns()).toEqual(
        buildExpectedColumns(DATES, resourceIdsByDate, ['a'], datesAboveResources),
      )
      expect(getTimeGridEventCount(calendar)).toBe(0)
      expect(getEventEls(calendar.el)).toHaveLength(1)
    })

    it.each([
      ['counts a timed event on both dates when it spans midnight', { start: DAY_1 + 'T22:00:00', end: DAY_2 + 'T02:00:00' }, {}, ['a'], ['a'], 2],
      ['doesn\'t count an exclusive midnight end on the next date', { start: DAY_1 + 'T22:00:00', end: DAY_2 + 'T00:00:00' }, {}, ['a'], [], 1],
      // with slotMaxTime past 24h, day 1's column also shows early day 2
      ['uses extended slotMaxTime ranges for both intersecting dates', { start: DAY_2 + 'T02:00:00', end: DAY_2 + 'T03:00:00' }, { slotMaxTime: '30:00' }, ['a'], ['a'], 2],
      ['counts background events', { start: DAY_1 + 'T09:00:00', end: DAY_1 + 'T10:00:00', display: 'background' }, {}, ['a'], [], 0],
    ])('%s', (_desc, eventProps, calendarOptions, day1Ids, day2Ids, timedEventCount) => {
      const calendar = initTimeGrid({
        ...calendarOptions,
        resources: resourceA,
        events: [{ id: '1', title: 'Event', resourceId: 'a', ...eventProps }],
      })

      expectTimeGridStructure(calendar, { [DAY_1]: day1Ids, [DAY_2]: day2Ids }, ['a'])
      expect(getTimeGridEventCount(calendar)).toBe(timedEventCount)
    })

    it('renders a counted background event', () => {
      const calendar = initTimeGrid({
        resources: resourceA,
        events: [{ start: DAY_1 + 'T09:00:00', end: DAY_1 + 'T10:00:00', resourceId: 'a', display: 'background' }],
      })

      expect(queryParts(calendar.el, 'backgroundEvent')).toHaveLength(1)
    })

    it('doesn\'t count an all-day event within the previous date\'s extended slotMaxTime', () => {
      const calendar = initTimeGrid({
        slotMaxTime: '30:00',
        resources: resourceA,
        events: [{ title: 'All day 2', start: DAY_2, resourceId: 'a' }],
      })

      expectTimeGridStructure(calendar, { [DAY_1]: [], [DAY_2]: ['a'] }, ['a'])
      expect(getTimeGridEventCount(calendar)).toBe(0)
      expect(getEventEls(calendar.el)).toHaveLength(1)
    })

    it('gives no resource columns to a date disabled by validRange, even with events', () => {
      const calendar = initTimeGrid({
        validRange: { end: DAY_2 },
        resources: resourcesAB,
        events: [
          { title: 'A day 1', start: DAY_1 + 'T09:00:00', resourceId: 'a' },
          { title: 'B day 2', start: DAY_2 + 'T09:00:00', resourceId: 'b' },
        ],
      })
      const columns = new ResourceColumnsModel(calendar.el)

      expect(columns.getHeaderCellInfoByRow()).toEqual(
        buildExpectedHeaderRows(DATES, { [DAY_1]: ['a'], [DAY_2]: [] }, ['a', 'b'], datesAboveResources),
      )
      // with dates above resources, day 2 is a placeholder. disabled lanes have no data-date, so
      // either way only A's day-1 column is listed
      expect(columns.getDayLaneColumns()).toEqual([{ date: DAY_1, resourceId: 'a' }])
      expect(getTimeGridEventCount(calendar)).toBe(1)
    })

    it('counts every resource of a multi-resource event', () => {
      const calendar = initTimeGrid({
        resources: resourcesAB,
        events: [{ title: 'Shared', start: DAY_1 + 'T09:00:00', resourceIds: ['a', 'b'] }],
      })

      expectTimeGridStructure(calendar, { [DAY_1]: ['a', 'b'], [DAY_2]: [] }, ['a', 'b'])
      expect(getTimeGridEventCount(calendar)).toBe(2)
    })

    it('counts recurring instances only on their dates', () => {
      const calendar = initTimeGrid({
        resources: resourceA,
        events: [{
          title: 'Monday only',
          daysOfWeek: [1],
          startTime: '09:00',
          endTime: '10:00',
          startRecur: DAY_1,
          endRecur: DAY_3,
          resourceId: 'a',
        }],
      })

      expectTimeGridStructure(calendar, { [DAY_1]: [], [DAY_2]: ['a'] }, ['a'])
      expect(getTimeGridEventCount(calendar)).toBe(1)
    })

    it('counts a child\'s events for its ancestors, per date', () => {
      const calendar = initTimeGrid({
        resources: [{ id: 'parent', title: 'Parent', children: [{ id: 'child', title: 'Child' }] }],
        events: [{ title: 'Child event', start: DAY_1 + 'T09:00:00', resourceId: 'child' }],
      })

      expectTimeGridStructure(calendar, { [DAY_1]: ['parent', 'child'], [DAY_2]: [] }, ['parent', 'child'])
      expect(getTimeGridEventCount(calendar)).toBe(1)
    })

    it('renders resource headers only for resources with columns', () => {
      const resourceDayHeaderContent = vi.fn((info) => info.resource.title)
      initTimeGrid({
        resources: resourceA,
        events: [{ title: 'Day 1 only', start: DAY_1 + 'T09:00:00', resourceId: 'a' }],
        resourceDayHeaderContent,
      })

      expect(resourceDayHeaderContent).toHaveBeenCalledTimes(1 * strictModeFactor)
      expect(resourceDayHeaderContent.mock.calls[0][0].resource.id).toBe('a')
    })

    it('renders plain day columns when no resource has events', () => {
      const resourceDayHeaderContent = vi.fn()
      const dayHeaderContent = vi.fn((info) => info.text)
      const calendar = initTimeGrid({
        resources: resourceA,
        events: [],
        resourceDayHeaderContent,
        dayHeaderContent,
      })
      const columns = new ResourceColumnsModel(calendar.el)
      const plainColumns = DATES.map((date) => ({ date, resourceId: null }))

      expect(columns.getHeaderCellInfoByRow()).toEqual([
        plainColumns.map((column) => ({ ...column, colSpan: 1 })),
      ])
      expect(columns.getDayLaneColumns()).toEqual(plainColumns)
      expect(columns.getResourceHeaderIds()).toEqual([])
      expect(resourceDayHeaderContent).not.toHaveBeenCalled()
      expect(dayHeaderContent).toHaveBeenCalledTimes(2 * strictModeFactor)
      expect(dayHeaderContent.mock.calls.every(([info]) => info.resource === undefined)).toBe(true)
    })

    it('reports a dateClick in a filtered column', async () => {
      const dateClick = vi.fn()
      const calendar = initTimeGrid({
        resources: resourcesAB,
        events: [
          { title: 'A day 1', start: DAY_1 + 'T09:00:00', resourceId: 'a' },
          { title: 'B day 2', start: DAY_2 + 'T10:00:00', resourceId: 'b' },
        ],
        dateClick,
      })
      await waitForSettle()

      await new TimeGridModel(calendar.el).clickDateTime({ date: DAY_2 + 'T09:00', resourceId: 'b' })

      expect(dateClick).toHaveBeenCalledTimes(1)
      expect(dateClick.mock.calls[0][0].dateStr).toBe(DAY_2 + 'T09:00:00Z')
      expect(dateClick.mock.calls[0][0].resource.id).toBe('b')
    })
  })

  // view-wide filtering only asks whether an event is in the view's overall range. it ignores
  // hidden times within it, so a resource whose only event is before slotMinTime still gets an
  // (empty) column
  it('keeps a single-day resource whose only event is before slotMinTime', () => {
    const calendar = initCalendar({
      ...options,
      initialView: 'resourceTimeGridDay',
      slotMinTime: '06:00',
      resources: resourceA,
      events: [{ title: 'Before slots', start: DAY_1 + 'T02:00:00', resourceId: 'a' }],
    })
    const columns = new ResourceColumnsModel(calendar.el)

    expect(columns.getResourceHeaderIds()).toEqual(['a'])
    expect(columns.getDayLaneColumns()).toEqual([{ date: DAY_1, resourceId: 'a' }])
    expect(getTimeGridEventCount(calendar)).toBe(0)
  })

  const eventADay1 = { title: 'A day 1', start: DAY_1 + 'T09:00:00', resourceId: 'a' }

  it.each([
    // with resources above dates, the date cells are in the second row
    ['resource-major', false, resourcesAB, [eventADay1, { title: 'B day 2', start: DAY_2 + 'T09:00:00', resourceId: 'b' }], 1],
    // with dates above resources, a date with no resources keeps its header
    ['date-major', true, resourceA, [eventADay1], 0],
  ])('keeps nav links on every filtered %s date header', (_desc, datesAboveResources, resources, events, rowIndex) => {
    const calendar = initCalendar({ ...options, datesAboveResources, navLinks: true, resources, events })
    const dateRow = new ResourceColumnsModel(calendar.el).getHeaderCellElsByRow()[rowIndex]

    expect(dateRow.map((cellEl) => cellEl.getAttribute('data-date'))).toEqual([DAY_1, DAY_2])
    for (const cellEl of dateRow) {
      expect(queryPart(cellEl, 'navLink')).not.toBeNull()
    }
  })

  // with resources above dates, a date belongs to resource groups, so a date where no resource has
  // events has nowhere to render
  it('omits a date with no events when resources are above dates', () => {
    const calendar = initCalendar({
      ...options,
      datesAboveResources: false,
      resources: resourceA,
      events: [{ title: 'Day 1 only', start: DAY_1 + 'T09:00:00', resourceId: 'a' }],
    })
    const columns = new ResourceColumnsModel(calendar.el)

    expect(columns.getHeaderCellInfoByRow().flat().map((cell) => cell.date)).toEqual([null, DAY_1])
    expect(columns.getDayLaneColumns()).toEqual([{ date: DAY_1, resourceId: 'a' }])
  })

  it.each([
    ['a fully omitted date', resourceA, []],
    ['a date rendered without the resource', resourcesAB, [{ title: 'B day 2', start: DAY_2 + 'T09:00:00', resourceId: 'b' }]],
  ])('allows a selection across %s', async (_desc, resources, otherEvents) => {
    const select = vi.fn()
    const calendar = initCalendar({
      ...options,
      initialView: 'resourceTimeGridThreeDay',
      datesAboveResources: false,
      selectable: true,
      resources,
      events: [
        { title: 'A day 1', start: DAY_1 + 'T09:00:00', resourceId: 'a' },
        { title: 'A day 3', start: DAY_3 + 'T09:00:00', resourceId: 'a' },
        ...otherEvents,
      ],
      select,
    })
    await waitForSettle()
    const columns = new ResourceColumnsModel(calendar.el)
    expect(columns.getDayLaneColumns().filter((column) => column.resourceId === 'a').map((column) => column.date))
      .toEqual([DAY_1, DAY_3])

    await new TimeGridModel(calendar.el).selectRange(
      { date: DAY_1 + 'T02:00', resourceId: 'a' },
      { date: DAY_3 + 'T04:00', resourceId: 'a' },
    )

    expect(select).toHaveBeenCalledTimes(1)
    const info = select.mock.calls[0][0]
    expect(info.resource.id).toBe('a')
    expect(info.startStr).toBe(DAY_1 + 'T02:00:00Z')
    expect(info.endStr).toBe(DAY_3 + 'T04:00:00Z')
  })

  describe('in resource dayGrid', () => {
    const dayGridOptions = { ...options, initialView: 'resourceDayGridTwoDay' }

    describe.each([
      ['resources above dates', false],
      ['dates above resources', true],
    ])('with %s', (_desc, datesAboveResources) => {
      it('filters a single-row multi-day view per date', () => {
        const calendar = initCalendar({
          ...dayGridOptions,
          datesAboveResources,
          resources: resourcesAB,
          events: [
            { title: 'A day 1', start: DAY_1, resourceId: 'a' },
            { title: 'B day 1', start: DAY_1, resourceId: 'b' },
            { title: 'B day 2', start: DAY_2, resourceId: 'b' },
          ],
        })
        const columns = new ResourceColumnsModel(calendar.el)
        const resourceIdsByDate = { [DAY_1]: ['a', 'b'], [DAY_2]: ['b'] }

        expect(columns.getHeaderCellInfoByRow()).toEqual(
          buildExpectedHeaderRows(DATES, resourceIdsByDate, ['a', 'b'], datesAboveResources),
        )
        expect(columns.getDayCellColumns()).toEqual(
          buildExpectedColumns(DATES, resourceIdsByDate, ['a', 'b'], datesAboveResources),
        )
        expect(getEventEls(calendar.el)).toHaveLength(3)
      })

      it('falls back to plain day columns when the only event ends before nextDayThreshold', () => {
        const calendar = initCalendar({
          ...dayGridOptions,
          datesAboveResources,
          nextDayThreshold: '09:00:00',
          resources: resourceA,
          events: [{
            title: 'Overnight tail',
            start: '2016-12-03T22:00:00', // the day before the view
            end: DAY_1 + 'T02:00:00', // in day 1, but before nextDayThreshold
            resourceId: 'a',
          }],
        })
        const columns = new ResourceColumnsModel(calendar.el)

        expect(columns.getResourceHeaderIds()).toEqual([])
        expect(columns.getDayCellColumns()).toEqual([
          { date: DAY_1, resourceId: null },
          { date: DAY_2, resourceId: null },
        ])
        expect(getEventEls(calendar.el)).toHaveLength(0)
      })
    })

    const monthOptions = {
      ...dayGridOptions,
      initialView: 'resourceDayGridMonth',
      resources: resourcesAB,
      events: [
        { title: 'A first week', start: DAY_1, resourceId: 'a' },
        { title: 'B second week', start: '2016-12-12', resourceId: 'b' },
      ],
    }

    it('keeps view-wide resource columns in a multi-row month view', () => {
      const calendar = initCalendar(monthOptions)
      const resourceIdsByDate: { [date: string]: (string | null)[] } = {}

      for (const cell of new ResourceColumnsModel(calendar.el).getDayCellColumns()) {
        (resourceIdsByDate[cell.date] ||= []).push(cell.resourceId)
      }

      expect(Object.keys(resourceIdsByDate)).toHaveLength(42)
      for (const date in resourceIdsByDate) {
        expect(resourceIdsByDate[date]).toEqual(['a', 'b'])
      }
      expect(getEventEls(calendar.el)).toHaveLength(2)
    })

    it('allows selections in later weeks of a multi-row month view', async () => {
      const select = vi.fn()
      const calendar = initCalendar({ ...monthOptions, selectable: true, select })
      await waitForSettle()

      await new DayGridModel(calendar.el).selectDates(
        { date: '2016-12-12', resourceId: 'a' },
        { date: '2016-12-13', resourceId: 'a' },
      )

      expect(select).toHaveBeenCalledTimes(1)
      const info = select.mock.calls[0][0]
      expect(info.resource.id).toBe('a')
      expect(info.startStr).toBe('2016-12-12')
      expect(info.endStr).toBe('2016-12-14')
    })
  })
})
