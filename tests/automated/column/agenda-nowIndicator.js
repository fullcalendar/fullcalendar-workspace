
describe('resource agenda now-indicator', function() {
  pushOptions({
    now: '2015-12-26T02:30:00',
    scrollTime: '00:00',
    views: {
      agendaThreeDay: {
        type: 'agenda',
        duration: { days: 3 }
      }
    }
  })

  it('renders once for each resource', function() {
    initCalendar({
      defaultView: 'agendaThreeDay',
      nowIndicator: true,
      groupByResource: true,
      resources: [
        { id: 'a', title: 'Resource A' },
        { id: 'b', title: 'Resource B' }
      ]
    })
    expect($('.fc-now-indicator-arrow').length).toBe(1)
    expect($('.fc-now-indicator-line').length).toBe(2)
  })

  // big compound test
  // https://github.com/fullcalendar/fullcalendar/issues/3918
  it('plays nice with refetchResourcesOnNavigate and view switching', function(done) {
    initCalendar({
      defaultView: 'agendaWeek',
      defaultDate: '2016-11-04',
      now: '2016-12-04T10:00',
      scrollTime: '09:00',
      nowIndicator: true,
      refetchResourcesOnNavigate: true,
      resources(callback) {
        setTimeout(function() {
          callback([
            { title: 'resource a', id: 'a' },
            { title: 'resource b', id: 'b' }
          ])
        }, 10)
      },
      events(start, end, timezone, callback) {
        setTimeout(function() {
          callback([
            { title: 'event1', start: '2016-12-04T01:00:00', resourceId: 'a' },
            { title: 'event2', start: '2016-12-04T02:00:00', resourceId: 'b' },
            { title: 'event3', start: '2016-12-05T03:00:00', resourceId: 'a' }
          ])
        }, 10)
      }
    })

    setTimeout(function() {
      currentCalendar.changeView('agendaDay')

      setTimeout(function() {
        currentCalendar.today()

        setTimeout(function() {
          currentCalendar.changeView('agendaWeek')

          setTimeout(function() {
            currentCalendar.changeView('agendaDay')

            setTimeout(done, 100)
          }, 100)
        }, 100)
      }, 100)
    }, 100)
  })
})
