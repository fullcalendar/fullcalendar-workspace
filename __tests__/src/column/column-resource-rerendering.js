
describe('vresource resource rerendering', function() {
  pushOptions({
    defaultView: 'resourceTimeGridDay',
    resources: [
      { id: 'a', title: 'Auditorium A' },
      { id: 'b', title: 'Auditorium B' },
      { id: 'c', title: 'Auditorium C' }
    ]
  })

  it('adjusts to Resource::remove', function() {
    initCalendar()
    expect(getOrderedResourceIds()).toEqual([ 'a', 'b', 'c' ])
    currentCalendar.getResourceById('a').remove()
    expect(getOrderedResourceIds()).toEqual([ 'b', 'c' ])
  })

  it('adjusts to addResource', function() {
    initCalendar()
    expect(getOrderedResourceIds()).toEqual([ 'a', 'b', 'c' ])
    currentCalendar.addResource({
      id: 'd',
      title: 'Auditorium D'
    })
    expect(getOrderedResourceIds()).toEqual([ 'a', 'b', 'c', 'd' ])
  })

  // TODO: consolidate. also in resourceOrder
  function getOrderedResourceIds() {
    return $('th.fc-resource-cell').map(function(i, node) {
      return $(node).data('resource-id')
    }).get()
  }
})
