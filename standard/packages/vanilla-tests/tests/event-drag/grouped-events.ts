import { describe, expect, it } from 'vitest'
import { initCalendar } from '../lib/calendar'
import { DayGridModel } from '../lib/models/day-grid'
import { TimeGridModel } from '../lib/models/time-grid'
import { pointer } from '../lib/pointer'
import { getEventIdOfEl, isElVisible } from '../lib/models/events'
import { waitForSettle } from '../lib/settle'

/*
Events sharing a groupId move together.
*/
describe('dragging events that share a groupId', () => {
  const options = {
    initialView: 'dayGridMonth',
    initialDate: '2017-02-12',
    editable: true,
    dragScroll: false,
    events: [
      { groupId: '999', id: 'a', start: '2017-02-09T16:00:00' },
      { groupId: '999', id: 'b', start: '2017-02-16T16:00:00' },
    ],
  }

  it('moves every event in the group, including ones out of view', async () => {
    const calendar = initCalendar(options)
    // switch from month to week, so the week view has events outside its range
    calendar.changeView('timeGridWeek')
    await waitForSettle()

    await new TimeGridModel(calendar.el).dragEvent('b', '2017-02-16T16:00', '2017-02-16T12:00')

    expect(calendar.getEventById('a')!.startStr).toBe('2017-02-09T12:00:00Z')
    expect(calendar.getEventById('b')!.startStr).toBe('2017-02-16T12:00:00Z')
  })

  it.each([
    ['hides the whole group', options.events, []],
    ['hides only the dragged event when there\'s no group', [
      { id: 'a', start: '2017-02-09T16:00:00' },
      { id: 'b', start: '2017-02-16T16:00:00' },
    ], ['b']],
  ])('%s while dragging', async (_desc, events, expectedVisibleIds) => {
    const calendar = initCalendar({ ...options, events })
    await waitForSettle()

    const dayGrid = new DayGridModel(calendar.el)
    const { point } = dayGrid.pointForEventOnDate('a', '2017-02-09')
    await pointer.press(point, async () => {
      await pointer.move(dayGrid.pointForDate('2017-02-10'))
      await waitForSettle()

      const visibleIds = dayGrid.getEventEls().filter(isElVisible).map(getEventIdOfEl)
      expect(visibleIds).toEqual(expectedVisibleIds)
    })
    await waitForSettle()
  })
})
