import fetchMock from 'fetch-mock'

/*
resources as an array
resources as a json feed
resources as a function
*/

describe('event resources', () => {
  pushOptions({
    initialView: 'resourceTimelineDay',
  })

  it('processes multiple resources', (done) => {
    let calendar = initCalendar({
      resources: [
        { id: '1', title: 'room 1' },
        { id: '2', title: 'room 2' },
      ],
    })

    let resources = calendar.getResources()
    expect(resources.length).toBe(2)
    expect(resources[0].id).toBe('1')
    expect(resources[1].id).toBe('2')
    expect(resources[0].title).toBe('room 1')
    expect(resources[1].title).toBe('room 2')
    setTimeout(done)
  })

  it('will not process colliding IDs', (done) => {
    let calendar = initCalendar({
      resources: [
        { id: '1', title: 'room 1' },
        { id: '2', title: 'room 2' },
        { id: '2', title: 'room 2' },
      ],
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

  it('will process resources without IDs', (done) => {
    let calendar = initCalendar({
      resources: [
        { title: 'room 1' },
        { title: 'room 2' },
      ],
    })

    let resources = calendar.getResources()
    expect(resources.length).toBe(2)
    expect(resources[0].title).toBe('room 1')
    expect(resources[1].title).toBe('room 2')
    setTimeout(done)
  })

  it('will allow nested children', (done) => {
    let calendar = initCalendar({
      resources: [
        { id: 'a',
          title: 'room a',
          children: [
            { id: 'a1', title: 'room a1' },
          ] },
      ],
    })

    let resources = calendar.getTopLevelResources()
    expect(resources.length).toBe(1)
    expect(resources[0].title).toBe('room a')

    let children = resources[0].getChildren()
    expect(children.length).toBe(1)
    expect(children[0].title).toBe('room a1')
    setTimeout(done)
  })

  it('will allow flat children', (done) => {
    let calendar = initCalendar({
      resources: [
        { id: 'a', title: 'room a' },
        { id: 'a1', title: 'room a1', parentId: 'a' },
      ],
    })

    let resources = calendar.getTopLevelResources()
    expect(resources.length).toBe(1)
    expect(resources[0].title).toBe('room a')

    let children = resources[0].getChildren()
    expect(children.length).toBe(1)
    expect(children[0].title).toBe('room a1')
    setTimeout(done)
  })

  describe('when using a JSON feed', () => {
    afterEach(() => {
      fetchMock.restore()
    })

    it('reads correctly', (done) => {
      const givenUrl = window.location.href + '/my-feed.php'
      fetchMock.get(/my-feed\.php/, {
        body: [
          { id: 1, title: 'room 1' },
          { id: 2, title: 'room 2' },
        ],
      })

      let calendar = initCalendar({
        resources: givenUrl,
      })

      setTimeout(() => {
        let resources = calendar.getResources()
        expect(resources.length).toBe(2)
        expect(resources[0].id).toBe('1')
        expect(resources[1].id).toBe('2')
        expect(resources[0].title).toBe('room 1')
        expect(resources[1].title).toBe('room 2')
        setTimeout(done)
      }, 100)
    })
  })

  it('will read resources from a function', (done) => {
    let calendar = initCalendar({
      resources(arg, callback) {
        callback([
          { id: '1', title: 'room 1' },
          { id: '2', title: 'room 2' },
        ])
      },
    })

    let resources = calendar.getResources()
    expect(resources.length).toBe(2)
    expect(resources[0].id).toBe('1')
    expect(resources[1].id).toBe('2')
    expect(resources[0].title).toBe('room 1')
    expect(resources[1].title).toBe('room 2')
    setTimeout(done)
  })

  it('will parse event style props', () => {
    initCalendar({
      resources: [{
        id: '1',
        title: 'room 1',
        eventClass: 'niceevents',
        eventColor: 'red',
        eventContrastColor: 'green',
      }],
    })

    let resources = currentCalendar.getResources()
    expect(resources.length).toBe(1)
    expect(resources[0].eventClassNames).toEqual(['niceevents'])
    expect(resources[0].eventColor).toBe('red')
    expect(resources[0].eventContrastColor).toBe('green')
  })

  it('will put misc properties in extendedProps', () => {
    initCalendar({
      resources: [
        { id: '1', title: 'room 1', something: 'cool' },
      ],
    })

    let resources = currentCalendar.getResources()
    expect(resources.length).toBe(1)
    expect(typeof resources[0].extendedProps).toBe('object')
    expect(resources[0].extendedProps.something).toBe('cool')
  })

  it('will receive an explicit extendedProps', () => {
    initCalendar({
      resources: [
        { id: '1', title: 'room 1', extendedProps: { something: 'cool' } },
      ],
    })

    let resources = currentCalendar.getResources()
    expect(resources.length).toBe(1)
    expect(typeof resources[0].extendedProps).toBe('object')
    expect(resources[0].extendedProps.something).toBe('cool')
  })
})
