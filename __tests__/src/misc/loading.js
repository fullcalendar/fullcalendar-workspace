describe('loading callback', function() {

  it('fires when fetching resources', function(callback) {
    let loadingArgs = []

    initCalendar({
      defaultView: 'resourceTimelineDay',
      resources(fetchInfo, callback) {
        setTimeout(function() {
          callback([
            { id: 'a', title: 'Resource A' },
            { id: 'b', title: 'Resource B' },
          ])
        }, 10)
      },
      loading(arg) {
        loadingArgs.push(arg)
      }
    })

    setTimeout(function() {
      expect(loadingArgs).toEqual([ true, false ])
      callback()
    }, 20) // after resources are loaded
  })

})
