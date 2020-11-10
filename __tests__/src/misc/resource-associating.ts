
describe('associating resources with event', function() {

  pushOptions({
    initialView: 'resourceTimelineDay',
    initialDate: '2015-07-11'
  })

  it('works with an Event object\'s resourceId', function() {
    initCalendar({
      resources: [
        { id: 'a', title: 'room a' },
        { id: 'b', title: 'room b' }
      ],
      events: [
        { id: '1', title: 'event 1', resourceId: 'a', className: 'event1', start: '2015-07-11T09:00:00' },
        { id: '2', title: 'event 2', resourceId: 'b', className: 'event2', start: '2015-07-11T10:00:00' }
      ]
    })

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
  })


  it('works with integers', function() {
    /** @type any */ let zero = 0
    /** @type any */ let one = 1
    /** @type any */ let id

    initCalendar({
      resources: [
        { id: zero, title: 'room a' },
        { id: one, title: 'room b' }
      ],
      events: [
        { id: zero, title: 'event 1', resourceId: zero, className: 'event1', start: '2015-07-11T09:00:00' },
        { id: one, title: 'event 2', resourceId: one, className: 'event2', start: '2015-07-11T10:00:00' }
      ]
    })

    id = 0
    const roomAEvents = currentCalendar.getResourceById(id).getEvents()
    expect(roomAEvents.length).toBe(1)
    expect(roomAEvents[0].title).toBe('event 1')

    id = 1
    const roomBEvents = currentCalendar.getResourceById(id).getEvents()
    expect(roomBEvents.length).toBe(1)
    expect(roomBEvents[0].title).toBe('event 2')

    id = 0
    const event1Resources = currentCalendar.getEventById(id).getResources()
    expect(event1Resources.length).toBe(1)
    expect(event1Resources[0].title).toBe('room a')

    id = 1
    const event2Resources = currentCalendar.getEventById(id).getResources()
    expect(event2Resources.length).toBe(1)
    expect(event2Resources[0].title).toBe('room b')

    expect($('.event1').length).toBe(1)
    expect($('.event2').length).toBe(1)
  })

  it('works asynchronously with resource delay', function(done) {
    initCalendar({
      resources(arg, callback) {
        setTimeout(function() {
          callback([
            { id: 'a', title: 'room a' },
            { id: 'b', title: 'room b' }
          ])
        }, 100)
      },
      events(arg, callback) {
        callback([
          { id: '1', title: 'event 1', resourceId: 'a', className: 'event1', start: '2015-07-11T09:00:00' },
          { id: '2', title: 'event 2', resourceId: 'b', className: 'event2', start: '2015-07-11T10:00:00' }
        ])
      }
    })

    setTimeout(function() {
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
    }, 200) // after resources load
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
        }, 100)
      }
    })

    setTimeout(function() {
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
    }, 200) // after events load
  })

  describe('setResources on an Event obj', function() {
    pushOptions({
      resources: [
        { id: 'a', title: 'room a' },
        { id: 'b', title: 'room b' },
        { id: 'c', title: 'room c' }
      ],
      events: [
        { id: '1', title: 'event 1', resourceId: 'a', className: 'event1', start: '2015-07-11T09:00:00' }
      ]
    })

    it('works when receiving string IDs', function() {
      initCalendar()

      let event = currentCalendar.getEventById('1')
      event.setResources([ 'b', 'c' ])

      let newResources = event.getResources()
      expect(newResources.length).toBe(2)
      expect(newResources[0].id).toBe('b')
      expect(newResources[1].id).toBe('c')
    })

    it('works when receiving Resource objs', function() {
      initCalendar()

      let event = currentCalendar.getEventById('1')
      let resourceB = currentCalendar.getResourceById('b')
      let resourceC = currentCalendar.getResourceById('c')
      event.setResources([ resourceB, resourceC ])

      let newResources = event.getResources()
      expect(newResources.length).toBe(2)
      expect(newResources[0].id).toBe('b')
      expect(newResources[1].id).toBe('c')
    })
  })

})
