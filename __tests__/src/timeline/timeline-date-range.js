import { expectRenderRange } from 'package-tests/view-dates/ViewDateUtils'

describe('timeline date range', function() {

  it('respects firstDay with auto-detected alignment with 7-days', function() {
    initCalendar({
      defaultDate: '2018-01-22',
      defaultView: 'timeline',
      duration: { days: 183 },
      slotLabelInterval: { days: 7 },
      firstDay: 1 // Monday
    })
    expect(
      // we need to get from DOM! dateProfile was always correct even when DOM wrong
      new Date(
        $('.fc-head th[data-date]:first').data('date')
      )
    ).toEqualDate('2018-01-22') // a Monday
  })

  // https://github.com/fullcalendar/fullcalendar/issues/4937
  xit('can do day slotDuration when slotLabel is month', function() {
    initCalendar({
      defaultDate: '2019-05-16',
      defaultView: 'timelineYear',
      slotDuration: { days: 1 },
      slotLabelInterval: { months: 1 }
    })

    let labelEls = $('.fc-head th[data-date]')
    let slotEls = $('.fc-body .fc-slats td[data-date]')

    expect(labelEls.length).toBe(12)
    expect(slotEls.length).toBe(365)
  })

  // https://github.com/fullcalendar/fullcalendar-scheduler/issues/525
  xit('can go back by a month', function() {
    initCalendar({
      defaultDate: '2019-04-23',
      defaultView: 'timelineSpecial',
      views: {
        timelineSpecial: {
          type: 'timeline',
          duration: { month: 3 },
          slotDuration: { month: 1 },
          dateIncrement: { months: 1 }
        }
      }
    })

    expectRenderRange('2019-04-01', '2019-07-01')
    currentCalendar.prev()
    expectRenderRange('2019-03-01', '2019-06-01')
    currentCalendar.prev()
    expectRenderRange('2019-02-01', '2019-05-01')
  })

})
