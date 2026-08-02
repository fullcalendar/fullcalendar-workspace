import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { TimelineViewWrapper } from '../lib/wrappers/TimelineViewWrapper'
import {
  DST_TIMELINE_BASE_OPTIONS,
  getSlatInfo, expectEventSpansSlats,
} from '../lib/dst-timeline-utils'

describe('multi-day timeline spanning a DST transition', () => {
  pushOptions({
    ...DST_TIMELINE_BASE_OPTIONS,
    initialView: 'timelineThreeDays',
    initialDate: '2024-11-02',
    slotDuration: '01:00',
    views: {
      timelineThreeDays: {
        type: 'timeline',
        duration: { days: 3 },
      },
    },
  })

  it('accumulates each day\'s slots before positioning later events', async () => {
    let calendar = initCalendar({
      events: [
        { start: '2024-11-04T06:00:00Z', end: '2024-11-04T07:00:00Z' },
      ],
    })
    await waitTimeout()

    let slats = getSlatInfo(new TimelineViewWrapper(calendar).timelineGrid)
    let countsByDay = slats.reduce((counts: { [day: string]: number }, slat) => {
      let day = slat.dateStr.slice(0, 10)
      counts[day] = (counts[day] || 0) + 1
      return counts
    }, {})

    expect(slats.length).toBe(73)
    expect(countsByDay).toEqual({
      '2024-11-02': 24,
      '2024-11-03': 25,
      '2024-11-04': 24,
    })
    expect(slats[50].dateStr).toBe('2024-11-04T01:00:00')
    expectEventSpansSlats(calendar, 50, 51)
  })
})
