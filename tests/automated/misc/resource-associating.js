
describe('associating resources with event', function() {

  pushOptions({
    defaultView: 'resourceTimelineDay',
    defaultDate: '2015-07-11'
  })

  it('works with an Event object\'s resourceId', function(done) {
    initCalendar({
      resources: [
        { id: 'a', title: 'room a' },
        { id: 'b', title: 'room b' }
      ],
      events: [
        { id: '1', title: 'event 1', resourceId: 'a', className: 'event1', start: '2015-07-11T09:00:00' },
        { id: '2', title: 'event 2', resourceId: 'b', className: 'event2', start: '2015-07-11T10:00:00' }
      ],
      _eventsPositioned() {
        const roomAEvents = currentCalendar.getResourceById('a').getEvents()
        expect(roomAEvents.length).toBe(1)
        expect(roomAEvents[0].title).toBe('event 1')
        const roomBEvents = currentCalendar.getResourceById('b').getEvents()
        expect(roomBEvents.length).toBe(1)
        expect(roomBEvents[0].title).toBe('event 2')
        const event1Resources = currentCalendar.getEventById('1').getResources()
        expect(event1Resources.length).toBe(1)
        expect(event1Resources[0].title).toBe('room a')
        const event2Resources = currentCalendar.getEventById('2').getResources()
        expect(event2Resources.length).toBe(1)
        expect(event2Resources[0].title).toBe('room b')
        expect($('.event1').length).toBe(1)
        expect($('.event2').length).toBe(1)
        done()
      }
    })
  })


  it('works with integers', function(done) {
    initCalendar({
      resources: [
        { id: 0, title: 'room a' },
        { id: 1, title: 'room b' }
      ],
      events: [
        { id: 0, title: 'event 1', resourceId: 0, className: 'event1', start: '2015-07-11T09:00:00' },
        { id: 1, title: 'event 2', resourceId: 1, className: 'event2', start: '2015-07-11T10:00:00' }
      ],
      _eventsPositioned() {
        const roomAEvents = currentCalendar.getResourceById(0).getEvents()
        expect(roomAEvents.length).toBe(1)
        expect(roomAEvents[0].title).toBe('event 1')
        const roomBEvents = currentCalendar.getResourceById(1).getEvents()
        expect(roomBEvents.length).toBe(1)
        expect(roomBEvents[0].title).toBe('event 2')
        const event1Resources = currentCalendar.getEventById(0).getResources()
        expect(event1Resources.length).toBe(1)
        expect(event1Resources[0].title).toBe('room a')
        const event2Resources = currentCalendar.getEventById(1).getResources()
        expect(event2Resources.length).toBe(1)
        expect(event2Resources[0].title).toBe('room b')
        expect($('.event1').length).toBe(1)
        expect($('.event2').length).toBe(1)
        done()
      }
    })
  })

  it('works asynchronously with resource delay', function(done) {
    initCalendar({
      resources(arg, callback) {
        setTimeout(function() {
          callback([
            { id: 'a', title: 'room a' },
            { id: 'b', title: 'room b' }
          ])
        }, 200)
      },
      events(arg, callback) {
        callback([
          { id: '1', title: 'event 1', resourceId: 'a', className: 'event1', start: '2015-07-11T09:00:00' },
          { id: '2', title: 'event 2', resourceId: 'b', className: 'event2', start: '2015-07-11T10:00:00' }
        ])
      },
      _resourcesRendered() {
        const roomAEvents = currentCalendar.getResourceById('a').getEvents()
        expect(roomAEvents.length).toBe(1)
        expect(roomAEvents[0].title).toBe('event 1')
        const roomBEvents = currentCalendar.getResourceById('b').getEvents()
        expect(roomBEvents.length).toBe(1)
        expect(roomBEvents[0].title).toBe('event 2')
        const event1Resources = currentCalendar.getEventById('1').getResources()
        expect(event1Resources.length).toBe(1)
        expect(event1Resources[0].title).toBe('room a')
        const event2Resources = currentCalendar.getEventById('2').getResources()
        expect(event2Resources.length).toBe(1)
        expect(event2Resources[0].title).toBe('room b')
        expect($('.event1').length).toBe(1)
        expect($('.event2').length).toBe(1)
        done()
      }
    })
  })

  it('works asynchronously with events delay', function(done) {
    initCalendar({
      resources(arg, callback) {
        callback([
          { id: 'a', title: 'room a' },
          { id: 'b', title: 'room b' }
        ])
      },
      events(arg, callback) {
        setTimeout(function() {
          callback([
            { id: '1', title: 'event 1', resourceId: 'a', className: 'event1', start: '2015-07-11T09:00:00' },
            { id: '2', title: 'event 2', resourceId: 'b', className: 'event2', start: '2015-07-11T10:00:00' }
          ])
        }, 200)
      },
      _eventsPositioned() {
        const roomAEvents = currentCalendar.getResourceById('a').getEvents()
        expect(roomAEvents.length).toBe(1)
        expect(roomAEvents[0].title).toBe('event 1')
        const roomBEvents = currentCalendar.getResourceById('b').getEvents()
        expect(roomBEvents.length).toBe(1)
        expect(roomBEvents[0].title).toBe('event 2')
        const event1Resources = currentCalendar.getEventById('1').getResources()
        expect(event1Resources.length).toBe(1)
        expect(event1Resources[0].title).toBe('room a')
        const event2Resources = currentCalendar.getEventById('2').getResources()
        expect(event2Resources.length).toBe(1)
        expect(event2Resources[0].title).toBe('room b')
        expect($('.event1').length).toBe(1)
        expect($('.event2').length).toBe(1)
        done()
      }
    })
  })
})
