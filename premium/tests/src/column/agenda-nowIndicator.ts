import { ResourceTimeGridViewWrapper } from '../lib/wrappers/ResourceTimeGridViewWrapper.js'

describe('resource timeGrid now-indicator', () => {
  pushOptions({
    now: '2015-12-26T02:30:00',
    scrollTime: '00:00',
    views: {
      resourceTimeGridThreeDay: {
        type: 'resourceTimeGrid',
        duration: { days: 3 },
      },
    },
  })

  it('renders once for each resource', () => {
    let calendar = initCalendar({
      initialView: 'resourceTimeGridThreeDay',
      nowIndicator: true,
      resources: [
        { id: 'a', title: 'Resource A' },
        { id: 'b', title: 'Resource B' },
      ],
    })

    let timeGridWrapper = new ResourceTimeGridViewWrapper(calendar).timeGrid
    expect(timeGridWrapper.hasNowIndicator()).toBe(true)
  })

  // big compound test
  // https://github.com/fullcalendar/fullcalendar/issues/3918
  it('plays nice with refetchResourcesOnNavigate and view switching', (done) => {
    initCalendar({
      initialView: 'resourceTimeGridWeek',
      initialDate: '2016-11-04',
      now: '2016-12-04T10:00',
      scrollTime: '09:00',
      nowIndicator: true,
      refetchResourcesOnNavigate: true,
      resources(arg, callback) {
        setTimeout(() => {
          callback([
            { title: 'resource a', id: 'a' },
            { title: 'resource b', id: 'b' },
          ])
        }, 10)
      },
      events(arg, callback) {
        setTimeout(() => {
          callback([
            { title: 'event1', start: '2016-12-04T01:00:00', resourceId: 'a' },
            { title: 'event2', start: '2016-12-04T02:00:00', resourceId: 'b' },
            { title: 'event3', start: '2016-12-05T03:00:00', resourceId: 'a' },
          ])
        }, 10)
      },
    })

    setTimeout(() => {
      currentCalendar.changeView('resourceTimeGridDay')

      setTimeout(() => {
        currentCalendar.today()

        setTimeout(() => {
          currentCalendar.changeView('resourceTimeGridWeek')

          setTimeout(() => {
            currentCalendar.changeView('resourceTimeGridDay')

            setTimeout(done, 100)
          }, 100)
        }, 100)
      }, 100)
    }, 100)
  })
})
