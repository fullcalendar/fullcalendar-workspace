import { getHeadResourceTitles } from '../lib/column'
import { getTimelineResourceTitles } from '../lib/timeline'

describe('refetchResourcesOnNavigate', function() {
  pushOptions({
    refetchResourcesOnNavigate: true,
    now: '2016-12-04',
    scrollTime: '00:00',
    events: [
      { title: 'event1', start: '2016-12-04T01:00:00', resourceId: 'a', className: 'day1event' },
      { title: 'event2', start: '2016-12-04T02:00:00', resourceId: 'b', className: 'day1event' },
      { title: 'event3', start: '2016-12-05T03:00:00', resourceId: 'a', className: 'day2event' },
      { title: 'event4', start: '2016-12-05T04:00:00', resourceId: 'b', className: 'day2event' }
    ]
  })

  describeValues({
    'with resourceTimeline view': {
      view: 'resourceTimelineDay',
      getResourceTitles: getTimelineResourceTitles
    },
    'with resourceTimeGrid view': {
      view: 'resourceTimeGrid',
      getResourceTitles: getHeadResourceTitles
    },
    'with resourceDayGrid view': {
      view: 'resourceDayGrid',
      getResourceTitles: getHeadResourceTitles
    }
  }, function(settings) {
    pushOptions({
      defaultView: settings.view
    })

    it('refetches resources when navigating', function() {
      let resourceCallCnt = 0

      initCalendar({
        resources(arg, callback) {
          resourceCallCnt += 1
          callback([
            { title: `resource a-${resourceCallCnt}`, id: 'a' },
            { title: `resource b-${resourceCallCnt}`, id: 'b' }
          ])
        }
      })

      expect(settings.getResourceTitles()).toEqual([ 'resource a-1', 'resource b-1' ])
      expect($('.day1event').length).toBe(2)

      currentCalendar.next()

      expect(settings.getResourceTitles()).toEqual([ 'resource a-2', 'resource b-2' ])
      expect($('.day1event').length).toBe(0)
      expect($('.day2event').length).toBe(2)
    })


    it('refetches async resources on quick navigate', function(done) {
      let fetchCnt = 0
      let receiveCnt = 0

      initCalendar({
        resources(arg, callback) {
          fetchCnt += 1
          setTimeout(function() {
            callback([
              { title: `resource a-${fetchCnt}`, id: 'a' },
              { title: `resource b-${fetchCnt}`, id: 'b' }
            ])
          }, 500)
        },
        _resourcesRendered() {
          receiveCnt++

          if (receiveCnt === 1) {
            setTimeout(function() {
              currentCalendar.next()

              setTimeout(function() {
                currentCalendar.next()
              }, 100) // before the refetch returns
            }, 0)

          } else if (receiveCnt === 2) {
            setTimeout(function() {
              expect(fetchCnt).toBe(3)
              done()
            }, 0)
          }
        }
      })
    })


    it('refetches async resources and waits to render events', function(done) {
      let fetchCnt = 0
      let receiveCnt = 0

      initCalendar({

        resources(arg, callback) {
          fetchCnt += 1
          setTimeout(function() {
            callback([
              { title: `resource a-${fetchCnt}`, id: 'a' },
              { title: `resource b-${fetchCnt}`, id: 'b' }
            ])
          }, 100)
        },

        _resourcesRendered() {
          receiveCnt += 1

          // step 2
          if (receiveCnt === 1) {
            setTimeout(function() {
              expect(settings.getResourceTitles()).toEqual([ 'resource a-1', 'resource b-1' ])
              expect($('.day1event').length).toBe(2)
              currentCalendar.next()
            }, 0)

          // step 3
          } else if (receiveCnt === 2) {
            // if the 2nd day's events rendered without waiting for the new resources,
            // then you'd still have resource a-1 and b-1

            setTimeout(function() {
              expect(settings.getResourceTitles()).toEqual([ 'resource a-2', 'resource b-2' ])
              expect($('.day1event').length).toBe(0)
              expect($('.day2event').length).toBe(2)
              done()
            }, 0)
          }
        }
      })

      // step 1 (nothing rendered initially)
      expect(fetchCnt).toBe(1)
      expect(settings.getResourceTitles()).toEqual([ ])
      expect($('.day1event').length).toBe(0)
    })


    it('calls datesRender after resources rendered for each navigation', function(done) {
      let fetchCnt = 0
      let receiveCnt = 0

      initCalendar({

        resources(arg, callback) {
          fetchCnt += 1
          setTimeout(function() {
            callback([
              { title: `resource a-${fetchCnt}`, id: 'a' },
              { title: `resource b-${fetchCnt}`, id: 'b' }
            ])
          }, 100)
        },

        _resourcesRendered() {
          receiveCnt += 1

          if (receiveCnt === 1) {
            setTimeout(function() {
              expect(settings.getResourceTitles()).toEqual([ 'resource a-1', 'resource b-1' ])
              currentCalendar.next()
            }, 0)

          } else if (receiveCnt === 2) {
            setTimeout(function() {
              expect(settings.getResourceTitles()).toEqual([ 'resource a-2', 'resource b-2' ])
              done()
            }, 0)
          }
        }
      })
    })
  })


  it('refetches resources on view switch', function() {
    let resourceCallCnt = 0

    initCalendar({
      defaultView: 'resourceTimeGridDay',
      views: {
        resourceTimeGridTwoDay: {
          type: 'resourceTimeGrid',
          duration: { days: 2 }
        }
      },
      resources(arg, callback) {
        resourceCallCnt += 1
        callback([
          { title: `resource a-${resourceCallCnt}`, id: 'a' },
          { title: `resource b-${resourceCallCnt}`, id: 'b' }
        ])
      }
    })

    expect(getHeadResourceTitles()).toEqual([ 'resource a-1', 'resource b-1' ])
    expect($('.day1event').length).toBe(2)

    currentCalendar.changeView('resourceTimeGridTwoDay')

    expect(getHeadResourceTitles()).toEqual([ 'resource a-2', 'resource b-2' ])
    expect($('.day1event').length).toBe(2)
    expect($('.day2event').length).toBe(2)
  })


  it('affects event rendering in non-resource views', function(done) {
    let fetchCnt = 0
    let renderCnt = 0

    initCalendar({
      defaultView: 'timeGridDay',

      resources(arg, callback) {
        fetchCnt += 1
        setTimeout(function() {
          callback([
            { id: 'a', eventClassName: `resource-a-${fetchCnt}` },
            { id: 'b', eventClassName: `resource-b-${fetchCnt}` }
          ])
        }, 100)
      },

      _eventsPositioned() {
        renderCnt += 1

        // step 1 (events don't know about resource classNames yet)
        if (renderCnt === 1) {
          expect(fetchCnt).toBe(1)
          expect($('.resource-a-1').length).toBe(0)
          expect($('.resource-b-1').length).toBe(0)

        // step 2 (after resource fetch happens)
        } else if (renderCnt === 2) {
          setTimeout(function() {
            expect(fetchCnt).toBe(1)
            expect($('.resource-a-1').length).toBe(1)
            expect($('.resource-b-1').length).toBe(1)
            currentCalendar.next()
          }, 200) // after the first fetch

        // step 3
        } else if (renderCnt === 3) {
          setTimeout(function() {
            expect(fetchCnt).toBe(2)
            expect($('.resource-a-1').length).toBe(0)
            expect($('.resource-b-1').length).toBe(0)
            expect($('.resource-a-2').length).toBe(1)
            expect($('.resource-b-2').length).toBe(1)
            done()
          }, 200) // after the second fetch
        }
      }
    })
  })


  it('resources function will receive view start/end/timezone', function(done) {
    initCalendar({
      defaultView: 'resourceTimelineWeek',
      now: '2017-02-12',
      timeZone: 'America/Chicago',
      resources(arg, callback) {
        expect(arg.start).toEqualDate('2017-02-12')
        expect(arg.end).toEqualDate('2017-02-19')
        expect(arg.timeZone).toBe('America/Chicago')
        callback([])
      },
      _resourcesRendered() {
        let resources = currentCalendar.getResources()
        expect(resources.length).toBe(0)
        setTimeout(done)
      }
    })
  })


  it('will cause a resource function to receive start/end/timezone after navigate', function(done) {
    let fetchCnt = 0

    initCalendar({
      defaultView: 'resourceTimelineWeek',
      now: '2017-02-12',
      timeZone: 'America/Chicago',

      resources(arg, callback) {
        fetchCnt += 1

        if (fetchCnt === 1) {
          expect(arg.start).toEqualDate('2017-02-12')
          expect(arg.end).toEqualDate('2017-02-19')
        } else if (fetchCnt === 2) {
          expect(arg.start).toEqualDate('2017-02-19')
          expect(arg.end).toEqualDate('2017-02-26')
        }

        expect(arg.timeZone).toBe('America/Chicago')
        callback([])
      },

      _resourcesRendered() {
        if (fetchCnt === 1) {
          setTimeout(function() {
            currentCalendar.next()
          })
        } else if (fetchCnt === 2) {
          setTimeout(done)
        }
      }
    })
  })


  it('will receive start/end/timezone params when refetchResources', function() {
    let requestCnt = 0

    initCalendar({
      defaultView: 'resourceTimelineWeek',
      now: '2017-02-12',
      timeZone: 'America/Chicago',

      resources(arg, callback) {
        requestCnt += 1
        expect(arg.start).toEqualDate('2017-02-12')
        expect(arg.end).toEqualDate('2017-02-19')
        expect(arg.timeZone).toBe('America/Chicago')
        callback([])
      }
    })

    expect(requestCnt).toBe(1)
    currentCalendar.refetchResources()
    expect(requestCnt).toBe(2)
  })


  describe('when calling a JSON feed', function() {

    beforeEach(function() {
      XHRMock.setup()
    })

    afterEach(function() {
      XHRMock.teardown()
    })


    it('receives the start/end/timezone GET parameters', function(done) {

      XHRMock.get(/^my-feed\.php/, function(req, res) {
        expect(req.url().query).toEqual({
          start: '2017-02-12T00:00:00',
          end: '2017-02-19T00:00:00',
          timeZone: 'America/Chicago'
        })
        done()
        return res.status(200).header('content-type', 'application/json').body('[]')
      })

      initCalendar({
        defaultView: 'resourceTimelineWeek',
        now: '2017-02-12',
        timeZone: 'America/Chicago',
        resources: 'my-feed.php' // will be picked up by XHRMock
      })
    })


    it('respects startParam/endParam/timeZoneParam', function(done) {

      XHRMock.get(/^my-feed\.php/, function(req, res) {
        expect(req.url().query).toEqual({
          mystart: '2017-02-12T00:00:00',
          myend: '2017-02-19T00:00:00',
          mytimezone: 'America/Chicago'
        })
        done()
        return res.status(200).header('content-type', 'application/json').body('[]')
      })

      initCalendar({
        defaultView: 'resourceTimelineWeek',
        now: '2017-02-12',
        timeZone: 'America/Chicago',
        resources: 'my-feed.php', // will be picked up by XHRMock
        startParam: 'mystart',
        endParam: 'myend',
        timeZoneParam: 'mytimezone'
      })
    })


    it('won\'t send start/end/timezone params when off', function(done) {

      XHRMock.get(/^my-feed\.php/, function(req, res) {
        expect(req.url().query).toEqual({}) // no params
        done()
        return res.status(200).header('content-type', 'application/json').body('[]')
      })

      initCalendar({
        defaultView: 'resourceTimelineWeek',
        now: '2017-02-12',
        timeZone: 'America/Chicago',
        resources: 'my-feed.php', // will be picked up by XHRMock
        refetchResourcesOnNavigate: false
      })
    })
  })
})
