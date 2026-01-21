describe('Event::setProp', () => {
  it('maintains resources', () => {
    initCalendar({
      now: '2017-10-05',
      events: [
        { title: 'event 0', start: '2017-10-05', resourceIds: ['a', 'b'] },
      ],
      resources: [
        { id: 'a' },
        { id: 'b' },
      ],
    })

    let event = currentCalendar.getEvents()[0]
    let resourceIds = event.getResources().map((resource) => resource.id)
    expect(resourceIds).toEqual(['a', 'b'])

    event.setProp('title', 'cool')

    event = currentCalendar.getEvents()[0]
    resourceIds = event.getResources().map((resource) => resource.id)
    expect(resourceIds).toEqual(['a', 'b'])
    expect(event.title).toBe('cool')
  })
})
