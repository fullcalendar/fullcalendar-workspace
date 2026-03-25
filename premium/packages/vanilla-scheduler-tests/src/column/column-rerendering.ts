import { ResourceTimeGridViewWrapper } from '../lib/wrappers/ResourceTimeGridViewWrapper'
import { ResourceDayGridViewWrapper } from '../lib/wrappers/ResourceDayGridViewWrapper'

describe('column-based view rerendering', () => {
  pushOptions({
    now: '2015-08-07',
    scrollTime: '00:00',
    initialView: 'resourceTimeGridDay',
  })

  const STOCK_RESOURCES = [
    { id: 'a', title: 'Auditorium A' },
    { id: 'b', title: 'Auditorium B' },
    { id: 'c', title: 'Auditorium C' },
  ]

  const STOCK_EVENTS = [
    { id: '1', resourceId: 'b', start: '2015-08-07T02:00:00', end: '2015-08-07T07:00:00', title: 'event 1' },
    { id: '2', resourceId: 'c', start: '2015-08-07T05:00:00', end: '2015-08-07T22:00:00', title: 'event 2' },
    { id: '3', resourceId: 'd', start: '2015-08-06', end: '2015-08-08', title: 'event 3' },
  ]

  describe('resource, when rerendering', () => {
    it('maintains scroll', (done) => {
      let calendar = initCalendar({
        now: '2015-08-07',
        scrollTime: '00:00',
        initialView: 'resourceTimeGridDay',
        resources(arg, callback) {
          setTimeout(() => {
            callback(STOCK_EVENTS)
          }, 100)
        },
        events(arg, callback) {
          setTimeout(() => {
            callback(STOCK_RESOURCES)
          }, 100)
        },
      })

      setTimeout(() => {
        let viewWrapper = new ResourceTimeGridViewWrapper(calendar)
        let scrollEl = viewWrapper.getScrollEl()
        scrollEl.scrollTop = 100

        calendar.render() // rerender!
        expect(scrollEl.scrollTop).toBe(100)
        done()
      }, 101)
    })
  })

  describe('resource, when using refetchEvents', () => {
    it('maintains scroll', (done) => {
      let calendar = initCalendar({
        now: '2015-08-07',
        scrollTime: '00:00',
        initialView: 'resourceTimeGridDay',
        resources(arg, callback) {
          setTimeout(() => {
            callback(STOCK_RESOURCES)
          }, 100)
        },
        events(arg, callback) {
          setTimeout(() => {
            callback(STOCK_EVENTS)
          }, 100)
        },
      })

      setTimeout(() => {
        let viewWrapper = new ResourceTimeGridViewWrapper(calendar)
        let scrollEl = viewWrapper.getScrollEl()
        scrollEl.scrollTop = 100

        calendar.refetchEvents()
        setTimeout(() => {
          expect(scrollEl.scrollTop).toBe(100)
          done()
        }, 101)
      }, 101)
    })
  })

  describe('when using refetchResources', () => {
    it('rerenders the DOM', (done) => {
      let fetchCalls = 0
      let calendar = initCalendar({
        now: '2015-08-07',
        scrollTime: '00:00',
        initialView: 'resourceTimeGridDay',
        resources(arg, callback) {
          setTimeout(() => {
            let id = fetchCalls
            fetchCalls += 1
            callback([
              { id: 'a', title: `Auditorium A${id}` },
              { id: 'b', title: 'Auditorium B' },
              { id: 'c', title: 'Auditorium C' },
            ])
          }, 100)
        },
        events(arg, callback) {
          setTimeout(() => {
            callback([
              { id: '1', resourceId: 'b', start: '2015-08-07T02:00:00', end: '2015-08-07T07:00:00', title: 'event 1' },
              { id: '2', resourceId: 'c', start: '2015-08-07T05:00:00', end: '2015-08-07T22:00:00', title: 'event 2' },
              { id: '3', resourceId: 'd', start: '2015-08-06', end: '2015-08-08', title: 'event 3' },
            ])
          }, 100)
        },
      })

      setTimeout(() => {
        let headerWrapper = new ResourceTimeGridViewWrapper(calendar).header
        expect(headerWrapper.getResourceInfo()[0].text).toBe('Auditorium A0')

        calendar.refetchResources()
        setTimeout(() => {
          expect(headerWrapper.getResourceInfo()[0].text).toBe('Auditorium A1')
          done()
        }, 101)
      }, 101)
    })
  })

  describeOptions('initialView', {
    'when timeGrid': 'resourceTimeGridDay',
    'when dayGrid': 'resourceDayGridDay',
  }, (viewName) => {
    let ViewWrapper = viewName.match(/^resourceDayGrid/) ? ResourceDayGridViewWrapper : ResourceTimeGridViewWrapper

    pushOptions({
      resources: STOCK_RESOURCES,
    })

    it('adjusts to Resource::remove', () => {
      let calendar = initCalendar()
      let headerWrapper = new ViewWrapper(calendar).header

      expect(headerWrapper.getResourceIds()).toEqual(['a', 'b', 'c'])

      calendar.getResourceById('a').remove()
      expect(headerWrapper.getResourceIds()).toEqual(['b', 'c'])
    })

    it('adjusts to addResource', () => {
      let calendar = initCalendar()
      let headerWrapper = new ViewWrapper(calendar).header

      expect(headerWrapper.getResourceIds()).toEqual(['a', 'b', 'c'])

      calendar.addResource({
        id: 'd',
        title: 'Auditorium D',
      })
      expect(headerWrapper.getResourceIds()).toEqual(['a', 'b', 'c', 'd'])
    })
  })
})
