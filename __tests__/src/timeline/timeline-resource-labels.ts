import { ResourceTimelineViewWrapper } from "../lib/wrappers/ResourceTimelineViewWrapper"

describe('timeline resource labels', function() {

  describe('resourceLabelContent', function() {

    // https://github.com/fullcalendar/fullcalendar/issues/5586
    it('can inject new HTML when Calendar::render is called', function() {
      let renderCnt = 0
      let calendar = initCalendar({
        initialView: 'resourceTimelineDay',
        resourceLabelContent() {
          renderCnt++
          return { html: 'test' + renderCnt }
        },
        resources: [
          { id: 'a', title: 'Resource A' }
        ]
      })
      let dataGridWrapper = new ResourceTimelineViewWrapper(calendar).dataGrid

      expect(dataGridWrapper.getResourceInfo()[0].text).toBe('test1')
      calendar.render()
      expect(dataGridWrapper.getResourceInfo()[0].text).toBe('test2')
    })

  })

})
