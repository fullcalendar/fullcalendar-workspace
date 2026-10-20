import * as vdom from 'fullcalendar/preact'
import classicThemePlugin from 'fullcalendar/themes/classic'
import timelinePlugin from 'fullcalendar-scheduler/timeline'
import resourceTimelinePlugin from 'fullcalendar-scheduler/resource-timeline'
import themeForTestsPlugin from '@fullcalendar-tests/standard/lib/theme-for-tests'
import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import themeForTestsPremiumPlugin from '../lib/theme-for-tests-premium'

/*
#8112 bug 2, for the timelines: a view shown again in <Activity> must keep where the user scrolled.
The timelines already kept it (their view holds the scroll, for print), so these guard it.
<Activity> is React 19 only, so these run in the React runtime (FORCE_REACT=1) and are pending in Preact
*/
describe('timeline scroll position across a hidden <Activity>', () => {
  const react = vdom as any

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

  async function testScrollAcrossActivity(calendarOptions: object) {
    if (!react.Activity) {
      pending('React runtime only')
      return
    }

    let containerEl = document.createElement('div')
    containerEl.style.width = '600px'
    document.body.appendChild(containerEl)
    let root = react.createRoot(containerEl)

    function render(mode: 'visible' | 'hidden') {
      react.flushSync(() => {
        root.render(
          react.createElement(react.Activity, { mode },
            react.createElement(react.FullCalendar, {
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
            }),
          ),
        )
      })
    }

    try {
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
      scrollerEl.dispatchEvent(new Event('scroll'))
      await waitTimeout(600)

      render('hidden')
      await waitTimeout(100)
      render('visible')
      await waitTimeout(100)

      expect(scrollerEl.scrollLeft).toBe(80)
    } finally {
      root.unmount()
      containerEl.remove()
    }
  }
})

/*
Hiding and showing must not re-render the layouts more than a plain re-render does (see
standard/packages/vanilla-tests/src/view-render/activity-rerender.ts)
*/
describe('timeline render hooks across a hidden <Activity>', () => {
  const react = vdom as any

  for (const initialView of ['timelineDay']) {
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
        let rerenderCallCnt = callCnt - settledCallCnt

        settledCallCnt = callCnt
        render('hidden')
        await waitTimeout(100)
        render('visible')
        await waitTimeout(200)

        expect(callCnt - settledCallCnt).toBeLessThanOrEqual(rerenderCallCnt)
      } finally {
        root.unmount()
        containerEl.remove()
      }
    })
  }
})
