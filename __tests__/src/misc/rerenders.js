
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
    let slotLabelRenderCnt = 0
    let slotLaneRenderCnt = 0
    let resourceLabelRenderCnt = 0
    let resourceLaneRenderCnt = 0
    let eventRenderCnt = 0

    initCalendar({
      slotLabelContent() {
        slotLabelRenderCnt++
      },
      slotLaneContent() {
        slotLaneRenderCnt++
      },
      resourceLabelContent() {
        resourceLabelRenderCnt++
      },
      resourceLaneContent() {
        resourceLaneRenderCnt++
      },
      eventContent() {
        eventRenderCnt++
      }
    })

    function resetCounts() {
      slotLabelRenderCnt = 0
      slotLaneRenderCnt = 0
      resourceLabelRenderCnt = 0
      resourceLaneRenderCnt = 0
      eventRenderCnt = 0
    }

    expect(slotLabelRenderCnt).toBe(24)
    expect(slotLaneRenderCnt).toBe(48)
    expect(resourceLabelRenderCnt).toBe(1)
    expect(resourceLaneRenderCnt).toBe(1)
    expect(eventRenderCnt).toBe(1)

    resetCounts()
    currentCalendar.next()

    expect(slotLabelRenderCnt).toBe(24)
    expect(slotLaneRenderCnt).toBe(48)
    expect(resourceLabelRenderCnt).toBe(0)
    expect(resourceLaneRenderCnt).toBe(0)
    expect(eventRenderCnt).toBe(0) // out of view

    // FIRES UNNECESSARY ContentHook RERENDERS WHEN WE SWITCH VIEWS LIKE THIS FOR SOME REASON
    //
    // currentCalendar.changeView('listDay') // switch to different view
    // resetCounts()
    // currentCalendar.changeView('resourceTimelineDay') // switch back to orig view
    // expect(slotLabelRenderCnt).toBe(24)
    // expect(slotLaneRenderCnt).toBe(48)
    // expect(resourceLabelRenderCnt).toBe(1)
    // expect(resourceLaneRenderCnt).toBe(1)
    // expect(eventRenderCnt).toBe(0) // still out of view

    resetCounts()
    currentCalendar.addResource({ title: 'Resource B' })

    expect(slotLabelRenderCnt).toBe(0)
    expect(slotLaneRenderCnt).toBe(0)
    expect(resourceLabelRenderCnt).toBe(1) // new resource
    expect(resourceLaneRenderCnt).toBe(1) // new resource
    expect(eventRenderCnt).toBe(0)

    resetCounts()
    $(window).simulate('resize')
    setTimeout(function() {

      expect(slotLabelRenderCnt).toBe(0)
      expect(slotLaneRenderCnt).toBe(0)
      expect(resourceLabelRenderCnt).toBe(0)
      expect(resourceLaneRenderCnt).toBe(0)
      expect(eventRenderCnt).toBe(0)
      done()

    }, 1) // more than windowResizeDelay
  })

})
