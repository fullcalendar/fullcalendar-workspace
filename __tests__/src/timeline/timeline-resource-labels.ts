import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'

describe('timeline resource labels', () => {
  describe('resourceLabelContent', () => {
    // https://github.com/fullcalendar/fullcalendar/issues/5586
    it('can inject new HTML when Calendar::render is called', () => {
      let renderCnt = 0
      let calendar = initCalendar({
        initialView: 'resourceTimelineDay',
        resourceLabelContent() {
          renderCnt += 1
          return { html: 'test' + renderCnt }
        },
        resources: [
          { id: 'a', title: 'Resource A' },
        ],
      })
      let dataGridWrapper = new ResourceTimelineViewWrapper(calendar).dataGrid

      expect(dataGridWrapper.getResourceInfo()[0].text).toBe('test1')
      calendar.render()
      expect(dataGridWrapper.getResourceInfo()[0].text).toBe('test2')
    })
  })
})
