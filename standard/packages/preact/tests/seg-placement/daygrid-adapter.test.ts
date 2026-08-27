import { describe, expect, it } from 'vitest'
import { getEventSliceKey } from '../../src/daygrid/TableSeg'
import { type Slice, getSliceKey } from '../../src/seg-placement/kernel'
import {
  type DayGridEventSeg,
  type DayGridPlacementColumn,
  type DayGridSourceSeg,
  buildDayGridLevelPlacements,
  buildDayGridPixelPlacements,
  buildDayGridSegSources,
  computeDayGridPlanningSliceThickness,
  computeDayGridDomCandidateMaxLevels,
  computeDayGridMoreLinkLevelTax,
  estimateLevelCapacity,
  ratchetDayGridSliceHeightGrowthRate,
  resolveDayGridPlacementMode,
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
    expect(sources[0].eventRange).toBe(first.eventRange)
    expect(sources[1].eventRange).toBe(second.eventRange)
  })
})

describe('DayGrid row-local placement state', () => {
  it('uses explicit numeric caps, the auto frontier, and no cap for unlimited rows', () => {
    expect(computeDayGridDomCandidateMaxLevels(undefined, undefined, 9)).toBe(Infinity)
    expect(computeDayGridDomCandidateMaxLevels(3, 7, 9)).toBe(3)
    expect(computeDayGridDomCandidateMaxLevels(undefined, 4, 9)).toBe(4)
    expect(computeDayGridDomCandidateMaxLevels(true, 4, 9)).toBe(9)
    expect(computeDayGridDomCandidateMaxLevels(3, true, 9)).toBe(9)
  })

  it('estimates the candidate frontier from current canvas and slice heights', () => {
    expect(estimateLevelCapacity(220, 30)).toBe(8)
    expect(estimateLevelCapacity(220, 10)).toBe(22)
  })

  it('learns direct compression growth above the pixel noise floor', () => {
    const source = buildDayGridSegSources([makeSeg('wide', 0, 4)])[0]
    const half = makeSlice(source, 0, 2)
    const quarter = makeSlice(source, 0, 1)

    expect(ratchetDayGridSliceHeightGrowthRate(
      0,
      [half],
      new Map([
        [source.key, 20],
        [getSliceKey(half), 22],
      ]),
    )).toBe(0)

    const learnedRate = ratchetDayGridSliceHeightGrowthRate(
      0,
      [half],
      new Map([
        [source.key, 20],
        [getSliceKey(half), 30],
      ]),
    )
    expect(learnedRate).toBe(0.5)
    expect(computeDayGridPlanningSliceThickness(half, 20, learnedRate)).toBe(30)
    expect(computeDayGridPlanningSliceThickness(quarter, 20, learnedRate)).toBe(50)
    expect(ratchetDayGridSliceHeightGrowthRate(
      learnedRate,
      [half],
      new Map([
        [source.key, 20],
        [getSliceKey(half), 24],
      ]),
    )).toBe(learnedRate)
  })

  it('learns the same rate from inverse-width partials of different widths', () => {
    const source = buildDayGridSegSources([makeSeg('wide', 0, 4)])[0]
    const half = makeSlice(source, 0, 2)
    const quarter = makeSlice(source, 3, 4)

    expect(ratchetDayGridSliceHeightGrowthRate(
      0,
      [half, quarter],
      new Map([
        [source.key, 20],
        [getSliceKey(half), 40],
        [getSliceKey(quarter), 80],
      ]),
    )).toBe(1)
  })
})

describe('DayGrid screen mode routing', () => {
  it('reproduces production option precedence, including boolean over numeric', () => {
    expect(resolveDayGridPlacementMode(undefined, undefined)).toBe('unlimited')
    expect(resolveDayGridPlacementMode(2, undefined)).toBe('maxEvents')
    expect(resolveDayGridPlacementMode(undefined, 2)).toBe('maxEventRows')
    expect(resolveDayGridPlacementMode(2, 3)).toBe('maxEvents')
    expect(resolveDayGridPlacementMode(2, true)).toBe('auto')
    expect(resolveDayGridPlacementMode(true, 2)).toBe('auto')
  })

  it('charges a logical level for a more link only under dayMaxEventRows', () => {
    expect(computeDayGridMoreLinkLevelTax('unlimited')).toBe(0)
    expect(computeDayGridMoreLinkLevelTax('maxEvents')).toBe(0)
    expect(computeDayGridMoreLinkLevelTax('maxEventRows')).toBe(1)
    expect(computeDayGridMoreLinkLevelTax('auto')).toBe(0)
  })
})

