import { describe, expect, it, vi } from 'vitest'
import { initCalendar } from '../lib/calendar'
import { TimeGridModel } from '../lib/models/time-grid'
import { isElVisible, queryPart, queryParts } from '../lib/models/events'
import { pointer } from '../lib/pointer'
import { waitForSettle } from '../lib/settle'

describe.each(['timeGridWeek', 'timeGridDay'])('all-day drop boundary in %s', (initialView) => {
  describe.each(['ltr', 'rtl'] as const)('%s', (direction) => {
    const options = {
      initialView,
      direction,
      initialDate: '2014-06-11',
      scrollTime: '01:00',
      editable: true,
      dragScroll: false,
      events: [{ id: '1', start: '2014-06-11T01:00' }],
    }
    const dropDate = initialView === 'timeGridDay' ? '2014-06-11' : '2014-06-10'

    it.each([2, 5, 9, 12, 'center'] as const)('drops as all-day at %s px above the cell bottom', async (offset) => {
      const eventDrop = vi.fn()
      const calendar = initCalendar({ ...options, eventDrop })
      await waitForSettle()

      const grid = new TimeGridModel(calendar.el)
      const { point } = grid.pointForEventAt('1', '2014-06-11T01:00')
      const cell = grid.allDay.getDayCell(dropDate)
      const rect = cell.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = offset === 'center' ? rect.top + rect.height / 2 : rect.bottom - offset
      expect(cell.contains(document.elementFromPoint(x, y))).toBe(true)

      await pointer.press(point, async () => {
        // Sweep upwards through the timed area and divider before releasing inside the cell.
        const divider = queryPart(calendar.el, 'allDayDivider')!.getBoundingClientRect()
        for (let sweepY = divider.bottom + 4; sweepY > y; sweepY--) {
          await pointer.move({ x, y: sweepY }, 1)
          await waitForSettle()
        }
        await pointer.move({ x, y }, 1)
        await waitForSettle()
      })
      await waitForSettle()

      expect(eventDrop).toHaveBeenCalledOnce()
      const event = calendar.getEventById('1')!
      expect(event.startStr).toBe(dropDate)
      expect(event.allDay).toBe(true)
    })

    it('keeps a visible mirror while crossing the divider into the all-day cell', async () => {
      const calendar = initCalendar(options)
      await waitForSettle()

      const grid = new TimeGridModel(calendar.el)
      const { point } = grid.pointForEventAt('1', '2014-06-11T01:00')
      const rect = grid.allDay.getDayCell(dropDate).getBoundingClientRect()
      const divider = queryPart(calendar.el, 'allDayDivider')!.getBoundingClientRect()
      const x = rect.left + rect.width / 2

      await pointer.press(point, async () => {
        for (let y = divider.bottom + 4; y >= rect.top + rect.height / 2; y--) {
          await pointer.move({ x, y }, 1)
          await waitForSettle()
          // A free-drag clone lives outside the calendar; an in-grid mirror replaces it over slots.
          const mirrors = [
            ...grid.getMirrorEls(),
            ...grid.allDay.getMirrorEls(),
            ...queryParts(document, 'event').filter((el) => el.style.position === 'fixed'),
          ]
          expect(mirrors.some(isElVisible), `mirror at y=${y}`).toBe(true)
        }
      })
      await waitForSettle()
      expect(calendar.getEventById('1')!.allDay).toBe(true)
    })
  })
})
