import * as vdom from 'fullcalendar/preact'
import classicThemePlugin from 'fullcalendar/themes/classic'
import timelinePlugin from 'fullcalendar-scheduler/timeline'
import resourceTimelinePlugin from 'fullcalendar-scheduler/resource-timeline'
import themeForTestsPlugin from '@fullcalendar-tests/standard/lib/theme-for-tests'
import { ignoreResizeObserverLoops, waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import themeForTestsPremiumPlugin from '../lib/theme-for-tests-premium'

/*
#8112 bug 2, for the timelines: a view shown again in <Activity> must keep where the user scrolled.
The timelines already kept it (their view holds the scroll, for print), so these guard it.
<Activity> is React 19 only, so these run in the React runtime (FORCE_REACT=1) and are pending in Preact
*/
describe('timeline scroll position across a hidden <Activity>', () => {
  const react = vdom as any
  const manyResources = []
  for (let i = 0; i < 20; i++) {
    manyResources.push({ id: String(i), title: `Resource ${i}` })
  }

  it('keeps where the user scrolled a timeline', async () => {
    await testScrollAcrossActivity({
      initialView: 'timelineDay',
    })
  })

  it('keeps where the user scrolled a resource timeline', async () => {
    await testScrollAcrossActivity({
      initialView: 'resourceTimelineDay',
      resources: [{ id: 'a', title: 'Resource A' }],
    })
  })

  // a Strict Mode replay is a remount of the same instance too
  it('keeps where the user scrolled a timeline, in Strict Mode', async () => {
    await testScrollAcrossActivity({
      initialView: 'timelineDay',
    }, { isStrict: true })
  })

  it('keeps the resource the user scrolled to', async () => {
    await testScrollAcrossActivity({
      initialView: 'resourceTimelineDay',
      height: 200,
      resources: manyResources,
    }, { scrollTop: 100 })
  })

  it('resets to scrollTime for a date change while hidden', async () => {
    await testScrollAcrossActivity({
      initialView: 'timelineDay',
    }, { navigateWhileHidden: true, expectedScrollLeft: 0 })
  })

  it('keeps where the user scrolled for a date change while hidden, without scrollTimeReset', async () => {
    await testScrollAcrossActivity({
      initialView: 'timelineDay',
      scrollTimeReset: false,
    }, { navigateWhileHidden: true })
  })

  async function testScrollAcrossActivity(calendarOptions: object, {
    isStrict = false,
    scrollTop = 0,
    navigateWhileHidden = false,
    expectedScrollLeft = 80,
  } = {}) {
    if (!react.Activity) {
      pending('React runtime only')
      return
    }

    let containerEl = document.createElement('div')
    containerEl.style.width = '600px'
    document.body.appendChild(containerEl)
    let root = react.createRoot(containerEl)
    let calendarRef = { current: null }

    function render(mode: 'visible' | 'hidden') {
      let calendarEl = react.createElement(react.FullCalendar, {
        ref: calendarRef,
        plugins: [
          timelinePlugin,
          resourceTimelinePlugin,
          classicThemePlugin,
          themeForTestsPlugin,
          themeForTestsPremiumPlugin,
        ],
        initialDate: '2024-01-03',
        scrollTime: '00:00', // the initial scroll is to the start
        ...calendarOptions,
      })

      react.flushSync(() => {
        root.render(
          react.createElement(react.Activity, { mode },
            isStrict ? react.createElement(react.StrictMode, {}, calendarEl) : calendarEl,
          ),
        )
      })
    }

    try {
      await ignoreResizeObserverLoops(async () => {
        render('visible')
        await waitTimeout(100)
        // the last: in a resource timeline, the spreadsheet's body has the class too
        let scrollerEls = containerEl.querySelectorAll('.fc-timeline-body')
        let scrollerEl = scrollerEls[scrollerEls.length - 1] as HTMLElement
        expect(scrollerEl.scrollLeft).toBe(0) // sanity check: the initial scroll
        expect(scrollerEl.scrollWidth).toBeGreaterThan(scrollerEl.clientWidth + 100) // sanity check

        // a user scroll: a wheel event, then a scroll, then the scroll-end wait
        scrollerEl.dispatchEvent(new Event('wheel'))
        scrollerEl.scrollLeft = 80
        scrollerEl.scrollTop = scrollTop
        scrollerEl.dispatchEvent(new Event('scroll'))
        await waitTimeout(600)
        expect(scrollerEl.scrollTop).toBe(scrollTop) // sanity check: it can scroll that far

        let calendarApi = calendarRef.current.getApi() // a hidden <Activity> detaches refs
        render('hidden')
        await waitTimeout(100)

        if (navigateWhileHidden) {
          calendarApi.next()
          await waitTimeout(100)
        }

        render('visible')
        await waitTimeout(100)

        expect(scrollerEl.scrollLeft).toBe(expectedScrollLeft)
        expect(Math.abs(scrollerEl.scrollTop - scrollTop)).toBeLessThanOrEqual(1)
      })
    } finally {
      root.unmount()
      containerEl.remove()
    }
  }
})

/*
Neither a plain re-render nor hiding and showing may re-render the layouts (see
standard/packages/vanilla-tests/src/view-render/activity-rerender.ts)
*/
describe('timeline render hooks across a hidden <Activity>', () => {
  const react = vdom as any

  for (const initialView of ['timelineDay', 'resourceTimelineDay']) {
    it(`calls tableClass no more in ${initialView}`, async () => {
      if (!react.Activity) {
        pending('React runtime only')
        return
      }

      let containerEl = document.createElement('div')
      containerEl.style.width = '600px'
      document.body.appendChild(containerEl)
      let root = react.createRoot(containerEl)
      let callCnt = 0
      let fullCalendarProps = { // the same object every render
        plugins: [timelinePlugin, resourceTimelinePlugin, classicThemePlugin, themeForTestsPlugin, themeForTestsPremiumPlugin],
        initialView,
        initialDate: '2024-01-03',
        resources: [{ id: 'a', title: 'Resource A' }],
        tableClass: () => {
          callCnt++
          return ''
        },
      }

      function render(mode: 'visible' | 'hidden') {
        react.flushSync(() => {
          root.render(
            react.createElement(react.Activity, { mode },
              react.createElement(react.FullCalendar, fullCalendarProps),
            ),
          )
        })
      }

      try {
        render('visible')
        await waitTimeout(200)

        let settledCallCnt = callCnt
        render('visible')
        await waitTimeout(200)
        expect(callCnt - settledCallCnt).toBe(0)

        settledCallCnt = callCnt
        render('hidden')
        await waitTimeout(100)
        render('visible')
        await waitTimeout(200)

        expect(callCnt - settledCallCnt).toBe(0)
      } finally {
        root.unmount()
        containerEl.remove()
      }
    })
  }
})

/*
With height:auto, the window's height sizes the virtualized rows. It's read again when an <Activity>
is shown, and the rows re-rendered for it
*/
describe('timeline virtualization across a hidden <Activity>', () => {
  const react = vdom as any

  it('renders rows for a window that grew while hidden', async () => {
    if (!react.Activity) {
      pending('React runtime only')
      return
    }

    let containerEl = document.createElement('div')
    containerEl.style.width = '600px'
    document.body.appendChild(containerEl)
    let root = react.createRoot(containerEl)
    let resources = []

    for (let i = 0; i < 100; i++) {
      resources.push({ id: `r${String(i).padStart(3, '0')}`, title: `Resource ${i}` })
    }

    let fullCalendarProps = { // the same object every render
      plugins: [timelinePlugin, resourceTimelinePlugin, classicThemePlugin, themeForTestsPlugin, themeForTestsPremiumPlugin],
      initialView: 'resourceTimelineDay',
      initialDate: '2024-01-03',
      height: 'auto',
      virtualization: true,
      resources,
    }

    function render(mode: 'visible' | 'hidden') {
      react.flushSync(() => {
        root.render(
          react.createElement(react.Activity, { mode },
            react.createElement(react.FullCalendar, fullCalendarProps),
          ),
        )
      })
    }

    let innerHeightDescriptor = Object.getOwnPropertyDescriptor(window, 'innerHeight')

    try {
      await ignoreResizeObserverLoops(async () => {
        render('visible')
        await waitTimeout(200)

        render('hidden')
        await waitTimeout(100)
        Object.defineProperty(window, 'innerHeight', { value: 3000, configurable: true }) // grew while hidden
        render('visible')
        await waitTimeout(300)
      })

      // the rows rendered reach down at least the window's height from the top of the rows
      let bodyEls = containerEl.querySelectorAll('.fc-timeline-body')
      let dataGridBodyEl = bodyEls[0] as HTMLElement // the spreadsheet's (it has the class too)
      let cellEls = Array.from(dataGridBodyEl.querySelectorAll('[data-resource-id]'))
      let rowsTop = dataGridBodyEl.getBoundingClientRect().top
      let lowestBottom = Math.max(...cellEls.map((cellEl) => cellEl.getBoundingClientRect().bottom))

      expect(lowestBottom - rowsTop).toBeGreaterThanOrEqual(3000)
    } finally {
      Object.defineProperty(window, 'innerHeight', innerHeightDescriptor)
      root.unmount()
      containerEl.remove()
    }
  })
})
