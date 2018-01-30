
// resourceRenderWait is not a setting yet, but we can simulate the same queuing behavior
// by spawning resource rendering actions in a view callback
describe('resource render waiting', function() {

  it('repeated rerenders only rerender once', function() {
    let resourceRenderCnt = 0
    let eventAllRenderCnt = 0

    initCalendar({
      defaultView: 'timeline',
      resources(callback) {
        callback([
          { id: 'a', title: 'a' },
          { id: 'b', title: 'b' }
        ])
      },

      resourceRender(resource) {
        resourceRenderCnt += 1
      },

      eventAfterAllRender() {
        eventAllRenderCnt += 1

        if (eventAllRenderCnt === 1) {
          currentCalendar.rerenderResources()
          currentCalendar.rerenderResources()
        }
      }
    })

    expect(resourceRenderCnt).toBe(4) // 2 for initial render, 2 for a rerender
  })
})
