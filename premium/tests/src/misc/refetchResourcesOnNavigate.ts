import XHRMock from 'xhr-mock'
import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'
import { ResourceTimeGridViewWrapper } from '../lib/wrappers/ResourceTimeGridViewWrapper'
import { ResourceDayGridViewWrapper } from '../lib/wrappers/ResourceDayGridViewWrapper'

describe('refetchResourcesOnNavigate', () => {
  pushOptions({
    refetchResourcesOnNavigate: true,
    now: '2016-12-04',
    scrollTime: '00:00',
    events: [
      { title: 'event1', start: '2016-12-04T01:00:00', resourceId: 'a', className: 'day1event' },
      { title: 'event2', start: '2016-12-04T02:00:00', resourceId: 'b', className: 'day1event' },
      { title: 'event3', start: '2016-12-05T03:00:00', resourceId: 'a', className: 'day2event' },
      { title: 'event4', start: '2016-12-05T04:00:00', resourceId: 'b', className: 'day2event' },
    ],
  })

  describeValues({
    'with resourceTimeline view': {
      view: 'resourceTimelineDay',
      getResourceTitles: (calendar) => extractTitles(new ResourceTimelineViewWrapper(calendar).dataGrid.getResourceInfo()),
    },
    'with resourceTimeGrid view': {
      view: 'resourceTimeGrid',
      getResourceTitles: (calendar) => extractTitles(new ResourceTimeGridViewWrapper(calendar).header.getResourceInfo()),
    },
    'with resourceDayGrid view': {
      view: 'resourceDayGrid',
      getResourceTitles: (calendar) => extractTitles(new ResourceDayGridViewWrapper(calendar).header.getResourceInfo()),
    },
  }, (settings) => {
    pushOptions({
      initialView: settings.view,
    })

    it('refetches resources when navigating', () => {
      let resourceCallCnt = 0
      let calendar = initCalendar({
        resources(arg, callback) {
          resourceCallCnt += 1
          callback([
            { title: `resource a-${resourceCallCnt}`, id: 'a' },
            { title: `resource b-${resourceCallCnt}`, id: 'b' },
          ])
        },
      })

      expect(settings.getResourceTitles(calendar)).toEqual(['resource a-1', 'resource b-1'])
      expect($('.day1event').length).toBe(2)

      calendar.next()

      expect(settings.getResourceTitles(calendar)).toEqual(['resource a-2', 'resource b-2'])
      expect($('.day1event').length).toBe(0)
      expect($('.day2event').length).toBe(2)
    })

    it('refetches async resources on quick navigate', (done) => {
      let fetchCnt = 0

      let calendar = initCalendar({
        resources(arg, callback) {
          fetchCnt += 1
          setTimeout(() => {
            callback([
              { title: `resource a-${fetchCnt}`, id: 'a' },
              { title: `resource b-${fetchCnt}`, id: 'b' },
            ])
          }, 100)
        },
      })

      calendar.next()
      setTimeout(() => {
        calendar.next()
        setTimeout(() => {
          expect(fetchCnt).toBe(3)
          done()
        }, 200) // after everything
      }, 50) // before the refetch returns
    })

    it('refetches async resources and waits to render events', (done) => {
      let fetchCnt = 0
      let calendar = initCalendar({
        resources(arg, callback) {
          fetchCnt += 1
          setTimeout(() => {
            callback([
              { title: `resource a-${fetchCnt}`, id: 'a' },
              { title: `resource b-${fetchCnt}`, id: 'b' },
            ])
          }, 100)
        },
      })

      // step 1 (nothing rendered initially)
      expect(fetchCnt).toBe(1)
      expect(settings.getResourceTitles(calendar)).toEqual([])
      expect($('.day1event').length).toBe(0)

      // step 2 (wait for initial fetch to finish)
      setTimeout(() => {
        expect(settings.getResourceTitles(calendar)).toEqual(['resource a-1', 'resource b-1'])
        expect($('.day1event').length).toBe(2)

        // step 3
        calendar.next()
        setTimeout(() => {
          expect(settings.getResourceTitles(calendar)).toEqual(['resource a-2', 'resource b-2'])
          expect($('.day1event').length).toBe(0)
          expect($('.day2event').length).toBe(2)
          done()
        }, 101)
      }, 101)
    })

    it('does resources-function re-call for each navigation', (done) => {
      let fetchCnt = 0
      let calendar = initCalendar({
        resources(arg, callback) {
          fetchCnt += 1
          setTimeout(() => {
            callback([
              { title: `resource a-${fetchCnt}`, id: 'a' },
              { title: `resource b-${fetchCnt}`, id: 'b' },
            ])
          }, 100)
        },
      })

      setTimeout(() => {
        expect(settings.getResourceTitles(calendar)).toEqual(['resource a-1', 'resource b-1'])

        currentCalendar.next()
        setTimeout(() => {
          expect(settings.getResourceTitles(calendar)).toEqual(['resource a-2', 'resource b-2'])
          done()
        }, 101)
      }, 101)
    })
  })

  it('refetches resources on view switch', () => {
    let resourceCallCnt = 0
    let calendar = initCalendar({
      initialView: 'resourceTimeGridDay',
      views: {
        resourceTimeGridTwoDay: {
          type: 'resourceTimeGrid',
          duration: { days: 2 },
        },
      },
      resources(arg, callback) {
        resourceCallCnt += 1
        callback([
          { title: `resource a-${resourceCallCnt}`, id: 'a' },
          { title: `resource b-${resourceCallCnt}`, id: 'b' },
        ])
      },
    })

    let headerWrapper = new ResourceTimeGridViewWrapper(calendar).header

    function getResourceTitles() {
      return extractTitles(headerWrapper.getResourceInfo())
    }

    expect(getResourceTitles()).toEqual(['resource a-1', 'resource b-1'])
    expect($('.day1event').length).toBe(2)

    currentCalendar.changeView('resourceTimeGridTwoDay')

    expect(getResourceTitles()).toEqual(['resource a-2', 'resource b-2'])
    expect($('.day1event').length).toBe(2)
    expect($('.day2event').length).toBe(2)
  })

  it('affects event rendering in non-resource views', (done) => {
    let fetchCnt = 0

    initCalendar({
      initialView: 'timeGridDay',

      resources(arg, callback) {
        fetchCnt += 1
        setTimeout(() => {
          callback([
            { id: 'a', eventClassNames: `resource-a-${fetchCnt}` },
            { id: 'b', eventClassNames: `resource-b-${fetchCnt}` },
          ])
        }, 100)
      },
    })

    // step 1 (events don't know about resource classNames yet)
    expect(fetchCnt).toBe(1)
    expect($('.resource-a-1').length).toBe(0)
    expect($('.resource-b-1').length).toBe(0)

    // step 2 (after resource fetch happens)
    setTimeout(() => {
      expect(fetchCnt).toBe(1)
      expect($('.resource-a-1').length).toBe(1)
      expect($('.resource-b-1').length).toBe(1)
      currentCalendar.next()

      // step 3 (after fetch from next() happens)
      setTimeout(() => {
        expect(fetchCnt).toBe(2)
        expect($('.resource-a-1').length).toBe(0)
        expect($('.resource-b-1').length).toBe(0)
        expect($('.resource-a-2').length).toBe(1)
        expect($('.resource-b-2').length).toBe(1)
        done()
      }, 101)
    }, 101)
  })

  it('resources function will receive view start/end/timezone', (done) => {
    let calendar = initCalendar({
      initialView: 'resourceTimelineWeek',
      now: '2017-02-12',
      timeZone: 'America/Chicago',
      resources(arg, callback) {
        expect(arg.start).toEqualDate('2017-02-12')
        expect(arg.end).toEqualDate('2017-02-19')
        expect(arg.timeZone).toBe('America/Chicago')
        callback([])
      },
    })

    let resources = calendar.getResources()
    expect(resources.length).toBe(0)
    setTimeout(done)
  })

  it('will cause a resource function to receive start/end/timezone after navigate', () => {
    let fetchCnt = 0
    let calendar = initCalendar({
      initialView: 'resourceTimelineWeek',
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
    })

    calendar.next()
    expect(fetchCnt).toBe(2)
  })

  it('will receive start/end/timezone params when refetchResources', () => {
    let requestCnt = 0

    initCalendar({
      initialView: 'resourceTimelineWeek',
      now: '2017-02-12',
      timeZone: 'America/Chicago',

      resources(arg, callback) {
        requestCnt += 1
        expect(arg.start).toEqualDate('2017-02-12')
        expect(arg.end).toEqualDate('2017-02-19')
        expect(arg.timeZone).toBe('America/Chicago')
        callback([])
      },
    })

    expect(requestCnt).toBe(1)
    currentCalendar.refetchResources()
    expect(requestCnt).toBe(2)
  })

  describe('when calling a JSON feed', () => {
    beforeEach(() => {
      XHRMock.setup()
    })

    afterEach(() => {
      XHRMock.teardown()
    })

    it('receives the start/end/timezone GET parameters', (done) => {
      XHRMock.get(/^my-feed\.php/, (req, res) => {
        expect(req.url().query).toEqual({
          start: '2017-02-12T00:00:00',
          end: '2017-02-19T00:00:00',
          timeZone: 'America/Chicago',
        })
        done()
        return res.status(200).header('content-type', 'application/json').body('[]')
      })

      initCalendar({
        initialView: 'resourceTimelineWeek',
        now: '2017-02-12',
        timeZone: 'America/Chicago',
        resources: 'my-feed.php', // will be picked up by XHRMock
      })
    })

    it('respects startParam/endParam/timeZoneParam', (done) => {
      XHRMock.get(/^my-feed\.php/, (req, res) => {
        expect(req.url().query).toEqual({
          mystart: '2017-02-12T00:00:00',
          myend: '2017-02-19T00:00:00',
          mytimezone: 'America/Chicago',
        })
        done()
        return res.status(200).header('content-type', 'application/json').body('[]')
      })

      initCalendar({
        initialView: 'resourceTimelineWeek',
        now: '2017-02-12',
        timeZone: 'America/Chicago',
        resources: 'my-feed.php', // will be picked up by XHRMock
        startParam: 'mystart',
        endParam: 'myend',
        timeZoneParam: 'mytimezone',
      })
    })

    it('won\'t send start/end/timezone params when off', (done) => {
      XHRMock.get(/^my-feed\.php/, (req, res) => {
        expect(req.url().query).toEqual({}) // no params
        done()
        return res.status(200).header('content-type', 'application/json').body('[]')
      })

      initCalendar({
        initialView: 'resourceTimelineWeek',
        now: '2017-02-12',
        timeZone: 'America/Chicago',
        resources: 'my-feed.php', // will be picked up by XHRMock
        refetchResourcesOnNavigate: false,
      })
    })
  })

  function extractTitles(a) {
    return a.map((item) => item.text)
  }
})
