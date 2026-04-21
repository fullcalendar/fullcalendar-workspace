import { TimeGridViewWrapper } from '../lib/wrappers/TimeGridViewWrapper'
import { waitTimeout } from '../lib/misc'

/*
TimeGrid is a civil-time view: on a spring-forward day it still renders slots
for the nonexistent hour. Selection edges must keep their CIVIL order. Sorting
edges by derived instant would reorder them, because a nonexistent civil time
resolves to an instant PAST the gap (02:30 -> 03:30 real), overtaking civil
times after it. (Timed timeline axes carry exact instants on their hits and
sort by instant instead — see the timeline DST tests.)
*/
describe('timegrid selection across a DST spring-forward gap', () => {
  pushOptions({
    timeZone: 'America/New_York',
    initialView: 'timeGridDay',
    initialDate: '2024-03-10', // 2:00 EST -> 3:00 EDT
    scrollTime: '00:00',
    selectable: true,
  })

  it('keeps civil edge order when dragging across the gap', async () => {
    let selectSpy
    let calendar = initCalendar({
      select: (selectSpy = spyCall((info) => {
        expect(info.startStr).toContain('2024-03-10T02:30:00')
        expect(info.endStr).toContain('2024-03-10T03:30:00')
      })),
    })
    await waitTimeout()

    let timeGridWrapper = new TimeGridViewWrapper(calendar).timeGrid
    await timeGridWrapper.selectDates('2024-03-10T02:30:00', '2024-03-10T03:30:00')

    expect(selectSpy).toHaveBeenCalled()
  })
})
