import * as vdom from 'fullcalendar/preact'
import { CalendarOptions } from 'fullcalendar'
import { DayGridViewWrapper } from '../lib/wrappers/DayGridViewWrapper'
import { TimeGridViewWrapper } from '../lib/wrappers/TimeGridViewWrapper'
import { waitFrame, waitTimeout } from '../lib/misc'

/*
Identity locks for the day-table slicing pipeline (planning/phase-7b-day-table-plan.md, section
4.2, "Standard, view-render/day-table-identity.ts"). Each probe re-renders the view body without
changing any slicing input (or with one input change, for drag/add/option), and the render-hook
call counts it causes may go down with the rewrite but never up. The counts were recorded from the
code before phase 7b, per hook and per runtime, with the commit that added this file.

The tick probes first prove they reached the view body: a cell/lane class hook must move, and the
now indicator or today marker must move. The render() probe can't (see its comment): it proves it
reached the events' content hooks instead.
*/

// Preact's module has no Activity. the React build remaps 'fullcalendar/preact' to react
const IS_REACT = Boolean((vdom as any).Activity)

const HOOK_NAMES = [
  'eventClass', 'eventInnerClass', 'rowEventClass', 'columnEventClass', 'eventContent',
  'eventDidMount', 'eventWillUnmount',
  'backgroundEventClass', 'backgroundEventDidMount', 'backgroundEventWillUnmount',
  'dayCellClass', 'dayLaneClass', 'moreLinkClass',
]

const LIFECYCLE_HOOK_NAMES = [
  'eventDidMount', 'eventWillUnmount', 'backgroundEventDidMount', 'backgroundEventWillUnmount',
]

type Counts = { [hookName: string]: number }
type Recorded = { [hookName: string]: number | { preact: number, react: number } }

// 20 events in the week of Jan 14-20, 2024: two timed a day (overlapping on the 17th, for a
// timeGrid more-link), three all-day, one multi-day, a timed and an all-day background
const EVENTS = buildEvents()

const BASE_OPTIONS: CalendarOptions = {
  timeZone: 'UTC',
  initialDate: '2024-01-17',
  scrollTime: '08:00',
  height: 700,
  editable: true,
  selectable: true,
  selectMirror: true,
  nowIndicator: true,
  dayMaxEvents: 3, // the 17th has four events in dayGridMonth, so a more-link
  eventMaxStack: 1, // the 17th's overlapping timed events make a timeGrid more-link
  events: EVENTS,
}

