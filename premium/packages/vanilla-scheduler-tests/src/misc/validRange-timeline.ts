import { TimelineViewWrapper } from '../lib/wrappers/TimelineViewWrapper'

describe('validRange with timeline', () => {
  it('works', () => {
    let calendar = initCalendar({
      initialView: 'timelineWeek',
      initialDate: '2017-03-23',
      slotDuration: { days: 1 },
      validRange: {
        start: '2017-03-20',
        end: '2017-03-25',
      },
    })

    let headerWrapper = new TimelineViewWrapper(calendar).header
    let cellInfo = headerWrapper.getCellInfo()

    expect(cellInfo.length).toBe(7)
    expect(cellInfo[0].isDisabled).toBe(true)
    expect(cellInfo[0].date).toEqualDate('2017-03-19')
    expect(cellInfo[1].date).toEqualDate('2017-03-20')
    expect(cellInfo[2].date).toEqualDate('2017-03-21')
    expect(cellInfo[3].date).toEqualDate('2017-03-22')
    expect(cellInfo[4].date).toEqualDate('2017-03-23')
    expect(cellInfo[5].date).toEqualDate('2017-03-24')
    expect(cellInfo[6].date).toEqualDate('2017-03-25')
    expect(cellInfo[6].isDisabled).toBe(true)
  })
})
