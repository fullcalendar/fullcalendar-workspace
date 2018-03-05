import { doElsMatchSegs } from 'fullcalendar/tests/automated/lib/segs'
import { getResourceTimelineRect, getTimelineRect } from '../lib/timeline'

describe('timeline businessHours', function() {
  pushOptions({
    defaultView: 'timelineDay',
    now: '2016-02-15',
    scrollTime: '00:00'
  })

  describeOptions('isRTL', {
    'when LTR': false,
    'when RTL': true
  }, function() {

    it('renders when on a day with business hours', function(done) {
      initCalendar({
        businessHours: {
          start: '10:00',
          end: '16:00'
        },
        slotDuration: { hours: 1 },
        viewRender() {
          expect10to4()
          done()
        }
      })
    })

    it('renders all-day on a day completely outside of business hours', function(done) {
      initCalendar({
        now: '2016-02-14', // weekend
        businessHours: {
          start: '10:00',
          end: '16:00'
        },
        slotDuration: { hours: 1 },
        viewRender() {
          expect(isTimelineNonBusinessSegsRendered([
            { start: '2016-02-14T00:00', end: '2016-02-15T00:00' }
          ])).toBe(true)
          done()
        }
      })
    })

    it('renders once even with resources', function(done) {
      initCalendar({
        resources: [
          { id: 'a', title: 'a' },
          { id: 'b', title: 'b' },
          { id: 'c', title: 'c' }
        ],
        businessHours: true,
        viewRender() {
          expect9to5()
          done()
        }
      })
    })

    it('render differently with resource override', function(done) {
      initCalendar({
        resources: [
          { id: 'a', title: 'a' },
          { id: 'b', title: 'b', businessHours: { start: '02:00', end: '22:00' } },
          { id: 'c', title: 'c' }
        ],
        businessHours: true,
        viewRender() {
          expectResourceOverride()
          done()
        }
      })
    })

    it('renders dynamically with resource override', function(done) {
      const specialResource = { id: 'b', title: 'b', businessHours: { start: '02:00', end: '22:00' } }
      initCalendar({
        resources: [
          { id: 'a', title: 'a' },
          specialResource,
          { id: 'c', title: 'c' }
        ],
        businessHours: true,
        viewRender() {
          expectResourceOverride()
          setTimeout(function() {
            currentCalendar.removeResource(specialResource)
            expect9to5()
            currentCalendar.addResource(specialResource)
            expectResourceOverride()
            done()
          })
        }
      })
    })

    it('renders dynamically with resource override amidst other custom rows', function(done) {
      initCalendar({
        resources: [
          { id: 'a', title: 'a', businessHours: { start: '03:00', end: '21:00' } }
        ],
        businessHours: true,
        viewRender() {
          expect(isResourceTimelineNonBusinessSegsRendered([
            { resourceId: 'a', start: '2016-02-15T00:00', end: '2016-02-15T03:00' },
            { resourceId: 'a', start: '2016-02-15T21:00', end: '2016-02-16T00:00' }
          ])).toBe(true)
          setTimeout(function() {
            currentCalendar.addResource({ id: 'b', title: 'b', businessHours: { start: '02:00', end: '22:00' } })
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
    let viewRenderCnt = 0
    initCalendar({
      resources: [
        { id: 'a', title: 'a' },
        { id: 'b', title: 'b', businessHours: { start: '02:00', end: '22:00' } },
        { id: 'c', title: 'c' }
      ],
      businessHours: true,
      viewRender() {
        viewRenderCnt++
        if (viewRenderCnt === 1) {
          expectResourceOverride()
          currentCalendar.changeView('month')
        } else if (viewRenderCnt === 2) {
          currentCalendar.changeView('timelineDay')
        } else if (viewRenderCnt === 3) {
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
        resources: [
          { id: 'a',
            title: 'a',
            children: [
              { id: 'a1', title: 'a1', businessHours: { start: '02:00', end: '22:00' } }
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