describe('DayGrid kernel level placement', () => {
  it('keeps unmeasured unlimited slices mounted but unpositioned', () => {
    const columns = layoutLevelRow([
      makeSeg('first', 0, 1),
      makeSeg('second', 0, 1),
    ], 1, undefined, undefined, {
      heights: { 'first:0': 12 },
    })

    expect(levelItemTops(columns, 0)).toEqual({
      'first:0': 0,
      'second:0': undefined,
    })
    expect(columns[0].renderItems.map((item) => item.heightRef)).toEqual([
      'ref:first:0',
      'ref:second:0',
    ])
    expect(columns[0].contentHeight).toBe(12)
    expect(columns[0].hiddenSegs).toEqual([])
  })

  it('mounts unmeasured partial slices without positioning them', () => {
    const columns = layoutLevelRow([
      makeSeg('blocker', 1, 2),
      makeSeg('wide', 0, 3),
    ], 3, 1, undefined, {
      heights: {
        'wide:0:0:slice': 12,
        'blocker:1': 18,
      },
    })

    expect(levelItemTops(columns, 0)).toEqual({ 'wide:0:0:slice': 0 })
    expect(levelItemTops(columns, 1)).toEqual({ 'blocker:1': 0 })
    expect(levelItemTops(columns, 2)).toEqual({
      'wide:0:2:slice': undefined,
    })
    expect(columns[0].renderItems[0].heightRef).toBe('ref:wide:0:0:slice')
    expect(columns[2].renderItems[0].heightRef).toBe('ref:wide:0:2:slice')
    expect(columns.map((column) => column.contentHeight)).toEqual([12, 18, 0])
  })

  it('projects hidden glob slices to ordered, real-boundary cell segs', () => {
    const columns = layoutLevelRow([
      makeSeg('blocker', 1, 2),
      makeSeg('wide', 0, 3),
      makeSeg('later', 1, 2),
    ], 3, 1)

    expect(columns.map((column) => segIds(column.hiddenSegs))).toEqual([
      [],
      ['wide', 'later'],
      [],
    ])
    expect(segIds(columns[1].segs)).toEqual(['blocker', 'wide', 'later'])
    expect(columns[1].hiddenSegs[0]).toMatchObject({
      start: 1,
      end: 2,
      isStart: false,
      isEnd: false,
    })
  })

  it('charges the more-link occupant only in numeric rows mode', () => {
    const stack = [
      makeSeg('first', 0, 1),
      makeSeg('second', 0, 1),
      makeSeg('third', 0, 1),
    ]
    const eventsColumns = layoutLevelRow(stack, 1, 2)
    const rowsColumns = layoutLevelRow(stack, 1, undefined, 2)

    expect(Object.keys(levelItemTops(eventsColumns, 0))).toEqual([
      'first:0',
      'second:0',
    ])
    expect(Object.keys(levelItemTops(rowsColumns, 0))).toEqual(['first:0'])
    expect(segIds(rowsColumns[0].hiddenSegs)).toEqual(['second', 'third'])
    expect(rowsColumns[0].contentHeight).toBe(EVENT_HEIGHT)
  })
})

