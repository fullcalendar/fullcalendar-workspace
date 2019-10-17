
describe('validRange with timeline', function() {

  it('works', function() {
    initCalendar({
      defaultView: 'timelineWeek',
      defaultDate: '2017-03-23',
      slotDuration: { days: 1 },
      validRange: {
        start: '2017-03-20',
        end: '2017-03-25'
      }
    })

    expect($('th[data-date="2017-03-19"]')).toHaveClass('fc-disabled-day') // TODO: strip date data?
    expect($('th[data-date="2017-03-20"]')).toBeInDOM()
    expect($('th[data-date="2017-03-21"]')).toBeInDOM()
    expect($('th[data-date="2017-03-22"]')).toBeInDOM()
    expect($('th[data-date="2017-03-23"]')).toBeInDOM()
    expect($('th[data-date="2017-03-24"]')).toBeInDOM()
    expect($('th[data-date="2017-03-25"]')).toHaveClass('fc-disabled-day')
    // TODO: strip date data?
  })
})
