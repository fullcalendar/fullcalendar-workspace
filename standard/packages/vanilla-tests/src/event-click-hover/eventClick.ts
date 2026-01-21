import { CalendarWrapper } from '../lib/wrappers/CalendarWrapper.js'

describe('eventClick', () => {
  pushOptions({
    initialDate: '2018-08-31',
    initialView: 'dayGridMonth',
  })

  it('receives correct args', (done) => {
    let calendar = initCalendar({
      events: [
        { start: '2018-08-31' },
      ],
      eventClick(data) {
        expect(data.el instanceof HTMLElement).toBe(true)
        expect(typeof data.event).toBe('object')
        expect(data.event.start instanceof Date).toBe(true)
        expect(data.jsEvent instanceof UIEvent).toBe(true)
        expect(typeof data.view).toBe('object')
        done()
      },
    })

    let eventEls = new CalendarWrapper(calendar).getEventEls()

    expect(eventEls.length).toBe(1)
    $(eventEls[0]).simulate('click')
  })

  it('fires on a background event', (done) => {
    let calendar = initCalendar({
      events: [
        { start: '2018-08-31', display: 'background' },
      ],
      eventClick(data) {
        expect(data.event.display).toBe('background')
        done()
      },
    })

    let bgEventEls = new CalendarWrapper(calendar).getBgEventEls()

    expect(bgEventEls.length).toBe(1)
    $(bgEventEls[0]).simulate('click')
  })

  it('works via touch', (done) => {
    let calendar = initCalendar({
      events: [
        { start: '2018-08-31' },
      ],
      eventClick() {
        done()
      },
    })

    let eventEls = new CalendarWrapper(calendar).getEventEls()

    expect(eventEls.length).toBe(1)
    $(eventEls[0]).simulate('click')
  })
})
