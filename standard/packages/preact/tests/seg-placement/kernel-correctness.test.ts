import { describe, expect, it } from 'vitest'
import {
  GEOMETRY_TOLERANCE,
  type HiddenSliceGroup,
  type Slice,
  type SourceSeg,
  buildSegLevels,
  compilePixelLimitedRenderSlices,
  convertSegLevelsToWholeSlices,
  convertSegsToWholeSlices,
  getSliceKey,
  groupLaterallyIntersecting,
  mergeExtraIntoLevelCoords,
  mergeExtraIntoLevels,
  resolveLevelCoords,
} from '../../src/seg-placement/kernel'

interface TestMeta {
  id: string
}

describe('pure positioning kernel', () => {
  it('preserves rejection order and makes strict order part of topology', () => {
    const rejectedScenario = segs([
      ['first', 0, 3],
      ['second', 0, 1],
      ['third', 1, 2],
      ['fourth', 0, 3],
    ])
    const limited = buildSegLevels(rejectedScenario, false, 1)
    expect(limited.excludedSegs.map((seg) => seg.key)).toEqual([
      'second:0',
      'third:1',
      'fourth:0',
    ])

    const topologyScenario = segs([
      ['a', 0, 1],
      ['b', 0, 2],
      ['c', 1, 2],
    ])
    expect(projectSegLevels(
      buildSegLevels(topologyScenario, false).segLevels,
    )).toEqual([['a', 'c'], ['b']])
    expect(projectSegLevels(
      buildSegLevels(topologyScenario, true).segLevels,
    )).toEqual([['a'], ['b'], ['c']])
  })

  it('peels only collision footprints when slicing is enabled', () => {
    const [base, extra] = segs([
      ['base', 1, 2],
      ['extra', 0, 3],
    ])

    const unslicedLevels = convertSegLevelsToWholeSlices([[base]])
    const unslicedGroups = mergeExtraIntoLevels(
      unslicedLevels,
      convertSegsToWholeSlices([extra]),
      false,
      false,
      1,
      0,
    )
    expect(projectSlices(unslicedLevels.flat())).toEqual([
      ['base', 1, 2],
    ])
    expect(projectSlices(unslicedGroups[0].hiddenSlices)).toEqual([
      ['extra', 0, 3],
    ])

    const slicedLevels = convertSegLevelsToWholeSlices([[base]])
    const slicedGroups = mergeExtraIntoLevels(
      slicedLevels,
      convertSegsToWholeSlices([extra]),
      false,
      true,
      1,
      0,
    )
    expect(projectSlices(slicedLevels.flat())).toEqual([
      ['extra', 0, 1],
      ['base', 1, 2],
      ['extra', 2, 3],
    ])
    expect(projectSlices(slicedGroups[0].hiddenSlices)).toEqual([
      ['extra', 1, 2],
    ])
    auditCoverage([base, extra], slicedLevels, slicedGroups)
  })

  it('charges occupants one row level but zero event levels', () => {
    const [base, extra] = segs([
      ['base', 0, 1],
      ['extra', 0, 1],
    ])
    const eventLevels = convertSegLevelsToWholeSlices([[base]])
    const eventGroups = mergeExtraIntoLevels(
      eventLevels,
      convertSegsToWholeSlices([extra]),
      false,
      false,
      1,
      0,
    )
    expect(projectSlices(eventLevels.flat())).toEqual([['base', 0, 1]])
    expect(eventGroups[0].occupant.thickness).toBe(0)

    const rowLevels = convertSegLevelsToWholeSlices([[base]])
    const rowGroups = mergeExtraIntoLevels(
      rowLevels,
      convertSegsToWholeSlices([extra]),
      false,
      false,
      1,
      1,
    )
    expect(rowLevels.flat()).toEqual([])
    expect(rowGroups[0].occupant).toMatchObject({
      start: 0,
      end: 1,
      levelCoord: 0,
      thickness: 1,
    })
    expect(rowGroups[0].hiddenSlices.map((slice) => slice.sourceSeg.meta.id))
      .toEqual(['extra', 'base'])
    auditCoverage([base, extra], rowLevels, rowGroups)
  })

  it('makes bounded coordinate exclusion final and non-blocking', () => {
    const [tooTall, later] = segs([
      ['too-tall', 0, 1],
      ['later', 0, 1],
    ])
    const levels = convertSegLevelsToWholeSlices([[tooTall], [later]])
    const heights = new Map([
      [tooTall.key, 12],
      [later.key, 5],
    ])
    const result = resolveLevelCoords(
      levels,
      (slice) => heights.get(getSliceKey(slice))!,
      10,
    )

    expect(result.placementSliceLevels.map(projectSlices)).toEqual([
      [],
      [['later', 0, 1]],
    ])
    expect(result.excludedSlices).toEqual([levels[0][0]])
    expect(result.sliceCoords.get(later.key)).toBe(0)
    expect(compilePixelLimitedRenderSlices(
      levels,
      result.placementSliceLevels,
    ).filter((slice) => slice.sourceSeg === tooTall)).toEqual([levels[0][0]])

    const [trigger, frontier, excludedWhole] = segs([
      ['trigger', 0, 1],
      ['frontier', 0, 1],
      ['excluded-whole', 0, 1],
    ])
    const mergeLevels = convertSegLevelsToWholeSlices([[frontier]])
    const mergeCoords = new Map([[frontier.key, 0]])
    const groups = mergeExtraIntoLevelCoords(
      mergeLevels,
      mergeCoords,
      convertSegsToWholeSlices([trigger, excludedWhole]),
      false,
      false,
      10,
      6,
      5,
    )
    expect(mergeLevels.flat()).toEqual([])
    expect(groups[0].hiddenSlices.some((slice) =>
      slice.sourceSeg === excludedWhole &&
      slice.start === excludedWhole.start &&
      slice.end === excludedWhole.end,
    )).toBe(true)
  })

  it('uses coordinate tolerance without relaxing lateral intersections', () => {
    const [source, barrierSource] = segs([
      ['source', 0, 2],
      ['barrier', 0, 1],
    ])
    const whole = convertSegsToWholeSlices([source])[0]
    const slightlyOver = 10 + GEOMETRY_TOLERANCE / 2
    const resolved = resolveLevelCoords([[whole]], () => slightlyOver, 10)
    expect(resolved.placementSliceLevels[0]).toEqual([whole])

    const partial = { ...whole, end: 1, isEnd: false }
    const mergeLevels: Slice<TestMeta>[][] = []
    mergeExtraIntoLevelCoords(
      mergeLevels,
      new Map(),
      [partial],
      false,
      true,
      10,
      1,
      slightlyOver,
    )
    expect(mergeLevels[0]).toEqual([partial])

    const barrier = convertSegsToWholeSlices([barrierSource])[0]
    const ceilingLevels: Slice<TestMeta>[][] = [[], [barrier]]
    const ceilingCoords = new Map([[barrierSource.key, 10]])
    mergeExtraIntoLevelCoords(
      ceilingLevels,
      ceilingCoords,
      [partial],
      false,
      true,
      21,
      1,
      slightlyOver,
    )
    expect(ceilingLevels[0]).toEqual([partial])

    expect(groupLaterallyIntersecting([
      { ...whole, end: 1 },
      { ...whole, start: 1 },
    ])).toHaveLength(2)
  })

  it('salvages pixel partials using provisional thickness', () => {
    const [base, extra] = segs([
      ['base', 1, 2],
      ['extra', 0, 3],
    ])
    const levels = convertSegLevelsToWholeSlices([[base]])
    const coords = new Map([[base.key, 0]])
    const groups = mergeExtraIntoLevelCoords(
      levels,
      coords,
      convertSegsToWholeSlices([extra]),
      false,
      true,
      15,
      5,
      10,
    )

    expect(projectSlices(levels.flat())).toEqual([
      ['extra', 0, 1],
      ['base', 1, 2],
      ['extra', 2, 3],
    ])
    expect(projectSlices(groups[0].hiddenSlices)).toEqual([
      ['extra', 1, 2],
    ])
    expect(groups[0].occupant).toMatchObject({ levelCoord: 10, thickness: 5 })
    auditCoverage([base, extra], levels, groups)
  })

  it('recursively consumes pixel frontiers until the occupant fits', () => {
    const [a, b, c, extra] = segs([
      ['a', 0, 1],
      ['b', 0, 1],
      ['c', 0, 1],
      ['extra', 0, 1],
    ])
    const levels = convertSegLevelsToWholeSlices([[a], [b], [c]])
    const coords = new Map([
      [a.key, 0],
      [b.key, 10],
      [c.key, 20],
    ])
    const groups = mergeExtraIntoLevelCoords(
      levels,
      coords,
      convertSegsToWholeSlices([extra]),
      false,
      false,
      30,
      15,
      10,
    )

    expect(projectSlices(levels.flat())).toEqual([['a', 0, 1]])
    expect(groups[0].hiddenSlices.map((slice) => slice.sourceSeg.meta.id))
      .toEqual(['extra', 'c', 'b'])
    expect(groups[0].occupant).toMatchObject({ levelCoord: 10, thickness: 15 })
    auditCoverage([a, b, c, extra], levels, groups)
  })

  it('only compacts when exact heights replace provisional heights', () => {
    const [base, extra] = segs([
      ['base', 1, 2],
      ['extra', 0, 3],
    ])
    const levels = convertSegLevelsToWholeSlices([[base]])
    const provisionalCoords = new Map([[base.key, 0]])
    mergeExtraIntoLevelCoords(
      levels,
      provisionalCoords,
      convertSegsToWholeSlices([extra]),
      false,
      true,
      15,
      5,
      10,
    )
    const exact = resolveLevelCoords(levels, () => 6)

    for (const slice of levels.flat()) {
      const key = getSliceKey(slice)
      expect(exact.sliceCoords.get(key)).toBeLessThanOrEqual(
        provisionalCoords.get(key)!,
      )
      expect(exact.sliceCoords.get(key)! + 6).toBeLessThanOrEqual(15)
    }
  })

  it('merges globs laterally in received order and widens through consumption', () => {
    const [first, second, bridge] = convertSegsToWholeSlices(segs([
      ['first', 0, 1],
      ['second', 2, 3],
      ['bridge', 0.5, 2.5],
    ]))
    const groups = groupLaterallyIntersecting([first, second, bridge])
    expect(groups).toHaveLength(1)
    expect(groups[0]).toMatchObject({ start: 0, end: 3 })
    expect(groups[0].hiddenSlices.map((slice) => slice.sourceSeg.meta.id))
      .toEqual(['first', 'second', 'bridge'])

    const [base, extra] = segs([
      ['base', 0, 3],
      ['extra', 1, 2],
    ])
    const levels = convertSegLevelsToWholeSlices([[base]])
    const widened = mergeExtraIntoLevels(
      levels,
      convertSegsToWholeSlices([extra]),
      false,
      false,
      1,
      1,
    )
    expect(widened[0]).toMatchObject({ start: 0, end: 3 })
    expect(widened[0].occupant).toMatchObject({ start: 0, end: 3 })
    auditCoverage([base, extra], levels, widened)
  })

  it('derives exact DayGrid-compatible whole and partial keys', () => {
    const [source] = segs([['event', 2, 5]])
    const whole = convertSegsToWholeSlices([source])[0]
    const shifted = { ...whole, start: 3, isStart: false }
    const narrowed = { ...whole, end: 4, isEnd: false }

    expect(getSliceKey(whole)).toBe('event:2')
    expect(getSliceKey(shifted)).toBe('event:3:slice')
    expect(getSliceKey(narrowed)).toBe('event:2:slice')
  })
})

