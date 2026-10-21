import { DateProfileGenerator, addDays } from 'fullcalendar/protected-api'
import { TimeGridViewWrapper } from '../lib/wrappers/TimeGridViewWrapper'
import { DEFAULT_PLUGINS } from '../lib/global-plugins'

/*
Rendered behavior locks for phase 10 (planning/phase-10-date-profile.md, step 0): datesSet's calls over a
navigation sequence, a custom dateProfileGeneratorClass's overrides (each step it overrides observed where
it's used, with the receiver), and the generator's identity
*/
describe('date profile rendered locks', () => {
  pushOptions({
    timeZone: 'UTC',
    initialDate: '2024-03-08',
    now: '2024-03-08T10:00:00',
  })

  function day(date) {
    return date.toISOString().slice(0, 10)
  }

  it('calls datesSet as before over a navigation sequence', () => {
    let calls = []
    let calendar
    calendar = initCalendar({
      initialView: 'timeGridWeek',
      datesSet(arg) {
        // the first call is during initCalendar, before it returns the calendar: compare the API it was given
        calls.push(`${this === arg.view.calendar ? 'api' : 'other'} ${arg.view.type} ${day(arg.start)} ${day(arg.end)}`)
      },
    })

    calendar.next()
    calendar.prev()
    calendar.gotoDate('2024-03-07') // the same week
    calendar.changeView('dayGridMonth')
    calendar.setOption('weekends', false)
    calendar.setOption('eventColor', 'red') // unrelated
    calendar.incrementDate({ months: 2 })
    calendar.today()

    expect(JSON.stringify(calls)).toBe(JSON.stringify(EXPECTED_DATES_SET_CALLS))
    expect(calls.every((call) => call.startsWith('api '))).toBe(true)
  })

  describe('a custom dateProfileGeneratorClass from a plugin\'s view', () => {
    let receivers: { [method: string]: any[] }

    function buildCalendar(Generator, extraOptions = {}) {
      return initCalendar({
        plugins: [...DEFAULT_PLUGINS, {
          name: 'custom-generator-view',
          views: {
            custom: { type: 'timeGrid', duration: { days: 7 }, dateProfileGeneratorClass: Generator },
          },
        }],
        initialView: 'custom',
        ...extraOptions,
      })
    }

    function record(self, method) {
      (receivers[method] = receivers[method] || []).push(self)
    }

    beforeEach(() => {
      receivers = {}
    })

    // hides Wednesdays at construction time, through its own initHiddenDays
    class HideWednesdays extends DateProfileGenerator {
      initHiddenDays() {
        record(this, 'initHiddenDays')
        super.initHiddenDays()
        this.isHiddenDayHash[3] = true
      }
    }

    it('hides days from its constructor-time initHiddenDays, for the hidden-day consumers too', () => {
      let calendar = buildCalendar(HideWednesdays)
      let generator = calendar.getCurrentData().dateProfileGenerator
      let headerDates = new TimeGridViewWrapper(calendar).header.getDates().map(day)

      expect(receivers['initHiddenDays']).toEqual([generator])
      expect(headerDates).toEqual(['2024-03-08', '2024-03-09', '2024-03-10', '2024-03-11', '2024-03-12', '2024-03-14'])
    })

    // prev goes back two increments (calling super twice); next builds itself, without super
    class TwoBackOneForward extends DateProfileGenerator {
      buildPrev(currentDateProfile, currentDate, nowDate, forceToValid) {
        record(this, 'buildPrev')
        let once = super.buildPrev(currentDateProfile, currentDate, nowDate, forceToValid)
        return super.buildPrev(once, once.currentRange.start, nowDate, forceToValid)
      }

      buildNext(currentDateProfile, currentDate, nowDate, forceToValid) {
        record(this, 'buildNext')
        return this.build(addDays(currentDateProfile.currentRange.start, 1), nowDate, 1, forceToValid)
      }
    }

    it('navigates with its buildPrev and buildNext, for the toolbar too', () => {
      let calendar = buildCalendar(TwoBackOneForward, { validRange: { start: '2024-02-25' } })
      let generator = calendar.getCurrentData().dateProfileGenerator
      let starts = [day(calendar.getCurrentData().dateProfile.currentRange.start)]

      calendar.next()
      starts.push(day(calendar.getCurrentData().dateProfile.currentRange.start))
      calendar.prev()
      starts.push(day(calendar.getCurrentData().dateProfile.currentRange.start))

      expect(starts).toEqual(['2024-03-08', '2024-03-09', '2024-02-25']) // back two weeks, clamped to validRange
      expect(receivers['buildPrev'].every((self) => self === generator)).toBe(true)
      expect(receivers['buildNext'].every((self) => self === generator)).toBe(true)
      // the toolbar asks too (forceToValid false), so more calls than navigations
      expect(receivers['buildPrev'].length).toBeGreaterThan(1)
      expect(calendar.getCurrentData().toolbarProps.isPrevEnabled).toBe(EXPECTED_PREV_ENABLED_AFTER)
    })

    // a two-day range from any date, and a valid range that ends on the 20th
    class TwoDaysUntilThe20th extends DateProfileGenerator {
      buildCurrentRangeInfo(date, direction) {
        record(this, 'buildCurrentRangeInfo')
        let start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
        return { duration: { years: 0, months: 0, days: 2, milliseconds: 0 }, unit: 'day', range: { start, end: addDays(start, 2) } }
      }

      buildValidRange(nowDate) {
        record(this, 'buildValidRange')
        return { start: null, end: new Date(Date.UTC(2024, 2, 20)) }
      }
    }

    it('builds with its buildCurrentRangeInfo and buildValidRange', () => {
      let calendar = buildCalendar(TwoDaysUntilThe20th)
      let { dateProfile } = calendar.getCurrentData()

      expect([day(dateProfile.currentRange.start), day(dateProfile.currentRange.end)]).toEqual(['2024-03-08', '2024-03-10'])
      expect(day(dateProfile.validRange.end)).toBe('2024-03-20')
      expect(receivers['buildCurrentRangeInfo'].length).toBeGreaterThan(0)
      expect(receivers['buildValidRange'].length).toBeGreaterThan(0)
    })

    // isHiddenDay is what the hidden-day consumers call; skipping reads the hash, so it isn't affected
    class HideThursdaysForConsumers extends DateProfileGenerator {
      isHiddenDay(dayOrDate) {
        record(this, 'isHiddenDay')
        let dow = dayOrDate instanceof Date ? dayOrDate.getUTCDay() : dayOrDate
        return dow === 4 || super.isHiddenDay(dayOrDate)
      }
    }

    it('gives the hidden-day consumers its isHiddenDay', () => {
      let calendar = buildCalendar(HideThursdaysForConsumers)
      let headerDates = new TimeGridViewWrapper(calendar).header.getDates().map(day)

      expect(JSON.stringify(headerDates)).toBe(JSON.stringify(EXPECTED_THURSDAY_HEADER_DATES))
      expect(receivers['isHiddenDay'].length).toBeGreaterThan(0)
    })
  })

  describe('the generator', () => {
    it('is kept across an unrelated option change, and new for a related one', () => {
      let calendar = initCalendar({ initialView: 'timeGridWeek' })
      let generator = calendar.getCurrentData().dateProfileGenerator

      calendar.setOption('eventColor', 'red')
      calendar.next()
      expect(calendar.getCurrentData().dateProfileGenerator).toBe(generator)

      calendar.setOption('hiddenDays', [1])
      expect(calendar.getCurrentData().dateProfileGenerator).not.toBe(generator)
    })
  })

  // recorded from the pre-phase-10 code
  // (a gotoDate within the same week rebuilds the profile, so it's called again; an unrelated option isn't)
  const EXPECTED_DATES_SET_CALLS = [
    'api timeGridWeek 2024-03-03 2024-03-10',
    'api timeGridWeek 2024-03-10 2024-03-17',
    'api timeGridWeek 2024-03-03 2024-03-10',
    'api timeGridWeek 2024-03-03 2024-03-10',
    'api dayGridMonth 2024-02-25 2024-04-07',
    'api dayGridMonth 2024-02-26 2024-04-06',
    'api dayGridMonth 2024-04-29 2024-06-08',
    'api dayGridMonth 2024-02-26 2024-04-06',
  ]
  const EXPECTED_PREV_ENABLED_AFTER = false // two more weeks back is before validRange
  const EXPECTED_THURSDAY_HEADER_DATES = ['2024-03-08', '2024-03-09', '2024-03-10', '2024-03-11', '2024-03-12', '2024-03-13']
})
