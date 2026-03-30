import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'

describe('resourceColumnsWidth', () => {
  it('can be changed dynamically', async () => {
    let calendar = initCalendar({
      initialView: 'resourceTimelineDay',
      resourceColumnsWidth: 200,
    })

    await waitTimeout()
    let viewWrapper = new ResourceTimelineViewWrapper(calendar)
    expect(Math.abs(viewWrapper.getDataGridWidth() - 200)).toBeLessThan(2)

    calendar.setOption('resourceColumnsWidth', 300)
    await waitTimeout()
    expect(Math.abs(viewWrapper.getDataGridWidth() - 300)).toBeLessThan(2)
  })
})
