import { waitTimeout, waitFrame } from '@fullcalendar-tests/standard/lib/misc'
import { DOM_FIXTURES, DomFixture } from './fixtures'
import { serializeEls } from './serialize'

/*
Records DOM snapshots for scripts/bin/dom-snapshot.js. Defines no specs unless the runner passes
--dom-snapshot, so normal test runs skip it. Results go back to the runner via __karma__.info.
*/

const karma = (window as any).__karma__
const isEnabled = Boolean(karma?.config?.args?.includes('--dom-snapshot'))

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
        const { html, resizeObserverLoops } = await recordFixture(fixture)
        karma.info({ domSnapshot: { name: fixture.name, html, resizeObserverLoops } })
      })
    }
  })
}

async function recordFixture(fixture: DomFixture): Promise<{ html: string, resizeObserverLoops: number }> {
  const prevBodyChildren = new Set(Array.from(document.body.children))
  const origOnError = window.onerror
  let resizeObserverLoops = 0

  // benign, but would fail the spec. counted instead, because they can point to measurement problems
  window.onerror = (message, ...args) => {
    if (typeof message === 'string' && message.includes('ResizeObserver loop')) {
      resizeObserverLoops += 1
      return true // prevents Karma from seeing it as uncaught
    }
    return origOnError?.(message, ...args)
  }

  const el = document.createElement('div')

  el.style.width = '1100px'
  document.body.appendChild(el)

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

    return { html: serializeEls(els), resizeObserverLoops }
  } finally {
    if (fixture.teardown) {
      await fixture.teardown(calendar)
    }

    calendar.destroy()
    el.remove()
    window.onerror = origOnError
  }
}

async function waitForLayout() {
  await waitTimeout()
  await waitFrame()
  await waitFrame()
}
