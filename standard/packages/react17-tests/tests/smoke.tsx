/// <reference types="vitest/globals" />
import React, { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { act, createHarness } from '#harness'

/*
@fullcalendar/react on React 17 (its oldest supported major), with React 18 alongside for what 17
lacks: the concurrent root, and Strict Mode's effect replay. The react17-tests and react18-tests
packages both run this file, each against its own React (vitest.shared.ts): pnpm can't satisfy two
react-dom versions' `react` peers in one package. Only works on build dist code!
See planning/phase-11-contexts-and-store-reads.md, "React 17 smoke run"
*/
import FullCalendar from '../../react/dist/index.js'
import dayGridPlugin from '../../react/dist/daygrid.js'

const MAJOR = process.env.REACT_MAJOR!
const EVENT_CLASS = 'test-event'

const OPTIONS = {
  plugins: [dayGridPlugin],
  initialView: 'dayGridMonth',
  initialDate: '2024-01-10',
  eventClass: EVENT_CLASS,
}

/*
React <= 18 warns on every useLayoutEffect during a server render (React 19 dropped the warning).
Logged in planning/questions-for-adam.md; anything else React reports fails the spec
*/
const KNOWN_ERRORS = /useLayoutEffect does nothing on the server/

let container: HTMLElement
let harness: ReturnType<typeof createHarness>
let errorSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  harness = createHarness(container)
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  let errors = errorSpy.mock.calls.map((args) => String(args[0])).filter((msg) => !KNOWN_ERRORS.test(msg))

  errorSpy.mockRestore()
  container.remove()
  expect(errors).toEqual([])
})

// one calendar mounted (not two, as a Strict Mode replay could leave): one cell for the date
function getDayCellCnt(): number {
  return container.querySelectorAll('[role=cell][data-date="2024-01-10"]').length
}

function getEventTitles(): string[] {
  return Array.from(container.querySelectorAll(`.${EVENT_CLASS}`)).map((el) => el.textContent || '')
}

it(`runs on React ${MAJOR}`, () => {
  expect(React.version.split('.')[0]).toBe(MAJOR)
})

it('mounts', () => {
  harness.render(
    <FullCalendar {...OPTIONS} events={[{ title: 'mounted', start: '2024-01-10' }]} />,
  )

  expect(getDayCellCnt()).toBe(1)
  expect(getEventTitles()).toEqual(['mounted'])
  harness.unmount()
})

it('updates', () => {
  harness.render(
    <FullCalendar {...OPTIONS} events={[{ title: 'before', start: '2024-01-10' }]} />,
  )
  harness.render(
    <FullCalendar {...OPTIONS} events={[{ title: 'after', start: '2024-01-11' }]} />,
  )

  expect(getEventTitles().join()).toContain('after')
  expect(getEventTitles().join()).not.toContain('before')
  harness.unmount()
})

it('unmounts and destroys', () => {
  let unmountCnt = 0

  harness.render(
    <FullCalendar
      {...OPTIONS}
      viewWillUnmount={() => {
        unmountCnt += 1
      }}
    />,
  )
  harness.unmount()

  expect(unmountCnt).toBe(1)
  expect(container.innerHTML).toBe('')
})

it('works in Strict Mode', () => {
  let mountCnt = 0
  let unmountCnt = 0
  let viewOptions = {
    ...OPTIONS,
    viewDidMount: () => {
      mountCnt += 1
    },
    viewWillUnmount: () => {
      unmountCnt += 1
    },
  }

  harness.render(
    <StrictMode>
      <FullCalendar {...viewOptions} events={[{ title: 'strict', start: '2024-01-10' }]} />
    </StrictMode>,
  )

  expect(getDayCellCnt()).toBe(1)
  expect(getEventTitles()).toEqual(['strict'])
  // whatever Strict Mode replays, the view ends up mounted once more than unmounted
  expect(mountCnt - unmountCnt).toBe(1)

  harness.render(
    <StrictMode>
      <FullCalendar {...viewOptions} events={[{ title: 'strict-updated', start: '2024-01-10' }]} />
    </StrictMode>,
  )

  expect(getEventTitles()).toEqual(['strict-updated'])
  harness.unmount()
  expect(mountCnt - unmountCnt).toBe(0)
})

it('renders events that arrive after mount', async () => {
  harness.render(
    <FullCalendar
      {...OPTIONS}
      events={(_info, successCallback) => {
        setTimeout(() => {
          successCallback([{ title: 'async', start: '2024-01-10' }])
        }, 0)
      }}
    />,
  )

  expect(getEventTitles()).toEqual([])

  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10))
  })

  expect(getEventTitles()).toEqual(['async'])
  harness.unmount()
})

// #7070: an event fetch (a promise-returning function) that settles after the calendar unmounted updated
// it, and React 17 warned "Can't perform a React state update on an unmounted component" (the console
// guard in afterEach fails the spec on it)
it('#7070: an event fetch that settles after unmount updates nothing', async () => {
  let resolveFetch: (events: any[]) => void

  harness.render(
    <FullCalendar
      {...OPTIONS}
      events={() => new Promise((resolve) => {
        resolveFetch = resolve
      })}
    />,
  )
  harness.unmount()

  await act(async () => {
    resolveFetch([{ title: 'late', start: '2024-01-10' }])
    await new Promise((resolve) => setTimeout(resolve, 10))
  })

  expect(container.innerHTML).toBe('')
})

it('renders on the server, and hydrates', () => {
  let el = <FullCalendar {...OPTIONS} events={[{ title: 'server', start: '2024-01-10' }]} />
  let html = renderToString(el)

  expect(html).toContain('server')

  container.innerHTML = html
  harness.hydrate(el) // a mismatch would be reported through console.error

  expect(getEventTitles()).toEqual(['server'])

  harness.render(<FullCalendar {...OPTIONS} events={[{ title: 'hydrated', start: '2024-01-11' }]} />)
  expect(getEventTitles()).toEqual(['hydrated'])
  harness.unmount()
})
