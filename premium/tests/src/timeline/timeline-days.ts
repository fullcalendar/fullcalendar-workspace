import { CalendarWrapper } from 'fullcalendar-tests/src/lib/wrappers/CalendarWrapper'
import { TimelineViewWrapper } from '../lib/wrappers/TimelineViewWrapper'

describe('timeline whole days', () => {
  pushOptions({
    now: '2016-11-05',
    initialView: 'timelineMonth',
    slotDuration: { days: 1 },
  })

  it('applies day-of-week class', () => {
    let calendar = initCalendar()
    let viewWrapper = new TimelineViewWrapper(calendar)

    expect(viewWrapper.header.getDateElByDate('2016-11-05')).toHaveClass(CalendarWrapper.DOW_CLASSNAMES[6])
    expect(viewWrapper.timelineGrid.getSlatElByDate('2016-11-05')).toHaveClass(CalendarWrapper.DOW_CLASSNAMES[6])
  })

  it('puts today class on current date', () => {
    let calendar = initCalendar()
    let viewWrapper = new TimelineViewWrapper(calendar)

    expect(viewWrapper.header.getDateElByDate('2016-11-05')).toHaveClass(CalendarWrapper.TODAY_CLASSNAME)
    expect(viewWrapper.timelineGrid.getSlatElByDate('2016-11-05')).toHaveClass(CalendarWrapper.TODAY_CLASSNAME)
  })

  it('puts past class on past date', () => {
    let calendar = initCalendar()
    let viewWrapper = new TimelineViewWrapper(calendar)

    expect(viewWrapper.header.getDateElByDate('2016-11-04')).toHaveClass(CalendarWrapper.DAY_PAST_CLASSNAME)
    expect(viewWrapper.timelineGrid.getSlatElByDate('2016-11-04')).toHaveClass(CalendarWrapper.DAY_PAST_CLASSNAME)
  })

  it('puts future class on future date', () => {
    let calendar = initCalendar()
    let viewWrapper = new TimelineViewWrapper(calendar)

    expect(viewWrapper.header.getDateElByDate('2016-11-07')).toHaveClass(CalendarWrapper.DAY_FUTURE_CLASSNAME)
    expect(viewWrapper.timelineGrid.getSlatElByDate('2016-11-07')).toHaveClass(CalendarWrapper.DAY_FUTURE_CLASSNAME)
  })
})
