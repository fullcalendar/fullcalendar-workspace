import { strictModeFactor } from '@fullcalendar/core/vdom'
import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper.js'

describe('timeline resource labels', () => {
  describe('resourceCellContent', () => {
    // https://github.com/fullcalendar/fullcalendar/issues/5586
    it('can inject new HTML when Calendar::render is called', () => {
      let renderCnt = 0
      let calendar = initCalendar({
        initialView: 'resourceTimelineDay',
        resourceCellContent() {
          return { html: 'test' + Math.trunc(renderCnt++ / strictModeFactor) }
        },
        resources: [
          { id: 'a', title: 'Resource A' },
        ],
      })
      let dataGridWrapper = new ResourceTimelineViewWrapper(calendar).dataGrid

      expect(dataGridWrapper.getResourceInfo()[0].text).toBe('test0')
      calendar.render()
      expect(dataGridWrapper.getResourceInfo()[0].text).toBe('test1')
    })
  })
})
