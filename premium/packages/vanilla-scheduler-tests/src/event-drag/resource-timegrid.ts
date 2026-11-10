import { describe, expect, it, vi } from 'vitest'
import { initCalendar } from '@fullcalendar-tests/standard/src/lib/calendar'
import { TimeGridModel } from '@fullcalendar-tests/standard/src/lib/models/time-grid'
import { pointer } from '@fullcalendar-tests/standard/src/lib/pointer'
import { waitForSettle } from '@fullcalendar-tests/standard/src/lib/settle'

describe('event dragging in resource timeGrid', () => {
  const options = {
    initialView: 'resourceTimeGridWeek',
    initialDate: '2015-11-29',
    scrollTime: '00:00',
    editable: true,
    dragScroll: false,
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
    ],
    events: [{ id: '1', start: '2015-11-30T02:00:00', end: '2015-11-30T03:00:00', resourceId: 'b' }],
  }

  // the two layouts order the columns differently
  it.each([
    ['resources above dates', false],
    ['dates above resources', true],
  ])('moves an event to another date, time and resource (%s)', async (_desc, datesAboveResources) => {
    const eventDrop = vi.fn()
    const calendar = initCalendar({ ...options, datesAboveResources, eventDrop })
    await waitForSettle()

    await new TimeGridModel(calendar.el).dragEvent(
      '1',
      { date: '2015-11-30T02:00', resourceId: 'b' },
      { date: '2015-12-01T05:00', resourceId: 'a' },
    )

    const info = eventDrop.mock.calls[0][0]
    expect(info.event.startStr).toBe('2015-12-01T05:00:00Z')
    expect(info.event.endStr).toBe('2015-12-01T06:00:00Z')
    expect(info.oldResource.id).toBe('b')
    expect(info.newResource.id).toBe('a')
    expect(info.event.getResources().map((resource) => resource.id)).toEqual(['a'])
  })

  it('moves an event to another resource in RTL', async () => {
    const calendar = initCalendar({ ...options, direction: 'rtl' })
    await waitForSettle()

    await new TimeGridModel(calendar.el).dragEvent(
      '1',
      { date: '2015-11-30T02:00', resourceId: 'b' },
      { date: '2015-11-30T02:00', resourceId: 'a' },
    )

    const event = calendar.getEventById('1')!
    expect(event.startStr).toBe('2015-11-30T02:00:00Z')
    expect(event.getResources().map((resource) => resource.id)).toEqual(['a'])
  })

  describe('an event from a source with its own settings, dragged to another resource', () => {
    const sourceOptions = {
      ...options,
      events: undefined,
      eventSources: [
        {
          color: '#3472d8',
          className: 'source-class',
          overlap: false,
          events: [{ id: '1', start: '2015-11-30T02:00:00', end: '2015-11-30T03:00:00', resourceId: 'b' }],
        },
        {
          events: [{ id: '2', start: '2015-11-30T02:00:00', end: '2015-11-30T03:00:00', resourceId: 'a' }],
        },
      ],
    }

    it('keeps the source\'s color and classes on the mirror', async () => {
      const calendar = initCalendar(sourceOptions)
      await waitForSettle()

      const timeGrid = new TimeGridModel(calendar.el)
      const { point } = timeGrid.pointForEventAt('1', { date: '2015-11-30T02:00', resourceId: 'b' })
      await pointer.press(point, async () => {
        await pointer.move(timeGrid.pointForDateTime({ date: '2015-12-01T05:00', resourceId: 'a' }))
        await waitForSettle()

        const mirrorEls = timeGrid.getMirrorEls()
        expect(mirrorEls).toHaveLength(1)
        expect(mirrorEls[0].style.getPropertyValue('--fc-event-color')).toBe('#3472d8')
        expect(mirrorEls[0].classList.contains('source-class')).toBe(true)
      })
      await waitForSettle()
    })

    it('keeps the source\'s color on the mirror when dragged from all-day to timed', async () => {
      const calendar = initCalendar({
        ...options,
        events: undefined,
        eventSources: [{
          color: '#3472d8',
          events: [{ id: '1', start: '2015-11-30', resourceId: 'b' }],
        }],
      })
      await waitForSettle()

      const timeGrid = new TimeGridModel(calendar.el)
      const { point } = timeGrid.allDay.pointForEventOnDate('1', { date: '2015-11-30', resourceId: 'b' })
      await pointer.press(point, async () => {
        await pointer.move(timeGrid.pointForDateTime({ date: '2015-11-30T02:00', resourceId: 'a' }))
        await waitForSettle()

        const mirrorEls = timeGrid.getMirrorEls()
        expect(mirrorEls).toHaveLength(1)
        expect(mirrorEls[0].style.getPropertyValue('--fc-event-color')).toBe('#3472d8')
      })
      await waitForSettle()

      expect(calendar.getEventById('1')!.startStr).toBe('2015-11-30T02:00:00Z')
    })

    it('obeys the source\'s overlap setting', async () => {
      const calendar = initCalendar(sourceOptions)
      await waitForSettle()

      await new TimeGridModel(calendar.el).dragEvent(
        '1',
        { date: '2015-11-30T02:00', resourceId: 'b' },
        { date: '2015-11-30T02:00', resourceId: 'a' },
      )

      expect(calendar.getEventById('1')!.getResources().map((resource) => resource.id)).toEqual(['b'])
    })
  })

  it('moves an event between resources but keeps its time when only the resource is editable', async () => {
    const calendar = initCalendar({
      ...options,
      initialView: 'resourceTimeGridDay',
      initialDate: '2015-11-30',
      eventStartEditable: false,
      eventResourceEditable: true,
    })
    await waitForSettle()

    await new TimeGridModel(calendar.el).dragEvent(
      '1',
      { date: '2015-11-30T02:00', resourceId: 'b' },
      { date: '2015-11-30T05:00', resourceId: 'a' },
    )

    const event = calendar.getEventById('1')!
    expect(event.startStr).toBe('2015-11-30T02:00:00Z')
    expect(event.getResources().map((resource) => resource.id)).toEqual(['a'])
  })
})
