import { waitDateSelect } from '@fullcalendar-tests/standard/lib/wrappers/interaction-util'
import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'

describe('selectAllow', () => {
  pushOptions({
    now: '2016-09-04',
    initialView: 'resourceTimelineWeek',
    scrollTime: '00:00',
    selectable: true,
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
    ],
  })

  it('disallows selecting when returning false', async () => { // and given correct params
    let isCalled = false
    let calendar = initCalendar({
      selectAllow(selectInfo) {
        expect(selectInfo.resource.id).toBe('b')
        isCalled = true
        return false
      },
    })

    await waitTimeout()
    let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid
    let selecting = timelineGridWrapper.selectDates(
      { resourceId: 'b', date: '2016-09-04T03:00:00' },
      { resourceId: 'b', date: '2016-09-04T06:00:00' },
    )

    let selectInfo = await waitDateSelect(calendar, selecting)
    expect(selectInfo).toBeFalsy() // drop failure?
    expect(isCalled).toBe(true)
  })

  it('allows selecting when returning false', async () => {
    let isCalled = false
    let calendar = initCalendar({
      selectAllow() {
        isCalled = true
        return true
      },
    })

    await waitTimeout()
    let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid
    let selecting = timelineGridWrapper.selectDates(
      { resourceId: 'b', date: '2016-09-04T03:00:00' },
      { resourceId: 'b', date: '2016-09-04T06:00:00' },
    )

    let selectInfo = await waitDateSelect(calendar, selecting)
    expect(typeof selectInfo).toBe('object')
    expect(selectInfo.start).toEqualDate('2016-09-04T03:00:00Z')
    expect(selectInfo.end).toEqualDate('2016-09-04T06:00:00Z') // because hour slots
    expect(isCalled).toBe(true)
  })
})
