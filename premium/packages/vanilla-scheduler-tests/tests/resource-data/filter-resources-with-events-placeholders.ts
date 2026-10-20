import { describe, expect, it, vi } from 'vitest'
import { Calendar } from 'fullcalendar'
import { strictModeFactor } from 'fullcalendar/protected-api'
import { initCalendar } from '@fullcalendar-tests/standard/tests/lib/calendar'
import { queryPart, queryParts } from '@fullcalendar-tests/standard/tests/lib/models/events'
import { TimeGridModel } from '@fullcalendar-tests/standard/tests/lib/models/time-grid'
import { getRectCenter, pointer, Point } from '@fullcalendar-tests/standard/tests/lib/pointer'
import { waitForSettle } from '@fullcalendar-tests/standard/tests/lib/settle'
import { ResourceColumnsModel } from '../lib/models/resource-columns'
import { buildIsMajorByColumn, expectHeaderRowsAlign } from '../lib/filter-resources-with-events'

/*
With filterResourcesWithEvents and datesAboveResources, a date where no resource has events keeps its
date header and renders one placeholder column with no resource (#8099). The placeholder is inert,
but non-resource things (business hours, background events, the now indicator) still paint it, like
a resource timeline's non-resource background spans every row.
https://github.com/fullcalendar/fullcalendar/issues/8099
*/
describe('filterResourcesWithEvents placeholder columns', () => {
  const DAY_1 = '2016-12-04' // Sunday
  const DAY_2 = '2016-12-05' // Monday
  const DAY_3 = '2016-12-06' // Tuesday

  const options = {
    initialDate: DAY_1,
    initialView: 'resourceTimeGridThreeDay',
    now: DAY_1,
    scrollTime: '00:00',
    datesAboveResources: true,
    filterResourcesWithEvents: true,
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
    ],
    views: {
      resourceTimeGridThreeDay: { type: 'resourceTimeGrid', duration: { days: 3 } },
      resourceDayGridThreeDay: { type: 'resourceDayGrid', duration: { days: 3 } },
    },
  }

  // resource A on days 1 and 3, nothing on day 2
  const A_AROUND_DAY_2 = [
    { id: 'a1', title: 'A day 1', start: DAY_1 + 'T02:00:00', end: DAY_1 + 'T03:00:00', resourceId: 'a' },
    { id: 'a3', title: 'A day 3', start: DAY_3 + 'T02:00:00', end: DAY_3 + 'T03:00:00', resourceId: 'a' },
  ]

  function getPlaceholderLaneEl(calendar: Calendar, date: string): HTMLElement {
    return new ResourceColumnsModel(calendar.el).getDayLaneEl(date, null)
  }

  // a resource dayGrid cell, or a resource timeGrid all-day cell
  function getPlaceholderDayCellEl(calendar: Calendar, date: string): HTMLElement {
    return new ResourceColumnsModel(calendar.el).getDayCellEl(date, null)
  }

  /*
  The point in a lane, in the middle of the slot that starts at the time (HH:mm). The slots span
  every lane, so they give the y.
  */
  function pointInLane(calendar: Calendar, laneEl: HTMLElement, time: string): Point {
    const slotEl = queryParts(calendar.el, 'slotLane').find((el) => el.getAttribute('data-time') === time + ':00')!
    const slotRect = slotEl.getBoundingClientRect()
    const laneRect = laneEl.getBoundingClientRect()
    return { x: laneRect.left + laneRect.width / 2, y: slotRect.top + slotRect.height / 2 }
  }

  async function dragPointer(from: Point, to: Point): Promise<void> {
    await pointer.press(from, async () => {
      await pointer.move(to)
      await waitForSettle()
    })
    await waitForSettle()
  }

  async function clickPoint(point: Point): Promise<void> {
    await pointer.click(point)
    await waitForSettle()
  }

  describe('in resource timeGrid', () => {
    describe('structure', () => {
      it('keeps the date header and renders one resource-less column per empty date', () => {
        const calendar = initCalendar({
          ...options,
          events: [
            { title: 'A day 1', start: DAY_1 + 'T02:00:00', resourceId: 'a' },
            { title: 'B day 1', start: DAY_1 + 'T02:00:00', resourceId: 'b' },
          ],
        })
        const columns = new ResourceColumnsModel(calendar.el)

        // consecutive empty dates stay separate columns, one per date
        expect(columns.getHeaderCellInfoByRow()).toEqual([
          [
            { date: DAY_1, resourceId: null, colSpan: 2 },
            { date: DAY_2, resourceId: null, colSpan: 1 },
            { date: DAY_3, resourceId: null, colSpan: 1 },
          ],
          [
            { date: DAY_1, resourceId: 'a', colSpan: 1 },
            { date: DAY_1, resourceId: 'b', colSpan: 1 },
            { date: DAY_2, resourceId: null, colSpan: 1 },
            { date: DAY_3, resourceId: null, colSpan: 1 },
          ],
        ])
        expect(columns.getDayLaneColumns()).toEqual([
          { date: DAY_1, resourceId: 'a' },
          { date: DAY_1, resourceId: 'b' },
          { date: DAY_2, resourceId: null },
          { date: DAY_3, resourceId: null },
        ])
        expect(columns.getResourceHeaderIds()).toEqual(['a', 'b'])
      })

      it('aligns header cells with placeholder columns at both edges', async () => {
        const calendar = initCalendar({
          ...options,
          events: [
            { title: 'A day 2', start: DAY_2 + 'T02:00:00', resourceId: 'a' },
            { title: 'B day 2', start: DAY_2 + 'T02:00:00', resourceId: 'b' },
          ],
        })
        await waitForSettle()
        const columns = new ResourceColumnsModel(calendar.el)

        expect(columns.getHeaderCellInfoByRow()[1]).toEqual([
          { date: DAY_1, resourceId: null, colSpan: 1 },
          { date: DAY_2, resourceId: 'a', colSpan: 1 },
          { date: DAY_2, resourceId: 'b', colSpan: 1 },
          { date: DAY_3, resourceId: null, colSpan: 1 },
        ])
        expectHeaderRowsAlign(columns)
      })

      it('keeps a nav link on the date header of an empty date', () => {
        const calendar = initCalendar({ ...options, navLinks: true, events: A_AROUND_DAY_2 })
        const dateRow = new ResourceColumnsModel(calendar.el).getHeaderCellElsByRow()[0]

        expect(dateRow.map((cellEl) => cellEl.getAttribute('data-date'))).toEqual([DAY_1, DAY_2, DAY_3])
        for (const cellEl of dateRow) {
          expect(queryPart(cellEl, 'navLink')).not.toBeNull()
        }
      })
    })

    describe('inertness', () => {
      it('marks the placeholder lane and all-day cell aria-disabled', () => {
        const calendar = initCalendar({ ...options, events: A_AROUND_DAY_2 })
        const columns = new ResourceColumnsModel(calendar.el)

        expect(getPlaceholderLaneEl(calendar, DAY_2).getAttribute('aria-disabled')).toBe('true')
        expect(getPlaceholderDayCellEl(calendar, DAY_2).getAttribute('aria-disabled')).toBe('true')
        expect(columns.getDayLaneEl(DAY_1, 'a').hasAttribute('aria-disabled')).toBe(false)
        expect(columns.getDayCellEl(DAY_1, 'a').hasAttribute('aria-disabled')).toBe(false)
      })

      it('renders the blank header cell as an empty cell, not an empty columnheader', () => {
        const calendar = initCalendar({ ...options, events: A_AROUND_DAY_2 })
        const blankEl = new ResourceColumnsModel(calendar.el).getBlankHeaderCellEl(DAY_2)

        expect(blankEl.getAttribute('role')).toBe('cell')
        expect(blankEl.textContent).toBe('')
      })

      it('ignores clicks and selections in the timed area', async () => {
        const dateClick = vi.fn()
        const select = vi.fn()
        const calendar = initCalendar({ ...options, selectable: true, events: A_AROUND_DAY_2, dateClick, select })
        await waitForSettle()
        const placeholderLaneEl = getPlaceholderLaneEl(calendar, DAY_2)

        await clickPoint(pointInLane(calendar, placeholderLaneEl, '05:00'))
        await dragPointer(pointInLane(calendar, placeholderLaneEl, '05:00'), pointInLane(calendar, placeholderLaneEl, '06:00'))

        expect(dateClick).not.toHaveBeenCalled()
        expect(select).not.toHaveBeenCalled()

        // the same gestures on a real column register
        const realLaneEl = new ResourceColumnsModel(calendar.el).getDayLaneEl(DAY_1, 'a')
        await clickPoint(pointInLane(calendar, realLaneEl, '05:00'))
        await dragPointer(pointInLane(calendar, realLaneEl, '05:00'), pointInLane(calendar, realLaneEl, '06:00'))

        expect(dateClick).toHaveBeenCalledTimes(1)
        expect(dateClick.mock.calls[0][0].resource.id).toBe('a')
        expect(select).toHaveBeenCalledTimes(2) // a click selects its slot too
        expect(select.mock.calls.map(([info]) => info.resource.id)).toEqual(['a', 'a'])
      })

      it('ignores clicks in the all-day cell', async () => {
        const dateClick = vi.fn()
        const calendar = initCalendar({ ...options, events: A_AROUND_DAY_2, dateClick })
        await waitForSettle()

        await clickPoint(getRectCenter(getPlaceholderDayCellEl(calendar, DAY_2).getBoundingClientRect()))
        expect(dateClick).not.toHaveBeenCalled()

        // a real all-day cell registers
        await new TimeGridModel(calendar.el).allDay.clickDate({ date: DAY_1, resourceId: 'a' })
        expect(dateClick).toHaveBeenCalledTimes(1)
        expect(dateClick.mock.calls[0][0].allDay).toBe(true)
      })

      it('doesn\'t take a timed event drop', async () => {
        const eventDragStart = vi.fn()
        const eventDrop = vi.fn()
        const calendar = initCalendar({ ...options, editable: true, events: A_AROUND_DAY_2, eventDragStart, eventDrop })
        await waitForSettle()

        await new TimeGridModel(calendar.el).dragEvent(
          'a1',
          { date: DAY_1 + 'T02:00', resourceId: 'a' },
          () => pointInLane(calendar, getPlaceholderLaneEl(calendar, DAY_2), '05:00'),
        )

        expect(eventDragStart).toHaveBeenCalledTimes(1) // the drag really happened
        expect(eventDrop).not.toHaveBeenCalled()
        expect(calendar.getEventById('a1')!.startStr).toBe(DAY_1 + 'T02:00:00Z')
      })

      it('doesn\'t take an all-day event drop in its all-day cell', async () => {
        const eventDragStart = vi.fn()
        const eventDrop = vi.fn()
        const calendar = initCalendar({
          ...options,
          editable: true,
          events: [
            { id: 'a1', title: 'A day 1', start: DAY_1, resourceId: 'a' },
            { id: 'a3', title: 'A day 3', start: DAY_3, resourceId: 'a' },
          ],
          eventDragStart,
          eventDrop,
        })
        await waitForSettle()

        await new TimeGridModel(calendar.el).allDay.dragEvent(
          'a1',
          { date: DAY_1, resourceId: 'a' },
          () => getRectCenter(getPlaceholderDayCellEl(calendar, DAY_2).getBoundingClientRect()),
        )

        expect(eventDragStart).toHaveBeenCalledTimes(1) // the drag really happened
        expect(eventDrop).not.toHaveBeenCalled()
        expect(calendar.getEventById('a1')!.startStr).toBe(DAY_1)
      })

      it('allows a selection across it', async () => {
        const select = vi.fn()
        const calendar = initCalendar({
          ...options,
          selectable: true,
          events: [
            { title: 'A day 1', start: DAY_1 + 'T09:00:00', resourceId: 'a' },
            { title: 'A day 3', start: DAY_3 + 'T09:00:00', resourceId: 'a' },
          ],
          select,
        })
        await waitForSettle()

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

      it('is inert in a view with no resources left', async () => {
        const dateClick = vi.fn()
        const select = vi.fn()
        const calendar = initCalendar({
          ...options,
          selectable: true,
          events: [], // no resource survives view-wide filtering
          dateClick,
          select,
        })
        await waitForSettle()
        const laneEl = getPlaceholderLaneEl(calendar, DAY_2)

        expect(new ResourceColumnsModel(calendar.el).getResourceHeaderIds()).toEqual([])
        expect(laneEl.getAttribute('aria-disabled')).toBe('true')

        await clickPoint(pointInLane(calendar, laneEl, '05:00'))
        await dragPointer(pointInLane(calendar, laneEl, '05:00'), pointInLane(calendar, laneEl, '06:00'))

        expect(dateClick).not.toHaveBeenCalled()
        expect(select).not.toHaveBeenCalled()
      })
    })

    describe('non-resource rendering', () => {
      // every column of a view with no resources left is a placeholder too
      it('renders business hours, background events and the now indicator in a view with no resources left', () => {
        const calendar = initCalendar({
          ...options,
          now: DAY_2 + 'T02:00:00',
          nowIndicator: true,
          businessHours: true, // Mon-Fri 9-5
          events: [
            // no resourceIds, so no resource survives view-wide filtering
            { start: DAY_2 + 'T04:00:00', end: DAY_2 + 'T05:00:00', display: 'background' },
            { start: DAY_3, allDay: true, display: 'background' },
          ],
        })
        const laneEl = getPlaceholderLaneEl(calendar, DAY_2)

        expect(new ResourceColumnsModel(calendar.el).getResourceHeaderIds()).toEqual([])
        expect(queryParts(laneEl, 'nonBusinessHours').length).toBeGreaterThan(0)
        expect(queryParts(laneEl, 'backgroundEvent')).toHaveLength(1)
        expect(queryPart(laneEl, 'nowIndicatorLine')).not.toBeNull()
        expect(queryParts(getPlaceholderDayCellEl(calendar, DAY_3), 'backgroundEvent')).toHaveLength(1)
      })

      it('shades it with the calendar\'s business hours', () => {
        const calendar = initCalendar({ ...options, businessHours: true, events: A_AROUND_DAY_2 })
        const placeholderCnt = queryParts(getPlaceholderLaneEl(calendar, DAY_2), 'nonBusinessHours').length
        const resourceCnt = queryParts(new ResourceColumnsModel(calendar.el).getDayLaneEl(DAY_3, 'a'), 'nonBusinessHours').length

        expect(placeholderCnt).toBeGreaterThan(0)
        expect(placeholderCnt).toBe(resourceCnt) // both are ordinary weekdays
      })

      it('gives it the calendar\'s business hours, not a resource\'s', () => {
        const calendar = initCalendar({
          ...options,
          businessHours: true, // Mon-Fri 9-5
          resources: [{
            id: 'a',
            title: 'Resource A',
            businessHours: { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: '00:00', endTime: '24:00' },
          }],
          events: A_AROUND_DAY_2,
        })

        // the calendar-wide business hours fill only the placeholder, never a resource column
        expect(queryParts(new ResourceColumnsModel(calendar.el).getDayLaneEl(DAY_3, 'a'), 'nonBusinessHours')).toHaveLength(0)
        expect(queryParts(getPlaceholderLaneEl(calendar, DAY_2), 'nonBusinessHours').length).toBeGreaterThan(0)
      })

      it('renders non-resource background events in it', () => {
        const calendar = initCalendar({
          ...options,
          events: [
            ...A_AROUND_DAY_2,
            { start: DAY_2 + 'T04:00:00', end: DAY_2 + 'T05:00:00', display: 'background' },
            { start: DAY_3 + 'T04:00:00', end: DAY_3 + 'T05:00:00', display: 'background' },
          ],
        })

        expect(queryParts(getPlaceholderLaneEl(calendar, DAY_2), 'backgroundEvent')).toHaveLength(1)
        expect(queryParts(new ResourceColumnsModel(calendar.el).getDayLaneEl(DAY_3, 'a'), 'backgroundEvent')).toHaveLength(1)
      })

      it('renders non-resource all-day background events in its all-day cell', () => {
        const calendar = initCalendar({
          ...options,
          events: [
            ...A_AROUND_DAY_2,
            { start: DAY_2, allDay: true, display: 'background' },
          ],
        })

        expect(queryParts(getPlaceholderDayCellEl(calendar, DAY_2), 'backgroundEvent')).toHaveLength(1)
      })

      it('renders the now indicator in it', () => {
        const calendar = initCalendar({
          ...options,
          now: DAY_2 + 'T02:00:00',
          nowIndicator: true,
          events: A_AROUND_DAY_2,
        })

        expect(queryPart(getPlaceholderLaneEl(calendar, DAY_2), 'nowIndicatorLine')).not.toBeNull()
      })

      it('doesn\'t render non-resource foreground events in it', () => {
        const calendar = initCalendar({
          ...options,
          events: [
            ...A_AROUND_DAY_2,
            { id: 'none', title: 'No resource', start: DAY_2 + 'T04:00:00', end: DAY_2 + 'T05:00:00' },
          ],
        })
        const timeGrid = new TimeGridModel(calendar.el)

        expect(queryPart(getPlaceholderLaneEl(calendar, DAY_2), 'event')).toBeNull()
        expect(timeGrid.getEventEls('none')).toHaveLength(0)
        expect(timeGrid.getEventEls()).toHaveLength(2)
      })
    })

    describe('render hooks', () => {
      it('calls day lane and day cell hooks without a resource', () => {
        const dayLaneDidMount = vi.fn()
        const dayCellDidMount = vi.fn()
        initCalendar({ ...options, events: A_AROUND_DAY_2, dayLaneDidMount, dayCellDidMount })

        for (const spy of [dayLaneDidMount, dayCellDidMount]) {
          const infos = spy.mock.calls.map(([info]) => info)
          const placeholderInfos = infos.filter((info) => info.date.toISOString().startsWith(DAY_2))
          const otherInfos = infos.filter((info) => !info.date.toISOString().startsWith(DAY_2))

          expect(placeholderInfos.length).toBeGreaterThan(0)
          expect(placeholderInfos.every((info) => info.resource === undefined)).toBe(true)
          expect(otherInfos.length).toBeGreaterThan(0)
          expect(otherInfos.every((info) => info.resource.id === 'a')).toBe(true)
        }
      })

      it('gives the blank header cell the dayLaneClass', () => {
        const calendar = initCalendar({
          ...options,
          events: A_AROUND_DAY_2,
          dayLaneClass: (info) => (info.resource ? 'test-resource-lane' : 'test-placeholder-lane'),
        })

        expect(new ResourceColumnsModel(calendar.el).getBlankHeaderCellEl(DAY_2).classList).toContain('test-placeholder-lane')
      })

      it('never calls resource header hooks for it', () => {
        const resourceDayHeaderContent = vi.fn((info) => info.resource.title)
        initCalendar({ ...options, events: A_AROUND_DAY_2, resourceDayHeaderContent })
        const infos = resourceDayHeaderContent.mock.calls.map(([info]) => info)
        const dates = new Set(infos.map((info) => info.date.toISOString().slice(0, 10)))

        expect(resourceDayHeaderContent).toHaveBeenCalledTimes(2 * strictModeFactor)
        expect(infos.every((info) => info.resource.id === 'a')).toBe(true)
        expect([...dates].sort()).toEqual([DAY_1, DAY_3])
      })
    })

    describe('major columns', () => {
      it('makes every day boundary major with a single resource', () => {
        const dayLaneDidMount = vi.fn()
        initCalendar({
          ...options,
          filterResourcesWithEvents: false,
          resources: [{ id: 'a', title: 'Resource A' }],
          dayLaneDidMount,
        })

        expect(buildIsMajorByColumn(dayLaneDidMount.mock.calls)).toEqual({
          [DAY_1 + ':a']: true,
          [DAY_2 + ':a']: true,
          [DAY_3 + ':a']: true,
        })
      })

      it('makes a placeholder major, agreeing between header and body', () => {
        const dayLaneDidMount = vi.fn()
        const resourceDayHeaderDidMount = vi.fn()
        initCalendar({
          ...options,
          resources: [
            { id: 'a', title: 'Resource A' },
            { id: 'b', title: 'Resource B' },
            { id: 'c', title: 'Resource C' },
          ],
          events: [
            { title: 'A day 1', start: DAY_1 + 'T02:00:00', resourceId: 'a' },
            { title: 'B day 3', start: DAY_3 + 'T02:00:00', resourceId: 'b' },
            { title: 'C day 3', start: DAY_3 + 'T02:00:00', resourceId: 'c' },
          ],
          dayLaneDidMount,
          resourceDayHeaderDidMount,
        })

        expect(buildIsMajorByColumn(dayLaneDidMount.mock.calls)).toEqual({
          [DAY_1 + ':a']: true, // the only resource on its date
          [DAY_2 + ':']: true, // placeholder
          [DAY_3 + ':b']: true,
          [DAY_3 + ':c']: false,
        })
        expect(buildIsMajorByColumn(resourceDayHeaderDidMount.mock.calls)).toEqual({
          [DAY_1 + ':a']: true,
          [DAY_3 + ':b']: true,
          [DAY_3 + ':c']: false,
        })
      })

      it('makes no column major in a single-day view', () => {
        const dayLaneDidMount = vi.fn()
        initCalendar({
          ...options,
          initialView: 'resourceTimeGridDay',
          filterResourcesWithEvents: false,
          dayLaneDidMount,
        })

        expect(buildIsMajorByColumn(dayLaneDidMount.mock.calls)).toEqual({
          [DAY_1 + ':a']: false,
          [DAY_1 + ':b']: false,
        })
      })
    })

    describe('fallback and dynamic changes', () => {
      // A survives view-wide (its event is in the view's range) but matches no column, which would
      // leave only placeholders. plain day columns are rendered instead
      it('falls back to plain day columns when every column would be a placeholder', () => {
        const calendar = initCalendar({
          ...options,
          slotMinTime: '08:00',
          resources: [{ id: 'a', title: 'Resource A' }],
          events: [{ title: 'Before slots', start: DAY_2 + 'T06:00:00', end: DAY_2 + 'T07:00:00', resourceId: 'a' }],
        })
        const columns = new ResourceColumnsModel(calendar.el)
        const plainColumns = [DAY_1, DAY_2, DAY_3].map((date) => ({ date, resourceId: null }))

        expect(columns.getResourceHeaderIds()).toEqual([])
        expect(columns.getHeaderCellInfoByRow()).toEqual([ // a single date row, no resource row
          plainColumns.map((column) => ({ ...column, colSpan: 1 })),
        ])
        expect(columns.getDayLaneColumns()).toEqual(plainColumns)
      })

      it('swaps a placeholder for a resource column as events come and go', async () => {
        const calendar = initCalendar({ ...options, events: A_AROUND_DAY_2 })
        const columns = new ResourceColumnsModel(calendar.el)
        const placeholderColumns = [
          { date: DAY_1, resourceId: 'a' },
          { date: DAY_2, resourceId: null },
          { date: DAY_3, resourceId: 'a' },
        ]

        expect(columns.getDayLaneColumns()).toEqual(placeholderColumns)

        const event = calendar.addEvent({ title: 'B day 2', start: DAY_2 + 'T02:00:00', resourceId: 'b' })!
        await waitForSettle()

        expect(columns.getDayLaneColumns()).toEqual([
          { date: DAY_1, resourceId: 'a' },
          { date: DAY_2, resourceId: 'b' },
          { date: DAY_3, resourceId: 'a' },
        ])

        event.remove()
        await waitForSettle()

        expect(columns.getDayLaneColumns()).toEqual(placeholderColumns)
      })

      it('restores the full grid, with nothing inert, when filtering is turned off', async () => {
        const calendar = initCalendar({ ...options, events: A_AROUND_DAY_2 })
        expect(calendar.el.querySelectorAll('[role=cell][aria-disabled]').length).toBeGreaterThan(0)

        calendar.setOption('filterResourcesWithEvents', false)
        await waitForSettle()

        expect(new ResourceColumnsModel(calendar.el).getDayLaneColumns()).toEqual([
          { date: DAY_1, resourceId: 'a' },
          { date: DAY_1, resourceId: 'b' },
          { date: DAY_2, resourceId: 'a' },
          { date: DAY_2, resourceId: 'b' },
          { date: DAY_3, resourceId: 'a' },
          { date: DAY_3, resourceId: 'b' },
        ])
        expect(calendar.el.querySelectorAll('[role=cell][aria-disabled]')).toHaveLength(0)
      })
    })
  })

  describe('in resource dayGrid', () => {
    const dayGridOptions = { ...options, initialView: 'resourceDayGridThreeDay' }
    const ALL_DAY_A_AROUND_DAY_2 = [
      { title: 'A day 1', start: DAY_1, resourceId: 'a' },
      { title: 'A day 3', start: DAY_3, resourceId: 'a' },
    ]

    it('keeps the date header and renders one resource-less cell per empty date', () => {
      const calendar = initCalendar({
        ...dayGridOptions,
        events: [
          { title: 'A day 1', start: DAY_1, resourceId: 'a' },
          { title: 'B day 1', start: DAY_1, resourceId: 'b' },
        ],
      })
      const columns = new ResourceColumnsModel(calendar.el)

      expect(columns.getHeaderCellInfoByRow()).toEqual([
        [
          { date: DAY_1, resourceId: null, colSpan: 2 },
          { date: DAY_2, resourceId: null, colSpan: 1 },
          { date: DAY_3, resourceId: null, colSpan: 1 },
        ],
        [
          { date: DAY_1, resourceId: 'a', colSpan: 1 },
          { date: DAY_1, resourceId: 'b', colSpan: 1 },
          { date: DAY_2, resourceId: null, colSpan: 1 },
          { date: DAY_3, resourceId: null, colSpan: 1 },
        ],
      ])
      expect(columns.getDayCellColumns()).toEqual([
        { date: DAY_1, resourceId: 'a' },
        { date: DAY_1, resourceId: 'b' },
        { date: DAY_2, resourceId: null },
        { date: DAY_3, resourceId: null },
      ])
    })

    it('ignores clicks on a placeholder', async () => {
      const dateClick = vi.fn()
      const calendar = initCalendar({ ...dayGridOptions, events: ALL_DAY_A_AROUND_DAY_2, dateClick })
      await waitForSettle()
      const columns = new ResourceColumnsModel(calendar.el)

      await clickPoint(getRectCenter(columns.getDayCellEl(DAY_2, null).getBoundingClientRect()))
      expect(dateClick).not.toHaveBeenCalled()

      // a real cell registers. it's tall, so its center clears the event at its top
      await clickPoint(getRectCenter(columns.getDayCellEl(DAY_1, 'a').getBoundingClientRect()))
      expect(dateClick).toHaveBeenCalledTimes(1)
      expect(dateClick.mock.calls[0][0].resource.id).toBe('a')
    })

    it('calls day cell hooks without a resource for a placeholder, and gives its blank header cell the dayCellClass', () => {
      const dayCellDidMount = vi.fn()
      const calendar = initCalendar({
        ...dayGridOptions,
        events: ALL_DAY_A_AROUND_DAY_2,
        dayCellDidMount,
        dayCellClass: (info) => (info.resource ? 'test-resource-cell' : 'test-placeholder-cell'),
      })
      const placeholderInfos = dayCellDidMount.mock.calls.map(([info]) => info)
        .filter((info) => info.date.toISOString().startsWith(DAY_2))

      expect(placeholderInfos.length).toBeGreaterThan(0)
      expect(placeholderInfos.every((info) => info.resource === undefined)).toBe(true)
      expect(new ResourceColumnsModel(calendar.el).getBlankHeaderCellEl(DAY_2).classList).toContain('test-placeholder-cell')
    })

    it('renders a non-resource background event separately in each placeholder', () => {
      const calendar = initCalendar({
        ...dayGridOptions,
        events: [
          { title: 'A day 1', start: DAY_1, resourceId: 'a' },
          { start: DAY_2, end: '2016-12-07', allDay: true, display: 'background' }, // days 2-3
        ],
      })

      // consecutive placeholders belong to different date groups, so the event doesn't merge
      expect(queryParts(getPlaceholderDayCellEl(calendar, DAY_2), 'backgroundEvent')).toHaveLength(1)
      expect(queryParts(getPlaceholderDayCellEl(calendar, DAY_3), 'backgroundEvent')).toHaveLength(1)
    })

    it('makes every day boundary major with a single resource', () => {
      const dayCellDidMount = vi.fn()
      initCalendar({
        ...dayGridOptions,
        filterResourcesWithEvents: false,
        resources: [{ id: 'a', title: 'Resource A' }],
        dayCellDidMount,
      })

      expect(buildIsMajorByColumn(dayCellDidMount.mock.calls)).toEqual({
        [DAY_1 + ':a']: true,
        [DAY_2 + ':a']: true,
        [DAY_3 + ':a']: true,
      })
    })
  })
})
