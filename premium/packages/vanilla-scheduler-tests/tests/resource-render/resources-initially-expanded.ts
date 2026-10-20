import { describe, expect, it } from 'vitest'
import { Calendar } from 'fullcalendar'
import { initCalendar } from '@fullcalendar-tests/standard/tests/lib/calendar'
import { getEventEls, queryPart, queryParts } from '@fullcalendar-tests/standard/tests/lib/models/events'
import { getRectCenter, pointer } from '@fullcalendar-tests/standard/tests/lib/pointer'
import { waitForSettle } from '@fullcalendar-tests/standard/tests/lib/settle'
import { getTimelineResourceIds } from '../lib/models/resource-columns'

describe('resourcesInitiallyExpanded', () => {
  const options = {
    initialView: 'resourceTimelineDay',
    initialDate: '2017-10-10',
    scrollTime: '09:00',
    resources: [{
      id: 'a',
      title: 'Resource A',
      children: [
        { id: 'a1', title: 'Resource A1' },
        { id: 'a2', title: 'Resource A2' },
      ],
    }],
  }

  async function clickFirstExpander(calendar: Calendar) {
    await pointer.click(getRectCenter(queryPart(calendar.el, 'resourceExpander')!.getBoundingClientRect()))
    await waitForSettle()
  }

  it.each([
    [true, ['a', 'a1', 'a2']],
    [false, ['a']],
  ])('when %s, shows rows %j', (resourcesInitiallyExpanded, expectedIds) => {
    const calendar = initCalendar({ ...options, resourcesInitiallyExpanded })

    expect(getTimelineResourceIds(calendar.el)).toEqual(expectedIds)
  })

  describe('collapsed rows', () => {
    it.each([
      ['background', { display: 'background', start: '2017-10-10T10:00:00' }, 'backgroundEvent'],
      ['foreground', { start: '2017-10-10T08:00:00', end: '2017-10-10T12:00:00' }, 'event'],
    ])('when false, renders a child\'s %s event once expanded', async (_desc, eventProps, part) => {
      const calendar = initCalendar({
        ...options,
        resourcesInitiallyExpanded: false,
        events: [{ id: '1', title: 'event1', resourceId: 'a1', ...eventProps }],
      })
      await waitForSettle()
      expect(queryParts(calendar.el, part)).toHaveLength(0)

      await clickFirstExpander(calendar)

      expect(getTimelineResourceIds(calendar.el)).toEqual(['a', 'a1', 'a2'])
      expect(queryParts(calendar.el, part)).toHaveLength(1)
      if (part === 'event') {
        expect(getEventEls(calendar.el, '1')).toHaveLength(1)
      }
    })

    it('when false, starts with resource groups collapsed', () => {
      const calendar = initCalendar({
        ...options,
        resourcesInitiallyExpanded: false,
        resourceGroupField: 'customField',
        resources: [{ title: 'a', id: 'a', customField: 1 }],
      })

      expect(getTimelineResourceIds(calendar.el)).toEqual([])
      expect(queryParts(calendar.el, 'resourceGroupLane')).toHaveLength(1)
    })

    it('when true, starts with resource groups expanded', () => {
      const calendar = initCalendar({
        ...options,
        resourcesInitiallyExpanded: true,
        resourceGroupField: 'customField',
        resources: [{ title: 'a', id: 'a', customField: 1 }],
      })

      expect(getTimelineResourceIds(calendar.el)).toEqual(['a'])
      expect(queryParts(calendar.el, 'resourceGroupLane')).toHaveLength(1)
    })
  })
})
