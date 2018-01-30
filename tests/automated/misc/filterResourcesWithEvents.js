import { getHeadResourceIds } from '../lib/column'
import { getTimelineResourceIds } from '../lib/timeline'

describe('filterResourcesWithEvents', function() {
  pushOptions({
    now: '2016-12-04',
    scrollTime: '00:00',
    filterResourcesWithEvents: true
  })


  function getResourceArray() {
    return [
      { id: 'a', title: 'resource a' },
      { id: 'b', title: 'resource b' },
      { id: 'c', title: 'resource c' },
      { id: 'd', title: 'resource d' }
    ]
  }

  function getResourceFunc(timeout) {
    if (timeout == null) {
      timeout = 100
    }
    return function(callback) {
      setTimeout(function() {
        callback(getResourceArray())
      }, timeout)
    }
  }


  describeValues({
    'when timeline view': { view: 'timelineDay', getResourceIds: getTimelineResourceIds },
    'when agenda view': { view: 'agendaDay', getResourceIds: getHeadResourceIds }
  }, function(settings) {
    pushOptions({
      defaultView: settings.view
    })


    it('whitelists with immediately fetched events', function() {
      initCalendar({
        resources: getResourceArray(),
        events: [
          { title: 'event 1', start: '2016-12-04T01:00:00', resourceId: 'b' },
          { title: 'event 2', start: '2016-12-04T02:00:00', resourceId: 'd' }
        ]
      })

      expect(settings.getResourceIds()).toEqual([ 'b', 'd' ])
      expect($('.fc-event').length).toBe(2)
    })


    it('whitelists with async-fetched events', function(done) {
      initCalendar({
        resources: getResourceFunc(),
        events: [
          { title: 'event 1', start: '2016-12-04T01:00:00', resourceId: 'b' },
          { title: 'event 2', start: '2016-12-04T02:00:00', resourceId: 'd' }
        ],
        eventAfterAllRender() {
          expect(settings.getResourceIds()).toEqual([ 'b', 'd' ])
          expect($('.fc-event').length).toBe(2)
          done()
        }
      })

      // no resources/events initially
      expect(settings.getResourceIds()).toEqual([ ])
      expect($('.fc-event').length).toBe(0)
    })
  })


  describe('when timeline view', function() {
    pushOptions({
      defaultView: 'timelineDay'
    })


    it('adjusts when given new events', function() {
      initCalendar({
        resources: getResourceArray(),
        events: [
          { title: 'event 1', start: '2016-12-04T01:00:00', resourceId: 'b' }
        ]
      })
      expect(getTimelineResourceIds()).toEqual([ 'b' ])
      currentCalendar.renderEvent({ title: 'event 2', start: '2016-12-04T02:00:00', resourceId: 'd' })
      expect(getTimelineResourceIds()).toEqual([ 'b', 'd' ])
    })


    it('filters addResource calls', function() {
      initCalendar({
        resources: getResourceArray(),
        events: [
          { title: 'event 1', start: '2016-12-04T01:00:00', resourceId: 'b' },
          { title: 'event 2', start: '2016-12-04T02:00:00', resourceId: 'd' }
        ]
      })
      expect(getTimelineResourceIds()).toEqual([ 'b', 'd' ])

      currentCalendar.addResource({ id: 'e', title: 'resource e' })
      expect(getTimelineResourceIds()).toEqual([ 'b', 'd' ])

      currentCalendar.renderEvent({ title: 'event 3', start: '2016-12-04T02:00:00', resourceId: 'e' })
      expect(getTimelineResourceIds()).toEqual([ 'b', 'd', 'e' ])
    })


    it('displays empty parents if children have events', function() {
      initCalendar({
        resources: [
          { id: 'a', title: 'resource a' },
          { id: 'b',
            title: 'resource b',
            children: [
              { id: 'b1', title: 'resource b1' },
              { id: 'b2', title: 'resource b2' }
            ] }
        ],
        events: [
          { title: 'event 1', start: '2016-12-04T01:00:00', resourceId: 'b2' }
        ]
      })
      expect(getTimelineResourceIds()).toEqual([ 'b', 'b2' ])
    })


    it('will filter out resources that might have events in other ranges', function() {
      initCalendar({
        defaultView: 'timelineWeek',
        defaultDate: '2017-08-09',
        resources: [
          { id: 'f', title: 'Auditorium F', eventColor: 'red' }
        ],
        events: [
          { id: '5', resourceId: 'f', start: '2017-08-06T08:00:00', end: '2017-08-06T18:00:00', title: 'event 5' }
        ]
      })
      currentCalendar.next()
      expect(getTimelineResourceIds()).toEqual([])
    })
  })
})
