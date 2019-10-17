
describe('getResources', function() {
  pushOptions({
    resources: [
      { id: 'a', title: 'a' },
      { id: 'b', title: 'b' },
      { id: 'c', title: 'c' }
    ]
  })

  it('does not mutate when removeResource is called', function() {
    initCalendar()
    const resources = currentCalendar.getResources()
    expect(resources.length).toBe(3)
    resources[0].remove()
    expect(resources.length).toBe(3)
  })
})
