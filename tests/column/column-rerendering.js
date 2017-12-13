
describe('column-based view rerendering', function() {

  describe('when using rerenderEvents', function() {
    it('maintains scroll', function(done) {
      testScroll(function() {
        currentCalendar.rerenderEvents()
      }, done)
    })
  })

  describe('when using refetchEvents', function() {
    it('maintains scroll', function(done) {
      testScroll(function() {
        currentCalendar.refetchEvents()
      }, done)
    })
  })

  describe('when using rerenderResources', function() {

    it('rerenders the DOM', function(done) {
      testRerender(function() {
        currentCalendar.rerenderResources()
      }, done)
    })

    it('maintains scroll', function(done) {
      testScroll(function() {
        currentCalendar.rerenderResources()
      }, done)
    })
  })

  describe('when using refetchResources', function() {

    it('rerenders the DOM', function(done) {
      testRefetch(function() {
        currentCalendar.refetchResources()
      }, done)
    })

    it('maintains scroll', function(done) {
      testScroll(function() {
        currentCalendar.refetchResources()
      }, done)
    })
  })

  describeOptions('defaultView', {
    'when agenda': 'agendaDay',
    'when basic': 'basicDay'
  }, function() {

    pushOptions({
      resources: [
        { id: 'a', title: 'Auditorium A' },
        { id: 'b', title: 'Auditorium B' },
        { id: 'c', title: 'Auditorium C' }
      ]
    })

    it('adjusts to removeResource', function() {
      initCalendar()
      expect(getOrderedResourceIds()).toEqual([ 'a', 'b', 'c' ])
      currentCalendar.removeResource('a')
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
  })


  function testRerender(actionFunc, doneFunc) {
    let renderCalls = 0
    initCalendar({
      now: '2015-08-07',
      scrollTime: '00:00',
      defaultView: 'agendaDay',
      resources(callback) {
        setTimeout(function() {
          callback([
            { id: 'a', title: 'Auditorium A' },
            { id: 'b', title: 'Auditorium B' },
            { id: 'c', title: 'Auditorium C' }
          ])
        }, 100)
      },
      events(start, end, timezone, callback) {
        setTimeout(function() {
          callback([
            { id: '1', resourceId: 'b', start: '2015-08-07T02:00:00', end: '2015-08-07T07:00:00', title: 'event 1' },
            { id: '2', resourceId: 'c', start: '2015-08-07T05:00:00', end: '2015-08-07T22:00:00', title: 'event 2' },
            { id: '3', resourceId: 'd', start: '2015-08-06', end: '2015-08-08', title: 'event 3' }
          ])
        }, 100)
      },
      resourceRender(resource, headTd) {
        headTd.text(resource.title + renderCalls)
      },
      eventAfterAllRender() {
        const cellText = $.trim($('th[data-resource-id="a"]').text())
        renderCalls++
        if (renderCalls === 1) {
          expect(cellText).toBe('Auditorium A0')
          actionFunc()
        } else if (renderCalls === 2) {
          expect(cellText).toBe('Auditorium A1')
          doneFunc()
        }
      }
    })
  }


  function testRefetch(actionFunc, doneFunc) {
    let renderCalls = 0
    initCalendar({
      now: '2015-08-07',
      scrollTime: '00:00',
      defaultView: 'agendaDay',
      resources(callback) {
        setTimeout(function() {
          callback([
            { id: 'a', title: `Auditorium A${renderCalls}` },
            { id: 'b', title: 'Auditorium B' },
            { id: 'c', title: 'Auditorium C' }
          ])
        }, 100)
      },
      events(start, end, timezone, callback) {
        setTimeout(function() {
          callback([
            { id: '1', resourceId: 'b', start: '2015-08-07T02:00:00', end: '2015-08-07T07:00:00', title: 'event 1' },
            { id: '2', resourceId: 'c', start: '2015-08-07T05:00:00', end: '2015-08-07T22:00:00', title: 'event 2' },
            { id: '3', resourceId: 'd', start: '2015-08-06', end: '2015-08-08', title: 'event 3' }
          ])
        }, 100)
      },
      eventAfterAllRender() {
        const cellText = $.trim($('th[data-resource-id="a"]').text())
        renderCalls++
        if (renderCalls === 1) {
          expect(cellText).toBe('Auditorium A0')
          actionFunc()
        } else if (renderCalls === 2) {
          expect(cellText).toBe('Auditorium A1')
          doneFunc()
        }
      }
    })
  }

  function testScroll(actionFunc, doneFunc) {
    let renderCalls = 0
    initCalendar({
      now: '2015-08-07',
      scrollTime: '00:00',
      defaultView: 'agendaDay',
      resources(callback) {
        setTimeout(function() {
          callback([
            { id: 'a', title: 'Auditorium A' },
            { id: 'b', title: 'Auditorium B' },
            { id: 'c', title: 'Auditorium C' }
          ])
        }, 100)
      },
      events(start, end, timezone, callback) {
        setTimeout(function() {
          callback([
            { id: '1', resourceId: 'b', start: '2015-08-07T02:00:00', end: '2015-08-07T07:00:00', title: 'event 1' },
            { id: '2', resourceId: 'c', start: '2015-08-07T05:00:00', end: '2015-08-07T22:00:00', title: 'event 2' },
            { id: '3', resourceId: 'd', start: '2015-08-06', end: '2015-08-08', title: 'event 3' }
          ])
        }, 100)
      },
      eventAfterAllRender() {
        const scrollEl = $('.fc-time-grid-container.fc-scroller')
        renderCalls++
        if (renderCalls === 1) {
          setTimeout(function() {
            scrollEl.scrollTop(100)
            setTimeout(actionFunc, 100)
          }, 100)
        } else if (renderCalls === 2) {
          expect(scrollEl.scrollTop()).toBe(100)
          doneFunc()
        }
      }
    })
  }

  // TODO: consolidate. also in resourceOrder
  function getOrderedResourceIds() {
    return $('th.fc-resource-cell').map(function(i, node) {
      return $(node).data('resource-id')
    }).get()
  }
})
