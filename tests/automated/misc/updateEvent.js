
describe('updateEvent', function() {

  it('maintains resourceIds', function() {
    initCalendar({
      now: '2017-10-05',
      events: [
        { title: 'event 0', start: '2017-10-05', resourceIds: [ 'a', 'b' ] }
      ]
    })

    let event = currentCalendar.clientEvents()[0]
    expect(event.resourceIds).toEqual([ 'a', 'b' ])

    event.miscProp = 'cool'
    currentCalendar.updateEvent(event)

    event = currentCalendar.clientEvents()[0]
    expect(event.resourceIds).toEqual([ 'a', 'b' ])
    expect(event.miscProp).toBe('cool')
  })
})
