import { Calendar } from 'fullcalendar'
import { strictModeFactor } from 'fullcalendar/protected-api'
import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { getBoundingRect } from '@fullcalendar-tests/standard/lib/dom-geom'
import { formatIsoDay } from '@fullcalendar-tests/standard/lib/datelib-utils'
import { ResourceDayHeaderWrapper } from '../lib/wrappers/ResourceDayHeaderWrapper'
import { ResourceDayGridViewWrapper } from '../lib/wrappers/ResourceDayGridViewWrapper'
import { ResourceTimeGridViewWrapper } from '../lib/wrappers/ResourceTimeGridViewWrapper'

/*
With filterResourcesWithEvents and datesAboveResources, a date where no resource has events
keeps its date header and renders a single placeholder column with no resource (#8099). The
placeholder is inert, but non-resource things (business hours, background events, the now
indicator) still paint it, like a resource timeline's non-resource background spans every row.
*/

const DAY_1 = '2016-12-04' // Sunday
const DAY_2 = '2016-12-05' // Monday
const DAY_3 = '2016-12-06' // Tuesday
const HOUR_MS = 1000 * 60 * 60

// resource A on days 1 and 3, nothing on day 2
const A_AROUND_DAY_2 = [
  { id: 'a1', title: 'A day 1', start: DAY_1 + 'T02:00:00', end: DAY_1 + 'T03:00:00', resourceId: 'a' },
  { id: 'a3', title: 'A day 3', start: DAY_3 + 'T02:00:00', end: DAY_3 + 'T03:00:00', resourceId: 'a' },
]

