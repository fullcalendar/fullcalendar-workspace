import { ResourceTimelineView } from '@fullcalendar/resource-timeline'

describe('rerender performance for resource timeline', function() {
  pushOptions({
    defaultDate: '2017-10-04',
    defaultView: 'resourceTimelineDay',
    resources: [
      { id: 'a', title: 'Resource A' }
    ],
    events: [
      { title: 'event 0', start: '2017-10-04', resourceId: 'a' }
    ],
    windowResizeDelay: 0
  })

  it('calls methods a limited number of times', function(done) {
    let settings = {
      datesRender: function() {},
      eventRender: function() {},
      resourceRender: function() {}
    }

    let updateSize = spyOnMethod(ResourceTimelineView, 'updateSize')
    spyOn(settings, 'datesRender')
    spyOn(settings, 'eventRender')
    spyOn(settings, 'resourceRender')

    initCalendar(settings)

    expect(settings.datesRender.calls.count()).toBe(1)
    expect(settings.eventRender.calls.count()).toBe(1)
    expect(settings.resourceRender.calls.count()).toBe(1)
    expect(updateSize.calls.count()).toBe(1)

    currentCalendar.changeView('timeGridWeek')

    expect(settings.datesRender.calls.count()).toBe(2) // +1
    expect(settings.eventRender.calls.count()).toBe(2) // +1
    expect(settings.resourceRender.calls.count()).toBe(1)
    expect(updateSize.calls.count()).toBe(1) // won't change because moved AWAY from ResourceTimelineView

    currentCalendar.changeView('resourceTimelineDay')

    expect(settings.datesRender.calls.count()).toBe(3) // +1
    expect(settings.eventRender.calls.count()).toBe(3) // +1
    expect(settings.resourceRender.calls.count()).toBe(2) // +1
    expect(updateSize.calls.count()).toBe(2) // +1

    currentCalendar.rerenderEvents()

    expect(settings.datesRender.calls.count()).toBe(3)
    expect(settings.eventRender.calls.count()).toBe(4) // +1
    expect(settings.resourceRender.calls.count()).toBe(2)
    expect(updateSize.calls.count()).toBe(3) // +1

    currentCalendar.addResource({ title: 'Resource B' })

    expect(settings.datesRender.calls.count()).toBe(3)
    expect(settings.eventRender.calls.count()).toBe(4)
    expect(settings.resourceRender.calls.count()).toBe(3) // +1
    expect(updateSize.calls.count()).toBe(4) // +1

    $(window).simulate('resize')

    setTimeout(function() {

      expect(settings.datesRender.calls.count()).toBe(3)
      expect(settings.eventRender.calls.count()).toBe(4)
      expect(settings.resourceRender.calls.count()).toBe(3)
      expect(updateSize.calls.count()).toBe(5) // +1

      updateSize.restore()

      done()
    }, 1) // more than windowResizeDelay
  })
})
