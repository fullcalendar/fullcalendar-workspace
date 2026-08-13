import { describe, expect, it } from 'vitest'
import {
  type DayGridLimitResult,
  limitDayGridLayout,
} from '../../src/seg-placement/daygrid'
import {
  GEOMETRY_TOLERANCE,
  type SourceSeg,
  type LayoutLimitResult,
  type Placement,
  type PlacementLayout,
  type SegThicknessMap,
  type Slice,
  type SliceOptions,
  type UnorderedSeg,
  limitLayoutByLevelCoordLimits,
  limitLayoutByMaxLevel,
  planDomCandidatesByMaxLevel,
  positionSegs,
  stampEventOrder,
} from '../../src/seg-placement/layout'

interface TestEvent {
  id: string
}

interface SeededScenario {
  segs: SourceSeg<TestEvent>[]
  thicknesses: SegThicknessMap
}

const COLUMN_COUNT = 7
const OPTION_MATRIX: SliceOptions[] = [
  { orderStrict: false, eventSlicing: false, maxSlices: 3 },
  { orderStrict: true, eventSlicing: false, maxSlices: 3 },
  {
    orderStrict: false,
    eventSlicing: true,
    maxSlices: 1,
    minSliceLength: 1,
  },
  {
    orderStrict: false,
    eventSlicing: true,
    maxSlices: 3,
    minSliceLength: 2,
  },
  {
    orderStrict: true,
    eventSlicing: true,
    maxSlices: 2,
    minSliceLength: 1,
  },
]

/**
 * These audits recompute public invariants with test-only interval arithmetic;
 * they must not reuse the production collision or counting helpers they audit.
 * Exact winner identities and globally maximal compaction are deliberately not
 * requirements because the limiter preserves its established visible core.
 */
