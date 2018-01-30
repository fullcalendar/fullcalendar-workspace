
describe('timeline background events', function() {

  it('does not rerender a removed event when toggling collapse state', function(done) {
    initCalendar({
      now: '2017-03-07',
      scrollTime: '00:00',
      defaultView: 'timelineDay',
      resources: [{
        id: 'root',
        children: [{
          id: 'foo',
          title: 'Some nested resource'
        }]
      }],
      events: [{
        id: '1',
        resourceId: 'foo',
        start: '2017-03-07T02:00:00',
        end: '2017-03-07T06:00:00',
        rendering: 'background'
      }]
    })

    expect(getBgEventCnt()).toBe(1)

    currentCalendar.removeEvents('1')
    expect(getBgEventCnt()).toBe(0)

    const toggleEl = $('.fc-expander-space')
    toggleEl.simulate('click') // close

    setTimeout(function() {
      expect(getBgEventCnt()).toBe(0)
      toggleEl.simulate('click') // open again

      setTimeout(function() {
        // should stay at zero
        expect(getBgEventCnt()).toBe(0)
        done()
      }, 100)
    }, 100)
  })

  function getBgEventCnt() {
    return $('.fc-bgevent').length
  }
})
