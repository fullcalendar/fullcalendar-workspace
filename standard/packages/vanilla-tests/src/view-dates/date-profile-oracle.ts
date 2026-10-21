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
    const calendar = new Calendar(el, {
      plugins: DEFAULT_PLUGINS,
      views: CUSTOM_VIEWS,
      initialView: views[0],
      initialDate: '2024-03-08',
      now: NOW,
      ...config.options,
    })

    try {
      checkInitial(calendar)

      for (let step = 0; step < STEPS; step++) {
        const before = calendar.getCurrentData()
        const op = pick(['prev', 'next', 'gotoDate', 'changeView', 'incrementDate', 'today'])
        let expected

        if (op === 'prev' || op === 'next') {
          calendar[op]()
          expected = expectNav(before, calendar.getCurrentData(), op === 'prev' ? 'PREV' : 'NEXT')
        } else if (op === 'gotoDate') {
          const marker = before.dateEnv.add(before.currentDate, createDuration({ days: Math.floor(random() * 800) - 400 }))
          const date = before.dateEnv.toDate(marker)
          calendar.gotoDate(date)
          // as gotoDate parses it (in the local time zone, that drops milliseconds)
          expected = expectChangeDate(before, calendar.getCurrentData(), before.dateEnv.createMarker(date))
        } else if (op === 'incrementDate') {
          const days = Math.floor(random() * 21) - 10
          const marker = before.dateEnv.add(before.currentDate, createDuration({ days }))
          calendar.incrementDate({ days })
          expected = expectChangeDate(before, calendar.getCurrentData(), marker)
        } else if (op === 'today') {
          const marker = before.nowManager.getDateMarker()
          calendar.today()
          expected = expectChangeDate(before, calendar.getCurrentData(), marker)
        } else {
          const viewType = pick(views)
          calendar.changeView(viewType)
          expected = expectChangeView(before, calendar.getCurrentData())
        }

        const after = calendar.getCurrentData()
        const where = `${config.name}, seed ${seed}, step ${step} (${op}, ${after.viewSpec.type})`
        expect(normalizeProfile(after.dateProfile)).withContext(where).toEqual(normalizeProfile(expected.dateProfile))
        expect(after.currentDate.valueOf()).withContext(where + ' currentDate').toBe(expected.currentDate.valueOf())
        expect(toolbarFlags(after.toolbarProps)).withContext(where + ' toolbar').toEqual(expectedToolbar(after, expected))
      }
    } finally {
      calendar.destroy()
    }
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

  function expectChangeView(before, after) {
    // a new generator rebuilds from the current date first, then CHANGE_VIEW_TYPE builds from it again
    const dp = buildLegacy(after).build(before.currentDate, after.nowDate)
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
})
