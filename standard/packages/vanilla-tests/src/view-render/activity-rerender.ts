import * as vdom from 'fullcalendar/preact'
import dayGridPlugin from 'fullcalendar/daygrid'
import timeGridPlugin from 'fullcalendar/timegrid'
import multiMonthPlugin from 'fullcalendar/multimonth'
import listPlugin from 'fullcalendar/list'
import classicThemePlugin from 'fullcalendar/themes/classic'
import themeForTestsPlugin from '../lib/theme-for-tests'
import { waitTimeout } from '../lib/misc'

/*
Hiding and showing a calendar in <Activity> must not re-render its layouts more than a plain
re-render does: measurements reported as null while hidden would otherwise be cleared and measured
again, calling render hooks like tableClass again.
React 19 only, so these run in the React runtime (FORCE_REACT=1) and are pending in Preact
*/
describe('render hooks across a hidden <Activity>', () => {
  const react = vdom as any

  for (const initialView of ['dayGridMonth', 'timeGridWeek', 'multiMonthYear', 'listWeek']) {
    it(`calls tableClass no more in ${initialView}`, async () => {
      await testNoRerender({ initialView })
    })
  }

  async function testNoRerender(calendarOptions: object) {
    if (!react.Activity) {
      pending('React runtime only')
      return
    }

    let containerEl = document.createElement('div')
    containerEl.style.width = '600px'
    document.body.appendChild(containerEl)
    let root = react.createRoot(containerEl)
    let callCnt = 0
    // the same options object every render, so the calendar doesn't re-render for new options
    let fullCalendarProps = {
      plugins: [dayGridPlugin, timeGridPlugin, multiMonthPlugin, listPlugin, classicThemePlugin, themeForTestsPlugin],
      initialDate: '2024-01-03',
      height: 400,
      tableClass: () => {
        callCnt++
        return ''
      },
      ...calendarOptions,
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

      // what a plain re-render with the same props costs. the calendar's data, upstream of the layouts,
      // currently re-renders the view once (see planning/phase-7-layout-families.md)
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
  }
})
