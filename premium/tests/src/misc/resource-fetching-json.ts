import fetchMock from 'fetch-mock'

describe('fetching resources from a JSON feed', () => {
  afterEach(() => {
    fetchMock.restore()
  })

  it('allows a POST method', (done) => {
    const givenUrl = window.location.href + '/my-feed.php'
    fetchMock.post(/my-feed\.php/, () => {
      done()
      return { body: [] }
    })

    initCalendar({
      initialView: 'resourceTimelineWeek',
      resources: {
        url: givenUrl,
        method: 'POST',
      },
    })
  })
})
