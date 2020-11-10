import { CalendarWrapper } from 'fullcalendar-tests/src/lib/wrappers/CalendarWrapper'
import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'

describe('resourcesInitiallyExpanded', () => {
  pushOptions({
    initialView: 'resourceTimelineDay',
    initialDate: '2017-10-10',
    scrollTime: '09:00',
    resources: [
      { id: 'a',
        title: 'Resource A',
        children: [
          { id: 'a1', title: 'Resource A1' },
          { id: 'a2', title: 'Resource A2' },
        ] },
    ],
  })

  describe('when enabled', () => {
    pushOptions({
      resourcesInitiallyExpanded: true,
    })

    it('renders resources expanded', () => {
      let calendar = initCalendar()
      let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid
      expect(timelineGridWrapper.getResourceIds()).toEqual(['a', 'a1', 'a2'])
    })
  })

  describe('when disabled', () => {
    pushOptions({
      resourcesInitiallyExpanded: false,
    })

    it('renders child resources contracted', () => {
      let calendar = initCalendar()
      let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid
      expect(timelineGridWrapper.getResourceIds()).toEqual(['a'])
    })

    it('renders background events when expanded', (done) => {
      let calendar = initCalendar({
        events: [
          { resourceId: 'a1',
            title: 'event1',
            className: 'event1',
            display: 'background',
            start: '2017-10-10T10:00:00' },
        ],
      })
      let dataGridWrapper = new ResourceTimelineViewWrapper(calendar).dataGrid

      let $eventEl = $('.event1')
      expect($eventEl.length).toBe(0)

      dataGridWrapper.clickFirstExpander()
      setTimeout(() => {
        $eventEl = $('.event1')
        expect($eventEl.length).toBe(1)
        expect($eventEl).toHaveClass(CalendarWrapper.BG_EVENT_CLASSNAME)
        done()
      })
    })

    describe('with foreground events', () => {
      pushOptions({
        events: [
          { resourceId: 'a1',
            title: 'event1',
            className: 'event1',
            start: '2017-10-10T08:00:00',
            end: '2017-10-10T12:00:00' },
        ],
      })

      it('renders when expanded', (done) => {
        let calendar = initCalendar()
        let dataGridWrapper = new ResourceTimelineViewWrapper(calendar).dataGrid

        expect($('.event1').length).toBe(0)

        dataGridWrapper.clickFirstExpander()
        setTimeout(() => {
          expect($('.event1').length).toBe(1)
          done()
        })
      })
    })

    describe('with row grouping', () => {
      pushOptions({
        resourceGroupField: 'customField',
        resources: [
          { title: 'a', id: 'a', customField: 1 },
        ],
      })

      it('initializes with groups contracted', () => {
        let calendar = initCalendar()
        let timelineGridWrapper = new ResourceTimelineViewWrapper(calendar).timelineGrid
        expect(timelineGridWrapper.getResourceIds().length).toBe(0)
        expect(timelineGridWrapper.getHGroupCnt()).toBe(1)
      })
    })
  })
})
