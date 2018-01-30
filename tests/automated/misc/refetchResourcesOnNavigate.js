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
    'with timeline view': {
      view: 'timelineDay',
      getResourceTitles: getTimelineResourceTitles
    },
    'with resource agenda view': {
      view: 'agendaDay',
      getResourceTitles: getHeadResourceTitles
    },
    'with resource basic view': {
      view: 'basicDay',
      getResourceTitles: getHeadResourceTitles
    }
  }, function(settings) {
    pushOptions({
      defaultView: settings.view
    })

    it('refetches resources when navigating', function() {
      let resourceCallCnt = 0

      initCalendar({
        resources(callback) {
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
      let resourceCallCnt = 0
      let eventRenderingCnt = 0

      initCalendar({
        resources(callback) {
          resourceCallCnt += 1
          setTimeout(function() {
            callback([
              { title: `resource a-${resourceCallCnt}`, id: 'a' },
              { title: `resource b-${resourceCallCnt}`, id: 'b' }
            ])
          }, 500)
        },

        eventAfterAllRender() {
          eventRenderingCnt += 1

          if (eventRenderingCnt === 1) {
            currentCalendar.next()
            setTimeout(function() {
              currentCalendar.next()
            }, 100) // before the refetch returns

          } else if (eventRenderingCnt === 2) {
            expect(resourceCallCnt).toBe(3)
            done()
          }
        }
      })
    })


    it('refetches async resources and waits to render events', function(done) {
      let resourceCallCnt = 0
      let eventRenderingCnt = 0

      initCalendar({
        resources(callback) {
          resourceCallCnt += 1
          setTimeout(function() {
            callback([
              { title: `resource a-${resourceCallCnt}`, id: 'a' },
              { title: `resource b-${resourceCallCnt}`, id: 'b' }
            ])
          }, 100)
        },

        eventAfterAllRender() {
          eventRenderingCnt += 1

          // step 2
          if (eventRenderingCnt === 1) {
            expect(settings.getResourceTitles()).toEqual([ 'resource a-1', 'resource b-1' ])
            expect($('.day1event').length).toBe(2)
            currentCalendar.next()

          // step 3
          } else if (eventRenderingCnt === 2) {
            // if the 2nd day's events rendered without waiting for the new resources,
            // then you'd still have resource a-1 and b-1

            expect(settings.getResourceTitles()).toEqual([ 'resource a-2', 'resource b-2' ])
            expect($('.day1event').length).toBe(0)
            expect($('.day2event').length).toBe(2)
            done()
          }
        }
      })

      // step 1 (nothing rendered initially)
      expect(resourceCallCnt).toBe(1)
      expect(settings.getResourceTitles()).toEqual([ ])
      expect($('.day1event').length).toBe(0)
    })


    it('calls viewRender after resources rendered for each navigation', function(done) {
      let resourceCallCnt = 0
      let viewRenderCallCnt = 0

      initCalendar({
        resources(callback) {
          resourceCallCnt += 1
          setTimeout(function() {
            callback([
              { title: `resource a-${resourceCallCnt}`, id: 'a' },
              { title: `resource b-${resourceCallCnt}`, id: 'b' }
            ])
          }, 100)
        },

        viewRender() {
          viewRenderCallCnt += 1

          if (viewRenderCallCnt === 1) {
            expect(settings.getResourceTitles()).toEqual([ 'resource a-1', 'resource b-1' ])
            currentCalendar.next()

          } else if (viewRenderCallCnt === 2) {
            expect(settings.getResourceTitles()).toEqual([ 'resource a-2', 'resource b-2' ])
            done()
          }
        }
      })
    })
  })


  it('refetches resources on view switch', function() {
    let resourceCallCnt = 0

    initCalendar({
      defaultView: 'agendaDay',
      views: {
        agendaTwoDay: {
          type: 'agenda',
          duration: { days: 2 },
          groupByResource: true
        }
      },
      resources(callback) {
        resourceCallCnt += 1
        callback([
          { title: `resource a-${resourceCallCnt}`, id: 'a' },
          { title: `resource b-${resourceCallCnt}`, id: 'b' }
        ])
      }
    })

    expect(getHeadResourceTitles()).toEqual([ 'resource a-1', 'resource b-1' ])
    expect($('.day1event').length).toBe(2)

    currentCalendar.changeView('agendaTwoDay')

    expect(getHeadResourceTitles()).toEqual([ 'resource a-2', 'resource b-2' ])
    expect($('.day1event').length).toBe(2)
    expect($('.day2event').length).toBe(2)
  })


  it('affects event rendering in non-resource views', function(done) {
    let resourceCallCnt = 0
    let eventRenderingCnt = 0

    initCalendar({
      defaultView: 'agendaDay',
      groupByResource: false,
      groupByDateAndResource: false,

      resources(callback) {
        resourceCallCnt += 1
        setTimeout(function() {
          callback([
            { id: 'a', eventClassName: `resource-a-${resourceCallCnt}` },
            { id: 'b', eventClassName: `resource-b-${resourceCallCnt}` }
          ])
        }, 100)
      },

      eventAfterAllRender() {
        eventRenderingCnt += 1

        // step 2
        if (eventRenderingCnt === 1) {
          expect(resourceCallCnt).toBe(1)
          expect($('.resource-a-1').length).toBe(1)
          expect($('.resource-b-1').length).toBe(1)
          currentCalendar.next()

        // step 3
        } else if (eventRenderingCnt === 2) {
          expect(resourceCallCnt).toBe(2)
          expect($('.resource-a-1').length).toBe(0)
          expect($('.resource-b-1').length).toBe(0)
          expect($('.resource-a-2').length).toBe(1)
          expect($('.resource-b-2').length).toBe(1)
          done()
        }
      }
    })

    // step 1 (nothing rendered initially)
    expect(resourceCallCnt).toBe(1)
    expect($('.resource-a-1').length).toBe(0)
    expect($('.resource-b-1').length).toBe(0)
  })


  it('resources function will receive view start/end/timezone', function(done) {
    initCalendar({
      defaultView: 'timelineWeek',
      now: '2017-02-12',
      timezone: 'America/Chicago',
      resources(callback, start, end, timezone) {
        expect(start.format()).toBe('2017-02-12')
        expect(end.format()).toBe('2017-02-19')
        expect(timezone).toBe('America/Chicago')
        callback([])
      },
      resourcesSet(resources) {
        expect(resources.length).toBe(0)
        setTimeout(done)
      }
    })
  })


  it('will cause a resource function to receive start/end/timezone after navigate', function(done) {
    let renderCnt = 0

    initCalendar({
      defaultView: 'timelineWeek',
      now: '2017-02-12',
      timezone: 'America/Chicago',

      resources(callback, start, end, timezone) {
        renderCnt += 1

        if (renderCnt === 1) {
          expect(start.format()).toBe('2017-02-12')
          expect(end.format()).toBe('2017-02-19')
        } else if (renderCnt === 2) {
          expect(start.format()).toBe('2017-02-19')
          expect(end.format()).toBe('2017-02-26')
        }

        expect(timezone).toBe('America/Chicago')
        callback([])
      },

      eventAfterAllRender(resources) {
        if (renderCnt === 1) {
          setTimeout(function() {
            currentCalendar.next()
          })
        } else if (renderCnt === 2) {
          done()
        }
      }
    })
  })


  it('will receive start/end/timezone params when refetchResources', function() {
    let requestCnt = 0

    initCalendar({
      defaultView: 'timelineWeek',
      now: '2017-02-12',
      timezone: 'America/Chicago',

      resources(callback, start, end, timezone) {
        requestCnt += 1
        expect(start.format()).toBe('2017-02-12')
        expect(end.format()).toBe('2017-02-19')
        expect(timezone).toBe('America/Chicago')
        callback([])
      }
    })

    expect(requestCnt).toBe(1)
    currentCalendar.refetchResources()
    expect(requestCnt).toBe(2)
  })


  describe('when calling a JSON feed', function() {

    beforeEach(function() {
      $.mockjax({
        url: '*',
        contentType: 'text/json',
        responseText: []
      })
      $.mockjaxSettings.log = function() {} // don't console.log
    })

    afterEach(function() {
      $.mockjax.clear()
    })


    it('receives the start/end/timezone GET parameters', function(done) {

      initCalendar({
        defaultView: 'timelineWeek',
        now: '2017-02-12',
        timezone: 'America/Chicago',
        resources: 'my-feed.php' // will be picked up by mockjax
      })

      setTimeout(function() { // wait for ajax
        const request = $.mockjax.mockedAjaxCalls()[0]
        expect(request.data.start).toBe('2017-02-12')
        expect(request.data.end).toBe('2017-02-19')
        expect(request.data.timezone).toBe('America/Chicago')
        done()
      })
    })


    it('respects startParam/endParam/timezoneParam', function(done) {

      initCalendar({
        defaultView: 'timelineWeek',
        now: '2017-02-12',
        timezone: 'America/Chicago',
        resources: 'my-feed.php', // will be picked up by mockjax
        startParam: 'mystart',
        endParam: 'myend',
        timezoneParam: 'mytimezone'
      })

      setTimeout(function() { // wait for ajax
        const request = $.mockjax.mockedAjaxCalls()[0]
        expect(request.data.mystart).toBe('2017-02-12')
        expect(request.data.myend).toBe('2017-02-19')
        expect(request.data.mytimezone).toBe('America/Chicago')
        done()
      })
    })


    it('won\'t send start/end/timezone params when off', function(done) {

      initCalendar({
        defaultView: 'timelineWeek',
        now: '2017-02-12',
        timezone: 'America/Chicago',
        resources: 'my-feed.php', // will be picked up by mockjax
        refetchResourcesOnNavigate: false
      })

      setTimeout(function() { // wait for ajax
        const request = $.mockjax.mockedAjaxCalls()[0]
        expect(request.data.start).toBeFalsy()
        expect(request.data.end).toBeFalsy()
        expect(request.data.timezone).toBeFalsy()
        done()
      })
    })
  })
})
