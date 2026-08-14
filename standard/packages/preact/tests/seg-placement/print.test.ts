import { describe, expect, it } from 'vitest'
import {
  type PlacementLevel,
  type SliceOptions,
  groupHiddenSlices,
} from '../../src/seg-placement/layout'
import {
  DEFAULT_PRINT_MAX_LEVELS,
  buildPrintEventBands,
  buildPrintMoreLinkBand,
  planPrintDomCandidates,
} from '../../src/seg-placement/print'
import { type UnorderedSeg, stampEventOrder } from './test-utils'

interface TestEvent {
  id: string
}

const NO_SLICING: SliceOptions = {
  orderStrict: false,
  eventSlicing: false,
  maxSlices: 3,
}

describe('print event bands', () => {
  it('uses measured thicknesses and the 20px fallback within one level', () => {
    const plan = planPrintDomCandidates(stampEventOrder([
      seg('measured', 0, 1),
      seg('fallback', 1, 2),
    ]), NO_SLICING)
    const bands = buildPrintEventBands(
      plan.levels,
      new Map([['measured', 12]]),
    )

    expect(bands).toHaveLength(1)
    expect(bands[0].slices.map((slice) => slice.sourceSeg.key)).toEqual([
      'measured',
      'fallback',
    ])
    expect(bands[0].thickness).toBe(20)
  })

  it('uses the maximum slice thickness and follows both growth and shrinkage', () => {
    const plan = planPrintDomCandidates(stampEventOrder([
      seg('a', 0, 1),
      seg('b', 1, 2),
      seg('c', 2, 3),
    ]), NO_SLICING)

    expect(buildPrintEventBands(
      plan.levels,
      new Map([['a', 8], ['b', 9], ['c', 7]]),
    )[0].thickness).toBe(9)
    expect(buildPrintEventBands(
      plan.levels,
      new Map([['a', 12], ['b', 30], ['c', 18]]),
    )[0].thickness).toBe(30)
    expect(buildPrintEventBands(
      plan.levels,
      new Map([['a', 6], ['b', 8], ['c', 7]]),
    )[0].thickness).toBe(8)
  })

  it('omits empty and sparse levels while preserving source level indices', () => {
    const sourceLevel = planPrintDomCandidates(
      stampEventOrder([seg('only', 0, 1)]),
      NO_SLICING,
    ).levels[0]
    const levels: PlacementLevel<TestEvent>[] = []
    levels[0] = []
    levels[2] = sourceLevel

    const bands = buildPrintEventBands(levels, new Map())

    expect(bands).toHaveLength(1)
    expect(bands[0]).toMatchObject({ levelIndex: 2, thickness: 20 })
    expect(bands[0].slices[0].sourceSeg.key).toBe('only')
  })
})

describe('print DOM planning', () => {
  it('applies the default 200-level safety cap to the complete source list', () => {
    const segs = stampEventOrder(Array.from(
      { length: DEFAULT_PRINT_MAX_LEVELS + 5 },
      (_, index) => seg(String(index), 0, 1),
    ))
    const plan = planPrintDomCandidates(segs, NO_SLICING)

    expect(plan.levels).toHaveLength(DEFAULT_PRINT_MAX_LEVELS)
    expect(plan.visiblePlacements).toHaveLength(DEFAULT_PRINT_MAX_LEVELS)
    expect(plan.hiddenSlices).toHaveLength(5)
    expect(plan.mountedSegs).toHaveLength(DEFAULT_PRINT_MAX_LEVELS)
    expect(plan.mountedSegs.map((item) => item.key)).toEqual(
      segs.slice(0, DEFAULT_PRINT_MAX_LEVELS).map((item) => item.key),
    )
    expect(plan.hiddenSlices.map((item) => item.sourceSeg.key)).toEqual(
      segs.slice(DEFAULT_PRINT_MAX_LEVELS).map((item) => item.key),
    )
  })

  it('accepts a smaller internal cap for direct planning', () => {
    const segs = stampEventOrder(Array.from(
      { length: 5 },
      (_, index) => seg(String(index), 0, 1),
    ))
    const plan = planPrintDomCandidates(segs, NO_SLICING, 2)

    expect(plan.levels).toHaveLength(2)
    expect(plan.visiblePlacements).toHaveLength(2)
    expect(plan.hiddenSlices).toHaveLength(3)
    expect(plan.mountedSegs.map((item) => item.key)).toEqual(['0', '1'])
  })
})

describe('Timeline print more-link band', () => {
  it('returns null without hidden groups', () => {
    expect(buildPrintMoreLinkBand([], new Map())).toBeNull()
  })

  it('uses fallback and measured maxima and allows the band to shrink', () => {
    const hiddenPlan = planPrintDomCandidates(stampEventOrder([
      seg('left-hidden', 0, 1),
      seg('right-hidden', 2, 3),
    ]), NO_SLICING, 0)
    const groups = groupHiddenSlices(hiddenPlan.hiddenSlices)

    expect(buildPrintMoreLinkBand(
      groups,
      new Map([[groups[0].key, 12]]),
    )?.thickness).toBe(20)
    expect(buildPrintMoreLinkBand(
      groups,
      new Map(groups.map((group, index) => [
        group.key,
        28 + index * 4,
      ] as const)),
    )?.thickness).toBe(32)
    expect(buildPrintMoreLinkBand(
      groups,
      new Map(groups.map((group, index) => [
        group.key,
        8 + index,
      ] as const)),
    )?.thickness).toBe(9)
  })

  it('adds a final link band without consuming a capped event level', () => {
    const plan = planPrintDomCandidates(stampEventOrder([
      seg('visible-a', 0, 1),
      seg('visible-b', 0, 1),
      seg('hidden', 0, 1),
    ]), NO_SLICING, 2)
    const eventBands = buildPrintEventBands(plan.levels, new Map())
    const groups = groupHiddenSlices(plan.hiddenSlices)
    const linkBand = buildPrintMoreLinkBand(groups, new Map())

    expect(eventBands).toHaveLength(2)
    expect(plan.visiblePlacements).toHaveLength(2)
    expect(plan.mountedSegs).toHaveLength(2)
    expect(groups).toHaveLength(1)
    expect(linkBand).toMatchObject({ thickness: 20, moreLinkGroups: groups })
  })
})

function seg(
  id: string,
  start: number,
  end: number,
): UnorderedSeg<TestEvent> {
  return {
    key: id,
    meta: { id },
    start,
    end,
    isStart: true,
    isEnd: true,
  }
}
