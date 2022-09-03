import { doElsMatchSegs } from 'fullcalendar-tests/src/lib/segs'
import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'
import { TimelineViewWrapper } from '../lib/wrappers/TimelineViewWrapper'

describe('timeline businessHours', () => {
  pushOptions({
    initialView: 'timelineDay',
    now: '2016-02-15',
    scrollTime: '00:00',
  })

  describeOptions('direction', {
    'when LTR': 'ltr',
    'when RTL': 'rtl',
  }, () => {
    it('renders when on a day with business hours', () => {
      let calendar = initCalendar({
        businessHours: {
          startTime: '10:00',
          endTime: '16:00',
        },
        slotDuration: { hours: 1 },
      })
      let viewWrapper = new TimelineViewWrapper(calendar)
      expect10to4(viewWrapper)
    })

    it('renders all-day on a day completely outside of business hours', () => {
      let calendar = initCalendar({
        now: '2016-02-14', // weekend
        businessHours: {
          startTime: '10:00',
          endTime: '16:00',
        },
        slotDuration: { hours: 1 },
      })
      let viewWrapper = new TimelineViewWrapper(calendar)

      expect(isTimelineNonBusinessSegsRendered(viewWrapper, [
        { start: '2016-02-14T00:00', end: '2016-02-15T00:00' },
      ])).toBe(true)
    })

    it('renders once even with resources', () => {
      let calendar = initCalendar({
        initialView: 'resourceTimelineDay',
        resources: [
          { id: 'a', title: 'a' },
          { id: 'b', title: 'b' },
          { id: 'c', title: 'c' },
        ],
        businessHours: true,
      })
      let viewWrapper = new ResourceTimelineViewWrapper(calendar)
      expect9to5(viewWrapper)
    })

    it('render differently with resource override', () => {
      let calendar = initCalendar({
        initialView: 'resourceTimelineDay',
        resources: [
          { id: 'a', title: 'a' },
          { id: 'b', title: 'b', businessHours: { startTime: '02:00', endTime: '22:00' } },
          { id: 'c', title: 'c' },
        ],
        businessHours: true,
      })
      let viewWrapper = new ResourceTimelineViewWrapper(calendar)
      expectResourceOverride(viewWrapper)
    })

    it('renders full height with resource override and expandRow', () => {
      let calendar = initCalendar({
        initialView: 'resourceTimelineDay',
        expandRows: true,
        resources: [
          { id: 'a', title: 'a' },
          { id: 'b', title: 'b', businessHours: { startTime: '02:00', endTime: '22:00' } },
          { id: 'c', title: 'c' },
        ],
        businessHours: true,
      })
      let timelineGrid = new ResourceTimelineViewWrapper(calendar).timelineGrid
      let laneEls = timelineGrid.getResourceLaneEls()
      let totalLaneHeight = 0 // for calculating ave height

      for (let laneEl of laneEls) {
        totalLaneHeight += laneEl.getBoundingClientRect().height
      }

      let aveLaneHeight = totalLaneHeight / laneEls.length
      let nonBusinessEls = timelineGrid.getNonBusinessDayEls()

      for (let nonBusinessEl of nonBusinessEls) {
        expect(Math.abs(
          nonBusinessEl.getBoundingClientRect().height -
          aveLaneHeight,
        )).toBeLessThan(3)
      }
    })

    it('renders dynamically with resource override', (done) => {
      let specialResourceInput = {
        id: 'b',
        title: 'b',
        businessHours: { startTime: '02:00', endTime: '22:00' },
      }

      let calendar = initCalendar({
        initialView: 'resourceTimelineDay',
        resources: [
          { id: 'a', title: 'a' },
          specialResourceInput,
          { id: 'c', title: 'c' },
        ],
        businessHours: true,
      })
      let viewWrapper = new ResourceTimelineViewWrapper(calendar)

      expectResourceOverride(viewWrapper)
      setTimeout(() => {
        calendar.getResourceById(specialResourceInput.id).remove()
        expect9to5(viewWrapper)
        calendar.addResource(specialResourceInput)
        expectResourceOverride(viewWrapper)
        done()
      })
    })

    it('renders dynamically with resource override amidst other custom rows', (done) => {
      let calendar = initCalendar({
        initialView: 'resourceTimelineDay',
        resources: [
          {
            id: 'a',
            title: 'a',
            businessHours: { startTime: '03:00', endTime: '21:00' },
          },
        ],
        businessHours: true,
      })
      let viewWrapper = new ResourceTimelineViewWrapper(calendar)

      expect(isResourceTimelineNonBusinessSegsRendered(viewWrapper, [
        { resourceId: 'a', start: '2016-02-15T00:00', end: '2016-02-15T03:00' },
        { resourceId: 'a', start: '2016-02-15T21:00', end: '2016-02-16T00:00' },
      ])).toBe(true)

      setTimeout(() => {
        calendar.addResource({ id: 'b', title: 'b', businessHours: { startTime: '02:00', endTime: '22:00' } })
        expect(isResourceTimelineNonBusinessSegsRendered(viewWrapper, [
          { resourceId: 'a', start: '2016-02-15T00:00', end: '2016-02-15T03:00' },
          { resourceId: 'a', start: '2016-02-15T21:00', end: '2016-02-16T00:00' },
          { resourceId: 'b', start: '2016-02-15T00:00', end: '2016-02-15T02:00' },
          { resourceId: 'b', start: '2016-02-15T22:00', end: '2016-02-16T00:00' },
        ])).toBe(true)
        done()
      })
    })
  })

  // https://github.com/fullcalendar/fullcalendar-scheduler/issues/414
  it('can switch views with resource override', () => {
    let calendar = initCalendar({
      initialView: 'resourceTimelineDay',
      resources: [
        { id: 'a', title: 'a' },
        { id: 'b', title: 'b', businessHours: { startTime: '02:00', endTime: '22:00' } },
        { id: 'c', title: 'c' },
      ],
      businessHours: true,
    })
    let viewWrapper = new ResourceTimelineViewWrapper(calendar)

    expectResourceOverride(viewWrapper)
    calendar.changeView('dayGridMonth')

    calendar.changeView('resourceTimelineDay')
    expectResourceOverride(viewWrapper)
  })

  describe('when resource initially contracted', () => {
    pushOptions({
      resourcesInitiallyExpanded: false,
    })

    describe('with a business hour override', () => {
      pushOptions({
        initialView: 'resourceTimelineDay',
        resources: [
          { id: 'a',
            title: 'a',
            children: [
              { id: 'a1', title: 'a1', businessHours: { startTime: '02:00', endTime: '22:00' } },
            ] },
        ],
      })

      it('renders when expanded', (done) => {
        let calendar = initCalendar()
        let viewWrapper = new ResourceTimelineViewWrapper(calendar)

        viewWrapper.dataGrid.clickFirstExpander()

        setTimeout(() => { // wait for animation to finish
          expect(isResourceTimelineNonBusinessSegsRendered(viewWrapper, [
            { resourceId: 'a1', start: '2016-02-15T00:00', end: '2016-02-15T02:00' },
            { resourceId: 'a1', start: '2016-02-15T22:00', end: '2016-02-16T00:00' },
          ])).toBe(true)
          done()
        }, 500)
      })
    })
  })

  function expect9to5(viewWrapper) {
    expect(isTimelineNonBusinessSegsRendered(viewWrapper, [
      { start: '2016-02-15T00:00', end: '2016-02-15T09:00' },
      { start: '2016-02-15T17:00', end: '2016-02-16T00:00' },
    ])).toBe(true)
  }

  function expect10to4(viewWrapper) {
    expect(isTimelineNonBusinessSegsRendered(viewWrapper, [
      { start: '2016-02-15T00:00', end: '2016-02-15T10:00' },
      { start: '2016-02-15T16:00', end: '2016-02-16T00:00' },
    ])).toBe(true)
  }

  function expectResourceOverride(viewWrapper) {
    expect(isResourceTimelineNonBusinessSegsRendered(viewWrapper, [
      { resourceId: 'a', start: '2016-02-15T00:00', end: '2016-02-15T09:00' },
      { resourceId: 'a', start: '2016-02-15T17:00', end: '2016-02-16T00:00' },
      { resourceId: 'b', start: '2016-02-15T00:00', end: '2016-02-15T02:00' },
      { resourceId: 'b', start: '2016-02-15T22:00', end: '2016-02-16T00:00' },
      { resourceId: 'c', start: '2016-02-15T00:00', end: '2016-02-15T09:00' },
      { resourceId: 'c', start: '2016-02-15T17:00', end: '2016-02-16T00:00' },
    ])).toBe(true)
  }

  function isTimelineNonBusinessSegsRendered(viewWrapper, segs) {
    let timelineGridWrapper = viewWrapper.timelineGrid
    let baseGrid = timelineGridWrapper.base || timelineGridWrapper // :(

    return doElsMatchSegs(
      baseGrid.getNonBusinessDayEls(),
      segs,
      (seg) => baseGrid.getRect(seg.start, seg.end),
    )
  }

  function isResourceTimelineNonBusinessSegsRendered(viewWrapper, segs) {
    let resourceTimelineGridWrapper = viewWrapper.timelineGrid

    return doElsMatchSegs(
      resourceTimelineGridWrapper.getNonBusinessDayEls(),
      segs,
      (seg) => resourceTimelineGridWrapper.getRect(seg.resourceId, seg.start, seg.end), // needs resource

    )
  }
})
