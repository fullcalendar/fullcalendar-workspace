import { describe, expect, it } from 'vitest'
import {
  type DateEnv,
  RefMap,
} from '@fullcalendar/preact/protected-api'
import {
  buildTimelineSegPlacementPlan,
  buildTimelineSegPlacements,
  buildTimelineSegSources,
  type TimelineEventSeg,
  type TimelineSegPlacementPlan,
} from '../../src/timeline/seg-placement-adapter'
import {
  type TimelineDateProfile,
} from '../../src/timeline/timeline-date-profile'

const MS_PER_HOUR = 60 * 60 * 1000
const MS_PER_DAY = 24 * MS_PER_HOUR
const EMPTY_DATE_ENV = {} as DateEnv

describe('Timeline production placement adapter', () => {
  it('projects whole-day civil coordinates without reviving hidden dates', () => {
    const start = new Date('2026-01-01T00:00:00Z')
    const profile = wholeDayProfile(start)
    const dateEnv = {
      countDurationsBetween(axisStart: Date, date: Date) {
        return (date.valueOf() - axisStart.valueOf()) / MS_PER_DAY
      },
    } as DateEnv
    const spanning = makeSeg(
      'spanning',
      start,
      new Date(start.valueOf() + 3 * MS_PER_DAY),
    )
    const hiddenOnly = makeSeg(
      'hidden-only',
      new Date(start.valueOf() + MS_PER_DAY),
      new Date(start.valueOf() + 2 * MS_PER_DAY),
    )
    const sources = buildTimelineSegSources(
      [spanning, hiddenOnly],
      undefined,
      dateEnv,
      profile,
      100,
    )

    expect(sources).toHaveLength(1)
    expect(sources[0]).toMatchObject({
      key: 'spanning',
      start: 0,
      end: 200,
      orderIndex: 0,
    })
    expect(sources[0].eventRange).toBe(spanning.eventRange)
  })

  it('uses exact timed instants across unequal DST slot spans', () => {
    const profile = timedProfile([
      [0, MS_PER_HOUR],
      [MS_PER_HOUR, 3 * MS_PER_HOUR],
    ])
    const seg = makeTimedSeg('dst', MS_PER_HOUR / 2, 2 * MS_PER_HOUR)
    const [source] = buildTimelineSegSources(
      [seg],
      undefined,
      EMPTY_DATE_ENV,
      profile,
      100,
    )

    expect(source.start).toBeCloseTo(50)
    expect(source.end).toBeCloseTo(150)
    expect(source.eventRange).toBe(seg.eventRange)
  })

  it('applies clipping and eventMinWidth when building sources', () => {
    const profile = uniformTimedProfile(1)
    const offscreen = makeTimedSeg('offscreen', 0, MS_PER_HOUR / 10)
    const clipped = makeTimedSeg(
      'clipped',
      MS_PER_HOUR / 2,
      MS_PER_HOUR * 0.6,
    )
    const sources = buildTimelineSegSources(
      [offscreen, clipped],
      30,
      EMPTY_DATE_ENV,
      profile,
      100,
      55,
      80,
    )

    expect(sources).toHaveLength(1)
    expect(sources[0]).toMatchObject({
      key: 'clipped',
      start: 0,
      end: 30,
      orderIndex: 1,
      isStart: true,
      isEnd: true,
    })
  })

  it('gives abutting segs a bit-identical boundary at awkward slot widths', () => {
    const profile = uniformTimedProfile(3)
    const boundaryMs = 2 * MS_PER_HOUR + 36 * 60 * 1000
    const sources = buildTimelineSegSources(
      [
        makeTimedSeg('before', MS_PER_HOUR, boundaryMs),
        makeTimedSeg('after', boundaryMs, 3 * MS_PER_HOUR),
      ],
      undefined,
      EMPTY_DATE_ENV,
      profile,
      20.01,
    )

    expect(sources[0].end).toBe(sources[1].start)
    expect(sources[0].end).not.toBeGreaterThan(sources[1].start)
  })

  it('tracks whether every input seg produced horizontal geometry', () => {
    const profile = uniformTimedProfile(2)
    const visible = makeTimedSeg('visible', MS_PER_HOUR, 2 * MS_PER_HOUR)
    const excluded = makeTimedSeg('excluded', 0, MS_PER_HOUR)

    expect(buildTimelineSegPlacementPlan(
      [visible, excluded],
      EMPTY_DATE_ENV,
      profile,
      60,
    ).allSegsProjected).toBe(true)
    expect(buildTimelineSegPlacementPlan(
      [visible, excluded],
      EMPTY_DATE_ENV,
      profile,
      60,
      undefined,
      undefined,
      undefined,
      60,
      120,
    ).allSegsProjected).toBe(false)
  })

  it('shares a level for exact adjacency and splits for any real overlap', () => {
    const profile = uniformTimedProfile(2)
    const placeAfterStartingAt = (afterStartMs: number) => {
      const plan = buildTimelineSegPlacementPlan(
        [
          makeTimedSeg('before', 0, MS_PER_HOUR),
          makeTimedSeg('after', afterStartMs, 2 * MS_PER_HOUR),
        ],
        EMPTY_DATE_ENV,
        profile,
        120,
      )
      const heights = new TimelineTestHeights([
        ['before', 10],
        ['after', 10],
      ])
      return [plan, place(plan, heights)] as const
    }

    const [adjacentPlan, adjacent] = placeAfterStartingAt(MS_PER_HOUR)
    expect(adjacentPlan.sourceSegs[0].end).toBe(120)
    expect(adjacentPlan.sourceSegs[1].start).toBe(120)
    expect(adjacent.eventDomItems.map((item) => item.top)).toEqual([0, 0])

    const [overlapPlan, overlapping] = placeAfterStartingAt(MS_PER_HOUR - 1)
    expect(overlapPlan.sourceSegs[1].start).toBeLessThan(120)
    expect(overlapping.eventDomItems.map((item) => item.top)).toEqual([0, 10])
  })

  it('keeps visible nodes in temporal-start then resolved order', () => {
    const profile = uniformTimedProfile(5)
    const segs = [
      makeTimedSeg('late', 3 * MS_PER_HOUR, 5 * MS_PER_HOUR),
      makeTimedSeg('tie-first', MS_PER_HOUR, 3 * MS_PER_HOUR),
      makeTimedSeg('early', 0, MS_PER_HOUR),
      makeTimedSeg('tie-second', MS_PER_HOUR, 2 * MS_PER_HOUR),
    ]
    const plan = buildTimelineSegPlacementPlan(
      segs,
      EMPTY_DATE_ENV,
      profile,
      60,
    )
    const result = place(
      plan,
      new TimelineTestHeights(segs.map((seg) => [segKey(seg), 10])),
    )

    expect(plan.sourceSegs.map((source) => source.key)).toEqual([
      'late',
      'tie-first',
      'early',
      'tie-second',
    ])
    expect(result.eventDomItems.map((item) => item.key)).toEqual([
      'early',
      'tie-first',
      'tie-second',
      'late',
    ])
    expect(result.eventDomItems.find((item) => item.key === 'late')?.top).toBe(0)
  })

  it('keeps temporal DOM order stable when clipping clamps distinct starts', () => {
    const profile = uniformTimedProfile(4)
    const later = makeTimedSeg(
      'later-resolved-first',
      MS_PER_HOUR,
      4 * MS_PER_HOUR,
    )
    const earlier = makeTimedSeg(
      'earlier-resolved-second',
      0,
      4 * MS_PER_HOUR,
    )
    const segs = [later, earlier]
    const fullPlan = buildTimelineSegPlacementPlan(
      segs,
      EMPTY_DATE_ENV,
      profile,
      60,
    )
    const clippedPlan = buildTimelineSegPlacementPlan(
      segs,
      EMPTY_DATE_ENV,
      profile,
      60,
      undefined,
      undefined,
      undefined,
      120,
      240,
    )

    expect(clippedPlan.sourceSegs.map((source) => source.start)).toEqual([0, 0])
    expect(fullPlan.domOrderedSegs.map((source) => source.key)).toEqual([
      'earlier-resolved-second',
      'later-resolved-first',
    ])
    expect(clippedPlan.domOrderedSegs.map((source) => source.key))
      .toEqual(fullPlan.domOrderedSegs.map((source) => source.key))
  })

  it('preserves resolved order geometrically when eventOrderStrict is true', () => {
    const profile = uniformTimedProfile(2)
    const segs = [
      makeTimedSeg('first', 0, MS_PER_HOUR),
      makeTimedSeg('second', 0, 2 * MS_PER_HOUR),
      makeTimedSeg('third', MS_PER_HOUR, 2 * MS_PER_HOUR),
    ]
    const plan = buildTimelineSegPlacementPlan(
      segs,
      EMPTY_DATE_ENV,
      profile,
      60,
      undefined,
      true,
    )
    const result = place(plan, new TimelineTestHeights([
      ['first', 10],
      ['second', 20],
      ['third', 15],
    ]))
    const tops = topByKey(result.eventDomItems)

    expect(tops.get('first')).toBe(0)
    expect(tops.get('second')).toBe(10)
    expect(tops.get('third')).toBe(30)
  })

  it('withholds positioning until exact heights exist and deletes on unmount', () => {
    const plan = buildTimelineSegPlacementPlan(
      [
        makeTimedSeg('first', 0, MS_PER_HOUR),
        makeTimedSeg('second', 0, MS_PER_HOUR),
      ],
      EMPTY_DATE_ENV,
      uniformTimedProfile(1),
      60,
    )
    const heights = new TimelineTestHeights()

    const unmeasured = place(plan, heights)
    expect(unmeasured.eventDomItems.map((item) => item.top)).toEqual([
      undefined,
      undefined,
    ])
    expect(unmeasured.contentHeight).toBe(0)
    expect(unmeasured.allHeightsSettled).toBe(false)

    heights.set('first', 30)
    const partiallyMeasured = place(plan, heights)
    expect(partiallyMeasured.eventDomItems.map((item) => item.top)).toEqual([
      0,
      undefined,
    ])
    expect(partiallyMeasured.contentHeight).toBe(30)
    expect(partiallyMeasured.allHeightsSettled).toBe(false)

    heights.set('second', 12)
    const exact = place(plan, heights)
    expect(exact.eventDomItems.map((item) => item.top)).toEqual([0, 30])
    expect(exact.contentHeight).toBe(42)
    expect(exact.allHeightsSettled).toBe(true)

    heights.map.createRef('first')(null)
    const remounted = place(plan, heights)
    expect(remounted.eventDomItems.map((item) => item.top)).toEqual([
      undefined,
      0,
    ])
    expect(remounted.contentHeight).toBe(12)
    expect(remounted.allHeightsSettled).toBe(false)
  })

  it('uses kernel hidden groups and positions tax-free links from the skyline', () => {
    const plan = buildTimelineSegPlacementPlan(
      [
        makeTimedSeg('visible-left', 0, MS_PER_HOUR),
        makeTimedSeg('visible-right', MS_PER_HOUR, 3 * MS_PER_HOUR),
        makeTimedSeg('hidden-a', 0, 2 * MS_PER_HOUR),
        makeTimedSeg('hidden-b', MS_PER_HOUR, 3 * MS_PER_HOUR),
      ],
      EMPTY_DATE_ENV,
      uniformTimedProfile(3),
      60,
      undefined,
      undefined,
      1,
    )
    const heights = new TimelineTestHeights([
      ['visible-left', 10],
      ['visible-right', 20],
    ])
    const beforeLinkMeasurement = place(plan, heights)

    expect(beforeLinkMeasurement.eventDomItems.map((item) => item.key)).toEqual([
      'visible-left',
      'visible-right',
    ])
    expect(beforeLinkMeasurement.moreLinks).toHaveLength(1)
    expect(beforeLinkMeasurement.moreLinks[0]).toMatchObject({
      start: 0,
      end: 180,
      top: 20,
    })
    expect(beforeLinkMeasurement.moreLinks[0].segs.map(segKey)).toEqual([
      'hidden-a',
      'hidden-b',
    ])
    expect(beforeLinkMeasurement.contentHeight).toBe(20)

    const linkKey = beforeLinkMeasurement.moreLinks[0].key
    expect(place(plan, heights, new Map([[linkKey, 12]])).contentHeight).toBe(32)
    expect(place(plan, heights, new Map([[linkKey, 2]])).contentHeight).toBe(22)
  })

  it('keeps adjacent hidden groups and their more-link keys separate', () => {
    const plan = buildTimelineSegPlacementPlan(
      [
        makeTimedSeg('visible-left', 0, 2 * MS_PER_HOUR),
        makeTimedSeg('hidden-left', 0, 2 * MS_PER_HOUR),
        makeTimedSeg('visible-right', 2 * MS_PER_HOUR, 4 * MS_PER_HOUR),
        makeTimedSeg('hidden-right', 2 * MS_PER_HOUR, 4 * MS_PER_HOUR),
      ],
      EMPTY_DATE_ENV,
      uniformTimedProfile(4),
      60,
      undefined,
      undefined,
      1,
    )
    const result = place(plan, new TimelineTestHeights([
      ['visible-left', 10],
      ['visible-right', 20],
    ]))

    expect(result.moreLinks.map((link) => ({
      key: link.key,
      start: link.start,
      end: link.end,
      top: link.top,
    }))).toEqual([
      { key: 'hidden-left', start: 0, end: 120, top: 10 },
      { key: 'hidden-right', start: 120, end: 240, top: 20 },
    ])
  })

  it('keeps more-link keys stable across slot-width changes', () => {
    const profile = uniformTimedProfile(3)
    const segs = [
      makeTimedSeg('visible', MS_PER_HOUR, 2 * MS_PER_HOUR),
      makeTimedSeg('hidden', MS_PER_HOUR, 2 * MS_PER_HOUR),
    ]
    const heights = new TimelineTestHeights([['visible', 10]])
    const narrow = place(buildTimelineSegPlacementPlan(
      segs,
      EMPTY_DATE_ENV,
      profile,
      60,
      undefined,
      undefined,
      1,
    ), heights)
    const wide = place(buildTimelineSegPlacementPlan(
      segs,
      EMPTY_DATE_ENV,
      profile,
      100,
      undefined,
      undefined,
      1,
    ), heights)

    expect(narrow.moreLinks).toHaveLength(1)
    expect(wide.moreLinks).toHaveLength(1)
    expect(narrow.moreLinks[0].key).toBe('hidden')
    expect(wide.moreLinks[0].key).toBe(narrow.moreLinks[0].key)
    expect(wide.moreLinks[0].end).not.toBe(narrow.moreLinks[0].end)
  })
})

