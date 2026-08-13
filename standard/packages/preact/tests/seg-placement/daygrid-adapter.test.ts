import { describe, expect, it } from 'vitest'
import { createWholeSlice } from '../../src/seg-placement/layout'
import {
  type DayGridEventSeg,
  buildDayGridPopoverSegs,
  buildDayGridSegPlacementPlan,
  buildDayGridSegPlacements,
  buildDayGridSegSources,
  computeDayGridDomCandidateMaxLevels,
  createDayGridPlacementOwnerState,
  observeDayGridEventAreaHeight,
  observeDayGridEventHeight,
  observeDayGridMoreLinkHeight,
} from '../../src/daygrid/seg-placement-adapter'

describe('DayGrid production placement adapter', () => {
  it('builds integer-column sources with stable production identity and order', () => {
    const first = makeSeg('first', 1, 3, { isEnd: false })
    const second = makeSeg('second', 0, 1, { isStart: false })
    const sources = buildDayGridSegSources([first, second])

    expect(sources).toMatchObject([
      {
        key: 'first:1',
        start: 1,
        end: 3,
        isStart: true,
        isEnd: false,
        orderIndex: 0,
      },
      {
        key: 'second:0',
        start: 0,
        end: 1,
        isStart: false,
        isEnd: true,
        orderIndex: 1,
      },
    ])
    expect(sources[0].meta).toBe(first)
    expect(sources[1].meta).toBe(second)
  })

  it('collapses provisional slices back to complete mounted sources', () => {
    const plan = buildDayGridSegPlacementPlan([
      makeSeg('left-blocker', 0, 1),
      makeSeg('provisionally-sliced', 0, 2),
      makeSeg('never-mounted', 0, 1),
    ], 1, false, true)

    expect(plan.mountedSegs.map((source) => source.key)).toEqual([
      'left-blocker:0',
      'provisionally-sliced:0',
    ])
    expect(plan.mountedSegs[1]).toMatchObject({
      start: 0,
      end: 2,
      isStart: true,
      isEnd: true,
    })
    expect(plan.unmountedSlices).toHaveLength(1)
    expect(plan.unmountedSlices[0]).toMatchObject({
      start: 0,
      end: 1,
      sourceSeg: { key: 'never-mounted:0' },
    })
  })

  it('repositions complete measured wrappers and federates final slices by start column', () => {
    const plan = buildDayGridSegPlacementPlan([
      makeSeg('left', 0, 1),
      makeSeg('wide', 0, 2),
    ], Infinity, false, true)
    const result = buildDayGridSegPlacements(
      plan,
      new Map([
        ['left:0', 10],
        ['wide:0', 10],
      ]),
      {
        levelCoordLimit: 10,
        columnCount: 2,
      },
    )!

    expect(result.limited.moreLinkCounts).toEqual([1, 0])
    expect(result.columns[0].placements).toMatchObject([{
      sourceKey: 'left:0',
      top: 0,
      thickness: 10,
      isWhole: true,
      seg: { start: 0, end: 1 },
    }])
    expect(result.columns[1].placements).toMatchObject([{
      sourceKey: 'wide:0',
      top: 0,
      thickness: 10,
      isWhole: false,
      seg: { start: 1, end: 2, isSlice: true },
    }])
    expect(segIds(result.columns[0].segs)).toEqual(['left', 'wide'])
    expect(segIds(result.columns[0].hiddenSegs)).toEqual(['wide'])
    expect(segIds(result.columns[1].segs)).toEqual(['wide'])
    expect(result.columns[1].hiddenSegs).toEqual([])
  })

  it('waits for every mounted source wrapper to report its occupied height', () => {
    const plan = buildDayGridSegPlacementPlan([
      makeSeg('a', 0, 1),
      makeSeg('b', 0, 1),
    ], 2, false, false)

    expect(buildDayGridSegPlacements(
      plan,
      new Map([['a:0', 10]]),
      { maxLevels: 2, columnCount: 1 },
    )).toBeNull()
  })

  it('unions candidate and measured hides, deduplicates, and restores event order', () => {
    const plan = buildDayGridSegPlacementPlan([
      makeSeg('first', 0, 1),
      makeSeg('wide-second', 0, 2),
      makeSeg('unmounted-third', 0, 1),
    ], 1, false, true)
    const sources = new Map(plan.sourceSegs.map((source) => [source.key, source]))
    const measuredHidden = [
      createWholeSlice(sources.get('unmounted-third:0')!),
      createWholeSlice(sources.get('first:0')!),
      createWholeSlice(sources.get('wide-second:0')!),
    ]
    const left = buildDayGridPopoverSegs(plan, measuredHidden, 0, 2)
    const right = buildDayGridPopoverSegs(plan, measuredHidden, 1, 2)

    expect(segIds(left.segs)).toEqual(['first', 'wide-second', 'unmounted-third'])
    expect(segIds(left.hiddenSegs)).toEqual(['first', 'wide-second', 'unmounted-third'])
    expect(segIds(right.segs)).toEqual(['wide-second'])
    expect(segIds(right.hiddenSegs)).toEqual(['wide-second'])
    expect(left.hiddenSegs.find((seg) => segId(seg) === 'wide-second')).toMatchObject({
      start: 0,
      end: 1,
      isStart: true,
      isEnd: false,
    })
    expect(right.hiddenSegs[0]).toMatchObject({
      start: 1,
      end: 2,
      isStart: false,
      isEnd: true,
    })
  })
})