describe('independent layout correctness audits', () => {
  it('audits unrestricted placement across seeded geometry', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const scenario = buildScenario(seed)
      for (const orderStrict of [false, true]) {
        const layout = positionSegs(
          scenario.segs,
          scenario.thicknesses,
          { orderStrict },
        )
        auditPlacementLayout(
          layout,
          orderStrict,
          context(seed, scenario, { orderStrict }),
        )
        expect(layout.placements).toHaveLength(scenario.segs.length)
      }
    }
  })

  it('audits generic level and pixel limiting across a seeded matrix', () => {
    for (let seed = 1; seed <= 250; seed++) {
      const scenario = buildScenario(seed)
      const maxLevels = 1 + seed % 3
      const coordLimits = Array.from(
        { length: COLUMN_COUNT },
        (_, column) => 15 + (seed + column) % 4 * 8,
      )

      for (const options of OPTION_MATRIX) {
        const unrestricted = positionSegs(
          scenario.segs,
          scenario.thicknesses,
          { orderStrict: options.orderStrict },
        )
        const levelResult = limitLayoutByMaxLevel(
          unrestricted,
          maxLevels,
          options,
        )
        const levelLabel = context(seed, scenario, {
          kind: 'max-level',
          maxLevels,
          options,
        })
        auditLimitedLayout(
          scenario,
          levelResult,
          options,
          levelLabel,
        )
        auditLevelBounds(levelResult.visiblePlacements, maxLevels, levelLabel)
        auditOrdinarySlicePolicy(levelResult, options, levelLabel)

        const coordResult = limitLayoutByLevelCoordLimits(
          unrestricted,
          coordLimits,
          options,
        )
        const coordLabel = context(seed, scenario, {
          kind: 'pixel',
          coordLimits,
          options,
        })
        auditLimitedLayout(
          scenario,
          coordResult,
          options,
          coordLabel,
        )
        auditCoordBounds(coordResult.visiblePlacements, coordLimits, coordLabel)
        auditOrdinarySlicePolicy(coordResult, options, coordLabel)
      }
    }
  })

  it('audits Day Grid tax repair across level, pixel, and combined bounds', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const scenario = buildScenario(seed)
      const maxLevels = 1 + seed % 3
      const maxHeight = 24 + seed % 4 * 7
      const pixelTax = 6 + seed % 3

      for (const options of OPTION_MATRIX) {
        const unrestricted = positionSegs(
          scenario.segs,
          scenario.thicknesses,
          { orderStrict: options.orderStrict },
        )

        const levelResult = limitDayGridLayout(
          unrestricted,
          {
            maxLevels,
            columnCount: COLUMN_COUNT,
            initialHiddenSpans: [],
            levelTax: 1,
          },
          options,
        )
        const levelLabel = context(seed, scenario, {
          kind: 'taxed-level',
          maxLevels,
          options,
        })
        auditMoreLinkResult(scenario, levelResult, options, levelLabel)
        auditTaxedLevelBounds(
          levelResult,
          maxLevels,
          1,
          levelLabel,
        )

        const pixelResult = limitDayGridLayout(
          unrestricted,
          {
            levelCoordLimit: maxHeight,
            columnCount: COLUMN_COUNT,
            initialHiddenSpans: [],
            coordTax: pixelTax,
          },
          options,
        )
        const pixelLabel = context(seed, scenario, {
          kind: 'taxed-pixel',
          levelCoordLimit: maxHeight,
          pixelTax,
          options,
        })
        auditMoreLinkResult(scenario, pixelResult, options, pixelLabel)
        auditTaxedCoordBounds(
          pixelResult,
          maxHeight,
          pixelTax,
          pixelLabel,
        )

        const levelCost = seed % 2 as 0 | 1
        const combined = limitDayGridLayout(
          unrestricted,
          {
            maxLevels,
            levelCoordLimit: maxHeight,
            columnCount: COLUMN_COUNT,
            initialHiddenSpans: [],
            coordTax: pixelTax,
            levelTax: levelCost,
          },
          options,
        )
        const combinedLabel = context(seed, scenario, {
          kind: 'taxed-combined',
          maxLevels,
          levelCoordLimit: maxHeight,
          pixelTax,
          levelCost,
          options,
        })
        auditMoreLinkResult(scenario, combined, options, combinedLabel)
        auditTaxedLevelBounds(
          combined,
          maxLevels,
          levelCost,
          combinedLabel,
        )
        auditTaxedCoordBounds(
          combined,
          maxHeight,
          pixelTax,
          combinedLabel,
        )
      }
    }
  })

  it('audits pre-measurement hidden spans and their initial taxes', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const scenario = buildScenario(seed)
      const initialHiddenSpans = [
        { start: seed % COLUMN_COUNT, end: seed % COLUMN_COUNT + 1 },
        { start: (seed * 3) % 5, end: (seed * 3) % 5 + 2 },
      ]
      const unrestricted = positionSegs(
        scenario.segs,
        scenario.thicknesses,
        { orderStrict: seed % 2 === 0 },
      )
      const options: SliceOptions = {
        orderStrict: seed % 2 === 0,
        eventSlicing: seed % 3 !== 0,
        maxSlices: 3,
        minSliceLength: 1,
      }
      const result = limitDayGridLayout(
        unrestricted,
        {
          levelCoordLimit: 24 + seed % 4 * 7,
          columnCount: COLUMN_COUNT,
          initialHiddenSpans,
          coordTax: 6 + seed % 3,
        },
        options,
      )
      const label = context(seed, scenario, {
        kind: 'initial-hidden-tax',
        initialHiddenSpans,
        options,
      })

      auditMoreLinkResult(
        scenario,
        result,
        options,
        label,
        initialHiddenSpans,
      )
      auditTaxedCoordBounds(
        result,
        24 + seed % 4 * 7,
        6 + seed % 3,
        label,
      )
    }
  })

  it('reserves exactly the taxed pixel band only in owing columns', () => {
    const segs = stampEventOrder([
      seg('left-base', 0, 1),
      seg('right-base', 1, 2),
      seg('left-trigger', 0, 1),
      seg('right-bottom', 1, 2),
    ])
    const thicknesses = new Map([
      ['left-base', 12],
      ['right-base', 10],
      ['left-trigger', 12],
      ['right-bottom', 10],
    ])
    const scenario = { segs, thicknesses }
    const options = OPTION_MATRIX[0]
    const unrestricted = positionSegs(segs, thicknesses, {
      orderStrict: false,
    })
    const result = limitDayGridLayout(
      unrestricted,
      {
        levelCoordLimit: 20,
        columnCount: 2,
        initialHiddenSpans: [],
        coordTax: 8,
      },
      options,
    )

    expect(result.moreLinkCounts).toEqual([1, 0])
    expect(result.visiblePlacements.map((item) => item.sourceSeg.key)).toEqual([
      'left-base',
      'right-base',
      'right-bottom',
    ])
    expect(result.visiblePlacements.find((item) =>
      item.sourceSeg.key === 'left-base',
    )?.levelEndCoord).toBe(12)
    expect(result.visiblePlacements.find((item) =>
      item.sourceSeg.key === 'right-bottom',
    )?.levelEndCoord).toBe(20)
    auditMoreLinkResult(scenario, result, options, 'directed reservation')
    auditTaxedCoordBounds(result, 20, 8, 'directed reservation')
  })

  it('punches one mandatory tax hole without applying ordinary slice limits', () => {
    const segs = stampEventOrder([
      seg('spanning', 0, 3),
      seg('trigger', 1, 2),
    ])
    const thicknesses = new Map(segs.map((item) => [item.key, 10]))
    const options: SliceOptions = {
      orderStrict: false,
      eventSlicing: true,
      maxSlices: 1,
      minSliceLength: 2,
    }
    const unrestricted = positionSegs(segs, thicknesses, {
      orderStrict: false,
    })
    const result = limitDayGridLayout(
      unrestricted,
      {
        maxLevels: 1,
        columnCount: 3,
        initialHiddenSpans: [],
        levelTax: 1,
      },
      options,
    )
    const spanningVisible = result.visiblePlacements.filter((item) =>
      item.sourceSeg.key === 'spanning',
    )
    const spanningHidden = result.hiddenSlices.filter((item) =>
      item.sourceSeg.key === 'spanning',
    )

    expect(spanningVisible.map(({ start, end }) => [start, end])).toEqual([
      [0, 1],
      [2, 3],
    ])
    expect(spanningHidden.map(({ start, end }) => [start, end])).toEqual([
      [1, 2],
    ])
    expect(result.moreLinkCounts).toEqual([0, 2, 0])
    auditMoreLinkResult(
      { segs, thicknesses },
      result,
      options,
      'mandatory tax hole',
    )
    auditTaxedLevelBounds(result, 1, 1, 'mandatory tax hole')
  })

  it('is deterministic and independent of unrelated pure solves', () => {
    const target = buildScenario(901)
    const unrelated = buildScenario(902)
    const options = OPTION_MATRIX[4]
    const solve = (scenario: SeededScenario) => {
      const unrestricted = positionSegs(
        scenario.segs,
        scenario.thicknesses,
        { orderStrict: options.orderStrict },
      )
      return limitDayGridLayout(
        unrestricted,
        {
          levelCoordLimit: 31,
          columnCount: COLUMN_COUNT,
          initialHiddenSpans: [],
          coordTax: 7,
        },
        options,
      )
    }

    const first = projectResult(solve(target))
    solve(unrelated)
    const second = projectResult(solve(target))
    const third = projectResult(solve(target))

    expect(second).toEqual(first)
    expect(third).toEqual(first)
  })

  it('finishes and audits a dense recursive-tax cascade', () => {
    const segs = stampEventOrder(
      Array.from({ length: 70 }, (_, index) =>
        seg(
          `dense-${index}`,
          index % 3 === 0 ? 0 : index % COLUMN_COUNT,
          index % 3 === 0 ? COLUMN_COUNT : Math.min(
            COLUMN_COUNT,
            index % COLUMN_COUNT + 2,
          ),
        ),
      ),
    )
    const thicknesses = new Map(segs.map((item, index) => [
      item.key,
      8 + index % 4,
    ]))
    const options: SliceOptions = {
      orderStrict: true,
      eventSlicing: false,
      maxSlices: 3,
    }
    const unrestricted = positionSegs(segs, thicknesses, {
      orderStrict: true,
    })
    const result = limitDayGridLayout(
      unrestricted,
      {
        levelCoordLimit: 24,
        columnCount: COLUMN_COUNT,
        initialHiddenSpans: [],
        coordTax: 15,
      },
      options,
    )

    auditMoreLinkResult(
      { segs, thicknesses },
      result,
      options,
      'dense recursive-tax cascade',
    )
    auditTaxedCoordBounds(
      result,
      24,
      15,
      'dense recursive-tax cascade',
    )
  }, 5_000)

  it('admits complete source segs when the unit-thickness probe slices', () => {
    const [blocker, sliced, rejected] = stampEventOrder([
      seg('blocker', 1, 2),
      seg('sliced', 0, 3),
      seg('rejected', 0, 3),
    ])
    const plan = planDomCandidatesByMaxLevel(
      [blocker, sliced, rejected],
      1,
      {
        orderStrict: false,
        eventSlicing: true,
        maxSlices: 2,
      },
    )

    expect(plan.mountedSegs).toEqual([blocker, sliced])
    expect(plan.mountedSegs[1]).toMatchObject({ start: 0, end: 3 })
    expect(plan.visiblePlacements.filter((placement) =>
      placement.sourceSeg === sliced,
    )).toHaveLength(2)
    expect(plan.hiddenSlices.some((slice) =>
      slice.sourceSeg === rejected && slice.start === 0 && slice.end === 3,
    )).toBe(true)
    expect(plan.mountedSegs).not.toContain(rejected)
  })

  it('keeps rejected DOM candidates hidden and unmounted in resolved order', () => {
    const segs = stampEventOrder([
      seg('first', 0, 2),
      seg('second', 0, 2),
      seg('third', 0, 2),
    ])
    const plan = planDomCandidatesByMaxLevel(segs, 1, {
      orderStrict: false,
      eventSlicing: false,
      maxSlices: 1,
    })

    expect(plan.mountedSegs).toEqual([segs[0]])
    expect(plan.hiddenSlices.map((slice) => slice.sourceSeg)).toEqual([
      segs[1],
      segs[2],
    ])
  })
})

