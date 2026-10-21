import { Calendar } from 'fullcalendar'
import { rangeContainsMarker, createDuration } from 'fullcalendar/protected-api'
import { DEFAULT_PLUGINS } from '../lib/global-plugins'
import { LegacyDateProfileGenerator, LegacyTableDateProfileGenerator } from '../lib/legacy-date-profile'

/*
Phase 10's oracle (planning/phase-10-date-profile.md): seeded random navigation over option mixes, each
transition checked against the frozen pre-phase-10 generator (lib/legacy-date-profile.ts) with the
store's stage-4 rules: the date profile, the current date and the toolbar's enabled buttons. The
calendars aren't rendered: this is the data layer.
*/
describe('date profile oracle', () => {
  const NOW = '2024-03-08T10:00:00'

  // `now` advances with the real clock, so today() would differ by the milliseconds between the expected
  // and the actual read. A frozen clock keeps the oracle exact
  beforeEach(() => {
    jasmine.clock().install()
    jasmine.clock().mockDate(new Date('2024-03-08T10:00:00Z'))
  })

  afterEach(() => {
    jasmine.clock().uninstall()
  })

  // views every config may switch between
  const VIEWS = ['dayGridMonth', 'dayGridWeek', 'dayGridDay', 'timeGridWeek', 'timeGridDay', 'listWeek', 'multiMonthYear', 'fourDay', 'threeDayCount']
  const CUSTOM_VIEWS = {
    fourDay: { type: 'timeGrid', duration: { days: 4 } },
    threeDayCount: { type: 'dayGrid', dayCount: 3 },
  }

  const CONFIGS: { name: string, options: any, views?: string[] }[] = [
    { name: 'defaults', options: {} },
    { name: 'weekends: false', options: { weekends: false } },
    { name: 'hiddenDays', options: { hiddenDays: [1, 3] } },
    { name: 'hiddenDays all but one', options: { hiddenDays: [0, 1, 2, 3, 5, 6] } },
    { name: 'dateIncrement', options: { dateIncrement: { days: 2 } } },
    { name: 'dateAlignment', options: { dateAlignment: 'week' } },
    { name: 'dateIncrement and hiddenDays', options: { dateIncrement: { days: 1 }, hiddenDays: [0, 6] } },
    { name: 'validRange', options: { validRange: { start: '2024-02-10', end: '2024-05-20' } } },
    { name: 'validRange start only', options: { validRange: { start: '2024-03-01' } } },
    {
      name: 'validRange function',
      options: {
        validRange(nowDate) {
          return { start: nowDate, end: new Date(nowDate.valueOf() + 60 * 864e5) }
        },
      },
    },
    { name: 'showNonCurrentDates: false', options: { showNonCurrentDates: false } },
    { name: 'fixedWeekCount: false', options: { fixedWeekCount: false } },
    { name: 'slotMinTime/slotMaxTime', options: { slotMinTime: '-02:00', slotMaxTime: '26:00' } },
    { name: 'firstDay', options: { firstDay: 3 } },
    { name: 'time zone UTC', options: { timeZone: 'UTC' } },
    { name: 'time zone New York, DST', options: { timeZone: 'America/New_York', initialDate: '2024-03-09' } },
    {
      name: 'visibleRange',
      options: { visibleRange: { start: '2024-03-04', end: '2024-03-09' } },
      views: ['timeGrid', 'dayGrid'],
    },
    {
      name: 'visibleRange function',
      options: {
        visibleRange(currentDate) {
          return { start: currentDate, end: new Date(currentDate.valueOf() + 3 * 864e5) }
        },
      },
      views: ['timeGrid', 'dayGrid'],
    },
  ]

  const SEEDS = [1, 2, 3, 4, 5]
  const STEPS = 60

  for (const config of CONFIGS) {
    for (const seed of SEEDS) {
      it(`matches the pre-phase-10 generator: ${config.name}, seed ${seed}`, () => {
        runOracle(config, seed)
      })
    }
  }

  function runOracle(config: { name: string, options: any, views?: string[] }, seed: number) {
    const views = config.views || VIEWS
    const random = mulberry32(seed)
    const pick = <T>(items: T[]): T => items[Math.floor(random() * items.length)]
    const el = document.createElement('div')

    // the user range functions' calls, while the calendar acts (not while the oracle computes)
    let calendar // declared first: the functions run during construction
    const trace: string[] = []
    let isTracing = true
    const traced = (kind: string, input: any) => function (this: any, date: Date) {
      if (isTracing) {
        trace.push(`${kind}:${this === calendar ? 'cal' : 'other'}:${date.toISOString()}`)
      }
      return typeof input === 'function' ? input.call(this, date) : input
    }
    const options = { ...config.options }
    options.validRange = traced('valid', config.options.validRange)
    if (config.options.visibleRange) {
      options.visibleRange = traced('visible', config.options.visibleRange)
    }

    calendar = new Calendar(el, {
      plugins: DEFAULT_PLUGINS,
      views: CUSTOM_VIEWS,
      initialView: views[0],
      initialDate: '2024-03-08',
      now: NOW,
      ...options,
    })
    const canChangeHiddenDays = config.name !== 'hiddenDays all but one'
    const timeZones = ['UTC', 'America/New_York', 'local']

    try {
      isTracing = false
      checkInitial(calendar)

      for (let step = 0; step < STEPS; step++) {
        const before = calendar.getCurrentData()
        const op = pick(['prev', 'next', 'gotoDate', 'changeView', 'changeViewDate', 'incrementDate', 'today', 'setOption'])
        let expected
        trace.push(`#${step} ${op}`)
        isTracing = true

        // some option mixes crash today (a table view whose aligned range is all hidden days: see
        // planning/questions-for-adam.md). The calendar and the frozen generator must crash alike; the
        // calendar is unusable after, so the sequence ends
        let crash: string | null = null
        let stage = 'calendar' // which side threw
        try {

        if (op === 'prev' || op === 'next') {
          calendar[op]()
          isTracing = false
          stage = 'oracle'
          expected = expectNav(before, calendar.getCurrentData(), op === 'prev' ? 'PREV' : 'NEXT')
        } else if (op === 'gotoDate') {
          const marker = before.dateEnv.add(before.currentDate, createDuration({ days: Math.floor(random() * 800) - 400 }))
          const date = before.dateEnv.toDate(marker)
          calendar.gotoDate(date)
          isTracing = false
          stage = 'oracle'
          // as gotoDate parses it (in the local time zone, that drops milliseconds)
          expected = expectChangeDate(before, calendar.getCurrentData(), before.dateEnv.createMarker(date))
        } else if (op === 'incrementDate') {
          const days = Math.floor(random() * 21) - 10
          const marker = before.dateEnv.add(before.currentDate, createDuration({ days }))
          calendar.incrementDate({ days })
          isTracing = false
          stage = 'oracle'
          expected = expectChangeDate(before, calendar.getCurrentData(), marker)
        } else if (op === 'today') {
          const marker = before.nowManager.getDateMarker()
          calendar.today()
          isTracing = false
          stage = 'oracle'
          expected = expectChangeDate(before, calendar.getCurrentData(), marker)
        } else if (op === 'changeView') {
          calendar.changeView(pick(views))
          isTracing = false
          stage = 'oracle'
          expected = expectChangeView(before, calendar.getCurrentData(), null)
        } else if (op === 'changeViewDate') {
          const marker = before.dateEnv.add(before.currentDate, createDuration({ days: Math.floor(random() * 60) - 30 }))
          const date = before.dateEnv.toDate(marker)
          calendar.changeView(pick(views), date)
          isTracing = false
          stage = 'oracle'
          expected = expectChangeView(before, calendar.getCurrentData(), before.dateEnv.createMarker(date))
        } else {
          const optionName = pick(canChangeHiddenDays ? ['weekends', 'hiddenDays', 'dateIncrement', 'timeZone'] : ['dateIncrement', 'timeZone'])
          if (optionName === 'weekends') {
            calendar.setOption('weekends', calendar.getOption('weekends') === false)
          } else if (optionName === 'hiddenDays') {
            calendar.setOption('hiddenDays', (calendar.getOption('hiddenDays') || []).length ? [] : [2])
          } else if (optionName === 'dateIncrement') {
            calendar.setOption('dateIncrement', { days: pick([1, 2, 3]) })
          } else {
            calendar.setOption('timeZone', pick(timeZones.filter((timeZone) => timeZone !== calendar.getOption('timeZone'))))
          }
          isTracing = false
          stage = 'oracle'
          // a new generator (an option that compares unequal) rebuilds from the current date; SET_OPTION
          // itself leaves the profile
          const after = calendar.getCurrentData()
          const dp = after.dateProfileGenerator !== before.dateProfileGenerator
            ? buildLegacy(after).build(before.currentDate, after.nowDate)
            : before.dateProfile
          expected = finish(dp, before.currentDate, false)
        }

        } catch (error) {
          crash = `${stage}: ${error}`
        }

        if (crash) {
          isTracing = false
          trace.push(`crash ${crash}`)
          expect(crash).withContext(`${config.name}, seed ${seed}, step ${step} (${op}) crash`).toMatch(EXPECTED_CRASH)
          expect(crash.startsWith('calendar:')).withContext('the calendar crashed, not just the frozen generator').toBe(true)
          break
        }

        const after = calendar.getCurrentData()
        const where = `${config.name}, seed ${seed}, step ${step} (${op}, ${after.viewSpec.type})`
        expect(normalizeProfile(after.dateProfile)).withContext(where).toEqual(normalizeProfile(expected.dateProfile))
        expect(after.currentDate.valueOf()).withContext(where + ' currentDate').toBe(expected.currentDate.valueOf())
        expect(toolbarFlags(after.toolbarProps)).withContext(where + ' toolbar').toEqual(expectedToolbar(after, expected))

        if (expected.dateProfile === before.dateProfile) { // a rejected prev/next keeps the very object
          expect(after.dateProfile).withContext(where + ' identity').toBe(before.dateProfile)
        }
      }

      const key = `${config.name}#${seed}`
      const digest = fnv1a(trace.join('|'))
      if (!(key in EXPECTED_TRACE_DIGESTS)) {
        console.log(`DIGEST ${JSON.stringify(key)}: '${digest}',`)
      }
      expect(digest).withContext(key + ' callback trace').toBe(EXPECTED_TRACE_DIGESTS[key])
    } finally {
      calendar.destroy()
    }
  }

  function fnv1a(str: string): string {
    let hash = 0x811c9dc5
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i)
      hash = Math.imul(hash, 0x01000193)
    }
    return (hash >>> 0).toString(16)
  }

  // the legacy generator for the data's current view, built from the same inputs as the store's
  function buildLegacy(data) {
    const { viewSpec, options, dateEnv } = data
    const od = viewSpec.optionDefaults
    const isTable = Boolean(od.dateProfileGeneratorClass || od.dateProfileRenderRange)
    const LegacyClass = isTable ? LegacyTableDateProfileGenerator : LegacyDateProfileGenerator

    return new LegacyClass({
      dateProfileGeneratorClass: null,
      duration: viewSpec.duration,
      durationUnit: viewSpec.durationUnit,
      usesMinMaxTime: od.usesMinMaxTime,
      dateEnv,
      calendarApi: data.calendarApi,
      slotMinTime: options.slotMinTime,
      slotMaxTime: options.slotMaxTime,
      showNonCurrentDates: options.showNonCurrentDates,
      dayCount: options.dayCount,
      dateAlignment: options.dateAlignment,
      dateIncrement: options.dateIncrement,
      hiddenDays: options.hiddenDays,
      weekends: options.weekends,
      validRangeInput: options.validRange,
      visibleRangeInput: options.visibleRange,
      fixedWeekCount: options.fixedWeekCount,
    })
  }

  // the store's stage 4, after the action's profile: the current date follows the range
  function finish(dateProfile, currentDate, isPrevNext: boolean) {
    if (isPrevNext || !rangeContainsMarker(dateProfile.activeRange, currentDate)) {
      currentDate = dateProfile.currentRange.start
    }
    return { dateProfile, currentDate }
  }

  function checkInitial(calendar) {
    const data = calendar.getCurrentData()
    const expected = finish(buildLegacy(data).build(data.dateEnv.createMarker('2024-03-08'), data.nowDate), data.dateEnv.createMarker('2024-03-08'), false)

    // initialDate may be overridden by the config
    if (!calendar.getOption('initialDate') || calendar.getOption('initialDate') === '2024-03-08') {
      expect(normalizeProfile(data.dateProfile)).toEqual(normalizeProfile(expected.dateProfile))
    }
  }

  function expectNav(before, after, type: 'PREV' | 'NEXT') {
    const gen = buildLegacy(after)
    const base = before.dateProfile
    const dp = type === 'PREV'
      ? gen.buildPrev(base, before.currentDate, after.nowDate)
      : gen.buildNext(base, before.currentDate, after.nowDate)
    return finish(dp.isValid ? dp : base, before.currentDate, true)
  }

  function expectChangeDate(before, after, marker) {
    const dp = buildLegacy(after).build(marker, after.nowDate)
    return finish(dp, marker, false)
  }

  function expectChangeView(before, after, marker) {
    // a new generator rebuilds from the current date first, then CHANGE_VIEW_TYPE builds from the given
    // date or the current one. the current date itself stays (CHANGE_VIEW_TYPE doesn't set it)
    const dp = buildLegacy(after).build(marker || before.currentDate, after.nowDate)
    return finish(dp, before.currentDate, false)
  }

  function expectedToolbar(after, expected) {
    const gen = buildLegacy(after)
    const now = after.nowDate
    const todayInfo = gen.build(now, now, undefined, false)
    const prevInfo = gen.buildPrev(expected.dateProfile, expected.currentDate, now, false)
    const nextInfo = gen.buildNext(expected.dateProfile, expected.currentDate, now, false)

    return {
      isTodayEnabled: todayInfo.isValid && !rangeContainsMarker(expected.dateProfile.currentRange, now),
      isPrevEnabled: prevInfo.isValid,
      isNextEnabled: nextInfo.isValid,
    }
  }

  function toolbarFlags(toolbarProps) {
    return {
      isTodayEnabled: toolbarProps.isTodayEnabled,
      isPrevEnabled: toolbarProps.isPrevEnabled,
      isNextEnabled: toolbarProps.isNextEnabled,
    }
  }

  function normalizeProfile(dp) {
    const range = (r) => (r ? { start: r.start ? r.start.valueOf() : null, end: r.end ? r.end.valueOf() : null } : null)
    return {
      currentDate: dp.currentDate.valueOf(),
      isValid: dp.isValid,
      validRange: range(dp.validRange),
      renderRange: range(dp.renderRange),
      activeRange: range(dp.activeRange),
      currentRange: range(dp.currentRange),
      currentRangeUnit: dp.currentRangeUnit,
      isRangeAllDay: dp.isRangeAllDay,
      dateIncrement: JSON.stringify(dp.dateIncrement),
      slotMinTime: JSON.stringify(dp.slotMinTime),
      slotMaxTime: JSON.stringify(dp.slotMaxTime),
    }
  }

  // a small seeded generator, so every run takes the same paths
  function mulberry32(seed: number) {
    return () => {
      seed |= 0
      seed = (seed + 0x6D2B79F5) | 0
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }

  // the only crash today (and the frozen generator's, which the expectation computes after the calendar's)
  const EXPECTED_CRASH = /Cannot destructure property 'start' of 'currentRange' as it is null/

  // recorded from the pre-phase-10 code: the user range functions' calls (count, order, `this`, argument)
  const EXPECTED_TRACE_DIGESTS: { [key: string]: string } = {
    "dateAlignment#1": '9aab8836',
    "dateAlignment#2": 'd584f35a',
    "dateAlignment#3": 'c29d4884',
    "dateAlignment#4": '95c6b9ad',
    "dateAlignment#5": '95bbf685',
    "dateIncrement and hiddenDays#1": '6170f237',
    "dateIncrement and hiddenDays#2": 'ef3bef03',
    "dateIncrement and hiddenDays#3": 'c29d4884',
    "dateIncrement and hiddenDays#4": '95c6b9ad',
    "dateIncrement and hiddenDays#5": 'b363d32b',
    "dateIncrement#1": 'd06ced67',
    "dateIncrement#2": '47d7d84b',
    "dateIncrement#3": 'c29d4884',
    "dateIncrement#4": '95c6b9ad',
    "dateIncrement#5": 'b363d32b',
    "defaults#1": '6170f237',
    "defaults#2": 'ef3bef03',
    "defaults#3": 'c29d4884',
    "defaults#4": '95c6b9ad',
    "defaults#5": 'b363d32b',
    "firstDay#1": '6170f237',
    "firstDay#2": 'ef3bef03',
    "firstDay#3": 'c29d4884',
    "firstDay#4": '95c6b9ad',
    "firstDay#5": 'b363d32b',
    "fixedWeekCount: false#1": '6170f237',
    "fixedWeekCount: false#2": 'ef3bef03',
    "fixedWeekCount: false#3": 'c29d4884',
    "fixedWeekCount: false#4": '95c6b9ad',
    "fixedWeekCount: false#5": 'b363d32b',
    "hiddenDays all but one#1": '554070a1',
    "hiddenDays all but one#2": 'daed9ddc',
    "hiddenDays all but one#3": 'c13072a8',
    "hiddenDays all but one#4": 'a6f00b67',
    "hiddenDays all but one#5": '8588594f',
    "hiddenDays#1": '6170f237',
    "hiddenDays#2": 'ef3bef03',
    "hiddenDays#3": 'c29d4884',
    "hiddenDays#4": '95c6b9ad',
    "hiddenDays#5": 'b363d32b',
    "showNonCurrentDates: false#1": '6170f237',
    "showNonCurrentDates: false#2": 'ef3bef03',
    "showNonCurrentDates: false#3": 'c29d4884',
    "showNonCurrentDates: false#4": '95c6b9ad',
    "showNonCurrentDates: false#5": 'b363d32b',
    "slotMinTime/slotMaxTime#1": '6170f237',
    "slotMinTime/slotMaxTime#2": 'ef3bef03',
    "slotMinTime/slotMaxTime#3": 'c29d4884',
    "slotMinTime/slotMaxTime#4": '95c6b9ad',
    "slotMinTime/slotMaxTime#5": 'b363d32b',
    "time zone New York, DST#1": '6170f237',
    "time zone New York, DST#2": 'ef3bef03',
    "time zone New York, DST#3": 'c29d4884',
    "time zone New York, DST#4": '95c6b9ad',
    "time zone New York, DST#5": 'b363d32b',
    "time zone UTC#1": '87696f2a',
    "time zone UTC#2": '91af334f',
    "time zone UTC#3": '83b03805',
    "time zone UTC#4": 'ef1c20fc',
    "time zone UTC#5": '1d9af61f',
    "validRange function#1": '6170f237',
    "validRange function#2": 'ef3bef03',
    "validRange function#3": 'c29d4884',
    "validRange function#4": '95c6b9ad',
    "validRange function#5": 'b363d32b',
    "validRange start only#1": '6170f237',
    "validRange start only#2": 'ef3bef03',
    "validRange start only#3": 'c29d4884',
    "validRange start only#4": '95c6b9ad',
    "validRange start only#5": 'b363d32b',
    "validRange#1": '6170f237',
    "validRange#2": 'ef3bef03',
    "validRange#3": 'c29d4884',
    "validRange#4": '95c6b9ad',
    "validRange#5": 'b363d32b',
    "visibleRange function#1": '3bdfdd0c',
    "visibleRange function#2": '1b9416b6',
    "visibleRange function#3": '190e113d',
    "visibleRange function#4": '5317cf29',
    "visibleRange function#5": '2ae80ae9',
    "visibleRange#1": 'a4432f66',
    "visibleRange#2": '5e0b4f15',
    "visibleRange#3": 'ed69f943',
    "visibleRange#4": '8952372f',
    "visibleRange#5": '912e1dcf',
    "weekends: false#1": '6170f237',
    "weekends: false#2": 'ef3bef03',
    "weekends: false#3": 'c29d4884',
    "weekends: false#4": '95c6b9ad',
    "weekends: false#5": 'b363d32b',
  }
})
