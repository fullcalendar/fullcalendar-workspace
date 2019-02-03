
describe('timeline', function() {

  it('can switch views', function(done) {
    let switchCnt = 0

    initCalendar({
      now: '2016-01-07',
      editable: true,
      aspectRatio: 1.8,
      scrollTime: '00:00',
      header: {
        left: 'today prev,next',
        center: 'title',
        right: 'timelineDay,timelineThreeDays,timeGridDay,timeGridTwoDay,timeGridWeek,dayGridMonth'
      },
      defaultView: 'timelineDay',
      views: {
        timelineThreeDays: {
          type: 'timeline',
          duration: { days: 3 }
        },
        timeGridTwoDay: {
          type: 'timeGrid',
          duration: { days: 2 },
          groupByResource: true
        }
      },
      resourceLabelText: 'Rooms',
      resources: [
        { id: 'a', title: 'Auditorium A' },
        { id: 'b', title: 'Auditorium B', eventColor: 'green' },
        { id: 'c', title: 'Auditorium C', eventColor: 'orange' }
      ],
      events: [
        { id: '1', resourceId: 'a', start: '2016-01-07T02:00:00', end: '2016-01-07T07:00:00', title: 'event 1' },
        { id: '2', resourceId: 'b', start: '2016-01-07T05:00:00', end: '2016-01-07T22:00:00', title: 'event 2' },
        { id: '3', resourceId: 'c', start: '2016-01-06', end: '2016-01-08', title: 'event 3' },
        { id: '4', resourceId: 'a', start: '2016-01-07T03:00:00', end: '2016-01-07T08:00:00', title: 'event 4' },
        { id: '5', resourceId: 'b', start: '2016-01-07T00:30:00', end: '2016-01-07T02:30:00', title: 'event 5' }
      ],
      _eventsPositioned() {
        var view = currentCalendar.view

        switchCnt++
        switch (switchCnt) {
          case 1:
            expect(view.type).toBe('timelineDay')
            currentCalendar.changeView('timelineThreeDays')
            break
          case 2:
            expect(view.type).toBe('timelineThreeDays')
            currentCalendar.changeView('timeGridDay')
            break
          case 3:
            expect(view.type).toBe('timeGridDay')
            currentCalendar.changeView('timeGridTwoDay')
            break
          case 4:
            expect(view.type).toBe('timeGridTwoDay')
            currentCalendar.changeView('timeGridWeek')
            break
          case 5:
            expect(view.type).toBe('timeGridWeek')
            currentCalendar.changeView('dayGridMonth')
            break
          case 6:
            expect(view.type).toBe('dayGridMonth')
            currentCalendar.changeView('timelineDay')
            break
          case 7:
            expect(view.type).toBe('timelineDay')
            done()
            break
        }
      }
    })
  })
})
