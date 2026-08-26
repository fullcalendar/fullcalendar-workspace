import { describe, expect, it } from 'vitest'
import {
  GEOMETRY_TOLERANCE,
  type HiddenSliceGroup,
  type Slice,
  type SourceSeg,
  buildSegLevels,
  convertSegLevelsToWholeSlices,
  convertSegsToWholeSlices,
  getSliceKey,
  mergeExtraIntoLevelCoords,
  mergeExtraIntoLevels,
  resolveLevelCoords,
} from '../../src/seg-placement/kernel'

type TestSeg = SourceSeg & { id: string }

describe('pure positioning kernel fuzzing', () => {
  it('preserves level, occupant, order, and coverage invariants', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const sources = buildScenario(seed)
      const maxLevels = 1 + seed % 3
      const strict = seed % 2 === 0
      const slicing = seed % 3 !== 0
      const tax = seed % 2
      const built = buildSegLevels(sources, strict, maxLevels)
      expect(built.excludedSegs.map((seg) => seg.orderIndex)).toEqual(
        [...built.excludedSegs]
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((seg) => seg.orderIndex),
      )

      const levels = convertSegLevelsToWholeSlices(built.segLevels)
      const groups = mergeExtraIntoLevels(
        levels,
        convertSegsToWholeSlices(built.excludedSegs),
        strict,
        slicing,
        maxLevels,
        tax,
      )
      const label = JSON.stringify({ seed, maxLevels, strict, slicing, tax })
      auditLevels(levels, strict, label)
      auditGroups(levels, groups, maxLevels, tax, label)
      auditCoverage(sources, levels, groups, label)
    }
  })

  it('keeps provisional pixel plans in-budget and exact re-resolves compact', () => {
    for (let seed = 1; seed <= 250; seed++) {
      const sources = buildScenario(seed)
      const random = createRandom(seed * 65_537)
      const provisional = 8 + random() * 9
      const maxPixels = provisional * (1 + seed % 3) + random()
      const frontier = 1 + seed % 4
      const built = buildSegLevels(sources, seed % 2 === 0, frontier)
      const domLevels = convertSegLevelsToWholeSlices(built.segLevels)
      const wholeResolution = resolveLevelCoords(
        domLevels,
        () => provisional,
        maxPixels,
      )
      const levels = wholeResolution.placementSliceLevels
      const provisionalCoords = wholeResolution.sliceCoords
      const extras = wholeResolution.excludedSlices.concat(
        convertSegsToWholeSlices(built.excludedSegs),
      ).sort((a, b) => a.sourceSeg.orderIndex - b.sourceSeg.orderIndex)
      const moreLinkHeight = Math.max(1, provisional - 2 - random())
      const groups = mergeExtraIntoLevelCoords(
        levels,
        provisionalCoords,
        extras,
        seed % 2 === 0,
        seed % 3 !== 0,
        maxPixels,
        moreLinkHeight,
        () => provisional,
      )
      const exactHeights = new Map<string, number>()
      const getExactHeight = (slice: Slice<TestSeg>) => {
        const key = getSliceKey(slice)
        let height = exactHeights.get(key)
        if (height == null) {
          height = Math.max(1, provisional - random() * 3)
          exactHeights.set(key, height)
        }
        return height
      }
      const exact = resolveLevelCoords(levels, getExactHeight)
      const label = JSON.stringify({
        seed,
        provisional,
        maxPixels,
        frontier,
      })

      auditLevels(levels, seed % 2 === 0, label)
      auditGroups(
        levels,
        groups,
        maxPixels,
        moreLinkHeight,
        label,
        provisionalCoords,
        provisional,
      )
      auditCoverage(sources, levels, groups, label)
      for (const slice of levels.flat()) {
        const key = getSliceKey(slice)
        invariant(
          exact.sliceCoords.get(key)! <= provisionalCoords.get(key)!,
          `${key} grew during exact re-resolve`,
          label,
        )
        invariant(
          exact.sliceCoords.get(key)! + getExactHeight(slice) <=
            maxPixels + GEOMETRY_TOLERANCE,
          `${key} broke the pixel budget after compaction`,
          label,
        )
      }
    }
  })
})

