import * as vdom from 'fullcalendar/preact'
import dayGridPlugin from 'fullcalendar/daygrid'
import timeGridPlugin from 'fullcalendar/timegrid'
import multiMonthPlugin from 'fullcalendar/multimonth'
import classicThemePlugin from 'fullcalendar/themes/classic'
import internalClassNames from 'fullcalendar/protected-styles'
import themeForTestsPlugin from '../lib/theme-for-tests'
import { waitTimeout } from '../lib/misc'

/*
#8112 bug 2: a grid shown again in <Activity> jumped back to its initial scroll.
<Activity> is React 19 only, so these run in the React runtime (FORCE_REACT=1) and are pending in Preact
*/
describe('scroll position across a hidden <Activity>', () => {
  const react = vdom as any

  it('keeps where the user scrolled a dayGrid', async () => {
    await testScrollAcrossActivity(
      {
        initialView: 'dayGridYear', // tall enough to scroll
        initialDate: '2024-01-03', // in the first row, so the initial scroll is to the top
      },
      (containerEl) => containerEl.querySelector('.fc-daygrid-body') as HTMLElement,
    )
  })

  it('keeps where the user scrolled a timeGrid', async () => {
    await testScrollAcrossActivity(
      {
        initialView: 'timeGridWeek',
        initialDate: '2024-01-03',
        scrollTime: '00:00', // the initial scroll is to the top
      },
      (containerEl) => containerEl.querySelector(
        `.fc-timegrid-body .${internalClassNames.internalScroller}`,
      ) as HTMLElement,
    )
  })

  it('keeps where the user scrolled a multiMonth', async () => {
    await testScrollAcrossActivity(
      {
        initialView: 'multiMonthYear',
        initialDate: '2024-01-03', // in the first month, so the initial scroll is to the top
        multiMonthMaxColumns: 1, // tall enough to scroll
      },
      (containerEl) => containerEl.querySelector(`.${internalClassNames.internalScroller}`) as HTMLElement,
    )
  })

  async function testScrollAcrossActivity(
    calendarOptions: object,
    getScrollerEl: (containerEl: HTMLElement) => HTMLElement,
  ) {
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
              plugins: [dayGridPlugin, timeGridPlugin, multiMonthPlugin, classicThemePlugin, themeForTestsPlugin],
              height: 250,
              ...calendarOptions,
            }),
          ),
        )
      })
    }

    try {
      render('visible')
      await waitTimeout(100)
      let scrollerEl = getScrollerEl(containerEl)
      expect(scrollerEl.scrollTop).toBe(0) // sanity check: the initial scroll
      expect(scrollerEl.scrollHeight).toBeGreaterThan(scrollerEl.clientHeight + 100) // sanity check

      // a user scroll: a wheel event, then a scroll, then the scroll-end wait
      scrollerEl.dispatchEvent(new Event('wheel'))
      scrollerEl.scrollTop = 80
      scrollerEl.dispatchEvent(new Event('scroll'))
      await waitTimeout(600)

      render('hidden')
      await waitTimeout(100)
      render('visible')
      await waitTimeout(100)

      expect(scrollerEl.scrollTop).toBe(80)
    } finally {
      root.unmount()
      containerEl.remove()
    }
  }
})