class TimelineTestHeights {
  readonly map = new RefMap<string, number>(() => {})

  constructor(entries: [string, number][] = []) {
    for (const [key, height] of entries) this.set(key, height)
  }

  set(key: string, height: number): void {
    this.map.handleValue(height, key)
  }
}

function place(
  plan: TimelineSegPlacementPlan,
  heights: TimelineTestHeights,
  moreLinkHeights: ReadonlyMap<string, number> = new Map(),
) {
  return buildTimelineSegPlacements(
    plan,
    heights.map.current,
    moreLinkHeights,
  )
}

function wholeDayProfile(start: Date): TimelineDateProfile {
  return {
    slotDuration: duration({ days: 1 }),
    snapDuration: duration({ days: 1 }),
    snapsPerSlot: 1,
    normalizedRange: {
      start,
      end: new Date(start.valueOf() + 3 * MS_PER_DAY),
    },
    timeAxis: null,
    snapDiffToIndex: [0, 0.5, 1],
    snapCnt: 2,
    slotCnt: 2,
    isTimeScale: false,
  } as TimelineDateProfile
}

function uniformTimedProfile(slotCount: number): TimelineDateProfile {
  return timedProfile(Array.from({ length: slotCount }, (_value, index) => [
    index * MS_PER_HOUR,
    (index + 1) * MS_PER_HOUR,
  ]))
}