function buildScenario(seed: number): TestSeg[] {
  const random = createRandom(seed)
  const count = 6 + Math.floor(random() * 18)
  return Array.from({ length: count }, (_, orderIndex) => {
    const start = Math.floor(random() * 7)
    const end = Math.min(7, start + 1 + Math.floor(random() * 4))
    const id = `${seed}:${orderIndex}`
    return {
      key: `${id}:${start}`,
      id,
      start,
      end,
      isStart: true,
      isEnd: true,
      orderIndex,
    }
  })
}

function auditLevels(
  levels: readonly (readonly Slice<TestSeg>[])[],
  strict: boolean,
  label: string,
): void {
  levels.forEach((level, levelIndex) => {
    for (let i = 1; i < level.length; i++) {
      invariant(
        level[i - 1].end <= level[i].start,
        `level ${levelIndex} overlaps laterally`,
        label,
      )
    }
  })

  if (strict) {
    const entries = levels.flatMap((level, levelIndex) =>
      level.map((slice) => ({ slice, levelIndex })),
    )
    for (const left of entries) {
      for (const right of entries) {
        if (
          left.slice.sourceSeg !== right.slice.sourceSeg &&
          left.slice.sourceSeg.orderIndex < right.slice.sourceSeg.orderIndex &&
          intersects(left.slice, right.slice)
        ) {
          invariant(
            left.levelIndex < right.levelIndex,
            'strict event order inverted',
            label,
          )
        }
      }
    }
  }
}

function auditGroups(
  levels: readonly (readonly Slice<TestSeg>[])[],
  groups: readonly HiddenSliceGroup<TestSeg>[],
  limit: number,
  tax: number,
  label: string,
  coords?: ReadonlyMap<string, number>,
  thickness: number = 1,
): void {
  for (let left = 0; left < groups.length; left++) {
    for (let right = left + 1; right < groups.length; right++) {
      invariant(
        !intersects(groups[left], groups[right]),
        'glob groups still intersect',
        label,
      )
    }
  }

  for (const group of groups) {
    invariant(
      !levels.flat().includes(group.occupant as unknown as Slice<TestSeg>),
      'occupant leaked into slice levels',
      label,
    )
    if (!tax || group.occupant.levelCoord == null) continue
    invariant(
      group.occupant.levelCoord + tax <= limit + GEOMETRY_TOLERANCE,
      'occupant exceeds its bound',
      label,
    )
    levels.forEach((level, levelIndex) => {
      for (const slice of level) {
        if (intersects(slice, group)) {
          const bottom = (coords?.get(getSliceKey(slice)) ?? levelIndex) + thickness
          invariant(
            group.occupant.levelCoord! >= bottom,
            'occupant is not a range footer',
            label,
          )
        }
      }
    })
  }
}

function auditCoverage(
  sources: readonly TestSeg[],
  levels: readonly (readonly Slice<TestSeg>[])[],
  groups: readonly HiddenSliceGroup<TestSeg>[],
  label: string,
): void {
  const pieces = levels.flat().concat(
    groups.flatMap((group) => group.hiddenSlices),
  )
  for (const source of sources) {
    const sourcePieces = pieces
      .filter((piece) => piece.sourceSeg === source)
      .sort((a, b) => a.start - b.start || a.end - b.end)
    invariant(sourcePieces.length > 0, `${source.key} disappeared`, label)
    let cursor = source.start
    for (const piece of sourcePieces) {
      invariant(piece.start === cursor, `${source.key} has a gap or overlap`, label)
      invariant(piece.end > piece.start, `${source.key} has an empty piece`, label)
      invariant(
        piece.isStart === (source.isStart && piece.start === source.start),
        `${source.key} has a bad isStart flag`,
        label,
      )
      invariant(
        piece.isEnd === (source.isEnd && piece.end === source.end),
        `${source.key} has a bad isEnd flag`,
        label,
      )
      cursor = piece.end
    }
    invariant(cursor === source.end, `${source.key} has incomplete coverage`, label)
  }
}

function intersects(
  left: { start: number; end: number },
  right: { start: number; end: number },
): boolean {
  return left.start < right.end && right.start < left.end
}

function createRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0
    return state / 0x1_0000_0000
  }
}

function invariant(condition: boolean, message: string, label: string): void {
  if (!condition) throw new Error(`${message}\n${label}`)
}
