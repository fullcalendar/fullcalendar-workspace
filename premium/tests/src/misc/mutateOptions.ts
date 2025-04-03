import { Calendar } from '@fullcalendar/core'
import classicThemePlugin from '@fullcalendar/classic-theme'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import { CalendarWrapper } from '@fullcalendar-tests/standard/lib/wrappers/CalendarWrapper'
import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper.js'

function buildOptions() {
  return {
    plugins: [classicThemePlugin, resourceTimelinePlugin],
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

  it('will rerender resoures without rerender the view', () => {
    calendar = new Calendar($calendarEl[0], buildOptions())
    calendar.render()

    let calendarWrapper = new CalendarWrapper(calendar)
    let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid
    let dateEl = calendarWrapper.getFirstDateEl()

    calendar.setOption('resources', [
      { id: 'a', title: 'Resource A' },
    ])

    expect(timelineGridWrapper.getResourceIds()).toEqual(['a'])
    expect(calendarWrapper.getFirstDateEl()).toBe(dateEl)
  })
})
