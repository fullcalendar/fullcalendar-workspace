import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { Draggable } from 'fullcalendar/interaction'
import { appendTestElement, initCalendar } from '@fullcalendar-tests/standard/tests/lib/calendar'
import { createExternalEl, dragExternalEl } from '@fullcalendar-tests/standard/tests/lib/external'
import { DayGridModel } from '@fullcalendar-tests/standard/tests/lib/models/day-grid'
import { TimeGridModel } from '@fullcalendar-tests/standard/tests/lib/models/time-grid'
import { getRectCenter, pointer } from '@fullcalendar-tests/standard/tests/lib/pointer'
import { waitForSettle } from '@fullcalendar-tests/standard/tests/lib/settle'
import { TimelineModel } from '../lib/models/timeline'

describe('dragging external elements onto resource views', () => {
  const options = {
    initialDate: '2015-11-29',
    scrollTime: '00:00',
    dragScroll: false,
    droppable: true,
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
    ],
  }

  function makeDraggable(el: HTMLElement): void {
    const draggable = new Draggable(el, { eventData: { title: 'my external event' } })
    onTestFinished(() => draggable.destroy())
  }

  it.each([
    ['a resource timeline', 'resourceTimelineDay'],
    ['a resource timeline after switching views', 'resourceTimelineWeek'],
  ])('creates an event on the resource under the pointer in %s', async (_desc, view) => {
    const drop = vi.fn()
    const calendar = initCalendar({ ...options, initialView: 'resourceTimelineDay', drop })
    if (view !== 'resourceTimelineDay') {
      calendar.changeView(view)
    }
    await waitForSettle()

    const externalEl = createExternalEl()
    makeDraggable(externalEl)
    await dragExternalEl(externalEl, () => new TimelineModel(calendar.el).pointForDateTime({ date: '2015-11-29T05:00', resourceId: 'b' }))

    expect(drop.mock.calls[0][0].dateStr).toBe('2015-11-29T05:00:00Z')
    const event = calendar.getEvents()[0]
    expect(event.title).toBe('my external event')
    expect(event.startStr).toBe('2015-11-29T05:00:00Z')
    expect(event.end).toBeNull()
    expect(event.getResources().map((resource) => resource.id)).toEqual(['b'])
  })

  it('creates an event on the resource under the pointer in resource timeGrid', async () => {
    const calendar = initCalendar({ ...options, initialView: 'resourceTimeGridWeek' })
    await waitForSettle()

    const externalEl = createExternalEl()
    makeDraggable(externalEl)
    await dragExternalEl(externalEl, () => new TimeGridModel(calendar.el).pointForDateTime({ date: '2015-12-01T05:00', resourceId: 'a' }))

    const event = calendar.getEvents()[0]
    expect(event.startStr).toBe('2015-12-01T05:00:00Z')
    expect(event.getResources().map((resource) => resource.id)).toEqual(['a'])
  })

  it('creates an event on the resource under the pointer in resource dayGrid, at the event data\'s startTime', async () => {
    const drop = vi.fn()
    const calendar = initCalendar({ ...options, initialView: 'resourceDayGridWeek', drop })
    await waitForSettle()

    const externalEl = createExternalEl()
    const draggable = new Draggable(externalEl, { eventData: { title: 'my external event', startTime: '05:00' } })
    onTestFinished(() => draggable.destroy())
    await dragExternalEl(externalEl, () => new DayGridModel(calendar.el).pointForDate({ date: '2015-12-01', resourceId: 'a' }))

    // https://github.com/fullcalendar/fullcalendar/issues/2955: drop reports the day, not the startTime
    expect(drop.mock.calls[0][0].dateStr).toBe('2015-12-01')

    const event = calendar.getEvents()[0]
    expect(event.startStr).toBe('2015-12-01T05:00:00Z')
    expect(event.end).toBeNull()
    expect(event.getResources().map((resource) => resource.id)).toEqual(['a'])
  })

  // https://github.com/fullcalendar/fullcalendar-scheduler/issues/256 (for dragging, not dateClick)
  it('doesn\'t drop when the pointer is beside the calendar, level with its slots', async () => {
    const drop = vi.fn()
    const wrapEl = appendTestElement(document.createElement('div'))
    wrapEl.style.cssText = 'position:relative;width:900px'
    const calendarEl = wrapEl.appendChild(document.createElement('div'))
    const externalEl = wrapEl.appendChild(document.createElement('div'))
    externalEl.textContent = 'external'
    externalEl.style.cssText = 'position:absolute;left:100%;top:80px;width:100px'
    initCalendar({ ...options, initialView: 'resourceTimelineDay', headerToolbar: false, drop }, calendarEl)
    await waitForSettle()

    makeDraggable(externalEl)
    const start = getRectCenter(externalEl.getBoundingClientRect())
    await pointer.press(start, async () => {
      await pointer.move({ x: start.x, y: start.y + 10 })
      await waitForSettle()
    })
    await waitForSettle()

    expect(drop).not.toHaveBeenCalled()
  })

  it('doesn\'t fail when dragged after the calendar is destroyed', async () => {
    const calendar = initCalendar({ ...options, initialView: 'resourceTimelineDay' })
    await waitForSettle()

    const externalEl = createExternalEl()
    makeDraggable(externalEl)
    calendar.destroy()

    const start = getRectCenter(externalEl.getBoundingClientRect())
    await pointer.press(start, async () => {
      await pointer.move({ x: start.x + 100, y: start.y - 100 })
    })
    await waitForSettle()
    // passes if nothing throws
  })
})
