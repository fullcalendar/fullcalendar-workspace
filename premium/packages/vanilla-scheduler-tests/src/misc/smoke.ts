describe('timeline', () => {
  it('can switch views', () => {
    let calendar = initCalendar({
      now: '2016-01-07',
      editable: true,
      aspectRatio: 1.8,
      scrollTime: '00:00',
      headerToolbar: {
        left: 'today prev,next',
        center: 'title',
        right: 'resourceTimelineDay,resourceTimelineThreeDays,resourceTimeGridDay,resourceTimeGridTwoDay,timeGridWeek,dayGridMonth',
      },
      initialView: 'resourceTimelineDay',
      views: {
        resourceTimelineThreeDays: {
          type: 'resourceTimeline',
          duration: { days: 3 },
        },
        resourceTimeGridTwoDay: {
          type: 'resourceTimeGrid',
          duration: { days: 2 },
        },
      },
      resourceColumnHeaderContent: 'Rooms',
      resources: [
        { id: 'a', title: 'Auditorium A' },
        { id: 'b', title: 'Auditorium B', eventColor: 'green' },
        { id: 'c', title: 'Auditorium C', eventColor: 'orange' },
      ],
      events: [
        { id: '1', resourceId: 'a', start: '2016-01-07T02:00:00', end: '2016-01-07T07:00:00', title: 'event 1' },
        { id: '2', resourceId: 'b', start: '2016-01-07T05:00:00', end: '2016-01-07T22:00:00', title: 'event 2' },
        { id: '3', resourceId: 'c', start: '2016-01-06', end: '2016-01-08', title: 'event 3' },
        { id: '4', resourceId: 'a', start: '2016-01-07T03:00:00', end: '2016-01-07T08:00:00', title: 'event 4' },
        { id: '5', resourceId: 'b', start: '2016-01-07T00:30:00', end: '2016-01-07T02:30:00', title: 'event 5' },
      ],
    })

    expect(calendar.view.type).toBe('resourceTimelineDay')
    calendar.changeView('resourceTimelineThreeDays')

    expect(calendar.view.type).toBe('resourceTimelineThreeDays')
    calendar.changeView('resourceTimeGridDay')

    expect(calendar.view.type).toBe('resourceTimeGridDay')
    calendar.changeView('resourceTimeGridTwoDay')

    expect(calendar.view.type).toBe('resourceTimeGridTwoDay')
    calendar.changeView('timeGridWeek')

    expect(calendar.view.type).toBe('timeGridWeek')
    calendar.changeView('dayGridMonth')

    expect(calendar.view.type).toBe('dayGridMonth')
    calendar.changeView('resourceTimelineDay')

    expect(calendar.view.type).toBe('resourceTimelineDay')
  })
})
