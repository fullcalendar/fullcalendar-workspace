import { ResourceTimelineLane, SpreadsheetRow  } from '@fullcalendar/resource-timeline'
import { TimelineHeaderRows } from '@fullcalendar/timeline'
import ComponentSpy from 'standard-tests/src/lib/ComponentSpy'


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
    let timelineHeaderSpy = new ComponentSpy(TimelineHeaderRows)
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

    function expectTimelineHeaderRendered(bool) {
      expect(timelineHeaderSpy.renderCount).toBe(bool ? 1 : 0)
    }

    function expectTimelineRowRendered(bool) {
      // 2nd render is for height sync, 3rd for receiving slat coords
      expect(timelineRowSpy.renderCount).toBeLessThanOrEqual(bool ? 3 : 0)
    }

    function expectSpreadsheetRowRendered(bool) {
      // 2nd render is for height sync
      expect(spreadsheetRowSpy.renderCount).toBeLessThanOrEqual(bool ? 2 : 0)
    }

    expectTimelineHeaderRendered(true)
    expectTimelineRowRendered(true)
    expectSpreadsheetRowRendered(true)
    expect(eventRenderCnt).toBe(1)

    resetCounts()
    currentCalendar.next() // event will be out of view
    expectTimelineHeaderRendered(true)
    expectTimelineRowRendered(true)
    expectSpreadsheetRowRendered(false) // height sync doesn't cause a change. no rerender
    expect(eventRenderCnt).toBe(0)

    resetCounts()
    currentCalendar.changeView('listDay') // switch to different view
    expectTimelineHeaderRendered(false)
    expectTimelineRowRendered(false)
    expectSpreadsheetRowRendered(false)
    expect(eventRenderCnt).toBe(0)

    resetCounts()
    currentCalendar.changeView('resourceTimelineDay') // switch back to orig view
    expectTimelineHeaderRendered(true)
    expectTimelineRowRendered(true)
    expectSpreadsheetRowRendered(true)
    expect(eventRenderCnt).toBe(0) // event is now out of view

    resetCounts()
    currentCalendar.addResource({ title: 'Resource B' })
    expectTimelineHeaderRendered(false)
    expectTimelineRowRendered(true) // new row
    expectSpreadsheetRowRendered(true) // new row
    expect(eventRenderCnt).toBe(0)

    resetCounts()
    $(window).simulate('resize')
    setTimeout(function() {

      expectTimelineHeaderRendered(false)
      expectTimelineRowRendered(true) // receives new slat coords
      expectSpreadsheetRowRendered(false)
      expect(eventRenderCnt).toBe(0)

      timelineHeaderSpy.detach()
      timelineRowSpy.detach()
      spreadsheetRowSpy.detach()

      done()
    }, 1) // more than windowResizeDelay
  })
})