function auditLimitedLayout(
  scenario: SeededScenario,
  result: LayoutLimitResult<TestEvent>,
  options: SliceOptions,
  label: string,
): void {
  auditPlacementLayout(
    { levels: result.levels, placements: result.visiblePlacements },
    options.orderStrict,
    label,
  )
  auditSourcePartition(
    scenario.segs,
    result.visiblePlacements,
    result.hiddenSlices,
    scenario.thicknesses,
    label,
  )
}

function auditMoreLinkResult(
  scenario: SeededScenario,
  result: DayGridLimitResult<TestEvent>,
  options: SliceOptions,
  label: string,
  initialHiddenSpans: readonly { start: number; end: number }[] = [],
): void {
  auditLimitedLayout(scenario, result, options, label)
  const expectedCounts = addCounts(
    countSpansByColumn(initialHiddenSpans, result.moreLinkCounts.length),
    countUncoveredSources(
      scenario.segs,
      result.visiblePlacements,
      result.moreLinkCounts.length,
    ),
  )
  invariant(
    arraysEqual(result.moreLinkCounts, expectedCounts),
    `incorrect more-link counts: expected ${expectedCounts}, got ${result.moreLinkCounts}`,
    label,
  )
}

function auditPlacementLayout(
  layout: PlacementLayout<TestEvent>,
  orderStrict: boolean,
  label: string,
): void {
  const entries = layout.levels.flat()
  invariant(
    entries.length === layout.placements.length,
    'level entry count disagrees with placement count',
    label,
  )
  invariant(
    new Set(entries).size === entries.length,
    'a placement occurs in more than one logical level',
    label,
  )
  for (const placement of layout.placements) {
    invariant(
      entries.includes(placement),
      `visible placement ${placement.sourceSeg.key} is absent from its level`,
      label,
    )
    invariant(
      Number.isInteger(placement.levelIndex) && placement.levelIndex >= 0 &&
        Number.isFinite(placement.levelCoord) && placement.levelCoord >= 0 &&
        Number.isFinite(placement.thickness) && placement.thickness > 0 &&
        Number.isFinite(placement.levelEndCoord),
      `visible placement ${placement.sourceSeg.key} has invalid numeric geometry`,
      label,
    )
  }

  layout.levels.forEach((level, levelIndex) => {
    for (let index = 0; index < level.length; index++) {
      const entry = level[index]
      invariant(
        entry.levelIndex === levelIndex,
        `${entry.sourceSeg.key} records level ${entry.levelIndex} but is in ${levelIndex}`,
        label,
      )
      if (index > 0) {
        const previous = level[index - 1]
        invariant(
          previous.start <= entry.start,
          `level ${levelIndex} is not sorted laterally`,
          label,
        )
        invariant(
          previous.end <= entry.start + GEOMETRY_TOLERANCE,
          `level ${levelIndex} contains lateral overlap`,
          label,
        )
      }
    }
  })

  for (let leftIndex = 0; leftIndex < layout.placements.length; leftIndex++) {
    const left = layout.placements[leftIndex]
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < layout.placements.length;
      rightIndex++
    ) {
      const right = layout.placements[rightIndex]
      if (!spansOverlap(left, right)) continue
      invariant(
        !axisRangesOverlap(left, right),
        `${left.sourceSeg.key} and ${right.sourceSeg.key} collide geometrically`,
        label,
      )
      if (orderStrict && left.sourceSeg.key !== right.sourceSeg.key) {
        const earlier =
          left.sourceSeg.orderIndex < right.sourceSeg.orderIndex
            ? left
            : right
        const later = earlier === left ? right : left
        invariant(
          earlier.levelIndex < later.levelIndex,
          `${earlier.sourceSeg.key} is not above later collider ${later.sourceSeg.key}`,
          label,
        )
      }
    }
  }
}

