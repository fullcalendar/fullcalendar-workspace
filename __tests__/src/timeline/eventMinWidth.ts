import { TimelineViewWrapper } from '../lib/wrappers/TimelineViewWrapper'

describe('eventMinWidth', () => {
  pushOptions({
    initialView: 'timelineDay',
    initialDate: '2021-05-07',
    scrollTime: 0,
    events: [
      { start: '2021-05-07T00:00:00', end: '2021-05-07T00:01:00' },
    ],
  })

  it('has a default value (a min width)', () => {
    let calendar = initCalendar()
    let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
    let eventEl = timelineGrid.getFirstEventEl()
    expect(eventEl.getBoundingClientRect().width).toBeGreaterThan(10)
  })

  it('can be given a pretty big value', () => {
    let calendar = initCalendar({
      eventMinWidth: 100,
    })
    let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
    let eventEl = timelineGrid.getFirstEventEl()
    expect(eventEl.getBoundingClientRect().width).toBeGreaterThan(98)
  })

  // TODO: test RTL
})
