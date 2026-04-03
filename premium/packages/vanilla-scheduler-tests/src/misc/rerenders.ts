import { strictModeFactor } from 'fullcalendar/protected-api'
import { ignoreResizeObserverLoops, waitTimeout } from '@fullcalendar-tests/standard/lib/misc'

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

  it('calls methods a limited number of times', async () => {
    let slotHeaderMountCnt = 0
    let slotHeaderRenderCnt = 0
    let slotLaneRenderCnt = 0
    let resourceLabelRenderCnt = 0
    let resourceLaneRenderCnt = 0
    let eventRenderCnt = 0

    initCalendar({
      slotHeaderDidMount() {
        slotHeaderMountCnt += 1
      },
      slotHeaderContent() {
        slotHeaderRenderCnt += 1
      },
      slotLaneDidMount() {
        slotLaneRenderCnt += 1
      },
      resourceCellContent() {
        resourceLabelRenderCnt += 1
        return true
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
      slotHeaderRenderCnt = 0
      slotLaneRenderCnt = 0
      resourceLabelRenderCnt = 0
      resourceLaneRenderCnt = 0
      eventRenderCnt = 0
    }

    expect(slotHeaderMountCnt).toBe(24 * strictModeFactor)
    expect(slotHeaderRenderCnt).toBe(24 * strictModeFactor)
    expect(slotLaneRenderCnt).toBe(48 * strictModeFactor)
    expect(resourceLabelRenderCnt).toBe(1 * strictModeFactor)
    expect(resourceLaneRenderCnt).toBe(1 * strictModeFactor)
    expect(eventRenderCnt).toBe(1 * strictModeFactor)

    resetCounts()
    currentCalendar.next()

    expect(slotHeaderMountCnt).toBe(24 * strictModeFactor)
    expect(slotHeaderRenderCnt).toBe(24 * strictModeFactor)
    expect(slotLaneRenderCnt).toBe(48 * strictModeFactor)
    expect(resourceLabelRenderCnt).toBe(0 * strictModeFactor)
    expect(resourceLaneRenderCnt).toBe(0 * strictModeFactor)
    expect(eventRenderCnt).toBe(0 * strictModeFactor) // out of view

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

    await ignoreResizeObserverLoops(async () => {
      resetCounts()
      currentCalendar.addResource({ title: 'Resource B' })

      expect(slotHeaderMountCnt).toBe(0 * strictModeFactor)
      expect(slotHeaderRenderCnt).toBe(0 * strictModeFactor)
      expect(slotLaneRenderCnt).toBe(0 * strictModeFactor)
      expect(resourceLabelRenderCnt).toBe(1 * strictModeFactor) // new resource
      expect(resourceLaneRenderCnt).toBe(1 * strictModeFactor) // new resource
      expect(eventRenderCnt).toBe(0 * strictModeFactor)

      resetCounts()

      $(window).simulate('resize')
      await waitTimeout()

      expect(slotHeaderMountCnt).toBe(0 * strictModeFactor)
      expect(slotHeaderRenderCnt).toBe(0 * strictModeFactor)
      expect(slotLaneRenderCnt).toBe(0 * strictModeFactor)
      expect(resourceLabelRenderCnt).toBe(0 * strictModeFactor)
      expect(resourceLaneRenderCnt).toBe(0 * strictModeFactor)
      expect(eventRenderCnt).toBe(0 * strictModeFactor)
    })
  })
})
