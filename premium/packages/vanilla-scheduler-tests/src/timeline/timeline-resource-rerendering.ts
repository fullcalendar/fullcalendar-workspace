import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'

/*
Very similar to timeline-resource-cell-content.ts, but broken because, I think,
Preact's new native flushSync isn't really flushing everything
(needs to flush customContentRenderId context)
*/
xdescribe('timeline resource rerendering', () => {
  // https://github.com/fullcalendar/fullcalendar/issues/5586
  it('adjusts height of resource row', async () => {
    let isBig = false
    let calendar = initCalendar({
      initialView: 'resourceTimelineDay',
      resources: [
        { id: 'a', title: 'Resource A' },
        { id: 'b', title: 'Resource B' },
      ],
      resourceCellContent(info) {
        let html = 'line0<br>line1'

        if (info.resource.id === 'a' && isBig) {
          html += '<br>line2<br>line3'
        }

        return { html }
      },
    })
    await waitTimeout()

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
    await waitTimeout()

    expect(dataTd.offsetHeight).toBeGreaterThan(origHeight)

    expect(
      // fudge because bottom border applied to cell in datagrid, but row in lanes
      Math.abs(dataTd.offsetHeight - laneTd.offsetHeight),
    ).toBeLessThanOrEqual(1)
  })
})