describe('DayGrid kernel pixel placement', () => {
  /** Two independent stacks of three, so one column can owe a link alone. */
  const twoStacks = [
    makeSeg('a', 0, 1),
    makeSeg('b', 0, 1),
    makeSeg('c', 0, 1),
    makeSeg('d', 1, 2),
    makeSeg('e', 1, 2),
  ]

  it('keeps unmeasured DOM candidates pending instead of excluding them', () => {
    const layout = layoutPixelRow([
      makeSeg('first', 0, 1),
      makeSeg('second', 0, 1),
    ], 1, {
      canvasHeight: 10,
      heights: {},
    })

    expect(levelItemTops(layout.columns, 0)).toEqual({
      'first:0': undefined,
      'second:0': undefined,
    })
    expect(layout.columns[0].renderItems.map((item) => item.heightRef)).toEqual([
      'ref:first:0',
      'ref:second:0',
    ])
    expect(layout.columns[0].hiddenSegs).toEqual([])
    expect(layout.columns[0].contentHeight).toBe(0)
    expect(layout.isSettled).toBe(false)
  })

  it('defers partial donor planning until the more-link probe has measured', () => {
    const layout = layoutPixelRow([
      makeSeg('blocker', 1, 2),
      makeSeg('wide', 0, 3),
    ], 3, {
      canvasHeight: 15,
      heights: {
        'blocker:1': 5,
        'wide:0': 12,
      },
      hasMeasuredMoreLink: false,
    })

    expect(layout.columns.flatMap((column) =>
      column.renderItems.map((item) => item.key),
    )).toEqual(['wide:0', 'blocker:1'])
    expect(layout.isSettled).toBe(true)
  })

  it('shows every mounted candidate before the event area has measured', () => {
    const layout = layoutPixelRow(twoStacks, 2)
    const { columns } = layout

    expect(levelItemTops(columns, 0)).toEqual({
      'a:0': 0,
      'b:0': EVENT_HEIGHT,
      'c:0': EVENT_HEIGHT * 2,
    })
    expect(columns.every((column) => !column.hiddenSegs.length)).toBe(true)
    expect(layout.isSettled).toBe(true)
  })

  it('emits a hidden whole donor and self-measuring partials after bounded exclusion', () => {
    const awaitingPartials = layoutPixelRow([
      makeSeg('blocker', 1, 2),
      makeSeg('wide', 0, 3),
    ], 3, {
      canvasHeight: 15,
      heights: {
        'blocker:1': 5,
        'wide:0': 12,
      },
      moreLinkHeight: 1,
    })

    expect(levelItemTops(awaitingPartials.columns, 0)).toEqual({
      'wide:0': undefined,
      'wide:0:0:slice': undefined,
    })
    expect(levelItemTops(awaitingPartials.columns, 1)).toEqual({ 'blocker:1': 0 })
    expect(levelItemTops(awaitingPartials.columns, 2)).toEqual({
      'wide:0:2:slice': undefined,
    })
    expect(awaitingPartials.columns[0].renderItems.map((item) => item.heightRef))
      .toEqual(['ref:wide:0', 'ref:wide:0:0:slice'])
    expect(awaitingPartials.isSettled).toBe(false)

    const settled = layoutPixelRow([
      makeSeg('blocker', 1, 2),
      makeSeg('wide', 0, 3),
    ], 3, {
      canvasHeight: 15,
      heights: {
        'blocker:1': 5,
        'wide:0': 12,
        'wide:0:0:slice': 6,
        'wide:0:2:slice': 6,
      },
      moreLinkHeight: 1,
    })
    expect(settled.isSettled).toBe(true)
    expect(settled.columns.map((column) => column.contentHeight)).toEqual([6, 5, 6])
  })

  it('keeps a displaced whole source mounted as the measurement donor for its partials', () => {
    const layout = layoutPixelRow([
      makeSeg('blocker', 1, 2),
      makeSeg('wide', 0, 3),
    ], 3, {
      canvasHeight: 15,
      heights: {
        'blocker:1': 5,
        'wide:0': 12,
        'wide:0:0:slice': 6,
        'wide:0:2:slice': 6,
      },
      moreLinkHeight: 1,
    })

    expect(layout.columns[0].renderItems).toEqual(expect.arrayContaining([
      expect.objectContaining({
        key: 'wide:0',
        style: { visibility: 'hidden', top: undefined },
        heightRef: 'ref:wide:0',
      }),
      expect.objectContaining({
        key: 'wide:0:0:slice',
        style: { visibility: '', top: 0 },
      }),
    ]))
    expect(layout.columns[2].renderItems).toEqual(expect.arrayContaining([
      expect.objectContaining({
        key: 'wide:0:2:slice',
        style: { visibility: '', top: 0 },
      }),
    ]))
  })

  it('keeps partial donor selection stable after its measurements disappear', () => {
    const segs = [
      makeSeg('blocker', 1, 2),
      makeSeg('wide', 0, 3),
    ]
    const withPartialsMeasured = layoutPixelRow(segs, 3, {
      canvasHeight: 10,
      heights: {
        'blocker:1': 5,
        'wide:0': 6,
        'wide:0:0:slice': 12,
        'wide:0:2:slice': 12,
      },
      moreLinkHeight: 1,
      sliceHeightGrowthRate: 0.5,
    })
    const afterPartialsUnmount = layoutPixelRow(segs, 3, {
      canvasHeight: 10,
      heights: {
        'blocker:1': 5,
        'wide:0': 6,
      },
      moreLinkHeight: 1,
      sliceHeightGrowthRate: 0.5,
    })

    const renderKeys = (layout: ReturnType<typeof layoutPixelRow>) =>
      layout.columns.flatMap((column) =>
        column.renderItems.map((item) => item.key),
      )

    expect(renderKeys(afterPartialsUnmount)).toEqual(renderKeys(withPartialsMeasured))
    expect(renderKeys(afterPartialsUnmount)).not.toContain('wide:0:0:slice')
    expect(renderKeys(afterPartialsUnmount)).not.toContain('wide:0:2:slice')
  })

  it('keeps bounded exclusions as donors while later wholes can place', () => {
    const layout = layoutPixelRow([
      makeSeg('too-tall', 0, 1),
      makeSeg('later', 1, 2),
    ], 2, {
      canvasHeight: 10,
      heights: { 'too-tall:0': 12, 'later:1': 5 },
    })

    expect(levelItemTops(layout.columns, 0)).toEqual({
      'too-tall:0': undefined,
    })
    expect(levelItemTops(layout.columns, 1)).toEqual({ 'later:1': 0 })
    expect(segIds(layout.columns[0].hiddenSegs)).toEqual(['too-tall'])
    expect(layout.columns.map((column) => column.contentHeight)).toEqual([0, 5])
  })

  it('projects occupant consumption into donors, hidden segs, and content height', () => {
    const layout = layoutPixelRow([
      makeSeg('a', 0, 1),
      makeSeg('b', 0, 1),
      makeSeg('c', 0, 1),
      makeSeg('d', 0, 1),
    ], 1, { canvasHeight: 30 })

    expect(levelItemTops(layout.columns, 0)).toEqual({
      'a:0': 0,
      'b:0': 10,
      'c:0': undefined,
      'd:0': undefined,
    })
    expect(segIds(layout.columns[0].hiddenSegs)).toEqual(['c', 'd'])
    expect(layout.columns[0].contentHeight).toBe(20)
  })

  it('stops mounting candidates beyond the row-local DOM frontier', () => {
    const { columns } = layoutPixelRow(twoStacks, 2, { neededLevelCount: 2 })

    // The third level never mounts, yet both columns still list their rejected
    // source, because the popover unions unmounted sources with measured hides.
    expect(levelItemTops(columns, 0)).toEqual({ 'a:0': 0, 'b:0': EVENT_HEIGHT })
    expect(segIds(columns[0].hiddenSegs)).toEqual(['c'])
    expect(segIds(columns[0].segs)).toEqual(['a', 'b', 'c'])
  })
})

