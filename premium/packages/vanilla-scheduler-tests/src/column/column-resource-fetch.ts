import { CalendarWrapper } from '@fullcalendar-tests/standard/lib/wrappers/CalendarWrapper'

describe('vresource resource refetching', () => {
  const initialDate = '2023-09-20'
  const events = [
    { start: initialDate, title: 'event', allDay: true, resourceId: 'a' },
  ]
  const resources = [
    { id: 'a', title: 'Auditorium A' },
    { id: 'b', title: 'Auditorium B' },
    { id: 'c', title: 'Auditorium C' },
  ]

  pushOptions({
    initialDate,
    initialView: 'resourceTimeGridDay',
    events,
    editable: true,
  })

  // https://github.com/fullcalendar/fullcalendar/issues/7365
  it('leaves all-day resources interactable', (done) => {
    let eventClickCnt = 0

    let calendar = initCalendar({
      // resources,
      resources(fetchInfo, successCallback) {
        setTimeout(() => {
          successCallback(resources)
        }, 100)
      },
      eventClick() {
        eventClickCnt++
      },
    })

    setTimeout(() => {
      let eventEl = new CalendarWrapper(calendar).getEventEls()[0]
      $(eventEl).simulate('click')
      setTimeout(() => {
        expect(eventClickCnt).toBe(1)
        done()
      }, 0)
    }, 200)
  })
})
