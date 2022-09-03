describe('rerender performance for resource timeline', () => {
  pushOptions({
    initialDate: '2017-10-04',
    initialView: 'resourceTimelineDay',
    resources: [
      { id: 'a', title: 'Resource A' },
    ],
    events: [
      { title: 'event 0', start: '2017-10-04', resourceId: 'a' },
    ],
    windowResizeDelay: 0,
  })

  it('calls methods a limited number of times', (done) => {
    let slotLabelMountCnt = 0
    let slotLabelClassNameCnt = 0
    let slotLabelRenderCnt = 0
    let slotLaneRenderCnt = 0
    let resourceLabelRenderCnt = 0
    let resourceLaneRenderCnt = 0
    let eventRenderCnt = 0

    initCalendar({

      slotLabelDidMount() {
        slotLabelMountCnt += 1
      },
      slotLabelClassNames() {
        slotLabelClassNameCnt += 1
        return []
      },
      slotLabelContent() {
        slotLabelRenderCnt += 1
      },

      slotLaneContent() {
        slotLaneRenderCnt += 1
      },

      resourceLabelContent() {
        resourceLabelRenderCnt += 1
      },
      resourceLaneContent() {
        resourceLaneRenderCnt += 1
      },
      eventContent() {
        eventRenderCnt += 1
      },
    })

    function resetCounts() {
      slotLabelMountCnt = 0
      slotLabelClassNameCnt = 0
      slotLabelRenderCnt = 0
      slotLaneRenderCnt = 0
      resourceLabelRenderCnt = 0
      resourceLaneRenderCnt = 0
      eventRenderCnt = 0
    }

    expect(slotLabelMountCnt).toBe(24)
    expect(slotLabelClassNameCnt).toBe(24)
    expect(slotLabelRenderCnt).toBe(24)
    expect(slotLaneRenderCnt).toBe(48)
    expect(resourceLabelRenderCnt).toBe(1)
    expect(resourceLaneRenderCnt).toBe(1)
    expect(eventRenderCnt).toBe(1)

    resetCounts()
    currentCalendar.next()

    expect(slotLabelMountCnt).toBe(24)
    expect(slotLabelClassNameCnt).toBe(24)
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

    expect(slotLabelMountCnt).toBe(0)
    expect(slotLabelClassNameCnt).toBe(0)
    expect(slotLabelRenderCnt).toBe(0)
    expect(slotLaneRenderCnt).toBe(0)
    expect(resourceLabelRenderCnt).toBe(1) // new resource
    expect(resourceLaneRenderCnt).toBe(1) // new resource
    expect(eventRenderCnt).toBe(0)

    resetCounts()
    $(window).simulate('resize')
    setTimeout(() => {
      expect(slotLabelMountCnt).toBe(0)
      expect(slotLabelClassNameCnt).toBe(0)
      expect(slotLabelRenderCnt).toBe(0)
      expect(slotLaneRenderCnt).toBe(0)
      expect(resourceLabelRenderCnt).toBe(0)
      expect(resourceLaneRenderCnt).toBe(0)
      expect(eventRenderCnt).toBe(0)
      done()
    }, 1) // more than windowResizeDelay
  })
})