const EVENT_HEIGHT = 10

function layoutLevelRow(
  eventOrderedSegs: DayGridEventSeg[],
  columnCount: number,
  dayMaxEvents?: number,
  dayMaxEventRows?: number,
  config: {
    orderStrict?: boolean,
    eventSlicing?: boolean,
    heights?: Record<string, number>,
  } = {},
): DayGridPlacementColumn<string>[] {
  const heights = config.heights ?? buildAllSliceHeights(eventOrderedSegs)
  return buildDayGridLevelPlacements(
    eventOrderedSegs,
    {
      dayMaxEvents,
      dayMaxEventRows,
      orderStrict: config.orderStrict ?? false,
      eventSlicing: config.eventSlicing ?? true,
      columnCount,
    },
    {
      current: new Map(Object.entries(heights)),
      createRef: (key) => `ref:${key}`,
    },
  ).columns
}

function buildAllSliceHeights(
  segs: readonly DayGridEventSeg[],
): Record<string, number> {
  const heights: Record<string, number> = {}
  for (const seg of segs) {
    const key = getEventSliceKey(seg)
    heights[key] = EVENT_HEIGHT
    for (let start = seg.start; start < seg.end; start += 1) {
      heights[`${key}:${start}:slice`] = EVENT_HEIGHT
    }
  }
  return heights
}

function layoutPixelRow(
  eventOrderedSegs: DayGridEventSeg[],
  columnCount: number,
  config: {
    orderStrict?: boolean,
    eventSlicing?: boolean,
    heights?: Record<string, number>,
    canvasHeight?: number,
    neededLevelCount?: number,
    moreLinkHeight?: number,
    sliceHeightGrowthRate?: number,
    hasMeasuredMoreLink?: boolean,
  } = {},
) {
  const heights = config.heights ?? Object.fromEntries(
    eventOrderedSegs.map((seg) => [getEventSliceKey(seg), EVENT_HEIGHT]),
  )

  return buildDayGridPixelPlacements(
    eventOrderedSegs,
    {
      orderStrict: config.orderStrict ?? false,
      eventSlicing: config.eventSlicing ?? true,
      columnCount,
      canvasHeight: config.canvasHeight,
      moreLinkHeight: config.hasMeasuredMoreLink === false
        ? undefined
        : config.moreLinkHeight ?? EVENT_HEIGHT,
      neededLevelCount: config.neededLevelCount ?? 8,
      sliceHeightGrowthRate: config.sliceHeightGrowthRate ?? 0,
    },
    {
      current: new Map(Object.entries(heights)),
      createRef: (key) => `ref:${key}`,
    },
  )
}

function levelItemTops(
  columns: DayGridPlacementColumn<string>[],
  column: number,
): Record<string, number | undefined> {
  return Object.fromEntries(
    columns[column].renderItems.map((item) => [item.key, item.style.top]),
  )
}

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

function makeSlice(
  sourceSeg: DayGridSourceSeg,
  start: number,
  end: number,
): Slice<DayGridSourceSeg> {
  return {
    sourceSeg,
    start,
    end,
    isStart: sourceSeg.isStart && start === sourceSeg.start,
    isEnd: sourceSeg.isEnd && end === sourceSeg.end,
  }
}

function segIds(segs: DayGridEventSeg[]): string[] {
  return segs.map(segId)
}

function segId(seg: DayGridEventSeg): string {
  return seg.eventRange.instance.instanceId
}
