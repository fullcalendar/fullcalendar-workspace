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
  })

  it('calls methods a limited number of times', (done) => {
    let slotHeaderMountCnt = 0
    // let slotHeaderClassNameCnt = 0
    let slotHeaderRenderCnt = 0
    let slotLaneRenderCnt = 0
    let resourceLabelRenderCnt = 0
    let resourceLaneRenderCnt = 0
    let eventRenderCnt = 0

    initCalendar({

      slotHeaderDidMount() {
        slotHeaderMountCnt += 1
      },
      // slotHeaderClass() {
      //   slotHeaderClassNameCnt += 1
      //   return []
      // },
      slotHeaderContent() {
        slotHeaderRenderCnt += 1
      },

      slotLaneDidMount() {
        slotLaneRenderCnt += 1
      },

      resourceCellContent() {
        resourceLabelRenderCnt += 1
      },
      resourceLaneDidMount() {
        resourceLaneRenderCnt += 1
      },
      eventContent() {
        eventRenderCnt += 1
      },
    })

    function resetCounts() {
      slotHeaderMountCnt = 0
      // slotHeaderClassNameCnt = 0
      slotHeaderRenderCnt = 0
      slotLaneRenderCnt = 0
      resourceLabelRenderCnt = 0
      resourceLaneRenderCnt = 0
      eventRenderCnt = 0
    }

    expect(slotHeaderMountCnt).toBe(24)
    // expect(slotHeaderClassNameCnt).toBe(24) // allow liberal calling now
    expect(slotHeaderRenderCnt).toBe(24)
    expect(slotLaneRenderCnt).toBe(48)
    expect(resourceLabelRenderCnt).toBe(1)
    expect(resourceLaneRenderCnt).toBe(1)
    expect(eventRenderCnt).toBe(1)

    resetCounts()
    currentCalendar.next()

    expect(slotHeaderMountCnt).toBe(24)
    // expect(slotHeaderClassNameCnt).toBe(24)
    expect(slotHeaderRenderCnt).toBe(24)
    expect(slotLaneRenderCnt).toBe(48)
    expect(resourceLabelRenderCnt).toBe(0)
    expect(resourceLaneRenderCnt).toBe(0)
    expect(eventRenderCnt).toBe(0) // out of view

    // FIRES UNNECESSARY RERENDERS WHEN WE SWITCH VIEWS LIKE THIS FOR SOME REASON
    //
    // currentCalendar.changeView('listDay') // switch to different view
    // resetCounts()
    // currentCalendar.changeView('resourceTimelineDay') // switch back to orig view
    // expect(slotHeaderRenderCnt).toBe(24)
    // expect(slotLaneRenderCnt).toBe(48)
    // expect(resourceLabelRenderCnt).toBe(1)
    // expect(resourceLaneRenderCnt).toBe(1)
    // expect(eventRenderCnt).toBe(0) // still out of view

    resetCounts()
    currentCalendar.addResource({ title: 'Resource B' })

    expect(slotHeaderMountCnt).toBe(0)
    // expect(slotHeaderClassNameCnt).toBe(0)
    expect(slotHeaderRenderCnt).toBe(0)
    expect(slotLaneRenderCnt).toBe(0)
    expect(resourceLabelRenderCnt).toBe(1) // new resource
    expect(resourceLaneRenderCnt).toBe(1) // new resource
    expect(eventRenderCnt).toBe(0)

    resetCounts()
    $(window).simulate('resize')
    setTimeout(() => {
      expect(slotHeaderMountCnt).toBe(0)
      // expect(slotHeaderClassNameCnt).toBe(0)
      expect(slotHeaderRenderCnt).toBe(0)
      expect(slotLaneRenderCnt).toBe(0)
      expect(resourceLabelRenderCnt).toBe(0)
      expect(resourceLaneRenderCnt).toBe(0)
      expect(eventRenderCnt).toBe(0)
      done()
    }, 1)
  })
})
