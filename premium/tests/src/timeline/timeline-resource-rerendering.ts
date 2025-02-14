import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper.js'

describe('timeline resource rerendering', () => {
  // https://github.com/fullcalendar/fullcalendar/issues/5586
  it('adjusts height of resource row', () => {
    let isBig = false
    let calendar = initCalendar({
      initialView: 'resourceTimelineDay',
      resources: [
        { id: 'a', title: 'Resource A ' },
        { id: 'b', title: 'Resource B' },
      ],
      resourceLabelContent(info) {
        let html = 'line0<br>line1'

        if (info.resource.id === 'a' && isBig) {
          html += '<br>line2<br>line3'
        }

        return { html }
      },
    })
    let view = new ResourceTimelineViewWrapper(calendar)
    let dataTd = view.dataGrid.getResourceInfo()[0].cellEl
    let laneTd = view.timelineGrid.getResourceLaneEls()[0]
    let origHeight = dataTd.offsetHeight

    expect(
      // fudge because bottom border applied to cell in datagrid, but row in lanes
      Math.abs(origHeight - laneTd.offsetHeight),
    ).toBeLessThanOrEqual(1)

    isBig = true
    calendar.render()

    expect(dataTd.offsetHeight).toBeGreaterThan(origHeight)

    expect(
      // fudge because bottom border applied to cell in datagrid, but row in lanes
      Math.abs(dataTd.offsetHeight - laneTd.offsetHeight),
    ).toBeLessThanOrEqual(1)
  })
})
