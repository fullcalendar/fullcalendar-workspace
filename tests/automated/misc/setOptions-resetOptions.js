import { Calendar } from '@fullcalendar/core'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import { getFirstDateEl } from 'fullcalendar/tests/automated/lib/ViewUtils'
import { getTimelineResourceIds } from '../lib/timeline'

function buildOptions() {
  return {
    plugins: [ resourceTimelinePlugin ],
    defaultView: 'resourceTimelineDay',
    defaultDate: '2019-04-01',
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' }
    ]
  }
}

describeValues({
  setOptions: mutateOptionsViaChange,
  resetOptions: mutateOptionsViaReset
}, function(mutateOptions) {
  let $calendarEl
  let calendar

  beforeEach(function() {
    $calendarEl = $('<div>').appendTo('body')
  })

  afterEach(function() {
    if (calendar) { calendar.destroy() }
    $calendarEl.remove()
  })

  it('will rerender resoures without rerender the view', function() {
    calendar = new Calendar($calendarEl[0], buildOptions())
    calendar.render()
    let dateEl = getFirstDateEl()

    mutateOptions(calendar, {
      resources: [
        { id: 'a', title: 'Resource A' }
      ]
    })

    expect(getTimelineResourceIds()).toEqual([ 'a' ])
    expect(getFirstDateEl()).toBe(dateEl)
  })

  it('rerenders resources when mutating same array', function() {
    let options = buildOptions()
    let { resources } = options

    calendar = new Calendar($calendarEl[0], options)
    calendar.render()

    resources.push({ id: 'c', title: 'Resource C' })
    mutateOptions(calendar, { resources })
    expect(calendar.getResources().length).toBe(resources.length)
  })

  it('rerenders resources when there were no resources before', function() {
    let options = buildOptions()
    options.resources = null

    calendar = new Calendar($calendarEl[0], options)
    calendar.render()

    mutateOptions(calendar, { resources: [{ id: 'c', title: 'Resource C' }] })
    expect(calendar.getResources().length).toBe(1)
  })

})

function mutateOptionsViaChange(calendar, changedOptions) {
  calendar.setOptions(changedOptions)
}

function mutateOptionsViaReset(calendar, changedOptions) {
  calendar.resetOptions({ ...buildOptions(), ...changedOptions })
}
