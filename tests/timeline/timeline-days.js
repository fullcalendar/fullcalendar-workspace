
describe('timeline whole days', function() {
  pushOptions({
    now: '2016-11-05',
    defaultView: 'timelineMonth',
    slotDuration: { days: 1 }
  })

  it('applies day-of-week class', function(done) {
    initCalendar({
      viewRender() {
        expect($('th[data-date="2016-11-05"]')).toHaveClass('fc-sat')
        expect($('td[data-date="2016-11-05"]')).toHaveClass('fc-sat')
        done()
      }
    })
  })

  it('puts today class on current date', function(done) {
    initCalendar({
      viewRender() {
        expect($('th[data-date="2016-11-05"]')).toHaveClass('fc-today')
        expect($('td[data-date="2016-11-05"]')).toHaveClass('fc-today')
        done()
      }
    })
  })

  it('puts past class on past date', function(done) {
    initCalendar({
      viewRender() {
        expect($('th[data-date="2016-11-04"]')).toHaveClass('fc-past')
        expect($('td[data-date="2016-11-04"]')).toHaveClass('fc-past')
        done()
      }
    })
  })

  it('puts future class on future date', function(done) {
    initCalendar({
      viewRender() {
        expect($('th[data-date="2016-11-07"]')).toHaveClass('fc-future')
        expect($('td[data-date="2016-11-07"]')).toHaveClass('fc-future')
        done()
      }
    })
  })
})
