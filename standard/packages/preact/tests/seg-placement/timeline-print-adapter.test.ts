import { describe, expect, it } from 'vitest'
import { type DateEnv } from '../../src/protected-api'
import {
  buildTimelinePrintLayout,
  buildTimelinePrintPlan,
} from '../../../../../premium/packages/preact-scheduler/src/timeline/print-adapter'
import {
  buildTimelineSegSources,
  type TimelineEventSeg,
} from '../../../../../premium/packages/preact-scheduler/src/timeline/seg-placement-adapter'
import {
  type TimelineDateProfile,
} from '../../../../../premium/packages/preact-scheduler/src/timeline/timeline-date-profile'

const MS_PER_HOUR = 60 * 60 * 1000
const MS_PER_DAY = 24 * MS_PER_HOUR
const EMPTY_DATE_ENV = {} as DateEnv

describe('Timeline print adapter', () => {
  it('preserves logical levels and lateral geometry in print bands', () => {
    const plan = buildTimelinePrintPlan(
      [
        makeTimedSeg('left', 0, 2 * MS_PER_HOUR),
        makeTimedSeg('overlap', MS_PER_HOUR, 3 * MS_PER_HOUR),
        makeTimedSeg('right', 2 * MS_PER_HOUR, 4 * MS_PER_HOUR),
      ],
      EMPTY_DATE_ENV,
      uniformTimedProfile(4),
      60,
      undefined,
      false,
    )
    const layout = buildTimelinePrintLayout(
      plan,
      new Map([
        ['left', 11],
        ['overlap', 13],
        ['right', 17],
      ]),
      new Map(),
    )

    expect(layout.eventBands.map((band) => ({
      levelIndex: band.levelIndex,
      thickness: band.thickness,
      slices: band.slices.map((slice) => ({
        key: slice.sourceSeg.key,
        start: slice.start,
        end: slice.end,
      })),
    }))).toEqual([
      {
        levelIndex: 0,
        thickness: 17,
        slices: [
          { key: 'left', start: 0, end: 120 },
          { key: 'right', start: 120, end: 240 },
        ],
      },
      {
        levelIndex: 1,
        thickness: 13,
        slices: [{ key: 'overlap', start: 60, end: 180 }],
      },
    ])
    expect(layout.moreLinkBand).toBeNull()
  })

  it('uses sparse fallbacks and permits measured bands to grow and shrink', () => {
    const plan = buildTimelinePrintPlan(
      [
        makeTimedSeg('left', 0, 2 * MS_PER_HOUR),
        makeTimedSeg('overlap', MS_PER_HOUR, 3 * MS_PER_HOUR),
        makeTimedSeg('right', 2 * MS_PER_HOUR, 4 * MS_PER_HOUR),
      ],
      EMPTY_DATE_ENV,
      uniformTimedProfile(4),
      60,
    )

    expect(buildTimelinePrintLayout(plan, new Map(), new Map())
      .eventBands.map((band) => band.thickness)).toEqual([20, 20])
    expect(buildTimelinePrintLayout(
      plan,
      new Map([['left', 35]]),
      new Map(),
    ).eventBands.map((band) => band.thickness)).toEqual([35, 20])
    expect(buildTimelinePrintLayout(
      plan,
      new Map([
        ['left', 8],
        ['right', 9],
        ['overlap', 6],
      ]),
      new Map(),
    ).eventBands.map((band) => band.thickness)).toEqual([9, 6])
  })

  it('groups overlapping hides, separates adjacency, and appends one link band', () => {
    const profile = uniformTimedProfile(4)
    const baseSegs = Array.from({ length: 200 }, (_value, index) =>
      makeTimedSeg(`base-${index}`, 0, 4 * MS_PER_HOUR),
    )
    const hiddenOverlapA = makeTimedSeg('hidden-a', 0, 1.5 * MS_PER_HOUR)
    const hiddenOverlapB = makeTimedSeg('hidden-b', MS_PER_HOUR, 2 * MS_PER_HOUR)
    const hiddenAdjacent = makeTimedSeg('hidden-c', 2 * MS_PER_HOUR, 3 * MS_PER_HOUR)
    const plan = buildTimelinePrintPlan(
      [...baseSegs, hiddenOverlapA, hiddenOverlapB, hiddenAdjacent],
      EMPTY_DATE_ENV,
      profile,
      60,
    )

    expect(plan.levels).toHaveLength(200)
    expect(plan.hiddenSlices).toHaveLength(3)
    expect(plan.moreLinkGroups.map((group) => ({
      start: group.start,
      end: group.end,
      segs: group.hiddenSlices.map((slice) => slice.sourceSeg.key),
    }))).toEqual([
      { start: 0, end: 120, segs: ['hidden-a', 'hidden-b'] },
      { start: 120, end: 180, segs: ['hidden-c'] },
    ])

    const fallbackLayout = buildTimelinePrintLayout(
      plan,
      new Map(),
      new Map([[plan.moreLinkGroups[0].key, 7]]),
    )
    expect(fallbackLayout.eventBands).toHaveLength(200)
    expect(fallbackLayout.moreLinkBand).toMatchObject({ thickness: 20 })
    expect(fallbackLayout.moreLinkBand?.moreLinkGroups).toHaveLength(2)

    const measuredLayout = buildTimelinePrintLayout(
      plan,
      new Map(),
      new Map([
        [plan.moreLinkGroups[0].key, 7],
        [plan.moreLinkGroups[1].key, 32],
      ]),
    )
    expect(measuredLayout.eventBands).toHaveLength(200)
    expect(measuredLayout.moreLinkBand?.thickness).toBe(32)
  })

  it('caps mutually overlapping event bands at 200 and groups the remainder', () => {
    const segs = Array.from({ length: 205 }, (_value, index) =>
      makeTimedSeg(`event-${index}`, 0, MS_PER_HOUR),
    )
    const plan = buildTimelinePrintPlan(
      segs,
      EMPTY_DATE_ENV,
      uniformTimedProfile(1),
      60,
    )
    const layout = buildTimelinePrintLayout(plan, new Map(), new Map())

    expect(plan.mountedSegs).toHaveLength(200)
    expect(plan.hiddenSlices).toHaveLength(5)
    expect(plan.moreLinkGroups).toHaveLength(1)
    expect(plan.moreLinkGroups[0].count).toBe(5)
    expect(layout.eventBands).toHaveLength(200)
    expect(layout.moreLinkBand).not.toBeNull()
  })

  it('uses complete production-projected coordinates without viewport clipping', () => {
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
    const printPlan = buildTimelinePrintPlan(
      [spanning],
      dateEnv,
      profile,
      100,
    )
    const screenClippedSources = buildTimelineSegSources(
      [spanning],
      undefined,
      dateEnv,
      profile,
      100,
      50,
      150,
    )

    expect(printPlan.levels[0][0]).toMatchObject({
      sourceSeg: { key: 'spanning' },
      start: 0,
      end: 200,
    })
    expect(screenClippedSources[0]).toMatchObject({
      start: 0,
      end: 100,
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
  return {
    slotDuration: duration({ milliseconds: MS_PER_HOUR }),
    snapDuration: duration({ milliseconds: MS_PER_HOUR }),
    snapsPerSlot: 1,
    timeAxis: {
      slots: Array.from({ length: slotCount }, (_value, index) => ({
        date: new Date(index * MS_PER_HOUR),
        key: String(index),
        startMs: index * MS_PER_HOUR,
        endMs: (index + 1) * MS_PER_HOUR,
      })),
      snapStepMs: MS_PER_HOUR,
    },
    isTimeScale: true,
    snapDiffToIndex: [],
    snapCnt: slotCount,
    slotCnt: slotCount,
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
