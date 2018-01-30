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
      $('.fc-head th[data-date]:first').data('date')
    ).toEqualMoment('2018-01-22') // a Monday
  })

})
