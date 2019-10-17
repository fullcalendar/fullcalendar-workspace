import { doElsMatchSegs } from 'package-tests/lib/segs'
import { getResourceTimelineRect, getTimelineRect } from '../lib/timeline'

describe('timeline businessHours', function() {
  pushOptions({
    defaultView: 'timelineDay',
    now: '2016-02-15',
    scrollTime: '00:00'
  })

  describeOptions('dir', {
    'when LTR': 'ltr',
    'when RTL': 'rtl'
  }, function() {

    it('renders when on a day with business hours', function(done) {
      initCalendar({
        businessHours: {
          startTime: '10:00',
          endTime: '16:00'
        },
        slotDuration: { hours: 1 },
        datesRender() {
          expect10to4()
          done()
        }
      })
    })

    it('renders all-day on a day completely outside of business hours', function(done) {
      initCalendar({
        now: '2016-02-14', // weekend
        businessHours: {
          startTime: '10:00',
          endTime: '16:00'
        },
        slotDuration: { hours: 1 },
        datesRender() {
          expect(isTimelineNonBusinessSegsRendered([
            { start: '2016-02-14T00:00', end: '2016-02-15T00:00' }
          ])).toBe(true)
          done()
        }
      })
    })

    it('renders once even with resources', function(done) {
      initCalendar({
        defaultView: 'resourceTimelineDay',
        resources: [
          { id: 'a', title: 'a' },
          { id: 'b', title: 'b' },
          { id: 'c', title: 'c' }
        ],
        businessHours: true,
        datesRender() {
          expect9to5()
          done()
        }
      })
    })

    it('render differently with resource override', function(done) {
      initCalendar({
        defaultView: 'resourceTimelineDay',
        resources: [
          { id: 'a', title: 'a' },
          { id: 'b', title: 'b', businessHours: { startTime: '02:00', endTime: '22:00' } },
          { id: 'c', title: 'c' }
        ],
        businessHours: true,
        datesRender() {
          expectResourceOverride()
          done()
        }
      })
    })

    it('renders dynamically with resource override', function(done) {
      let specialResourceInput = {
        id: 'b',
        title: 'b',
        businessHours: { startTime: '02:00', endTime: '22:00' }
      }

      initCalendar({
        defaultView: 'resourceTimelineDay',
        resources: [
          { id: 'a', title: 'a' },
          specialResourceInput,
          { id: 'c', title: 'c' }
        ],
        businessHours: true,
        datesRender() {
          expectResourceOverride()
          setTimeout(function() {
            currentCalendar.getResourceById(specialResourceInput.id).remove()
            expect9to5()
            currentCalendar.addResource(specialResourceInput)
            expectResourceOverride()
            done()
          })
        }
      })
    })

    it('renders dynamically with resource override amidst other custom rows', function(done) {
      initCalendar({
        defaultView: 'resourceTimelineDay',
        resources: [
          {
            id: 'a',
            title: 'a',
            businessHours: { startTime: '03:00', endTime: '21:00' }
          }
        ],
        businessHours: true,
        datesRender() {
          expect(isResourceTimelineNonBusinessSegsRendered([
            { resourceId: 'a', start: '2016-02-15T00:00', end: '2016-02-15T03:00' },
            { resourceId: 'a', start: '2016-02-15T21:00', end: '2016-02-16T00:00' }
          ])).toBe(true)
          setTimeout(function() {
            currentCalendar.addResource({ id: 'b', title: 'b', businessHours: { startTime: '02:00', endTime: '22:00' } })
            expect(isResourceTimelineNonBusinessSegsRendered([
              { resourceId: 'a', start: '2016-02-15T00:00', end: '2016-02-15T03:00' },
              { resourceId: 'a', start: '2016-02-15T21:00', end: '2016-02-16T00:00' },
              { resourceId: 'b', start: '2016-02-15T00:00', end: '2016-02-15T02:00' },
              { resourceId: 'b', start: '2016-02-15T22:00', end: '2016-02-16T00:00' }
            ])).toBe(true)
            done()
          })
        }
      })
    })
  })

  // https://github.com/fullcalendar/fullcalendar-scheduler/issues/414
  it('can switch views with resource override', function(done) {
    let datesRenderCnt = 0
    initCalendar({
      defaultView: 'resourceTimelineDay',
      resources: [
        { id: 'a', title: 'a' },
        { id: 'b', title: 'b', businessHours: { startTime: '02:00', endTime: '22:00' } },
        { id: 'c', title: 'c' }
      ],
      businessHours: true,
      datesRender() {
        datesRenderCnt++
        if (datesRenderCnt === 1) {
          expectResourceOverride()
          currentCalendar.changeView('dayGridMonth')
        } else if (datesRenderCnt === 2) {
          currentCalendar.changeView('resourceTimelineDay')
        } else if (datesRenderCnt === 3) {
          expectResourceOverride()
          done()
        }
      }
    })
  })

  describe('when resource initially contracted', function() {
    pushOptions({
      resourcesInitiallyExpanded: false
    })

    describe('with a business hour override', function() {
      pushOptions({
        defaultView: 'resourceTimelineDay',
        resources: [
          { id: 'a',
            title: 'a',
            children: [
              { id: 'a1', title: 'a1', businessHours: { startTime: '02:00', endTime: '22:00' } }
            ] }
        ]
      })

      it('renders when expanded', function(done) {
        initCalendar()
        clickExpander()
        setTimeout(function() { // wait for animation to finish
          expect(isResourceTimelineNonBusinessSegsRendered([
            { resourceId: 'a1', start: '2016-02-15T00:00', end: '2016-02-15T02:00' },
            { resourceId: 'a1', start: '2016-02-15T22:00', end: '2016-02-16T00:00' }
          ])).toBe(true)
          done()
        }, 500)
      })
    })
  })

  function clickExpander() {
    return $('.fc-expander').simulate('click')
  }

  function expect9to5() {
    expect(isTimelineNonBusinessSegsRendered([
      { start: '2016-02-15T00:00', end: '2016-02-15T09:00' },
      { start: '2016-02-15T17:00', end: '2016-02-16T00:00' }
    ])).toBe(true)
  }

  function expect10to4() {
    expect(isTimelineNonBusinessSegsRendered([
      { start: '2016-02-15T00:00', end: '2016-02-15T10:00' },
      { start: '2016-02-15T16:00', end: '2016-02-16T00:00' }
    ])).toBe(true)
  }

  function expectResourceOverride() {
    expect(isResourceTimelineNonBusinessSegsRendered([
      { resourceId: 'a', start: '2016-02-15T00:00', end: '2016-02-15T09:00' },
      { resourceId: 'a', start: '2016-02-15T17:00', end: '2016-02-16T00:00' },
      { resourceId: 'b', start: '2016-02-15T00:00', end: '2016-02-15T02:00' },
      { resourceId: 'b', start: '2016-02-15T22:00', end: '2016-02-16T00:00' },
      { resourceId: 'c', start: '2016-02-15T00:00', end: '2016-02-15T09:00' },
      { resourceId: 'c', start: '2016-02-15T17:00', end: '2016-02-16T00:00' }
    ])).toBe(true)
  }

  function isTimelineNonBusinessSegsRendered(segs) {
    return doElsMatchSegs($('.fc-timeline .fc-nonbusiness'), segs, getTimelineRect)
  }

  function isResourceTimelineNonBusinessSegsRendered(segs) {
    return doElsMatchSegs($('.fc-timeline .fc-nonbusiness'), segs, getResourceTimelineRect)
  }
})
