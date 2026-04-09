import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { strictModeFactor } from 'fullcalendar/protected-api'
import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'

describe('timeline resource labels', () => {
  describe('resourceCellContent', () => {

    // https://github.com/fullcalendar/fullcalendar/issues/5586
    //
    // NOTE: if you do step-by-step breakpoints, test will fail :(
    // Maybe something to do with queue-microtask
    //
    it('can inject new HTML when Calendar::render is called', async () => {
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
      await waitTimeout()
      expect(dataGridWrapper.getResourceInfo()[0].text).toBe('test1')
    })
  })
})
