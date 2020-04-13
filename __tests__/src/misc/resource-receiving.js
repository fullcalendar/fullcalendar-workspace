import XHRMock from 'xhr-mock'

/*
resources as an array
resources as a json feed
resources as a function
*/

describe('event resources', function() {

  pushOptions({
    initialView: 'resourceTimelineDay'
  })

  it('processes multiple resources', function(done) {
    let calendar = initCalendar({
      resources: [
        { id: 1, title: 'room 1' },
        { id: 2, title: 'room 2' }
      ]
    })

    let resources = calendar.getResources()
    expect(resources.length).toBe(2)
    expect(resources[0].id).toBe('1')
    expect(resources[1].id).toBe('2')
    expect(resources[0].title).toBe('room 1')
    expect(resources[1].title).toBe('room 2')
    setTimeout(done)
  })

  it('will not process colliding IDs', function(done) {
    let calendar = initCalendar({
      resources: [
        { id: 1, title: 'room 1' },
        { id: 2, title: 'room 2' },
        { id: 2, title: 'room 2' }
      ]
    })

    // TODO: expect a console warning
    let resources = calendar.getResources()
    expect(resources.length).toBe(2)
    expect(resources[0].id).toBe('1')
    expect(resources[1].id).toBe('2')
    expect(resources[0].title).toBe('room 1')
    expect(resources[1].title).toBe('room 2')
    setTimeout(done)
  })

  it('will process resources without IDs', function(done) {
    let calendar = initCalendar({
      resources: [
        { title: 'room 1' },
        { title: 'room 2' }
      ]
    })

    let resources = calendar.getResources()
    expect(resources.length).toBe(2)
    expect(resources[0].title).toBe('room 1')
    expect(resources[1].title).toBe('room 2')
    setTimeout(done)
  })

  it('will allow nested children', function(done) {
    let calendar = initCalendar({
      resources: [
        { id: 'a',
          title: 'room a',
          children: [
            { id: 'a1', title: 'room a1' }
          ]
        }
      ]
    })

    let resources = calendar.getTopLevelResources()
    expect(resources.length).toBe(1)
    expect(resources[0].title).toBe('room a')

    let children = resources[0].getChildren()
    expect(children.length).toBe(1)
    expect(children[0].title).toBe('room a1')
    setTimeout(done)
  })

  it('will allow flat children', function(done) {
    let calendar = initCalendar({
      resources: [
        { id: 'a', title: 'room a' },
        { id: 'a1', title: 'room a1', parentId: 'a' }
      ]
    })

    let resources = calendar.getTopLevelResources()
    expect(resources.length).toBe(1)
    expect(resources[0].title).toBe('room a')

    let children = resources[0].getChildren()
    expect(children.length).toBe(1)
    expect(children[0].title).toBe('room a1')
    setTimeout(done)
  })

  describe('when using a JSON feed', function() {

    beforeEach(function() {
      XHRMock.setup()
    })

    afterEach(function() {
      XHRMock.teardown()
    })

    it('reads correctly', function(done) {

      XHRMock.get(/^my-feed\.json/, function(req, res) {
        return res
          .status(200)
          .header('content-type', 'application/json')
          .body(JSON.stringify([
            { "id": 1, "title": "room 1" },
            { "id": 2, "title": "room 2" }
          ]))
      })

      let calendar = initCalendar({
        resources: 'my-feed.json'
      })

      setTimeout(function() {
        let resources = calendar.getResources()
        expect(resources.length).toBe(2)
        expect(resources[0].id).toBe('1')
        expect(resources[1].id).toBe('2')
        expect(resources[0].title).toBe('room 1')
        expect(resources[1].title).toBe('room 2')
        setTimeout(done)
      }, 0)
    })
  })

  it('will read resources from a function', function(done) {
    let calendar = initCalendar({
      resources(arg, callback) {
        callback([
          { id: 1, title: 'room 1' },
          { id: 2, title: 'room 2' }
        ])
      }
    })

    let resources = calendar.getResources()
    expect(resources.length).toBe(2)
    expect(resources[0].id).toBe('1')
    expect(resources[1].id).toBe('2')
    expect(resources[0].title).toBe('room 1')
    expect(resources[1].title).toBe('room 2')
    setTimeout(done)
  })

  it('will parse event style props', function() {
    initCalendar({
      resources: [ {
        id: 1,
        title: 'room 1',
        eventClassNames: 'niceevents',
        eventColor: 'red',
        eventTextColor: 'green'
      } ]
    })

    let resources = currentCalendar.getResources()
    expect(resources.length).toBe(1)
    expect(resources[0].eventClassNames).toEqual([ 'niceevents' ])
    expect(resources[0].eventBackgroundColor).toBe('red')
    expect(resources[0].eventBorderColor).toBe('red')
    expect(resources[0].eventTextColor).toBe('green')
  })

  it('will put misc properties in extendedProps', function() {
    initCalendar({
      resources: [
        { id: 1, title: 'room 1', something: 'cool' }
      ]
    })

    let resources = currentCalendar.getResources()
    expect(resources.length).toBe(1)
    expect(typeof resources[0].extendedProps).toBe('object')
    expect(resources[0].extendedProps.something).toBe('cool')
  })

  it('will receive an explicit extendedProps', function() {
    initCalendar({
      resources: [
        { id: 1, title: 'room 1', extendedProps: { something: 'cool' } }
      ]
    })

    let resources = currentCalendar.getResources()
    expect(resources.length).toBe(1)
    expect(typeof resources[0].extendedProps).toBe('object')
    expect(resources[0].extendedProps.something).toBe('cool')
  })

})
