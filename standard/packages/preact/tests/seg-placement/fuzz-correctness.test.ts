/**
 * Randomized correctness vetting for the shared placement kernel
 * ==============================================================
 *
 * `layout-correctness.test.ts` audits the Day Grid currencies over seeded
 * integer geometry. This suite widens the vetting surface along the axes that
 * file does not reach:
 *
 * - Continuous (fractional) lateral coordinates through shared placement,
 *   which is the geometry Timeline actually supplies. Coordinates are dyadic
 *   rationals (multiples of 1/64) so every comparison in the engine is exact
 *   and no seed can flake on sub-epsilon float noise.
 * - The Timeline projection pipeline: group formation, link skyline positions,
 *   and the expanding content height.
 * - The TimeGrid pressure pipeline: level-axis rectangles must stay inside the
 *   normalized canvas, keep strictly positive thickness, and never overlap
 *   for time-intersecting events.
 * - The Day Grid print projection: retained levels become bands, every visible
 *   slice is projected exactly once, and counts match print's own slice-level
 *   partition under sparse measurements.
 * - Degenerate and hostile inputs that only need to terminate coherently.
 *
 * Like the sibling suite, every audit recomputes invariants with test-only
 * interval arithmetic and never reuses the production collision helpers it is
 * auditing. Winner identities and maximal compaction are intentionally not
 * asserted.
 */

import { describe, expect, it } from 'vitest'
import {
  countHiddenSpansByColumn,
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
  createWholeSlice,
  limitLayoutByMaxLevel,
  planDomCandidatesByMaxLevel,
  positionSegs,
} from '../../src/seg-placement/layout'
import { buildPrintEventBands } from '../../src/seg-placement/print'
import {
  type TimeGridColumnLayout,
  layoutTimeGridColumnByMaxLevel,
} from '../../src/seg-placement/timegrid'
import {
  calculateTimelineContentHeight,
  limitTimelineLayoutByMaxLevel,
  positionTimelineMoreLinks,
} from '../../src/seg-placement/timeline'
import { type UnorderedSeg, stampEventOrder } from './test-utils'

interface TestEvent {
  id: string
}

interface Scenario {
  segs: SourceSeg<TestEvent>[]
  thicknesses: SegThicknessMap
}

const DAY_GRID_COLUMN_COUNT = 7
const CONTINUOUS_LATERAL_CELLS = 12

const OPTION_MATRIX: SliceOptions[] = [
  { orderStrict: false, eventSlicing: false, maxSlices: 3 },
  { orderStrict: true, eventSlicing: false, maxSlices: 3 },
  { orderStrict: false, eventSlicing: true, maxSlices: 3, minSliceLength: 0.5 },
  { orderStrict: true, eventSlicing: true, maxSlices: 2, minSliceLength: 0.25 },
  { orderStrict: false, eventSlicing: true, maxSlices: 1, minSliceLength: 1 },
]

describe('continuous-coordinate engine fuzzing', () => {
  it('audits unrestricted placement and level limiting on fractional geometry', () => {
    for (let seed = 1; seed <= 400; seed++) {
      const scenario = buildContinuousScenario(seed)
      const maxLevels = 1 + seed % 4

      for (const options of OPTION_MATRIX) {
        const label = context(seed, scenario, { kind: 'cont-level', maxLevels, options })
        const unrestricted = positionSegs(
          scenario.segs,
          scenario.thicknesses,
          options.orderStrict,
        )
        auditLayoutStructure(
          { levels: unrestricted.levels, placements: unrestricted.placements },
          options.orderStrict,
          label,
        )
        expect(unrestricted.placements).toHaveLength(scenario.segs.length)

        const limited = limitLayoutByMaxLevel(unrestricted, maxLevels, options)
        auditLimitResult(scenario, limited, options, label)
        for (const placement of limited.visiblePlacements) {
          invariant(
            placement.levelIndex < maxLevels,
            `${placement.sourceSeg.key} exceeds maxLevels=${maxLevels}`,
            label,
          )
        }
        auditOrdinarySlicePolicy(limited, options, label)
      }
    }
  })

})

