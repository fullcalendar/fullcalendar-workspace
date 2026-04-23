import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'
import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'

describe('timeline background events', () => {
  it('does not rerender a removed event when toggling collapse state', async () => {
    let calendar = initCalendar({
      now: '2017-03-07',
      scrollTime: '00:00',
      initialView: 'resourceTimelineDay',
      resources: [{
        id: 'root',
        children: [{
          id: 'foo',
          title: 'Some nested resource',
        }],
      }],
      events: [{
        id: '1',
        resourceId: 'foo',
        start: '2017-03-07T02:00:00',
        end: '2017-03-07T06:00:00',
        display: 'background',
      }],
    })

    let viewWrapper = new ResourceTimelineViewWrapper(calendar)
    let timelineGridWrapper = viewWrapper.timelineGrid

    await waitTimeout()
    expect(timelineGridWrapper.getBgEventEls().length).toBe(1)

    calendar.getEventById('1').remove()
    await waitTimeout()
    expect(timelineGridWrapper.getBgEventEls().length).toBe(0)

    viewWrapper.dataGrid.clickFirstExpander() // close
    await waitTimeout()
    expect(timelineGridWrapper.getBgEventEls().length).toBe(0)

    viewWrapper.dataGrid.clickFirstExpander() // open again
    await waitTimeout()

    // should stay at zero
    expect(timelineGridWrapper.getBgEventEls().length).toBe(0)
  })
})