function segs(
  specs: readonly (readonly [string, number, number])[],
): SourceSeg<TestMeta>[] {
  return specs.map(([id, start, end], orderIndex) => ({
    key: `${id}:${start}`,
    eventKey: id,
    meta: { id },
    start,
    end,
    isStart: true,
    isEnd: true,
    orderIndex,
  }))
}

function projectSegLevels(levels: readonly (readonly SourceSeg<TestMeta>[])[]) {
  return levels.map((level) => level.map((seg) => seg.meta.id))
}

function projectSlices(slices: readonly Slice<TestMeta>[]) {
  return slices.map((slice) => [
    slice.sourceSeg.meta.id,
    slice.start,
    slice.end,
  ])
}

function auditCoverage(
  sources: readonly SourceSeg<TestMeta>[],
  levels: readonly (readonly Slice<TestMeta>[])[],
  groups: readonly HiddenSliceGroup<TestMeta>[],
): void {
  const pieces = levels.flat().concat(
    groups.flatMap((group) => group.hiddenSlices),
  )

  for (const source of sources) {
    const sourcePieces = pieces
      .filter((piece) => piece.sourceSeg === source)
      .sort((a, b) => a.start - b.start || a.end - b.end)
    let cursor = source.start
    for (const piece of sourcePieces) {
      expect(piece.start).toBe(cursor)
      expect(piece.end).toBeGreaterThan(piece.start)
      expect(piece.isStart).toBe(source.isStart && piece.start === source.start)
      expect(piece.isEnd).toBe(source.isEnd && piece.end === source.end)
      cursor = piece.end
    }
    expect(cursor).toBe(source.end)
  }
}
