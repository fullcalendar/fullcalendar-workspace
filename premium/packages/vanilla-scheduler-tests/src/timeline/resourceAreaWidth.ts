import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper.js'

describe('resourceColumnsWidth', () => {
  it('can be changed dynamically', () => {
    let calendar = initCalendar({
      initialView: 'resourceTimelineDay',
      resourceColumnsWidth: 200,
    })

    let viewWrapper = new ResourceTimelineViewWrapper(calendar)
    expect(Math.abs(viewWrapper.getDataGridWidth() - 200)).toBeLessThan(2)

    calendar.setOption('resourceColumnsWidth', 300)
    expect(Math.abs(viewWrapper.getDataGridWidth() - 300)).toBeLessThan(2)
  })
})