/*
Recorded per hook from today's code. A value may be one number, or one per runtime
*/
const RECORDED: { [viewType: string]: { [probe: string]: Recorded } } = {
  dayGridMonth: {
    // nothing in the view re-executes: CalendarInner is a PureComponent and the props are the
    // same. only eventContent re-runs, through the RenderId bump that CustomContent subscribes to
    render: {
      eventClass: 0, eventInnerClass: 0, rowEventClass: 0, columnEventClass: 0, eventContent: 17,
      eventDidMount: 0, eventWillUnmount: 0,
      backgroundEventClass: 0, backgroundEventDidMount: 0, backgroundEventWillUnmount: 0,
      dayCellClass: 0, dayLaneClass: 0, moreLinkClass: 0,
    },
    // every row re-renders with the new todayRange; the events of the two flipped days re-run
    // their class and content hooks (isToday changes)
    dayTick: {
      eventClass: 4, eventInnerClass: 4, rowEventClass: 1, columnEventClass: 0, eventContent: 4,
      eventDidMount: 0, eventWillUnmount: 0,
      backgroundEventClass: 1, backgroundEventDidMount: 0, backgroundEventWillUnmount: 0,
      dayCellClass: 42, dayLaneClass: 0, moreLinkClass: 1,
    },
    // the dragged event's row re-renders per pointer move. no mirror: dayGrid highlights a drag
    drag: {
      eventClass: 2, eventInnerClass: 2, rowEventClass: 0, columnEventClass: 0, eventContent: 2,
      eventDidMount: 0, eventWillUnmount: 0,
      backgroundEventClass: 0, backgroundEventDidMount: 0, backgroundEventWillUnmount: 0,
      dayCellClass: 168, dayLaneClass: 0, moreLinkClass: 4,
    },
    // a store change rebuilds every seg of the view
    addEvent: {
      eventClass: 18, eventInnerClass: 18, rowEventClass: 4, columnEventClass: 0, eventContent: 1,
      eventDidMount: 1, eventWillUnmount: 0,
      backgroundEventClass: 1, backgroundEventDidMount: 0, backgroundEventWillUnmount: 0,
      dayCellClass: 49, dayLaneClass: 0, moreLinkClass: 1,
    },
    // a new context re-renders everything, without remounting
    option: {
      eventClass: 17, eventInnerClass: 17, rowEventClass: 4, columnEventClass: 0, eventContent: 17,
      eventDidMount: 0, eventWillUnmount: 0,
      backgroundEventClass: 1, backgroundEventDidMount: 0, backgroundEventWillUnmount: 0,
      dayCellClass: 42, dayLaneClass: 0, moreLinkClass: 1,
    },
  },
  timeGridWeek: {
    // as for dayGridMonth: only eventContent, through RenderId
    render: {
      eventClass: 0, eventInnerClass: 0, rowEventClass: 0, columnEventClass: 0, eventContent: 18,
      eventDidMount: 0, eventWillUnmount: 0,
      backgroundEventClass: 0, backgroundEventDidMount: 0, backgroundEventWillUnmount: 0,
      dayCellClass: 0, dayLaneClass: 0, moreLinkClass: 0,
    },
    // every column re-renders (new nowDate and now-indicator segs), no event hook re-runs
    minuteTick: {
      eventClass: 0, eventInnerClass: 0, rowEventClass: 0, columnEventClass: 0, eventContent: 0,
      eventDidMount: 0, eventWillUnmount: 0,
      backgroundEventClass: 0, backgroundEventDidMount: 0, backgroundEventWillUnmount: 0,
      dayCellClass: 7, dayLaneClass: 7, moreLinkClass: 1,
    },
    // eventDidMount: the drag mirror. eventWillUnmount: the selection mirror (the drag start
    // unselects) and the drag mirror
    drag: {
      eventClass: 22, eventInnerClass: 22, rowEventClass: 4, columnEventClass: 18, eventContent: 6,
      eventDidMount: 1, eventWillUnmount: 2,
      backgroundEventClass: 3, backgroundEventDidMount: 0, backgroundEventWillUnmount: 0,
      dayCellClass: 7, dayLaneClass: 49, moreLinkClass: 7,
    },
    // QUIRK: the selection mirror remounts (1 of the 2 eventDidMount, the eventWillUnmount): a
    // store change rebuilds eventUiBases, a dependency of the selection slice, which re-fabricates
    // the selection's instance id. the other eventDidMount is the added event
    addEvent: {
      eventClass: 19, eventInnerClass: 19, rowEventClass: 4, columnEventClass: 15, eventContent: 2,
      eventDidMount: 2, eventWillUnmount: 1,
      backgroundEventClass: 3, backgroundEventDidMount: 0, backgroundEventWillUnmount: 0,
      dayCellClass: 7, dayLaneClass: 7, moreLinkClass: 1,
    },
    // QUIRK: the selection mirror remounts here too: the selection slice depends on the context,
    // which an option change replaces
    option: {
      eventClass: 18, eventInnerClass: 18, rowEventClass: 4, columnEventClass: 14, eventContent: 18,
      eventDidMount: 1, eventWillUnmount: 1,
      backgroundEventClass: 3, backgroundEventDidMount: 0, backgroundEventWillUnmount: 0,
      dayCellClass: 7, dayLaneClass: 7, moreLinkClass: 1,
    },
  },
}

