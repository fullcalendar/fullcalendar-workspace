import { describe, expect, it } from 'vitest'
import { initCalendar } from '@fullcalendar-tests/standard/src/lib/calendar'
import { queryPart } from '@fullcalendar-tests/standard/src/lib/models/events'
import { waitForSettle } from '@fullcalendar-tests/standard/src/lib/settle'
import { getTimelineResourceIds } from '../lib/models/resource-columns'

describe('setOption(\'resources\')', () => {
  it('rerenders the resources without rerendering the dates', async () => {
    const calendar = initCalendar({
      initialView: 'resourceTimelineDay',
      initialDate: '2019-04-01',
      resources: [
        { id: 'a', title: 'Resource A' },
        { id: 'b', title: 'Resource B' },
      ],
    })
    await waitForSettle()
    const slotHeaderEl = queryPart(calendar.el, 'slotHeader')

    calendar.setOption('resources', [{ id: 'a', title: 'Resource A' }])
    await waitForSettle()

    expect(getTimelineResourceIds(calendar.el)).toEqual(['a'])
    expect(queryPart(calendar.el, 'slotHeader')).toBe(slotHeaderEl)
  })
})
