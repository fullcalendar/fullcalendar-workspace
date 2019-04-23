
describe('fetching resources from a JSON feed', function() {

  beforeEach(function() {
    XHRMock.setup()
  })

  afterEach(function() {
    XHRMock.teardown()
  })

  it('allows a POST method', function(done) {
    XHRMock.post(/^my-feed\.php/, function(req, res) {
      done()
      return res.status(200).header('content-type', 'application/json').body('[]')
    })

    initCalendar({
      defaultView: 'resourceTimelineWeek',
      resources: {
        url: 'my-feed.php', // will be picked up by XHRMock
        method: 'POST'
      }
    })
  })

})
