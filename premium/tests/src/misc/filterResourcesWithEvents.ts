import { CalendarWrapper } from 'fullcalendar-tests/src/lib/wrappers/CalendarWrapper'
import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'
import { ResourceTimeGridViewWrapper } from '../lib/wrappers/ResourceTimeGridViewWrapper'

describe('filterResourcesWithEvents', () => {
  pushOptions({
    now: '2016-12-04',
    scrollTime: '00:00',
    filterResourcesWithEvents: true,
  })

  function getResourceArray() {
    return [
      { id: 'a', title: 'resource a' },
      { id: 'b', title: 'resource b' },
      { id: 'c', title: 'resource c' },
      { id: 'd', title: 'resource d' },
    ]
  }

  function getResourceFunc(timeout) {
    return (arg, callback) => {
      setTimeout(() => {
        callback(getResourceArray())
      }, timeout)
    }
  }

  describeValues({
    'when timeline view': {
      view: 'resourceTimelineDay',
      getResourceIds: (calendar) => new ResourceTimelineViewWrapper(calendar).dataGrid.getResourceIds(),
    },
    'when timeGrid view': {
      view: 'resourceTimeGridDay',
      getResourceIds: (calendar) => new ResourceTimeGridViewWrapper(calendar).header.getResourceIds(),
    },
  }, (settings) => {
    pushOptions({
      initialView: settings.view,
    })

    it('whitelists with immediately fetched events', () => {
      let calendar = initCalendar({
        resources: getResourceArray(),
        events: [
          { title: 'event 1', start: '2016-12-04T01:00:00', resourceId: 'b' },
          { title: 'event 2', start: '2016-12-04T02:00:00', resourceId: 'd' },
        ],
      })
      let calendarWrapper = new CalendarWrapper(calendar)

      expect(settings.getResourceIds(calendar)).toEqual(['b', 'd'])
      expect(calendarWrapper.getEventEls().length).toBe(2)
    })

    it('whitelists with async-fetched events', (done) => {
      let calendar = initCalendar({
        resources: getResourceFunc(100),
        events: [
          { title: 'event 1', start: '2016-12-04T01:00:00', resourceId: 'b' },
          { title: 'event 2', start: '2016-12-04T02:00:00', resourceId: 'd' },
        ],
      })
      let calendarWrapper = new CalendarWrapper(calendar)

      // no resources/events initially
      expect(settings.getResourceIds(calendar)).toEqual([])
      expect(calendarWrapper.getEventEls().length).toBe(0)

      setTimeout(() => {
        expect(settings.getResourceIds(calendar)).toEqual(['b', 'd'])
        expect(calendarWrapper.getEventEls().length).toBe(2)
        done()
      }, 101)
    })
  })

  describe('when timeline view', () => {
    pushOptions({
      initialView: 'resourceTimelineDay',
    })

    it('adjusts when given new events', () => {
      let calendar = initCalendar({
        resources: getResourceArray(),
        events: [
          { title: 'event 1', start: '2016-12-04T01:00:00', resourceId: 'b' },
        ],
      })
      let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid

      expect(timelineGridWrapper.getResourceIds()).toEqual(['b'])
      currentCalendar.addEvent({ title: 'event 2', start: '2016-12-04T02:00:00', resourceId: 'd' })
      expect(timelineGridWrapper.getResourceIds()).toEqual(['b', 'd'])
    })

    it('filters addResource calls', () => {
      let calendar = initCalendar({
        resources: getResourceArray(),
        events: [
          { title: 'event 1', start: '2016-12-04T01:00:00', resourceId: 'b' },
          { title: 'event 2', start: '2016-12-04T02:00:00', resourceId: 'd' },
        ],
      })
      let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid

      expect(timelineGridWrapper.getResourceIds()).toEqual(['b', 'd'])

      currentCalendar.addResource({ id: 'e', title: 'resource e' })
      expect(timelineGridWrapper.getResourceIds()).toEqual(['b', 'd'])

      currentCalendar.addEvent({ title: 'event 3', start: '2016-12-04T02:00:00', resourceId: 'e' })
      expect(timelineGridWrapper.getResourceIds()).toEqual(['b', 'd', 'e'])
    })

    it('displays empty parents if children have events', () => {
      let calendar = initCalendar({
        resources: [
          { id: 'a', title: 'resource a' },
          { id: 'b',
            title: 'resource b',
            children: [
              { id: 'b1', title: 'resource b1' },
              { id: 'b2', title: 'resource b2' },
            ] },
        ],
        events: [
          { title: 'event 1', start: '2016-12-04T01:00:00', resourceId: 'b2' },
        ],
      })
      let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid

      expect(timelineGridWrapper.getResourceIds()).toEqual(['b', 'b2'])
    })

    it('will filter out resources that might have events in other ranges', () => {
      let calendar = initCalendar({
        initialView: 'resourceTimelineWeek',
        initialDate: '2017-08-09',
        resources: [
          { id: 'f', title: 'Auditorium F', eventColor: 'red' },
        ],
        events: [
          { id: '5', resourceId: 'f', start: '2017-08-06T08:00:00', end: '2017-08-06T18:00:00', title: 'event 5' },
        ],
      })
      let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid

      currentCalendar.next()
      expect(timelineGridWrapper.getResourceIds()).toEqual([])
    })
  })
})
