import { describe, expect, it } from 'vitest'
import { getEventPartKey } from '../../src/daygrid/TableSeg'
import { RefMap } from '../../src/util/RefMap'
import {
  type DayGridEventSeg,
  type DayGridPlacementColumn,
  buildDayGridLevelPlacements,
  buildDayGridPixelPlacements,
  buildDayGridSegSources,
  computeDayGridDomCandidateMaxLevels,
  computeDayGridMoreLinkLevelTax,
  createDayGridPlacementOwnerState,
  observeDayGridCanvasHeight,
  observeDayGridSliceHeight,
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
        eventKey: 'first',
        start: 1,
        end: 3,
        isStart: true,
        isEnd: false,
        orderIndex: 0,
      },
      {
        key: 'second:0',
        eventKey: 'second',
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

})

describe('DayGridRows placement owner state', () => {
  it('aggregates extrema across rows and grows the candidate frontier monotonically', () => {
    const initial = createDayGridPlacementOwnerState()
    const afterTallEvent = observeDayGridSliceHeight(initial, 30)
    const afterTallArea = observeDayGridCanvasHeight(afterTallEvent, 220)
    const afterShortEvent = observeDayGridSliceHeight(afterTallArea, 10)

    expect(initial).toEqual({
      smallestSliceHeight: null,
      largestSliceHeight: null,
      largestCanvasHeight: null,
      neededLevelCount: 8,
    })
    expect(afterTallEvent).toMatchObject({
      smallestSliceHeight: 30,
      largestSliceHeight: 30,
      neededLevelCount: 8,
    })
    expect(afterTallArea).toMatchObject({
      largestCanvasHeight: 220,
      neededLevelCount: 8,
    })
    expect(afterShortEvent).toMatchObject({
      smallestSliceHeight: 10,
      largestSliceHeight: 30,
      largestCanvasHeight: 220,
      neededLevelCount: 22,
    })
    expect(observeDayGridSliceHeight(afterShortEvent, 40)).toMatchObject({
      smallestSliceHeight: 10,
      largestSliceHeight: 40,
      neededLevelCount: 22,
    })
    expect(observeDayGridCanvasHeight(afterShortEvent, 100)).toBe(afterShortEvent)
  })

  it('ratchets the owner from RefMap height reports and forgets deletions', () => {
    let owner = observeDayGridCanvasHeight(createDayGridPlacementOwnerState(), 100)
    // The production wiring: a RefMap whose callback ratchets non-null reports.
    const heights = new RefMap<string, number>((height) => {
      if (height != null) {
        owner = observeDayGridSliceHeight(owner, height)
      }
    })
    const ref = heights.createRef('slice')

    ref(0.5)
    expect(heights.current.get('slice')).toBe(0.5)
    expect(owner).toMatchObject({
      smallestSliceHeight: 0.5,
      largestSliceHeight: 0.5,
      neededLevelCount: 200,
    })

    ref(30)
    expect(owner.largestSliceHeight).toBe(30)
    expect(heights.current.get('slice')).toBeLessThanOrEqual(
      owner.largestSliceHeight!,
    )
    ref(null)
    expect(heights.current.has('slice')).toBe(false)
  })

  it('uses explicit numeric caps, the auto frontier, and no cap for unlimited rows', () => {
    expect(computeDayGridDomCandidateMaxLevels(undefined, undefined, 9)).toBe(Infinity)
    expect(computeDayGridDomCandidateMaxLevels(3, 7, 9)).toBe(3)
    expect(computeDayGridDomCandidateMaxLevels(undefined, 4, 9)).toBe(4)
    expect(computeDayGridDomCandidateMaxLevels(true, 4, 9)).toBe(9)
    expect(computeDayGridDomCandidateMaxLevels(3, true, 9)).toBe(9)
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
  it('renders unlimited stacks immediately with exact and provisional coordinates', () => {
    const columns = layoutLevelRow([
      makeSeg('first', 0, 1),
      makeSeg('second', 0, 1),
    ], 1, undefined, undefined, {
      heights: { 'first:0': 12 },
      largestSliceHeight: 25,
    })

    expect(levelItemTops(columns, 0)).toEqual({
      'first:0': 0,
      'second:0': 12,
    })
    expect(columns[0].renderItems.map((item) => item.heightRef)).toEqual([
      'ref:first:0',
      'ref:second:0',
    ])
    expect(columns[0].contentHeight).toBe(37)
    expect(columns[0].hiddenSegs).toEqual([])
  })

  it('mounts partial slices with their own keys, refs, and planning heights', () => {
    const columns = layoutLevelRow([
      makeSeg('blocker', 1, 2),
      makeSeg('wide', 0, 3),
    ], 3, 1, undefined, {
      heights: {
        'wide:0:slice': 12,
        'blocker:1': 18,
      },
      largestSliceHeight: 25,
    })

    expect(levelItemTops(columns, 0)).toEqual({ 'wide:0:slice': 0 })
    expect(levelItemTops(columns, 1)).toEqual({ 'blocker:1': 0 })
    expect(levelItemTops(columns, 2)).toEqual({ 'wide:2:slice': 0 })
    expect(columns[0].renderItems[0].heightRef).toBe('ref:wide:0:slice')
    expect(columns[2].renderItems[0].heightRef).toBe('ref:wide:2:slice')
    expect(columns.map((column) => column.contentHeight)).toEqual([12, 18, 25])
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
    const provisional = layoutPixelRow([
      makeSeg('blocker', 1, 2),
      makeSeg('wide', 0, 3),
    ], 3, {
      canvasHeight: 15,
      heights: {
        'blocker:1': 5,
        'wide:0': 12,
      },
      smallestSliceHeight: 1,
    })

    expect(levelItemTops(provisional.columns, 0)).toEqual({
      'wide:0': undefined,
      'wide:0:slice': 0,
    })
    expect(levelItemTops(provisional.columns, 1)).toEqual({ 'blocker:1': 0 })
    expect(levelItemTops(provisional.columns, 2)).toEqual({ 'wide:2:slice': 0 })
    expect(provisional.columns[0].renderItems.map((item) => item.heightRef))
      .toEqual(['ref:wide:0', 'ref:wide:0:slice'])
    expect(provisional.isSettled).toBe(false)

    const settled = layoutPixelRow([
      makeSeg('blocker', 1, 2),
      makeSeg('wide', 0, 3),
    ], 3, {
      canvasHeight: 15,
      heights: {
        'blocker:1': 5,
        'wide:0:slice': 6,
        'wide:2:slice': 6,
      },
      smallestSliceHeight: 1,
      largestSliceHeight: 12,
    })
    expect(settled.isSettled).toBe(true)
    expect(settled.columns.map((column) => column.contentHeight)).toEqual([6, 5, 6])
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

  it('stops mounting candidates beyond the cross-row DOM frontier', () => {
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
    largestSliceHeight?: number,
  } = {},
): DayGridPlacementColumn<string>[] {
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
      current: new Map(Object.entries(config.heights ?? {})),
      createRef: (key) => `ref:${key}`,
    },
    config.largestSliceHeight ?? EVENT_HEIGHT,
  ).columns
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
    smallestSliceHeight?: number,
    largestSliceHeight?: number,
  } = {},
) {
  const heights = config.heights ?? Object.fromEntries(
    eventOrderedSegs.map((seg) => [getEventPartKey(seg), EVENT_HEIGHT]),
  )
  const measuredHeights = Object.values(heights)

  return buildDayGridPixelPlacements(
    eventOrderedSegs,
    {
      orderStrict: config.orderStrict ?? false,
      eventSlicing: config.eventSlicing ?? true,
      columnCount,
      canvasHeight: config.canvasHeight,
    },
    {
      current: new Map(Object.entries(heights)),
      createRef: (key) => `ref:${key}`,
    },
    () => ({
      neededLevelCount: config.neededLevelCount ?? 8,
      smallestSliceHeight:
        config.smallestSliceHeight ?? Math.min(...measuredHeights),
      largestSliceHeight:
        config.largestSliceHeight ?? Math.max(...measuredHeights),
      largestCanvasHeight: config.canvasHeight,
    }),
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

function segIds(segs: DayGridEventSeg[]): string[] {
  return segs.map(segId)
}

function segId(seg: DayGridEventSeg): string {
  return seg.eventRange.instance.instanceId
}
