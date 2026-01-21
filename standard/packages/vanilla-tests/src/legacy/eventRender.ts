import { CalendarWrapper } from '../lib/wrappers/CalendarWrapper.js'
import { DayGridViewWrapper } from '../lib/wrappers/DayGridViewWrapper.js'

describe('eventDidMount+eventContent', () => { // TODO: rename file
  pushOptions({
    initialDate: '2014-11-12',
    scrollTime: '00:00:00',
    events: [{
      title: 'my event',
      start: '2014-11-12T09:00:00',
    }],
  })

  describeOptions('initialView', {
    'when in day-grid': 'dayGridMonth',
    'when in time-grid': 'timeGridWeek',
  }, () => {
    describe('with foreground event', () => {
      it('receives correct args AND can modify the element', () => {
        let options = {
          eventContent(data) {
            expect(typeof data.event).toBe('object')
            expect(data.event.display).toBe('auto')
            expect(data.event.start).toBeDefined()
            expect(typeof data.view).toBe('object')
            expect(data.isMirror).toBe(false)
          },
          eventDidMount(data) {
            $(data.el).css('font-size', '20px')
          },
        }
        spyOn(options, 'eventContent').and.callThrough()
        spyOn(options, 'eventDidMount').and.callThrough()

        let calendar = initCalendar(options)
        let calendarWrapper = new CalendarWrapper(calendar)
        let eventEl = calendarWrapper.getFirstEventEl()

        expect(options.eventContent).toHaveBeenCalled()
        expect(options.eventDidMount).toHaveBeenCalled()
        expect($(eventEl).css('font-size')).toBe('20px')
      })
    })
  })

  describe('when in month view', () => {
    pushOptions({
      initialView: 'dayGridMonth',
      events: [{
        title: 'my event',
        start: '2014-11-12',
      }],
    })

    describe('with a foreground event', () => {
      it('can return a new element', () => {
        let options = {
          eventContent() {
            let domNodes = $('<div class="sup" style="background-color:green">sup g</div>').get()
            return { domNodes }
          },
        }
        spyOn(options, 'eventContent').and.callThrough()

        let calendar = initCalendar(options)
        let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid
        let eventEl = dayGridWrapper.getFirstEventEl()

        expect(eventEl.querySelector('.sup')).toBeTruthy()
        expect(options.eventContent).toHaveBeenCalled()
      })
    })

    describe('with an all-day background event', () => {
      pushOptions({
        events: [{
          title: 'my event',
          start: '2014-11-12',
          display: 'background',
        }],
      })

      it('receives correct args AND can modify the element', () => {
        let options = {
          eventContent(data) {
            expect(typeof data.event).toBe('object')
            expect(data.event.display).toBe('background')
            expect(data.event.start).toBeDefined()
            expect(typeof data.view).toBe('object')
          },
          eventDidMount(data) {
            $(data.el).css('font-size', '20px')
          },
        }
        spyOn(options, 'eventContent').and.callThrough()
        spyOn(options, 'eventDidMount').and.callThrough()

        let calendar = initCalendar(options)
        let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid
        let bgEventEls = dayGridWrapper.getBgEventEls()

        expect(bgEventEls.length).toBe(1)
        expect(options.eventContent).toHaveBeenCalled()
        expect(options.eventDidMount).toHaveBeenCalled()
        expect($(bgEventEls).css('font-size')).toBe('20px')
      })
    })
  })
})
