import { describe, expect, it } from 'vitest'
import { initCalendar } from '@fullcalendar-tests/standard/tests/lib/calendar'
import { queryPart, queryParts } from '@fullcalendar-tests/standard/tests/lib/models/events'
import { ResourceColumnsModel } from '../lib/models/resource-columns'

describe('week numbers in resource timeGrid', () => {
  const options = {
    initialView: 'resourceTimeGridWeek',
    initialDate: '2020-12-17',
    weekNumbers: true,
    resources: [
      { id: 'a', title: 'a' },
      { id: 'b', title: 'b' },
    ],
  }

  it.each([
    ['above', true, 0],
    ['below', false, 1],
  ])('renders only in the date row when dates are %s resources', (_desc, datesAboveResources, dateRowIndex) => {
    const calendar = initCalendar({ ...options, datesAboveResources })
    const headerRowEls = Array.from(new ResourceColumnsModel(calendar.el).getHeaderEl().querySelectorAll<HTMLElement>('[role=row]'))
    const weekNumberTexts = headerRowEls.map((rowEl) => queryPart(rowEl, 'weekNumberHeader')?.textContent ?? '')
    const dateRowEl = headerRowEls[dateRowIndex]

    expect(queryParts(dateRowEl, 'dayHeader').length).toBeGreaterThan(0)
    expect(queryParts(calendar.el, 'weekNumberHeader')).toHaveLength(1)
    expect(weekNumberTexts[dateRowIndex]).toContain('W 51')
    expect(weekNumberTexts[1 - dateRowIndex]).toBe('')
  })
})