describe('DayGridRows placement owner state', () => {
  it('aggregates extrema across rows and grows the candidate frontier monotonically', () => {
    const initial = createDayGridPlacementOwnerState()
    const afterTallEvent = observeDayGridEventHeight(initial, 30)
    const afterTallArea = observeDayGridEventAreaHeight(afterTallEvent, 220)
    const afterShortEvent = observeDayGridEventHeight(afterTallArea, 10)

    expect(initial).toEqual({
      smallestEventHeight: null,
      largestEventAreaHeight: null,
      maxDomLevels: 8,
      largestMoreLinkHeight: 0,
    })
    expect(afterTallEvent).toMatchObject({
      smallestEventHeight: 30,
      maxDomLevels: 8,
    })
    expect(afterTallArea).toMatchObject({
      largestEventAreaHeight: 220,
      maxDomLevels: 8,
    })
    expect(afterShortEvent).toMatchObject({
      smallestEventHeight: 10,
      largestEventAreaHeight: 220,
      maxDomLevels: 22,
    })
    expect(observeDayGridEventHeight(afterShortEvent, 40)).toBe(afterShortEvent)
    expect(observeDayGridEventAreaHeight(afterShortEvent, 100)).toBe(afterShortEvent)
  })

  it('keeps one parent-wide monotone more-link maximum', () => {
    const initial = createDayGridPlacementOwnerState()
    const first = observeDayGridMoreLinkHeight(initial, 12)

    expect(first.largestMoreLinkHeight).toBe(12)
    expect(observeDayGridMoreLinkHeight(first, 5)).toBe(first)
    expect(observeDayGridMoreLinkHeight(first, 18).largestMoreLinkHeight).toBe(18)
  })

  it('uses explicit numeric caps, the auto frontier, and no cap for unlimited rows', () => {
    expect(computeDayGridDomCandidateMaxLevels(undefined, undefined, 9)).toBe(Infinity)
    expect(computeDayGridDomCandidateMaxLevels(3, 7, 9)).toBe(3)
    expect(computeDayGridDomCandidateMaxLevels(undefined, 4, 9)).toBe(4)
    expect(computeDayGridDomCandidateMaxLevels(true, 4, 9)).toBe(9)
    expect(computeDayGridDomCandidateMaxLevels(3, true, 9)).toBe(9)
  })
})

function makeSeg(
  instanceId: string,
  start: number,
  end: number,
  boundaries: { isStart?: boolean, isEnd?: boolean } = {},
): DayGridEventSeg {
  return {
    start,
    end,
    isStart: boundaries.isStart ?? true,
    isEnd: boundaries.isEnd ?? true,
    eventRange: {
      instance: { instanceId },
    },
  } as DayGridEventSeg
}

function segIds(segs: DayGridEventSeg[]): string[] {
  return segs.map(segId)
}

function segId(seg: DayGridEventSeg): string {
  return seg.eventRange.instance.instanceId
}
