import { expectRenderRange } from 'fullcalendar-tests/src/lib/ViewDateUtils'
import { TimelineViewWrapper } from '../lib/wrappers/TimelineViewWrapper'

describe('timeline date range', () => {
  it('respects firstDay with auto-detected alignment with 7-days', () => {
    let calendar = initCalendar({
      initialDate: '2018-01-22',
      initialView: 'timeline',
      duration: { days: 183 },
      slotLabelInterval: { days: 7 },
      firstDay: 1, // Monday
    })

    let viewWrapper = new TimelineViewWrapper(calendar)
    let firstCell = viewWrapper.header.getCellInfo()[0]

    expect(firstCell.date).toEqualDate('2018-01-22') // a Monday
  })

  // https://github.com/fullcalendar/fullcalendar/issues/4937
  xit('can do day slotDuration when slotLabel is month', () => {
    let calendar = initCalendar({
      initialDate: '2019-05-16',
      initialView: 'timelineYear',
      slotDuration: { days: 1 },
      slotLabelInterval: { months: 1 },
    })

    let viewWrapper = new TimelineViewWrapper(calendar)
    let labelEls = viewWrapper.header.getDateEls()
    let slotEls = viewWrapper.timelineGrid.getSlatEls()

    expect(labelEls.length).toBe(12)
    expect(slotEls.length).toBe(365)
  })

  // https://github.com/fullcalendar/fullcalendar-scheduler/issues/525
  it('can go back by a month', () => {
    initCalendar({
      initialDate: '2019-04-23',
      initialView: 'timelineSpecial',
      views: {
        timelineSpecial: {
          type: 'timeline',
          duration: { month: 3 },
          slotDuration: { month: 1 },
          dateIncrement: { months: 1 },
        },
      },
    })

    expectRenderRange('2019-04-01', '2019-07-01')
    currentCalendar.prev()
    expectRenderRange('2019-03-01', '2019-06-01')
    currentCalendar.prev()
    expectRenderRange('2019-02-01', '2019-05-01')
  })
})