function auditSourcePartition(
  segs: readonly SourceSeg<TestEvent>[],
  visiblePlacements: readonly Placement<TestEvent>[],
  hiddenSlices: readonly Slice<TestEvent>[],
  thicknesses: SegThicknessMap,
  label: string,
): void {
  const sourceKeys = new Set(segs.map((source) => source.key))
  for (const piece of [...visiblePlacements, ...hiddenSlices]) {
    invariant(
      sourceKeys.has(piece.sourceSeg.key),
      `result contains unknown source ${piece.sourceSeg.key}`,
      label,
    )
  }

  for (const source of segs) {
    invariant(
      Number.isFinite(source.start) && Number.isFinite(source.end) &&
        source.end > source.start,
      `${source.key} has invalid source geometry`,
      label,
    )
    const pieces = [...visiblePlacements, ...hiddenSlices]
      .filter((piece) => piece.sourceSeg.key === source.key)
      .sort((left, right) => left.start - right.start || left.end - right.end)
    invariant(pieces.length > 0, `${source.key} has no result geometry`, label)

    let cursor = source.start
    for (const piece of pieces) {
      invariant(
        piece.start >= source.start - GEOMETRY_TOLERANCE &&
          piece.end <= source.end + GEOMETRY_TOLERANCE &&
          piece.end > piece.start + GEOMETRY_TOLERANCE,
        `${source.key} has empty or out-of-range geometry`,
        label,
      )
      invariant(
        Math.abs(piece.start - cursor) <= GEOMETRY_TOLERANCE,
        `${source.key} has a gap or overlap at ${cursor}`,
        label,
      )
      invariant(
        piece.sourceSeg.orderIndex === source.orderIndex,
        `${source.key} lost its source order index`,
        label,
      )
      invariant(
        piece.isStart === (source.isStart && piece.start === source.start),
        `${source.key} has an incorrect isStart flag`,
        label,
      )
      invariant(
        piece.isEnd === (source.isEnd && piece.end === source.end),
        `${source.key} has an incorrect isEnd flag`,
        label,
      )
      cursor = piece.end
    }
    invariant(
      Math.abs(cursor - source.end) <= GEOMETRY_TOLERANCE,
      `${source.key} does not cover its complete source span`,
      label,
    )

    for (const placement of visiblePlacements.filter((item) =>
      item.sourceSeg.key === source.key,
    )) {
      invariant(
        placement.thickness === thicknesses.get(source.key),
        `${source.key} does not retain its wrapper thickness`,
        label,
      )
      invariant(
        Math.abs(
          placement.levelEndCoord -
            (placement.levelCoord + placement.thickness),
        ) <= GEOMETRY_TOLERANCE,
        `${source.key} has inconsistent level-axis coordinates`,
        label,
      )
    }
  }
}

