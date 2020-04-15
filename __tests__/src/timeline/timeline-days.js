import { TimelineViewWrapper } from "../lib/wrappers/TimelineViewWrapper"
import { CalendarWrapper } from 'standard-tests/src/lib/wrappers/CalendarWrapper'


describe('timeline whole days', function() {
  pushOptions({
    now: '2016-11-05',
    initialView: 'timelineMonth',
    slotDuration: { days: 1 }
  })


  it('applies day-of-week class', function() {
    let calendar = initCalendar()
    let viewWrapper = new TimelineViewWrapper(calendar)

    expect(viewWrapper.header.getDateElByDate('2016-11-05')).toHaveClass(CalendarWrapper.DOW_CLASSNAMES[6])
    expect(viewWrapper.timelineGrid.getSlatElByDate('2016-11-05')).toHaveClass(CalendarWrapper.DOW_CLASSNAMES[6])
  })


  it('puts today class on current date', function() {
    let calendar = initCalendar()
    let viewWrapper = new TimelineViewWrapper(calendar)

    expect(viewWrapper.header.getDateElByDate('2016-11-05')).toHaveClass(CalendarWrapper.TODAY_CLASSNAME)
    expect(viewWrapper.timelineGrid.getSlatElByDate('2016-11-05')).toHaveClass(CalendarWrapper.TODAY_CLASSNAME)
  })


  it('puts past class on past date', function() {
    let calendar = initCalendar()
    let viewWrapper = new TimelineViewWrapper(calendar)

    expect(viewWrapper.header.getDateElByDate('2016-11-04')).toHaveClass(CalendarWrapper.DAY_PAST_CLASSNAME)
    expect(viewWrapper.timelineGrid.getSlatElByDate('2016-11-04')).toHaveClass(CalendarWrapper.DAY_PAST_CLASSNAME)
  })


  it('puts future class on future date', function() {
    let calendar = initCalendar()
    let viewWrapper = new TimelineViewWrapper(calendar)

    expect(viewWrapper.header.getDateElByDate('2016-11-07')).toHaveClass(CalendarWrapper.DAY_FUTURE_CLASSNAME)
    expect(viewWrapper.timelineGrid.getSlatElByDate('2016-11-07')).toHaveClass(CalendarWrapper.DAY_FUTURE_CLASSNAME)
  })

})