describe('filterResourcesWithEvents placeholder columns', () => {
  pushOptions({
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
      resourceTimeGridThreeDay: {
        type: 'resourceTimeGrid',
        duration: { days: 3 },
      },
      resourceDayGridThreeDay: {
        type: 'resourceDayGrid',
        duration: { days: 3 },
      },
    },
  })

  describe('in resource timeGrid', () => {
    // structure
    // ---------------------------------------------------------------------------------------------

    it('keeps the date header and renders one resource-less column per empty date', () => {
      let calendar = initCalendar({
        events: [
          { title: 'A day 1', start: DAY_1 + 'T02:00:00', resourceId: 'a' },
          { title: 'B day 1', start: DAY_1 + 'T02:00:00', resourceId: 'b' },
        ],
      })
      let viewWrapper = new ResourceTimeGridViewWrapper(calendar)

      // consecutive empty dates stay separate columns, one per date
      expect(viewWrapper.header.getCellInfoByRow()).toEqual([
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
      expect(viewWrapper.timeGrid.getColumnInfo()).toEqual([
        { date: DAY_1, resourceId: 'a' },
        { date: DAY_1, resourceId: 'b' },
        { date: DAY_2, resourceId: null },
        { date: DAY_3, resourceId: null },
      ])
      expect(viewWrapper.header.getResourceIds()).toEqual(['a', 'b'])
    })

    it('aligns header cells with placeholder columns at both edges', async () => {
      let calendar = initCalendar({
        events: [
          { title: 'A day 2', start: DAY_2 + 'T02:00:00', resourceId: 'a' },
          { title: 'B day 2', start: DAY_2 + 'T02:00:00', resourceId: 'b' },
        ],
      })

      await waitTimeout() // let column widths settle

      let header = new ResourceTimeGridViewWrapper(calendar).header

      expect(header.getCellInfoByRow()[1]).toEqual([
        { date: DAY_1, resourceId: null, colSpan: 1 },
        { date: DAY_2, resourceId: 'a', colSpan: 1 },
        { date: DAY_2, resourceId: 'b', colSpan: 1 },
        { date: DAY_3, resourceId: null, colSpan: 1 },
      ])
      expectHeaderRowsAlign(header)
    })

    it('keeps a nav link on the date header of an empty date', () => {
      let calendar = initCalendar({
        navLinks: true,
        events: A_AROUND_DAY_2,
      })
      let dateRow = new ResourceTimeGridViewWrapper(calendar).header.getCellElsByRow()[0]

      expect(dateRow.map((cellEl) => cellEl.getAttribute('data-date'))).toEqual([DAY_1, DAY_2, DAY_3])
      for (let cellEl of dateRow) {
        expect(cellEl.querySelector('.fc-navlink')).toBeTruthy()
      }
    })

    // inertness
    // ---------------------------------------------------------------------------------------------

    it('marks the placeholder lane and all-day cell as aria-disabled', () => {
      let calendar = initCalendar({
        events: A_AROUND_DAY_2,
      })

      expect(getPlaceholderLaneEl(calendar, DAY_2).getAttribute('aria-disabled')).toBe('true')
      expect(getPlaceholderDayCellEl(calendar, DAY_2).getAttribute('aria-disabled')).toBe('true')
      expect(getResourceLaneEl(calendar, 'a', DAY_1).hasAttribute('aria-disabled')).toBe(false)
    })

    it('ignores clicks and selections in the timed area of a placeholder', async () => {
      let dateClickSpy = jasmine.createSpy('dateClick')
      let selectSpy = jasmine.createSpy('select')
      let calendar = initCalendar({
        selectable: true,
        events: A_AROUND_DAY_2,
        dateClick: dateClickSpy,
        select: selectSpy,
      })

      await waitTimeout()
      let placeholderLaneEl = getPlaceholderLaneEl(calendar, DAY_2)

      await simulatePointerDrag(getLanePoint(calendar, placeholderLaneEl, 5))
      await simulatePointerDrag(
        getLanePoint(calendar, placeholderLaneEl, 5),
        getLanePoint(calendar, placeholderLaneEl, 6),
      )
      await waitTimeout()

      expect(dateClickSpy).not.toHaveBeenCalled()
      expect(selectSpy).not.toHaveBeenCalled()

      // control: the same gesture on a real column does register
      await simulatePointerDrag(getLanePoint(calendar, getResourceLaneEl(calendar, 'a', DAY_1), 5))
      await waitTimeout()

      expect(dateClickSpy).toHaveBeenCalledTimes(1)
      expect(dateClickSpy.calls.argsFor(0)[0].resource.id).toBe('a')
    })

    it('ignores clicks in the all-day cell of a placeholder', async () => {
      let dateClickSpy = jasmine.createSpy('dateClick')
      let calendar = initCalendar({
        events: A_AROUND_DAY_2,
        dateClick: dateClickSpy,
      })

      await waitTimeout()
      await simulatePointerDrag(getElCenter(getPlaceholderDayCellEl(calendar, DAY_2)))
      await waitTimeout()

      expect(dateClickSpy).not.toHaveBeenCalled()

      // control: a real all-day cell does register
      await simulatePointerDrag(getElCenter(getResourceDayCellEl(calendar, 'a', DAY_1)))
      await waitTimeout()

      expect(dateClickSpy).toHaveBeenCalledTimes(1)
      expect(dateClickSpy.calls.argsFor(0)[0].allDay).toBe(true)
    })

    it('does not drop a timed event onto a placeholder', async () => {
      let dragStartSpy = jasmine.createSpy('eventDragStart')
      let dropSpy = jasmine.createSpy('eventDrop')
      let calendar = initCalendar({
        editable: true,
        events: A_AROUND_DAY_2,
        eventDragStart: dragStartSpy,
        eventDrop: dropSpy,
      })

      await waitTimeout()
      let viewWrapper = new ResourceTimeGridViewWrapper(calendar)
      let eventEl = viewWrapper.timeGrid.getFirstEventEl()

      await simulateElDrag(eventEl, getLanePoint(calendar, getPlaceholderLaneEl(calendar, DAY_2), 5))
      await waitTimeout()

      expect(dragStartSpy).toHaveBeenCalled() // the drag really happened
      expect(dropSpy).not.toHaveBeenCalled()
      expect(calendar.getEventById('a1').start).toEqualDate(DAY_1 + 'T02:00:00Z')
    })

    it('does not drop an all-day event onto a placeholder\'s all-day cell', async () => {
      let dragStartSpy = jasmine.createSpy('eventDragStart')
      let dropSpy = jasmine.createSpy('eventDrop')
      let calendar = initCalendar({
        editable: true,
        events: [
          { id: 'a1', title: 'A day 1', start: DAY_1, resourceId: 'a' },
          { id: 'a3', title: 'A day 3', start: DAY_3, resourceId: 'a' },
        ],
        eventDragStart: dragStartSpy,
        eventDrop: dropSpy,
      })

      await waitTimeout()
      let eventEl = calendar.el.querySelector('.fc-daygrid-event') as HTMLElement

      await simulateElDrag(eventEl, getElCenter(getPlaceholderDayCellEl(calendar, DAY_2)))
      await waitTimeout()

      expect(dragStartSpy).toHaveBeenCalled() // the drag really happened
      expect(dropSpy).not.toHaveBeenCalled()
      expect(calendar.getEventById('a1').start).toEqualDate(DAY_1)
    })

    it('allows a selection across a placeholder', async () => {
      let selectInfo = null
      let calendar = initCalendar({
        selectable: true,
        events: [
          { title: 'A day 1', start: DAY_1 + 'T09:00:00', resourceId: 'a' },
          { title: 'A day 3', start: DAY_3 + 'T09:00:00', resourceId: 'a' },
        ],
        select(info) {
          selectInfo = info
        },
      })

      await waitTimeout()
      let timeGrid = new ResourceTimeGridViewWrapper(calendar).timeGrid

      await simulatePointerDrag(
        // early-morning times keep the points within the scrollTime:'00:00' viewport
        timeGrid.getPoint('a', DAY_1 + 'T02:00:00'),
        timeGrid.getPoint('a', DAY_3 + 'T04:00:00'),
      )

      expect(selectInfo).toBeTruthy()
      expect(selectInfo.resource.id).toBe('a')
      expect(selectInfo.start).toEqualDate(DAY_1 + 'T02:00:00Z')
      expect(selectInfo.end.toISOString().slice(0, 10)).toBe(DAY_3) // spans the placeholder
    })

    it('is inert in a resourceless view', async () => {
      let dateClickSpy = jasmine.createSpy('dateClick')
      let selectSpy = jasmine.createSpy('select')
      let calendar = initCalendar({
        selectable: true,
        events: [], // no resource survives view-wide filtering
        dateClick: dateClickSpy,
        select: selectSpy,
      })

      await waitTimeout()
      let laneEl = getPlaceholderLaneEl(calendar, DAY_2)

      expect(new ResourceTimeGridViewWrapper(calendar).header.getResourceIds()).toEqual([])

      await simulatePointerDrag(getLanePoint(calendar, laneEl, 5))
      await simulatePointerDrag(getLanePoint(calendar, laneEl, 5), getLanePoint(calendar, laneEl, 6))
      await waitTimeout()

      expect(dateClickSpy).not.toHaveBeenCalled()
      expect(selectSpy).not.toHaveBeenCalled()
    })

    // every column of a resourceless view is a placeholder too
    it('renders business hours, non-resource background events, and the now indicator in a resourceless view', () => {
      let calendar = initCalendar({
        now: DAY_2 + 'T02:00:00',
        nowIndicator: true,
        businessHours: true, // Mon-Fri 9-5
        events: [
          // no resourceIds, so no resource survives view-wide filtering
          { start: DAY_2 + 'T04:00:00', end: DAY_2 + 'T05:00:00', display: 'background' },
          { start: DAY_3, allDay: true, display: 'background' },
        ],
      })
      let laneEl = getPlaceholderLaneEl(calendar, DAY_2)

      expect(new ResourceTimeGridViewWrapper(calendar).header.getResourceIds()).toEqual([])
      expect(laneEl.querySelectorAll('.fc-non-business').length).toBeGreaterThan(0)
      expect(laneEl.querySelectorAll('.fc-bg-event').length).toBe(1)
      expect(laneEl.querySelector('.fc-timegrid-now-indicator-line')).toBeTruthy()
      expect(getPlaceholderDayCellEl(calendar, DAY_3).querySelectorAll('.fc-bg-event').length).toBe(1)
    })

    // render hooks
    // ---------------------------------------------------------------------------------------------

    it('calls day lane and day cell hooks without a resource for a placeholder', () => {
      let dayLaneDidMount = jasmine.createSpy('dayLaneDidMount')
      let dayCellDidMount = jasmine.createSpy('dayCellDidMount')
      let calendar = initCalendar({
        events: A_AROUND_DAY_2,
        dayLaneDidMount,
        dayCellDidMount,
      })

      for (let spy of [dayLaneDidMount, dayCellDidMount]) {
        let infos = spy.calls.allArgs().map((args) => args[0])
        let placeholderInfos = infos.filter((info) => formatIsoDay(info.date) === DAY_2)
        let otherInfos = infos.filter((info) => formatIsoDay(info.date) !== DAY_2)

        expect(placeholderInfos.length).toBeGreaterThan(0)
        expect(placeholderInfos.every((info) => info.resource === undefined)).toBe(true)
        expect(otherInfos.length).toBeGreaterThan(0)
        expect(otherInfos.every((info) => info.resource.id === 'a')).toBe(true)
      }

      // the blank header cell is classed by dayLaneClass ('fc-timegrid-day' in the test theme)
      let header = new ResourceTimeGridViewWrapper(calendar).header

      expect(getBlankHeaderCellEl(header, DAY_2).classList).toContain('fc-timegrid-day')
    })

    it('never calls resource header hooks for a placeholder', () => {
      let resourceDayHeaderContent = jasmine.createSpy('resourceDayHeaderContent')
        .and.callFake((info) => info.resource.title)
      initCalendar({
        events: A_AROUND_DAY_2,
        resourceDayHeaderContent,
      })
      let infos = resourceDayHeaderContent.calls.allArgs().map((args) => args[0])
      let dates = infos.map((info) => formatIsoDay(info.date))

      expect(resourceDayHeaderContent.calls.count()).toBe(2 * strictModeFactor)
      expect(infos.every((info) => info.resource.id === 'a')).toBe(true)
      expect(dates.filter((date, i) => dates.indexOf(date) === i).sort()).toEqual([DAY_1, DAY_3])
    })

    // non-resource rendering
    // ---------------------------------------------------------------------------------------------

    it('shades a placeholder with the calendar\'s business hours', () => {
      let calendar = initCalendar({
        businessHours: true, // Mon-Fri 9-5
        events: A_AROUND_DAY_2,
      })
      let placeholderCnt = getPlaceholderLaneEl(calendar, DAY_2).querySelectorAll('.fc-non-business').length
      let resourceCnt = getResourceLaneEl(calendar, 'a', DAY_3).querySelectorAll('.fc-non-business').length

      expect(placeholderCnt).toBeGreaterThan(0)
      expect(placeholderCnt).toBe(resourceCnt) // both are ordinary weekdays
    })

    it('gives a placeholder the calendar\'s business hours, not a resource\'s', () => {
      let calendar = initCalendar({
        businessHours: true, // Mon-Fri 9-5
        resources: [{
          id: 'a',
          title: 'Resource A',
          businessHours: { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: '00:00', endTime: '24:00' },
        }],
        events: A_AROUND_DAY_2,
      })

      // the calendar-wide business hours fill only the placeholder, never a resource column
      expect(getResourceLaneEl(calendar, 'a', DAY_3).querySelectorAll('.fc-non-business').length).toBe(0)
      expect(getPlaceholderLaneEl(calendar, DAY_2).querySelectorAll('.fc-non-business').length).toBeGreaterThan(0)
    })

    it('renders non-resource background events in a placeholder', () => {
      let calendar = initCalendar({
        events: [
          ...A_AROUND_DAY_2,
          { start: DAY_2 + 'T04:00:00', end: DAY_2 + 'T05:00:00', display: 'background' },
          { start: DAY_3 + 'T04:00:00', end: DAY_3 + 'T05:00:00', display: 'background' },
        ],
      })

      expect(getPlaceholderLaneEl(calendar, DAY_2).querySelectorAll('.fc-bg-event').length).toBe(1)
      expect(getResourceLaneEl(calendar, 'a', DAY_3).querySelectorAll('.fc-bg-event').length).toBe(1)
    })

    it('renders non-resource all-day background events in a placeholder\'s all-day cell', () => {
      let calendar = initCalendar({
        events: [
          ...A_AROUND_DAY_2,
          { start: DAY_2, allDay: true, display: 'background' },
        ],
      })

      expect(getPlaceholderDayCellEl(calendar, DAY_2).querySelectorAll('.fc-bg-event').length).toBe(1)
    })

    it('renders the now indicator in a placeholder', () => {
      let calendar = initCalendar({
        now: DAY_2 + 'T02:00:00',
        nowIndicator: true,
        events: A_AROUND_DAY_2,
      })

      expect(getPlaceholderLaneEl(calendar, DAY_2).querySelector('.fc-timegrid-now-indicator-line')).toBeTruthy()
    })

    it('does not render non-resource foreground events in a placeholder', () => {
      let calendar = initCalendar({
        events: [
          ...A_AROUND_DAY_2,
          { title: 'No resource', start: DAY_2 + 'T04:00:00', end: DAY_2 + 'T05:00:00' },
        ],
      })

      expect(getPlaceholderLaneEl(calendar, DAY_2).querySelector('.fc-timegrid-event')).toBe(null)
      expect(new ResourceTimeGridViewWrapper(calendar).timeGrid.getEventEls().length).toBe(2)
    })

    // major columns
    // ---------------------------------------------------------------------------------------------

    it('makes every day boundary major with a single resource', () => {
      let dayLaneDidMount = jasmine.createSpy('dayLaneDidMount')
      initCalendar({
        filterResourcesWithEvents: false,
        resources: [{ id: 'a', title: 'Resource A' }],
        dayLaneDidMount,
      })

      expect(buildIsMajorByColumn(dayLaneDidMount)).toEqual({
        [DAY_1 + ':a']: true,
        [DAY_2 + ':a']: true,
        [DAY_3 + ':a']: true,
      })
    })

    it('makes a placeholder major, and agrees between header and body', () => {
      let dayLaneDidMount = jasmine.createSpy('dayLaneDidMount')
      let resourceDayHeaderDidMount = jasmine.createSpy('resourceDayHeaderDidMount')
      initCalendar({
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

      expect(buildIsMajorByColumn(dayLaneDidMount)).toEqual({
        [DAY_1 + ':a']: true, // only resource on its date
        [DAY_2 + ':']: true, // placeholder
        [DAY_3 + ':b']: true,
        [DAY_3 + ':c']: false,
      })
      expect(buildIsMajorByColumn(resourceDayHeaderDidMount)).toEqual({
        [DAY_1 + ':a']: true,
        [DAY_3 + ':b']: true,
        [DAY_3 + ':c']: false,
      })
    })

    it('makes no column major in a single-day view', () => {
      let dayLaneDidMount = jasmine.createSpy('dayLaneDidMount')
      initCalendar({
        initialView: 'resourceTimeGridDay',
        filterResourcesWithEvents: false,
        dayLaneDidMount,
      })

      expect(buildIsMajorByColumn(dayLaneDidMount)).toEqual({
        [DAY_1 + ':a']: false,
        [DAY_1 + ':b']: false,
      })
    })

    // fallback and dynamic changes
    // ---------------------------------------------------------------------------------------------

    // A survives view-wide (its event is inside the view's range) but matches no column, which
    // would leave only placeholders. render plain day columns instead
    it('falls back to plain day columns when every column would be a placeholder', () => {
      let calendar = initCalendar({
        slotMinTime: '08:00',
        resources: [{ id: 'a', title: 'Resource A' }],
        events: [
          { title: 'Before slots', start: DAY_2 + 'T06:00:00', end: DAY_2 + 'T07:00:00', resourceId: 'a' },
        ],
      })
      let viewWrapper = new ResourceTimeGridViewWrapper(calendar)
      let plainColumns = [DAY_1, DAY_2, DAY_3].map((date) => ({ date, resourceId: null }))

      expect(viewWrapper.header.getResourceIds()).toEqual([])
      expect(viewWrapper.header.getCellInfoByRow()).toEqual([ // a single date row, no resource row
        plainColumns.map((column) => ({ ...column, colSpan: 1 })),
      ])
      expect(viewWrapper.timeGrid.getColumnInfo()).toEqual(plainColumns)
    })

    it('swaps a placeholder for a resource column as events come and go', () => {
      let calendar = initCalendar({
        events: A_AROUND_DAY_2,
      })
      let timeGrid = new ResourceTimeGridViewWrapper(calendar).timeGrid
      let placeholderColumns = [
        { date: DAY_1, resourceId: 'a' },
        { date: DAY_2, resourceId: null },
        { date: DAY_3, resourceId: 'a' },
      ]

      expect(timeGrid.getColumnInfo()).toEqual(placeholderColumns)

      let event = calendar.addEvent({ title: 'B day 2', start: DAY_2 + 'T02:00:00', resourceId: 'b' })

      expect(timeGrid.getColumnInfo()).toEqual([
        { date: DAY_1, resourceId: 'a' },
        { date: DAY_2, resourceId: 'b' },
        { date: DAY_3, resourceId: 'a' },
      ])

      event.remove()

      expect(timeGrid.getColumnInfo()).toEqual(placeholderColumns)
    })

    it('restores the full grid with nothing inert when filtering is turned off', () => {
      let calendar = initCalendar({
        events: A_AROUND_DAY_2,
      })

      calendar.setOption('filterResourcesWithEvents', false)

      expect(new ResourceTimeGridViewWrapper(calendar).timeGrid.getColumnInfo()).toEqual([
        { date: DAY_1, resourceId: 'a' },
        { date: DAY_1, resourceId: 'b' },
        { date: DAY_2, resourceId: 'a' },
        { date: DAY_2, resourceId: 'b' },
        { date: DAY_3, resourceId: 'a' },
        { date: DAY_3, resourceId: 'b' },
      ])
      expect(calendar.el.querySelectorAll('[role=gridcell][aria-disabled]').length).toBe(0)
    })
  })

  describe('in resource dayGrid', () => {
    pushOptions({
      initialView: 'resourceDayGridThreeDay',
    })

    it('keeps the date header and renders one resource-less cell per empty date', () => {
      let calendar = initCalendar({
        events: [
          { title: 'A day 1', start: DAY_1, resourceId: 'a' },
          { title: 'B day 1', start: DAY_1, resourceId: 'b' },
        ],
      })
      let viewWrapper = new ResourceDayGridViewWrapper(calendar)

      expect(viewWrapper.header.getCellInfoByRow()).toEqual([
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
      expect(viewWrapper.dayGrid.getCellInfo()).toEqual([
        { date: DAY_1, resourceId: 'a' },
        { date: DAY_1, resourceId: 'b' },
        { date: DAY_2, resourceId: null },
        { date: DAY_3, resourceId: null },
      ])
    })

    it('ignores clicks on a placeholder', async () => {
      let dateClickSpy = jasmine.createSpy('dateClick')
      let calendar = initCalendar({
        events: [
          { title: 'A day 1', start: DAY_1, resourceId: 'a' },
          { title: 'A day 3', start: DAY_3, resourceId: 'a' },
        ],
        dateClick: dateClickSpy,
      })

      await waitTimeout()
      await simulatePointerDrag(getElCenter(getPlaceholderDayCellEl(calendar, DAY_2)))
      await waitTimeout()

      expect(dateClickSpy).not.toHaveBeenCalled()

      // control: a real cell does register. the cell is tall, so its center clears the event at its top
      await simulatePointerDrag(getElCenter(getResourceDayCellEl(calendar, 'a', DAY_1)))
      await waitTimeout()

      expect(dateClickSpy).toHaveBeenCalledTimes(1)
      expect(dateClickSpy.calls.argsFor(0)[0].resource.id).toBe('a')
    })

    it('calls day cell hooks without a resource for a placeholder', () => {
      let dayCellDidMount = jasmine.createSpy('dayCellDidMount')
      let calendar = initCalendar({
        events: [
          { title: 'A day 1', start: DAY_1, resourceId: 'a' },
          { title: 'A day 3', start: DAY_3, resourceId: 'a' },
        ],
        dayCellDidMount,
      })
      let infos = dayCellDidMount.calls.allArgs().map((args) => args[0])
      let placeholderInfos = infos.filter((info) => formatIsoDay(info.date) === DAY_2)

      expect(placeholderInfos.length).toBeGreaterThan(0)
      expect(placeholderInfos.every((info) => info.resource === undefined)).toBe(true)

      // the blank header cell is classed by dayCellClass ('fc-daygrid-day' in the test theme)
      let header = new ResourceDayGridViewWrapper(calendar).header

      expect(getBlankHeaderCellEl(header, DAY_2).classList).toContain('fc-daygrid-day')
    })

    it('renders a non-resource background event separately in each placeholder', () => {
      let calendar = initCalendar({
        events: [
          { title: 'A day 1', start: DAY_1, resourceId: 'a' },
          { start: DAY_2, end: '2016-12-07', allDay: true, display: 'background' }, // days 2-3
        ],
      })

      // consecutive placeholders belong to different date groups, so the event doesn't merge
      expect(getPlaceholderDayCellEl(calendar, DAY_2).querySelectorAll('.fc-bg-event').length).toBe(1)
      expect(getPlaceholderDayCellEl(calendar, DAY_3).querySelectorAll('.fc-bg-event').length).toBe(1)
    })

    it('makes every day boundary major with a single resource', () => {
      let dayCellDidMount = jasmine.createSpy('dayCellDidMount')
      initCalendar({
        filterResourcesWithEvents: false,
        resources: [{ id: 'a', title: 'Resource A' }],
        dayCellDidMount,
      })

      expect(buildIsMajorByColumn(dayCellDidMount)).toEqual({
        [DAY_1 + ':a']: true,
        [DAY_2 + ':a']: true,
        [DAY_3 + ':a']: true,
      })
    })
  })
})

// Utils
// -------------------------------------------------------------------------------------------------
// [role=gridcell] restricts matches to the body. the blank header cell takes the same day classes

function getPlaceholderLaneEl(calendar: Calendar, date: string): HTMLElement {
  return calendar.el.querySelector(
    `.fc-timegrid-day[role=gridcell][data-date="${date}"]:not([data-resource-id])`,
  ) as HTMLElement
}

function getResourceLaneEl(calendar: Calendar, resourceId: string, date: string): HTMLElement {
  return calendar.el.querySelector(
    `.fc-timegrid-day[role=gridcell][data-date="${date}"][data-resource-id="${resourceId}"]`,
  ) as HTMLElement
}

// a resource dayGrid body cell, or a resource timeGrid all-day cell
function getPlaceholderDayCellEl(calendar: Calendar, date: string): HTMLElement {
  return calendar.el.querySelector(
    `.fc-daygrid-day[role=gridcell][data-date="${date}"]:not([data-resource-id])`,
  ) as HTMLElement
}

function getResourceDayCellEl(calendar: Calendar, resourceId: string, date: string): HTMLElement {
  return calendar.el.querySelector(
    `.fc-daygrid-day[role=gridcell][data-date="${date}"][data-resource-id="${resourceId}"]`,
  ) as HTMLElement
}

function getBlankHeaderCellEl(header: ResourceDayHeaderWrapper, date: string): HTMLElement {
  let cellElsByRow = header.getCellElsByRow()

  return cellElsByRow[cellElsByRow.length - 1].find((cellEl) => (
    cellEl.getAttribute('data-date') === date && !cellEl.hasAttribute('data-resource-id')
  ))
}

function getLanePoint(calendar: Calendar, laneEl: HTMLElement, hour: number) {
  let laneRect = getBoundingRect(laneEl)
  let timeGrid = new ResourceTimeGridViewWrapper(calendar).timeGrid

  return {
    left: (laneRect.left + laneRect.right) / 2,
    top: timeGrid.base.getTimeTop(hour * HOUR_MS),
  }
}

function getElCenter(el: Element) {
  let rect = el.getBoundingClientRect()

  return {
    left: (rect.left + rect.right) / 2,
    top: (rect.top + rect.bottom) / 2,
  }
}

// a click when no end point is given
function simulatePointerDrag(point, end?) {
  return new Promise<void>((resolve) => {
    $.simulateByPoint('drag', {
      point,
      ...(end ? { end } : {}),
      callback() {
        resolve()
      },
    })
  })
}

function simulateElDrag(el: HTMLElement, end) {
  return new Promise<void>((resolve) => {
    $(el).simulate('drag', {
      localPoint: { left: '50%', top: 5 },
      end,
      onRelease: () => resolve(),
    })
  })
}

// keyed by date and resource id (empty for a placeholder). later calls overwrite earlier ones
function buildIsMajorByColumn(didMountSpy: jasmine.Spy): { [key: string]: boolean } {
  let isMajorByColumn = {}

  for (let [info] of didMountSpy.calls.allArgs()) {
    let key = formatIsoDay(info.date) + ':' + (info.resource ? info.resource.id : '')
    isMajorByColumn[key] = info.isMajor
  }

  return isMajorByColumn
}

/*
DRY with filterResourcesWithEvents-perDate.ts. The bottom header row has one colSpan-1 cell
per column, so cells in the rows above must match the widths of the cells they span
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
