import { Calendar } from '@fullcalendar/core'
import classicThemePlugin from '@fullcalendar/theme-classic'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import { CalendarWrapper } from '@fullcalendar-tests/standard/lib/wrappers/CalendarWrapper'
import themeForTests from '@fullcalendar-tests/standard/lib/theme-for-tests'
import themeForTestsPremium from '../lib/theme-for-tests-premium.js'
import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper.js'

function buildOptions() {
  return {
    plugins: [
      classicThemePlugin,
      themeForTests,
      themeForTestsPremium,
      resourceTimelinePlugin,
    ],
    initialView: 'resourceTimelineDay',
    initialDate: '2019-04-01',
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
    ],
  }
}

describe('resetOptions', () => { // TODO: rename file
  let $calendarEl
  let calendar

  beforeEach(() => {
    $calendarEl = $('<div>').appendTo('body')
  })

  afterEach(() => {
    if (calendar) { calendar.destroy() }
    $calendarEl.remove()
  })

  it('will rerender resoures without rerender the view', (done) => {
    calendar = new Calendar($calendarEl[0], buildOptions())
    calendar.render()

    let calendarWrapper = new CalendarWrapper(calendar)
    let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid
    let dateEl = calendarWrapper.getFirstDateEl()

    calendar.setOption('resources', [
      { id: 'a', title: 'Resource A' },
    ])

    setTimeout(() => {
      expect(timelineGridWrapper.getResourceIds()).toEqual(['a'])
      expect(calendarWrapper.getFirstDateEl()).toBe(dateEl)
      done()
    })
  })
})