function auditOrdinarySlicePolicy(
  result: LayoutLimitResult<TestEvent>,
  options: SliceOptions,
  label: string,
): void {
  const sourceKeys = new Set([
    ...result.visiblePlacements.map((item) => item.sourceSeg.key),
    ...result.hiddenSlices.map((item) => item.sourceSeg.key),
  ])
  for (const sourceKey of sourceKeys) {
    const visiblePlacements = result.visiblePlacements.filter((item) =>
      item.sourceSeg.key === sourceKey,
    )
    const hiddenSlices = result.hiddenSlices.filter((item) =>
      item.sourceSeg.key === sourceKey,
    )
    if (!options.eventSlicing) {
      invariant(
        visiblePlacements.length <= 1 && hiddenSlices.length <= 1,
        `${sourceKey} was sliced while slicing was disabled`,
        label,
      )
      for (const piece of [...visiblePlacements, ...hiddenSlices]) {
        invariant(
          piece.start === piece.sourceSeg.start && piece.end === piece.sourceSeg.end,
          `${sourceKey} was cut while slicing was disabled`,
          label,
        )
      }
      continue
    }

    invariant(
      visiblePlacements.length <= options.maxSlices,
      `${sourceKey} exceeds maxSlices=${options.maxSlices}`,
      label,
    )
    const positions = new Set(
      visiblePlacements.map((item) => `${item.levelIndex}:${item.levelCoord}`),
    )
    invariant(
      positions.size <= 1,
      `${sourceKey} ordinary slices do not share one position`,
      label,
    )
    for (const piece of visiblePlacements) {
      const isPartial = piece.start !== piece.sourceSeg.start ||
        piece.end !== piece.sourceSeg.end
      if (isPartial) {
        invariant(
          piece.end - piece.start >=
            (options.minSliceLength ?? 0) - GEOMETRY_TOLERANCE,
          `${sourceKey} violates minSliceLength`,
          label,
        )
      }
    }
  }
}

