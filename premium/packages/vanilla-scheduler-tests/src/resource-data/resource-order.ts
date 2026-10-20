import { describe, expect, it } from 'vitest'
import { initCalendar } from '@fullcalendar-tests/standard/src/lib/calendar'
import { getTimelineResourceIds, ResourceColumnsModel } from '../lib/models/resource-columns'

describe('resourceOrder', () => {
  // given out of order. ids, titles and floors each sort differently
  const resources = [
    { id: 'b', title: 'Auditorium 1', floor: 2 },
    { id: 'a2', title: 'Auditorium 3', floor: 1 },
    { id: 'a', title: 'Auditorium 4', floor: 3 },
    { id: 'b2', title: 'Auditorium 2', floor: 0 },
  ]

  describe('in resource timeline', () => {
    it.each([
      ['by id when not set', undefined, ['a', 'a2', 'b', 'b2']],
      ['by title', 'title', ['b', 'b2', 'a2', 'a']],
      ['by descending title', '-title', ['a', 'a2', 'b2', 'b']],
      ['by a custom field', 'floor', ['b2', 'a2', 'b', 'a']],
      // the function gets plain objects with the extended props flattened in, not ResourceApis
      ['by a compare function', (r0: any, r1: any) => r1.floor - r0.floor, ['a', 'b', 'a2', 'b2']],
    ])('orders rows %s', (_desc, resourceOrder, expectedIds) => {
      const calendar = initCalendar({ initialView: 'resourceTimelineDay', resources, resourceOrder })

      expect(getTimelineResourceIds(calendar.el)).toEqual(expectedIds)
    })
  })

  describe('in resource timeGrid', () => {
    it.each([
      ['by id when not set', undefined, ['a', 'a2', 'b', 'b2']],
      ['by title', 'title', ['b', 'b2', 'a2', 'a']],
    ])('orders columns %s', (_desc, resourceOrder, expectedIds) => {
      const calendar = initCalendar({ initialView: 'resourceTimeGridDay', resources, resourceOrder })

      expect(new ResourceColumnsModel(calendar.el).getResourceHeaderIds()).toEqual(expectedIds)
    })
  })
})