describe('Day Grid tax fuzzing beyond the seeded integer matrix', () => {
  it('keeps every taxed result coherent and on integer column boundaries', () => {
    for (let seed = 1; seed <= 400; seed++) {
      const scenario = buildDayGridScenario(seed, 10 + seed % 25)
      const options = OPTION_MATRIX[seed % OPTION_MATRIX.length]
      const integerOptions: SliceOptions = {
        ...options,
        minSliceLength: options.minSliceLength === undefined ? undefined : 1,
      }
      const maxLevels = 1 + seed % 3
      const maxHeight = 20 + seed % 5 * 8
      const pixelTax = 5 + seed % 9
      const levelCost = seed % 2 as 0 | 1
      const initialHiddenSpans = seed % 3 === 0
        ? [
          { start: seed % DAY_GRID_COLUMN_COUNT, end: seed % DAY_GRID_COLUMN_COUNT + 1 },
          { start: 0, end: DAY_GRID_COLUMN_COUNT },
        ]
        : []
      const unrestricted = positionSegs(
        scenario.segs,
        scenario.thicknesses,
        integerOptions.orderStrict,
      )

      const levelResult = limitDayGridLayout(
        unrestricted,
        {
          maxLevels,
          columnCount: DAY_GRID_COLUMN_COUNT,
          initialHiddenSpans,
          levelTax: 1,
        },
        integerOptions,
      )
      const levelLabel = context(seed, scenario, {
        kind: 'tax-level',
        maxLevels,
        initialHiddenSpans,
        options: integerOptions,
      })
      auditMoreLinkResult(scenario, levelResult, initialHiddenSpans, integerOptions, levelLabel)
      auditTaxedBounds(levelResult, { maxLevels, levelCost: 1 }, levelLabel)
      auditIntegerColumnGeometry(levelResult, levelLabel)

      const pixelResult = limitDayGridLayout(
        unrestricted,
        {
          levelCoordLimit: maxHeight,
          columnCount: DAY_GRID_COLUMN_COUNT,
          initialHiddenSpans,
          coordTax: pixelTax,
        },
        integerOptions,
      )
      const pixelLabel = context(seed, scenario, {
        kind: 'tax-pixel',
        levelCoordLimit: maxHeight,
        pixelTax,
        initialHiddenSpans,
        options: integerOptions,
      })
      auditMoreLinkResult(scenario, pixelResult, initialHiddenSpans, integerOptions, pixelLabel)
      auditTaxedBounds(pixelResult, { coordLimit: maxHeight, cost: pixelTax }, pixelLabel)
      auditIntegerColumnGeometry(pixelResult, pixelLabel)

      const combinedResult = limitDayGridLayout(
        unrestricted,
        {
          maxLevels,
          levelCoordLimit: maxHeight,
          columnCount: DAY_GRID_COLUMN_COUNT,
          initialHiddenSpans,
          coordTax: pixelTax,
          levelTax: levelCost,
        },
        integerOptions,
      )
      const combinedLabel = context(seed, scenario, {
        kind: 'tax-combined',
        maxLevels,
        levelCoordLimit: maxHeight,
        pixelTax,
        levelCost,
        initialHiddenSpans,
        options: integerOptions,
      })
      auditMoreLinkResult(scenario, combinedResult, initialHiddenSpans, integerOptions, combinedLabel)
      auditTaxedBounds(
        combinedResult,
        { maxLevels, levelCost, coordLimit: maxHeight, cost: pixelTax },
        combinedLabel,
      )
      auditIntegerColumnGeometry(combinedResult, combinedLabel)
    }
  })

  it('finishes a dense recursive-tax cascade with slicing enabled', () => {
    const segs = stampEventOrder(
      Array.from({ length: 80 }, (_, index) =>
        daySeg(
          `cascade-${index}`,
          index % 4 === 0 ? 0 : index % DAY_GRID_COLUMN_COUNT,
          index % 4 === 0 ? DAY_GRID_COLUMN_COUNT : Math.min(
            DAY_GRID_COLUMN_COUNT,
            index % DAY_GRID_COLUMN_COUNT + 1 + index % 3,
          ),
        ),
      ),
    )
    const thicknesses = new Map(segs.map((seg, index) => [
      seg.key,
      7 + index % 5,
    ]))
    const scenario = { segs, thicknesses }
    const options: SliceOptions = {
      orderStrict: true,
      eventSlicing: true,
      maxSlices: 3,
      minSliceLength: 1,
    }
    const unrestricted = positionSegs(segs, thicknesses, true)
    const result = limitDayGridLayout(
      unrestricted,
      {
        levelCoordLimit: 26,
        columnCount: DAY_GRID_COLUMN_COUNT,
        initialHiddenSpans: [],
        coordTax: 12,
      },
      options,
    )

    auditMoreLinkResult(scenario, result, [], options, 'sliced dense cascade')
    auditTaxedBounds(result, { coordLimit: 26, cost: 12 }, 'sliced dense cascade')
    auditIntegerColumnGeometry(result, 'sliced dense cascade')
  }, 5_000)

  it('keeps strict order under harsh taxes that shift later events in repair', () => {
    // The only known breach of the strict maximum fence needs the taxed
    // repair path: hiding one overflow first moves a later-order placement
    // shallower, and a still-queued earlier overflow must then be hidden
    // rather than appended beneath it. The coherence fuzz above never opens
    // that window within its milder ranges, so this probe runs always-strict
    // with harsher heights and taxes over narrower rows. The distilled
    // counterexample lives in daygrid-cap.test.ts.
    const columnCount = 6
    for (let seed = 1; seed <= 6000; seed++) {
      const random = createRandom(seed)
      const count = 4 + Math.floor(random() * 16)
      const segs = stampEventOrder(
        Array.from({ length: count }, (_, index) => {
          const start = Math.floor(random() * columnCount)
          return daySeg(
            `${seed}:h-${index}`,
            start,
            Math.min(columnCount, start + 1 + Math.floor(random() * 4)),
          )
        }),
      )
      const thicknesses = new Map(
        segs.map((seg) => [seg.key, 3 + Math.floor(random() * 25)]),
      )
      const scenario = { segs, thicknesses }
      const unrestricted = positionSegs(segs, thicknesses, true)
      const maxHeight = 10 + Math.floor(random() * 45)
      const coordTax = 2 + Math.floor(random() * 20)
      const initialHiddenSpans = seed % 2 === 0
        ? [{ start: seed % columnCount, end: seed % columnCount + 1 }]
        : []

      for (const eventSlicing of [false, true]) {
        const options: SliceOptions = {
          orderStrict: true,
          eventSlicing,
          maxSlices: (1 + seed % 3) as 1 | 2 | 3,
          minSliceLength: 1,
        }
        const result = limitDayGridLayout(
          unrestricted,
          {
            levelCoordLimit: maxHeight,
            columnCount,
            initialHiddenSpans,
            coordTax,
          },
          options,
        )
        const label = context(seed, scenario, {
          kind: 'tax-strict',
          maxHeight,
          coordTax,
          initialHiddenSpans,
          options,
        })
        auditMoreLinkResult(scenario, result, initialHiddenSpans, options, label)
        auditTaxedBounds(result, { coordLimit: maxHeight, cost: coordTax }, label)
        auditIntegerColumnGeometry(result, label)
      }
    }
  }, 30_000)
})

