import ResourceTimelineViewWrapper from "../lib/wrappers/ResourceTimelineViewWrapper"

describe('timeline view rerendering', function() {

  describe('events, when rerendering', function() {

    it('maintains scroll', function(done) {
      testScrollForEvents(function() {
        currentCalendar.render()
      }, done)
    })
  })

  describe('events, when using refetchEvents', function() {

    it('maintains scroll', function(done) {
      testScrollForEvents(function() {
        currentCalendar.refetchEvents()
      }, done)
    })
  })

  describe('resources, when rerendering', function() {
    it('maintains scroll', function(done) {
      testScrollForResources(function() {
        currentCalendar.render()
      }, done)
    })
  })

  describe('resource, when using refetchResources', function() {
    it('rerenders the DOM', function(done) {
      testResourceRefetch(function() {
        currentCalendar.refetchResources()
      }, done)
    })

    it('maintains scroll', function(done) {
      testResourceRefetch(function() {
        currentCalendar.refetchResources()
      }, done)
    })
  })

  describe('when only a few resources', function() {
    pushOptions({
      defaultView: 'resourceTimelineDay',
      resources: [
        { id: 'a', title: 'Auditorium A' },
        { id: 'b', title: 'Auditorium B' },
        { id: 'c', title: 'Auditorium C' }
      ]
    })


    it('adjusts to removeResource', function() {
      let calendar = initCalendar()
      let dataGridWrapper = new ResourceTimelineViewWrapper(calendar).dataGrid

      expect(dataGridWrapper.getResourceIds()).toEqual([ 'a', 'b', 'c' ])
      currentCalendar.getResourceById('a').remove()
      expect(dataGridWrapper.getResourceIds()).toEqual([ 'b', 'c' ])
    })


    it('adjusts to addResource', function() {
      let calendar = initCalendar()
      let dataGridWrapper = new ResourceTimelineViewWrapper(calendar).dataGrid

      expect(dataGridWrapper.getResourceIds()).toEqual([ 'a', 'b', 'c' ])

      currentCalendar.addResource({
        id: 'd',
        title: 'Auditorium D'
      })

      expect(dataGridWrapper.getResourceIds()).toEqual([ 'a', 'b', 'c', 'd' ])
    })


    it('doesnt rerender them when navigating dates', function() {
      let resourceRenderCnt = 0
      let calendar = initCalendar({
        resourceLabelContent() {
          resourceRenderCnt++
        }
      })
      let dataGridWrapper = new ResourceTimelineViewWrapper(calendar).dataGrid
      let initialInfos = dataGridWrapper.getResourceInfo()

      expect(resourceRenderCnt).toBe(3)
      expect(initialInfos.length).toBe(3)

      currentCalendar.next()
      const secondaryInfos = dataGridWrapper.getResourceInfo()

      expect(resourceRenderCnt).toBe(3)
      expect(secondaryInfos.length).toBe(3)

      expect(initialInfos[0].rowEl).toBe(secondaryInfos[0].rowEl)
      expect(initialInfos[1].rowEl).toBe(secondaryInfos[1].rowEl)
      expect(initialInfos[2].rowEl).toBe(secondaryInfos[2].rowEl)
    })

  })


  function testScrollForEvents(actionFunc, doneFunc) {
    let calendar = initCalendar({
      now: '2015-08-07',
      scrollTime: '00:00',
      defaultView: 'resourceTimelineDay',
      events(arg, callback) {
        setTimeout(function() {
          callback(getEvents())
        }, 100)
      },
      resources(arg, callback) {
        setTimeout(function() {
          callback(getResources())
        }, 100)
      }
    })

    let viewWrapper = new ResourceTimelineViewWrapper(calendar)
    let scrollEl = viewWrapper.getTimeScrollEl()

    setTimeout(function() {
      scrollEl.scrollTop = 100
      scrollEl.scrollLeft = 50

      actionFunc()
      setTimeout(function() {

        expect(Math.abs(scrollEl.scrollTop - 100)).toBeLessThanOrEqual(1) // IE :(
        expect(scrollEl.scrollLeft).toBe(50)
        doneFunc()

      }, 200) // after fetching
    }, 200) // after fetching
  }


  function testScrollForResources(actionFunc, doneFunc) {
    let calendar = initCalendar({
      now: '2015-08-07',
      scrollTime: '00:00',
      defaultView: 'resourceTimelineDay',
      events(arg, callback) {
        setTimeout(function() {
          callback(getEvents())
        }, 100)
      },
      resources(arg, callback) {
        setTimeout(function() {
          callback(getResources())
        }, 100)
      }
    })

    let viewWrapper = new ResourceTimelineViewWrapper(calendar)
    let scrollEl = viewWrapper.getTimeScrollEl()

    setTimeout(function() {
      scrollEl.scrollTop = 100
      scrollEl.scrollLeft = 50

      actionFunc()
      setTimeout(function() {

        expect(scrollEl.scrollTop).toBe(100)
        expect(scrollEl.scrollLeft).toBe(50)
        doneFunc()

      }, 200) // after fetching
    }, 200) // after fetching
  }


  function testResourceRefetch(actionFunc, doneFunc) {
    let resourceFetchCnt = 0
    let calendar = initCalendar({
      now: '2015-08-07',
      scrollTime: '00:00',
      defaultView: 'resourceTimelineDay',
      events(arg, callback) {
        setTimeout(function() {
          callback(getEvents())
        }, 100)
      },
      resources(arg, callback) {
        setTimeout(function() {
          callback(getResources(resourceFetchCnt++)) // parameter will affect text
        }, 100)
      }
    })

    let dataGridWrapper = new ResourceTimelineViewWrapper(calendar).dataGrid

    setTimeout(function() {

      let cellText = dataGridWrapper.getSpecificResourceInfo('e').text
      expect(cellText).toBe('Auditorium E0')
      actionFunc()

      setTimeout(function() {

        let cellText = dataGridWrapper.getSpecificResourceInfo('e').text
        expect(cellText).toBe('Auditorium E1')
        doneFunc()

      }, 200) // after fetch
    }, 200) // after fetch
  }


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

})
