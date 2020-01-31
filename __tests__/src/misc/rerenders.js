import { ResourceTimelineLane, SpreadsheetRow  } from '@fullcalendar/resource-timeline'
import { TimelineHeader } from '@fullcalendar/timeline'
import ComponentSpy from 'package-tests/lib/ComponentSpy'


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
    let timelineHeaderSpy = new ComponentSpy(TimelineHeader)
    let timelineRowSpy = new ComponentSpy(ResourceTimelineLane)
    let spreadsheetRowSpy = new ComponentSpy(SpreadsheetRow)
    let eventRenderCnt = 0

    initCalendar({
      eventRender() {
        eventRenderCnt++
      }
    })

    function resetCounts() {
      timelineHeaderSpy.resetCounts()
      timelineRowSpy.resetCounts()
      spreadsheetRowSpy.resetCounts()
      eventRenderCnt = 0
    }

    expect(timelineHeaderSpy.renderCount).toBeLessThanOrEqual(2)
    expect(timelineHeaderSpy.sizingCount).toBeLessThanOrEqual(2)
    expect(timelineRowSpy.renderCount).toBeLessThanOrEqual(2)
    expect(timelineRowSpy.sizingCount).toBeLessThanOrEqual(2)
    expect(spreadsheetRowSpy.renderCount).toBeLessThanOrEqual(2)
    expect(spreadsheetRowSpy.sizingCount).toBeLessThanOrEqual(2)
    expect(eventRenderCnt).toBe(1)

    resetCounts()
    currentCalendar.next() // event will be out of view
    expect(timelineHeaderSpy.renderCount).toBeLessThanOrEqual(2)
    expect(timelineHeaderSpy.sizingCount).toBeLessThanOrEqual(2)
    expect(timelineRowSpy.renderCount).toBeLessThanOrEqual(2) // events are removed
    expect(timelineRowSpy.sizingCount).toBeLessThanOrEqual(2) // events are removed
    expect(spreadsheetRowSpy.renderCount).toBe(0)
    expect(spreadsheetRowSpy.sizingCount).toBe(0)
    expect(eventRenderCnt).toBe(0)

    resetCounts()
    currentCalendar.changeView('listDay') // switch to different view
    expect(timelineHeaderSpy.renderCount).toBe(0)
    expect(timelineHeaderSpy.sizingCount).toBe(0)
    expect(timelineRowSpy.renderCount).toBe(0)
    expect(timelineRowSpy.sizingCount).toBe(0)
    expect(spreadsheetRowSpy.renderCount).toBe(0)
    expect(spreadsheetRowSpy.sizingCount).toBe(0)
    expect(eventRenderCnt).toBe(0)

    resetCounts()
    currentCalendar.changeView('resourceTimelineDay') // switch back to orig view
    expect(timelineHeaderSpy.renderCount).toBeLessThanOrEqual(2)
    expect(timelineHeaderSpy.sizingCount).toBeLessThanOrEqual(2)
    expect(timelineRowSpy.renderCount).toBeLessThanOrEqual(2)
    expect(timelineRowSpy.sizingCount).toBeLessThanOrEqual(2)
    expect(spreadsheetRowSpy.renderCount).toBeLessThanOrEqual(2)
    expect(spreadsheetRowSpy.sizingCount).toBeLessThanOrEqual(2)
    expect(eventRenderCnt).toBe(0) // event is now out of view

    resetCounts()
    currentCalendar.addResource({ title: 'Resource B' })
    expect(timelineHeaderSpy.renderCount).toBe(0)
    expect(timelineHeaderSpy.sizingCount).toBe(0)
    expect(timelineRowSpy.renderCount).toBeLessThanOrEqual(2) // new row
    expect(timelineRowSpy.sizingCount).toBeLessThanOrEqual(2) // new row
    expect(spreadsheetRowSpy.renderCount).toBeLessThanOrEqual(2) // new row
    expect(spreadsheetRowSpy.sizingCount).toBeLessThanOrEqual(2) // new row
    expect(eventRenderCnt).toBe(0)

    resetCounts()
    $(window).simulate('resize')
    setTimeout(function() {

      // allow some rerendering as a result of handleSizing, but that's it
      expect(timelineHeaderSpy.renderCount).toBeLessThanOrEqual(1)
      expect(timelineHeaderSpy.sizingCount).toBeLessThanOrEqual(2)
      expect(timelineRowSpy.renderCount).toBeLessThanOrEqual(1)
      expect(timelineRowSpy.sizingCount).toBeLessThanOrEqual(2)
      expect(spreadsheetRowSpy.renderCount).toBeLessThanOrEqual(1)
      expect(spreadsheetRowSpy.sizingCount).toBeLessThanOrEqual(2)
      expect(eventRenderCnt).toBe(0)

      timelineHeaderSpy.detach()
      timelineRowSpy.detach()
      spreadsheetRowSpy.detach()

      done()
    }, 1) // more than windowResizeDelay
  })
})
