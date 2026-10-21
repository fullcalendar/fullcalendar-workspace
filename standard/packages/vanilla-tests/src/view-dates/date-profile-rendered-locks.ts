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
        calls.push([
          this === arg.view.calendar ? 'api' : 'other',
          arg.view.type,
          arg.start.toISOString(),
          arg.end.toISOString(),
          arg.startStr,
          arg.endStr,
          arg.timeZone,
        ].join(' '))
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

    // build overridden: the inherited buildPrev/buildNext (and the toolbar's) go through it
    class ShiftedBuild extends DateProfileGenerator {
      build(currentDate, nowDate, direction?, forceToValid?) {
        record(this, 'build')
        return super.build(addDays(currentDate, 1), nowDate, direction, forceToValid)
      }
    }

    it('navigates through its build with the inherited buildPrev and buildNext', () => {
      let calendar = buildCalendar(ShiftedBuild)
      let generator = calendar.getCurrentData().dateProfileGenerator
      let starts = [day(calendar.getCurrentData().dateProfile.currentRange.start)]
      let buildCnt = receivers['build'].length

      calendar.next()
      starts.push(day(calendar.getCurrentData().dateProfile.currentRange.start))
      calendar.prev()
      starts.push(day(calendar.getCurrentData().dateProfile.currentRange.start))

      expect(JSON.stringify(starts)).toBe(JSON.stringify(EXPECTED_SHIFTED_STARTS))
      expect(receivers['build'].length - buildCnt).toBe(EXPECTED_SHIFTED_BUILD_CALLS) // navigation and toolbar
      expect(receivers['build'].every((self) => self === generator)).toBe(true)
    })

    // skipHiddenDays overridden: the inherited trimHiddenDays goes through it (today's this.skipHiddenDays)
    class NoEndTrim extends DateProfileGenerator {
      skipHiddenDays(date, inc = 1, isExclusive = false) {
        record(this, 'skipHiddenDays')
        return isExclusive ? date : super.skipHiddenDays(date, inc, isExclusive) // never trims ends
      }
    }

    it('trims through its skipHiddenDays', () => {
      let calendar = buildCalendar(NoEndTrim, { weekends: false, initialDate: '2024-03-04' }) // a Monday
      let { renderRange } = calendar.getCurrentData().dateProfile
      expect(JSON.stringify([day(renderRange.start), day(renderRange.end)])).toBe(JSON.stringify(EXPECTED_NO_END_TRIM_RANGE))
      expect(receivers['skipHiddenDays'].length).toBeGreaterThan(0)
    })

    // a custom class on a view whose type already sets one (dayGrid's table generator) crashes today: the
    // view configs' merge combines the two classes into a function wrapper, which isn't a constructor
    it('on a table view crashes, as before', () => {
      expect(() => {
        initCalendar({
          plugins: [...DEFAULT_PLUGINS, {
            name: 'custom-table-view',
            views: { customMonth: { type: 'dayGrid', duration: { months: 1 }, dateProfileGeneratorClass: DateProfileGenerator } },
          }],
          initialView: 'customMonth',
        })
      }).toThrowError(/is not a constructor/)
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
    // dayGridYear and multiMonthYear have the same generator inputs (table range, fixedWeekCount,
    // showNonCurrentDates), so switching between them keeps the generator and builds once
    it('is shared by views with the same inputs', () => {
      let callCnt = 0
      let calendar = initCalendar({
        initialView: 'dayGridYear',
        fixedWeekCount: true,
        showNonCurrentDates: false,
        validRange() {
          callCnt++
          return {}
        },
      })
      let generator = calendar.getCurrentData().dateProfileGenerator

      callCnt = 0
      calendar.changeView('multiMonthYear')
      expect(calendar.getCurrentData().dateProfileGenerator === generator).toBe(EXPECTED_YEAR_VIEWS_SHARE_GENERATOR)
      expect(callCnt).toBe(EXPECTED_YEAR_VIEW_SWITCH_CALLS)
    })

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
    'api timeGridWeek 2024-03-03T00:00:00.000Z 2024-03-10T00:00:00.000Z 2024-03-03T00:00:00Z 2024-03-10T00:00:00Z UTC',
    'api timeGridWeek 2024-03-10T00:00:00.000Z 2024-03-17T00:00:00.000Z 2024-03-10T00:00:00Z 2024-03-17T00:00:00Z UTC',
    'api timeGridWeek 2024-03-03T00:00:00.000Z 2024-03-10T00:00:00.000Z 2024-03-03T00:00:00Z 2024-03-10T00:00:00Z UTC',
    'api timeGridWeek 2024-03-03T00:00:00.000Z 2024-03-10T00:00:00.000Z 2024-03-03T00:00:00Z 2024-03-10T00:00:00Z UTC',
    'api dayGridMonth 2024-02-25T00:00:00.000Z 2024-04-07T00:00:00.000Z 2024-02-25T00:00:00Z 2024-04-07T00:00:00Z UTC',
    'api dayGridMonth 2024-02-26T00:00:00.000Z 2024-04-06T00:00:00.000Z 2024-02-26T00:00:00Z 2024-04-06T00:00:00Z UTC',
    'api dayGridMonth 2024-04-29T00:00:00.000Z 2024-06-08T00:00:00.000Z 2024-04-29T00:00:00Z 2024-06-08T00:00:00Z UTC',
    'api dayGridMonth 2024-02-26T00:00:00.000Z 2024-04-06T00:00:00.000Z 2024-02-26T00:00:00Z 2024-04-06T00:00:00Z UTC',
  ]
  const EXPECTED_SHIFTED_STARTS = ['2024-03-09', '2024-03-17', '2024-03-11'] // each build a day later
  const EXPECTED_SHIFTED_BUILD_CALLS = 8 // two navigations, each its build and the toolbar's three
  const EXPECTED_NO_END_TRIM_RANGE = ['2024-03-04', '2024-03-11'] // the end isn't trimmed back from the weekend
  const EXPECTED_YEAR_VIEWS_SHARE_GENERATOR = true
  const EXPECTED_YEAR_VIEW_SWITCH_CALLS = 4 // no rebuild for a new generator: the view change's build and the toolbar's three
  const EXPECTED_PREV_ENABLED_AFTER = false // two more weeks back is before validRange
  const EXPECTED_THURSDAY_HEADER_DATES = ['2024-03-08', '2024-03-09', '2024-03-10', '2024-03-11', '2024-03-12', '2024-03-13']
})
