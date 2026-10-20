/// <reference types="vitest/globals" />
import React, { Activity, Suspense, StrictMode, act, useState } from 'react'
import { render } from '@testing-library/react'

/*
React lifecycle cases the vanilla Karma specs can't reach: Strict Mode replays, <Activity>, Suspense.
Only works on build dist code!

Known bugs are `it.fails`, citing the issue. When a fix lands, the spec starts failing; flip it to `it`.
(none currently)
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

// Strict Mode's simulated unmount stops the timers, and the replayed mount must start them again.
// Before phase 8 they were only armed during render, so the now-indicator and midnight refresh stalled
it('keeps its long timers after Strict Mode replays the mount', () => {
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

// #8112 bug 1: a hidden <Activity> has already run its cleanups, so a re-render while hidden must not
// arm timers, because nothing would clear them. Fixed by phase 8: timers only arm on mount
it('#8112: hiding in <Activity>, re-rendering, then unmounting leaves no long timers', () => {
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

// #8092: a render that React discards, because a sibling suspended, must not have armed timers,
// because nothing would clean them up. Fixed by phase 8: timers only arm on mount
it('#8092: a render discarded by Suspense leaves no long timers', async () => {
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

// #8092: an async fetch started by a render React discards must not deliver its result later. React
// would warn "Can't perform a React state update on a component that hasn't mounted yet"
it('#8092: an async fetch from a render discarded by Suspense updates nothing', async () => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const neverResolves = new Promise(() => {})

  function Suspender(): React.ReactNode {
    throw neverResolves
  }

  try {
    const { unmount } = render(
      <Suspense fallback={<div>loading</div>}>
        <FullCalendar
          {...OPTIONS}
          events={(_info, successCallback) => {
            origSetTimeout(() => successCallback([]), 10)
          }}
        />
        <Suspender />
      </Suspense>,
    )

    await act(() => new Promise((resolve) => origSetTimeout(resolve, 50)))
    unmount()

    expect(consoleErrorSpy.mock.calls.map(String).join('\n')).not.toMatch(/state update/i)
  } finally {
    consoleErrorSpy.mockRestore()
  }
})

// the `loading` callback runs after the commit, so it may set a parent's state. During render, React
// would warn "Cannot update a component while rendering a different component"
it('calls `loading` outside of render, so it can set state', async () => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const loadingCalls: boolean[] = []
  // stable, because a new function each render would refetch on every render
  const fetchEvents = (_info, successCallback) => {
    origSetTimeout(() => successCallback([]), 10)
  }

  function App() {
    const [, setIsLoading] = useState(false)

    return (
      <FullCalendar
        {...OPTIONS}
        events={fetchEvents}
        loading={(isLoading) => {
          loadingCalls.push(isLoading)
          setIsLoading(isLoading)
        }}
      />
    )
  }

  try {
    const { unmount } = render(<App />)
    await act(() => new Promise((resolve) => origSetTimeout(resolve, 50)))
    unmount()

    expect(loadingCalls).toEqual([true, false])
    expect(consoleErrorSpy.mock.calls.map(String).join('\n')).not.toMatch(/while rendering a different component/)
  } finally {
    consoleErrorSpy.mockRestore()
  }
})

// #8112 bug 2 (a grid shown again in <Activity> jumps back to its initial scroll) needs real layout,
// which jsdom doesn't have. It belongs in a browser suite when phase 7 fixes it.