function auditLevelBounds(
  visiblePlacements: readonly Placement<TestEvent>[],
  maxLevels: number,
  label: string,
): void {
  for (const placement of visiblePlacements) {
    invariant(
      placement.levelIndex < maxLevels,
      `${placement.sourceSeg.key} exceeds maxLevels=${maxLevels}`,
      label,
    )
  }
}

function auditCoordBounds(
  visiblePlacements: readonly Placement<TestEvent>[],
  coordLimits: readonly number[],
  label: string,
): void {
  for (const placement of visiblePlacements) {
    for (const column of intersectingColumns(placement, coordLimits.length)) {
      invariant(
        placement.levelEndCoord <= coordLimits[column] + GEOMETRY_TOLERANCE,
        `${placement.sourceSeg.key} exceeds pixel bound in column ${column}`,
        label,
      )
    }
  }
}

function auditTaxedLevelBounds(
  result: DayGridLimitResult<TestEvent>,
  maxLevels: number,
  tax: number,
  label: string,
): void {
  for (const placement of result.visiblePlacements) {
    for (
      const column of intersectingColumns(
        placement,
        result.moreLinkCounts.length,
      )
    ) {
      const finalBound = Math.max(
        0,
        maxLevels - (result.moreLinkCounts[column] > 0 ? tax : 0),
      )
      invariant(
        placement.levelIndex < finalBound,
        `${placement.sourceSeg.key} occupies reserved level in column ${column}`,
        label,
      )
    }
  }
}

function auditTaxedCoordBounds(
  result: DayGridLimitResult<TestEvent>,
  maxHeight: number,
  tax: number,
  label: string,
): void {
  for (const placement of result.visiblePlacements) {
    for (
      const column of intersectingColumns(
        placement,
        result.moreLinkCounts.length,
      )
    ) {
      const finalBound = Math.max(
        0,
        maxHeight - (result.moreLinkCounts[column] > 0 ? tax : 0),
      )
      invariant(
        placement.levelEndCoord <= finalBound + GEOMETRY_TOLERANCE,
        `${placement.sourceSeg.key} occupies reserved pixels in column ${column}`,
        label,
      )
    }
  }
}