describe('Day Grid print projection fuzzing', () => {
  it('keeps band slots aligned, slices uniquely placed, and counts coherent', () => {
    for (let seed = 1; seed <= 400; seed++) {
      const random = createRandom(seed)
      const count = 4 + Math.floor(random() * 20)
      const segs = stampEventOrder(
        Array.from({ length: count }, (_, index) => {
          const start = Math.floor(random() * DAY_GRID_COLUMN_COUNT)
          return daySeg(
            `${seed}:p-${index}`,
            start,
            Math.min(DAY_GRID_COLUMN_COUNT, start + 1 + Math.floor(random() * 5)),
          )
        }),
      )
      const options: SliceOptions = {
        orderStrict: seed % 2 === 0,
        eventSlicing: seed % 3 !== 0,
        maxSlices: (1 + seed % 3) as 1 | 2 | 3,
        minSliceLength: 1,
      }
      const printMaxLevels = 1 + seed % 4
      const plan = planDomCandidatesByMaxLevel(
        segs,
        printMaxLevels,
        options,
      )
      const moreLinkCounts = countHiddenSpansByColumn(
        plan.hiddenSlices,
        DAY_GRID_COLUMN_COUNT,
      )
      // Sparse measurements are the print contract: only even-indexed
      // segs report a height, the rest fall back.
      const thicknesses = new Map(
        segs
          .filter((_, index) => index % 2 === 0)
          .map((seg) => [seg.key, 10 + Math.floor(random() * 30)]),
      )
      const eventBands = buildPrintEventBands(plan.levels, thicknesses)
      const label = context(seed, { segs, thicknesses }, {
        kind: 'print',
        printMaxLevels,
        options,
      })

      for (const placement of plan.visiblePlacements) {
        invariant(
          placement.levelIndex < printMaxLevels,
          `${placement.sourceSeg.key} exceeds printMaxLevels`,
          label,
        )
      }

      // Each nonempty retained level becomes one positive-height print band.
      invariant(
        eventBands.length === plan.levels.filter((level) => level.length).length &&
          eventBands.every((band) => band.thickness > 0),
        'print bands do not match the retained nonempty levels',
        label,
      )

      // Every visible slice projects exactly once into its level's band.
      const seen = new Set<string>()
      for (const band of eventBands) {
        for (const slice of band.slices) {
          const identity =
            `${slice.sourceSeg.key}:${slice.start}:${slice.end}`
          invariant(!seen.has(identity), `${identity} rendered twice`, label)
          seen.add(identity)
          invariant(
            Number.isInteger(slice.start),
            `${identity} does not begin on a Day Grid column boundary`,
            label,
          )
        }
      }
      invariant(
        seen.size === plan.visiblePlacements.length &&
          plan.visiblePlacements.every((placement) =>
            seen.has(
              `${placement.sourceSeg.key}:${placement.start}:${placement.end}`,
            ),
          ),
        'print DOM does not match visible placements one-to-one',
        label,
      )

      // Print counts come from print's own slice-level hides; audit them
      // against the uncovered-coverage oracle over that same partition.
      const expectedCounts = Array<number>(DAY_GRID_COLUMN_COUNT).fill(0)
      for (const source of segs) {
        for (let column = source.start; column < source.end; column++) {
          const isCovered = plan.visiblePlacements.some((placement) =>
            placement.sourceSeg.key === source.key &&
            placement.start <= column && placement.end >= column + 1,
          )
          if (!isCovered) expectedCounts[column]++
        }
      }
      invariant(
        moreLinkCounts.length === expectedCounts.length &&
          moreLinkCounts.every((count, column) =>
            count === expectedCounts[column],
          ),
        `incorrect print counts: expected ${expectedCounts}, got ${moreLinkCounts}`,
        label,
      )
    }
  })
})

