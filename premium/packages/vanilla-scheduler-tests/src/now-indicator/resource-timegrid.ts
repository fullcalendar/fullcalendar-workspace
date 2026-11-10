import { describe, expect, it } from 'vitest'
import { Calendar } from 'fullcalendar'
import { initCalendar } from '@fullcalendar-tests/standard/src/lib/calendar'
import { queryPart } from '@fullcalendar-tests/standard/src/lib/models/events'
import { waitForSettle } from '@fullcalendar-tests/standard/src/lib/settle'
import { createHeldFetch } from '../lib/fetching'
import { ResourceColumnsModel } from '../lib/models/resource-columns'

describe('now indicator in resource timeGrid', () => {
  /*
  The columns (`date:resourceId`) with a now-indicator line.
  */
  function getColumnsWithLine(calendar: Calendar): string[] {
    return new ResourceColumnsModel(calendar.el).getDayLaneEls()
      .filter((el) => queryPart(el, 'nowIndicatorLine'))
      .map((el) => el.getAttribute('data-date') + ':' + el.getAttribute('data-resource-id'))
  }

  it('renders a line in today\'s column of each resource', async () => {
    const calendar = initCalendar({
      initialView: 'resourceTimeGridThreeDay',
      views: { resourceTimeGridThreeDay: { type: 'resourceTimeGrid', duration: { days: 3 } } },
      now: '2015-12-26T02:30:00',
      scrollTime: '00:00',
      nowIndicator: true,
      resources: [
        { id: 'a', title: 'Resource A' },
        { id: 'b', title: 'Resource B' },
      ],
    })
    await waitForSettle()

    expect(getColumnsWithLine(calendar)).toEqual(['2015-12-26:a', '2015-12-26:b'])
  })

  // https://github.com/fullcalendar/fullcalendar/issues/3918
  it('survives async resource refetches across navigation and view switches', async () => {
    const heldResources = createHeldFetch(() => [
      { title: 'resource a', id: 'a' },
      { title: 'resource b', id: 'b' },
    ])
    const heldEvents = createHeldFetch(() => [
      { title: 'event1', start: '2016-12-04T01:00:00', resourceId: 'a' },
      { title: 'event2', start: '2016-12-04T02:00:00', resourceId: 'b' },
      { title: 'event3', start: '2016-12-05T03:00:00', resourceId: 'a' },
    ])
    const calendar = initCalendar({
      initialView: 'resourceTimeGridWeek',
      initialDate: '2016-11-04',
      now: '2016-12-04T10:00',
      scrollTime: '09:00',
      nowIndicator: true,
      refetchResourcesOnNavigate: true,
      resources: heldResources.fetch,
      events: heldEvents.fetch,
    })
    async function releaseFetches() {
      await waitForSettle()
      await heldResources.releaseAll()
      await heldEvents.releaseAll()
    }
    await releaseFetches()

    calendar.changeView('resourceTimeGridDay')
    await releaseFetches()
    calendar.today()
    await releaseFetches()
    calendar.changeView('resourceTimeGridWeek')
    await releaseFetches()
    calendar.changeView('resourceTimeGridDay')
    await releaseFetches()

    expect(heldResources.fetch.mock.calls.length).toBeGreaterThanOrEqual(5)
    expect(calendar.view.currentStart.toISOString()).toBe('2016-12-04T00:00:00.000Z')
    expect(getColumnsWithLine(calendar)).toEqual(['2016-12-04:a', '2016-12-04:b'])
  })
})
