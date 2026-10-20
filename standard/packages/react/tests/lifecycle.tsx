/// <reference types="vitest/globals" />
import React, { Activity, Suspense, StrictMode, act } from 'react'
import { render } from '@testing-library/react'

/*
React lifecycle cases the vanilla Karma specs can't reach: Strict Mode replays, <Activity>, Suspense.
Only works on build dist code!

Known bugs are `it.fails`, citing the issue. When a fix lands, the spec starts failing; flip it to `it`.
See planning/phase-2-render-hook-specs.md
*/
import FullCalendar, { CalendarController } from '../dist/index'
import dayGridPlugin from '../dist/daygrid'
import timeGridPlugin from '../dist/timegrid'

const OPTIONS = {
  plugins: [dayGridPlugin, timeGridPlugin],
  initialView: 'timeGridWeek',
  nowIndicator: true, // a second timer, on top of the calendar's own day timer
}

// Long-timer tracking
// -------------------------------------------------------------------------------------------------
// FullCalendar's now-timers wait up to a day. Counting only timers of 1s or more ignores React's
// own scheduling and test utilities

let liveLongTimers: Set<unknown>
let origSetTimeout: typeof setTimeout
let origClearTimeout: typeof clearTimeout

beforeEach(() => {
  liveLongTimers = new Set()
  origSetTimeout = globalThis.setTimeout
  origClearTimeout = globalThis.clearTimeout

  globalThis.setTimeout = ((callback: (...args: any[]) => void, ms = 0, ...args: any[]) => {
    const id = origSetTimeout(() => {
      liveLongTimers.delete(id)
      callback(...args)
    }, ms)

    if (ms >= 1000) {
      liveLongTimers.add(id)
    }

    return id
  }) as typeof setTimeout

  globalThis.clearTimeout = ((id: any) => {
    liveLongTimers.delete(id)
    origClearTimeout(id)
  }) as typeof clearTimeout
})

afterEach(() => {
  // clear leftovers, so a leaking spec doesn't keep the test process alive
  for (const id of liveLongTimers) {
    origClearTimeout(id as any)
  }

  globalThis.setTimeout = origSetTimeout
  globalThis.clearTimeout = origClearTimeout
})

// Specs
// -------------------------------------------------------------------------------------------------

it('clears its long timers on unmount', () => {
  const { unmount } = render(<FullCalendar {...OPTIONS} />)

  expect(liveLongTimers.size).toBeGreaterThan(0) // sanity check, so the next expectation means something

  unmount()
  expect(liveLongTimers.size).toBe(0)
})

// Strict Mode's simulated unmount destroys the timers, and they're only armed during render, so
// nothing re-arms them until the next render. Dev-only: the now-indicator and the midnight refresh
// stall. Fixed by phase 8, which starts timers in effects
it.fails('keeps its long timers after Strict Mode replays the mount', () => {
  render(
    <StrictMode>
      <FullCalendar {...OPTIONS} />
    </StrictMode>,
  )

  expect(liveLongTimers.size).toBeGreaterThan(0)
})

it('binds a CalendarController after Strict Mode replays the mount, and unbinds on unmount', () => {
  const controller = new CalendarController()
  const { unmount } = render(
    <StrictMode>
      <FullCalendar {...OPTIONS} controller={controller} />
    </StrictMode>,
  )

  expect(controller.view?.type).toBe('timeGridWeek')

  unmount()
  expect(controller.view).toBeUndefined()
})

// #8112 bug 1: NowTimerRunner.update() runs during render. A hidden <Activity> has already run its
// cleanups, so a re-render while hidden arms timers that nothing clears. Fixed by phase 8
it.fails('#8112: hiding in <Activity>, re-rendering, then unmounting leaves no long timers', () => {
  function App({ isShown, revision }: { isShown: boolean, revision: number }) {
    return (
      <Activity mode={isShown ? 'visible' : 'hidden'}>
        <FullCalendar
          {...OPTIONS}
          plugins={[...OPTIONS.plugins]} // a new array each render, like an inline prop would be
          data-revision={revision}
        />
      </Activity>
    )
  }

  const { rerender, unmount } = render(<App isShown revision={0} />)

  rerender(<App isShown={false} revision={0} />)
  rerender(<App isShown={false} revision={1} />)
  unmount()

  expect(liveLongTimers.size).toBe(0)
})

// #8092: a render that React discards, because a sibling suspended, has already armed timers in
// render. Nothing ever cleans them up. Fixed by phase 8
it.fails('#8092: a render discarded by Suspense leaves no long timers', async () => {
  const neverResolves = new Promise(() => {})

  function Suspender(): React.ReactNode {
    throw neverResolves
  }

  const { unmount } = render(
    <Suspense fallback={<div>loading</div>}>
      <FullCalendar {...OPTIONS} />
      <Suspender />
    </Suspense>,
  )

  await act(async () => {})
  unmount()

  expect(liveLongTimers.size).toBe(0)
})

// #8112 bug 2 (a grid shown again in <Activity> jumps back to its initial scroll) needs real layout,
// which jsdom doesn't have. It belongs in a browser suite when phase 7 fixes it.