describe('day-table identity', () => {
  describe('dayGridMonth', () => {
    const viewOptions: CalendarOptions = {
      ...BASE_OPTIONS,
      initialView: 'dayGridMonth',
    }
    const recorded = RECORDED.dayGridMonth

    // an all-day selection, a highlight (no mirror in dayGrid)
    function select(calendar) {
      calendar.select('2024-01-23', '2024-01-25')
    }

    /*
    Vanilla's render() re-renders the root with the same data. Today that never re-executes the
    view body (CalendarInner is a PureComponent with equal props), so no cell hook can prove the
    probe reached it; what it does reach is CustomContent's RenderId subscription, so the proof is
    eventContent re-running. Locked as a no-remount, no-class-hook probe
    */
    it('calendar.render() re-runs eventContent only, without lifecycle calls', async () => {
      const { calendar, counts } = await initCounted(viewOptions, select)

      calendar.render()
      await waitTimeout(200)

      expect(counts.eventContent || 0).withContext('probe reached the events').toBeGreaterThan(0)
      expectCountsWithin(counts, recorded.render, LIFECYCLE_HOOK_NAMES)
    })

    // useNow('day') re-renders the body with a new todayRange while every slicing input is unchanged
    it('a day tick across midnight re-executes the view body without lifecycle calls', async () => {
      jasmine.clock().install()
      jasmine.clock().mockDate(new Date('2024-01-17T23:59:00Z'))

      try {
        const { calendar, counts } = await initCounted(viewOptions, select, true)
        const dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid

        expect(getTodayDates(dayGridWrapper)).toEqual(['2024-01-17'])

        jasmine.clock().tick(2 * 60 * 1000)
        await settleWithMockClock()

        expect(getTodayDates(dayGridWrapper)).withContext('probe reached the body').toEqual(['2024-01-18'])
        expect(counts.dayCellClass || 0).withContext('probe reached the body').toBeGreaterThan(0)
        expectCountsWithin(counts, recorded.dayTick, LIFECYCLE_HOOK_NAMES)
      } finally {
        jasmine.clock().uninstall()
      }
    })

    // a drag within the event's own cell: a highlight during the drag, no date change on drop
    it('dragging an event', async () => {
      const { calendar, counts } = await initCounted(viewOptions, select)
      const eventEl = new DayGridViewWrapper(calendar).dayGrid.getEventEls()[0]

      await simulateDrag(eventEl, { dx: 0, dy: 25 })
      await waitTimeout(200)

      expectCountsWithin(counts, recorded.drag, LIFECYCLE_HOOK_NAMES)
    })

    it('adding an event', async () => {
      const { calendar, counts } = await initCounted(viewOptions, select)

      calendar.addEvent({ title: 'Added', start: '2024-01-24T16:00:00', end: '2024-01-24T17:00:00' })
      await waitTimeout(200)

      expectCountsWithin(counts, recorded.addEvent)
    })

    it('an unrelated option change', async () => {
      const { calendar, counts } = await initCounted(viewOptions, select)

      calendar.setOption('dragScroll', false)
      await waitTimeout(200)

      expectCountsWithin(counts, recorded.option)
    })
  })

  describe('timeGridWeek', () => {
    const viewOptions: CalendarOptions = {
      ...BASE_OPTIONS,
      initialView: 'timeGridWeek',
    }
    const recorded = RECORDED.timeGridWeek

    // a timed selection, rendered as a mirror event (selectMirror) with a fabricated instance
    function select(calendar) {
      calendar.select('2024-01-17T15:00:00Z', '2024-01-17T16:00:00Z')
    }

    // see the dayGridMonth probe
    it('calendar.render() re-runs eventContent only, without lifecycle calls', async () => {
      const { calendar, counts } = await initCounted(viewOptions, select)

      calendar.render()
      await waitTimeout(200)

      expect(counts.eventContent || 0).withContext('probe reached the events').toBeGreaterThan(0)
      expectCountsWithin(counts, recorded.render, LIFECYCLE_HOOK_NAMES)
    })

    // useNow('minute') (nowIndicator) re-renders the body with a new nowDate while every slicing
    // input is unchanged. the now indicator's segs are rebuilt every render today
    it('a minute tick re-executes the view body without lifecycle calls', async () => {
      jasmine.clock().install()
      jasmine.clock().mockDate(new Date('2024-01-17T10:15:30Z'))

      try {
        const { calendar, counts } = await initCounted(viewOptions, select, true)
        const timeGridWrapper = new TimeGridViewWrapper(calendar).timeGrid
        const lineTopBefore = timeGridWrapper.getNowIndicatorLineEl().getBoundingClientRect().top

        jasmine.clock().tick(60 * 1000)
        await settleWithMockClock()

        const lineTopAfter = timeGridWrapper.getNowIndicatorLineEl().getBoundingClientRect().top
        expect(lineTopAfter).withContext('probe reached the body').toBeGreaterThan(lineTopBefore)
        expect(counts.dayLaneClass || 0).withContext('probe reached the body').toBeGreaterThan(0)
        expectCountsWithin(counts, recorded.minuteTick, LIFECYCLE_HOOK_NAMES)
      } finally {
        jasmine.clock().uninstall()
      }
    })

    // a timed event dragged an hour down its own column: a mirror in the column during the drag.
    // the drag start unselects the date selection, so its mirror unmounts
    it('dragging an event', async () => {
      const { calendar, counts } = await initCounted(viewOptions, select)
      const eventEl = new TimeGridViewWrapper(calendar).timeGrid.getEventEls()[0]

      await simulateDrag(eventEl, { dx: 0, dy: 60 })
      await waitTimeout(200)

      expectCountsWithin(counts, recorded.drag, LIFECYCLE_HOOK_NAMES)
    })

    it('adding an event', async () => {
      const { calendar, counts } = await initCounted(viewOptions, select)

      calendar.addEvent({ title: 'Added', start: '2024-01-18T16:00:00', end: '2024-01-18T17:00:00' })
      await waitTimeout(200)

      expectCountsWithin(counts, recorded.addEvent)
    })

    it('an unrelated option change', async () => {
      const { calendar, counts } = await initCounted(viewOptions, select)

      calendar.setOption('dragScroll', false)
      await waitTimeout(200)

      expectCountsWithin(counts, recorded.option)
    })
  })
})

