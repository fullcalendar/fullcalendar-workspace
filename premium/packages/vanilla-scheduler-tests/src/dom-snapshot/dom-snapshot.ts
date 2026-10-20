import { waitTimeout, waitFrame } from '@fullcalendar-tests/standard/lib/misc'
import { DOM_FIXTURES, DomFixture } from './fixtures'
import { COUNT_SCENARIOS, CountScenario, CallCounts, buildCountingOptions } from './counts'
import { serializeEls } from './serialize'

/*
Records DOM snapshots and render-hook call counts for scripts/bin/dom-snapshot.js. Defines no specs
unless the runner passes --dom-snapshot, so normal test runs skip it. Results go back to the runner
via __karma__.info.
*/

const karma = (window as any).__karma__
const isEnabled = Boolean(karma?.config?.args?.includes('--dom-snapshot'))

// each count scenario runs this many times. the max is recorded, and any variation is reported
const COUNT_RUNS = 3

if (isEnabled) {
  describe('dom-snapshot', () => {
    it('reports the runtime', () => {
      const el = document.createElement('div')
      document.body.appendChild(el)

      const calendar = initCalendar({ initialView: 'dayGridDay' }, el)
      const runtime = Object.keys(calendar.el.querySelector('*')).some((key) => key.startsWith('__react'))
        ? 'react'
        : 'preact'

      calendar.destroy()
      el.remove()

      karma.info({ domSnapshotMeta: { runtime } })
    })

    for (const fixture of DOM_FIXTURES) {
      it(fixture.name, async () => {
        const { result: html, resizeObserverLoops } = await swallowResizeObserverLoops(
          () => recordFixture(fixture),
        )
        karma.info({ domSnapshot: { name: fixture.name, html, resizeObserverLoops } })
      })
    }

    for (const scenario of COUNT_SCENARIOS) {
      it(`counts ${scenario.name}`, async () => {
        const maxCounts: CallCounts = {}
        const minCounts: CallCounts = {}

        for (let run = 0; run < COUNT_RUNS; run += 1) {
          const { result: counts } = await swallowResizeObserverLoops(() => countScenario(scenario))

          for (const name of new Set([...Object.keys(counts), ...Object.keys(maxCounts)])) {
            maxCounts[name] = Math.max(maxCounts[name] ?? 0, counts[name] ?? 0)
            minCounts[name] = Math.min(minCounts[name] ?? Infinity, counts[name] ?? 0)
          }
        }

        const variedOptions = Object.keys(maxCounts).filter((name) => minCounts[name] !== maxCounts[name])

        karma.info({ domSnapshotCounts: { name: scenario.name, counts: maxCounts, variedOptions } })
      })
    }
  })
}

async function recordFixture(fixture: DomFixture): Promise<string> {
  const prevBodyChildren = new Set(Array.from(document.body.children))
  const el = createContainerEl()
  const calendar = initCalendar(fixture.options, el)

  try {
    await waitForLayout()

    if (fixture.setup) {
      await fixture.setup(calendar)
      await waitForLayout()
    }

    // the calendar, then anything rendered outside it, like portals or a drag mirror
    const els = [
      el,
      ...Array.from(document.body.children).filter((child) => child !== el && !prevBodyChildren.has(child)),
    ]

    return serializeEls(els)
  } finally {
    if (fixture.teardown) {
      await fixture.teardown(calendar)
    }

    calendar.destroy()
    el.remove()
  }
}

async function countScenario(scenario: CountScenario): Promise<CallCounts> {
  const counts: CallCounts = {}
  const el = createContainerEl()
  const calendar = initCalendar({ ...scenario.options, ...buildCountingOptions(counts) }, el)

  try {
    await waitForLayout()

    if (scenario.action) {
      for (const name of Object.keys(counts)) {
        delete counts[name]
      }

      await scenario.action(calendar, el)
      await waitForLayout()
    }

    return { ...counts }
  } finally {
    calendar.destroy()
    el.remove()
  }
}

function createContainerEl(): HTMLElement {
  const el = document.createElement('div')

  el.style.width = '1100px'
  document.body.appendChild(el)

  return el
}

async function waitForLayout() {
  await waitTimeout()
  await waitFrame()
  await waitFrame()
}

/*
ResizeObserver loop errors are benign but would fail the spec. They're counted instead, because they
can point to measurement problems
*/
async function swallowResizeObserverLoops<Result>(
  f: () => Promise<Result>,
): Promise<{ result: Result, resizeObserverLoops: number }> {
  const origOnError = window.onerror
  let resizeObserverLoops = 0

  window.onerror = (message, ...args) => {
    if (typeof message === 'string' && message.includes('ResizeObserver loop')) {
      resizeObserverLoops += 1
      return true // prevents Karma from seeing it as uncaught
    }
    return origOnError?.(message, ...args)
  }

  try {
    return { result: await f(), resizeObserverLoops }
  } finally {
    window.onerror = origOnError
  }
}
