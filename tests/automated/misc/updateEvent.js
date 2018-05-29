
describe('updateEvent', function() {

  it('maintains resources', function() {
    initCalendar({
      now: '2017-10-05',
      events: [
        { title: 'event 0', start: '2017-10-05', resourceIds: [ 'a', 'b' ] }
      ],
      resources: [
        { id: 'a' },
        { id: 'b' }
      ]
    })

    let event = currentCalendar.clientEvents()[0]
    let resourceIds = event.resources.map((resource) => resource.id)
    expect(resourceIds).toEqual([ 'a', 'b' ])

    event.miscProp = 'cool'
    currentCalendar.updateEvent(event)

    event = currentCalendar.clientEvents()[0]
    resourceIds = event.resources.map((resource) => resource.id)
    expect(resourceIds).toEqual([ 'a', 'b' ])
    expect(event.miscProp).toBe('cool')
  })
})
