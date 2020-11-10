import { TimelineViewWrapper } from '../lib/wrappers/TimelineViewWrapper'

describe('timeline range', () => {
  pushOptions({
    now: '2016-02-17',
    initialView: 'timelineTwoDay',
    slotLabelInterval: '01:00',
    views: {
      timelineTwoDay: {
        type: 'timeline',
        duration: { days: 2 },
      },
    },
  })

  it('renders a range with negative slotMinTime, gap', () => {
    let calendar = initCalendar({
      slotMinTime: '-02:00',
      slotMaxTime: '20:00',
    })
    let headerWrapper = new TimelineViewWrapper(calendar).header
    let cells = headerWrapper.getCellInfo(1)
    let lastCell = cells[cells.length - 1]

    expect(cells[0].date).toEqualDate('2016-02-16T22:00:00')
    expect(lastCell.date).toEqualDate('2016-02-18T19:00:00')
    expect(headerWrapper.getDateElByDate('2016-02-17T21:00:00')).toBeFalsy()
  })

  it('renders a range with overflowed slotMaxTime, gap', () => {
    let calendar = initCalendar({
      slotMinTime: '09:00',
      slotMaxTime: '28:00',
    })
    let headerWrapper = new TimelineViewWrapper(calendar).header
    let cells = headerWrapper.getCellInfo(1)
    let lastCell = cells[cells.length - 1]

    expect(cells[0].date).toEqualDate('2016-02-17T09:00:00')
    expect(lastCell.date).toEqualDate('2016-02-19T03:00:00')
    expect(headerWrapper.getDateElByDate('2016-02-19T03:00:00')).toBeFalsy()
  })

  it('renders a range with negative slotMinTime, complete overlap', () => {
    let calendar = initCalendar({
      slotMinTime: '-02:00',
    })
    let headerWrapper = new TimelineViewWrapper(calendar).header
    let cells = headerWrapper.getCellInfo(1)
    let lastCell = cells[cells.length - 1]

    expect(cells[0].date).toEqualDate('2016-02-16T22:00:00')
    expect(lastCell.date).toEqualDate('2016-02-18T23:00:00')
  })

  it('renders a range with negative slotMinTime, complete overlap', () => {
    let calendar = initCalendar({
      slotMaxTime: '26:00',
    })
    let headerWrapper = new TimelineViewWrapper(calendar).header
    let cells = headerWrapper.getCellInfo(1)
    let lastCell = cells[cells.length - 1]

    expect(cells[0].date).toEqualDate('2016-02-17T00:00:00')
    expect(lastCell.date).toEqualDate('2016-02-19T01:00:00')
  })
})
