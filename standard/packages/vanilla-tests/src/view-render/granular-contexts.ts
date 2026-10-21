import * as vdom from 'fullcalendar/preact'
import {
  useCalendarCore, useDateEnv, useNow, usePluginHooks, useViewContext, useViewOptions, useViewSpec,
} from 'fullcalendar/protected-api'
import { DEFAULT_PLUGINS } from '../lib/global-plugins'
import { waitFrame, waitTimeout } from '../lib/misc'

/*
The granular contexts (planning/phase-11-contexts-and-store-reads.md, 11a): each part of the view
context keeps its identity unless what it holds changes, and never changes while the facade
(useViewContext) holds. A custom view reads them all on every render; a consumer under a parent
that never updates proves a context change alone re-renders it
*/
describe('granular contexts', () => {
  const { createElement, Component } = vdom as any
  type Snapshot = { [name: string]: unknown }
  let snapshots: Snapshot[]
  let blockedRenderCnt: number

  function ProbeView() {
    useNow('day') // so a day tick re-renders the view

    snapshots.push({
      facade: useViewContext(),
      core: useCalendarCore(),
      pluginHooks: usePluginHooks(),
      dateEnv: useDateEnv(),
      viewSpec: useViewSpec(),
      options: useViewOptions(),
    })

    return createElement('div', { className: 'probe-view', style: { height: '100px' } },
      createElement(Blocker, null, createElement(OptionsConsumer, null)),
    )
  }

  class Blocker extends Component {
    shouldComponentUpdate() {
      return false
    }

    render() {
      return this.props.children
    }
  }

  function OptionsConsumer() {
    useViewOptions()
    blockedRenderCnt += 1
    return null
  }

  const probePlugin = {
    name: 'probe-view',
    views: {
      probeView: {
        duration: { days: 1 },
        content: () => createElement(ProbeView, null),
      },
      otherProbeView: {
        duration: { days: 2 },
        content: () => createElement(ProbeView, null),
      },
    },
  }

  pushOptions({
    plugins: [...DEFAULT_PLUGINS, probePlugin],
    initialView: 'probeView',
    initialDate: '2024-01-04',
  })

  beforeEach(() => {
    snapshots = []
    blockedRenderCnt = 0
  })

  // the last snapshot before the probe vs the last after, per context: true if the same object
  async function probe(calendar, action: () => void) {
    await waitTimeout()
    let before = snapshots[snapshots.length - 1]
    let blockedBefore = blockedRenderCnt

    action()
    await waitTimeout()

    let after = snapshots[snapshots.length - 1]
    let same: { [name: string]: boolean } = {}

    for (let name in before) {
      same[name] = before[name] === after[name]
    }

    return { same, reachedBody: after !== before, blockedRenders: blockedRenderCnt - blockedBefore }
  }

  it('keeps every context on navigation', async () => {
    let calendar = initCalendar()
    let res = await probe(calendar, () => calendar.next())

    expect(res.reachedBody).withContext('the view re-rendered').toBe(true)
    expect(res.same).toEqual({
      facade: true, core: true, pluginHooks: true, dateEnv: true, viewSpec: true, options: true,
    })
    expect(res.blockedRenders).toBe(0)
  })

  it('keeps every context on a now tick', async () => {
    jasmine.clock().install()
    jasmine.clock().mockDate(new Date('2024-01-04T23:59:00Z'))

    try {
      let calendar = initCalendar({ timeZone: 'UTC' })
      await settleWithMockClock()
      let before = snapshots[snapshots.length - 1]
      let blockedBefore = blockedRenderCnt

      jasmine.clock().tick(2 * 60 * 1000) // across midnight
      await settleWithMockClock()

      let after = snapshots[snapshots.length - 1]
      expect(after).withContext('the view re-rendered').not.toBe(before)
      for (let name in before) {
        expect(after[name]).withContext(name).toBe(before[name])
      }
      expect(blockedRenderCnt - blockedBefore).toBe(0)
      calendar.destroy()
    } finally {
      jasmine.clock().uninstall()
    }
  })

  it('replaces only the options and view spec on an unrelated option change', async () => {
    let calendar = initCalendar()
    let res = await probe(calendar, () => calendar.setOption('dragScroll', false))

    expect(res.same).toEqual({
      facade: false, core: true, pluginHooks: true, dateEnv: true, viewSpec: false, options: false,
    })
    expect(res.blockedRenders).toBe(1)
  })

  it('replaces only the options and view spec on a view switch', async () => {
    let calendar = initCalendar()
    let res = await probe(calendar, () => calendar.changeView('otherProbeView'))

    expect(res.same).toEqual({
      facade: false, core: true, pluginHooks: true, dateEnv: true, viewSpec: false, options: false,
    })
  })

  it('replaces the date env too when an option it depends on changes', async () => {
    let calendar = initCalendar()
    let res = await probe(calendar, () => calendar.setOption('firstDay', 3))

    expect(res.same).toEqual({
      facade: false, core: true, pluginHooks: true, dateEnv: false, viewSpec: false, options: false,
    })
    expect(res.blockedRenders).toBe(1)
  })
})

async function settleWithMockClock() {
  for (let i = 0; i < 6; i += 1) {
    await waitFrame()
    jasmine.clock().tick(10)
  }
}

// the built-in view classes read no context (no contextType): their bodies subscribe instead
describe('built-in views without a contextType', () => {
  for (const initialView of ['dayGridMonth', 'timeGridWeek', 'listWeek', 'multiMonthYear']) {
    it(`update on an option change in ${initialView}`, async () => {
      let calendar = initCalendar({
        initialView,
        initialDate: '2024-01-04',
        events: [{ title: 'event', start: '2024-01-04T10:00:00' }],
      })

      await waitTimeout()
      expect(calendar.el.querySelectorAll('.probe-class').length).toBe(0)

      calendar.setOption('eventClass', () => 'probe-class')
      await waitTimeout()

      expect(calendar.el.querySelectorAll('.probe-class').length).toBeGreaterThan(0)
    })
  }
})
