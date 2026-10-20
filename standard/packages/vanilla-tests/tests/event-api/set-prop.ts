import { describe, expect, it, vi } from 'vitest'
import { initCalendar } from '../lib/calendar'
import { waitForSettle } from '../lib/settle'
import { getRenderedEventTitles } from '../lib/event-sources'

/*
EventApi.setProp and setExtendedProp.
*/
describe('EventApi.setProp', () => {
  it('sets the id, which getEventById then finds', () => {
    const calendar = initCalendar({
      events: [{ id: '123', start: '2021-01-01' }],
    })
    const event = calendar.getEvents()[0]

    event.setProp('id', '456')

    expect(event.id).toBe('456')
    expect(calendar.getEvents()[0].id).toBe('456')
    expect(calendar.getEventById('456')).not.toBeNull()
    expect(calendar.getEventById('123')).toBeNull()
  })

  it('sets the title, rerenders, and calls eventChange', async () => {
    const eventChange = vi.fn()
    const calendar = initCalendar({
      initialView: 'dayGridMonth',
      initialDate: '2021-01-01',
      events: [{ id: '1', title: 'old', start: '2021-01-01' }],
      eventChange,
    })
    await waitForSettle()
    expect(getRenderedEventTitles(calendar.el)).toEqual(['old'])

    calendar.getEventById('1')!.setProp('title', 'new')
    await waitForSettle()

    expect(getRenderedEventTitles(calendar.el)).toEqual(['new'])
    expect(eventChange).toHaveBeenCalledTimes(1)
    expect(eventChange.mock.calls[0][0].oldEvent.title).toBe('old')
    expect(eventChange.mock.calls[0][0].event.title).toBe('new')
  })

  it('setExtendedProp sets an extended prop', () => {
    const calendar = initCalendar({
      events: [{ id: '1', start: '2021-01-01', extendedProps: { a: 1 } }],
    })
    const event = calendar.getEventById('1')!

    event.setExtendedProp('b', 2)

    expect(calendar.getEventById('1')!.extendedProps).toEqual({ a: 1, b: 2 })
  })
})