describe('Timeline projection fuzzing', () => {
  it('audits limiting, groups, link skylines, and content height', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const scenario = buildContinuousScenario(seed + 500)
      const orderStrict = seed % 2 === 0
      const timelineLimitOptions: SliceOptions = {
        orderStrict,
        eventSlicing: false,
        maxSlices: 1,
      }
      const maxLevels = 1 + seed % 4
      const extraCount = seed % 4
      const unmountedSlices = Array.from({ length: extraCount }, (_, index) =>
        createWholeSlice({
          ...continuousSeg(`${seed}-extra-${index}`, index * 2, index * 2 + 3),
          // Ranked after every scenario source, as a real producer would.
          orderIndex: scenario.segs.length + index,
        }))
      const label = context(seed, scenario, {
        kind: 'timeline',
        maxLevels,
        extraCount,
        orderStrict,
      })

      const unrestricted = positionSegs(
        scenario.segs,
        scenario.thicknesses,
        orderStrict,
      )
      const limited = limitTimelineLayoutByMaxLevel(
        unrestricted,
        maxLevels,
        unmountedSlices,
        { orderStrict },
      )

      for (const initial of unmountedSlices) {
        invariant(
          limited.hiddenSlices.includes(initial),
          'an initial hidden slice is missing from the combined hidden output',
          label,
        )
      }
      const initialKeys = new Set(
        unmountedSlices.map((slice) => slice.sourceSeg.key),
      )
      auditLimitResult(
        scenario,
        {
          levels: limited.levels,
          visiblePlacements: limited.visiblePlacements,
          hiddenSlices: limited.hiddenSlices.filter((slice) =>
            !initialKeys.has(slice.sourceSeg.key),
          ),
        },
        timelineLimitOptions,
        label,
      )
      auditHiddenSliceGroups(limited.hiddenSlices, limited.moreLinkGroups, label)

      const links = positionTimelineMoreLinks(limited.moreLinkGroups, limited.levels)
      for (const link of links) {
        let expectedTop = 0
        for (const placement of limited.visiblePlacements) {
          if (placement.start < link.end && link.start < placement.end) {
            expectedTop = Math.max(expectedTop, placement.levelEndCoord)
          }
        }
        invariant(
          Math.abs(link.levelCoord - expectedTop) <= GEOMETRY_TOLERANCE,
          `link ${link.key} is not flush against the visible skyline`,
          label,
        )
      }

      const moreLinkHeights = new Map(
        links
          .filter((_, index) => index % 2 === 0)
          .map((link) => [link.key, 10 + seed % 12]),
      )
      const contentHeight = calculateTimelineContentHeight(
        limited.visiblePlacements,
        links,
        moreLinkHeights,
        4,
      )
      let expectedHeight = 0
      for (const placement of limited.visiblePlacements) {
        expectedHeight = Math.max(expectedHeight, placement.levelEndCoord)
      }
      for (const link of links) {
        expectedHeight = Math.max(
          expectedHeight,
          link.levelCoord + (moreLinkHeights.get(link.key) ?? 4),
        )
      }
      invariant(
        Math.abs(contentHeight - expectedHeight) <= GEOMETRY_TOLERANCE,
        'content height disagrees with independent recomputation',
        label,
      )
    }
  })

})

describe('TimeGrid projection fuzzing', () => {
  it('audits pressure rectangles and hidden groups across random columns', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const random = createRandom(seed + 900)
      const segCount = 3 + Math.floor(random() * 23)
      const axisHeight = 300 + Math.floor(random() * 600)
      const segs = stampEventOrder(
        Array.from({ length: segCount }, (_, index) => {
          const start = Math.floor(random() * 900)
          const length = 20 + Math.floor(random() * 300)
          return continuousSeg(`${seed}:tg-${index}`, start, Math.min(
            axisHeight,
            start + length,
          ))
        }).filter((seg) => seg.end > seg.start),
      )
      const options = {
        orderStrict: random() < 0.5,
      }
      const maxLevels = 1 + Math.floor(random() * 5)
      const label = JSON.stringify({ seed, axisHeight, maxLevels, options })

      const column = layoutTimeGridColumnByMaxLevel(
        segs,
        maxLevels,
        options,
      )
      auditTimeGridColumn(column, segs, maxLevels, options, label)
    }
  })


})

