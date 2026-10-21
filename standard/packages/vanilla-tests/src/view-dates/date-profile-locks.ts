import { Calendar } from 'fullcalendar'
import { DateProfileGenerator } from 'fullcalendar/protected-api'
import { DEFAULT_PLUGINS } from '../lib/global-plugins'

/*
Behavior locks for phase 10 (planning/phase-10-date-profile.md), written before the date profile's
rewrite: user range functions' `this`, arguments and call counts, single-day views landing on hidden
days, what a new day does to a now-dependent validRange, and a custom dateProfileGeneratorClass.
The calendars aren't rendered: this is the data layer.
*/
describe('date profile behavior locks', () => {
  function buildCalendar(options) {
    return new Calendar(document.createElement('div'), {
      plugins: DEFAULT_PLUGINS,
      initialDate: '2024-03-08',
      now: '2024-03-08T10:00:00',
      timeZone: 'UTC',
      ...options,
    })
  }

  function day(marker) {
    return marker.toISOString().slice(0, 10)
  }

  describe('validRange as a function', () => {
    it('is called with the calendar as `this` and now as a Date', () => {
      let calls = []
      let calendar = buildCalendar({
        initialView: 'dayGridMonth',
        validRange(nowDate) {
          calls.push({ self: this, nowDate })
          return {}
        },
      })

      expect(calls.length).toBeGreaterThan(0)
      for (let call of calls) {
        expect(call.self).toBe(calendar)
        expect(call.nowDate instanceof Date).toBe(true)
        expect(day(call.nowDate)).toBe('2024-03-08')
      }
      calendar.destroy()
    })

    it('is called as many times per navigation as before', () => {
      let callCnt = 0
      let calendar = buildCalendar({
        initialView: 'dayGridMonth',
        validRange() {
          callCnt++
          return {}
        },
      })
      let counts = { init: callCnt }

      callCnt = 0
      calendar.next()
      counts['next'] = callCnt

      callCnt = 0
      calendar.gotoDate('2024-06-10')
      counts['gotoDate'] = callCnt

      callCnt = 0
      calendar.changeView('timeGridWeek')
      counts['changeView'] = callCnt

      callCnt = 0
      calendar.setOption('weekends', false)
      counts['setOption'] = callCnt

      callCnt = 0
      calendar.unselect() // no date change
      calendar.dispatch({ type: 'UNSELECT_EVENT' })
      counts['other action'] = callCnt

      expect(counts).toEqual(EXPECTED_VALID_RANGE_CALLS)
      calendar.destroy()
    })
  })

  describe('visibleRange as a function', () => {
    it('is called with the calendar as `this` and the current date as a Date', () => {
      let calls = []
      let calendar = buildCalendar({
        initialView: 'timeGrid',
        visibleRange(currentDate) {
          calls.push({ self: this, currentDate })
          return { start: currentDate, end: new Date(currentDate.valueOf() + 3 * 864e5) }
        },
      })
      let callCnt = calls.length

      calendar.next()
      let nextCalls = calls.slice(callCnt)

      expect(calls[0].self).toBe(calendar)
      expect(calls[0].currentDate instanceof Date).toBe(true)
      expect({ init: callCnt, next: nextCalls.length }).toEqual(EXPECTED_VISIBLE_RANGE_CALLS)
      calendar.destroy()
    })
  })

  // the pre-pass removed a never-run "skip hidden days for a single day" block; the fallback for a range
  // completely within hidden days does it, in the navigation's direction
  describe('single-day views on hidden days', () => {
    it('skips forward to the next shown day', () => {
      let calendar = buildCalendar({ initialView: 'timeGridDay', weekends: false, initialDate: '2024-03-09' }) // a Saturday
      expect(day(calendar.getCurrentData().dateProfile.currentRange.start)).toBe('2024-03-11')
      calendar.destroy()
    })

    it('skips back to the previous shown day for prev', () => {
      let calendar = buildCalendar({ initialView: 'timeGridDay', weekends: false, initialDate: '2024-03-11' }) // a Monday
      calendar.prev()
      expect(day(calendar.getCurrentData().dateProfile.currentRange.start)).toBe('2024-03-08')
      calendar.destroy()
    })

    it('counts only shown days for dayCount, backward too', () => {
      let calendar = buildCalendar({
        initialView: 'threeDay',
        views: { threeDay: { type: 'dayGrid', dayCount: 3 } },
        weekends: false,
        initialDate: '2024-03-08', // a Friday
      })
      let { currentRange } = calendar.getCurrentData().dateProfile
      expect([day(currentRange.start), day(currentRange.end)]).toEqual(['2024-03-08', '2024-03-13'])

      calendar.prev()
      currentRange = calendar.getCurrentData().dateProfile.currentRange
      expect(day(currentRange.start)).toBe(EXPECTED_DAY_COUNT_PREV_START)
      calendar.destroy()
    })
  })

  // the phase 10 change: today a new day doesn't rebuild the profile, so a now-dependent validRange stays
  // as of the old day until the next navigation. Phase 10 step 3 flips this
  describe('a new day with a now-dependent validRange', () => {
    beforeEach(() => {
      jasmine.clock().install()
      jasmine.clock().mockDate(new Date('2024-03-08T10:00:00Z'))
    })

    afterEach(() => {
      jasmine.clock().uninstall()
    })

    it('keeps the profile as of the old day', () => {
      let calendar = buildCalendar({
        now: undefined, // the real (mocked) clock
        initialView: 'dayGridMonth',
        validRange(nowDate) {
          return { start: nowDate }
        },
      })
      expect(day(calendar.getCurrentData().dateProfile.validRange.start)).toBe('2024-03-08')

      jasmine.clock().tick(24 * 60 * 60 * 1000) // the timer moves now to the next day
      expect(day(calendar.getCurrentData().nowDate)).toBe('2024-03-09')
      expect(day(calendar.getCurrentData().dateProfile.validRange.start)).toBe(EXPECTED_VALID_START_AFTER_NEW_DAY)
      calendar.destroy()
    })
  })

  describe('a custom dateProfileGeneratorClass', () => {
    class PaddedGenerator extends DateProfileGenerator {
      buildRenderRange(currentRange) {
        return { start: new Date(currentRange.start.valueOf() - 864e5), end: new Date(currentRange.end.valueOf() + 864e5) }
      }
    }

    function renderDays(calendar) {
      let { renderRange } = calendar.getCurrentData().dateProfile
      return [day(renderRange.start), day(renderRange.end)]
    }

    // a plugin's view sets it in its option defaults, where the store reads it
    it('from a plugin\'s view is used, its overrides included', () => {
      let calendar = buildCalendar({
        plugins: [...DEFAULT_PLUGINS, {
          name: 'padded-view',
          views: { padded: { type: 'timeGrid', duration: { days: 2 }, dateProfileGeneratorClass: PaddedGenerator } },
        }],
        initialView: 'padded',
      })
      expect(renderDays(calendar)).toEqual(['2024-03-07', '2024-03-11'])
      calendar.destroy()
    })

    // the views option sets overrides, which the store doesn't read it from
    it('from the views option is ignored', () => {
      let calendar = buildCalendar({
        initialView: 'padded',
        views: { padded: { type: 'timeGrid', duration: { days: 2 }, dateProfileGeneratorClass: PaddedGenerator } },
      })
      expect(renderDays(calendar)).toEqual(['2024-03-08', '2024-03-10'])
      calendar.destroy()
    })
  })

  describe('transitions', () => {
    // a three-day view aligned to weeks: prev clamps to validRange's start, then aligns before it
    it('keep the very profile object on a rejected prev, building as before', () => {
      let callCnt = 0
      let calendar = buildCalendar({
        initialView: 'threeDayWeekAligned',
        views: { threeDayWeekAligned: { type: 'timeGrid', duration: { days: 3 }, dateAlignment: 'week' } },
        initialDate: '2017-06-11',
        validRange(nowDate) {
          callCnt++
          return { start: '2017-06-08' }
        },
      })
      let profile = calendar.getCurrentData().dateProfile

      callCnt = 0
      calendar.prev()
      expect(calendar.getCurrentData().dateProfile).toBe(profile)
      expect(callCnt).toBe(EXPECTED.rejectedPrevCalls)
      calendar.destroy()
    })

    it('keep the very profile object for an action that doesn\'t navigate', () => {
      let calendar = buildCalendar({ initialView: 'dayGridMonth' })
      let profile = calendar.getCurrentData().dateProfile
      calendar.dispatch({ type: 'UNSELECT_EVENT' })
      calendar.unselect()
      expect(calendar.getCurrentData().dateProfile).toBe(profile)
      calendar.destroy()
    })

    // an option change rebuilds without the last navigation's direction
    it('reset the hidden-day direction on an option change', () => {
      let calendar = buildCalendar({ initialView: 'timeGridDay', weekends: false, initialDate: '2018-06-11' }) // Monday
      calendar.prev()
      expect(day(calendar.getCurrentData().dateProfile.currentRange.start)).toBe('2018-06-08') // Friday
      calendar.setOption('hiddenDays', [5]) // hide Fridays too
      expect(day(calendar.getCurrentData().dateProfile.currentRange.start)).toBe(EXPECTED.afterHidingFriday)
      expect(day(calendar.getDate())).toBe(EXPECTED.afterHidingFridayDate)
      calendar.destroy()
    })

    it('change the view with a date, a range or neither', () => {
      let calendar = buildCalendar({ initialView: 'timeGridWeek', initialDate: '2018-06-08' })

      calendar.changeView('dayGridMonth', '2018-06-20')
      let data = calendar.getCurrentData()
      expect(JSON.stringify([day(calendar.getDate()), day(data.dateProfile.currentDate), day(data.dateProfile.currentRange.start)]))
        .toBe(JSON.stringify(EXPECTED.changeViewWithDate))

      calendar.changeView('timeGrid', { start: '2018-07-02', end: '2018-07-05' })
      data = calendar.getCurrentData()
      expect(JSON.stringify([day(calendar.getDate()), day(data.dateProfile.currentRange.start), day(data.dateProfile.currentRange.end)]))
        .toBe(JSON.stringify(EXPECTED.changeViewWithRange))

      calendar.changeView('timeGridDay')
      data = calendar.getCurrentData()
      expect(JSON.stringify([day(calendar.getDate()), day(data.dateProfile.currentRange.start)])).toBe(JSON.stringify(EXPECTED.changeViewWithNeither))
      calendar.destroy()
    })

    it('keep an initial date\'s time', () => {
      let calendar = buildCalendar({ initialView: 'timeGridWeek', initialDate: '2024-03-08T15:30:00' })
      expect(calendar.getDate().toISOString()).toBe(EXPECTED.initialDateWithTime)
      calendar.destroy()
    })

    it('keep the civil current date across a time zone change', () => {
      let calendar = buildCalendar({ initialView: 'timeGridWeek', initialDate: '2024-03-08T15:30:00' })
      calendar.setOption('timeZone', 'America/New_York')
      let data = calendar.getCurrentData()
      expect(JSON.stringify([data.currentDate.toISOString(), day(data.dateProfile.currentRange.start)])).toBe(JSON.stringify(EXPECTED.afterTimeZoneChange))
      calendar.destroy()
    })
  })

  describe('with a frozen clock', () => {
    afterEach(() => {
      jasmine.clock().uninstall()
    })

    // the initial date is the now manager's precise now; validRange gets the day-snapped now
    it('starts at now without an initialDate', () => {
      jasmine.clock().install()
      jasmine.clock().mockDate(new Date('2024-03-08T10:20:30Z'))
      let validRangeNows = []
      let calendar = buildCalendar({
        initialDate: undefined,
        now: undefined,
        initialView: 'timeGridWeek',
        validRange(nowDate) {
          validRangeNows.push(nowDate.toISOString())
          return {}
        },
      })
      expect(calendar.getDate().toISOString()).toBe(EXPECTED.initialFromNow)
      expect(validRangeNows[0]).toBe(EXPECTED.validRangeNowInitially)
      calendar.destroy()
    })

    // the timer also wakes at offset transitions, on the same day: nothing to rebuild
    for (const [name, instant] of [['spring forward', '2024-03-10T05:30:00Z'], ['fall back', '2024-11-03T04:30:00Z']]) {
      it(`doesn't rebuild the profile on a ${name} wake`, () => {
        jasmine.clock().install()
        jasmine.clock().mockDate(new Date(instant)) // 00:30 or 01:30 in New York, before the transition
        let callCnt = 0
        let calendar = buildCalendar({
          now: undefined,
          initialDate: undefined,
          timeZone: 'America/New_York',
          initialView: 'dayGridMonth',
          validRange(nowDate) {
            callCnt++
            return { start: nowDate }
          },
        })
        let profile = calendar.getCurrentData().dateProfile

        callCnt = 0
        jasmine.clock().tick(3 * 60 * 60 * 1000) // past the transition, before midnight
        expect(calendar.getCurrentData().dateProfile).toBe(profile)
        expect(callCnt).toBe(EXPECTED.dstWakeCalls)
        calendar.destroy()
      })
    }
  })

  // recorded from the pre-phase-10 code (commit 0258f6fdd)
  // (the profile's build plus the toolbar's three; one more for a view change, which rebuilds first)
  const EXPECTED_VALID_RANGE_CALLS = { init: 4, next: 4, gotoDate: 4, changeView: 5, setOption: 4, 'other action': 0 }
  const EXPECTED_VISIBLE_RANGE_CALLS = { init: 4, next: 4 }
  const EXPECTED_DAY_COUNT_PREV_START = '2024-03-07'
  const EXPECTED = {
    rejectedPrevCalls: 4, // the discarded candidate's build, and the toolbar's three
    afterHidingFriday: '2018-06-11', // forward from Friday, not back to Thursday
    afterHidingFridayDate: '2018-06-11',
    // getDate() keeps the old date (inside the new range); the profile's currentDate is the given one
    changeViewWithDate: ['2018-06-08', '2018-06-20', '2018-06-01'],
    changeViewWithRange: ['2018-07-02', '2018-07-02', '2018-07-05'],
    changeViewWithNeither: ['2018-07-02', '2018-07-02'],
    initialDateWithTime: '2024-03-08T15:30:00.000Z',
    afterTimeZoneChange: ['2024-03-08T15:30:00.000Z', '2024-03-03'], // the civil marker is kept
    initialFromNow: '2024-03-08T10:20:30.000Z',
    validRangeNowInitially: '2024-03-08T00:00:00.000Z', // day-snapped
    // the profile is kept, but the timer's new nowDate object misses the toolbar's memo: its three builds
    dstWakeCalls: 3,
  }
  const EXPECTED_VALID_START_AFTER_NEW_DAY = '2024-03-08' // stale: phase 10 step 3 makes it '2024-03-09'
})