function timedProfile(slots: number[][]): TimelineDateProfile {
  return {
    slotDuration: duration({ milliseconds: MS_PER_HOUR }),
    snapDuration: duration({ milliseconds: MS_PER_HOUR }),
    snapsPerSlot: 1,
    timeAxis: {
      slots: slots.map(([startMs, endMs]) => ({
        date: new Date(startMs),
        key: String(startMs),
        startMs,
        endMs,
      })),
      snapStepMs: MS_PER_HOUR,
    },
    isTimeScale: true,
    snapDiffToIndex: [],
    snapCnt: slots.length,
    slotCnt: slots.length,
  } as TimelineDateProfile
}

function duration(input: Partial<{
  years: number
  months: number
  days: number
  milliseconds: number
}>): {
  years: number
  months: number
  days: number
  milliseconds: number
} {
  return {
    years: 0,
    months: 0,
    days: 0,
    milliseconds: 0,
    ...input,
  }
}

function makeTimedSeg(
  key: string,
  startMs: number,
  endMs: number,
): TimelineEventSeg {
  return {
    ...makeSeg(key, new Date(startMs), new Date(endMs)),
    startMs,
    endMs,
  }
}

function makeSeg(
  key: string,
  startDate: Date,
  endDate: Date,
): TimelineEventSeg {
  return {
    startDate,
    endDate,
    isStart: true,
    isEnd: true,
    eventRange: {
      instance: { instanceId: key },
      range: { start: startDate, end: endDate },
    },
  } as TimelineEventSeg
}

function segKey(seg: TimelineEventSeg): string {
  return seg.eventRange.instance.instanceId
}

function topByKey(
  items: ReturnType<typeof place>['eventDomItems'],
): Map<string, number | undefined> {
  return new Map(items.map((item) => [item.key, item.top]))
}
