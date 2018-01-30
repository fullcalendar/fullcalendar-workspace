
describe('timeline range', function() {
  pushOptions({
    now: '2016-02-17',
    defaultView: 'timelineTwoDay',
    slotLabelInterval: '01:00',
    views: {
      timelineTwoDay: {
        type: 'timeline',
        duration: { days: 2 }
      }
    }
  })

  it('renders a range with negative minTime, gap', function(done) {
    initCalendar({
      minTime: '-02:00',
      maxTime: '20:00',
      viewRender() {
        expect($('tr.fc-chrono th:first')).toBeMatchedBy('[data-date="2016-02-16T22:00:00"]')
        expect($('tr.fc-chrono th[data-date="2016-02-17T21:00:00"]').length).toBe(0)
        expect($('tr.fc-chrono th:last')).toBeMatchedBy('[data-date="2016-02-18T19:00:00"]')
        done()
      }
    })
  })

  it('renders a range with overflowed maxTime, gap', function(done) {
    initCalendar({
      minTime: '09:00',
      maxTime: '28:00',
      viewRender() {
        expect($('tr.fc-chrono th:first')).toBeMatchedBy('[data-date="2016-02-17T09:00:00"]')
        expect($('tr.fc-chrono th[data-date="2016-02-18T08:00:00"]').length).toBe(0)
        expect($('tr.fc-chrono th:last')).toBeMatchedBy('[data-date="2016-02-19T03:00:00"]')
        done()
      }
    })
  })

  it('renders a range with negative minTime, complete overlap', function(done) {
    initCalendar({
      minTime: '-02:00',
      viewRender() {
        expect($('tr.fc-chrono th:first')).toBeMatchedBy('[data-date="2016-02-16T22:00:00"]')
        expect($('tr.fc-chrono th:last')).toBeMatchedBy('[data-date="2016-02-18T23:00:00"]')
        done()
      }
    })
  })

  it('renders a range with negative minTime, complete overlap', function(done) {
    initCalendar({
      maxTime: '26:00',
      viewRender() {
        expect($('tr.fc-chrono th:first')).toBeMatchedBy('[data-date="2016-02-17T00:00:00"]')
        expect($('tr.fc-chrono th:last')).toBeMatchedBy('[data-date="2016-02-19T01:00:00"]')
        done()
      }
    })
  })
})
