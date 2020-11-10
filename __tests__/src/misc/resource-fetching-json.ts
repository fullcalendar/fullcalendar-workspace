import XHRMock from 'xhr-mock'

describe('fetching resources from a JSON feed', () => {
  beforeEach(() => {
    XHRMock.setup()
  })

  afterEach(() => {
    XHRMock.teardown()
  })

  it('allows a POST method', (done) => {
    XHRMock.post(/^my-feed\.php/, (req, res) => {
      done()
      return res.status(200).header('content-type', 'application/json').body('[]')
    })

    initCalendar({
      initialView: 'resourceTimelineWeek',
      resources: {
        url: 'my-feed.php', // will be picked up by XHRMock
        method: 'POST',
      },
    })
  })
})
