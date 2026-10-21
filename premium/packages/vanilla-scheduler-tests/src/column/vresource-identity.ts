import { Calendar, CalendarOptions } from 'fullcalendar'
import * as vdom from 'fullcalendar/preact'
import { ignoreResizeObserverLoops, waitFrame, waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { ResourceTimeGridViewWrapper } from '../lib/wrappers/ResourceTimeGridViewWrapper'
import { ResourceDayGridViewWrapper } from '../lib/wrappers/ResourceDayGridViewWrapper'

/*
Identity locks for the day-table pipeline (planning/phase-7b-day-table-plan.md §4.2): how often each
render hook runs when a resource day view re-renders for reasons that leave its event segs the
same, or change only part of them. The counts are today's, recorded per runtime (Preact and React
order commits differently); the replacement pipeline may make them drop, never rise. Zero lifecycle
calls where today has zero are exact locks: a mirror that keeps its instance id is never remounted.
*/

const DAY_1 = '2016-12-04' // Sunday
const RESOURCE_IDS = ['a', 'b', 'c', 'd']

const HOOK_NAMES = [
  'eventClass', 'eventInnerClass', 'eventTitleClass', 'eventTimeClass',
  'rowEventClass', 'columnEventClass', 'blockEventClass',
  'eventContent', 'eventDidMount', 'eventWillUnmount',
  'backgroundEventClass', 'backgroundEventContent', 'backgroundEventDidMount', 'backgroundEventWillUnmount',
  'dayCellClass', 'dayCellDidMount', 'dayCellWillUnmount',
  'dayLaneClass', 'dayLaneDidMount', 'dayLaneWillUnmount',
  'dayHeaderClass', 'resourceDayHeaderClass', 'moreLinkClass', 'nowIndicatorLineClass',
]

type CallCounts = { [hookName: string]: number }

const isReact = Boolean((vdom as any)['create' + 'Root']) // the test-only React build exports createRoot

/*
Recorded from today's code. Keyed by runtime, view and probe. A missing entry fails the spec with
the actual counts in the message, for recording.
*/
const RECORDED: { [runtime: string]: { [view: string]: { [probe: string]: CallCounts } } } = {
  preact: {
    resourceTimeGridWeek: {
      'render': { eventContent: 21 },
      'minute-tick': { dayCellClass: 28, dayHeaderClass: 28, dayLaneClass: 28, nowIndicatorLineClass: 4, resourceDayHeaderClass: 4 },
      'rename': { blockEventClass: 22, columnEventClass: 17, dayCellClass: 28, dayHeaderClass: 28, dayLaneClass: 28, eventClass: 22, eventContent: 22, eventInnerClass: 22, eventTimeClass: 22, eventTitleClass: 22, nowIndicatorLineClass: 4, resourceDayHeaderClass: 5, rowEventClass: 5 },
      'other-ui': { blockEventClass: 22, columnEventClass: 17, dayCellClass: 28, dayHeaderClass: 28, dayLaneClass: 28, eventClass: 22, eventContent: 22, eventInnerClass: 22, eventTimeClass: 22, eventTitleClass: 22, nowIndicatorLineClass: 4, resourceDayHeaderClass: 4, rowEventClass: 5 },
      'other-business-hours': { blockEventClass: 22, columnEventClass: 17, dayCellClass: 28, dayHeaderClass: 28, dayLaneClass: 28, eventClass: 22, eventContent: 22, eventInnerClass: 22, eventTimeClass: 22, eventTitleClass: 22, nowIndicatorLineClass: 4, resourceDayHeaderClass: 4, rowEventClass: 5 },
      'fallback-leave': { blockEventClass: 1, columnEventClass: 1, dayCellClass: 3, dayCellDidMount: 1, dayCellWillUnmount: 6, dayHeaderClass: 2, dayLaneClass: 1, dayLaneDidMount: 1, dayLaneWillUnmount: 6, eventClass: 1, eventContent: 1, eventDidMount: 1, eventInnerClass: 1, eventTimeClass: 1, eventTitleClass: 1, resourceDayHeaderClass: 2 },
      'fallback-enter': { dayCellClass: 18, dayCellDidMount: 6, dayCellWillUnmount: 1, dayHeaderClass: 12, dayLaneClass: 6, dayLaneDidMount: 6, dayLaneWillUnmount: 1, eventWillUnmount: 1, nowIndicatorLineClass: 1 },
      'drag': { blockEventClass: 28, columnEventClass: 23, dayCellClass: 28, dayLaneClass: 224, eventClass: 28, eventContent: 8, eventDidMount: 6, eventInnerClass: 28, eventTimeClass: 28, eventTitleClass: 28, eventWillUnmount: 6, nowIndicatorLineClass: 32, rowEventClass: 5 },
      'add-event': { blockEventClass: 22, columnEventClass: 17, dayCellClass: 28, dayLaneClass: 28, eventClass: 22, eventContent: 1, eventDidMount: 1, eventInnerClass: 22, eventTimeClass: 22, eventTitleClass: 22, nowIndicatorLineClass: 4, rowEventClass: 5 },
      'unrelated-option': { blockEventClass: 21, columnEventClass: 16, dayCellClass: 28, dayHeaderClass: 28, dayLaneClass: 28, eventClass: 21, eventContent: 21, eventInnerClass: 21, eventTimeClass: 21, eventTitleClass: 21, nowIndicatorLineClass: 4, resourceDayHeaderClass: 4, rowEventClass: 5 },
    },
    resourceDayGridWeek: {
      'render': { eventContent: 21 },
      'day-tick': { blockEventClass: 2, dayCellClass: 28, dayHeaderClass: 28, eventClass: 6, eventContent: 6, eventInnerClass: 6, eventTimeClass: 6, eventTitleClass: 6, resourceDayHeaderClass: 4, rowEventClass: 2 },
      'rename': { blockEventClass: 5, dayCellClass: 28, dayHeaderClass: 28, eventClass: 21, eventContent: 21, eventInnerClass: 21, eventTimeClass: 21, eventTitleClass: 21, resourceDayHeaderClass: 5, rowEventClass: 5 },
      'other-ui': { blockEventClass: 5, dayCellClass: 28, dayHeaderClass: 28, eventClass: 21, eventContent: 21, eventInnerClass: 21, eventTimeClass: 21, eventTitleClass: 21, resourceDayHeaderClass: 4, rowEventClass: 5 },
      'other-business-hours': { blockEventClass: 5, dayCellClass: 28, dayHeaderClass: 28, eventClass: 21, eventContent: 21, eventInnerClass: 21, eventTimeClass: 21, eventTitleClass: 21, resourceDayHeaderClass: 4, rowEventClass: 5 },
      'fallback-leave': { dayCellClass: 2, dayCellDidMount: 1, dayCellWillUnmount: 6, dayHeaderClass: 2, eventClass: 1, eventContent: 1, eventDidMount: 1, eventInnerClass: 1, eventTimeClass: 1, eventTitleClass: 1, resourceDayHeaderClass: 2 },
      'fallback-enter': { dayCellClass: 12, dayCellDidMount: 6, dayCellWillUnmount: 1, dayHeaderClass: 12, eventWillUnmount: 1 },
      'drag': { blockEventClass: 5, dayCellClass: 280, eventClass: 23, eventContent: 3, eventDidMount: 1, eventInnerClass: 23, eventTimeClass: 23, eventTitleClass: 23, eventWillUnmount: 1, rowEventClass: 5 },
      'add-event': { blockEventClass: 5, dayCellClass: 56, eventClass: 22, eventContent: 1, eventDidMount: 1, eventInnerClass: 22, eventTimeClass: 22, eventTitleClass: 22, rowEventClass: 5 },
      'unrelated-option': { blockEventClass: 5, dayCellClass: 28, dayHeaderClass: 28, eventClass: 21, eventContent: 21, eventInnerClass: 21, eventTimeClass: 21, eventTitleClass: 21, resourceDayHeaderClass: 4, rowEventClass: 5 },
    },
  },
  react: {
    resourceTimeGridWeek: {
      'render': { eventContent: 21 },
      'minute-tick': { dayCellClass: 28, dayHeaderClass: 28, dayLaneClass: 28, nowIndicatorLineClass: 4, resourceDayHeaderClass: 4 },
      'rename': { blockEventClass: 22, columnEventClass: 17, dayCellClass: 28, dayHeaderClass: 28, dayLaneClass: 28, eventClass: 22, eventContent: 22, eventInnerClass: 22, eventTimeClass: 22, eventTitleClass: 22, nowIndicatorLineClass: 4, resourceDayHeaderClass: 5, rowEventClass: 5 },
      'other-ui': { blockEventClass: 22, columnEventClass: 17, dayCellClass: 28, dayHeaderClass: 28, dayLaneClass: 28, eventClass: 22, eventContent: 22, eventInnerClass: 22, eventTimeClass: 22, eventTitleClass: 22, nowIndicatorLineClass: 4, resourceDayHeaderClass: 4, rowEventClass: 5 },
      'other-business-hours': { blockEventClass: 22, columnEventClass: 17, dayCellClass: 28, dayHeaderClass: 28, dayLaneClass: 28, eventClass: 22, eventContent: 22, eventInnerClass: 22, eventTimeClass: 22, eventTitleClass: 22, nowIndicatorLineClass: 4, resourceDayHeaderClass: 4, rowEventClass: 5 },
      'fallback-leave': { blockEventClass: 1, columnEventClass: 1, dayCellClass: 2, dayCellDidMount: 1, dayCellWillUnmount: 6, dayHeaderClass: 2, dayLaneClass: 1, dayLaneDidMount: 1, dayLaneWillUnmount: 6, eventClass: 1, eventContent: 1, eventDidMount: 1, eventInnerClass: 1, eventTimeClass: 1, eventTitleClass: 1, resourceDayHeaderClass: 2 },
      'fallback-enter': { dayCellClass: 12, dayCellDidMount: 6, dayCellWillUnmount: 1, dayHeaderClass: 12, dayLaneClass: 6, dayLaneDidMount: 6, dayLaneWillUnmount: 1, eventWillUnmount: 1, nowIndicatorLineClass: 1 },
      'drag': { blockEventClass: 28, columnEventClass: 23, dayCellClass: 28, dayLaneClass: 224, eventClass: 28, eventContent: 8, eventDidMount: 6, eventInnerClass: 28, eventTimeClass: 28, eventTitleClass: 28, eventWillUnmount: 6, nowIndicatorLineClass: 32, rowEventClass: 5 },
      'add-event': { blockEventClass: 22, columnEventClass: 17, dayCellClass: 28, dayLaneClass: 28, eventClass: 22, eventContent: 1, eventDidMount: 1, eventInnerClass: 22, eventTimeClass: 22, eventTitleClass: 22, nowIndicatorLineClass: 4, rowEventClass: 5 },
      'unrelated-option': { blockEventClass: 21, columnEventClass: 16, dayCellClass: 28, dayHeaderClass: 28, dayLaneClass: 28, eventClass: 21, eventContent: 21, eventInnerClass: 21, eventTimeClass: 21, eventTitleClass: 21, nowIndicatorLineClass: 4, resourceDayHeaderClass: 4, rowEventClass: 5 },
    },
    resourceDayGridWeek: {
      'render': { eventContent: 21 },
      'day-tick': { blockEventClass: 2, dayCellClass: 28, dayHeaderClass: 28, eventClass: 6, eventContent: 6, eventInnerClass: 6, eventTimeClass: 6, eventTitleClass: 6, resourceDayHeaderClass: 4, rowEventClass: 2 },
      'rename': { blockEventClass: 5, dayCellClass: 28, dayHeaderClass: 28, eventClass: 21, eventContent: 21, eventInnerClass: 21, eventTimeClass: 21, eventTitleClass: 21, resourceDayHeaderClass: 5, rowEventClass: 5 },
      'other-ui': { blockEventClass: 5, dayCellClass: 28, dayHeaderClass: 28, eventClass: 21, eventContent: 21, eventInnerClass: 21, eventTimeClass: 21, eventTitleClass: 21, resourceDayHeaderClass: 4, rowEventClass: 5 },
      'other-business-hours': { blockEventClass: 5, dayCellClass: 28, dayHeaderClass: 28, eventClass: 21, eventContent: 21, eventInnerClass: 21, eventTimeClass: 21, eventTitleClass: 21, resourceDayHeaderClass: 4, rowEventClass: 5 },
      'fallback-leave': { dayCellClass: 2, dayCellDidMount: 1, dayCellWillUnmount: 6, dayHeaderClass: 2, eventClass: 1, eventContent: 1, eventDidMount: 1, eventInnerClass: 1, eventTimeClass: 1, eventTitleClass: 1, resourceDayHeaderClass: 2 },
      'fallback-enter': { dayCellClass: 12, dayCellDidMount: 6, dayCellWillUnmount: 1, dayHeaderClass: 12, eventWillUnmount: 1 },
      'drag': { blockEventClass: 5, dayCellClass: 252, eventClass: 23, eventContent: 3, eventDidMount: 1, eventInnerClass: 23, eventTimeClass: 23, eventTitleClass: 23, eventWillUnmount: 1, rowEventClass: 5 },
      'add-event': { blockEventClass: 5, dayCellClass: 56, eventClass: 22, eventContent: 1, eventDidMount: 1, eventInnerClass: 22, eventTimeClass: 22, eventTitleClass: 22, rowEventClass: 5 },
      'unrelated-option': { blockEventClass: 5, dayCellClass: 28, dayHeaderClass: 28, eventClass: 21, eventContent: 21, eventInnerClass: 21, eventTimeClass: 21, eventTitleClass: 21, resourceDayHeaderClass: 4, rowEventClass: 5 },
    },
  },
}

describe('vresource identity', () => {
  pushOptions({
    initialDate: DAY_1,
    timeZone: 'UTC',
    scrollTime: '00:00',
    height: 700,
    editable: true,
    selectable: true,
    selectMirror: true,
    nowIndicator: true,
    dragRevertDuration: 0,
    resourceOrder: 'id',
    resources: RESOURCE_IDS.map((id) => ({ id, title: 'Resource ' + id.toUpperCase() })),
    events: buildEvents(),
  })

  describeValues({
    resourceTimeGridWeek: 'resourceTimeGridWeek',
    resourceDayGridWeek: 'resourceDayGridWeek',
  }, (viewType: string) => {
    const isTimeGrid = viewType === 'resourceTimeGridWeek'
    const recordedForView = () => (RECORDED[isReact ? 'react' : 'preact'][viewType] || {})

    pushOptions({
      initialView: viewType,
    })

    // a fixed now for the specs that don't tick the clock ($.extend ignores undefined, so the
    // clock specs can't unset it; they just don't set it)
    const NOW_OPTIONS = { now: DAY_1 + 'T10:15:00' }

    // re-render probes: the view body runs again with the same inputs
    // ---------------------------------------------------------------------------------------------

    it('calls no more hooks than recorded on a plain re-render', async () => {
      await ignoreResizeObserverLoops(async () => {
        let counts: CallCounts = {}
        let calendar = initCalendar({ ...buildCountingOptions(counts), ...NOW_OPTIONS })

        await waitTimeout(200)
        resetCounts(counts)
        calendar.render()
        await waitTimeout(200)

        expectCountsAtMost(counts, recordedForView().render, viewType + ' render')
      })
    })

    if (isTimeGrid) {
      // the now indicator subscribes to the minute, so a minute tick re-renders the view body
      // (proven by dayLaneClass running again) with every seg input unchanged
      it('calls no more hooks than recorded on a minute tick', async () => {
        await ignoreResizeObserverLoops(async () => {
          let counts: CallCounts = {}

          jasmine.clock().install()
          jasmine.clock().mockDate(new Date(DAY_1 + 'T10:15:00Z'))
          try {
            initCalendar(buildCountingOptions(counts))

            await settleWithMockedClock()
            resetCounts(counts)
            jasmine.clock().tick(60 * 1000)
            await settleWithMockedClock()

            expect(counts.nowIndicatorLineClass || 0).withContext('the now indicator moved').toBeGreaterThan(0)
            expect(counts.dayLaneClass || 0).withContext('the probe reached the view body').toBeGreaterThan(0)
            expectCountsAtMost(counts, recordedForView()['minute-tick'], viewType + ' minute-tick')
          } finally {
            jasmine.clock().uninstall()
          }
        })
      })
    } else {
      // dayGrid subscribes to the day, so only a day change re-renders its body (proven by
      // dayCellClass running again, for the cells whose isToday flips)
      it('calls no more hooks than recorded on a day tick', async () => {
        await ignoreResizeObserverLoops(async () => {
          let counts: CallCounts = {}

          jasmine.clock().install()
          jasmine.clock().mockDate(new Date(DAY_1 + 'T23:59:30Z'))
          try {
            let calendar = initCalendar(buildCountingOptions(counts))

            await settleWithMockedClock()
            resetCounts(counts)
            jasmine.clock().tick(60 * 1000)
            await settleWithMockedClock()

            expect(calendar.getCurrentData().nowDate.toISOString().slice(0, 10)).toBe('2016-12-05')
            expect(counts.dayCellClass || 0).withContext('the probe reached the view body').toBeGreaterThan(0)
            expectCountsAtMost(counts, recordedForView()['day-tick'], viewType + ' day-tick')
          } finally {
            jasmine.clock().uninstall()
          }
        })
      })
    }

    // resource changes that leave the per-resource inputs alone
    // ---------------------------------------------------------------------------------------------

    // a rename replaces the Resource object but keeps its ui and businessHours references. The
    // selection mirror keeps its fabricated instance id: no event is remounted
    it('remounts nothing and calls no more hooks than recorded when a resource is renamed', async () => {
      await ignoreResizeObserverLoops(async () => {
        let counts: CallCounts = {}
        let calendar = initCalendar({ ...buildCountingOptions(counts), ...NOW_OPTIONS })

        await waitTimeout(200)
        selectInResource(calendar, isTimeGrid, 'b')
        await waitTimeout()

        expect(getMirrorCount(calendar)).toBe(isTimeGrid ? 1 : 0) // dayGrid has no selection mirror
        resetCounts(counts)
        calendar.getResourceById('b').setProp('title', 'Resource B2')
        await waitTimeout(200)

        expect(getHeaderResourceTitles(calendar, isTimeGrid)).toContain('Resource B2')
        expect(counts.eventDidMount || 0).toBe(0)
        expect(counts.eventWillUnmount || 0).toBe(0)
        expectCountsAtMost(counts, recordedForView().rename, viewType + ' rename')
      })
    })

    // re-adding a resource with the same id re-parses only it (its ui reference changes), while
    // the other resources keep their objects. setProp('eventColor') is not a UI change: it writes
    // the raw property without re-parsing ui
    it('remounts nothing and calls no more hooks than recorded when another resource\'s UI is replaced', async () => {
      await ignoreResizeObserverLoops(async () => {
        let counts: CallCounts = {}
        let calendar = initCalendar({ ...buildCountingOptions(counts), ...NOW_OPTIONS })

        await waitTimeout(200)
        selectInResource(calendar, isTimeGrid, 'b')
        await waitTimeout()

        let prevA = getInternalResource(calendar, 'a')
        let prevB = getInternalResource(calendar, 'b')

        resetCounts(counts)
        calendar.addResource({ id: 'a', title: 'Resource A', eventColor: 'red' }, false)
        await waitTimeout(200)

        // the precondition: a was re-parsed, b was not
        let nextA = getInternalResource(calendar, 'a')

        expect(nextA).not.toBe(prevA)
        expect(nextA.ui).not.toBe(prevA.ui)
        expect(getInternalResource(calendar, 'b')).toBe(prevB)
        expect(getEventColorsInResource(calendar, 'a')).toEqual(['red'])

        expect(counts.eventDidMount || 0).toBe(0)
        expect(counts.eventWillUnmount || 0).toBe(0)
        expectCountsAtMost(counts, recordedForView()['other-ui'], viewType + ' other-ui')
      })
    })

    it('remounts nothing and calls no more hooks than recorded when another resource\'s business hours are replaced', async () => {
      await ignoreResizeObserverLoops(async () => {
        let counts: CallCounts = {}
        let calendar = initCalendar({ ...buildCountingOptions(counts), ...NOW_OPTIONS, businessHours: true })

        await waitTimeout(200)
        selectInResource(calendar, isTimeGrid, 'b')
        await waitTimeout()

        let prevB = getInternalResource(calendar, 'b')

        resetCounts(counts)
        calendar.addResource({
          id: 'a',
          title: 'Resource A',
          businessHours: { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: '02:00', endTime: '22:00' },
        }, false)
        await waitTimeout(200)

        expect(getInternalResource(calendar, 'b')).toBe(prevB)
        expect(counts.eventDidMount || 0).toBe(0)
        expect(counts.eventWillUnmount || 0).toBe(0)
        expectCountsAtMost(counts, recordedForView()['other-business-hours'], viewType + ' other-business-hours')
      })
    })

    // the all-columns-filtered fallback, entered and left
    // ---------------------------------------------------------------------------------------------

    // every resource's events are on an interior hidden day, so all survive view-wide filtering
    // and none earns a column: the model falls back to plain columns and the participating key
    // set empties. Counts only: the mirror remounts either way, so this can't tell an evicted
    // cache entry from a retained one
    it('calls no more hooks than recorded when leaving and entering the fallback', async () => {
      await ignoreResizeObserverLoops(async () => {
        let counts: CallCounts = {}
        let calendar = initCalendar({
          ...buildCountingOptions(counts),
          ...NOW_OPTIONS,
          filterResourcesWithEvents: true,
          hiddenDays: [3], // Wednesday
          events: RESOURCE_IDS.map((id) => ({
            title: 'Hidden ' + id,
            start: '2016-12-07T02:00:00',
            end: '2016-12-07T03:00:00',
            resourceId: id,
          })),
        })

        await waitTimeout(200)
        expect(calendar.el.querySelectorAll('[data-resource-id]').length).toBe(0) // the fallback
        selectInResource(calendar, isTimeGrid, 'b')
        await waitTimeout()

        resetCounts(counts)
        let event = calendar.addEvent({ title: 'Thursday', start: '2016-12-08T02:00:00', end: '2016-12-08T03:00:00', resourceId: 'a' })
        await waitTimeout(200)

        expect(calendar.el.querySelectorAll('[data-resource-id="a"]').length).toBeGreaterThan(0) // left it
        expectCountsAtMost(counts, recordedForView()['fallback-leave'], viewType + ' fallback-leave')

        resetCounts(counts)
        event.remove()
        await waitTimeout(200)

        expect(calendar.el.querySelectorAll('[data-resource-id]').length).toBe(0) // back in it
        expectCountsAtMost(counts, recordedForView()['fallback-enter'], viewType + ' fallback-enter')
      })
    })

    // changes to the data
    // ---------------------------------------------------------------------------------------------

    it('calls no more hooks than recorded during a drag', async () => {
      await ignoreResizeObserverLoops(async () => {
        let counts: CallCounts = {}
        let calendar = initCalendar({ ...buildCountingOptions(counts), ...NOW_OPTIONS })

        await waitTimeout(200)
        let eventEl = calendar.el.querySelector('.event-a-0') as HTMLElement

        resetCounts(counts)
        await simulateElDrag(eventEl, isTimeGrid
          ? new ResourceTimeGridViewWrapper(calendar).timeGrid.getPoint('b', DAY_1 + 'T06:00:00')
          : getElCenter(new ResourceDayGridViewWrapper(calendar).dayGrid.getDayEl('b', '2016-12-05')))
        await waitTimeout(200)

        expect(calendar.getEventById('a-0').getResources()[0].id).toBe('b') // the drop happened
        expectCountsAtMost(counts, recordedForView().drag, viewType + ' drag')
      })
    })

    it('calls no more hooks than recorded when an event is added', async () => {
      await ignoreResizeObserverLoops(async () => {
        let counts: CallCounts = {}
        let calendar = initCalendar({ ...buildCountingOptions(counts), ...NOW_OPTIONS })

        await waitTimeout(200)
        resetCounts(counts)
        calendar.addEvent({ title: 'Added', start: DAY_1 + 'T13:00:00', end: DAY_1 + 'T14:00:00', resourceId: 'b' })
        await waitTimeout(200)

        expectCountsAtMost(counts, recordedForView()['add-event'], viewType + ' add-event')
      })
    })

    it('calls no more hooks than recorded when an unrelated option changes', async () => {
      await ignoreResizeObserverLoops(async () => {
        let counts: CallCounts = {}
        let calendar = initCalendar({ ...buildCountingOptions(counts), ...NOW_OPTIONS })

        await waitTimeout(200)
        resetCounts(counts)
        calendar.setOption('dragScroll', false)
        await waitTimeout(200)

        expectCountsAtMost(counts, recordedForView()['unrelated-option'], viewType + ' unrelated-option')
      })
    })
  })
})

// Utils
// -------------------------------------------------------------------------------------------------

// 20 events across the week of DAY_1: two timed a day, a few all-day and multi-day ones
function buildEvents() {
  let events = []

  for (let day = 0; day < 7; day += 1) {
    let dayStr = '2016-12-' + String(4 + day).padStart(2, '0')
    let resourceId0 = RESOURCE_IDS[day % 4]
    let resourceId1 = RESOURCE_IDS[(day + 1) % 4]

    events.push(
      {
        id: resourceId0 + '-' + day,
        title: 'Morning ' + day,
        className: 'event-' + resourceId0 + '-' + day,
        start: dayStr + 'T02:00:00',
        end: dayStr + 'T03:30:00',
        resourceId: resourceId0,
      },
      {
        id: resourceId1 + '-' + day + '-later',
        title: 'Later ' + day,
        start: dayStr + 'T04:00:00',
        end: dayStr + 'T05:00:00',
        resourceId: resourceId1,
      },
    )

    if (day % 2 === 0) {
      events.push({ title: 'All-day ' + day, start: dayStr, resourceId: RESOURCE_IDS[(day + 2) % 4] })
    }
  }

  events.push(
    { title: 'Multi-day', start: '2016-12-05', end: '2016-12-08', resourceId: 'c' },
    { title: 'Multi-resource', start: '2016-12-06T06:00:00', end: '2016-12-06T07:00:00', resourceIds: ['a', 'd'] },
  )

  return events
}

function buildCountingOptions(counts: CallCounts): CalendarOptions {
  let options: CalendarOptions = {}

  for (let name of HOOK_NAMES) {
    options[name] = /Content$/.test(name)
      ? () => {
        counts[name] = (counts[name] || 0) + 1
        return true
      }
      : /Class$/.test(name)
        ? () => {
          counts[name] = (counts[name] || 0) + 1
          return ''
        }
        : () => {
          counts[name] = (counts[name] || 0) + 1
        }
  }

  return options
}

function resetCounts(counts: CallCounts) {
  for (let name in counts) {
    delete counts[name]
  }
}

function expectCountsAtMost(actual: CallCounts, recorded: CallCounts | undefined, label: string) {
  if (!recorded) {
    fail(label + ' not recorded. actual: ' + JSON.stringify(actual))
    return
  }

  for (let name of HOOK_NAMES) {
    expect(actual[name] || 0).withContext(label + ' ' + name).toBeLessThanOrEqual(recorded[name] || 0)
  }
}

// with a mocked clock, waitTimeout can't run. frames and ResizeObserver callbacks still do
async function settleWithMockedClock() {
  for (let i = 0; i < 10; i += 1) {
    jasmine.clock().tick(50) // zero-delay and short timers the renderers schedule
    await waitFrame()
  }
}

function selectInResource(calendar: Calendar, isTimed: boolean, resourceId: string) {
  calendar.select({
    ...(isTimed
      ? { start: '2016-12-05T08:00:00', end: '2016-12-05T10:00:00' }
      : { start: '2016-12-05', end: '2016-12-06', allDay: true }),
    resourceId,
  } as any)
}

function getMirrorCount(calendar: Calendar): number {
  return calendar.el.querySelectorAll('.fc-event-mirror').length
}

function getHeaderResourceTitles(calendar: Calendar, isTimeGrid: boolean): string[] {
  let header = isTimeGrid
    ? new ResourceTimeGridViewWrapper(calendar).header
    : new ResourceDayGridViewWrapper(calendar).header

  return header.getResourceInfo().map((info) => info.text)
}

function getInternalResource(calendar: Calendar, resourceId: string): any {
  return (calendar.getResourceById(resourceId) as any)._resource
}

function getEventColorsInResource(calendar: Calendar, resourceId: string): string[] {
  let colors = new Set<string>()

  for (let columnEl of Array.from(calendar.el.querySelectorAll(`[role=cell][data-resource-id="${resourceId}"]`))) {
    for (let eventEl of Array.from(columnEl.querySelectorAll('.fc-event:not(.fc-bg-event)'))) {
      colors.add((eventEl as HTMLElement).style.getPropertyValue('--fc-event-color'))
    }
  }

  return Array.from(colors)
}

function getElCenter(el: Element) {
  let rect = el.getBoundingClientRect()

  return {
    left: (rect.left + rect.right) / 2,
    top: (rect.top + rect.bottom) / 2,
  }
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