describe('degenerate and hostile inputs', () => {
  const RELAXED: SliceOptions = {
    orderStrict: false,
    eventSlicing: true,
    maxSlices: 3,
  }

  it('handles empty input everywhere', () => {
    const empty = positionSegs<TestEvent>([], new Map(), true)
    expect(empty.placements).toHaveLength(0)
    expect(limitLayoutByMaxLevel(empty, 0, RELAXED).visiblePlacements).toHaveLength(0)
    const taxed = limitDayGridLayout(
      empty,
      {
        levelCoordLimit: 0,
        columnCount: DAY_GRID_COLUMN_COUNT,
        initialHiddenSpans: [],
        coordTax: 5,
      },
      RELAXED,
    )
    expect(taxed.visiblePlacements).toHaveLength(0)
    expect(taxed.moreLinkCounts).toEqual(Array(DAY_GRID_COLUMN_COUNT).fill(0))
  })

  it('terminates coherently on epsilon, zero-thickness, and oversized inputs', () => {
    const segs = stampEventOrder([
      continuousSeg('epsilon', 0, 1e-9),
      continuousSeg('oversized', 0, 3),
      continuousSeg('flat', 1, 2),
      continuousSeg('sliver-neighbor', 2, 2 + 1e-9),
      continuousSeg('normal', 2, 5),
    ])
    const thicknesses = new Map([
      ['epsilon', 10],
      ['oversized', 1000],
      ['flat', 0],
      ['sliver-neighbor', 10],
      ['normal', 12],
    ])
    const sourceKeys = new Set(segs.map((seg) => seg.key))
    const layout = positionSegs(segs, thicknesses, false)
    expect(layout.placements).toHaveLength(segs.length)

    for (const maxLevels of [0, 1, 2]) {
      const limited = limitLayoutByMaxLevel(layout, maxLevels, RELAXED)
      auditSourceAccounting(sourceKeys, limited, `epsilon maxLevels=${maxLevels}`)
      for (const placement of limited.visiblePlacements) {
        expect(placement.levelIndex).toBeLessThan(maxLevels)
      }
    }

    for (const coordLimit of [0, 11, 100]) {
      const limited = limitDayGridLayout(
        layout,
        {
          levelCoordLimit: coordLimit,
          columnCount: 5,
          initialHiddenSpans: [],
          coordTax: coordLimit + 50,
        },
        RELAXED,
      )
      auditSourceAccounting(sourceKeys, limited, `epsilon coordLimit=${coordLimit}`)
      for (const count of limited.moreLinkCounts) {
        expect(count).toBeGreaterThanOrEqual(0)
        expect(count).toBeLessThanOrEqual(segs.length)
      }
    }
  })

  it('hides everything without looping when the level budget is zero', () => {
    const scenario = buildDayGridScenario(11, 20)
    const unrestricted = positionSegs(
      scenario.segs,
      scenario.thicknesses,
      false,
    )
    const result = limitDayGridLayout(
      unrestricted,
      {
        maxLevels: 0,
        columnCount: DAY_GRID_COLUMN_COUNT,
        initialHiddenSpans: [],
        levelTax: 1,
      },
      { orderStrict: false, eventSlicing: true, maxSlices: 3 },
    )
    expect(result.visiblePlacements).toHaveLength(0)
    auditSourceAccounting(
      new Set(scenario.segs.map((seg) => seg.key)),
      result,
      'zero level budget',
    )
  })


})

/* ========================================================================
 * Independent audits (test-only interval arithmetic)
 * ===================================================================== */

