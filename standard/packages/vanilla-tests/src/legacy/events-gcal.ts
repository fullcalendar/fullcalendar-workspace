import fetchMock from 'fetch-mock'
import googleCalendarPlugin from '@fullcalendar/google-calendar'
import classicThemePlugin from 'fullcalendar/themes/classic' // need both
import themeForTestsPlugin from '../lib/theme-for-tests' // "
import dayGridPlugin from 'fullcalendar/daygrid'
import { DayGridViewWrapper } from '../lib/wrappers/DayGridViewWrapper'
import { CalendarWrapper } from '../lib/wrappers/CalendarWrapper'

const API_KEY = 'test-api-key'

describe('Google Calendar plugin', () => {
  const HOLIDAY_CALENDAR_ID = 'en.usa#holiday@group.v.calendar.google.com'

  const DEFAULT_MONTH = '2025-05'
  const HOLIDAYS = [
    { id: 'mothers-day', summary: 'Mother\'s Day', date: '2025-05-11' },
    { id: 'armed-forces-day', summary: 'Armed Forces Day', date: '2025-05-17' },
    { id: 'memorial-day', summary: 'Memorial Day', date: '2025-05-26' },
  ]
  const NUM_EVENTS = HOLIDAYS.length

  // mimics the Google Calendar API's events endpoint
  beforeEach(() => {
    fetchMock.get(/^https:\/\/www\.googleapis\.com\/calendar\/v3\/calendars\//, (requestUrl) => {
      let url = new URL(requestUrl)
      let calendarId = decodeURIComponent(url.pathname.split('/')[4])

      if (url.searchParams.get('key') !== API_KEY) {
        return {
          status: 400,
          body: { error: { code: 400, message: 'API key not valid. Please pass a valid API key.' } },
        }
      }

      expect(calendarId).toBe(HOLIDAY_CALENDAR_ID)

      return {
        body: {
          items: HOLIDAYS.map((holiday) => ({
            id: holiday.id,
            summary: holiday.summary,
            start: { date: holiday.date },
            end: { date: addDay(holiday.date) },
            htmlLink: 'https://www.google.com/calendar/event?eid=' + holiday.id,
          })),
        },
      }
    })
  })

  afterEach(() => {
    fetchMock.restore()
  })

  pushOptions({
    plugins: [googleCalendarPlugin, classicThemePlugin, themeForTestsPlugin, dayGridPlugin],
    initialView: 'dayGridMonth',
    initialDate: DEFAULT_MONTH + '-01',
  })

  it('request/receives correctly when local timezone', (done) => {
    let calendar = initCalendar({
      googleCalendarApiKey: API_KEY,
      events: { googleCalendarId: HOLIDAY_CALENDAR_ID },
      timeZone: 'local',
    })

    afterEventsLoaded(calendar, () => {
      let events = calendar.getEvents()
      let i

      expect(events.length).toBe(NUM_EVENTS)
      for (i = 0; i < events.length; i += 1) {
        expect(events[i].url).not.toMatch('ctz=')
      }
      expect(lastRequestParams().has('timeZone')).toBe(false)

      done()
    })
  })

  it('request/receives correctly when UTC timezone', (done) => {
    let calendar = initCalendar({
      googleCalendarApiKey: API_KEY,
      events: { googleCalendarId: HOLIDAY_CALENDAR_ID },
      timeZone: 'UTC',
    })

    afterEventsLoaded(calendar, () => {
      let events = calendar.getEvents()
      let i

      expect(events.length).toBe(NUM_EVENTS)
      for (i = 0; i < events.length; i += 1) {
        expect(events[i].url).toMatch('ctz=UTC')
      }
      expect(lastRequestParams().get('timeZone')).toBe('UTC')

      done()
    })
  })

  it('request/receives correctly when named timezone, defaults to not editable', (done) => {
    let calendar = initCalendar({
      googleCalendarApiKey: API_KEY,
      events: { googleCalendarId: HOLIDAY_CALENDAR_ID },
      timeZone: 'America/New_York',
    })

    afterEventsLoaded(calendar, () => {
      let events = calendar.getEvents()
      let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid
      let eventEls = dayGridWrapper.getEventEls()
      let i

      expect(events.length).toBe(NUM_EVENTS)
      for (i = 0; i < events.length; i += 1) {
        expect(events[i].url).toMatch('ctz=America/New_York')
      }
      expect(lastRequestParams().get('timeZone')).toBe('America/New_York')

      expect(eventEls.length).toBe(NUM_EVENTS)
      expect($('.' + CalendarWrapper.EVENT_RESIZER_CLASSNAME, eventEls[0]).length).toBe(0) // not editable

      done()
    })
  })

  it('allows editable to explicitly be set to true', (done) => {
    let calendar = initCalendar({
      googleCalendarApiKey: API_KEY,
      events: {
        googleCalendarId: HOLIDAY_CALENDAR_ID,
        editable: true,
      },
    })

    afterEventsLoaded(calendar, () => {
      let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid
      let eventEls = dayGridWrapper.getEventEls()

      expect(eventEls.length).toBe(NUM_EVENTS)

      for (let eventEl of eventEls) {
        expect($('.' + CalendarWrapper.EVENT_RESIZER_CLASSNAME, eventEl).length).toBeGreaterThan(0) // editable!
      }

      done()
    })
  })

  it('fetches events correctly when API key is in the event source', (done) => {
    let calendar = initCalendar({
      events: {
        googleCalendarId: HOLIDAY_CALENDAR_ID,
        googleCalendarApiKey: API_KEY,
      },
    })

    afterEventsLoaded(calendar, () => {
      let events = calendar.getEvents()
      expect(events.length).toBe(NUM_EVENTS)
      done()
    })
  })

  describe('when not given an API key', () => {
    it('calls error handlers, raises warning, and receives no events', (done) => {
      let options = {
        events: {
          failure(err) {
            expect(typeof err).toBe('object')
          },
          googleCalendarId: HOLIDAY_CALENDAR_ID,
        },
        eventSourceFailure(err) {
          expect(typeof err).toBe('object')

          setTimeout(() => { // wait for potential render
            let events = this.getEvents()
            expect(events.length).toBe(0)
            expect(options.events.failure).toHaveBeenCalled()
            done()
          }, 0)
        },
      }

      spyOn(options.events, 'failure').and.callThrough()
      initCalendar(options)
    })
  })

  describe('when given a bad API key', () => {
    it('calls error handlers, raises warning, and receives no event', (done) => {
      let options = {
        googleCalendarApiKey: 'asdfasdfasdf',
        events: {
          failure(err) {
            expect(typeof err).toBe('object')
          },
          googleCalendarId: HOLIDAY_CALENDAR_ID,
        },
        eventSourceFailure(err) {
          expect(typeof err).toBe('object')

          setTimeout(() => { // wait for potential render
            let events = this.getEvents()
            expect(events.length).toBe(0)
            expect(options.events.failure).toHaveBeenCalled()
            done()
          }, 0)
        },
      }

      spyOn(options.events, 'failure').and.callThrough()
      initCalendar(options)
    })
  })

  it('calls loading with true then false', (done) => {
    let cmds = []

    initCalendar({
      googleCalendarApiKey: API_KEY,
      events: { googleCalendarId: HOLIDAY_CALENDAR_ID },
      loading(bool) {
        cmds.push(bool)

        if (cmds.length === 1) {
          expect(cmds).toEqual([true])
        } else if (cmds.length === 2) {
          expect(cmds).toEqual([true, false])
          done()
        }
      },
    })
  })

  describe('EventSource::remove', () => {
    it('works when specifying only the Google Calendar ID', (done) => {
      let called = false
      let calendar = initCalendar({
        googleCalendarApiKey: API_KEY,
        eventSources: [{ googleCalendarId: HOLIDAY_CALENDAR_ID }],
      })

      afterEventsLoaded(calendar, () => {
        let events

        if (called) { return } // only the first time
        called = true

        events = calendar.getEvents()
        expect(events.length).toBe(NUM_EVENTS)

        setTimeout(() => {
          calendar.getEventSources()[0].remove()
          events = calendar.getEvents()
          expect(events.length).toBe(0)
          done()
        }, 0)
      })
    })

    it('works when specifying a raw Google Calendar source object', (done) => {
      let googleSource = { googleCalendarId: HOLIDAY_CALENDAR_ID }
      let called = false
      let calendar = initCalendar({
        googleCalendarApiKey: API_KEY,
        eventSources: [googleSource],
      })

      afterEventsLoaded(calendar, () => {
        let events

        if (called) { return } // only the first time
        called = true

        events = calendar.getEvents()
        expect(events.length).toBe(NUM_EVENTS)

        setTimeout(() => {
          calendar.getEventSources()[0].remove()
          events = calendar.getEvents()
          expect(events.length).toBe(0)
          done()
        }, 0)
      })
    })
  })

  function lastRequestParams(): URLSearchParams {
    return new URL(fetchMock.lastUrl()).searchParams
  }

  function addDay(dateStr: string): string {
    let date = new Date(dateStr + 'T00:00:00Z')
    date.setUTCDate(date.getUTCDate() + 1)
    return date.toISOString().slice(0, 10)
  }

  function afterEventsLoaded(calendar, callback: () => void) {
    calendar.on('eventsSet', () => {
      setTimeout(callback) // because nothing is rendered yet when eventSourceSuccess fires
    })
  }
})
