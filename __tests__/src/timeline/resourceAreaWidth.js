import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'


describe('resourceAreaWidth', function() {

  it('can be changed dynamically', function() {
    let calendar = initCalendar({
      initialView: 'resourceTimelineDay',
      resourceAreaWidth: 200
    })

    let viewWrapper = new ResourceTimelineViewWrapper(calendar)
    expect(viewWrapper.getDataGridWidth()).toBe(200)

    calendar.setOption('resourceAreaWidth', 300)
    expect(viewWrapper.getDataGridWidth()).toBe(300)
  })

})
