import { describe, expect, it } from 'vitest'
import { type DateEnv } from '../../src/protected-api'
import {
  buildTimelineSegPlacementPlan,
  buildTimelineSegPlacements,
  buildTimelineSegSources,
  computeTimelineCoordQuantum,
  type TimelineEventSeg,
} from '../../../../../premium/packages/preact-scheduler/src/timeline/seg-placement-adapter'
import {
  type TimelineDateProfile,
} from '../../../../../premium/packages/preact-scheduler/src/timeline/timeline-date-profile'

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
      meta: spanning,
    })
  })

  it('uses exact timed instants across unequal DST slot spans', () => {
    const profile = timedProfile([
      [0, MS_PER_HOUR],
      [MS_PER_HOUR, 3 * MS_PER_HOUR],
    ])
    const seg = makeTimedSeg(
      'dst',
      MS_PER_HOUR / 2,
      2 * MS_PER_HOUR,
    )
    const [source] = buildTimelineSegSources(
      [seg],
      undefined,
      EMPTY_DATE_ENV,
      profile,
      100,
    )

    expect(source.start).toBeCloseTo(50)
    expect(source.end).toBeCloseTo(150)
    expect(source.meta).toBe(seg)
  })

  it('applies clipping and eventMinWidth before endpoint normalization', () => {
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

  it('normalizes sub-resolution overlap only after production projection', () => {
    const profile = uniformTimedProfile(2)
    const before = makeTimedSeg('before', 0, MS_PER_HOUR)
    const after = makeTimedSeg(
      'after',
      MS_PER_HOUR - 1,
      2 * MS_PER_HOUR,
    )
    const plan = buildTimelineSegPlacementPlan(
      [before, after],
      EMPTY_DATE_ENV,
      profile,
      120,
    )
    const result = buildTimelineSegPlacements(
      plan,
      new Map([
        ['before', 10],
        ['after', 10],
      ]),
      new Map(),
    )

    expect(computeTimelineCoordQuantum(profile, 120)).toBe(2)
    expect(plan.mountedSegs[0].end).toBe(120)
    expect(plan.mountedSegs[1].start).toBe(120)
    expect(result.eventDomItems.map((item) => item.placement?.top))
      .toEqual([0, 0])
  })

  it('keeps permanent event nodes in temporal-start then resolved order', () => {
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
    const result = buildTimelineSegPlacements(
      plan,
      new Map(segs.map((seg) => [segKey(seg), 10])),
      new Map(),
    )

    expect(plan.mountedSegs.map((source) => source.key)).toEqual([
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
    expect(result.eventDomItems.find((item) => item.key === 'late')?.placement)
      .toMatchObject({ top: 0, height: 10 })
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

    expect(clippedPlan.mountedSegs.map((source) => source.start))
      .toEqual([0, 0])
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
    const result = buildTimelineSegPlacements(
      plan,
      new Map([
        ['first', 10],
        ['second', 20],
        ['third', 15],
      ]),
      new Map(),
    )
    const placements = placementByKey(result.eventDomItems)

    expect(placements.get('first')?.top).toBe(0)
    expect(placements.get('second')?.top).toBe(10)
    expect(placements.get('third')?.top).toBe(30)
  })

  it('keeps a measured-hidden candidate mounted as a null donor', () => {
    const profile = uniformTimedProfile(4)
    const plan = buildTimelineSegPlacementPlan(
      [
        makeTimedSeg('left', 0, 2 * MS_PER_HOUR),
        makeTimedSeg('wide', 0, 4 * MS_PER_HOUR),
        makeTimedSeg('right-tall', 2 * MS_PER_HOUR, 4 * MS_PER_HOUR),
      ],
      EMPTY_DATE_ENV,
      profile,
      60,
      undefined,
      undefined,
      2,
    )
    const result = buildTimelineSegPlacements(
      plan,
      new Map([
        ['left', 10],
        ['wide', 10],
        ['right-tall', 20],
      ]),
      new Map(),
    )

    expect(plan.mountedSegs.map((source) => source.key)).toEqual([
      'left',
      'wide',
      'right-tall',
    ])
    expect(result.eventDomItems.find((item) => item.key === 'right-tall'))
      .toMatchObject({ placement: null })
    expect(result.moreLinks).toHaveLength(1)
    expect(result.moreLinks[0]).toMatchObject({
      top: 20,
      segs: [plan.mountedSegs[2].meta],
    })
  })

  it('groups max-stack hides, separates adjacency, and tracks live link heights', () => {
    const profile = uniformTimedProfile(4)
    const segs = [
      makeTimedSeg('visible-left', 0, 2 * MS_PER_HOUR),
      makeTimedSeg('hidden-left', 0, 2 * MS_PER_HOUR),
      makeTimedSeg('visible-right', 2 * MS_PER_HOUR, 4 * MS_PER_HOUR),
      makeTimedSeg('hidden-right', 2 * MS_PER_HOUR, 4 * MS_PER_HOUR),
    ]
    const plan = buildTimelineSegPlacementPlan(
      segs,
      EMPTY_DATE_ENV,
      profile,
      60,
      undefined,
      undefined,
      1,
    )
    const segHeights = new Map([
      ['visible-left', 10],
      ['visible-right', 20],
    ])
    const beforeLinkMeasurement = buildTimelineSegPlacements(
      plan,
      segHeights,
      new Map(),
    )

    expect(plan.mountedSegs.map((source) => source.key)).toEqual([
      'visible-left',
      'visible-right',
    ])
    expect(beforeLinkMeasurement.moreLinks.map((link) => ({
      start: link.start,
      end: link.end,
      top: link.top,
      segs: link.segs.map(segKey),
    }))).toEqual([
      { start: 0, end: 120, top: 10, segs: ['hidden-left'] },
      { start: 120, end: 240, top: 20, segs: ['hidden-right'] },
    ])
    expect(beforeLinkMeasurement.contentHeight).toBe(20)

    const [leftLink, rightLink] = beforeLinkMeasurement.moreLinks
    const grown = buildTimelineSegPlacements(
      plan,
      segHeights,
      new Map([
        [leftLink.key, 12],
        [rightLink.key, 7],
      ]),
    )
    const shrunk = buildTimelineSegPlacements(
      plan,
      segHeights,
      new Map([
        [leftLink.key, 1],
        [rightLink.key, 2],
      ]),
    )

    expect(grown.contentHeight).toBe(27)
    expect(shrunk.contentHeight).toBe(22)
    expect(grown.eventDomItems).toEqual(shrunk.eventDomItems)
    expect(grown.moreLinks.map((link) => link.top))
      .toEqual(shrunk.moreLinks.map((link) => link.top))
  })

  it('keeps more-link keys stable across slot-width changes', () => {
    const profile = uniformTimedProfile(3)
    const visible = makeTimedSeg('visible', MS_PER_HOUR, 2 * MS_PER_HOUR)
    const hidden = makeTimedSeg('hidden', MS_PER_HOUR, 2 * MS_PER_HOUR)
    const segs = [visible, hidden]
    const narrow = buildTimelineSegPlacements(
      buildTimelineSegPlacementPlan(
        segs,
        EMPTY_DATE_ENV,
        profile,
        60,
        undefined,
        undefined,
        1,
      ),
      new Map([['visible', 10]]),
      new Map(),
    )
    const wide = buildTimelineSegPlacements(
      buildTimelineSegPlacementPlan(
        segs,
        EMPTY_DATE_ENV,
        profile,
        100,
        undefined,
        undefined,
        1,
      ),
      new Map([['visible', 10]]),
      new Map(),
    )

    expect(narrow.moreLinks).toHaveLength(1)
    expect(wide.moreLinks).toHaveLength(1)
    expect(narrow.moreLinks[0].key).toBe('hidden')
    expect(wide.moreLinks[0].key).toBe(narrow.moreLinks[0].key)
    expect(wide.moreLinks[0].end).not.toBe(narrow.moreLinks[0].end)
  })

  it('mounts only candidates and keeps them as null donors until measured', () => {
    const profile = uniformTimedProfile(1)
    const plan = buildTimelineSegPlacementPlan(
      [
        makeTimedSeg('candidate', 0, MS_PER_HOUR),
        makeTimedSeg('rejected', 0, MS_PER_HOUR),
      ],
      EMPTY_DATE_ENV,
      profile,
      60,
      undefined,
      undefined,
      1,
    )
    const result = buildTimelineSegPlacements(plan, new Map(), new Map())

    expect(result).toMatchObject({
      allHeightsSettled: false,
      contentHeight: 0,
      moreLinks: [],
    })
    expect(result.eventDomItems).toHaveLength(1)
    expect(result.eventDomItems[0]).toMatchObject({
      key: 'candidate',
      placement: null,
    })
  })
})

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

function placementByKey(
  items: ReturnType<typeof buildTimelineSegPlacements>['eventDomItems'],
): Map<string, NonNullable<(typeof items)[number]['placement']>> {
  const placements = new Map<
    string,
    NonNullable<(typeof items)[number]['placement']>
  >()
  for (const item of items) {
    if (item.placement) {
      placements.set(item.key, item.placement)
    }
  }
  return placements
}