// Utils
// -------------------------------------------------------------------------------------------------

/*
Renders the calendar with counting hooks, applies the selection, lets layout settle, then clears
the counts so only the probe's calls are counted. With the mock clock installed, settles through
animation frames and clock ticks, since timeouts are mocked
*/
async function initCounted(
  options: CalendarOptions,
  select: (calendar) => void,
  usesMockClock = false,
) {
  const counts: Counts = {}
  const calendar = initCalendar({
    ...options,
    ...buildCountingOptions(counts),
  })

  select(calendar)

  if (usesMockClock) {
    await settleWithMockClock()
  } else {
    await waitTimeout(200)
  }

  for (const name of Object.keys(counts)) {
    delete counts[name]
  }

  return { calendar, counts }
}

// counting hooks that don't change the output: '' classes, `true` content, no-op lifecycle
function buildCountingOptions(counts: Counts): CalendarOptions {
  const options: CalendarOptions = {}

  for (const name of HOOK_NAMES) {
    if (/Content$/.test(name)) {
      options[name] = () => {
        counts[name] = (counts[name] || 0) + 1
        return true
      }
    } else if (/Class$/.test(name)) {
      options[name] = () => {
        counts[name] = (counts[name] || 0) + 1
        return ''
      }
    } else {
      options[name] = () => {
        counts[name] = (counts[name] || 0) + 1
      }
    }
  }

  return options
}

// each hook at most its recorded count. `exactNames` must match exactly (zero lifecycle calls)
function expectCountsWithin(counts: Counts, recorded: Recorded, exactNames: string[] = []) {
  for (const name of HOOK_NAMES) {
    const actual = counts[name] || 0
    const limit = resolveRecorded(recorded[name])

    if (exactNames.includes(name)) {
      expect(actual).withContext(name).toBe(limit)
    } else {
      expect(actual).withContext(name).toBeLessThanOrEqual(limit)
    }
  }
}

function resolveRecorded(value: number | { preact: number, react: number }): number {
  if (typeof value === 'number') {
    return value
  }
  return IS_REACT ? value.react : value.preact
}

async function settleWithMockClock() {
  for (let i = 0; i < 6; i += 1) {
    await waitFrame()
    jasmine.clock().tick(10)
  }
}

function getTodayDates(dayGridWrapper): string[] {
  return dayGridWrapper.getAllDayEls()
    .filter((el) => el.classList.contains('fc-day-today'))
    .map((el) => el.getAttribute('data-date'))
}

function simulateDrag(el: HTMLElement, delta: { dx: number, dy: number }) {
  return new Promise<void>((resolve) => {
    $(el).simulate('drag', {
      dx: delta.dx,
      dy: delta.dy,
      onRelease: () => resolve(),
    })
  })
}

function buildEvents() {
  const events = []

  for (let day = 14; day <= 20; day += 1) {
    const dayStr = `2024-01-${day}`
    const secondStart = day === 17 ? '09:30:00' : '13:00:00' // overlaps the first on the 17th

    events.push(
      { title: `Morning ${day}`, start: `${dayStr}T09:00:00`, end: `${dayStr}T10:30:00` },
      { title: `Second ${day}`, start: `${dayStr}T${secondStart}`, end: `${dayStr}T14:00:00` },
    )
  }

  events.push(
    { title: 'All-day 15', start: '2024-01-15' },
    { title: 'All-day 17', start: '2024-01-17' },
    { title: 'All-day 19', start: '2024-01-19' },
    { title: 'Multi-day', start: '2024-01-16', end: '2024-01-19' },
    { title: 'Timed bg', start: '2024-01-17T11:00:00', end: '2024-01-17T12:00:00', display: 'background' },
    { title: 'All-day bg', start: '2024-01-18', display: 'background' },
  )

  return events
}
