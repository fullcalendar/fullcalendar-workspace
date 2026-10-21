import {
  createKeyedCache, buildDaySeries, buildDayGridRanges, buildDayGridModel, buildModelFromCols,
  sliceDayTableEvents, sliceEventStore, sliceRangeToCoords, buildEventUiForKey, splitIndividualUi,
  buildDefKeys, projectDayTableSegs, projectDayTableInteraction, getDayTableSegTransform,
  computeDayTableColRanges, PLAIN_KEYING, DAY_GRID_LANE, TIME_GRID_ALL_DAY_LANE, TIME_GRID_TIMED_LANE,
  createDuration,
} from 'fullcalendar/protected-api'

/*
Unit specs for the day-table pipeline's pure parts (planning/phase-7b-day-table-plan.md, section 4.2,
"Pure-function unit specs"). Written against the new functions, not characterization: the view-level
specs (day-table-slicing, day-table-identity, premium's vresource-*) lock today's behavior
*/
describe('day-table units', () => {
  describe('KeyedCache', () => {
    function makeCompute(log: string[][]) {
      return (staleKeys: string[]) => {
        log.push(staleKeys)
        let res = {}
        for (let key of staleKeys) {
          res[key] = { key } // a fresh object per computation
        }
        return res
      }
    }

    it('recomputes only the keys whose args changed, keeping the others\' results', () => {
      let cache = createKeyedCache<any[], any>()
      let log: string[][] = []
      let argA = {}
      let argB = {}
      let argC = {}
      let first = cache.get(['a', 'b', 'c'], (key) => [{ a: argA, b: argB, c: argC }[key]], makeCompute(log))
      let argB2 = {}
      let second = cache.get(['a', 'b', 'c'], (key) => [{ a: argA, b: argB2, c: argC }[key]], makeCompute(log))

      expect(log).toEqual([['a', 'b', 'c'], ['b']])
      expect(second.a).toBe(first.a)
      expect(second.c).toBe(first.c)
      expect(second.b).not.toBe(first.b)
    })

    it('doesn\'t compute when no key\'s args changed', () => {
      let cache = createKeyedCache<any[], any>()
      let log: string[][] = []
      let arg = {}
      let first = cache.get(['a', 'b'], () => [arg, 1], makeCompute(log))
      let second = cache.get(['a', 'b'], () => [arg, 1], makeCompute(log))

      expect(log.length).toBe(1)
      expect(second.a).toBe(first.a)
      expect(second.b).toBe(first.b)
    })

    it('evicts a key that leaves, and recomputes it on return even with equal args', () => {
      let cache = createKeyedCache<any[], any>()
      let log: string[][] = []
      let arg = {}
      let first = cache.get(['a', 'b'], () => [arg], makeCompute(log))
      cache.get(['a'], () => [arg], makeCompute(log))
      let third = cache.get(['a', 'b'], () => [arg], makeCompute(log))

      expect(log).toEqual([['a', 'b'], ['b']])
      expect(third.a).toBe(first.a)
      expect(third.b).not.toBe(first.b)
    })

    it('keeps instances independent', () => {
      let cache0 = createKeyedCache<any[], any>()
      let cache1 = createKeyedCache<any[], any>()
      let log: string[][] = []
      let arg = {}
      let first0 = cache0.get(['a'], () => [arg], makeCompute(log))
      let first1 = cache1.get(['a'], () => [arg], makeCompute(log))
      let second0 = cache0.get(['a'], () => [{}], makeCompute(log))
      let second1 = cache1.get(['a'], () => [arg], makeCompute(log))

      expect(second0.a).not.toBe(first0.a)
      expect(second1.a).toBe(first1.a)
    })

    it('compares args by identity, element-wise', () => {
      let cache = createKeyedCache<any[], any>()
      let log: string[][] = []
      let first = cache.get(['a'], () => [[1, 2]], makeCompute(log))
      let second = cache.get(['a'], () => [[1, 2]], makeCompute(log)) // equal by value, a new array

      expect(log.length).toBe(2)
      expect(second.a).not.toBe(first.a)
    })
  })

  describe('day series', () => {
    // Mon Jan 1 2024 .. Mon Jan 8, Thursday (4) hidden
    const RANGE = { start: utc('2024-01-01'), end: utc('2024-01-08') }
    const HIDE_THURSDAYS = {
      isHidden: (dayOrDate) => (typeof dayOrDate === 'number' ? dayOrDate : dayOrDate.getUTCDay()) === 4,
      skip: (date) => date,
      trim: (range) => range,
    }

    it('lists the visible dates', () => {
      let series = buildDaySeries(RANGE, HIDE_THURSDAYS)

      expect(series.cnt).toBe(6)
      expect(series.dates.map((date) => date.getUTCDate())).toEqual([1, 2, 3, 5, 6, 7])
    })

    it('slices ranges, clamping endpoints on hidden days inward', () => {
      let series = buildDaySeries(RANGE, HIDE_THURSDAYS)
      const cases: [string, string, any][] = [
        ['2024-01-01', '2024-01-02', { start: 0, end: 1, isStart: true, isEnd: true }],
        ['2024-01-02', '2024-01-06', { start: 1, end: 4, isStart: true, isEnd: true }], // across the hidden Thu
        ['2024-01-03', '2024-01-05', { start: 2, end: 3, isStart: true, isEnd: false }], // ends on the hidden Thu
        ['2024-01-04', '2024-01-06', { start: 3, end: 4, isStart: false, isEnd: true }], // starts on it
        ['2024-01-04', '2024-01-05', null], // only the hidden day
        ['2023-12-30', '2024-01-03', { start: 0, end: 2, isStart: false, isEnd: true }], // before the range
        ['2024-01-06', '2024-01-10', { start: 4, end: 6, isStart: true, isEnd: false }], // past it
        ['2024-01-08', '2024-01-09', null],
      ]

      for (let [start, end, expected] of cases) {
        expect(series.sliceRange({ start: utc(start), end: utc(end) }))
          .withContext(`${start} - ${end}`)
          .toEqual(expected)
      }
    })

    it('breaks series ranges into rows', () => {
      expect(buildDayGridRanges({ start: 5, end: 9, isStart: true, isEnd: false }, 7)).toEqual([
        { row: 0, start: 5, end: 7, isStart: true, isEnd: false },
        { row: 1, start: 0, end: 2, isStart: false, isEnd: false },
      ])
      expect(buildDayGridRanges({ start: 7, end: 14, isStart: true, isEnd: true }, 7)).toEqual([
        { row: 1, start: 0, end: 7, isStart: true, isEnd: true },
      ])
      expect(buildDayGridRanges(null, 7)).toEqual([])
    })
  })

  describe('sliceDayTableEvents', () => {
    // keys from extendedProps.keys, '' when none
    function keysForEventDef(def) {
      let keys = def.extendedProps.keys
      return keys && keys.length ? keys : ['']
    }

    function describeRanges(ranges) {
      return ranges.map((range) => [
        range.def.publicId || range.def.title,
        range.instance ? range.instance.instanceId : null,
        range.range.start.valueOf(),
        range.range.end.valueOf(),
        range.isStart,
        range.isEnd,
      ])
    }

    // each eventRange once, in order of first appearance
    function rangesOfSegs(segs) {
      let ranges = []
      for (let seg of segs) {
        if (ranges[ranges.length - 1] !== seg.eventRange) {
          ranges.push(seg.eventRange)
        }
      }
      return ranges
    }

    function subsetStore(eventStore, key, lane) {
      let defs = {}
      let instances = {}
      for (let defId in eventStore.defs) {
        let def = eventStore.defs[defId]
        let inLane = lane === 'allDay' ? def.allDay : lane === 'timed' ? (!def.allDay || def.ui.display === 'background' || def.ui.display === 'inverse-background') : true
        if (inLane && keysForEventDef(def).indexOf(key) !== -1) {
          defs[defId] = def
        }
      }
      for (let instanceId in eventStore.instances) {
        if (defs[eventStore.instances[instanceId].defId]) {
          instances[instanceId] = eventStore.instances[instanceId]
        }
      }
      return { defs, instances }
    }

    function buildCalendar(view) {
      return initCalendar({
        initialView: view,
        initialDate: '2024-01-17',
        timeZone: 'UTC',
        events: [
          { id: 'single', title: 'Tie', start: '2024-01-17T10:00:00', end: '2024-01-17T11:00:00', extendedProps: { keys: ['a'] } },
          { groupId: 'rec', title: 'Tie', startTime: '10:00', endTime: '11:00', extendedProps: { keys: ['a', 'b'] } },
          { id: 'multi', title: 'Multi', start: '2024-01-15', end: '2024-01-25', extendedProps: { keys: ['b'] } },
          { id: 'keyless', title: 'Keyless', start: '2024-01-16T09:00:00', end: '2024-01-16T12:00:00' },
          { id: 'inv0', groupId: 'inv', display: 'inverse-background', start: '2024-01-16', end: '2024-01-17', extendedProps: { keys: ['a'] } },
          { id: 'inv1', groupId: 'inv', display: 'inverse-background', start: '2024-01-18T00:00:00', end: '2024-01-18T05:00:00', extendedProps: { keys: ['a', 'b'] } },
          { id: 'invEmpty', display: 'inverse-background', start: '2025-01-01', end: '2025-01-02', extendedProps: { keys: ['b'] } },
          { id: 'bg', display: 'background', start: '2024-01-19', end: '2024-01-20', extendedProps: { keys: ['b'] } },
        ],
      })
    }

    const LANES = [
      ['dayGridMonth', DAY_GRID_LANE, null, 'any'],
      ['timeGridWeek', TIME_GRID_ALL_DAY_LANE, null, 'allDay'],
      ['timeGridWeek', TIME_GRID_TIMED_LANE, null, 'timed'],
    ]

    for (let [view, lane, , laneName] of LANES as any[]) {
      it(`matches sliceEventStore on each key's subset, ${view} ${laneName}`, () => {
        let calendar = buildCalendar(view)
        let data = calendar.getCurrentData()
        let { dateProfile, dateEnv } = data
        let model = buildDayGridModel(dateProfile, data.dateProfileGenerator.hiddenDays, dateEnv)
        let nextDayThreshold = laneName === 'timed' ? null : createDuration(data.options.nextDayThreshold)
        let eventStore = data.renderableEventStore
        let keys = ['a', 'b', '']
        let basesByKey = { a: data.eventUiBases, b: data.eventUiBases, '': data.eventUiBases }
        let res = sliceDayTableEvents(
          eventStore, keys, basesByKey, keysForEventDef, model.daySeries, model.dayCols, lane, dateProfile, nextDayThreshold,
        )
        let framing = laneName === 'timed'
          ? {
              start: new Date(dateProfile.activeRange.start.valueOf() + dateProfile.slotMinTime.milliseconds),
              end: new Date(dateProfile.activeRange.end.valueOf() + dateProfile.slotMaxTime.milliseconds - 864e5),
            }
          : dateProfile.activeRange

        for (let key of keys) {
          let oracle = sliceEventStore(subsetStore(eventStore, key, laneName), data.eventUiBases, framing, nextDayThreshold)

          expect(describeRanges(rangesOfSegs(res[key].fg))).withContext(`fg ${key}`)
            .toEqual(describeRanges(oracle.fg.filter((range) => sliceRangeToCoords(range.range, model.daySeries, model.dayCols, lane).length)))
          expect(describeRanges(rangesOfSegs(res[key].bg))).withContext(`bg ${key}`)
            .toEqual(describeRanges(oracle.bg.filter((range) => sliceRangeToCoords(range.range, model.daySeries, model.dayCols, lane).length)))
        }

        // the single event (parsed first) comes before the recurring instance of the same time
        let aTitles = res.a.fg.filter((seg) => seg.eventRange.def.title === 'Tie').map((seg) => seg.eventRange.def.publicId)
        if (laneName !== 'allDay') {
          expect(aTitles[0]).toBe('single')
        }
        // the inverse complements come last
        let aBg = res.a.bg
        if (aBg.length) {
          expect(aBg[aBg.length - 1].eventRange.instance).toBe(null)
        }
      })
    }

    it('gives each requested key its own bucket, and none for others', () => {
      let calendar = buildCalendar('dayGridMonth')
      let data = calendar.getCurrentData()
      let model = buildDayGridModel(data.dateProfile, data.dateProfileGenerator.hiddenDays, data.dateEnv)
      let res = sliceDayTableEvents(
        data.renderableEventStore, ['b'], { b: data.eventUiBases }, keysForEventDef,
        model.daySeries, model.dayCols, DAY_GRID_LANE, data.dateProfile, createDuration('00:00'),
      )

      expect(Object.keys(res)).toEqual(['b'])
      expect(res.b.fg.every((seg) => keysForEventDef(seg.eventRange.def).indexOf('b') !== -1)).toBe(true)
    })
  })

  describe('event ui bases', () => {
    it('combines the calendar base, the key\'s ui, and the key\'s individual bases', () => {
      let calendarBase = ui({ color: 'red', className: 'cal' })
      let keyUi = ui({ color: 'blue', className: 'key' })
      let individual = { def0: ui({ color: 'green' }) }
      let bases = buildEventUiForKey(calendarBase, keyUi, individual)

      expect(bases[''].color).toBe('blue')
      expect(bases[''].className).toContain('cal')
      expect(bases[''].className).toContain('key')
      expect(bases.def0).toBe(individual.def0)
    })

    it('partitions individual bases by key and lane, by current-store membership', () => {
      let defs = {
        d0: def('d0', false, ['a']),
        d1: def('d1', true, ['a', 'b']),
        d2: def('d2', true, ['']),
      }
      let keysFor = (d) => d.keys
      let defKeys = buildDefKeys(defs as any, keysFor)
      let uiBases = { '': ui({}), d0: ui({ color: 'x' }), d1: ui({ color: 'y' }), d2: ui({ color: 'z' }), gone: ui({}) }

      let any = splitIndividualUi(uiBases, defKeys, defs as any, DAY_GRID_LANE)
      expect(Object.keys(any.a).sort()).toEqual(['d0', 'd1'])
      expect(Object.keys(any.b)).toEqual(['d1'])
      expect(Object.keys(any[''])).toEqual(['d2'])

      let timed = splitIndividualUi(uiBases, defKeys, defs as any, TIME_GRID_TIMED_LANE)
      expect(Object.keys(timed.a)).toEqual(['d0'])
      expect(timed.b).toBeUndefined()

      let allDay = splitIndividualUi(uiBases, defKeys, defs as any, TIME_GRID_ALL_DAY_LANE)
      expect(Object.keys(allDay.a)).toEqual(['d1'])
    })

    function def(defId, allDay, keys) {
      return { defId, allDay, keys, ui: { display: null } }
    }
  })

  describe('projection', () => {
    /*
    Three dates. Resources above dates: a owns dates 0 and 2 (date 1 filtered out), b owns 0-2, c
    participates but owns nothing. Plus a placeholder column for date 1 in its own group.
    Column order: a0 a2 | b0 b1 b2 | (placeholder) 1
    */
    const RULES = {
      fg: 'none',
      interactionSegs: 'keyedOnly',
      interactionMetadata: 'excluded',
      interactionActivation: 'keyedOnly',
      eventSelection: 'membership',
    }
    const KEYING = {
      keys: ['a', 'b', 'c'],
      keysForEventDef: (d) => d.keys,
      keyForDateSpan: (span) => span.resourceId || '',
      uiByKey: {},
      businessHoursByKey: {},
      keylessRules: RULES,
    }

    function buildModel() {
      let dates = [utc('2024-01-01'), utc('2024-01-02'), utc('2024-01-03')]
      let dayCols = dates.map((date, dateI) => ({
        key: String(dateI), date, range: { start: date, end: new Date(date.valueOf() + 864e5) },
        isMajor: false, isDisabled: false, dateI, entityKey: '', entity: null, groupI: 0,
      }))
      let col = (dateI, entityKey, groupI) => ({ ...dayCols[dateI], key: entityKey + dateI, dateI, entityKey, groupI })
      let groups = [
        { key: 'a', cols: [col(0, 'a', 0), col(2, 'a', 0)] },
        { key: 'b', cols: [col(0, 'b', 1), col(1, 'b', 1), col(2, 'b', 1)] },
        { key: '1', cols: [col(1, '', 2)] },
      ]
      let series = buildDaySeries({ start: dates[0], end: utc('2024-01-04') }, { isHidden: () => false, skip: (d) => d, trim: (r) => r })
      return buildModelFromCols(series, dayCols, 1, groups as any, null, ['a', 'b', 'c'], false)
    }

    function dayGridSeg(name, start, end) {
      return { row: 0, start, end, isStart: true, isEnd: true, eventRange: { name } } as any
    }

    function summarize(segs) {
      return segs.map((seg) => [seg.eventRange.name, seg.start, seg.end, seg.isStart, seg.isEnd])
    }

    it('splits at missing columns and group boundaries', () => {
      let model = buildModel()

      expect(computeDayTableColRanges(model, 0, 3, 'a')).toEqual([
        { start: 0, end: 1, isStart: true, isEnd: false },
        { start: 1, end: 2, isStart: false, isEnd: true }, // a2 follows a0 but date 1 is missing
      ])
      expect(computeDayTableColRanges(model, 0, 3, 'b')).toEqual([
        { start: 2, end: 5, isStart: true, isEnd: true },
      ])
      expect(computeDayTableColRanges(model, 0, 3, 'c')).toEqual([])
      expect(computeDayTableColRanges(model, 0, 3, '')).toEqual([
        { start: 5, end: 6, isStart: false, isEnd: false },
      ])
    })

    it('puts keyed segs in their columns and keyless ones per category', () => {
      let model = buildModel()
      let transform = getDayTableSegTransform(DAY_GRID_LANE)
      let buckets = {
        a: [dayGridSeg('A', 0, 3)],
        b: [dayGridSeg('B', 1, 2)],
        c: [dayGridSeg('C', 0, 3)],
        '': [dayGridSeg('K', 0, 3)],
      }

      expect(summarize(projectDayTableSegs(buckets, model, KEYING as any, 'fg', transform))).toEqual([
        ['A', 0, 1, true, false], ['A', 1, 2, false, true],
        ['B', 3, 4, true, true],
      ])
      expect(summarize(projectDayTableSegs(buckets, model, KEYING as any, 'bg', transform))).toEqual([
        ['A', 0, 1, true, false], ['A', 1, 2, false, true],
        ['K', 0, 1, true, false], ['K', 1, 2, false, true],
        ['B', 3, 4, true, true],
        ['K', 2, 5, true, true],
        ['K', 5, 6, false, false],
      ])
      expect(summarize(projectDayTableSegs(buckets, model, KEYING as any, 'businessHours', transform))).toEqual([
        ['A', 0, 1, true, false], ['A', 1, 2, false, true],
        ['B', 3, 4, true, true],
        ['K', 5, 6, false, false],
      ])
    })

    it('ANDs the seg\'s own isStart/isEnd with the column range\'s', () => {
      let model = buildModel()
      let seg = { ...dayGridSeg('B', 0, 3), isStart: false }
      let segs = projectDayTableSegs({ a: [], b: [seg], c: [], '': [] }, model, KEYING as any, 'fg', getDayTableSegTransform(DAY_GRID_LANE))

      expect(summarize(segs)).toEqual([['B', 2, 5, false, true]])
      expect(segs[0].eventRange).toBe(seg.eventRange)
    })

    it('drops timeGrid segs with no column', () => {
      let model = buildModel()
      let seg = (name, col) => ({ col, startDate: utc('2024-01-01'), endDate: utc('2024-01-01'), isStart: true, isEnd: true, eventRange: { name } }) as any
      let segs = projectDayTableSegs(
        { a: [seg('A', 1), seg('A', 2)], b: [], c: [seg('C', 0)], '': [] },
        model, KEYING as any, 'fg', getDayTableSegTransform(TIME_GRID_TIMED_LANE),
      )

      expect(segs.map((s: any) => [s.eventRange.name, s.col])).toEqual([['A', 1]])
    })

    it('merges only keyed interaction metadata, and needs a keyed entry to activate', () => {
      let model = buildModel()
      let transform = getDayTableSegTransform(DAY_GRID_LANE)
      let keyless = { segs: [dayGridSeg('K', 1, 2)], affectedInstances: { k: {} }, isEvent: true } as any
      let keyedC = { segs: [], affectedInstances: { c: {} }, isEvent: false } as any

      expect(projectDayTableInteraction({ a: null, b: null, c: null, '': keyless }, model, KEYING as any, transform)).toBe(null)

      let res = projectDayTableInteraction({ a: null, b: null, c: keyedC, '': keyless }, model, KEYING as any, transform)
      expect(Object.keys(res.affectedInstances)).toEqual(['c']) // active through c, which owns no column
      expect(res.isEvent).toBe(false)
      expect(summarize(res.segs)).toEqual([['K', 3, 4, true, true]]) // keyless segs in keyed columns only
    })

    it('returns stage 1\'s arrays as they are for the plain keying', () => {
      let bucket = [dayGridSeg('A', 0, 1)]
      let entry = { segs: [], affectedInstances: {}, isEvent: true }
      let model = buildModel()

      expect(projectDayTableSegs({ '': bucket }, model, PLAIN_KEYING, 'fg', getDayTableSegTransform(DAY_GRID_LANE))).toBe(bucket)
      expect(projectDayTableInteraction({ '': entry }, model, PLAIN_KEYING, getDayTableSegTransform(DAY_GRID_LANE))).toBe(entry)
    })
  })
})

function utc(str: string): Date {
  return new Date(str + 'T00:00:00Z')
}

function ui(props) {
  return {
    display: null,
    startEditable: null,
    durationEditable: null,
    constraints: [],
    overlap: null,
    allows: [],
    color: '',
    contrastColor: '',
    className: '',
    ...props,
  }
}
