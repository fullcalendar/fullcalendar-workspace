
describe('timeline view rerendering', function() {

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
      testRefetch(function() {
        currentCalendar.refetchResources()
      }, done)
    })
  })

  describe('when only a few resources', function() {
    pushOptions({
      defaultView: 'timelineDay',
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

    it('doesnt rerender them when navigating dates', function() {
      let resourceRenderCnt = 0

      initCalendar({
        resourceRender() {
          resourceRenderCnt++
        }
      })

      const firstEls = getOrderedResourceEls()
      expect(resourceRenderCnt).toBe(3)
      expect(firstEls.length).toBe(3)

      currentCalendar.next()

      const secondEls = getOrderedResourceEls()
      expect(resourceRenderCnt).toBe(3)
      expect(secondEls.length).toBe(3)

      expect(firstEls[0]).toBe(secondEls[0])
      expect(firstEls[1]).toBe(secondEls[1])
      expect(firstEls[2]).toBe(secondEls[2])
    })
  })


  var testScroll = function(actionFunc, doneFunc) {
    let renderCalls = 0
    initCalendar({
      now: '2015-08-07',
      scrollTime: '00:00',
      defaultView: 'timelineDay',
      events(start, end, timezone, callback) {
        setTimeout(function() {
          callback(getEvents())
        }, 100)
      },
      resources(callback) {
        setTimeout(function() {
          callback(getResources())
        }, 100)
      },
      eventAfterAllRender() {
        const scrollEl = $('.fc-body .fc-time-area .fc-scroller')
        renderCalls++
        if (renderCalls === 1) {
          setTimeout(function() {
            scrollEl.scrollTop(100)
            scrollEl.scrollLeft(50)
            setTimeout(actionFunc, 100)
          }, 100)
        } else if (renderCalls === 2) {
          expect(scrollEl.scrollTop()).toBe(100)
          expect(scrollEl.scrollLeft()).toBe(50)
          doneFunc()
        }
      }
    })
  }

  var testRerender = function(actionFunc, doneFunc) {
    let renderCalls = 0
    initCalendar({
      now: '2015-08-07',
      scrollTime: '00:00',
      defaultView: 'timelineDay',
      events(start, end, timezone, callback) {
        setTimeout(function() {
          callback(getEvents())
        }, 100)
      },
      resources(callback) {
        setTimeout(function() {
          callback(getResources())
        }, 100)
      },
      resourceRender(resource, headTd) {
        if (resource.id === 'e') {
          headTd.find('.fc-cell-text').text(resource.title + renderCalls)
        }
      },
      eventAfterAllRender() {
        const cellText = $.trim($('tr[data-resource-id="e"] .fc-cell-text').text())
        renderCalls++
        if (renderCalls === 1) {
          expect(cellText).toBe('Auditorium E0')
          actionFunc()
        } else if (renderCalls === 2) {
          expect(cellText).toBe('Auditorium E1')
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
      defaultView: 'timelineDay',
      events(start, end, timezone, callback) {
        setTimeout(function() {
          callback(getEvents())
        }, 100)
      },
      resources(callback) {
        setTimeout(function() {
          callback(getResources(renderCalls)) // renderCalls affects data!
        }, 100)
      },
      eventAfterAllRender() {
        const cellText = $.trim($('tr[data-resource-id="e"] .fc-cell-text').text())
        renderCalls++
        if (renderCalls === 1) {
          expect(cellText).toBe('Auditorium E0')
          actionFunc()
        } else if (renderCalls === 2) {
          expect(cellText).toBe('Auditorium E1')
          doneFunc()
        }
      }
    })
  };

  function getResources(cnt) {
    if (cnt == null) { cnt = '' }
    return [
      { id: 'a', title: 'Auditorium A' },
      { id: 'b', title: 'Auditorium B' },
      { id: 'c', title: 'Auditorium C' },
      { id: 'd', title: 'Auditorium D' },
      { id: 'e', title: `Auditorium E${cnt}` },
      { id: 'f', title: 'Auditorium F' },
      { id: 'g', title: 'Auditorium G' },
      { id: 'h', title: 'Auditorium H' },
      { id: 'i', title: 'Auditorium I' },
      { id: 'j', title: 'Auditorium J' },
      { id: 'k', title: 'Auditorium K' },
      { id: 'l', title: 'Auditorium L' },
      { id: 'm', title: 'Auditorium M' },
      { id: 'n', title: 'Auditorium N' },
      { id: 'o', title: 'Auditorium O' },
      { id: 'p', title: 'Auditorium P' },
      { id: 'q', title: 'Auditorium Q' },
      { id: 'r', title: 'Auditorium R' },
      { id: 's', title: 'Auditorium S' },
      { id: 't', title: 'Auditorium T' },
      { id: 'u', title: 'Auditorium U' },
      { id: 'v', title: 'Auditorium V' },
      { id: 'w', title: 'Auditorium W' },
      { id: 'x', title: 'Auditorium X' },
      { id: 'y', title: 'Auditorium Y' },
      { id: 'z', title: 'Auditorium Z' }
    ]
  }

  function getEvents() {
    return [
      { id: '1', resourceId: 'b', start: '2015-08-07T02:00:00', end: '2015-08-07T07:00:00', title: 'event 1' },
      { id: '2', resourceId: 'c', start: '2015-08-07T05:00:00', end: '2015-08-07T22:00:00', title: 'event 2' },
      { id: '3', resourceId: 'd', start: '2015-08-06', end: '2015-08-08', title: 'event 3' },
      { id: '4', resourceId: 'e', start: '2015-08-07T03:00:00', end: '2015-08-07T08:00:00', title: 'event 4' },
      { id: '5', resourceId: 'f', start: '2015-08-07T00:30:00', end: '2015-08-07T02:30:00', title: 'event 5' }
    ]
  }

  function getOrderedResourceEls() {
    return $('.fc-resource-area tr[data-resource-id]')
  }

  // TODO: consolidate. also in resourceOrder
  function getOrderedResourceIds() {
    return getOrderedResourceEls().map(function(i, node) {
      return $(node).data('resource-id')
    }).get()
  }
})
