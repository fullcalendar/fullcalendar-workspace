import { doElsMatchSegs } from 'standard-tests/src/lib/segs'
import ResourceTimelineViewWrapper from '../lib/wrappers/ResourceTimelineViewWrapper'
import TimelineViewWrapper from '../lib/wrappers/TimelineViewWrapper'

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

    it('renders when on a day with business hours', function() {
      initCalendar({
        businessHours: {
          startTime: '10:00',
          endTime: '16:00'
        },
        slotDuration: { hours: 1 }
      })
      expect10to4()
    })

    it('renders all-day on a day completely outside of business hours', function() {
      initCalendar({
        now: '2016-02-14', // weekend
        businessHours: {
          startTime: '10:00',
          endTime: '16:00'
        },
        slotDuration: { hours: 1 }
      })

      expect(isTimelineNonBusinessSegsRendered([
        { start: '2016-02-14T00:00', end: '2016-02-15T00:00' }
      ])).toBe(true)
    })

    it('renders once even with resources', function() {
      initCalendar({
        defaultView: 'resourceTimelineDay',
        resources: [
          { id: 'a', title: 'a' },
          { id: 'b', title: 'b' },
          { id: 'c', title: 'c' }
        ],
        businessHours: true
      })

      expect9to5()
    })

    it('render differently with resource override', function() {
      initCalendar({
        defaultView: 'resourceTimelineDay',
        resources: [
          { id: 'a', title: 'a' },
          { id: 'b', title: 'b', businessHours: { startTime: '02:00', endTime: '22:00' } },
          { id: 'c', title: 'c' }
        ],
        businessHours: true,
      })

      expectResourceOverride()
    })

    it('renders dynamically with resource override', function() {
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
        businessHours: true
      })

      expectResourceOverride()
      setTimeout(function() {
        currentCalendar.getResourceById(specialResourceInput.id).remove()
        expect9to5()
        currentCalendar.addResource(specialResourceInput)
        expectResourceOverride()
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
        businessHours: true
      })

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
        let calendar = initCalendar()
        let viewModel = new ResourceTimelineViewWrapper(calendar)

        viewModel.dataGrid.clickFirstExpander()

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
    let timelineGridWrapper = new TimelineViewWrapper(currentCalendar).timelineGrid

    return doElsMatchSegs(
      timelineGridWrapper.getNonBusinessDayEls(),
      segs,
      (seg) => {
        return timelineGridWrapper.getRect(seg.start, seg.end)
      }
    )
  }


  function isResourceTimelineNonBusinessSegsRendered(segs) {
    let timelineGridWrapper = new ResourceTimelineViewWrapper(currentCalendar).timelineGrid

    return doElsMatchSegs(
      timelineGridWrapper.getNonBusinessDayEls(),
      segs,
      (seg) => {
        return timelineGridWrapper.getRect(seg.resourceId, seg.start, seg.end)
      }
    )
  }

})