function auditLimitResult(
  scenario: Scenario,
  result: LayoutLimitResult<TestEvent>,
  options: SliceOptions,
  label: string,
): void {
  auditLayoutStructure(
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
  scenario: Scenario,
  result: DayGridLimitResult<TestEvent>,
  initialHiddenSpans: readonly { start: number; end: number }[],
  options: SliceOptions,
  label: string,
): void {
  auditLimitResult(scenario, result, options, label)

  const expectedCounts = Array<number>(result.moreLinkCounts.length).fill(0)
  for (const span of initialHiddenSpans) {
    for (const column of intersectingCells(span, expectedCounts.length)) {
      expectedCounts[column]++
    }
  }
  for (const source of scenario.segs) {
    for (const column of intersectingCells(source, expectedCounts.length)) {
      const isCovered = result.visiblePlacements.some((placement) =>
        placement.sourceSeg.key === source.key &&
        placement.start <= column &&
        placement.end >= column + 1,
      )
      if (!isCovered) expectedCounts[column]++
    }
  }
  invariant(
    result.moreLinkCounts.length === expectedCounts.length &&
      result.moreLinkCounts.every((count, column) =>
        count === expectedCounts[column],
      ),
    `incorrect counts: expected ${expectedCounts}, got ${result.moreLinkCounts}`,
    label,
  )
}

function auditLayoutStructure(
  layout: PlacementLayout<TestEvent>,
  orderStrict: boolean,
  label: string,
): void {
  const entries = layout.levels.flat()
  invariant(
    entries.length === layout.placements.length &&
      new Set(entries).size === entries.length,
    'level entries do not correspond one-to-one with placements',
    label,
  )
  const entrySet = new Set(entries)
  for (const placement of layout.placements) {
    invariant(
      entrySet.has(placement),
      `placement ${placement.sourceSeg.key} is absent from its level`,
      label,
    )
    invariant(
      Number.isInteger(placement.levelIndex) && placement.levelIndex >= 0 &&
        Number.isFinite(placement.levelCoord) && placement.levelCoord >= 0 &&
        Number.isFinite(placement.thickness) && placement.thickness > 0 &&
        Number.isFinite(placement.levelEndCoord),
      `placement ${placement.sourceSeg.key} has invalid numeric geometry`,
      label,
    )
  }

  layout.levels.forEach((level, levelIndex) => {
    for (let index = 0; index < level.length; index++) {
      const entry = level[index]
      invariant(
        entry.levelIndex === levelIndex,
        `${entry.sourceSeg.key} records level ${entry.levelIndex} but sits in ${levelIndex}`,
        label,
      )
      if (index > 0) {
        const previous = level[index - 1]
        invariant(
          previous.start <= entry.start &&
            previous.end <= entry.start + GEOMETRY_TOLERANCE,
          `level ${levelIndex} is unsorted or laterally overlapping`,
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
      if (!(left.start < right.end && right.start < left.end)) continue
      invariant(
        !(left.levelCoord < right.levelEndCoord - GEOMETRY_TOLERANCE &&
          right.levelCoord < left.levelEndCoord - GEOMETRY_TOLERANCE),
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
        `${source.key} produced empty or out-of-range geometry`,
        label,
      )
      invariant(
        Math.abs(piece.start - cursor) <= GEOMETRY_TOLERANCE,
        `${source.key} has a gap or overlap at ${cursor}`,
        label,
      )
      invariant(
        piece.sourceSeg.orderIndex === source.orderIndex,
        `${source.key} lost its order index`,
        label,
      )
      invariant(
        piece.isStart === (source.isStart && piece.start === source.start) &&
          piece.isEnd === (source.isEnd && piece.end === source.end),
        `${source.key} has incorrect isStart/isEnd flags`,
        label,
      )
      cursor = piece.end
    }
    invariant(
      Math.abs(cursor - source.end) <= GEOMETRY_TOLERANCE,
      `${source.key} does not cover its complete span`,
      label,
    )

    for (const placement of visiblePlacements) {
      if (placement.sourceSeg.key !== source.key) continue
      invariant(
        placement.thickness === thicknesses.get(source.key) &&
          Math.abs(
            placement.levelEndCoord -
                (placement.levelCoord + placement.thickness),
          ) <= GEOMETRY_TOLERANCE,
        `${source.key} has inconsistent thickness geometry`,
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
    ...result.visiblePlacements.map((piece) => piece.sourceSeg.key),
    ...result.hiddenSlices.map((piece) => piece.sourceSeg.key),
  ])
  for (const sourceKey of sourceKeys) {
    const visiblePlacements = result.visiblePlacements.filter((piece) =>
      piece.sourceSeg.key === sourceKey,
    )
    if (!options.eventSlicing) {
      invariant(
        visiblePlacements.length <= 1 &&
          visiblePlacements.every((piece) =>
            piece.start === piece.sourceSeg.start && piece.end === piece.sourceSeg.end,
          ),
        `${sourceKey} was sliced while slicing was disabled`,
        label,
      )
      continue
    }
    invariant(
      visiblePlacements.length <= options.maxSlices,
      `${sourceKey} exceeds maxSlices=${options.maxSlices}`,
      label,
    )
    invariant(
      new Set(visiblePlacements.map((piece) => `${piece.levelIndex}:${piece.levelCoord}`))
        .size <= 1,
      `${sourceKey} slices do not share one position`,
      label,
    )
    for (const piece of visiblePlacements) {
      const isPartial = piece.start !== piece.sourceSeg.start ||
        piece.end !== piece.sourceSeg.end
      invariant(
        !isPartial ||
          piece.end - piece.start >=
            (options.minSliceLength ?? 0) - GEOMETRY_TOLERANCE,
        `${sourceKey} violates minSliceLength`,
        label,
      )
    }
  }
}

interface TaxedBounds {
  maxLevels?: number
  levelCost?: number
  coordLimit?: number
  cost?: number
}

function auditTaxedBounds(
  result: DayGridLimitResult<TestEvent>,
  bounds: TaxedBounds,
  label: string,
): void {
  for (const placement of result.visiblePlacements) {
    for (
      const column of intersectingCells(placement, result.moreLinkCounts.length)
    ) {
      const isActive = result.moreLinkCounts[column] > 0
      if (bounds.maxLevels !== undefined) {
        const levelBound = Math.max(
          0,
          bounds.maxLevels - (isActive ? bounds.levelCost ?? 0 : 0),
        )
        invariant(
          placement.levelIndex < levelBound,
          `${placement.sourceSeg.key} occupies a reserved level in column ${column}`,
          label,
        )
      }
      if (bounds.coordLimit !== undefined) {
        const coordBound = Math.max(
          0,
          bounds.coordLimit - (isActive ? bounds.cost ?? 0 : 0),
        )
        invariant(
          placement.levelEndCoord <= coordBound + GEOMETRY_TOLERANCE,
          `${placement.sourceSeg.key} occupies reserved pixels in column ${column}`,
          label,
        )
      }
    }
  }
}

/** Day Grid render integrations index buckets/cells by integer slice starts. */
function auditIntegerColumnGeometry(
  result: DayGridLimitResult<TestEvent>,
  label: string,
): void {
  const sourceKeysByStartColumn = new Set<string>()
  for (const piece of [...result.visiblePlacements, ...result.hiddenSlices]) {
    invariant(
      Number.isInteger(piece.start) && Number.isInteger(piece.end),
      `${piece.sourceSeg.key} produced a non-integer Day Grid cut [${piece.start}, ${piece.end}]`,
      label,
    )
  }
  for (const placement of result.visiblePlacements) {
    const bucketIdentity = JSON.stringify([
      placement.start,
      placement.sourceSeg.key,
    ])
    invariant(
      !sourceKeysByStartColumn.has(bucketIdentity),
      `${placement.sourceSeg.key} has multiple visible slices starting in column ${placement.start}`,
      label,
    )
    sourceKeysByStartColumn.add(bucketIdentity)
  }
}

function auditHiddenSliceGroups(
  hiddenSlices: readonly Slice<TestEvent>[],
  groups: readonly {
    start: number
    end: number
    count: number
    hiddenSlices: readonly Slice<TestEvent>[]
  }[],
  label: string,
): void {
  const expected: {
    start: number
    end: number
    slices: Slice<TestEvent>[]
  }[] = []
  const sorted = [...hiddenSlices].sort((left, right) =>
    left.start - right.start ||
    left.end - right.end ||
    left.sourceSeg.orderIndex - right.sourceSeg.orderIndex,
  )
  for (const slice of sorted) {
    const last = expected[expected.length - 1]
    if (last && slice.start < last.end) {
      last.end = Math.max(last.end, slice.end)
      last.slices.push(slice)
    } else {
      expected.push({ start: slice.start, end: slice.end, slices: [slice] })
    }
  }

  invariant(
    groups.length === expected.length,
    `expected ${expected.length} hidden groups, got ${groups.length}`,
    label,
  )
  groups.forEach((group, index) => {
    const match = expected[index]
    invariant(
      group.start === match.start && group.end === match.end,
      `group ${index} spans [${group.start}, ${group.end}] instead of [${match.start}, ${match.end}]`,
      label,
    )
    invariant(
      group.count === new Set(match.slices.map((slice) => slice.sourceSeg.key)).size,
      `group ${index} count disagrees with its distinct sources`,
      label,
    )
    invariant(
      group.hiddenSlices.length === match.slices.length &&
        group.hiddenSlices.every((slice) => match.slices.includes(slice)),
      `group ${index} does not contain exactly its member slices`,
      label,
    )
    if (index > 0) {
      invariant(
        groups[index - 1].end <= group.start,
        'hidden groups overlap laterally',
        label,
      )
    }
  })
}


function auditTimeGridColumn(
  column: TimeGridColumnLayout<TestEvent>,
  segs: readonly SourceSeg<TestEvent>[],
  maxLevels: number,
  options: { orderStrict: boolean },
  label: string,
): void {
  auditLayoutStructure(
    { levels: column.limited.levels, placements: column.limited.visiblePlacements },
    options.orderStrict,
    label,
  )
  auditSourcePartition(
    segs,
    column.limited.visiblePlacements,
    column.limited.hiddenSlices,
    new Map(segs.map((seg) => [seg.key, 1])),
    label,
  )
  auditHiddenSliceGroups(column.limited.hiddenSlices, column.moreLinkGroups, label)

  const events = column.domOrderedPlacements
  invariant(
    events.length === column.limited.visiblePlacements.length &&
      column.limited.visiblePlacements.every((placement) => events.some((event) =>
        event.sourceSeg.key === placement.sourceSeg.key,
      )),
    'DOM events do not correspond to visible placements',
    label,
  )
  const sourceByKey = new Map(segs.map((seg) => [seg.key, seg]))
  invariant(
    column.domOrderedPlacements.every((event) =>
      sourceByKey.get(event.sourceSeg.key) === event.sourceSeg,
    ),
    'DOM events do not retain their original sources',
    label,
  )
  const eventOrderIndexByKey = new Map(
    segs.map((seg, eventOrderIndex) => [seg.key, eventOrderIndex]),
  )
  for (let index = 1; index < column.domOrderedPlacements.length; index++) {
    const previous = column.domOrderedPlacements[index - 1]
    const current = column.domOrderedPlacements[index]
    invariant(
      previous.start < current.start ||
        previous.start === current.start &&
          eventOrderIndexByKey.get(previous.sourceSeg.key)! <
            eventOrderIndexByKey.get(current.sourceSeg.key)!,
      'DOM events are not in temporal-start/event-order',
      label,
    )
  }

  for (const event of events) {
    invariant(
      event.levelIndex < maxLevels,
      `${event.sourceSeg.key} exceeds maxLevels=${maxLevels}`,
      label,
    )
    invariant(
      event.levelCoord >= 0 && event.levelCoord < 1 &&
        event.thickness > 0 &&
        event.levelEndCoord <= 1 + GEOMETRY_TOLERANCE &&
        event.backwardDepth >= 0 && event.forwardDepth >= 0,
      `${event.sourceSeg.key} has an invalid level-axis rectangle`,
      label,
    )
  }

  for (let leftIndex = 0; leftIndex < events.length; leftIndex++) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < events.length;
      rightIndex++
    ) {
      const left = events[leftIndex]
      const right = events[rightIndex]
      if (!(left.start < right.end && right.start < left.end)) continue
      invariant(
        left.levelIndex !== right.levelIndex,
        `${left.sourceSeg.key} and ${right.sourceSeg.key} time-collide in one level`,
        label,
      )
      const shallow = left.levelIndex < right.levelIndex ? left : right
      const deep = shallow === left ? right : left
      invariant(
        deep.levelCoord >= shallow.levelEndCoord - GEOMETRY_TOLERANCE,
        `${deep.sourceSeg.key} does not clear shallower collider ${shallow.sourceSeg.key}`,
        label,
      )
      invariant(
        deep.backwardDepth >= shallow.backwardDepth + 1 &&
          shallow.forwardDepth >= deep.forwardDepth + 1,
        `${deep.sourceSeg.key} has inconsistent collision depths against ${shallow.sourceSeg.key}`,
        label,
      )
    }
  }
}

function auditSourceAccounting(
  sourceKeys: ReadonlySet<string>,
  result: LayoutLimitResult<TestEvent>,
  label: string,
): void {
  const resultKeys = new Set([
    ...result.visiblePlacements.map((piece) => piece.sourceSeg.key),
    ...result.hiddenSlices.map((piece) => piece.sourceSeg.key),
  ])
  invariant(
    resultKeys.size === sourceKeys.size &&
      [...sourceKeys].every((key) => resultKeys.has(key)),
    'visible plus hidden do not account for every source',
    label,
  )
}

/* ========================================================================
 * Generators and projections
 * ===================================================================== */

/**
 * Fractional Timeline-style geometry snapped to multiples of 1/64 so that all
 * engine arithmetic on the coordinates is exact in binary floating point.
 */
function buildContinuousScenario(seed: number): Scenario {
  const random = createRandom(seed)
  const segCount = 6 + Math.floor(random() * 20)
  const segs = stampEventOrder(
    Array.from({ length: segCount }, (_, index) => {
      const start = Math.floor(random() * 640) / 64
      const length = (2 + Math.floor(random() * 300)) / 64
      return continuousSeg(
        `${seed}:c-${index}`,
        start,
        Math.min(CONTINUOUS_LATERAL_CELLS, start + length),
      )
    }).filter((seg) => seg.end > seg.start),
  )
  const thicknesses = new Map(segs.map((seg) => [
    seg.key,
    (8 + Math.floor(random() * 88)) / 4,
  ]))
  return { segs, thicknesses }
}

function buildDayGridScenario(seed: number, segCount: number): Scenario {
  const random = createRandom(seed)
  const segs = stampEventOrder(
    Array.from({ length: segCount }, (_, index) => {
      const start = Math.floor(random() * DAY_GRID_COLUMN_COUNT)
      const end = Math.min(
        DAY_GRID_COLUMN_COUNT,
        start + 1 + Math.floor(random() * 4),
      )
      return daySeg(`${seed}:d-${index}`, start, end)
    }),
  )
  const thicknesses = new Map(segs.map((seg) => [
    seg.key,
    5 + Math.floor(random() * 17),
  ]))
  return { segs, thicknesses }
}

function continuousSeg(
  id: string,
  start: number,
  end: number,
): UnorderedSeg<TestEvent> {
  return { key: id, meta: { id }, start, end, isStart: true, isEnd: true }
}

function daySeg(
  id: string,
  start: number,
  end: number,
): UnorderedSeg<TestEvent> {
  return continuousSeg(id, start, end)
}



function intersectingCells(
  span: { start: number; end: number },
  cellCount: number,
): number[] {
  const start = Math.min(cellCount, Math.max(0, Math.floor(span.start)))
  const end = Math.min(cellCount, Math.max(0, Math.ceil(span.end)))
  return Array.from({ length: end - start }, (_, index) => start + index)
}

function createRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0
    return state / 0x1_0000_0000
  }
}

function context(seed: number, scenario: Scenario, detail: unknown): string {
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