function countUncoveredSources(
  segs: readonly SourceSeg<TestEvent>[],
  visiblePlacements: readonly Placement<TestEvent>[],
  columnCount: number,
): number[] {
  const counts = Array<number>(columnCount).fill(0)
  for (const source of segs) {
    for (const column of intersectingColumns(source, columnCount)) {
      const isCovered = visiblePlacements.some((placement) =>
        placement.sourceSeg.key === source.key &&
        placement.start <= column &&
        placement.end >= column + 1,
      )
      if (!isCovered) counts[column]++
    }
  }
  return counts
}

function countSpansByColumn(
  spans: readonly { start: number; end: number }[],
  columnCount: number,
): number[] {
  const counts = Array<number>(columnCount).fill(0)
  for (const span of spans) {
    for (const column of intersectingColumns(span, columnCount)) {
      counts[column]++
    }
  }
  return counts
}

function addCounts(left: readonly number[], right: readonly number[]): number[] {
  return left.map((value, index) => value + right[index])
}

function intersectingColumns(
  span: { start: number; end: number },
  columnCount: number,
): number[] {
  const start = Math.min(columnCount, Math.max(0, Math.floor(span.start)))
  const end = Math.min(columnCount, Math.max(0, Math.ceil(span.end)))
  return Array.from({ length: end - start }, (_, index) => start + index)
}

function spansOverlap(
  left: { start: number; end: number },
  right: { start: number; end: number },
): boolean {
  return left.start < right.end && right.start < left.end
}

function axisRangesOverlap(
  left: Placement<TestEvent>,
  right: Placement<TestEvent>,
): boolean {
  return left.levelCoord < right.levelEndCoord - GEOMETRY_TOLERANCE &&
    right.levelCoord < left.levelEndCoord - GEOMETRY_TOLERANCE
}

function arraysEqual(left: readonly number[], right: readonly number[]): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index])
}

function projectResult(result: DayGridLimitResult<TestEvent>): unknown {
  return {
    levels: result.levels.map((level) => level.map(projectSlice)),
    visible: result.visiblePlacements.map(projectSlice),
    hidden: result.hiddenSlices.map(projectSlice),
    moreLinkCounts: result.moreLinkCounts,
  }
}

function projectSlice(slice: Slice<TestEvent>): unknown {
  const placement = slice as Partial<Placement<TestEvent>>
  return {
    key: slice.sourceSeg.key,
    start: slice.start,
    end: slice.end,
    orderIndex: slice.sourceSeg.orderIndex,
    isStart: slice.isStart,
    isEnd: slice.isEnd,
    levelIndex: placement.levelIndex,
    levelCoord: placement.levelCoord,
    levelEndCoord: placement.levelEndCoord,
  }
}

function buildScenario(seed: number): SeededScenario {
  let state = seed
  const random = () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0
    return state / 0x1_0000_0000
  }
  const segs = stampEventOrder(
    Array.from({ length: 18 }, (_, index) => {
      const start = Math.floor(random() * COLUMN_COUNT)
      const end = Math.min(
        COLUMN_COUNT,
        start + 1 + Math.floor(random() * 4),
      )
      return seg(`${seed}:${index}`, start, end)
    }),
  )
  const thicknesses = new Map(segs.map((item) => [
    item.key,
    5 + Math.floor(random() * 17),
  ]))
  return { segs, thicknesses }
}

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

function context(
  seed: number,
  scenario: SeededScenario,
  detail: unknown,
): string {
  return JSON.stringify({
    seed,
    segs: scenario.segs.map(({ key, start, end }) => ({
      key,
      start,
      end,
      thickness: scenario.thicknesses.get(key),
    })),
    detail,
  })
}

function invariant(condition: boolean, message: string, label: string): void {
  if (!condition) throw new Error(`${message}\n${label}`)
}
